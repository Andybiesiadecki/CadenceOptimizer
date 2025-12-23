import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function CadenceVsPaceChart({ data, title = "Cadence vs Pace" }) {
  // Transform data for scatter plot (using LineChart with dots)
  const transformData = (rawData) => {
    if (!rawData || rawData.length === 0) {
      // Mock data showing relationship
      return {
        labels: ['7:00', '7:30', '8:00', '8:30', '9:00'],
        datasets: [{
          data: [180, 175, 172, 168, 165],
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 0, // No connecting lines for scatter effect
        }]
      };
    }

    // Group data by pace ranges for better visualization
    const paceRanges = {};
    rawData.forEach(point => {
      if (point.speed && point.cadence) {
        const paceMinKm = 1000 / (point.speed * 60);
        const paceRange = Math.floor(paceMinKm * 2) / 2; // Round to nearest 0.5 min
        
        if (!paceRanges[paceRange]) {
          paceRanges[paceRange] = [];
        }
        paceRanges[paceRange].push(point.cadence);
      }
    });

    // Calculate average cadence for each pace range
    const paceLabels = [];
    const cadenceValues = [];
    
    Object.keys(paceRanges)
      .sort((a, b) => parseFloat(a) - parseFloat(b))
      .slice(0, 8) // Limit to 8 points
      .forEach(pace => {
        const avgCadence = paceRanges[pace].reduce((sum, c) => sum + c, 0) / paceRanges[pace].length;
        const minutes = Math.floor(parseFloat(pace));
        const seconds = Math.round((parseFloat(pace) - minutes) * 60);
        paceLabels.push(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        cadenceValues.push(Math.round(avgCadence));
      });

    return {
      labels: paceLabels,
      datasets: [{
        data: cadenceValues,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
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
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#4CAF50',
      fill: '#4CAF50',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#e0e0e0',
      strokeWidth: 1,
    },
  };

  // Calculate efficiency insights
  const getEfficiencyInsight = () => {
    if (!data || data.length === 0) {
      return "Your most efficient pace appears to be around 8:00/mile at 172 SPM";
    }
    
    // Find the pace with highest cadence (most efficient)
    let bestPace = null;
    let bestCadence = 0;
    
    data.forEach(point => {
      if (point.speed && point.cadence && point.cadence > bestCadence) {
        bestCadence = point.cadence;
        const paceMinKm = 1000 / (point.speed * 60);
        const minutes = Math.floor(paceMinKm);
        const seconds = Math.round((paceMinKm - minutes) * 60);
        bestPace = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
    });

    return bestPace 
      ? `Your most efficient pace appears to be ${bestPace}/km at ${Math.round(bestCadence)} SPM`
      : "Maintain consistent cadence across all paces for better efficiency";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Find your most efficient pace-cadence combination</Text>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth - 60}
          height={220}
          chartConfig={chartConfig}
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

      {/* Efficiency Insight */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>💡 Efficiency Insight</Text>
        <Text style={styles.insightText}>{getEfficiencyInsight()}</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>How to read this chart:</Text>
        <Text style={styles.legendText}>
          • Higher points = better cadence at that pace{'\n'}
          • Look for your "sweet spot" where cadence stays high{'\n'}
          • Aim to maintain 170+ SPM across all paces
        </Text>
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
  insightCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 18,
  },
  legend: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
});