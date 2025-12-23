import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function CadenceLineChart({ data, title = "Cadence Over Time" }) {
  // Transform data for chart
  const transformData = (rawData) => {
    if (!rawData || rawData.length === 0) {
      return {
        labels: ['0', '5', '10', '15', '20'],
        datasets: [{
          data: [170, 172, 175, 173, 171],
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          strokeWidth: 2,
        }]
      };
    }

    // Sample every nth point to avoid overcrowding
    const sampleRate = Math.max(1, Math.floor(rawData.length / 20));
    const sampledData = rawData.filter((_, index) => index % sampleRate === 0);
    
    const labels = sampledData.map((_, index) => {
      const minutes = Math.floor((index * sampleRate) / 60);
      return minutes.toString();
    });

    const cadenceValues = sampledData.map(point => point.cadence || 0);

    return {
      labels: labels.slice(0, 10), // Limit to 10 labels for readability
      datasets: [{
        data: cadenceValues.slice(0, 10),
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
        strokeWidth: 2,
      }]
    };
  };

  const chartData = transformData(data);
  
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#007AFF',
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // solid lines
      stroke: '#e0e0e0',
      strokeWidth: 1,
    },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Steps per minute throughout your run</Text>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth - 60}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={true}
          withHorizontalLines={true}
          fromZero={false}
          yAxisSuffix=" SPM"
          yAxisInterval={1}
        />
      </View>

      {/* Optimal Zone Indicator */}
      <View style={styles.zoneIndicator}>
        <View style={styles.zoneItem}>
          <View style={[styles.zoneDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.zoneText}>Optimal Zone (170-180 SPM)</Text>
        </View>
        <View style={styles.zoneItem}>
          <View style={[styles.zoneDot, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.zoneText}>Needs Improvement</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
  },
  zoneIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  zoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  zoneText: {
    fontSize: 12,
    color: '#666',
  },
});