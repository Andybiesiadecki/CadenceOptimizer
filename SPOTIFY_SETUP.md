# 🎵 Spotify Integration Setup Guide

## Current Status: DISABLED ⏸️

Spotify integration is currently disabled to prevent "invalid client" errors. Follow this guide when you're ready to enable music features.

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Spotify App
1. Go to **https://developer.spotify.com/dashboard**
2. **Log in** with your Spotify account
3. Click **"Create App"**
4. Fill in the form:
   ```
   App Name: Cadence Optimizer
   App Description: Running app with music integration  
   Website: http://localhost:8081
   Redirect URI: http://localhost:8081/spotify-callback
   ```
5. **Check the boxes** for Terms of Service
6. Click **"Save"**

### Step 2: Get Your Credentials
After creating the app, you'll see:
- **Client ID** (looks like: `1a2b3c4d5e6f7g8h9i0j`)
- **Client Secret** (click "Show Client Secret")

### Step 3: Update Configuration
1. Open `src/config/spotify.js`
2. Replace the placeholder values:
   ```javascript
   export const SPOTIFY_CONFIG = {
     enabled: true, // ← Change this to true
     clientId: 'YOUR_ACTUAL_CLIENT_ID_HERE',
     clientSecret: 'YOUR_ACTUAL_CLIENT_SECRET_HERE',
     // ... rest stays the same
   };
   ```

### Step 4: Test the Integration
1. **Restart the development server**: `npm start`
2. **Go to Metronome tab**
3. **Look for Spotify section** - should show "Connect to Spotify" button
4. **Click connect** - should open Spotify login

## 🎯 What You'll Get

Once enabled, users can:
- **Connect their Spotify account**
- **Search for songs by BPM** (beats per minute)
- **Create running playlists** matched to their target cadence
- **Get song recommendations** for different workout phases

## 🔒 Security Notes

- **Client Secret is sensitive** - don't share it publicly
- **For production deployment**, you'll need to:
  - Update redirect URIs in Spotify Dashboard
  - Use environment variables for credentials
  - Add your production domain to Spotify app settings

## 🚫 Skip for Now

If you want to test other features first:
- Leave `enabled: false` in the config
- Spotify features will be hidden in the UI
- All other app features work normally

## 🆘 Troubleshooting

**"Invalid Client" Error:**
- Check that Client ID is correct
- Verify redirect URI matches exactly
- Make sure `enabled: true` in config

**"Redirect URI Mismatch":**
- Add `http://localhost:8081/spotify-callback` to your Spotify app settings
- For production, add your actual domain

**Authentication Fails:**
- Clear browser cache
- Try incognito/private browsing mode
- Check that Spotify app is not restricted

---

**Ready to enable Spotify?** Just follow Steps 1-4 above! 🎵