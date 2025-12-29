import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import MetronomeScreen from './src/screens/MetronomeScreen';
import TargetsScreen from './src/screens/TargetsScreen';
import RunnerProfileSetup from './src/screens/RunnerProfileSetup';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: '#00FF9D',
          background: '#0A0A0A',
          card: 'rgba(255, 255, 255, 0.05)',
          text: '#FFFFFF',
          border: 'rgba(255, 255, 255, 0.1)',
          notification: '#00FF9D',
        },
      }}
    >
      <StatusBar style="light" backgroundColor="#0A0A0A" />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#00FF9D',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
          tabBarStyle: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: 8,
            height: 70,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          },
          headerStyle: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
            borderBottomWidth: 1,
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 20,
            letterSpacing: 1,
            textTransform: 'uppercase',
          },
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            title: 'CADENCE OPTIMIZER',
            tabBarIcon: ({ color }) => '🏠',
            tabBarLabel: 'HOME'
          }}
        />
        <Tab.Screen 
          name="Analysis" 
          component={AnalysisScreen}
          options={{ 
            title: 'FIT ANALYSIS',
            tabBarIcon: ({ color }) => '📊',
            tabBarLabel: 'ANALYSIS'
          }}
        />
        <Tab.Screen 
          name="Metronome" 
          component={MetronomeScreen}
          options={{ 
            title: 'METRONOME',
            tabBarIcon: ({ color }) => '🎵',
            tabBarLabel: 'METRONOME'
          }}
        />
        <Tab.Screen 
          name="Targets" 
          component={TargetsScreen}
          options={{ 
            title: 'RACE TARGETS',
            tabBarIcon: ({ color }) => '🎯',
            tabBarLabel: 'TARGETS'
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={RunnerProfileSetup}
          options={{ 
            title: 'RUNNER PROFILE',
            tabBarIcon: ({ color }) => '👤',
            tabBarLabel: 'PROFILE'
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
