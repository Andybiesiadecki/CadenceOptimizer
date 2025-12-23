import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function CadenceConsistencyChart({ data, title = "Cadence Consistency" }) {
  // Transform data for consistency analysis
  const transformData = (rawData) => {
    if (!rawData || rawData.length === 0) {
      // Mock consistency data
      return {
        labels: ['150-160', '160-170', '170-180', '180-190', '190+'],
        datasets: [{
          data: [8, 25, 45, 20, 2],
        }]
      };
    }

    // Create cadence distribution
    const cadenceRanges = {
      '150-160': 0,
      '160-170': 0,
      '170-180': 0,
      '180-190': 0,
      '190+': 0,
    };

    rawData.forEach(point => {
      if (point.cadence) {
        const cadence = point.cadence;
        if (cadence < 160) cadenceRanges['150-160']++;
        else if (cadence < 170) cadenceRanges['160-170']++;
        else if (cadence < 180) cadenceRanges['170-180']++;
        else if (cadence < 190) cadenceRanges['180-190']++;
        else cadenceRanges['190+']++;
      }
    });

    const total = Object.values(cadenceRanges).reduce((sum, count) => sum + count, 0);
    
    return {
      labels: Object.keys(cadenceRanges),
      datasets: [{
        data: Object.values(cadenceRanges).map(count => 
          total > 0 ? Math.round((count / total) * 100) : 0
        ),
      }]
    };
  };

  const chartData = transformData(data);
  
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#e0e0e0',
      strokeWidth: 1,
    },
  };

  // Calculate consistency metrics
  const getConsistencyMetrics = () => {
    if (!data || data.length === 0) {
      return {
        optimalPercentage: 45,
        consistencyScore: 72,
        variability: 'Moderate',
        recommendation: 'Good consistency in optimal zone. Focus on maintaining 170-180 SPM throughout your runs.',
      };
    }

    const cadences = data.map(point => point.cadence).filter(c => c && c > 0);
    if (cadences.length === 0) return null;

    const avgCadence = cadences.reduce((sum, c) => sum + c, 0) / cadences.length;
    const variance = cadences.reduce((sum, c) => sum + Math.pow(c - avgCadence, 2), 0) / cadences.length;
    const standardDeviation = Math.sqrt(variance);
    
    const optimalCount = cadences.filter(c => c >= 170 && c <= 180).length;
    const optimalPercentage = Math.round((optimalCount / cadences.length) * 100);
    
    // Consistency score based on standard deviation (lower is better)
    const consistencyScore = Math.max(0, Math.min(100, 100 - (standardDeviation * 2)));
    
    let variability = 'Low';
    if (standardDeviation > 15) variability = 'High';
    else if (standardDeviation > 8) variability = 'Moderate';

    let recommendation = '';
    if (optimalPercentage > 70) {
      recommendation = 'Excellent! You maintained optimal cadence for most of your run.';
    } else if (optimalPercentage > 50) {
      recommendation = 'Good consistency. Try to spend more time in the 170-180 SPM range.';
    } else {
      recommendation = 'Focus on cadence consistency. Aim for 170-180 SPM throughout your runs.';
    }

    return {
      optimalPercentage,
      consistencyScore: Math.round(consistencyScore),
      variability,
      recommendation,
    };
  };

  const metrics = getConsistencyMetrics();

  if (!metrics) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Cadence data not available for analysis</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Distribution of your cadence throughout the run</Text>
      
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={screenWidth - 60}
          height={200}
          chartConfig={chartConfig}
          style={styles.chart}
          yAxisSuffix="%"
          yAxisInterval={1}
          fromZero={true}
          showBarTops={false}
          withInnerLines={true}
        />
      </View>

      {/* Consistency Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.optimalPercentage}%</Text>
          <Text style={styles.metricLabel}>In Optimal Zone</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.consistencyScore}</Text>
          <Text style={styles.metricLabel}>Consistency Score</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.variability}</Text>
          <Text style={styles.metricLabel}>Variability</Text>
        </View>
      </View>

      {/* Consistency Insight */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>📊 Consistency Analysis</Text>
        <Text style={styles.insightText}>{metrics.recommendation}</Text>
      </View>

      {/* Improvement Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>🎯 Consistency Tips:</Text>
        <Text style={styles.tipsText}>
          • Use a metronome during training runs{'\n'}
          • Focus on quick, light steps{'\n'}
          • Count steps for 15 seconds, multiply by 4{'\n'}
          • Practice cadence drills regularly
        </Text>
      </View>

      {/* Zone Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>170-180 SPM (Optimal)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Other ranges</Text>
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
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  metricCard: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9C27B0',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7B1FA2',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: '#7B1FA2',
    lineHeight: 18,
  },
  tipsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
});