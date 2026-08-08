// Tests for Spotify dev-mode allowlist detection (FORGE-004). The Spotify app
// is in DEV MODE: only allowlisted users may call the Web API. For everyone
// else, OAuth SUCCEEDS and then the first API call returns
// 403 "User not registered in the Developer Dashboard". These tests cover the
// pure detector and the service's state handling around it.
//
// RN-coupled imports (expo-auth-session, expo-web-browser, AsyncStorage) are
// mocked; the logic under test is plain fetch + state.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import SpotifyService, { isDevModeRejection } from '../SpotifyService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => {}),
    removeItem: jest.fn(async () => {}),
  },
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'com.strdr.app://spotify-auth'),
  ResponseType: { Code: 'code' },
  AuthRequest: jest.fn(),
}));

const DEV_MODE_MESSAGE = 'User not registered in the Developer Dashboard';

const jsonError = (status, message) =>
  JSON.stringify({ error: { status, message } });

// Minimal fetch Response stand-in. apiRequest uses .status, .text(), .json().
const mockResponse = ({ status = 200, body = '{}' } = {}) => ({
  status,
  text: async () => body,
  json: async () => JSON.parse(body),
});

beforeEach(() => {
  // SpotifyService is a singleton; reset its state between tests.
  SpotifyService.accessToken = 'token';
  SpotifyService.refreshToken = null;
  SpotifyService.tokenExpiry = Date.now() + 60 * 60 * 1000;
  SpotifyService.userProfile = null;
  SpotifyService.notAllowlisted = false;
  global.fetch = jest.fn();
  jest.clearAllMocks();
});

describe('isDevModeRejection (pure)', () => {
  test('detects Spotify JSON error shape', () => {
    expect(
      isDevModeRejection(403, { error: { status: 403, message: DEV_MODE_MESSAGE } })
    ).toBe(true);
  });

  test('detects plain-text body', () => {
    expect(isDevModeRejection(403, `${DEV_MODE_MESSAGE}.`)).toBe(true);
  });

  test('is case-insensitive', () => {
    expect(
      isDevModeRejection(403, 'user NOT REGISTERED in the developer dashboard')
    ).toBe(true);
  });

  test('rejects other 403 messages (e.g. scope errors)', () => {
    expect(
      isDevModeRejection(403, { error: { status: 403, message: 'Insufficient client scope' } })
    ).toBe(false);
  });

  test('rejects non-403 statuses even with the message', () => {
    expect(isDevModeRejection(401, DEV_MODE_MESSAGE)).toBe(false);
    expect(isDevModeRejection(200, DEV_MODE_MESSAGE)).toBe(false);
  });

  test('handles null / undefined / malformed bodies', () => {
    expect(isDevModeRejection(403, null)).toBe(false);
    expect(isDevModeRejection(403, undefined)).toBe(false);
    expect(isDevModeRejection(403, {})).toBe(false);
    expect(isDevModeRejection(403, { error: {} })).toBe(false);
  });
});

