import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import MetronomeService from '../services/MetronomeService';
import LocationService from '../services/LocationService';
import TerrainDetector from '../services/TerrainDetector';

export default function MetronomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [cadence, setCadence] = useState(170);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [mode, setMode] = useState('basic'); // basic, interval, progressive, terrain
  
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
    return () => {
      // Cleanup when component unmounts
      MetronomeService.cleanup();
      stopLocationTracking();
    };
  }, []);

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
      setIsPlaying(false);
      setCurrentBeat(0);
      
      // Stop location tracking if in terrain mode
      if (mode === 'terrain') {
        await stopLocationTracking();
      }
    } else {
      // Start location tracking if in terrain mode
      if (mode === 'terrain') {
        await startLocationTracking();
      }
      
      await MetronomeService.start(cadence, handleBeat);
      setIsPlaying(true);
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
    
    // Set new mode
    setMode(newMode);
    
    // If switching to terrain mode, set base cadence
    if (newMode === 'terrain') {
      setBaseCadence(cadence);
    }
    
    // Restart if was playing
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
              { key: 'interval', label: 'Interval', desc: 'Coming soon' },
              { key: 'progressive', label: 'Progressive', desc: 'Coming soon' },
              { key: 'terrain', label: 'Terrain', desc: 'GPS adaptive' },
            ].map((modeOption) => (
              <TouchableOpacity
                key={modeOption.key}
                style={[
                  styles.modeButton,
                  mode === modeOption.key && styles.modeButtonActive,
                  (modeOption.key !== 'basic' && modeOption.key !== 'terrain') && styles.modeButtonDisabled
                ]}
                onPress={() => (modeOption.key === 'basic' || modeOption.key === 'terrain') && handleModeChange(modeOption.key)}
                disabled={modeOption.key !== 'basic' && modeOption.key !== 'terrain'}
              >
                <Text style={styles.modeButtonLabel}>{modeOption.label}</Text>
                <Text style={styles.modeButtonDesc}>{modeOption.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
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
});
