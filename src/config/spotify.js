// Spotify Configuration
// Replace these with your actual Spotify App credentials

export const SPOTIFY_CONFIG = {
  // Get these from: https://developer.spotify.com/dashboard
  clientId: 'YOUR_SPOTIFY_CLIENT_ID', // Replace with your Client ID
  clientSecret: 'YOUR_SPOTIFY_CLIENT_SECRET', // Replace with your Client Secret (keep secure!)
  
  // Scopes define what permissions your app requests
  scopes: [
    'user-read-private',           // Read user profile
    'user-read-email',             // Read user email
    'playlist-read-private',       // Read private playlists
    'playlist-read-collaborative', // Read collaborative playlists
    'playlist-modify-public',      // Create/modify public playlists
    'playlist-modify-private',     // Create/modify private playlists
    'user-library-read',           // Read saved tracks
    'user-top-read',              // Read top tracks/artists
    'streaming',                   // Control playback (Premium required)
    'user-read-playback-state',    // Read playback state
    'user-modify-playback-state',  // Control playback
  ],
  
  // API endpoints
  endpoints: {
    auth: 'https://accounts.spotify.com/authorize',
    token: 'https://accounts.spotify.com/api/token',
    api: 'https://api.spotify.com/v1',
  },
};

// Instructions for setup:
/*
1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in:
   - App Name: "Cadence Optimizer"
   - App Description: "Running app with music integration"
   - Redirect URI: "exp://localhost:19000/--/spotify-auth" (for development)
   - For production: "cadenceoptimizer://spotify-auth"
5. Copy your Client ID and Client Secret
6. Replace the values above
7. Add redirect URIs in your Spotify app settings
*/