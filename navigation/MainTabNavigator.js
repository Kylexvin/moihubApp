import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar, View } from 'react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native'; // Add this import

import HomeScreen from '../screens/HomeScreen';
import ServicesStackNavigator from './ServicesStackNavigator';
import MessageStackNavigator from './MessageStackNavigator';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#093028' }}>
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
              iconName = focused ? 'chatbubble' : 'chatbubble-ellipses-outline';
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

        <Tab.Screen
          name="Services"
          component={ServicesStackNavigator}
          listeners={({ navigation }) => ({
            tabPress: e => {
              e.preventDefault();
              navigation.navigate('Services', { screen: 'ServicesList' });
            },
          })}
        />

        <Tab.Screen 
          name="Messages" 
          component={MessageStackNavigator}
          options={({ route }) => {
            // Get the current route name from the MessageStackNavigator
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'ChatList';
            
            // Hide tab bar for ChatScreen and NewChatScreen, keep it for ChatList
            const hideTabBarRoutes = ['ChatScreen', 'NewChatScreen'];
            
            return {
              tabBarStyle: hideTabBarRoutes.includes(routeName) 
                ? { display: 'none' } 
                : {
                    paddingVertical: 5,
                    height: 60,
                    backgroundColor: '#093028',
                  },
            };
          }}
        />
        
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
};

export default MainTabNavigator;