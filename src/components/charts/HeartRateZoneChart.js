import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function HeartRateZoneChart({ data, maxHeartRate = 190, title = "Heart Rate Zones" }) {
  // Calculate HR zones based on max HR
  const calculateZones = (maxHR) => ({
    zone1: { min: 0, max: Math.round(maxHR * 0.6), name: 'Recovery', color: '#2196F3' },
    zone2: { min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7), name: 'Aerobic', color: '#4CAF50' },
    zone3: { min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8), name: 'Tempo', color: '#FF9800' },
    zone4: { min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9), name: 'Threshold', color: '#FF5722' },
    zone5: { min: Math.round(maxHR * 0.9), max: maxHR, name: 'VO2 Max', color: '#F44336' },
  });

  // Transform data for pie chart
  const transformData = (rawData, zones) => {
    if (!rawData || rawData.length === 0) {
      // Mock data for demonstration
      return [
        { name: 'Zone 1 (Recovery)', population: 15, color: zones.zone1.color, legendFontColor: '#333', legendFontSize: 12 },
        { name: 'Zone 2 (Aerobic)', population: 45, color: zones.zone2.color, legendFontColor: '#333', legendFontSize: 12 },
        { name: 'Zone 3 (Tempo)', population: 25, color: zones.zone3.color, legendFontColor: '#333', legendFontSize: 12 },
        { name: 'Zone 4 (Threshold)', population: 12, color: zones.zone4.color, legendFontColor: '#333', legendFontSize: 12 },
        { name: 'Zone 5 (VO2 Max)', population: 3, color: zones.zone5.color, legendFontColor: '#333', legendFontSize: 12 },
      ];
    }

    // Count time in each zone
    const zoneCounts = { zone1: 0, zone2: 0, zone3: 0, zone4: 0, zone5: 0 };
    
    rawData.forEach(point => {
      if (point.heart_rate) {
        const hr = point.heart_rate;
        if (hr <= zones.zone1.max) zoneCounts.zone1++;
        else if (hr <= zones.zone2.max) zoneCounts.zone2++;
        else if (hr <= zones.zone3.max) zoneCounts.zone3++;
        else if (hr <= zones.zone4.max) zoneCounts.zone4++;
        else zoneCounts.zone5++;
      }
    });

    const total = Object.values(zoneCounts).reduce((sum, count) => sum + count, 0);
    
    return [
      { 
        name: `Zone 1 (${zones.zone1.min}-${zones.zone1.max})`, 
        population: Math.round((zoneCounts.zone1 / total) * 100), 
        color: zones.zone1.color, 
        legendFontColor: '#333', 
        legendFontSize: 11 
      },
      { 
        name: `Zone 2 (${zones.zone2.min}-${zones.zone2.max})`, 
        population: Math.round((zoneCounts.zone2 / total) * 100), 
        color: zones.zone2.color, 
        legendFontColor: '#333', 
        legendFontSize: 11 
      },
      { 
        name: `Zone 3 (${zones.zone3.min}-${zones.zone3.max})`, 
        population: Math.round((zoneCounts.zone3 / total) * 100), 
        color: zones.zone3.color, 
        legendFontColor: '#333', 
        legendFontSize: 11 
      },
      { 
        name: `Zone 4 (${zones.zone4.min}-${zones.zone4.max})`, 
        population: Math.round((zoneCounts.zone4 / total) * 100), 
        color: zones.zone4.color, 
        legendFontColor: '#333', 
        legendFontSize: 11 
      },
      { 
        name: `Zone 5 (${zones.zone5.min}-${zones.zone5.max})`, 
        population: Math.round((zoneCounts.zone5 / total) * 100), 
        color: zones.zone5.color, 
        legendFontColor: '#333', 
        legendFontSize: 11 
      },
    ].filter(zone => zone.population > 0); // Only show zones with data
  };

  const zones = calculateZones(maxHeartRate);
  const chartData = transformData(data, zones);
  
  const chartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  // Get training insight based on zone distribution
  const getTrainingInsight = () => {
    const zone2Percent = chartData.find(z => z.name.includes('Zone 2'))?.population || 0;
    const zone3Percent = chartData.find(z => z.name.includes('Zone 3'))?.population || 0;
    const zone4Percent = chartData.find(z => z.name.includes('Zone 4'))?.population || 0;

    if (zone2Percent > 60) {
      return "Great aerobic base building! Most of your run was in the aerobic zone.";
    } else if (zone3Percent > 30) {
      return "Good tempo work! You spent significant time in the tempo zone.";
    } else if (zone4Percent > 20) {
      return "High intensity session! Lots of threshold work in this run.";
    } else {
      return "Balanced effort across multiple heart rate zones.";
    }
  };

  if (chartData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Heart rate data not available for this run</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>💓</Text>
          <Text style={styles.noDataMessage}>
            Heart rate zones help you understand training intensity. 
            Connect a heart rate monitor for detailed zone analysis!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Time spent in each training zone</Text>
      
      <View style={styles.chartContainer}>
        <PieChart
          data={chartData}
          width={screenWidth - 60}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 0]}
          absolute
        />
      </View>

      {/* Training Insight */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>🎯 Training Insight</Text>
        <Text style={styles.insightText}>{getTrainingInsight()}</Text>
      </View>

      {/* Zone Guide */}
      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>Zone Guide:</Text>
        <Text style={styles.guideText}>
          • Zone 1-2: Easy/Recovery runs{'\n'}
          • Zone 3: Tempo/Comfortably hard{'\n'}
          • Zone 4: Threshold/Hard effort{'\n'}
          • Zone 5: VO2 Max/Very hard
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
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  insightCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
  guideCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  guideText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
});