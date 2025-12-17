import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { saveRunnerProfile } from '../utils/storage';

export default function RunnerProfileSetup({ navigation, onComplete }) {
  const [profile, setProfile] = useState({
    height: '',
    weight: '',
    age: '',
    experience: 'moderate',
  });
  const [units, setUnits] = useState('metric'); // metric or imperial
  const [loading, setLoading] = useState(false);

  const experienceLevels = [
    { key: 'beginner', label: 'Beginner', desc: 'New to running or < 1 year' },
    { key: 'moderate', label: 'Moderate', desc: '1-3 years of regular running' },
    { key: 'advanced', label: 'Advanced', desc: '3+ years, competitive runner' },
    { key: 'elite', label: 'Elite', desc: 'Professional/sub-elite athlete' },
  ];

  const handleSave = async () => {
    // Validate inputs
    if (!profile.height || !profile.weight || !profile.age) {
      Alert.alert('Missing Information', 'Please fill in all fields to continue.');
      return;
    }

    const height = parseFloat(profile.height);
    const weight = parseFloat(profile.weight);
    const age = parseInt(profile.age);

    // Validate ranges
    if (units === 'metric') {
      if (height < 120 || height > 220) {
        Alert.alert('Invalid Height', 'Please enter a height between 120-220 cm.');
        return;
      }
      if (weight < 30 || weight > 200) {
        Alert.alert('Invalid Weight', 'Please enter a weight between 30-200 kg.');
        return;
      }
    } else {
      if (height < 48 || height > 84) {
        Alert.alert('Invalid Height', 'Please enter a height between 48-84 inches.');
        return;
      }
      if (weight < 66 || weight > 440) {
        Alert.alert('Invalid Weight', 'Please enter a weight between 66-440 lbs.');
        return;
      }
    }

    if (age < 13 || age > 100) {
      Alert.alert('Invalid Age', 'Please enter an age between 13-100 years.');
      return;
    }

    setLoading(true);

    try {
      // Convert to metric if needed
      const profileData = {
        height: units === 'metric' ? height : height * 2.54, // inches to cm
        weight: units === 'metric' ? weight : weight * 0.453592, // lbs to kg
        age,
        experience: profile.experience,
        units,
        createdAt: new Date().toISOString(),
      };

      await saveRunnerProfile(profileData);
      
      Alert.alert(
        'Profile Saved!',
        'Your runner profile has been created. All cadence recommendations will now be personalized for you.',
        [
          {
            text: 'Continue',
            onPress: () => {
              if (onComplete) {
                onComplete(profileData);
              } else if (navigation) {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Your Runner Profile</Text>
        <Text style={styles.subtitle}>
          Help us personalize your cadence recommendations
        </Text>
      </View>

      {/* Units Toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Units</Text>
        <View style={styles.unitsToggle}>
          <TouchableOpacity
            style={[styles.unitButton, units === 'metric' && styles.unitButtonActive]}
            onPress={() => setUnits('metric')}
          >
            <Text style={[styles.unitButtonText, units === 'metric' && styles.unitButtonTextActive]}>
              Metric (cm/kg)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, units === 'imperial' && styles.unitButtonActive]}
            onPress={() => setUnits('imperial')}
          >
            <Text style={[styles.unitButtonText, units === 'imperial' && styles.unitButtonTextActive]}>
              Imperial (in/lbs)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Height */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Height {units === 'metric' ? '(cm)' : '(inches)'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={units === 'metric' ? 'e.g., 175' : 'e.g., 69'}
          value={profile.height}
          onChangeText={(value) => updateProfile('height', value)}
          keyboardType="numeric"
        />
      </View>

      {/* Weight */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Weight {units === 'metric' ? '(kg)' : '(lbs)'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={units === 'metric' ? 'e.g., 70' : 'e.g., 154'}
          value={profile.weight}
          onChangeText={(value) => updateProfile('weight', value)}
          keyboardType="numeric"
        />
      </View>

      {/* Age */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Age (years)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 30"
          value={profile.age}
          onChangeText={(value) => updateProfile('age', value)}
          keyboardType="numeric"
        />
      </View>

      {/* Running Experience */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Running Experience</Text>
        <View style={styles.experienceGrid}>
          {experienceLevels.map((level) => (
            <TouchableOpacity
              key={level.key}
              style={[
                styles.experienceCard,
                profile.experience === level.key && styles.experienceCardActive
              ]}
              onPress={() => updateProfile('experience', level.key)}
            >
              <Text style={[
                styles.experienceLabel,
                profile.experience === level.key && styles.experienceLabelActive
              ]}>
                {level.label}
              </Text>
              <Text style={[
                styles.experienceDesc,
                profile.experience === level.key && styles.experienceDescActive
              ]}>
                {level.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Save Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Your data is stored locally on your device and never shared.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  unitsToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  unitButtonTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  experienceGrid: {
    gap: 12,
  },
  experienceCard: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
  },
  experienceCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  experienceLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  experienceLabelActive: {
    color: '#007AFF',
  },
  experienceDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  experienceDescActive: {
    color: '#1976D2',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});