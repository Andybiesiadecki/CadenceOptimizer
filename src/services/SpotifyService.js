// Spotify Service
// Handles Spotify Web API integration for music streaming and BPM analysis

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SPOTIFY_CONFIG } from '../config/spotify';

WebBrowser.maybeCompleteAuthSession();

export class SpotifyService {
  
  // Check if Spotify is enabled
  static isEnabled() {
    return SPOTIFY_CONFIG.enabled === true;
  }
  
  // Show disabled message
  static getDisabledMessage() {
    return 'Spotify integration is currently disabled. See SPOTIFY_SETUP.md for setup instructions.';
  }
  constructor() {
    this.isAuthenticated = false;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.userProfile = null;
    this.callbacks = {
      onAuthStateChange: null,
      onTrackAnalysisComplete: null,
      onPlaylistCreated: null,
    };
  }

  /**
   * Initialize Spotify service
   */
  async initialize() {
    try {
      // Load saved tokens
      await this.loadTokens();
      
      // Check if tokens are valid
      if (this.accessToken && this.tokenExpiry) {
        if (Date.now() < this.tokenExpiry) {
          this.isAuthenticated = true;
          await this.loadUserProfile();
        } else if (this.refreshToken) {
          await this.refreshAccessToken();
        }
      }

      console.log('SpotifyService initialized:', this.isAuthenticated ? 'Authenticated' : 'Not authenticated');
    } catch (error) {
      console.error('Failed to initialize SpotifyService:', error);
    }
  }

