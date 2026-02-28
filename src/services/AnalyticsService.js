// STRDR Analytics Service
// Simple analytics tracking for user behavior and app performance

class AnalyticsService {
  constructor() {
    this.events = [];
    this.sessionStart = Date.now();
    this.userId = this.generateUserId();
  }

  generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  // Track user events
  track(eventName, properties = {}) {
    const event = {
      event: eventName,
      properties: {
        ...properties,
        userId: this.userId,
        timestamp: Date.now(),
        sessionId: this.sessionStart
      }
    };

    this.events.push(event);

    // Store locally for now (can sync to server later)
    this.storeEvent(event);
  }

  // Store events locally
  async storeEvent(event) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const existingEvents = await AsyncStorage.getItem('analytics_events');
      const events = existingEvents ? JSON.parse(existingEvents) : [];
      events.push(event);
      
      // Keep only last 100 events to avoid storage bloat
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      await AsyncStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      // Storage error - silently ignore
    }
  }

  // Screen tracking
  trackScreen(screenName) {
    this.track('screen_view', { screen: screenName });
  }

  // Feature usage tracking
  trackFeatureUsage(feature, action, metadata = {}) {
    this.track('feature_usage', {
      feature,
      action,
      ...metadata
    });
  }

  // Performance tracking
  trackPerformance(operation, duration, success = true) {
    this.track('performance', {
      operation,
      duration,
      success
    });
  }

  // Error tracking
  trackError(error, context = '') {
    this.track('error', {
      error: error.message || error,
      stack: error.stack,
      context
    });
  }

  // User actions
  trackUserAction(action, details = {}) {
    this.track('user_action', {
      action,
      ...details
    });
  }

  // Get analytics summary
  async getAnalyticsSummary() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const events = await AsyncStorage.getItem('analytics_events');
      return events ? JSON.parse(events) : [];
    } catch (error) {
      return [];
    }
  }
}

// Create singleton instance
const analytics = new AnalyticsService();

export default analytics;