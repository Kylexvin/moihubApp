import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenCapture from 'expo-screen-capture'; // Screenshot protection

import LinkMeEntry from '../screens/LinkMe/LinkMeEntry';
import OnboardingStart from '../screens/LinkMe/OnboardingStart';
import IdentityStep from '../screens/LinkMe/IdentityStep';
import PersonalityStep from '../screens/LinkMe/PersonalityStep';
import SelfieStep from '../screens/LinkMe/SelfieStep';
import ProfilePhotoStep from '../screens/LinkMe/ProfilePhotoStep';
import ReviewSubmit from '../screens/LinkMe/ReviewSubmit';
import AwaitingApproval from '../screens/LinkMe/AwaitingApproval';
import RejectionScreen from '../screens/LinkMe/RejectionScreen';
import SwipeFeed from '../screens/LinkMe/SwipeFeed';
import MatchesScreen from '../screens/LinkMe/MatchesScreen';
import MessageStackNavigator from './MessageStackNavigator';

const ProfileScreen = () => (
  <LinearGradient colors={['#0a0a0a', '#1a1a2e']} style={styles.placeholderContainer}>
    <Icon name="person-circle" size={80} color="#7b20a1" />
    <Text style={styles.placeholderTitle}>Profile</Text>
    <Text style={styles.placeholderSubtitle}>Manage your profile and settings</Text>
    <Text style={styles.comingSoon}>Coming Soon!</Text>
  </LinearGradient>
);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Discover') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#7b20a1',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          paddingVertical: 8,
          paddingBottom: 25,
          height: 85,
          position: 'absolute',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={['rgba(26, 26, 46, 0.95)', 'rgba(10, 10, 10, 0.95)']}
            style={{
              flex: 1,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 5,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Discover" 
        component={SwipeFeed}
        options={{ tabBarLabel: 'Discover' }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen}
        options={{ tabBarLabel: 'Matches' }}
      />
     
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

const LinkMeNavigator = () => {
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, []);

  return (
    <Stack.Navigator initialRouteName="LinkMeEntry">
      <Stack.Screen
        name="LinkMeEntry"
        component={LinkMeEntry}
        options={{ headerTitle: 'LinkMe', headerShown: true }}
      />
      <Stack.Screen
        name="OnboardingStart"
        component={OnboardingStart}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="IdentityStep"
        component={IdentityStep}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PersonalityStep"
        component={PersonalityStep}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SelfieStep"
        component={SelfieStep}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfilePhotoStep"
        component={ProfilePhotoStep}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReviewSubmit"
        component={ReviewSubmit}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AwaitingApproval"
        component={AwaitingApproval}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RejectionScreen"
        component={RejectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SwipeFeed"
        component={MainTabNavigator}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  comingSoon: {
    fontSize: 14,
    color: '#7b20a1',
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#7b20a1',
    backgroundColor: 'rgba(123, 32, 161, 0.1)',
  },
});

export default LinkMeNavigator;
