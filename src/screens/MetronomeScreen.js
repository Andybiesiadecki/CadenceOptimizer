import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import MetronomeService from '../services/MetronomeService';
import LocationService from '../services/LocationService';
import TerrainDetector from '../services/TerrainDetector';
import WorkoutEngine from '../services/WorkoutEngine';
import CoachingVoiceService from '../services/CoachingVoiceService';
import MusicLibraryService from '../services/MusicLibraryService';
import SpotifyService from '../services/SpotifyService';

export default function MetronomeScreen() {
  // ... existing state ...
  
  // Check if Spotify is enabled
  const [spotifyEnabled, setSpotifyEnabled] = useState(SpotifyService.isEnabled());
  const [isPlaying, setIsPlaying] = useState(false);
  const [cadence, setCadence] = useState(170);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [mode, setMode] = useState('basic'); // basic, interval, progressive, terrain, fartlek, music
  
  // Music mode states
  const [musicMode, setMusicMode] = useState(false); // false = metronome, true = music
  const [musicLibraryLoaded, setMusicLibraryLoaded] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isGeneratingPlaylist, setIsGeneratingPlaylist] = useState(false);
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [spotifyAuthenticated, setSpotifyAuthenticated] = useState(false);
  const [spotifyUser, setSpotifyUser] = useState(null);
  
  // Fartlek mode states
  const [workoutStatus, setWorkoutStatus] = useState({ active: false });
  const [coachingEnabled, setCoachingEnabled] = useState(true);
  const [fartlekDifficulty, setFartlekDifficulty] = useState('intermediate');
  
  // Interval mode states
  const [intervalConfig, setIntervalConfig] = useState({
    workDuration: 240, // 4 minutes
    restDuration: 120, // 2 minutes
    intervals: 4,
    workCadence: 185,
    restCadence: 160,
  });
  
  // Progressive mode states
  const [progressiveConfig, setProgressiveConfig] = useState({
    duration: 1800, // 30 minutes
    startCadence: 160,
    endCadence: 185,
    progressionType: 'linear',
  });
  
  // Terrain mode states
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [terrainData, setTerrainData] = useState({
    terrain: 'flat',
    grade: 0,
    cadenceAdjustment: 0,
    confidence: 'low',
  });
  const [baseCadence, setBaseCadence] = useState(170); // Original cadence before terrain adjustments
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const beatIndicators = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  useEffect(() => {
    // Initialize workout engine callbacks
    WorkoutEngine.setCallbacks({
      onPhaseChange: handlePhaseChange,
      onCadenceChange: handleCadenceChange,
      onWorkoutComplete: handleWorkoutComplete,
      onCoachingCue: handleCoachingCue,
    });

    // Initialize coaching voice
    CoachingVoiceService.initialize();

    // Initialize music library service
    initializeMusicService();

    return () => {
      // Cleanup when component unmounts
      MetronomeService.cleanup();
      WorkoutEngine.stopWorkout();
      CoachingVoiceService.stopSpeaking();
      MusicLibraryService.cleanup();
      stopLocationTracking();
    };
  }, []);

  // Initialize music service
  const initializeMusicService = async () => {
    try {
      MusicLibraryService.setCallbacks({
        onTrackChange: handleTrackChange,
        onPlaybackStatusUpdate: handlePlaybackStatusUpdate,
        onPlaylistGenerated: handlePlaylistGenerated,
        onSpotifyAuthChange: handleSpotifyAuthChange,
      });

      await MusicLibraryService.initialize();
      const playlists = await MusicLibraryService.getSavedPlaylists();
      setSavedPlaylists(playlists);
      
      // Check Spotify authentication status only if enabled
      if (SpotifyService.isEnabled()) {
        const spotifyStatus = SpotifyService.getStatus();
        setSpotifyAuthenticated(spotifyStatus.isAuthenticated);
        setSpotifyUser(spotifyStatus.userProfile);
      } else {
        setSpotifyAuthenticated(false);
        setSpotifyUser(null);
      }
      
      console.log('Music service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize music service:', error);
    }
  };

  // Spotify Authentication Callback
  const handleSpotifyAuthChange = (isAuthenticated, userProfile) => {
    console.log('Spotify auth changed:', isAuthenticated);
    setSpotifyAuthenticated(isAuthenticated);
    setSpotifyUser(userProfile);
  };

  // Music Service Callbacks
  const handleTrackChange = (track) => {
    console.log(`Now playing: ${track.title}`);
    setCurrentTrack(track);
  };

  const handlePlaybackStatusUpdate = (status) => {
    // Handle playback status updates
    console.log('Playback status:', status.isLoaded, status.isPlaying);
  };

  const handlePlaylistGenerated = (playlist) => {
    console.log(`Playlist generated: ${playlist.name} with ${playlist.tracks.length} songs`);
    setCurrentPlaylist(playlist);
    setIsGeneratingPlaylist(false);
    
    // Update saved playlists
    setSavedPlaylists(prev => [
      { 
        id: playlist.id,
        name: playlist.name,
        targetCadence: playlist.targetCadence,
        trackCount: playlist.tracks.length,
        duration: playlist.actualDuration,
        createdAt: playlist.createdAt,
      },
      ...prev
    ]);
  };

  // Workout Engine Callbacks
  const handlePhaseChange = (phase, phaseIndex, totalPhases) => {
    console.log(`Phase ${phaseIndex + 1}/${totalPhases}:`, phase);
    setWorkoutStatus(WorkoutEngine.getStatus());
  };

  const handleCadenceChange = (newCadence, baseCadence) => {
    console.log(`Cadence change: ${baseCadence} → ${newCadence} SPM`);
    setCadence(newCadence);
    if (isPlaying) {
      MetronomeService.updateBpm(newCadence, handleBeat);
    }
  };

  const handleWorkoutComplete = (workout, stats, completed) => {
    console.log('Workout completed:', { workout: workout.name, stats, completed });
    setWorkoutStatus({ active: false });
    
    if (completed) {
      CoachingVoiceService.speak(
        `Great job! You completed your ${workout.name} workout. ${stats.phasesCompleted} phases completed in ${Math.round(stats.totalTime / 60000)} minutes.`,
        { priority: 'high', type: 'motivation' }
      );
    }
  };

  const handleCoachingCue = (cue, phase) => {
    console.log('Coaching cue:', cue.message);
    if (coachingEnabled) {
      CoachingVoiceService.speakCoachingCue(cue);
    }
  };

  // Handle location updates for terrain detection
  const handleLocationUpdate = (location, locationHistory) => {
    const analysis = TerrainDetector.processLocation(location, locationHistory);
    setTerrainData(analysis);
    
    // Adjust cadence if in terrain mode and metronome is playing
    if (mode === 'terrain' && isPlaying) {
      const adjustedCadence = baseCadence + analysis.cadenceAdjustment;
      const newCadence = Math.max(140, Math.min(200, adjustedCadence));
      
      if (Math.abs(newCadence - cadence) >= 2) { // Only update if significant change
        setCadence(newCadence);
        MetronomeService.updateBpm(newCadence, handleBeat);
      }
    }
  };

  // Start location tracking for terrain mode
  const startLocationTracking = async () => {
    try {
      await LocationService.startTracking(handleLocationUpdate);
      setIsTrackingLocation(true);
      console.log('Location tracking started for terrain mode');
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      Alert.alert(
        'Location Error',
        'Unable to access GPS. Please enable location permissions for terrain mode.',
        [{ text: 'OK' }]
      );
    }
  };

  // Stop location tracking
  const stopLocationTracking = async () => {
    await LocationService.stopTracking();
    setIsTrackingLocation(false);
    TerrainDetector.reset();
    setTerrainData({
      terrain: 'flat',
      grade: 0,
      cadenceAdjustment: 0,
      confidence: 'low',
    });
    console.log('Location tracking stopped');
  };

  const toggleMetronome = async () => {
    if (isPlaying) {
      // Stop current session
      if (musicMode) {
        await MusicLibraryService.stop();
      } else {
        MetronomeService.stop();
      }
      WorkoutEngine.stopWorkout();
      setIsPlaying(false);
      setCurrentBeat(0);
      setWorkoutStatus({ active: false });
      
      // Stop location tracking if in terrain mode
      if (mode === 'terrain') {
        await stopLocationTracking();
      }
    } else {
      // Start new session
      
      // Start location tracking if in terrain mode
      if (mode === 'terrain') {
        await startLocationTracking();
      }
      
      if (musicMode) {
        // Music mode - generate and play playlist
        await startMusicMode();
      } else {
        // Metronome mode - start workout or basic metronome
        if (mode === 'fartlek') {
          await startFartlekWorkout();
        } else if (mode === 'interval') {
          await startIntervalWorkout();
        } else if (mode === 'progressive') {
          await startProgressiveWorkout();
        } else {
          await MetronomeService.start(cadence, handleBeat);
        }
      }
      
      setIsPlaying(true);
    }
  };

  // Start music mode
  const startMusicMode = async () => {
    try {
      console.log(`Starting music mode for ${cadence} SPM`);
      
      // Load music library if not already loaded
      if (!musicLibraryLoaded) {
        console.log('Loading music library...');
        await MusicLibraryService.loadMusicLibrary();
        setMusicLibraryLoaded(true);
      }

      // Generate playlist if none exists or doesn't match current cadence
      if (!currentPlaylist || currentPlaylist.targetCadence !== cadence) {
        setIsGeneratingPlaylist(true);
        
        const playlist = await MusicLibraryService.generateCadencePlaylist(cadence, 30, {
          tolerance: 10,
          minSongs: 5,
          includeWarmup: true,
          includeCooldown: true,
        });

        if (!playlist || playlist.tracks.length === 0) {
          Alert.alert(
            'No Matching Songs',
            `Couldn't find enough songs matching ${cadence} SPM. Try a different cadence or add more music to your library.`,
            [{ text: 'OK' }]
          );
          setIsGeneratingPlaylist(false);
          return;
        }

        setCurrentPlaylist(playlist);
        setIsGeneratingPlaylist(false);
      }

      // Start playing the playlist
      if (currentPlaylist && currentPlaylist.tracks.length > 0) {
        MusicLibraryService.currentPlaylist = currentPlaylist.tracks;
        await MusicLibraryService.playTrack(currentPlaylist.tracks[0]);
        
        // Start workout if in workout mode
        if (mode === 'fartlek') {
          await startFartlekWorkout();
        } else if (mode === 'interval') {
          await startIntervalWorkout();
        } else if (mode === 'progressive') {
          await startProgressiveWorkout();
        }
      }
    } catch (error) {
      console.error('Failed to start music mode:', error);
      Alert.alert('Music Error', 'Failed to start music mode. Please try again.');
      setIsGeneratingPlaylist(false);
    }
  };

  // Start Fartlek workout
  const startFartlekWorkout = async () => {
    try {
      const config = {
        duration: 1800, // 30 minutes
        difficulty: fartlekDifficulty,
        baseCadence: cadence,
        terrainAware: true,
        coachingEnabled: coachingEnabled,
      };

      await WorkoutEngine.startFartlek(config);
      await MetronomeService.start(cadence, handleBeat);
      setWorkoutStatus(WorkoutEngine.getStatus());

      // Welcome message
      if (coachingEnabled) {
        CoachingVoiceService.speak(
          `Starting your ${fartlekDifficulty} Fartlek workout! Get ready for some speed play. I'll guide you through cadence changes.`,
          { priority: 'high', type: 'motivation' }
        );
      }
    } catch (error) {
      console.error('Failed to start Fartlek workout:', error);
      Alert.alert('Workout Error', 'Failed to start Fartlek workout. Please try again.');
    }
  };

  // Start Interval workout
  const startIntervalWorkout = async () => {
    try {
      const config = {
        ...intervalConfig,
        workCadence: intervalConfig.workCadence || cadence + 15,
        restCadence: intervalConfig.restCadence || cadence - 10,
        terrainAware: true,
        coachingEnabled: coachingEnabled,
      };

      await WorkoutEngine.startInterval(config);
      await MetronomeService.start(cadence, handleBeat);
      setWorkoutStatus(WorkoutEngine.getStatus());

      // Welcome message
      if (coachingEnabled) {
        CoachingVoiceService.speak(
          `Starting your ${config.intervals} by ${Math.round(config.workDuration/60)} minute interval workout! Let's warm up first.`,
          { priority: 'high', type: 'motivation' }
        );
      }
    } catch (error) {
      console.error('Failed to start Interval workout:', error);
      Alert.alert('Workout Error', 'Failed to start Interval workout. Please try again.');
    }
  };

  // Start Progressive workout
  const startProgressiveWorkout = async () => {
    try {
      const config = {
        ...progressiveConfig,
        startCadence: progressiveConfig.startCadence || cadence - 10,
        endCadence: progressiveConfig.endCadence || cadence + 20,
        terrainAware: true,
        coachingEnabled: coachingEnabled,
      };

      await WorkoutEngine.startProgressive(config);
      await MetronomeService.start(cadence, handleBeat);
      setWorkoutStatus(WorkoutEngine.getStatus());

      // Welcome message
      if (coachingEnabled) {
        CoachingVoiceService.speak(
          `Starting your ${Math.round(config.duration/60)} minute progressive workout! We'll build from ${config.startCadence} to ${config.endCadence} steps per minute.`,
          { priority: 'high', type: 'motivation' }
        );
      }
    } catch (error) {
      console.error('Failed to start Progressive workout:', error);
      Alert.alert('Workout Error', 'Failed to start Progressive workout. Please try again.');
    }
  };

  const handleBeat = (beat, isAccent) => {
    setCurrentBeat(beat);
    
    // Animate pulse circle
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate beat indicators
    const beatIndex = (beat - 1) % 4;
    beatIndicators.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index === beatIndex ? 1 : 0.3,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });
  };

  const adjustCadence = async (delta) => {
    const newCadence = Math.max(140, Math.min(200, cadence + delta));
    setCadence(newCadence);
    
    // Update base cadence for terrain mode
    if (mode === 'terrain') {
      setBaseCadence(newCadence);
    }
    
    if (isPlaying) {
      await MetronomeService.updateBpm(newCadence, handleBeat);
    }
  };

  const setPresetCadence = async (newCadence) => {
    setCadence(newCadence);
    
    // Update base cadence for terrain mode
    if (mode === 'terrain') {
      setBaseCadence(newCadence);
    }
    
    if (isPlaying) {
      await MetronomeService.updateBpm(newCadence, handleBeat);
    }
  };

  const handleVolumeChange = async (newVolume) => {
    setVolume(newVolume);
    await MetronomeService.setVolume(newVolume);
  };

  const toggleAudio = () => {
    const newAudioEnabled = !audioEnabled;
    setAudioEnabled(newAudioEnabled);
    MetronomeService.setAudioEnabled(newAudioEnabled);
  };

  // Handle mode changes
  const handleModeChange = async (newMode) => {
    if (newMode === mode) return;
    
    // Stop current session if playing
    const wasPlaying = isPlaying;
    if (isPlaying) {
      await toggleMetronome(); // This will stop and cleanup
    }
    
    // Reset terrain data when leaving terrain mode
    if (mode === 'terrain' && newMode !== 'terrain') {
      await stopLocationTracking();
      setCadence(baseCadence); // Reset to base cadence
    }
    
    // Reset workout status when leaving workout modes
    if ((mode === 'fartlek' || mode === 'interval' || mode === 'progressive') && 
        (newMode !== 'fartlek' && newMode !== 'interval' && newMode !== 'progressive')) {
      WorkoutEngine.stopWorkout();
      setWorkoutStatus({ active: false });
    }
    
    // Set new mode
    setMode(newMode);
    
    // If switching to terrain mode, set base cadence
    if (newMode === 'terrain') {
      setBaseCadence(cadence);
    }
    
    // Restart if was playing and switching to basic mode
    if (wasPlaying && newMode === 'basic') {
      setTimeout(() => toggleMetronome(), 500); // Small delay for cleanup
    }
  };

  // Get terrain emoji for display
  const getTerrainEmoji = (terrain) => {
    switch (terrain) {
      case 'uphill': return '🔺';
      case 'downhill': return '🔻';
      case 'flat': 
      default: return '➡️';
    }
  };

  // Generate playlist for current cadence
  const generatePlaylistForCurrentCadence = async () => {
    try {
      setIsGeneratingPlaylist(true);
      
      // Load music library if not already loaded
      if (!musicLibraryLoaded) {
        await MusicLibraryService.loadMusicLibrary();
        setMusicLibraryLoaded(true);
      }

      const playlist = await MusicLibraryService.generateCadencePlaylist(cadence, 30, {
        tolerance: 10,
        minSongs: 5,
        includeWarmup: true,
        includeCooldown: true,
      });

      if (!playlist || playlist.tracks.length === 0) {
        Alert.alert(
          'No Matching Songs',
          `Couldn't find enough songs matching ${cadence} SPM. Try a different cadence or add more music to your library.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to generate playlist:', error);
      Alert.alert('Error', 'Failed to generate playlist. Please try again.');
    } finally {
      setIsGeneratingPlaylist(false);
    }
  };

  // Load music library
  const loadMusicLibrary = async () => {
    try {
      console.log('Loading music library...');
      await MusicLibraryService.loadMusicLibrary();
      setMusicLibraryLoaded(true);
      console.log('Music library loaded successfully');
    } catch (error) {
      console.error('Failed to load music library:', error);
      Alert.alert('Error', 'Failed to load music library. Please check permissions.');
    }
  };

  // Load saved playlist
  const loadSavedPlaylist = async (playlistId) => {
    try {
      const playlist = await MusicLibraryService.loadPlaylist(playlistId);
      if (playlist) {
        setCurrentPlaylist(playlist);
        console.log(`Loaded playlist: ${playlist.name}`);
      }
    } catch (error) {
      console.error('Failed to load saved playlist:', error);
    }
  };

  // Authenticate with Spotify
  const authenticateSpotify = async () => {
    try {
      console.log('Starting Spotify authentication...');
      const success = await MusicLibraryService.authenticateSpotify();
      if (success) {
        Alert.alert('Success', 'Connected to Spotify! You can now access millions of songs with accurate BPM data.');
      }
    } catch (error) {
      console.error('Spotify authentication failed:', error);
      Alert.alert('Authentication Failed', 'Could not connect to Spotify. Please try again.');
    }
  };

  // Logout from Spotify
  const logoutSpotify = async () => {
    try {
      await SpotifyService.logout();
      Alert.alert('Logged Out', 'Disconnected from Spotify.');
    } catch (error) {
      console.error('Spotify logout failed:', error);
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': 
      default: return '#F44336';
    }
  };



  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Audio Metronome</Text>
        
        {/* Visual Beat Indicator */}
        <View style={styles.visualSection}>
          <Animated.View 
            style={[
              styles.pulseCircle,
              {
                transform: [{ scale: pulseAnim }],
                backgroundColor: isPlaying ? 'rgba(0, 255, 157, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                borderColor: isPlaying ? '#00FF9D' : 'rgba(255, 255, 255, 0.2)',
              }
            ]}
          >
            <Text style={styles.pulseText}>♪</Text>
          </Animated.View>
          
          {/* Beat Pattern Indicators */}
          <View style={styles.beatIndicators}>
            {beatIndicators.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.beatDot,
                  { opacity: anim }
                ]}
              >
                <Text style={styles.beatLabel}>
                  {index % 2 === 0 ? 'L' : 'R'}
                </Text>
              </Animated.View>
            ))}
          </View>
          
          <Text style={styles.beatCounter}>
            Beat: {currentBeat} | {Math.floor(currentBeat / 4) + 1} cycles
          </Text>
          
          {/* Terrain Indicator (only show in terrain mode) */}
          {mode === 'terrain' && (
            <View style={styles.terrainIndicator}>
              <View style={styles.terrainRow}>
                <Text style={styles.terrainEmoji}>
                  {getTerrainEmoji(terrainData.terrain)}
                </Text>
                <Text style={styles.terrainText}>
                  {terrainData.terrain.charAt(0).toUpperCase() + terrainData.terrain.slice(1)}
                </Text>
                <Text style={styles.gradeText}>
                  {terrainData.grade > 0 ? '+' : ''}{terrainData.grade}%
                </Text>
              </View>
              <View style={styles.adjustmentRow}>
                <Text style={styles.adjustmentText}>
                  Cadence: {baseCadence} → {cadence} SPM
                </Text>
                <View style={[styles.confidenceDot, { backgroundColor: getConfidenceColor(terrainData.confidence) }]} />
                <Text style={styles.confidenceText}>{terrainData.confidence}</Text>
              </View>
              {!isTrackingLocation && (
                <Text style={styles.gpsStatus}>📍 GPS: Waiting for signal...</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.cadenceDisplay}>
          <Text style={styles.cadenceValue}>{cadence}</Text>
          <Text style={styles.cadenceLabel}>SPM</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.adjustButton, isPlaying && styles.adjustButtonDisabled]}
            onPress={() => adjustCadence(-5)}
            disabled={isPlaying}
          >
            <Text style={styles.adjustButtonText}>-5</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.playButton, isPlaying && styles.playButtonActive]}
            onPress={toggleMetronome}
          >
            <Text style={styles.playButtonText}>
              {isPlaying ? '⏸ Stop' : '▶ Start'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.adjustButton, isPlaying && styles.adjustButtonDisabled]}
            onPress={() => adjustCadence(5)}
            disabled={isPlaying}
          >
            <Text style={styles.adjustButtonText}>+5</Text>
          </TouchableOpacity>
        </View>

        {/* Audio Controls */}
        <View style={styles.audioControls}>
          <Text style={styles.controlLabel}>Audio Controls</Text>
          
          <View style={styles.audioRow}>
            <TouchableOpacity 
              style={[styles.audioToggle, audioEnabled && styles.audioToggleActive]}
              onPress={toggleAudio}
            >
              <Text style={styles.audioToggleText}>
                {audioEnabled ? '🔊 Audio On' : '🔇 Audio Off'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.volumeControl}>
            <Text style={styles.volumeLabel}>Volume: {Math.round(volume * 100)}%</Text>
            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={handleVolumeChange}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#ccc"
              thumbStyle={styles.sliderThumb}
            />
          </View>
        </View>

        {/* Presets */}
        <View style={styles.presets}>
          <Text style={styles.presetsTitle}>Quick Presets</Text>
          <View style={styles.presetButtons}>
            {[160, 170, 180, 190].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  cadence === preset && styles.presetButtonActive,
                  isPlaying && styles.presetButtonDisabled
                ]}
                onPress={() => setPresetCadence(preset)}
                disabled={isPlaying}
              >
                <Text style={[
                  styles.presetButtonText,
                  cadence === preset && styles.presetButtonTextActive
                ]}>
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mode Selection */}
        <View style={styles.modeSection}>
          <Text style={styles.modeTitle}>Metronome Modes</Text>
          <View style={styles.modeButtons}>
            {[
              { key: 'basic', label: 'Basic', desc: 'Steady rhythm' },
              { key: 'fartlek', label: 'Fartlek', desc: 'Speed play' },
              { key: 'interval', label: 'Interval', desc: 'Work/rest cycles' },
              { key: 'progressive', label: 'Progressive', desc: 'Build-up runs' },
              { key: 'terrain', label: 'Terrain', desc: 'GPS adaptive' },
            ].map((modeOption) => (
              <TouchableOpacity
                key={modeOption.key}
                style={[
                  styles.modeButton,
                  mode === modeOption.key && styles.modeButtonActive,
                ]}
                onPress={() => handleModeChange(modeOption.key)}
              >
                <Text style={styles.modeButtonLabel}>{modeOption.label}</Text>
                <Text style={styles.modeButtonDesc}>{modeOption.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Music Mode Toggle */}
          <View style={styles.musicModeSection}>
            <Text style={styles.musicModeTitle}>🎵 Audio Mode</Text>
            <View style={styles.musicModeToggle}>
              <TouchableOpacity
                style={[
                  styles.musicModeButton,
                  !musicMode && styles.musicModeButtonActive
                ]}
                onPress={() => setMusicMode(false)}
                disabled={isPlaying}
              >
                <Text style={[
                  styles.musicModeButtonText,
                  !musicMode && styles.musicModeButtonTextActive
                ]}>
                  🎵 Metronome
                </Text>
                <Text style={styles.musicModeButtonDesc}>Audio beats</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.musicModeButton,
                  musicMode && styles.musicModeButtonActive
                ]}
                onPress={() => setMusicMode(true)}
                disabled={isPlaying}
              >
                <Text style={[
                  styles.musicModeButtonText,
                  musicMode && styles.musicModeButtonTextActive
                ]}>
                  🎶 Music
                </Text>
                <Text style={styles.musicModeButtonDesc}>Songs at cadence</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Fartlek Mode Configuration */}
          {mode === 'fartlek' && (
            <View style={styles.fartlekConfig}>
              <Text style={styles.fartlekConfigTitle}>🏃‍♂️ Fartlek Configuration</Text>
              
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Difficulty Level:</Text>
                <View style={styles.difficultyButtons}>
                  {[
                    { key: 'beginner', label: 'Beginner', desc: 'Gentle changes' },
                    { key: 'intermediate', label: 'Intermediate', desc: 'Moderate changes' },
                    { key: 'advanced', label: 'Advanced', desc: 'Challenging' },
                    { key: 'elite', label: 'Elite', desc: 'Maximum intensity' },
                  ].map((difficulty) => (
                    <TouchableOpacity
                      key={difficulty.key}
                      style={[
                        styles.difficultyButton,
                        fartlekDifficulty === difficulty.key && styles.difficultyButtonActive
                      ]}
                      onPress={() => setFartlekDifficulty(difficulty.key)}
                      disabled={isPlaying}
                    >
                      <Text style={[
                        styles.difficultyButtonText,
                        fartlekDifficulty === difficulty.key && styles.difficultyButtonTextActive
                      ]}>
                        {difficulty.label}
                      </Text>
                      <Text style={styles.difficultyButtonDesc}>{difficulty.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.configRow}>
                <TouchableOpacity 
                  style={[styles.coachingToggle, coachingEnabled && styles.coachingToggleActive]}
                  onPress={() => setCoachingEnabled(!coachingEnabled)}
                  disabled={isPlaying}
                >
                  <Text style={styles.coachingToggleText}>
                    {coachingEnabled ? '🗣️ Coaching Voice: ON' : '🔇 Coaching Voice: OFF'}
                  </Text>
                  <Text style={styles.coachingToggleDesc}>
                    {coachingEnabled ? 'Voice guidance enabled' : 'Silent workout mode'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fartlekInfo}>
                <Text style={styles.fartlekInfoText}>
                  Fartlek ("speed play") varies your cadence randomly during the workout. 
                  The difficulty level controls how often and how much your cadence changes.
                </Text>
                <Text style={styles.fartlekInfoBullet}>• Duration: 30 minutes</Text>
                <Text style={styles.fartlekInfoBullet}>• Base cadence: {cadence} SPM</Text>
                <Text style={styles.fartlekInfoBullet}>• Terrain aware: GPS adjustments included</Text>
              </View>
            </View>
          )}

          {/* Music Mode Configuration */}
          {musicMode && (
            <View style={styles.musicConfig}>
              <Text style={styles.musicConfigTitle}>🎶 Music Configuration</Text>
              
              {/* Spotify Integration */}
              <View style={styles.spotifySection}>
                <Text style={styles.spotifySectionTitle}>🎵 Spotify Integration</Text>
                
                {spotifyAuthenticated ? (
                  <View style={styles.spotifyConnected}>
                    <View style={styles.spotifyUserInfo}>
                      <Text style={styles.spotifyUserName}>
                        ✅ Connected as {spotifyUser?.display_name || 'Spotify User'}
                      </Text>
                      <Text style={styles.spotifyUserDetails}>
                        Access to millions of songs with accurate BPM data
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.spotifyLogoutButton}
                      onPress={logoutSpotify}
                      disabled={isPlaying}
                    >
                      <Text style={styles.spotifyLogoutButtonText}>Disconnect</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.spotifyDisconnected}>
                    <Text style={styles.spotifyBenefits}>
                      Connect to Spotify for:
                    </Text>
                    <Text style={styles.spotifyBenefit}>• Millions of songs with accurate BPM</Text>
                    <Text style={styles.spotifyBenefit}>• Professional audio analysis</Text>
                    <Text style={styles.spotifyBenefit}>• Create playlists in your account</Text>
                    <Text style={styles.spotifyBenefit}>• High-quality streaming (Premium)</Text>
                    
                    <TouchableOpacity
                      style={styles.spotifyConnectButton}
                      onPress={authenticateSpotify}
                      disabled={isPlaying}
                    >
                      <Text style={styles.spotifyConnectButtonText}>🎵 Connect to Spotify</Text>
                      <Text style={styles.spotifyConnectButtonDesc}>Free account works great!</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Current Track Display */}
              {currentTrack && (
                <View style={styles.currentTrack}>
                  <Text style={styles.currentTrackTitle}>Now Playing:</Text>
                  <Text style={styles.currentTrackName}>{currentTrack.title}</Text>
                  <Text style={styles.currentTrackArtist}>{currentTrack.artist}</Text>
                  <Text style={styles.currentTrackBpm}>
                    {currentTrack.bpm} BPM • {currentTrack.matchType} match • {currentTrack.matchQuality}% quality
                  </Text>
                </View>
              )}

              {/* Playlist Status */}
              {currentPlaylist && (
                <View style={styles.playlistStatus}>
                  <Text style={styles.playlistStatusTitle}>Current Playlist:</Text>
                  <Text style={styles.playlistStatusName}>{currentPlaylist.name}</Text>
                  <Text style={styles.playlistStatusInfo}>
                    {currentPlaylist.tracks.length} songs • {Math.round(currentPlaylist.actualDuration / 60)} minutes
                  </Text>
                </View>
              )}

              {/* Generate Playlist Button */}
              <TouchableOpacity
                style={[
                  styles.generatePlaylistButton,
                  isGeneratingPlaylist && styles.generatePlaylistButtonDisabled
                ]}
                onPress={() => generatePlaylistForCurrentCadence()}
                disabled={isGeneratingPlaylist || isPlaying}
              >
                <Text style={styles.generatePlaylistButtonText}>
                  {isGeneratingPlaylist 
                    ? '🔄 Generating Playlist...' 
                    : `🎵 Generate ${cadence} SPM Playlist`
                  }
                </Text>
                <Text style={styles.generatePlaylistButtonDesc}>
                  Find songs matching your target cadence
                </Text>
              </TouchableOpacity>

              {/* Saved Playlists */}
              {savedPlaylists.length > 0 && (
                <View style={styles.savedPlaylists}>
                  <Text style={styles.savedPlaylistsTitle}>Saved Playlists:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {savedPlaylists.slice(0, 5).map((playlist) => (
                      <TouchableOpacity
                        key={playlist.id}
                        style={[
                          styles.savedPlaylistItem,
                          currentPlaylist?.id === playlist.id && styles.savedPlaylistItemActive
                        ]}
                        onPress={() => loadSavedPlaylist(playlist.id)}
                        disabled={isPlaying}
                      >
                        <Text style={styles.savedPlaylistCadence}>{playlist.targetCadence} SPM</Text>
                        <Text style={styles.savedPlaylistTracks}>{playlist.trackCount} songs</Text>
                        <Text style={styles.savedPlaylistDuration}>{Math.round(playlist.duration / 60)}min</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Music Library Status */}
              <View style={styles.musicLibraryStatus}>
                <Text style={styles.musicLibraryStatusText}>
                  📱 Library: {musicLibraryLoaded ? `${MusicLibraryService.musicLibrary.length} songs` : 'Not loaded'}
                </Text>
                <Text style={styles.musicLibraryStatusText}>
                  🎯 BPM Cache: {MusicLibraryService.bpmCache.size} analyzed
                </Text>
                {!musicLibraryLoaded && (
                  <TouchableOpacity
                    style={styles.loadLibraryButton}
                    onPress={loadMusicLibrary}
                    disabled={isPlaying}
                  >
                    <Text style={styles.loadLibraryButtonText}>📚 Load Music Library</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.musicInfo}>
                <Text style={styles.musicInfoText}>
                  Music mode plays songs from your device that match your target cadence. 
                  The app analyzes BPM and finds the best matches for your workout.
                </Text>
                <Text style={styles.musicInfoBullet}>• 1:1 ratio: 180 SPM = 180 BPM songs</Text>
                <Text style={styles.musicInfoBullet}>• 2:1 ratio: 180 SPM = 90 BPM songs (double time)</Text>
                <Text style={styles.musicInfoBullet}>• Includes warmup and cooldown tracks</Text>
              </View>
            </View>
          )}

          {/* Interval Mode Configuration */}
          {mode === 'interval' && (
            <View style={styles.intervalConfig}>
              <Text style={styles.intervalConfigTitle}>⏱️ Interval Configuration</Text>
              
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Workout Structure:</Text>
                <View style={styles.intervalInputs}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Intervals:</Text>
                    <View style={styles.numberInput}>
                      <TouchableOpacity 
                        style={styles.numberButton}
                        onPress={() => setIntervalConfig(prev => ({...prev, intervals: Math.max(1, prev.intervals - 1)}))}
                        disabled={isPlaying}
                      >
                        <Text style={styles.numberButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.numberValue}>{intervalConfig.intervals}</Text>
                      <TouchableOpacity 
                        style={styles.numberButton}
                        onPress={() => setIntervalConfig(prev => ({...prev, intervals: Math.min(10, prev.intervals + 1)}))}
                        disabled={isPlaying}
                      >
                        <Text style={styles.numberButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Work (min):</Text>
                    <View style={styles.numberInput}>
                      <TouchableOpacity 
                        style={styles.numberButton}
                        onPress={() => setIntervalConfig(prev => ({...prev, workDuration: Math.max(60, prev.workDuration - 60)}))}
                        disabled={isPlaying}
                      >
                        <Text style={styles.numberButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.numberValue}>{Math.round(intervalConfig.workDuration/60)}</Text>
                      <TouchableOpacity 
                        style={styles.numberButton}
                        onPress={() => setIntervalConfig(prev => ({...prev, workDuration: Math.min(600, prev.workDuration + 60)}))}
                        disabled={isPlaying}
                      >
                        <Text style={styles.numberButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Rest (min):</Text>
                    <View style={styles.numberInput}>
                      <TouchableOpacity 
                        style={styles.numberButton}
                        onPress={() => setIntervalConfig(prev => ({...prev, restDuration: Math.max(30, prev.restDuration - 30)}))}
                        disabled={isPlaying}
                      >
                        <Text style={styles.numberButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.numberValue}>{Math.round(intervalConfig.restDuration/60)}</Text>
                      <TouchableOpacity 
                        style={styles.numberButton}
                        onPress={() => setIntervalConfig(prev => ({...prev, restDuration: Math.min(300, prev.restDuration + 30)}))}
                        disabled={isPlaying}
                      >
                        <Text style={styles.numberButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Cadence Targets:</Text>
                <View style={styles.cadenceInputs}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Work SPM:</Text>
                    <View style={styles.numberInput}>
                      <TouchableOpacity 
                        style={styles.numberButton}
                        onPress={() => setIntervalConfig(prev => ({...prev, workCadence: Math.max(150, prev.workCadence - 5)}))}
                        disabled={isPlaying}
                      >
                        <Text style={styles.numberButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.numberValue}>{intervalConfig.workCadence}</Text>
                      <TouchableOpacity 
                        style={styles.numberButton}
                        onPress={() => setIntervalConfig(prev => ({...prev, workCadence: Math.min(200, prev.workCadence + 5)}))}
                        disabled={isPlaying}
                      >
                        <Text style={styles.numberButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Rest SPM:</Text>
                    <View style={styles.numberInput}>
                      <TouchableOpacity 
                        style={styles.numberButton}
                        onPress={() => setIntervalConfig(prev => ({...prev, restCadence: Math.max(140, prev.restCadence - 5)}))}
                        disabled={isPlaying}
                      >
                        <Text style={styles.numberButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.numberValue}>{intervalConfig.restCadence}</Text>
                      <TouchableOpacity 
                        style={styles.numberButton}
                        onPress={() => setIntervalConfig(prev => ({...prev, restCadence: Math.min(180, prev.restCadence + 5)}))}
                        disabled={isPlaying}
                      >
                        <Text style={styles.numberButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.configRow}>
                <TouchableOpacity 
                  style={[styles.coachingToggle, coachingEnabled && styles.coachingToggleActive]}
                  onPress={() => setCoachingEnabled(!coachingEnabled)}
                  disabled={isPlaying}
                >
                  <Text style={styles.coachingToggleText}>
                    {coachingEnabled ? '🗣️ Coaching Voice: ON' : '🔇 Coaching Voice: OFF'}
                  </Text>
                  <Text style={styles.coachingToggleDesc}>
                    {coachingEnabled ? 'Voice guidance enabled' : 'Silent workout mode'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.intervalInfo}>
                <Text style={styles.intervalInfoText}>
                  Structured intervals with work/rest cycles. Includes 5-minute warmup and cooldown.
                </Text>
                <Text style={styles.intervalInfoBullet}>• Total time: ~{Math.round((300 + (intervalConfig.workDuration + intervalConfig.restDuration) * intervalConfig.intervals - intervalConfig.restDuration + 300) / 60)} minutes</Text>
                <Text style={styles.intervalInfoBullet}>• Work intervals: {intervalConfig.intervals}x{Math.round(intervalConfig.workDuration/60)}min at {intervalConfig.workCadence} SPM</Text>
                <Text style={styles.intervalInfoBullet}>• Recovery: {Math.round(intervalConfig.restDuration/60)}min at {intervalConfig.restCadence} SPM</Text>
              </View>
            </View>
          )}

          {/* Progressive Mode Configuration */}
          {mode === 'progressive' && (
            <View style={styles.progressiveConfig}>
              <Text style={styles.progressiveConfigTitle}>📈 Progressive Configuration</Text>
              
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Workout Duration:</Text>
                <View style={styles.durationButtons}>
                  {[15, 20, 30, 45].map((minutes) => (
                    <TouchableOpacity
                      key={minutes}
                      style={[
                        styles.durationButton,
                        progressiveConfig.duration === minutes * 60 && styles.durationButtonActive
                      ]}
                      onPress={() => setProgressiveConfig(prev => ({...prev, duration: minutes * 60}))}
                      disabled={isPlaying}
                    >
                      <Text style={[
                        styles.durationButtonText,
                        progressiveConfig.duration === minutes * 60 && styles.durationButtonTextActive
                      ]}>
                        {minutes}min
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Cadence Range:</Text>
                <View style={styles.cadenceInputs}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Start SPM:</Text>
                    <View style={styles.numberInput}>
                      <TouchableOpacity 
                        style={styles.numberButton}
                        onPress={() => setProgressiveConfig(prev => ({...prev, startCadence: Math.max(140, prev.startCadence - 5)}))}
                        disabled={isPlaying}
                      >
                        <Text style={styles.numberButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.numberValue}>{progressiveConfig.startCadence}</Text>
                      <TouchableOpacity 
                        style={styles.numberButton}
                        onPress={() => setProgressiveConfig(prev => ({...prev, startCadence: Math.min(180, prev.startCadence + 5)}))}
                        disabled={isPlaying}
                      >
                        <Text style={styles.numberButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>End SPM:</Text>
                    <View style={styles.numberInput}>
                      <TouchableOpacity 
                        style={styles.numberButton}
                        onPress={() => setProgressiveConfig(prev => ({...prev, endCadence: Math.max(160, prev.endCadence - 5)}))}
                        disabled={isPlaying}
                      >
                        <Text style={styles.numberButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.numberValue}>{progressiveConfig.endCadence}</Text>
                      <TouchableOpacity 
                        style={styles.numberButton}
                        onPress={() => setProgressiveConfig(prev => ({...prev, endCadence: Math.min(200, prev.endCadence + 5)}))}
                        disabled={isPlaying}
                      >
                        <Text style={styles.numberButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Progression Type:</Text>
                <View style={styles.progressionButtons}>
                  {[
                    { key: 'linear', label: 'Linear', desc: 'Steady build' },
                    { key: 'exponential', label: 'Exponential', desc: 'Slow start' },
                    { key: 'stepped', label: 'Stepped', desc: 'Discrete jumps' },
                  ].map((progression) => (
                    <TouchableOpacity
                      key={progression.key}
                      style={[
                        styles.progressionButton,
                        progressiveConfig.progressionType === progression.key && styles.progressionButtonActive
                      ]}
                      onPress={() => setProgressiveConfig(prev => ({...prev, progressionType: progression.key}))}
                      disabled={isPlaying}
                    >
                      <Text style={[
                        styles.progressionButtonText,
                        progressiveConfig.progressionType === progression.key && styles.progressionButtonTextActive
                      ]}>
                        {progression.label}
                      </Text>
                      <Text style={styles.progressionButtonDesc}>{progression.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.configRow}>
                <TouchableOpacity 
                  style={[styles.coachingToggle, coachingEnabled && styles.coachingToggleActive]}
                  onPress={() => setCoachingEnabled(!coachingEnabled)}
                  disabled={isPlaying}
                >
                  <Text style={styles.coachingToggleText}>
                    {coachingEnabled ? '🗣️ Coaching Voice: ON' : '🔇 Coaching Voice: OFF'}
                  </Text>
                  <Text style={styles.coachingToggleDesc}>
                    {coachingEnabled ? 'Voice guidance enabled' : 'Silent workout mode'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.progressiveInfo}>
                <Text style={styles.progressiveInfoText}>
                  Gradually build your cadence from start to finish. Perfect for tempo runs and threshold training.
                </Text>
                <Text style={styles.progressiveInfoBullet}>• Duration: {Math.round(progressiveConfig.duration/60)} minutes</Text>
                <Text style={styles.progressiveInfoBullet}>• Build from {progressiveConfig.startCadence} to {progressiveConfig.endCadence} SPM</Text>
                <Text style={styles.progressiveInfoBullet}>• Progression: {progressiveConfig.progressionType}</Text>
              </View>
            </View>
          )}

          {/* Workout Status Display */}
          {workoutStatus.active && (
            <View style={styles.workoutStatus}>
              <Text style={styles.workoutStatusTitle}>🏃‍♂️ Workout Active</Text>
              
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Workout:</Text>
                <Text style={styles.statusValue}>{workoutStatus.workout?.name}</Text>
              </View>
              
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Phase:</Text>
                <Text style={styles.statusValue}>
                  {workoutStatus.currentPhase + 1} of {workoutStatus.workout?.phases?.length}
                </Text>
              </View>
              
              {workoutStatus.phase && (
                <View style={styles.currentPhase}>
                  <View style={styles.phaseHeader}>
                    <Text style={styles.phaseIntensity}>
                      {workoutStatus.phase.intensity === 'hard' ? '🔥' : 
                       workoutStatus.phase.intensity === 'easy' ? '😌' : '⚡'}
                    </Text>
                    <Text style={styles.phaseType}>
                      {workoutStatus.phase.intensity.toUpperCase()} PHASE
                    </Text>
                  </View>
                  
                  <View style={styles.phaseProgress}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${(workoutStatus.phaseProgress || 0) * 100}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {Math.round((workoutStatus.phaseProgress || 0) * 100)}%
                    </Text>
                  </View>
                  
                  <View style={styles.phaseStats}>
                    <Text style={styles.phaseStat}>
                      Time remaining: {Math.round(workoutStatus.phaseTimeRemaining || 0)}s
                    </Text>
                    <Text style={styles.phaseStat}>
                      Target cadence: {workoutStatus.phase.cadence} SPM
                    </Text>
                  </View>
                </View>
              )}
              
              <View style={styles.workoutProgress}>
                <Text style={styles.workoutProgressLabel}>Overall Progress</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(workoutStatus.workoutProgress || 0) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.workoutProgressText}>
                  {Math.round(workoutStatus.timeRemaining / 60)} minutes remaining
                </Text>
              </View>
            </View>
          )}
          
          {/* Terrain Mode Info */}
          {mode === 'terrain' && (
            <View style={styles.terrainInfo}>
              <Text style={styles.terrainInfoTitle}>🏔️ Terrain Mode Active</Text>
              <Text style={styles.terrainInfoText}>
                Cadence automatically adjusts based on GPS-detected terrain:
              </Text>
              <Text style={styles.terrainInfoBullet}>• 🔺 Uphill: +5-10 SPM</Text>
              <Text style={styles.terrainInfoBullet}>• 🔻 Downhill: -3-8 SPM</Text>
              <Text style={styles.terrainInfoBullet}>• ➡️ Flat: No adjustment</Text>
              <Text style={styles.terrainInfoNote}>
                Note: Requires GPS signal. Best used outdoors.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A', // Deep black background
  },
  section: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 24,
    textAlign: 'center',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  visualSection: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Glass morphism
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  pulseCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'rgba(0, 255, 157, 0.3)', // Neon green border
    shadowColor: '#00FF9D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  pulseText: {
    fontSize: 56,
    color: '#00FF9D', // Neon green
    textShadowColor: '#00FF9D',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  beatIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 220,
    marginBottom: 20,
  },
  beatDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 255, 157, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 157, 0.4)',
  },
  beatLabel: {
    color: '#00FF9D',
    fontSize: 16,
    fontWeight: '800',
    textShadowColor: '#00FF9D',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  beatCounter: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '600',
  },
  cadenceDisplay: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cadenceValue: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 255, 157, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  cadenceLabel: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    fontWeight: '700',
    letterSpacing: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  adjustButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  adjustButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    opacity: 0.4,
  },
  adjustButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00FF9D',
    textShadowColor: '#00FF9D',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  playButton: {
    backgroundColor: '#00FF9D', // Solid neon green
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 35,
    shadowColor: '#00FF9D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 157, 0.3)',
  },
  playButtonActive: {
    backgroundColor: '#FF3B30', // Solid red for stop
    shadowColor: '#FF3B30',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  playButtonText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  audioControls: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  audioRow: {
    marginBottom: 16,
  },
  audioToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  audioToggleActive: {
    backgroundColor: 'rgba(0, 255, 157, 0.15)',
    borderColor: 'rgba(0, 255, 157, 0.3)',
    shadowColor: '#00FF9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  audioToggleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  volumeControl: {
    marginTop: 12,
  },
  volumeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
    fontWeight: '600',
  },
  volumeSlider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#00FF9D',
    width: 24,
    height: 24,
    shadowColor: '#00FF9D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  presets: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  presetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: 'rgba(0, 255, 157, 0.15)',
    borderColor: '#00FF9D',
    shadowColor: '#00FF9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  presetButtonDisabled: {
    opacity: 0.4,
  },
  presetButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  presetButtonTextActive: {
    color: '#00FF9D',
    textShadowColor: '#00FF9D',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  modeSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(0, 255, 157, 0.15)',
    borderColor: '#00FF9D',
    shadowColor: '#00FF9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modeButtonDisabled: {
    opacity: 0.4,
  },
  modeButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  modeButtonDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Terrain Indicator Styles
  terrainIndicator: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  terrainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  terrainEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  terrainText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginRight: 12,
    textShadowColor: 'rgba(76, 175, 80, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gradeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustmentText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
    fontWeight: '500',
  },
  confidenceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  confidenceText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  gpsStatus: {
    fontSize: 12,
    color: '#FF9800',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  terrainInfo: {
    marginTop: 16,
    padding: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  terrainInfoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4CAF50',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  terrainInfoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
  terrainInfoBullet: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
    paddingLeft: 12,
    lineHeight: 18,
  },
  terrainInfoNote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
  // Fartlek Configuration Styles
  fartlekConfig: {
    marginTop: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  fartlekConfigTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF9800',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 152, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  configRow: {
    marginBottom: 20,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  difficultyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  difficultyButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderColor: '#FF9800',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  difficultyButtonTextActive: {
    color: '#FF9800',
    textShadowColor: 'rgba(255, 152, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  difficultyButtonDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontWeight: '500',
  },
  coachingToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
  },
  coachingToggleActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: 'rgba(76, 175, 80, 0.4)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  coachingToggleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  coachingToggleDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  fartlekInfo: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
  },
  fartlekInfoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  fartlekInfoBullet: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    paddingLeft: 12,
    lineHeight: 16,
  },
  // Workout Status Styles
  workoutStatus: {
    marginTop: 16,
    padding: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  workoutStatusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2196F3',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(33, 150, 243, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statusValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
    textShadowColor: 'rgba(33, 150, 243, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  currentPhase: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phaseIntensity: {
    fontSize: 24,
    marginRight: 12,
  },
  phaseType: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2196F3',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(33, 150, 243, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  phaseProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FF9D',
    borderRadius: 5,
    shadowColor: '#00FF9D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '700',
    minWidth: 40,
  },
  phaseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phaseStat: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  workoutProgress: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
  },
  workoutProgressLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  workoutProgressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  // Interval Configuration Styles
  intervalConfig: {
    marginTop: 16,
    padding: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  intervalConfigTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4CAF50',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(76, 175, 80, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  intervalInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  cadenceInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  numberButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  numberButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00FF9D',
    textShadowColor: 'rgba(0, 255, 157, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  numberValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 36,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  intervalInfo: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'rgba(139, 195, 74, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 195, 74, 0.2)',
  },
  intervalInfoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  intervalInfoBullet: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    paddingLeft: 12,
    lineHeight: 16,
  },
  // Progressive Configuration Styles
  progressiveConfig: {
    marginTop: 16,
    padding: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  progressiveConfigTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2196F3',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(33, 150, 243, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  durationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  durationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  durationButtonActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderColor: '#2196F3',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  durationButtonTextActive: {
    color: '#2196F3',
    textShadowColor: 'rgba(33, 150, 243, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  progressionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  progressionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  progressionButtonActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderColor: '#2196F3',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  progressionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  progressionButtonTextActive: {
    color: '#2196F3',
    textShadowColor: 'rgba(33, 150, 243, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  progressionButtonDesc: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontWeight: '500',
  },
  progressiveInfo: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'rgba(63, 81, 181, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(63, 81, 181, 0.2)',
  },
  progressiveInfoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  progressiveInfoBullet: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    paddingLeft: 12,
    lineHeight: 16,
  },
  // Music Mode Styles
  musicModeSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  musicModeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  musicModeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  musicModeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  musicModeButtonActive: {
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    borderColor: '#8A2BE2',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  musicModeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  musicModeButtonTextActive: {
    color: '#8A2BE2',
    textShadowColor: 'rgba(138, 43, 226, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  musicModeButtonDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Music Configuration Styles
  musicConfig: {
    marginTop: 16,
    padding: 20,
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  musicConfigTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8A2BE2',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(138, 43, 226, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  currentTrack: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentTrackTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  currentTrackName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 4,
    textShadowColor: 'rgba(138, 43, 226, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  currentTrackArtist: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontWeight: '600',
  },
  currentTrackBpm: {
    fontSize: 12,
    color: '#8A2BE2',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  playlistStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playlistStatusTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  playlistStatusName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 4,
  },
  playlistStatusInfo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  generatePlaylistButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.4)',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  generatePlaylistButtonDisabled: {
    opacity: 0.5,
  },
  generatePlaylistButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8A2BE2',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  generatePlaylistButtonDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  savedPlaylists: {
    marginBottom: 16,
  },
  savedPlaylistsTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  savedPlaylistItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    minWidth: 80,
  },
  savedPlaylistItemActive: {
    backgroundColor: 'rgba(138, 43, 226, 0.2)',
    borderColor: '#8A2BE2',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  savedPlaylistCadence: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8A2BE2',
    marginBottom: 2,
  },
  savedPlaylistTracks: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
    fontWeight: '600',
  },
  savedPlaylistDuration: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  musicLibraryStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  musicLibraryStatusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    fontWeight: '500',
  },
  loadLibraryButton: {
    backgroundColor: 'rgba(138, 43, 226, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(138, 43, 226, 0.3)',
  },
  loadLibraryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A2BE2',
    letterSpacing: 0.3,
  },
  musicInfo: {
    backgroundColor: 'rgba(147, 112, 219, 0.08)',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(147, 112, 219, 0.2)',
  },
  musicInfoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  musicInfoBullet: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    paddingLeft: 12,
    lineHeight: 16,
  },
  // Spotify Integration Styles
  spotifySection: {
    backgroundColor: 'rgba(30, 215, 96, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 215, 96, 0.3)',
  },
  spotifySectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1ED760',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(30, 215, 96, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  spotifyConnected: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotifyUserInfo: {
    flex: 1,
  },
  spotifyUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1ED760',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  spotifyUserDetails: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  spotifyLogoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  spotifyLogoutButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.3,
  },
  spotifyDisconnected: {
    alignItems: 'center',
  },
  spotifyBenefits: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  spotifyBenefit: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    fontWeight: '500',
  },
  spotifyConnectButton: {
    backgroundColor: '#1ED760',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
    shadowColor: '#1ED760',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spotifyConnectButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  spotifyConnectButtonDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.7)',
  },
});
