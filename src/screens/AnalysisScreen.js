import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

export default function AnalysisScreen() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSelectFile = async () => {
    setLoading(true);
    // TODO: Implement FIT file picker and parsing
    setTimeout(() => {
      setLoading(false);
      setResults({
        avgCadence: 172,
        optimalCadence: 175,
        distance: 10.5,
        duration: '52:30',
      });
    }, 1500);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>FIT File Analysis</Text>
        <Text style={styles.description}>
          Upload your running data from Garmin, Strava, or other devices
        </Text>

        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={handleSelectFile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>📁 Select FIT File</Text>
          )}
        </TouchableOpacity>
      </View>

      {results && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>Analysis Results</Text>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Average Cadence</Text>
            <Text style={styles.statValue}>{results.avgCadence} SPM</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Recommended Cadence</Text>
            <Text style={styles.statValue}>{results.optimalCadence} SPM</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{results.distance} km</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{results.duration}</Text>
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
    marginBottom: 20,
    lineHeight: 20,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
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
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
