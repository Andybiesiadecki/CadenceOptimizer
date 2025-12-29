import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function ElevationProfileChart({ data, title = "Elevation Profile" }) {
  // Transform data for elevation chart
  const transformData = (rawData) => {
    if (!rawData || rawData.length === 0) {
      // Mock elevation data
      return {
        labels: ['0', '2', '4', '6', '8', '10'],
        datasets: [
          {
            data: [100, 120, 140, 135, 110, 105],
            color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
            strokeWidth: 3,
          }
        ]
      };
    }

    // Sample data points for better visualization
    const sampleRate = Math.max(1, Math.floor(rawData.length / 15));
    const sampledData = rawData.filter((_, index) => index % sampleRate === 0);
    
    const labels = sampledData.map((_, index) => {
      const distanceKm = (index * sampleRate * 5.8) / 1000; // Assuming ~5.8m per data point
      return distanceKm.toFixed(1);
    });

    const elevationValues = sampledData.map(point => point.altitude || 0);

    return {
      labels: labels.slice(0, 10),
      datasets: [{
        data: elevationValues.slice(0, 10),
        color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
        strokeWidth: 3,
      }]
    };
  };

  const chartData = transformData(data);
  
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'rgba(10, 10, 10, 0.8)',
    backgroundGradientTo: 'rgba(10, 10, 10, 0.8)',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.8})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '1',
      stroke: '#FFD700',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: 'rgba(255, 255, 255, 0.1)',
      strokeWidth: 1,
    },
    fillShadowGradient: '#FFD700',
    fillShadowGradientOpacity: 0.3,
  };

  // Calculate elevation stats
  const getElevationStats = () => {
    if (!data || data.length === 0) {
      return {
        totalGain: 120,
        totalLoss: 115,
        maxElevation: 140,
        minElevation: 100,
      };
    }

    const elevations = data.map(point => point.altitude || 0).filter(alt => alt > 0);
    if (elevations.length === 0) return null;

    let totalGain = 0;
    let totalLoss = 0;
    
    for (let i = 1; i < elevations.length; i++) {
      const diff = elevations[i] - elevations[i - 1];
      if (diff > 0) totalGain += diff;
      else totalLoss += Math.abs(diff);
    }

    return {
      totalGain: Math.round(totalGain),
      totalLoss: Math.round(totalLoss),
      maxElevation: Math.round(Math.max(...elevations)),
      minElevation: Math.round(Math.min(...elevations)),
    };
  };

  const elevationStats = getElevationStats();

  if (!elevationStats) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Elevation data not available for this run</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>🏔️</Text>
          <Text style={styles.noDataMessage}>
            Elevation profiles help you understand terrain impact on your performance. 
            GPS data with altitude is needed for elevation analysis.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Terrain changes throughout your run</Text>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth - 60}
          height={200}
          chartConfig={chartConfig}
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          fromZero={false}
          yAxisSuffix="m"
          yAxisInterval={1}
          withShadow={true}
        />
      </View>

      {/* Elevation Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>+{elevationStats.totalGain}m</Text>
          <Text style={styles.statLabel}>Total Gain</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>-{elevationStats.totalLoss}m</Text>
          <Text style={styles.statLabel}>Total Loss</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{elevationStats.maxElevation}m</Text>
          <Text style={styles.statLabel}>Highest</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{elevationStats.minElevation}m</Text>
          <Text style={styles.statLabel}>Lowest</Text>
        </View>
      </View>

      {/* Terrain Impact Insight */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>🏔️ Terrain Impact</Text>
        <Text style={styles.insightText}>
          {elevationStats.totalGain > 100 
            ? `Significant elevation gain of ${elevationStats.totalGain}m. Hills likely impacted your cadence and pace.`
            : elevationStats.totalGain > 50
            ? `Moderate elevation changes of ${elevationStats.totalGain}m. Some terrain variation in this run.`
            : `Relatively flat route with only ${elevationStats.totalGain}m elevation gain. Good for consistent pacing.`
          }
        </Text>
      </View>

      {/* Terrain Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Terrain Tips:</Text>
        <Text style={styles.tipsText}>
          • Uphill: Increase cadence by 5-10 SPM, shorten stride{'\n'}
          • Downhill: Maintain cadence, control with slight lean forward{'\n'}
          • Flat: Focus on consistent rhythm and form
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
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDataMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  insightCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    fontWeight: '500',
  },
  tipsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tipsText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    fontWeight: '500',
  },
});