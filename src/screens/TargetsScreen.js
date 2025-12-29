import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';

export default function TargetsScreen() {
  const [selectedDistance, setSelectedDistance] = useState('10K');
  const [targetTime, setTargetTime] = useState('');
  const [result, setResult] = useState(null);

  const distances = ['5K', '10K', 'Half Marathon', 'Marathon'];

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

        <Text style={styles.label}>Target Time (HH:MM:SS)</Text>
        <TextInput
          style={styles.input}
          placeholder="00:45:00"
          value={targetTime}
          onChangeText={setTargetTime}
          keyboardType="numbers-and-punctuation"
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
    backgroundColor: '#0A0A0A',
  },
  section: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 28,
    lineHeight: 24,
    fontWeight: '500',
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  distanceButtonActive: {
    backgroundColor: 'rgba(0, 255, 157, 0.15)',
    borderColor: '#00FF9D',
    shadowColor: '#00FF9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  distanceButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.3,
  },
  distanceButtonTextActive: {
    color: '#00FF9D',
    textShadowColor: 'rgba(0, 255, 157, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 28,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calculateButton: {
    backgroundColor: '#00FF9D',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00FF9D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  calculateButtonText: {
    color: '#000000',
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
    color: '#FFFFFF',
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
