# Spotify Integration Setup Guide

## 🎵 Overview
The Cadence Optimizer app integrates with Spotify to provide:
- **Accurate BPM analysis** using Spotify's audio features API
- **Massive music library** with millions of songs
- **Smart playlist generation** based on your target cadence
- **High-quality streaming** (requires Spotify Premium for playback)

## 📋 Prerequisites
- Spotify account (free or premium)
- Spotify Developer account (free)

## 🚀 Setup Instructions

### Step 1: Create Spotify Developer App
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create App"**
4. Fill in the details:
   - **App Name**: `Cadence Optimizer`
   - **App Description**: `Running app with music integration for cadence-based workouts`
   - **Website**: `https://github.com/yourusername/cadence-optimizer` (optional)
   - **Redirect URI**: 
     - Development: `exp://localhost:19000/--/spotify-auth`
     - Production: `cadenceoptimizer://spotify-auth`
5. Accept the terms and click **"Save"**

### Step 2: Get Your Credentials
1. In your new app dashboard, you'll see:
   - **Client ID** (public, safe to include in app)
   - **Client Secret** (private, keep secure!)
2. Copy these values

### Step 3: Configure the App
1. Open `src/config/spotify.js`
2. Replace the placeholder values:
```javascript
export const SPOTIFY_CONFIG = {
  clientId: 'your_actual_client_id_here',
  clientSecret: 'your_actual_client_secret_here', // Keep this secure!
  // ... rest of config
};
```

### Step 4: Set Redirect URIs
1. In your Spotify app dashboard, click **"Edit Settings"**
2. Add these Redirect URIs:
   - `exp://localhost:19000/--/spotify-auth` (for Expo development)
   - `cadenceoptimizer://spotify-auth` (for production builds)
3. Save the settings

## 🎯 Features Available

### With Free Spotify Account:
- ✅ Search for songs by BPM
- ✅ Get audio features (BPM, energy, danceability)
- ✅ Create playlists in your Spotify account
- ✅ 30-second song previews
- ❌ Full song playback (requires Premium)

### With Spotify Premium:
- ✅ All free features
- ✅ Full song playback control
- ✅ Skip tracks, pause, play
- ✅ Background playback during workouts

## 🔧 Technical Details

### API Endpoints Used:
- **Search**: Find songs by BPM and genre
- **Audio Features**: Get precise BPM and audio characteristics
- **Playlists**: Create and manage workout playlists
- **User Profile**: Get user information
- **Playback** (Premium): Control music playback

### Permissions Requested:
- `user-read-private` - Read user profile
- `playlist-modify-public/private` - Create workout playlists
- `user-library-read` - Access saved music
- `streaming` - Control playback (Premium only)

## 🎵 How It Works

1. **Authentication**: User logs in with Spotify OAuth
2. **BPM Search**: App searches Spotify's catalog for songs matching target cadence
3. **Playlist Generation**: Creates optimized playlists with:
   - Warmup tracks (slower tempo)
   - Main workout tracks (target cadence)
   - Cooldown tracks (slower tempo)
4. **Playback**: Plays songs during workout (Premium) or shows previews (Free)

## 🔒 Security Notes

- **Client Secret**: Never commit this to version control
- **Tokens**: Stored securely in device storage
- **Permissions**: Only requests necessary scopes
- **Refresh**: Tokens automatically refresh when expired

## 🐛 Troubleshooting

### "Invalid Client" Error:
- Check that Client ID is correct
- Verify redirect URI matches exactly

### "Authentication Failed":
- Ensure redirect URIs are configured in Spotify dashboard
- Check that app is not in development mode restrictions

### "No Songs Found":
- Try different cadence values (120-180 BPM work best)
- Expand tolerance in search settings
- Check internet connection

### "Playback Not Working":
- Full playback requires Spotify Premium
- Free accounts get 30-second previews only
- Ensure Spotify app is not playing elsewhere

## 📱 Testing

1. Run the app: `npm start`
2. Navigate to Metronome screen
3. Toggle to "Music" mode
4. Tap "Connect to Spotify"
5. Complete OAuth flow
6. Generate a playlist for your target cadence
7. Test playback (preview or full depending on account type)

## 🚀 Production Deployment

For production builds:
1. Update redirect URI to your app's custom scheme
2. Configure deep linking in `app.json`
3. Test OAuth flow on physical devices
4. Submit for Spotify app review if needed (for extended quota)

## 📞 Support

If you encounter issues:
1. Check Spotify Developer Dashboard for app status
2. Verify all credentials and URIs are correct
3. Test with a simple OAuth flow first
4. Check Spotify API status page for service issues

---

**Ready to rock your runs with perfectly timed music! 🎵🏃‍♂️**