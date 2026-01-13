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
        dark: false,
        colors: {
          primary: '#000000',
          background: '#FFFFFF',
          card: '#FFFFFF',
          text: '#000000',
          border: '#E5E5E5',
          notification: '#000000',
        },
      }}
    >
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#000000',
          tabBarInactiveTintColor: '#666666',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E5E5',
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: 8,
            height: 70,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 1,
            textTransform: 'uppercase',
          },
          headerStyle: {
            backgroundColor: '#FFFFFF',
            borderBottomColor: '#E5E5E5',
            borderBottomWidth: 1,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 10,
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontWeight: '900',
            fontSize: 22,
            letterSpacing: 2,
            textTransform: 'uppercase',
          },
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            title: 'STRDR',
            tabBarIcon: ({ color }) => '⚡',
            tabBarLabel: 'HOME'
          }}
        />
        <Tab.Screen 
          name="Analysis" 
          component={AnalysisScreen}
          options={{ 
            title: 'ANALYSIS',
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
            title: 'TARGETS',
            tabBarIcon: ({ color }) => '🎯',
            tabBarLabel: 'TARGETS'
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={RunnerProfileSetup}
          options={{ 
            title: 'PROFILE',
            tabBarIcon: ({ color }) => '👤',
            tabBarLabel: 'PROFILE'
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
