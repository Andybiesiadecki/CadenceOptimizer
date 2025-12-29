import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function HeartRateZoneChart({ data, maxHeartRate = 190, title = "Heart Rate Zones" }) {
  // Calculate HR zones based on max HR
  const calculateZones = (maxHR) => ({
    zone1: { min: 0, max: Math.round(maxHR * 0.6), name: 'Recovery', color: '#00D4FF' },
    zone2: { min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7), name: 'Aerobic', color: '#00FF9D' },
    zone3: { min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8), name: 'Tempo', color: '#FFD700' },
    zone4: { min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9), name: 'Threshold', color: '#FF6B35' },
    zone5: { min: Math.round(maxHR * 0.9), max: maxHR, name: 'VO2 Max', color: '#FF1744' },
  });

  // Transform data for pie chart
  const transformData = (rawData, zones) => {
    if (!rawData || rawData.length === 0) {
      // Mock data for demonstration
      return [
        { name: 'Zone 1 (Recovery)', population: 15, color: '#00D4FF', legendFontColor: '#FFFFFF', legendFontSize: 12 },
        { name: 'Zone 2 (Aerobic)', population: 45, color: '#00FF9D', legendFontColor: '#FFFFFF', legendFontSize: 12 },
        { name: 'Zone 3 (Tempo)', population: 25, color: '#FFD700', legendFontColor: '#FFFFFF', legendFontSize: 12 },
        { name: 'Zone 4 (Threshold)', population: 12, color: '#FF6B35', legendFontColor: '#FFFFFF', legendFontSize: 12 },
        { name: 'Zone 5 (VO2 Max)', population: 3, color: '#FF1744', legendFontColor: '#FFFFFF', legendFontSize: 12 },
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
        legendFontColor: '#FFFFFF', 
        legendFontSize: 11 
      },
      { 
        name: `Zone 2 (${zones.zone2.min}-${zones.zone2.max})`, 
        population: Math.round((zoneCounts.zone2 / total) * 100), 
        color: zones.zone2.color, 
        legendFontColor: '#FFFFFF', 
        legendFontSize: 11 
      },
      { 
        name: `Zone 3 (${zones.zone3.min}-${zones.zone3.max})`, 
        population: Math.round((zoneCounts.zone3 / total) * 100), 
        color: zones.zone3.color, 
        legendFontColor: '#FFFFFF', 
        legendFontSize: 11 
      },
      { 
        name: `Zone 4 (${zones.zone4.min}-${zones.zone4.max})`, 
        population: Math.round((zoneCounts.zone4 / total) * 100), 
        color: zones.zone4.color, 
        legendFontColor: '#FFFFFF', 
        legendFontSize: 11 
      },
      { 
        name: `Zone 5 (${zones.zone5.min}-${zones.zone5.max})`, 
        population: Math.round((zoneCounts.zone5 / total) * 100), 
        color: zones.zone5.color, 
        legendFontColor: '#FFFFFF', 
        legendFontSize: 11 
      },
    ].filter(zone => zone.population > 0); // Only show zones with data
  };

  const zones = calculateZones(maxHeartRate);
  const chartData = transformData(data, zones);
  
  const chartConfig = {
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
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
  insightCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00D4FF',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00D4FF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    fontWeight: '500',
  },
  guideCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  guideText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    fontWeight: '500',
  },
});