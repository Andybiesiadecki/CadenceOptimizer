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
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  distanceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  distanceButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  distanceButtonActive: {
    backgroundColor: '#007AFF',
  },
  distanceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  distanceButtonTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  calculateButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 16,
    color: '#666',
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
