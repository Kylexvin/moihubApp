import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Add this import

import HomeScreen from '../screens/HomeScreen';
import ServicesStackNavigator from './ServicesStackNavigator';
import MessageStackNavigator from './MessageStackNavigator';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const insets = useSafeAreaInsets(); // Use safe area insets instead

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#093028',
      // Use safe area insets instead of StatusBar.currentHeight
      paddingTop: Platform.OS === 'android' ? insets.top : 0 
    }}>
      <StatusBar barStyle="light-content" backgroundColor="#093028" translucent={false} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Services') {
              iconName = focused ? 'grid' : 'grid-outline';
            } else if (route.name === 'Messages') {
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }
            return <Ionicons name={iconName} size={size} color={focused ? '#fff' : '#bbb'} />;
          },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#bbb',
          tabBarStyle: {
            paddingVertical: 5,
            height: 60,
            backgroundColor: '#093028',
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Services" component={ServicesStackNavigator} />
        <Tab.Screen name="Messages" component={MessageStackNavigator} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
};

export default MainTabNavigator;