// STRDR Analytics Dashboard - View collected analytics data
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import analytics from '../services/AnalyticsService';

export default function AnalyticsDashboard({ visible, onClose }) {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    if (visible) {
      loadAnalytics();
    }
  }, [visible]);

  const loadAnalytics = async () => {
    const analyticsData = await analytics.getAnalyticsSummary();
    setEvents(analyticsData.slice(-20)); // Show last 20 events
    
    // Create summary
    const eventCounts = {};
    const featureUsage = {};
    
    analyticsData.forEach(event => {
      eventCounts[event.event] = (eventCounts[event.event] || 0) + 1;
      
      if (event.event === 'feature_usage') {
        const feature = event.properties.feature;
        featureUsage[feature] = (featureUsage[feature] || 0) + 1;
      }
    });
    
    setSummary({
      totalEvents: analyticsData.length,
      eventCounts,
      featureUsage,
      sessionStart: analytics.sessionStart
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.dashboard}>
        <View style={styles.header}>
          <Text style={styles.title}>📊 STRDR ANALYTICS</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SESSION SUMMARY</Text>
            <Text style={styles.stat}>Total Events: {summary.totalEvents}</Text>
            <Text style={styles.stat}>Session Duration: {Math.round((Date.now() - summary.sessionStart) / 1000 / 60)} minutes</Text>
          </View>

          {/* Feature Usage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FEATURE USAGE</Text>
            {Object.entries(summary.featureUsage || {}).map(([feature, count]) => (
              <Text key={feature} style={styles.stat}>
                {feature.toUpperCase()}: {count} times
              </Text>
            ))}
          </View>

          {/* Recent Events */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECENT EVENTS</Text>
            {events.map((event, index) => (
              <View key={index} style={styles.event}>
                <Text style={styles.eventName}>{event.event}</Text>
                <Text style={styles.eventTime}>
                  {new Date(event.properties.timestamp).toLocaleTimeString()}
                </Text>
                {event.properties.feature && (
                  <Text style={styles.eventDetail}>
                    {event.properties.feature} - {event.properties.action}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  dashboard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 50,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#000000',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#000000',
    marginBottom: 12,
  },
  stat: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  event: {
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    textTransform: 'uppercase',
  },
  eventTime: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
  },
  eventDetail: {
    fontSize: 10,
    color: '#333333',
    marginTop: 4,
  },
});