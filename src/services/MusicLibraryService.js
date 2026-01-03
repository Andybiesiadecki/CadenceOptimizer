// Music Library Service
// Handles music platform integration, BPM analysis, and cadence-music matching

import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SpotifyService from './SpotifyService';

export class MusicLibraryService {
  constructor() {
    this.isInitialized = false;
    this.musicLibrary = [];
    this.spotifyLibrary = [];
    this.bpmCache = new Map(); // Cache BPM analysis results
    this.currentPlaylist = [];
    this.isPlaying = false;
    this.currentSound = null;
    this.currentTrack = null;
    this.musicSource = 'device'; // 'device' or 'spotify'
    this.callbacks = {
      onTrackChange: null,
      onPlaybackStatusUpdate: null,
      onPlaylistGenerated: null,
      onSpotifyAuthChange: null,
    };
  }

  /**
   * Initialize the music service
   */
  async initialize() {
    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Media library permission denied, Spotify-only mode');
      }

      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
      });

      // Initialize Spotify service
      SpotifyService.setCallbacks({
        onAuthStateChange: this.handleSpotifyAuthChange.bind(this),
      });
      await SpotifyService.initialize();

      // Load cached BPM data
      await this.loadBpmCache();

      this.isInitialized = true;
      console.log('MusicLibraryService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MusicLibraryService:', error);
      throw error;
    }
  }

  /**
   * Handle Spotify authentication state changes
   */
  handleSpotifyAuthChange(isAuthenticated, userProfile) {
    console.log('Spotify auth state changed:', isAuthenticated);
    if (this.callbacks.onSpotifyAuthChange) {
      this.callbacks.onSpotifyAuthChange(isAuthenticated, userProfile);
    }
  }

  /**
   * Load user's music library
   */
  async loadMusicLibrary() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('Loading music library...');
      
      // Get music assets from device
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 1000, // Load first 1000 songs
        sortBy: ['creationTime'],
      });

      // Process and filter music files
      this.musicLibrary = media.assets
        .filter(asset => {
          // Filter for common music formats
          const validFormats = ['.mp3', '.m4a', '.aac', '.wav'];
          return validFormats.some(format => 
            asset.filename.toLowerCase().endsWith(format)
          );
        })
        .map(asset => ({
          id: asset.id,
          title: this.extractTitle(asset.filename),
          artist: asset.albumId || 'Unknown Artist',
          duration: asset.duration,
          uri: asset.uri,
          filename: asset.filename,
          bpm: this.bpmCache.get(asset.id) || null,
          lastAnalyzed: this.bpmCache.has(asset.id) ? new Date().toISOString() : null,
        }));

      console.log(`Loaded ${this.musicLibrary.length} songs from music library`);
      return this.musicLibrary;
    } catch (error) {
      console.error('Failed to load music library:', error);
      return [];
    }
  }

  /**
   * Extract clean title from filename
   */
  extractTitle(filename) {
    // Remove file extension
    let title = filename.replace(/\.[^/.]+$/, '');
    
    // Remove common prefixes/suffixes
    title = title.replace(/^\d+[\s\-\.]*/, ''); // Remove track numbers
    title = title.replace(/\s*\([^)]*\)$/, ''); // Remove parentheses at end
    
    return title.trim() || filename;
  }

  /**
   * Analyze BPM of a song (simplified algorithm)
   * In a real implementation, this would use audio analysis libraries
   */
  async analyzeBpm(track) {
    try {
      console.log(`Analyzing BPM for: ${track.title}`);
      
      // Check if already cached
      if (this.bpmCache.has(track.id)) {
        return this.bpmCache.get(track.id);
      }

      // Simplified BPM estimation based on song characteristics
      // In a real app, you'd use audio analysis libraries like:
      // - Web Audio API for beat detection
      // - Third-party services like Spotify API
      // - Audio analysis libraries
      
      let estimatedBpm = this.estimateBpmFromMetadata(track);
      
      // Add some realistic variation
      const variation = (Math.random() - 0.5) * 20; // ±10 BPM variation
      estimatedBpm = Math.round(estimatedBpm + variation);
      
      // Ensure reasonable BPM range
      estimatedBpm = Math.max(60, Math.min(200, estimatedBpm));
      
      // Cache the result
      this.bpmCache.set(track.id, estimatedBpm);
      await this.saveBpmCache();
      
      console.log(`BPM analysis complete: ${track.title} = ${estimatedBpm} BPM`);
      return estimatedBpm;
    } catch (error) {
      console.error(`Failed to analyze BPM for ${track.title}:`, error);
      return null;
    }
  }

  /**
   * Estimate BPM from song metadata (simplified approach)
   */
  estimateBpmFromMetadata(track) {
    // This is a simplified estimation - in reality you'd analyze the audio
    const duration = track.duration / 1000; // Convert to seconds
    const title = track.title.toLowerCase();
    
    // Genre-based BPM estimation
    if (title.includes('ballad') || title.includes('slow')) return 70;
    if (title.includes('rock') || title.includes('pop')) return 120;
    if (title.includes('dance') || title.includes('electronic')) return 128;
    if (title.includes('hip hop') || title.includes('rap')) return 90;
    if (title.includes('classical')) return 80;
    if (title.includes('jazz')) return 110;
    if (title.includes('country')) return 100;
    if (title.includes('reggae')) return 85;
    if (title.includes('punk')) return 150;
    if (title.includes('metal')) return 140;
    
    // Duration-based estimation (longer songs tend to be slower)
    if (duration > 300) return 85; // 5+ minutes = slower
    if (duration < 180) return 130; // <3 minutes = faster
    
    // Default estimation
    return 115;
  }

  /**
   * Find songs matching target cadence
   */
  async findSongsForCadence(targetCadence, tolerance = 10) {
    try {
      console.log(`Finding songs for cadence: ${targetCadence} SPM (±${tolerance})`);
      
      let matchingSongs = [];

      // Search Spotify if authenticated
      if (SpotifyService.isAuthenticated) {
        console.log('Searching Spotify for matching songs...');
        const spotifyTracks = await SpotifyService.searchTracksByBpm(targetCadence, {
          tolerance,
          limit: 30,
        });
        
        matchingSongs.push(...spotifyTracks.map(track => ({
          ...track,
          source: 'spotify',
          uri: track.spotifyUrl,
        })));
      }

      // Search device library
      if (this.musicLibrary.length === 0) {
        await this.loadMusicLibrary();
      }

      for (const track of this.musicLibrary) {
        // Analyze BPM if not already done
        if (!track.bpm) {
          track.bpm = await this.analyzeBpm(track);
        }
        
        if (track.bpm) {
          // Check different matching ratios
          const ratios = [
            { ratio: 1, name: '1:1' }, // 180 SPM = 180 BPM
            { ratio: 2, name: '2:1' }, // 180 SPM = 90 BPM (double time)
            { ratio: 0.5, name: '1:2' }, // 180 SPM = 360 BPM (half time)
          ];
          
          for (const { ratio, name } of ratios) {
            const targetBpm = targetCadence * ratio;
            const difference = Math.abs(track.bpm - targetBpm);
            
            if (difference <= tolerance) {
              matchingSongs.push({
                ...track,
                source: 'device',
                matchRatio: ratio,
                matchType: name,
                bpmDifference: difference,
                matchQuality: this.calculateMatchQuality(difference, tolerance),
              });
              break; // Only add once per song
            }
          }
        }
      }
      
      // Sort by match quality (best matches first)
      matchingSongs.sort((a, b) => b.matchQuality - a.matchQuality);
      
      console.log(`Found ${matchingSongs.length} songs matching ${targetCadence} SPM (${matchingSongs.filter(s => s.source === 'spotify').length} from Spotify, ${matchingSongs.filter(s => s.source === 'device').length} from device)`);
      return matchingSongs;
    } catch (error) {
      console.error('Failed to find songs for cadence:', error);
      return [];
    }
  }

  /**
   * Calculate match quality score (0-100)
   */
  calculateMatchQuality(difference, tolerance) {
    const score = Math.max(0, (tolerance - difference) / tolerance * 100);
    return Math.round(score);
  }

  /**
   * Authenticate with Spotify
   */
  async authenticateSpotify() {
    try {
      const success = await SpotifyService.authenticate();
      if (success) {
        console.log('Spotify authentication successful');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Spotify authentication failed:', error);
      throw error;
    }
  }

  /**
   * Generate a playlist for target cadence (with Spotify integration)
   */
  async generateCadencePlaylist(targetCadence, duration = 30, options = {}) {
    try {
      const {
        tolerance = 10,
        minSongs = 8,
        includeWarmup = true,
        includeCooldown = true,
        preferredGenres = [],
        useSpotify = SpotifyService.isAuthenticated,
      } = options;

      console.log(`Generating ${duration}-minute playlist for ${targetCadence} SPM`);
      
      let playlist;

      // Try Spotify first if authenticated and preferred
      if (useSpotify && SpotifyService.isAuthenticated) {
        console.log('Generating Spotify-based playlist...');
        playlist = await SpotifyService.generateSpotifyCadencePlaylist(targetCadence, {
          duration,
          tolerance,
          genres: preferredGenres.length > 0 ? preferredGenres : ['pop', 'rock', 'electronic'],
          includeWarmup,
          includeCooldown,
        });
        
        if (playlist && playlist.tracks.length >= minSongs) {
          playlist.source = 'spotify';
          await this.savePlaylist(playlist);
          
          if (this.callbacks.onPlaylistGenerated) {
            this.callbacks.onPlaylistGenerated(playlist);
          }
          
          return playlist;
        }
      }

      // Fallback to device library or supplement Spotify results
      console.log('Generating device-based playlist...');
      playlist = {
        id: `cadence_${targetCadence}_${Date.now()}`,
        name: `${targetCadence} SPM Workout`,
        targetCadence,
        duration: duration * 60, // Convert to seconds
        createdAt: new Date().toISOString(),
        tracks: [],
        source: 'mixed',
      };

      // Find matching songs
      const matchingSongs = await this.findSongsForCadence(targetCadence, tolerance);
      
      if (matchingSongs.length < minSongs) {
        console.warn(`Only found ${matchingSongs.length} songs, need at least ${minSongs}`);
        // Expand tolerance and try again
        const expandedMatches = await this.findSongsForCadence(targetCadence, tolerance * 2);
        matchingSongs.push(...expandedMatches.filter(song => 
          !matchingSongs.find(existing => existing.id === song.id)
        ));
      }

      // Add warmup songs (slower tempo)
      if (includeWarmup) {
        const warmupSongs = await this.findSongsForCadence(targetCadence - 20, 15);
        playlist.tracks.push(...warmupSongs.slice(0, 2).map(song => ({
          ...song,
          playlistSection: 'warmup',
        })));
      }

      // Add main workout songs
      const targetDuration = duration * 60 * (includeWarmup && includeCooldown ? 0.7 : 0.9);
      let currentDuration = 0;
      let songIndex = 0;
      
      while (currentDuration < targetDuration && songIndex < matchingSongs.length) {
        const song = matchingSongs[songIndex];
        playlist.tracks.push({
          ...song,
          playlistSection: 'main',
        });
        currentDuration += song.duration / 1000;
        songIndex++;
      }

      // Add cooldown songs (slower tempo)
      if (includeCooldown) {
        const cooldownSongs = await this.findSongsForCadence(targetCadence - 30, 15);
        playlist.tracks.push(...cooldownSongs.slice(0, 2).map(song => ({
          ...song,
          playlistSection: 'cooldown',
        })));
      }

      // Calculate actual playlist duration
      playlist.actualDuration = playlist.tracks.reduce((total, track) => 
        total + (track.duration / 1000), 0
      );

      console.log(`Generated playlist: ${playlist.tracks.length} songs, ${Math.round(playlist.actualDuration / 60)} minutes`);
      
      // Save playlist
      await this.savePlaylist(playlist);
      
      if (this.callbacks.onPlaylistGenerated) {
        this.callbacks.onPlaylistGenerated(playlist);
      }
      
      return playlist;
    } catch (error) {
      console.error('Failed to generate cadence playlist:', error);
      return null;
    }
  }

  /**
   * Play a track
   */
  async playTrack(track) {
    try {
      // Stop current track if playing
      if (this.currentSound) {
        await this.currentSound.unloadAsync();
      }

      console.log(`Playing: ${track.title}`);
      
      // Load and play new track
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: true, isLooping: false },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.currentSound = sound;
      this.currentTrack = track;
      this.isPlaying = true;

      if (this.callbacks.onTrackChange) {
        this.callbacks.onTrackChange(track);
      }

      return sound;
    } catch (error) {
      console.error(`Failed to play track ${track.title}:`, error);
      throw error;
    }
  }

  /**
   * Handle playback status updates
   */
  onPlaybackStatusUpdate(status) {
    if (this.callbacks.onPlaybackStatusUpdate) {
      this.callbacks.onPlaybackStatusUpdate(status);
    }

    // Handle track completion
    if (status.didJustFinish) {
      this.onTrackFinished();
    }
  }

  /**
   * Handle track finished
   */
  onTrackFinished() {
    console.log('Track finished, playing next...');
    // Auto-play next track in playlist
    this.playNextTrack();
  }

  /**
   * Play next track in current playlist
   */
  async playNextTrack() {
    if (this.currentPlaylist.length === 0) return;
    
    const currentIndex = this.currentPlaylist.findIndex(track => 
      track.id === this.currentTrack?.id
    );
    
    const nextIndex = (currentIndex + 1) % this.currentPlaylist.length;
    const nextTrack = this.currentPlaylist[nextIndex];
    
    await this.playTrack(nextTrack);
  }

  /**
   * Stop playback
   */
  async stop() {
    try {
      if (this.currentSound) {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }
      
      this.isPlaying = false;
      this.currentTrack = null;
      console.log('Music playback stopped');
    } catch (error) {
      console.error('Failed to stop music playback:', error);
    }
  }

  /**
   * Load BPM cache from storage
   */
  async loadBpmCache() {
    try {
      const cached = await AsyncStorage.getItem('music_bpm_cache');
      if (cached) {
        const data = JSON.parse(cached);
        this.bpmCache = new Map(Object.entries(data));
        console.log(`Loaded ${this.bpmCache.size} cached BPM analyses`);
      }
    } catch (error) {
      console.error('Failed to load BPM cache:', error);
    }
  }

  /**
   * Save BPM cache to storage
   */
  async saveBpmCache() {
    try {
      const data = Object.fromEntries(this.bpmCache);
      await AsyncStorage.setItem('music_bpm_cache', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save BPM cache:', error);
    }
  }

  /**
   * Save playlist to storage
   */
  async savePlaylist(playlist) {
    try {
      const key = `playlist_${playlist.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(playlist));
      
      // Update playlist index
      const indexKey = 'saved_playlists';
      const existingIndex = await AsyncStorage.getItem(indexKey);
      const playlists = existingIndex ? JSON.parse(existingIndex) : [];
      
      // Add or update playlist in index
      const existingIndex2 = playlists.findIndex(p => p.id === playlist.id);
      const playlistSummary = {
        id: playlist.id,
        name: playlist.name,
        targetCadence: playlist.targetCadence,
        trackCount: playlist.tracks.length,
        duration: playlist.actualDuration,
        createdAt: playlist.createdAt,
      };
      
      if (existingIndex2 >= 0) {
        playlists[existingIndex2] = playlistSummary;
      } else {
        playlists.push(playlistSummary);
      }
      
      await AsyncStorage.setItem(indexKey, JSON.stringify(playlists));
      console.log(`Saved playlist: ${playlist.name}`);
    } catch (error) {
      console.error('Failed to save playlist:', error);
    }
  }

  /**
   * Get saved playlists
   */
  async getSavedPlaylists() {
    try {
      const indexKey = 'saved_playlists';
      const data = await AsyncStorage.getItem(indexKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get saved playlists:', error);
      return [];
    }
  }

  /**
   * Load a saved playlist
   */
  async loadPlaylist(playlistId) {
    try {
      const key = `playlist_${playlistId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load playlist:', error);
      return null;
    }
  }

  /**
   * Set callback functions
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get current playback status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isPlaying: this.isPlaying,
      currentTrack: this.currentTrack,
      librarySize: this.musicLibrary.length,
      cachedBpmCount: this.bpmCache.size,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    try {
      await this.stop();
      await this.saveBpmCache();
      console.log('MusicLibraryService cleanup complete');
    } catch (error) {
      console.error('Failed to cleanup MusicLibraryService:', error);
    }
  }
}

// Singleton instance
export default new MusicLibraryService();