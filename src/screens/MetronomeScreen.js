import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function MetronomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [cadence, setCadence] = useState(170);

  const toggleMetronome = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement audio metronome
  };

  const adjustCadence = (delta) => {
    const newCadence = Math.max(140, Math.min(200, cadence + delta));
    setCadence(newCadence);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Audio Metronome</Text>
        
        <View style={styles.cadenceDisplay}>
          <Text style={styles.cadenceValue}>{cadence}</Text>
          <Text style={styles.cadenceLabel}>SPM</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.adjustButton}
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
              {isPlaying ? '⏸ Pause' : '▶ Start'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adjustButton}
            onPress={() => adjustCadence(5)}
            disabled={isPlaying}
          >
            <Text style={styles.adjustButtonText}>+5</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.presets}>
          <Text style={styles.presetsTitle}>Quick Presets</Text>
          <View style={styles.presetButtons}>
            {[160, 170, 180, 190].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  cadence === preset && styles.presetButtonActive
                ]}
                onPress={() => setCadence(preset)}
                disabled={isPlaying}
              >
                <Text style={styles.presetButtonText}>{preset}</Text>
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
    marginBottom: 32,
    textAlign: 'center',
    color: '#333',
  },
  cadenceDisplay: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cadenceValue: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cadenceLabel: {
    fontSize: 20,
    color: '#666',
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
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
  adjustButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  playButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
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
  presets: {
    marginTop: 20,
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#666',
  },
  presetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presetButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  presetButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  presetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