  /**
   * Authenticate with Spotify
   */
  async authenticate() {
    try {
      console.log('Starting Spotify authentication...');
      
      const request = new AuthSession.AuthRequest({
        clientId: SPOTIFY_CONFIG.clientId,
        scopes: SPOTIFY_CONFIG.scopes,
        usePKCE: true,
        redirectUri: SPOTIFY_CONFIG.redirectUri,
        responseType: AuthSession.ResponseType.Code,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.spotify.com/authorize',
      });

      if (result.type === 'success') {
        const { code } = result.params;
        await this.exchangeCodeForTokens(code, request.codeVerifier);
        return true;
      } else {
        console.log('Spotify authentication cancelled or failed:', result.type);
        return false;
      }
    } catch (error) {
      console.error('Spotify authentication error:', error);
      throw error;
    }
  }
  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code, codeVerifier) {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: SPOTIFY_CONFIG.redirectUri,
          client_id: SPOTIFY_CONFIG.clientId,
          code_verifier: codeVerifier,
        }).toString(),
      });

      const data = await response.json();

      if (response.ok) {
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
        this.isAuthenticated = true;

        await this.saveTokens();
        await this.loadUserProfile();

        if (this.callbacks.onAuthStateChange) {
          this.callbacks.onAuthStateChange(true, this.userProfile);
        }

        console.log('Spotify authentication successful');
      } else {
        throw new Error(data.error_description || 'Token exchange failed');
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: SPOTIFY_CONFIG.clientId,
        }).toString(),
      });

      const data = await response.json();

      if (response.ok) {
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
        
        if (data.refresh_token) {
          this.refreshToken = data.refresh_token;
        }

        await this.saveTokens();
        console.log('Spotify token refreshed successfully');
      } else {
        throw new Error(data.error_description || 'Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      throw error;
    }
  }

  /**
   * Load user profile
   */
  async loadUserProfile() {
    try {
      const response = await this.makeAuthenticatedRequest('https://api.spotify.com/v1/me');
      this.userProfile = response;
      console.log(`Loaded Spotify profile: ${response.display_name}`);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  /**
   * Make authenticated API request
   */
  async makeAuthenticatedRequest(url, options = {}) {
    try {
      // Check if token needs refresh
      if (Date.now() >= this.tokenExpiry && this.refreshToken) {
        await this.refreshAccessToken();
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        if (this.refreshToken) {
          await this.refreshAccessToken();
          return this.makeAuthenticatedRequest(url, options);
        } else {
          throw new Error('Authentication required');
        }
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  /**
   * Get user's playlists
   */
  async getUserPlaylists(limit = 50) {
    try {
      const response = await this.makeAuthenticatedRequest(
        `https://api.spotify.com/v1/me/playlists?limit=${limit}`
      );
      
      return response.items.map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        trackCount: playlist.tracks.total,
        imageUrl: playlist.images[0]?.url,
        isPublic: playlist.public,
        owner: playlist.owner.display_name,
        spotifyUrl: playlist.external_urls.spotify,
      }));
    } catch (error) {
      console.error('Failed to get user playlists:', error);
      return [];
    }
  }

  /**
   * Get playlist tracks
   */
  async getPlaylistTracks(playlistId, limit = 100) {
    try {
      const response = await this.makeAuthenticatedRequest(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}`
      );
      
      return response.items
        .filter(item => item.track && item.track.preview_url)
        .map(item => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists[0]?.name,
          album: item.track.album.name,
          duration: item.track.duration_ms,
          previewUrl: item.track.preview_url,
          spotifyUrl: item.track.external_urls.spotify,
          imageUrl: item.track.album.images[0]?.url,
        }));
    } catch (error) {
      console.error('Failed to get playlist tracks:', error);
      return [];
    }
  }

  /**
   * Get audio features for tracks (includes BPM)
   */
  async getAudioFeatures(trackIds) {
    try {
      const ids = Array.isArray(trackIds) ? trackIds.join(',') : trackIds;
      const response = await this.makeAuthenticatedRequest(
        `https://api.spotify.com/v1/audio-features?ids=${ids}`
      );
      
      return response.audio_features.map(features => ({
        id: features.id,
        bpm: Math.round(features.tempo),
        energy: features.energy,
        danceability: features.danceability,
        valence: features.valence,
        acousticness: features.acousticness,
        instrumentalness: features.instrumentalness,
        key: features.key,
        mode: features.mode,
        timeSignature: features.time_signature,
      }));
    } catch (error) {
      console.error('Failed to get audio features:', error);
      return [];
    }
  }

  /**
   * Search for tracks by BPM and other criteria
   */
  async searchTracksByBpm(targetBpm, options = {}) {
    try {
      const {
        tolerance = 10,
        genre = '',
        limit = 50,
        market = 'US',
      } = options;

      // Build search query
      let query = `tempo:${targetBpm - tolerance}-${targetBpm + tolerance}`;
      if (genre) query += ` genre:${genre}`;

      const response = await this.makeAuthenticatedRequest(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&market=${market}`
      );

      const tracks = response.tracks.items.map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0]?.name,
        album: track.album.name,
        duration: track.duration_ms,
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls.spotify,
        imageUrl: track.album.images[0]?.url,
        popularity: track.popularity,
      }));

      // Get audio features for BPM verification
      if (tracks.length > 0) {
        const trackIds = tracks.map(t => t.id);
        const audioFeatures = await this.getAudioFeatures(trackIds);
        
        // Merge audio features with track data
        return tracks.map(track => {
          const features = audioFeatures.find(f => f.id === track.id);
          return {
            ...track,
            bpm: features?.bpm,
            energy: features?.energy,
            danceability: features?.danceability,
            matchQuality: features?.bpm ? this.calculateBpmMatchQuality(features.bpm, targetBpm, tolerance) : 0,
          };
        }).filter(track => track.bpm) // Only return tracks with BPM data
          .sort((a, b) => b.matchQuality - a.matchQuality); // Sort by match quality
      }

      return tracks;
    } catch (error) {
      console.error('Failed to search tracks by BPM:', error);
      return [];
    }
  }

  /**
   * Calculate BPM match quality
   */
  calculateBpmMatchQuality(trackBpm, targetBpm, tolerance) {
    const difference = Math.abs(trackBpm - targetBpm);
    if (difference > tolerance) return 0;
    return Math.round((tolerance - difference) / tolerance * 100);
  }
  /**
   * Create a new playlist
   */
  async createPlaylist(name, description = '', isPublic = false) {
    try {
      if (!this.userProfile) {
        await this.loadUserProfile();
      }

      const response = await this.makeAuthenticatedRequest(
        `https://api.spotify.com/v1/users/${this.userProfile.id}/playlists`,
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            description,
            public: isPublic,
          }),
        }
      );

      const playlist = {
        id: response.id,
        name: response.name,
        description: response.description,
        trackCount: 0,
        imageUrl: response.images[0]?.url,
        isPublic: response.public,
        owner: response.owner.display_name,
        spotifyUrl: response.external_urls.spotify,
      };

      if (this.callbacks.onPlaylistCreated) {
        this.callbacks.onPlaylistCreated(playlist);
      }

      console.log(`Created Spotify playlist: ${name}`);
      return playlist;
    } catch (error) {
      console.error('Failed to create playlist:', error);
      throw error;
    }
  }

  /**
   * Add tracks to playlist
   */
  async addTracksToPlaylist(playlistId, trackUris) {
    try {
      const uris = trackUris.map(uri => uri.startsWith('spotify:track:') ? uri : `spotify:track:${uri}`);
      
      await this.makeAuthenticatedRequest(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: 'POST',
          body: JSON.stringify({
            uris,
          }),
        }
      );

      console.log(`Added ${uris.length} tracks to playlist ${playlistId}`);
    } catch (error) {
      console.error('Failed to add tracks to playlist:', error);
      throw error;
    }
  }

  /**
   * Generate cadence-based playlist using Spotify
   */
  async generateSpotifyCadencePlaylist(targetCadence, options = {}) {
    try {
      const {
        duration = 30, // minutes
        tolerance = 10,
        genres = ['pop', 'rock', 'electronic', 'hip-hop'],
        includeWarmup = true,
        includeCooldown = true,
      } = options;

      console.log(`Generating Spotify playlist for ${targetCadence} SPM`);

      const playlist = {
        id: `spotify_cadence_${targetCadence}_${Date.now()}`,
        name: `${targetCadence} SPM Workout - Spotify`,
        targetCadence,
        duration: duration * 60,
        tracks: [],
        createdAt: new Date().toISOString(),
        source: 'spotify',
      };

      // Search for main workout tracks
      const mainTracks = [];
      for (const genre of genres) {
        const tracks = await this.searchTracksByBpm(targetCadence, {
          tolerance,
          genre,
          limit: 20,
        });
        mainTracks.push(...tracks.slice(0, 10)); // Take top 10 from each genre
      }

      // Remove duplicates and sort by match quality
      const uniqueTracks = mainTracks.filter((track, index, self) => 
        index === self.findIndex(t => t.id === track.id)
      ).sort((a, b) => b.matchQuality - a.matchQuality);

      // Add warmup tracks (slower tempo)
      if (includeWarmup) {
        const warmupTracks = await this.searchTracksByBpm(targetCadence - 20, {
          tolerance: 15,
          limit: 10,
        });
        playlist.tracks.push(...warmupTracks.slice(0, 3).map(track => ({
          ...track,
          playlistSection: 'warmup',
        })));
      }

      // Add main workout tracks
      const targetDuration = duration * 60 * (includeWarmup && includeCooldown ? 0.7 : 0.9);
      let currentDuration = 0;
      let trackIndex = 0;

      while (currentDuration < targetDuration && trackIndex < uniqueTracks.length) {
        const track = uniqueTracks[trackIndex];
        playlist.tracks.push({
          ...track,
          playlistSection: 'main',
        });
        currentDuration += track.duration / 1000;
        trackIndex++;
      }

      // Add cooldown tracks (slower tempo)
      if (includeCooldown) {
        const cooldownTracks = await this.searchTracksByBpm(targetCadence - 30, {
          tolerance: 15,
          limit: 10,
        });
        playlist.tracks.push(...cooldownTracks.slice(0, 3).map(track => ({
          ...track,
          playlistSection: 'cooldown',
        })));
      }

      // Calculate actual duration
      playlist.actualDuration = playlist.tracks.reduce((total, track) => 
        total + (track.duration / 1000), 0
      );

      console.log(`Generated Spotify playlist: ${playlist.tracks.length} songs, ${Math.round(playlist.actualDuration / 60)} minutes`);
      return playlist;
    } catch (error) {
      console.error('Failed to generate Spotify cadence playlist:', error);
      return null;
    }
  }

  /**
   * Save tokens to storage
   */
  async saveTokens() {
    try {
      const tokens = {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        tokenExpiry: this.tokenExpiry,
      };
      await AsyncStorage.setItem('spotify_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to save Spotify tokens:', error);
    }
  }

  /**
   * Load tokens from storage
   */
  async loadTokens() {
    try {
      const tokens = await AsyncStorage.getItem('spotify_tokens');
      if (tokens) {
        const { accessToken, refreshToken, tokenExpiry } = JSON.parse(tokens);
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiry = tokenExpiry;
      }
    } catch (error) {
      console.error('Failed to load Spotify tokens:', error);
    }
  }

  /**
   * Logout and clear tokens
   */
  async logout() {
    try {
      this.isAuthenticated = false;
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = null;
      this.userProfile = null;

      await AsyncStorage.removeItem('spotify_tokens');

      if (this.callbacks.onAuthStateChange) {
        this.callbacks.onAuthStateChange(false, null);
      }

      console.log('Spotify logout successful');
    } catch (error) {
      console.error('Failed to logout from Spotify:', error);
    }
  }

  /**
   * Set callback functions
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      userProfile: this.userProfile,
      hasValidToken: this.accessToken && Date.now() < this.tokenExpiry,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      await this.saveTokens();
      console.log('SpotifyService cleanup complete');
    } catch (error) {
      console.error('Failed to cleanup SpotifyService:', error);
    }
  }
}

// Singleton instance
export default new SpotifyService();