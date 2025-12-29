import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { FitFileParser } from '../services/FitFileParser';
import { CadenceAnalyzer } from '../services/CadenceAnalyzer';
import { saveAnalysis, getRunnerProfile } from '../utils/storage';

// Import chart components
import CadenceLineChart from '../components/charts/CadenceLineChart';
import CadenceVsPaceChart from '../components/charts/CadenceVsPaceChart';
import HeartRateZoneChart from '../components/charts/HeartRateZoneChart';
import ElevationProfileChart from '../components/charts/ElevationProfileChart';
import CadenceConsistencyChart from '../components/charts/CadenceConsistencyChart';

export default function AnalysisScreen() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleSelectFile = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting file selection...');

      // Open document picker for FIT files
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'], // Accept all files, we'll validate FIT files
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        console.log('File selection canceled');
        setLoading(false);
        return;
      }

      const file = result.assets[0];
      console.log('Selected file:', file.name, 'Size:', file.size);
      
      // Accept both .fit files and .zip files (Garmin exports are often zipped)
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.fit') && !fileName.endsWith('.zip')) {
        Alert.alert(
          'Invalid File Type',
          'Please select a .FIT file or .ZIP file from your fitness device or app (Garmin, Wahoo, Strava, etc.)'
        );
        setLoading(false);
        return;
      }

      // For now, if it's a ZIP file, show a message about extracting
      if (fileName.endsWith('.zip')) {
        Alert.alert(
          'ZIP File Detected',
          'Please extract the .FIT file from the ZIP archive and upload the .FIT file directly. We\'ll add ZIP support in a future update!'
        );
        setLoading(false);
        return;
      }

      console.log('Reading file as base64...');
      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('File read successfully, length:', base64Data.length);
      console.log('Parsing FIT file...');

      // For now, create realistic mock data based on file info
      // TODO: Implement proper FIT parsing when we find a React Native compatible library
      const mockParsedData = {
        records: Array.from({ length: 1800 }, (_, i) => ({
          timestamp: new Date(Date.now() - (1800 - i) * 1000),
          cadence: 165 + Math.sin(i / 100) * 15 + (Math.random() - 0.5) * 10,
          speed: 3.2 + Math.sin(i / 200) * 0.8 + (Math.random() - 0.5) * 0.3,
          heart_rate: 160 + Math.sin(i / 150) * 20 + (Math.random() - 0.5) * 8,
          position_lat: 40.7128 + (Math.random() - 0.5) * 0.01,
          position_long: -74.0060 + (Math.random() - 0.5) * 0.01,
          altitude: 50 + Math.sin(i / 300) * 30,
          distance: i * 5.8, // ~10.4km total
        })),
        sessions: [{
          total_distance: 10400,
          total_elapsed_time: 1800,
          avg_speed: 5.78,
          max_speed: 7.2,
          avg_heart_rate: 165,
          max_heart_rate: 185,
          total_ascent: 120,
          total_descent: 115,
        }],
        laps: [],
        activities: [],
        deviceInfo: [{
          manufacturer: 1, // Garmin
          product: 'Unknown Device',
          serial_number: 123456789,
        }],
        fileId: [{
          type: 'activity',
          time_created: new Date(),
        }],
      };

      console.log('Using mock data for FIT file (real parsing coming soon)');
      const parsedData = mockParsedData;
      
      // Extract data
      const cadenceData = FitFileParser.extractCadenceData(parsedData);
      const speedData = FitFileParser.extractSpeedData(parsedData);
      const heartRateData = FitFileParser.extractHeartRateData(parsedData);
      const gpsData = FitFileParser.extractGPSData(parsedData);
      
      // Get run summary
      const runSummary = FitFileParser.getRunSummary(parsedData);
      
      // Analyze cadence zones
      const cadenceZones = FitFileParser.analyzeCadenceZones(cadenceData);
      
      // Get runner profile for personalized recommendations
      const runnerProfile = await getRunnerProfile();
      
      // Generate recommendations
      const recommendations = generateRecommendations(runSummary, cadenceZones, runnerProfile);

      const analysisResults = {
        fileName: file.name,
        fileSize: file.size,
        runSummary,
        cadenceZones,
        recommendations,
        dataQuality: {
          hasCadence: cadenceData.length > 0,
          hasSpeed: speedData.length > 0,
          hasHeartRate: heartRateData.length > 0,
          hasGPS: gpsData.length > 0,
        },
        rawDataCounts: {
          cadence: cadenceData.length,
          speed: speedData.length,
          heartRate: heartRateData.length,
          gps: gpsData.length,
        },
        // Add chart data
        chartData: {
          cadence: cadenceData,
          speed: speedData,
          heartRate: heartRateData,
          gps: gpsData,
          elevation: parsedData.records || [],
        },
      };

      // Save analysis to storage
      await saveAnalysis(analysisResults);
      
      setResults(analysisResults);
      setLoading(false);

    } catch (err) {
      console.error('Error processing FIT file:', err);
      setError(err.message);
      setLoading(false);
      Alert.alert(
        'Error Processing File',
        `Failed to analyze FIT file: ${err.message}\n\nPlease ensure you're using a valid FIT file from a supported device.`
      );
    }
  };

  const generateRecommendations = (runSummary, cadenceZones, runnerProfile) => {
    // Use CadenceAnalyzer for personalized recommendations
    return CadenceAnalyzer.generateRecommendations(runSummary, runnerProfile);
  };

  const handleTestData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Creating test data...');

      // Create mock analysis results to test the UI
      const mockResults = {
        fileName: 'test_run.fit',
        fileSize: 125000,
        runSummary: {
          totalDistance: 10500, // 10.5km
          totalTime: 3150, // 52:30
          avgSpeed: 3.33, // m/s
          maxSpeed: 4.2,
          avgCadence: 172,
          minCadence: 158,
          maxCadence: 186,
          cadenceVariability: 12,
          avgHeartRate: 165,
          maxHeartRate: 182,
          totalAscent: 85,
          totalDescent: 92,
          deviceInfo: {
            manufacturer: 'Garmin',
            product: 'Forerunner 945',
          },
          dataPoints: {
            cadence: 1890,
            speed: 1890,
            heartRate: 1890,
            gps: 1890,
          },
        },
        cadenceZones: {
          optimal: 68,
          subOptimal: 32,
          zones: {
            veryLow: 5,
            low: 27,
            optimal: 68,
            high: 0,
            veryHigh: 0,
          },
        },
        recommendations: [
          {
            type: 'success',
            title: 'Great Cadence!',
            message: 'Your average cadence of 172 SPM is in the optimal range.',
          },
          {
            type: 'improvement',
            title: 'Consistency Opportunity',
            message: 'Only 68% of your run was in the optimal cadence zone. Focus on maintaining 170-180 SPM.',
          },
        ],
        dataQuality: {
          hasCadence: true,
          hasSpeed: true,
          hasHeartRate: true,
          hasGPS: true,
        },
        rawDataCounts: {
          cadence: 1890,
          speed: 1890,
          heartRate: 1890,
          gps: 1890,
        },
        // Add mock chart data
        chartData: {
          cadence: Array.from({ length: 1890 }, (_, i) => ({
            timestamp: new Date(Date.now() - (1890 - i) * 1000),
            cadence: 165 + Math.sin(i / 100) * 15 + (Math.random() - 0.5) * 10,
          })),
          speed: Array.from({ length: 1890 }, (_, i) => ({
            timestamp: new Date(Date.now() - (1890 - i) * 1000),
            speed: 3.2 + Math.sin(i / 200) * 0.8 + (Math.random() - 0.5) * 0.3,
          })),
          heartRate: Array.from({ length: 1890 }, (_, i) => ({
            timestamp: new Date(Date.now() - (1890 - i) * 1000),
            heart_rate: 160 + Math.sin(i / 150) * 20 + (Math.random() - 0.5) * 8,
          })),
          elevation: Array.from({ length: 1890 }, (_, i) => ({
            timestamp: new Date(Date.now() - (1890 - i) * 1000),
            altitude: 50 + Math.sin(i / 300) * 30,
            cadence: 165 + Math.sin(i / 100) * 15 + (Math.random() - 0.5) * 10,
            speed: 3.2 + Math.sin(i / 200) * 0.8 + (Math.random() - 0.5) * 0.3,
            heart_rate: 160 + Math.sin(i / 150) * 20 + (Math.random() - 0.5) * 8,
          })),
        },
      };

      // Save test analysis
      await saveAnalysis(mockResults);
      
      setResults(mockResults);
      setLoading(false);
      console.log('Test data created successfully');

    } catch (err) {
      console.error('Error creating test data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>FIT File Analysis</Text>
        <Text style={styles.description}>
          Upload your running data from Garmin, Strava, or other devices
        </Text>
        
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>📝 Current Status</Text>
          <Text style={styles.noteText}>
            FIT file parsing is currently using sample data while we implement a React Native compatible parser. 
            The analysis UI is fully functional - real FIT parsing coming in the next update!
          </Text>
        </View>

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

        <TouchableOpacity 
          style={[styles.uploadButton, { backgroundColor: '#FF9800', marginTop: 12 }]}
          onPress={handleTestData}
          disabled={loading}
        >
          <Text style={styles.uploadButtonText}>🧪 Test with Sample Data</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorSection}>
          <Text style={styles.errorTitle}>⚠️ Analysis Error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {results && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>📊 Analysis Results</Text>
          <Text style={styles.fileName}>File: {results.fileName}</Text>
          
          {/* Run Summary */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Run Summary</Text>
            
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>
                  {(results.runSummary.totalDistance / 1000).toFixed(2)} km
                </Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>
                  {formatDuration(results.runSummary.totalTime)}
                </Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Avg Pace</Text>
                <Text style={styles.statValue}>
                  {formatPace(results.runSummary.avgSpeed)}
                </Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Device</Text>
                <Text style={styles.statValue}>
                  {results.runSummary.deviceInfo.manufacturer}
                </Text>
              </View>
            </View>
          </View>

          {/* Cadence Analysis */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Cadence Analysis</Text>
            
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={styles.statValue}>
                  {Math.round(results.runSummary.avgCadence)} SPM
                </Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Range</Text>
                <Text style={styles.statValue}>
                  {results.runSummary.minCadence}-{results.runSummary.maxCadence}
                </Text>
              </View>
            </View>

            <View style={styles.zoneCard}>
              <Text style={styles.zoneTitle}>Time in Optimal Zone (170-180 SPM)</Text>
              <View style={styles.zoneBar}>
                <View 
                  style={[
                    styles.zoneProgress, 
                    { width: `${results.cadenceZones.optimal}%` }
                  ]} 
                />
              </View>
              <Text style={styles.zoneText}>
                {results.cadenceZones.optimal}% optimal
              </Text>
            </View>
          </View>

          {/* Heart Rate (if available) */}
          {results.dataQuality.hasHeartRate && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Heart Rate</Text>
              
              <View style={styles.statRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Average</Text>
                  <Text style={styles.statValue}>
                    {Math.round(results.runSummary.avgHeartRate)} bpm
                  </Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Maximum</Text>
                  <Text style={styles.statValue}>
                    {results.runSummary.maxHeartRate} bpm
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Data Visualization Charts */}
          <View style={styles.chartsSection}>
            <Text style={styles.chartsSectionTitle}>📊 Data Visualization</Text>
            
            {/* Cadence Over Time */}
            {results.dataQuality.hasCadence && (
              <CadenceLineChart 
                data={results.chartData?.cadence || []} 
                title="Cadence Over Time"
              />
            )}

            {/* Cadence vs Pace */}
            {results.dataQuality.hasCadence && results.dataQuality.hasSpeed && (
              <CadenceVsPaceChart 
                data={results.chartData?.elevation || []} 
                title="Cadence vs Pace Analysis"
              />
            )}

            {/* Cadence Consistency */}
            {results.dataQuality.hasCadence && (
              <CadenceConsistencyChart 
                data={results.chartData?.cadence || []} 
                title="Cadence Consistency"
              />
            )}

            {/* Heart Rate Zones */}
            {results.dataQuality.hasHeartRate && (
              <HeartRateZoneChart 
                data={results.chartData?.heartRate || []} 
                maxHeartRate={results.runSummary.maxHeartRate || 190}
                title="Heart Rate Zone Distribution"
              />
            )}

            {/* Elevation Profile */}
            {results.dataQuality.hasGPS && (
              <ElevationProfileChart 
                data={results.chartData?.elevation || []} 
                title="Elevation Profile"
              />
            )}
          </View>

          {/* Recommendations */}
          {results.recommendations.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>💡 Recommendations</Text>
              
              {results.recommendations.map((rec, index) => (
                <View key={index} style={[
                  styles.recommendationCard,
                  rec.type === 'success' && styles.successCard,
                  rec.type === 'improvement' && styles.improvementCard,
                  rec.type === 'caution' && styles.cautionCard,
                ]}>
                  <Text style={styles.recommendationTitle}>{rec.title}</Text>
                  <Text style={styles.recommendationText}>{rec.message}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Data Quality */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Data Quality</Text>
            
            <View style={styles.dataQualityGrid}>
              <View style={[styles.qualityItem, results.dataQuality.hasCadence && styles.qualityGood]}>
                <Text style={styles.qualityLabel}>Cadence</Text>
                <Text style={styles.qualityValue}>
                  {results.dataQuality.hasCadence ? '✓' : '✗'}
                </Text>
              </View>
              
              <View style={[styles.qualityItem, results.dataQuality.hasSpeed && styles.qualityGood]}>
                <Text style={styles.qualityLabel}>Speed</Text>
                <Text style={styles.qualityValue}>
                  {results.dataQuality.hasSpeed ? '✓' : '✗'}
                </Text>
              </View>
              
              <View style={[styles.qualityItem, results.dataQuality.hasHeartRate && styles.qualityGood]}>
                <Text style={styles.qualityLabel}>Heart Rate</Text>
                <Text style={styles.qualityValue}>
                  {results.dataQuality.hasHeartRate ? '✓' : '✗'}
                </Text>
              </View>
              
              <View style={[styles.qualityItem, results.dataQuality.hasGPS && styles.qualityGood]}>
                <Text style={styles.qualityLabel}>GPS</Text>
                <Text style={styles.qualityValue}>
                  {results.dataQuality.hasGPS ? '✓' : '✗'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// Helper functions
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatPace = (speedMs) => {
  if (!speedMs || speedMs === 0) return '--:--';
  const paceMinKm = 1000 / (speedMs * 60); // Convert m/s to min/km
  const minutes = Math.floor(paceMinKm);
  const seconds = Math.round((paceMinKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

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
    marginBottom: 24,
    lineHeight: 24,
    fontWeight: '500',
  },
  uploadButton: {
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
  uploadButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  errorSection: {
    padding: 24,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    marginBottom: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF3B30',
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    fontWeight: '500',
  },
  resultsSection: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 12,
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fileName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 6,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00FF9D',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 157, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  zoneCard: {
    marginTop: 12,
  },
  zoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  zoneBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  zoneProgress: {
    height: '100%',
    backgroundColor: '#00FF9D',
    shadowColor: '#00FF9D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  zoneText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '600',
  },
  recommendationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
  },
  successCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderLeftColor: '#4CAF50',
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  improvementCard: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderLeftColor: '#FF9800',
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  cautionCard: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderLeftColor: '#F44336',
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  recommendationText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    fontWeight: '500',
  },
  dataQualityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  qualityItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  qualityGood: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  qualityLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  qualityValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00FF9D',
    textShadowColor: 'rgba(0, 255, 157, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  noteCard: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    color: '#1976D2',
    lineHeight: 16,
  },
  chartsSection: {
    marginBottom: 16,
  },
  chartsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
});
