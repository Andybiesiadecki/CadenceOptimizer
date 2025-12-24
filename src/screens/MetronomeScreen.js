import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import MetronomeService from '../services/MetronomeService';
import LocationService from '../services/LocationService';
import TerrainDetector from '../services/TerrainDetector';
import WorkoutEngine from '../services/WorkoutEngine';
import CoachingVoiceService from '../services/CoachingVoiceService';

export default function MetronomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [cadence, setCadence] = useState(170);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [mode, setMode] = useState('basic'); // basic, interval, progressive, terrain, fartlek
  
  // Fartlek mode states
  const [workoutStatus, setWorkoutStatus] = useState({ active: false });
  const [coachingEnabled, setCoachingEnabled] = useState(true);
  const [fartlekDifficulty, setFartlekDifficulty] = useState('intermediate');
  
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

    return () => {
      // Cleanup when component unmounts
      MetronomeService.cleanup();
      WorkoutEngine.stopWorkout();
      CoachingVoiceService.stopSpeaking();
      stopLocationTracking();
    };
  }, []);

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
      MetronomeService.stop();
      WorkoutEngine.stopWorkout();
      setIsPlaying(false);
      setCurrentBeat(0);
      setWorkoutStatus({ active: false });
      
      // Stop location tracking if in terrain mode
      if (mode === 'terrain') {
        await stopLocationTracking();
      }
    } else {
      // Start location tracking if in terrain mode
      if (mode === 'terrain') {
        await startLocationTracking();
      }
      
      // Start Fartlek workout if in fartlek mode
      if (mode === 'fartlek') {
        await startFartlekWorkout();
      } else {
        await MetronomeService.start(cadence, handleBeat);
      }
      
      setIsPlaying(true);
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
    
    // Reset workout status when leaving fartlek mode
    if (mode === 'fartlek' && newMode !== 'fartlek') {
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
                backgroundColor: isPlaying ? '#007AFF' : '#ccc',
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
              { key: 'interval', label: 'Interval', desc: 'Coming soon' },
              { key: 'progressive', label: 'Progressive', desc: 'Coming soon' },
              { key: 'terrain', label: 'Terrain', desc: 'GPS adaptive' },
            ].map((modeOption) => (
              <TouchableOpacity
                key={modeOption.key}
                style={[
                  styles.modeButton,
                  mode === modeOption.key && styles.modeButtonActive,
                  (modeOption.key !== 'basic' && modeOption.key !== 'terrain' && modeOption.key !== 'fartlek') && styles.modeButtonDisabled
                ]}
                onPress={() => (modeOption.key === 'basic' || modeOption.key === 'terrain' || modeOption.key === 'fartlek') && handleModeChange(modeOption.key)}
                disabled={modeOption.key !== 'basic' && modeOption.key !== 'terrain' && modeOption.key !== 'fartlek'}
              >
                <Text style={styles.modeButtonLabel}>{modeOption.label}</Text>
                <Text style={styles.modeButtonDesc}>{modeOption.desc}</Text>
              </TouchableOpacity>
            ))}
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
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#333',
  },
  visualSection: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  pulseText: {
    fontSize: 48,
    color: '#fff',
  },
  beatIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 16,
  },
  beatDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  beatLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  beatCounter: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  cadenceDisplay: {
    alignItems: 'center',
    marginBottom: 32,
  },
  cadenceValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cadenceLabel: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  adjustButton: {
    backgroundColor: '#fff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adjustButtonDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  adjustButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  playButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  playButtonActive: {
    backgroundColor: '#FF3B30',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  audioControls: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  audioRow: {
    marginBottom: 16,
  },
  audioToggle: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  audioToggleActive: {
    backgroundColor: '#E3F2FD',
  },
  audioToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  volumeControl: {
    marginTop: 8,
  },
  volumeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  volumeSlider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#007AFF',
  },
  presets: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  presetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presetButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  presetButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  presetButtonDisabled: {
    opacity: 0.6,
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  presetButtonTextActive: {
    color: '#007AFF',
  },
  modeSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  modeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modeButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  modeButtonDisabled: {
    opacity: 0.5,
  },
  modeButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  modeButtonDesc: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  terrainIndicator: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  terrainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  terrainEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  terrainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  gradeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  adjustmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustmentText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  confidenceText: {
    fontSize: 11,
    color: '#666',
    textTransform: 'capitalize',
  },
  gpsStatus: {
    fontSize: 11,
    color: '#FF9800',
    textAlign: 'center',
    marginTop: 4,
  },
  terrainInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  terrainInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'center',
  },
  terrainInfoText: {
    fontSize: 13,
    color: '#388E3C',
    marginBottom: 8,
    textAlign: 'center',
  },
  terrainInfoBullet: {
    fontSize: 12,
    color: '#388E3C',
    marginBottom: 4,
    paddingLeft: 8,
  },
  terrainInfoNote: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  // Fartlek Configuration Styles
  fartlekConfig: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  fartlekConfigTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 12,
    textAlign: 'center',
  },
  configRow: {
    marginBottom: 16,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  difficultyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  difficultyButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  difficultyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  difficultyButtonTextActive: {
    color: '#E65100',
  },
  difficultyButtonDesc: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  coachingToggle: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  coachingToggleActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  coachingToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  coachingToggleDesc: {
    fontSize: 12,
    color: '#666',
  },
  fartlekInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 6,
  },
  fartlekInfoText: {
    fontSize: 12,
    color: '#F57F17',
    marginBottom: 8,
    textAlign: 'center',
  },
  fartlekInfoBullet: {
    fontSize: 11,
    color: '#F57F17',
    marginBottom: 2,
    paddingLeft: 8,
  },
  // Workout Status Styles
  workoutStatus: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  workoutStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#0D47A1',
    fontWeight: '600',
  },
  currentPhase: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseIntensity: {
    fontSize: 20,
    marginRight: 8,
  },
  phaseType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
  },
  phaseProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    minWidth: 35,
  },
  phaseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phaseStat: {
    fontSize: 11,
    color: '#666',
  },
  workoutProgress: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  workoutProgressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  workoutProgressText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
});
