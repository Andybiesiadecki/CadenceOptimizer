import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import Slider from '@react-native-community/slider';
import MetronomeService from '../services/MetronomeService';

export default function MetronomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [cadence, setCadence] = useState(170);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [mode, setMode] = useState('basic'); // basic, interval, progressive, terrain
  
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
    };
  }, []);

  const toggleMetronome = async () => {
    if (isPlaying) {
      MetronomeService.stop();
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
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
    
    if (isPlaying) {
      await MetronomeService.updateBpm(newCadence, handleBeat);
    }
  };

  const setPresetCadence = async (newCadence) => {
    setCadence(newCadence);
    
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

        {/* Mode Selection (Future Feature) */}
        <View style={styles.modeSection}>
          <Text style={styles.modeTitle}>Metronome Modes</Text>
          <View style={styles.modeButtons}>
            {[
              { key: 'basic', label: 'Basic', desc: 'Steady rhythm' },
              { key: 'interval', label: 'Interval', desc: 'Coming soon' },
              { key: 'progressive', label: 'Progressive', desc: 'Coming soon' },
              { key: 'terrain', label: 'Terrain', desc: 'Coming soon' },
            ].map((modeOption) => (
              <TouchableOpacity
                key={modeOption.key}
                style={[
                  styles.modeButton,
                  mode === modeOption.key && styles.modeButtonActive,
                  modeOption.key !== 'basic' && styles.modeButtonDisabled
                ]}
                onPress={() => modeOption.key === 'basic' && setMode(modeOption.key)}
                disabled={modeOption.key !== 'basic'}
              >
                <Text style={styles.modeButtonLabel}>{modeOption.label}</Text>
                <Text style={styles.modeButtonDesc}>{modeOption.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
});
