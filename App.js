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
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Cadence Optimizer' }}
        />
        <Tab.Screen 
          name="Analysis" 
          component={AnalysisScreen}
          options={{ title: 'FIT Analysis' }}
        />
        <Tab.Screen 
          name="Metronome" 
          component={MetronomeScreen}
          options={{ title: 'Metronome' }}
        />
        <Tab.Screen 
          name="Targets" 
          component={TargetsScreen}
          options={{ title: 'Race Targets' }}
        />
        <Tab.Screen 
          name="Profile" 
          component={RunnerProfileSetup}
          options={{ title: 'Runner Profile' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