describe('apiRequest 403 handling', () => {
  test('dev-mode 403 sets notAllowlisted and throws a tagged error', async () => {
    global.fetch.mockResolvedValueOnce(
      mockResponse({ status: 403, body: jsonError(403, DEV_MODE_MESSAGE) })
    );

    await expect(SpotifyService.apiRequest('https://api.spotify.com/v1/me')).rejects.toMatchObject({
      code: 'spotify_not_allowlisted',
    });
    expect(SpotifyService.isNotAllowlisted()).toBe(true);
  });

  test('dev-mode 403 with plain-text body is also detected', async () => {
    global.fetch.mockResolvedValueOnce(
      mockResponse({ status: 403, body: `${DEV_MODE_MESSAGE}.` })
    );

    await expect(SpotifyService.apiRequest('https://api.spotify.com/v1/me')).rejects.toMatchObject({
      code: 'spotify_not_allowlisted',
    });
    expect(SpotifyService.isNotAllowlisted()).toBe(true);
  });

  test('other 403 JSON errors do NOT set the flag and return the body', async () => {
    global.fetch.mockResolvedValueOnce(
      mockResponse({ status: 403, body: jsonError(403, 'Insufficient client scope') })
    );

    const body = await SpotifyService.apiRequest('https://api.spotify.com/v1/me');
    expect(body).toEqual({ error: { status: 403, message: 'Insufficient client scope' } });
    expect(SpotifyService.isNotAllowlisted()).toBe(false);
  });

  test('other 403 plain-text errors throw untagged and do NOT set the flag', async () => {
    global.fetch.mockResolvedValueOnce(
      mockResponse({ status: 403, body: 'Forbidden for some other reason' })
    );

    await expect(SpotifyService.apiRequest('https://api.spotify.com/v1/me')).rejects.toThrow(
      /Forbidden for some other reason/
    );
    const err = await SpotifyService.apiRequest('https://api.spotify.com/v1/me').catch(e => e);
    expect(err.code).toBeUndefined();
    expect(SpotifyService.isNotAllowlisted()).toBe(false);
  });

  test('logout() does NOT clear the flag (session-scoped by design)', async () => {
    SpotifyService.notAllowlisted = true;
    await SpotifyService.logout();
    expect(SpotifyService.isNotAllowlisted()).toBe(true);
  });
});

describe('authenticate() for a non-allowlisted user', () => {
  test('OAuth succeeds, /me 403s -> returns false, flag set, tokens dropped', async () => {
    // OAuth itself succeeds (dev-mode rejection happens at the API, not auth).
    AuthSession.AuthRequest.mockImplementation(function MockAuthRequest() {
      return {
        codeVerifier: 'verifier',
        promptAsync: jest.fn(async () => ({ type: 'success', params: { code: 'auth-code' } })),
      };
    });

    global.fetch.mockImplementation(async (url) => {
      if (String(url).includes('accounts.spotify.com/api/token')) {
        return mockResponse({
          body: JSON.stringify({
            access_token: 'fresh-token',
            refresh_token: 'fresh-refresh',
            expires_in: 3600,
          }),
        });
      }
      // First real API call after OAuth: dev-mode rejection.
      return mockResponse({ status: 403, body: jsonError(403, DEV_MODE_MESSAGE) });
    });

    SpotifyService.accessToken = null;
    SpotifyService.tokenExpiry = null;

    const success = await SpotifyService.authenticate();

    expect(success).toBe(false);
    expect(SpotifyService.isNotAllowlisted()).toBe(true);
    // Tokens dropped so the next launch doesn't look connected-but-broken.
    expect(SpotifyService.accessToken).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@strdr_spotify_tokens');
  });

  test('allowlisted flow unchanged: /me 200 -> returns true, no flag', async () => {
    AuthSession.AuthRequest.mockImplementation(function MockAuthRequest() {
      return {
        codeVerifier: 'verifier',
        promptAsync: jest.fn(async () => ({ type: 'success', params: { code: 'auth-code' } })),
      };
    });

    global.fetch.mockImplementation(async (url) => {
      if (String(url).includes('accounts.spotify.com/api/token')) {
        return mockResponse({
          body: JSON.stringify({
            access_token: 'fresh-token',
            refresh_token: 'fresh-refresh',
            expires_in: 3600,
          }),
        });
      }
      return mockResponse({ body: JSON.stringify({ id: 'andy', display_name: 'Andy' }) });
    });

    SpotifyService.accessToken = null;
    SpotifyService.tokenExpiry = null;

    const success = await SpotifyService.authenticate();

    expect(success).toBe(true);
    expect(SpotifyService.isNotAllowlisted()).toBe(false);
    expect(SpotifyService.userProfile).toEqual({ id: 'andy', display_name: 'Andy' });
  });
});
