import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';

export default function TargetsScreen() {
  const [selectedDistance, setSelectedDistance] = useState('10K');
  const [targetTime, setTargetTime] = useState('');
  const [result, setResult] = useState(null);

  const distances = ['5K', '10K', 'Half Marathon', 'Marathon'];

  // Clear results when distance changes
  const handleDistanceChange = (distance) => {
    setSelectedDistance(distance);
    setResult(null);
  };

  // Format time input to auto-add colons (MM:SS or H:MM:SS)
  const formatTimeInput = (value) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/[^\d]/g, '');
    
    if (numbers.length === 0) return '';
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) {
      // MM:SS format
      return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
    }
    // H:MM:SS format for longer times
    const hours = numbers.slice(0, numbers.length - 4);
    const minutes = numbers.slice(numbers.length - 4, numbers.length - 2);
    const seconds = numbers.slice(numbers.length - 2);
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleTimeInput = (value) => {
    const formatted = formatTimeInput(value);
    setTargetTime(formatted);
  };

  const calculateTarget = () => {
    if (!targetTime) {
      return; // Don't calculate if no time entered
    }

    // TODO: Implement actual calculation algorithm
    // For now, return different values based on distance to show it's working
    const distanceMultipliers = {
      '5K': { cadence: 180, paceKm: '4:30', paceMi: '7:15', stride: 1.50 },
      '10K': { cadence: 175, paceKm: '5:00', paceMi: '8:03', stride: 1.42 },
      'Half Marathon': { cadence: 170, paceKm: '5:30', paceMi: '8:51', stride: 1.38 },
      'Marathon': { cadence: 168, paceKm: '6:00', paceMi: '9:39', stride: 1.35 }
    };

    const values = distanceMultipliers[selectedDistance] || distanceMultipliers['10K'];
    
    setResult({
      optimalCadence: values.cadence,
      targetPaceKm: values.paceKm,
      targetPaceMi: values.paceMi,
      strideLength: values.stride,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Race Target Calculator</Text>
        <Text style={styles.description}>
          Calculate your optimal cadence for race day
        </Text>

        <Text style={styles.label}>Select Distance</Text>
        <View style={styles.distanceButtons}>
          {distances.map((distance) => (
            <TouchableOpacity
              key={distance}
              style={[
                styles.distanceButton,
                selectedDistance === distance && styles.distanceButtonActive
              ]}
              onPress={() => handleDistanceChange(distance)}
            >
              <Text style={[
                styles.distanceButtonText,
                selectedDistance === distance && styles.distanceButtonTextActive
              ]}>
                {distance}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Target Time (just type numbers)</Text>
        <TextInput
          style={styles.input}
          placeholder="4500 → 45:00"
          value={targetTime}
          onChangeText={handleTimeInput}
          keyboardType="numeric"
        />

        <TouchableOpacity 
          style={styles.calculateButton}
          onPress={calculateTarget}
        >
          <Text style={styles.calculateButtonText}>Calculate</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Recommended Targets</Text>
          
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Optimal Cadence</Text>
            <Text style={styles.resultValue}>{result.optimalCadence} SPM</Text>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Target Pace</Text>
            <View>
              <Text style={styles.resultValue}>{result.targetPaceKm} /km</Text>
              <Text style={styles.resultValueSecondary}>{result.targetPaceMi} /mi</Text>
            </View>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Stride Length</Text>
            <Text style={styles.resultValue}>{result.strideLength} m</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  section: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
    color: '#000000',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 28,
    lineHeight: 24,
    fontWeight: '500',
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  distanceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 28,
    gap: 12,
  },
  distanceButton: {
    backgroundColor: '#F8F8F8',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  distanceButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  distanceButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.3,
  },
  distanceButtonTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 28,
    color: '#000000',
    fontWeight: '600',
  },
  calculateButton: {
    backgroundColor: '#000000',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resultsSection: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 20,
    color: '#000000',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  resultCard: {
    backgroundColor: '#F8F8F8',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
  },
  resultValueSecondary: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
    marginTop: 4,
  },
});
