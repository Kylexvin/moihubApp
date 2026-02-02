// navigation/ServiceProviderTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../theme/Theme';

import ServiceProviderDashboard from '../screens/localservices/dashboard/ServiceProviderDashboard';
import ServiceManagement from '../screens/localservices/dashboard/ServiceManagement';
import ProductManagement from '../screens/localservices/dashboard/ProductManagement';
import BookingManagement from '../screens/localservices/dashboard/BookingManagement';
import Analytics from '../screens/localservices/dashboard/Analytics';

const { Colors, Typography } = Theme;
const Tab = createBottomTabNavigator();

const ServiceProviderTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="ServiceProviderDashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.primaryDark,
          borderTopColor: Colors.cardBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'ServiceProviderDashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ServiceManagement') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'ProductManagement') {
            iconName = focused ? 'bag' : 'bag-outline';
          } else if (route.name === 'BookingManagement') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="ServiceProviderDashboard" 
        component={ServiceProviderDashboard}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="BookingManagement" 
        component={BookingManagement}
        options={{ tabBarLabel: 'Bookings' }}
      />
      <Tab.Screen 
        name="ServiceManagement" 
        component={ServiceManagement}
        options={{ tabBarLabel: 'Services' }}
      />
      <Tab.Screen 
        name="ProductManagement" 
        component={ProductManagement}
        options={{ tabBarLabel: 'Products' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={Analytics}
        options={{ tabBarLabel: 'Analytics' }}
      />
    </Tab.Navigator>
  );
};

export default ServiceProviderTabNavigator;