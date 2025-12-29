import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { getRunnerProfile } from '../utils/storage';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [hasProfile, setHasProfile] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const savedProfile = await getRunnerProfile();
      if (savedProfile) {
        setHasProfile(true);
        setProfile(savedProfile);
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  };

  const ActionCard = ({ icon, title, description, onPress, style = {} }) => (
    <TouchableOpacity 
      style={[styles.actionCard, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Text style={styles.cardIcon}>{icon}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </View>
      <View style={styles.cardArrow}>
        <Text style={styles.arrowText}>→</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroBackground}>
          <View style={styles.heroGlow} />
        </View>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>CADENCE</Text>
          <Text style={styles.heroTitleAccent}>OPTIMIZER</Text>
          <Text style={styles.heroSubtitle}>Your intelligent running coach</Text>
          <View style={styles.heroStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>170</Text>
              <Text style={styles.statLabel}>OPTIMAL SPM</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>AI</Text>
              <Text style={styles.statLabel}>POWERED</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>GPS</Text>
              <Text style={styles.statLabel}>ADAPTIVE</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions Section */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        
        <ActionCard
          icon="📊"
          title="ANALYZE FIT FILE"
          description="Upload your Garmin data for personalized cadence recommendations"
          onPress={() => navigation.navigate('Analysis')}
          style={styles.analysisCard}
        />

        <ActionCard
          icon="🎵"
          title="START METRONOME"
          description="Audio coaching with terrain-adaptive cadence"
          onPress={() => navigation.navigate('Metronome')}
          style={styles.metronomeCard}
        />

        <ActionCard
          icon="🎯"
          title="CALCULATE RACE TARGET"
          description="Optimize cadence for your next race"
          onPress={() => navigation.navigate('Targets')}
          style={styles.targetsCard}
        />

        {/* Profile Section */}
        {!hasProfile ? (
          <ActionCard
            icon="👤"
            title="CREATE RUNNER PROFILE"
            description="Get personalized recommendations based on your metrics"
            onPress={() => navigation.navigate('Profile')}
            style={styles.profileCard}
          />
        ) : (
          <TouchableOpacity 
            style={styles.profileCompleteCard}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <View style={styles.profileHeader}>
              <View style={styles.profileIconContainer}>
                <Text style={styles.profileIcon}>✅</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileTitle}>PROFILE COMPLETE</Text>
                <Text style={styles.profileDetails}>
                  {profile?.experience?.toUpperCase()} RUNNER
                </Text>
              </View>
            </View>
            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{Math.round(profile?.height)}</Text>
                <Text style={styles.profileStatLabel}>CM</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{profile?.age}</Text>
                <Text style={styles.profileStatLabel}>AGE</Text>
              </View>
              <View style={styles.profileStat}>
                <Text style={styles.profileStatValue}>{Math.round(profile?.weight)}</Text>
                <Text style={styles.profileStatLabel}>KG</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  
  // Hero Section Styles
  heroSection: {
    height: 280,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 255, 157, 0.05)',
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    height: 200,
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
    borderRadius: 200,
    transform: [{ scaleX: 2 }],
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 255, 157, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  heroTitleAccent: {
    fontSize: 42,
    fontWeight: '900',
    color: '#00FF9D',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: -8,
    textShadowColor: 'rgba(0, 255, 157, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#00FF9D',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 255, 157, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Actions Section Styles
  actionsSection: {
    padding: 24,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 24,
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textAlign: 'center',
  },

  // Action Card Styles
  actionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardIcon: {
    fontSize: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
    fontWeight: '500',
  },
  cardArrow: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 157, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 157, 0.2)',
  },
  arrowText: {
    fontSize: 18,
    color: '#00FF9D',
    fontWeight: '800',
  },

  // Specialized Card Styles
  analysisCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
  },
  metronomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#00FF9D',
    backgroundColor: 'rgba(0, 255, 157, 0.05)',
  },
  targetsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.05)',
  },
  profileCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
    backgroundColor: 'rgba(156, 39, 176, 0.05)',
  },

  // Profile Complete Card Styles
  profileCompleteCard: {
    backgroundColor: 'rgba(0, 255, 157, 0.08)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 157, 0.2)',
    shadowColor: '#00FF9D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 157, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 157, 0.3)',
  },
  profileIcon: {
    fontSize: 24,
  },
  profileInfo: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00FF9D',
    letterSpacing: 0.5,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 255, 157, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 32,
  },
});
