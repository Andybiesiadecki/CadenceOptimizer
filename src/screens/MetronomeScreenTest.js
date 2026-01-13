import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function MetronomeScreenTest() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [cadence, setCadence] = useState(170);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>STRDR METRONOME</Text>
      
      <View style={styles.cadenceDisplay}>
        <Text style={styles.cadenceValue}>{cadence}</Text>
        <Text style={styles.cadenceLabel}>SPM</Text>
      </View>

      <TouchableOpacity 
        style={[styles.playButton, isPlaying && styles.playButtonActive]}
        onPress={() => setIsPlaying(!isPlaying)}
      >
        <Text style={styles.playButtonText}>
          {isPlaying ? 'STOP' : 'START'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 2,
    marginBottom: 40,
  },
  cadenceDisplay: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    borderWidth: 2,
    borderColor: '#000000',
  },
  cadenceValue: {
    fontSize: 72,
    fontWeight: '900',
    color: '#000000',
  },
  cadenceLabel: {
    fontSize: 20,
    color: '#666666',
    fontWeight: '700',
    letterSpacing: 2,
  },
  playButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 35,
  },
  playButtonActive: {
    backgroundColor: '#FF3B30',
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
});