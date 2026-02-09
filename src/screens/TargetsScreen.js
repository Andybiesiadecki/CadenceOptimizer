import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';

export default function TargetsScreen() {
  const [selectedDistance, setSelectedDistance] = useState('10K');
  const [targetTime, setTargetTime] = useState('');
  const [result, setResult] = useState(null);

  const distances = ['5K', '10K', 'Half Marathon', 'Marathon'];

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
    // TODO: Implement actual calculation algorithm
    setResult({
      optimalCadence: 175,
      targetPace: '5:00',
      strideLength: 1.42,
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
              onPress={() => setSelectedDistance(distance)}
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
            <Text style={styles.resultValue}>{result.targetPace} /km</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00FF9D',
    textShadowColor: 'rgba(0, 255, 157, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
