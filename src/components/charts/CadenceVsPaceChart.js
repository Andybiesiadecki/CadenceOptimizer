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
          color: (opacity = 1) => `rgba(0, 255, 157, ${opacity})`,
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
        color: (opacity = 1) => `rgba(0, 255, 157, ${opacity})`,
        strokeWidth: 2,
      }]
    };
  };

  const chartData = transformData(data);
  
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'rgba(10, 10, 10, 0.8)',
    backgroundGradientTo: 'rgba(10, 10, 10, 0.8)',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 255, 157, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.8})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#00FF9D',
      fill: '#00FF9D',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#00FF9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 10,
  },
  chart: {
    borderRadius: 12,
  },
  insightCard: {
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00FF9D',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 157, 0.2)',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00FF9D',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    fontWeight: '500',
  },
  legend: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  legendText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    fontWeight: '500',
  },
});