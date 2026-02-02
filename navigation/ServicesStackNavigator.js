// navigation/ServicesStackNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ServicesScreen from '../screens/ServicesScreen';
import LocalServices from '../screens/LocalServices';
import CategoryProviders from '../screens/CategoryProviders';
import EmergencyServices from '../screens/EmergencyServices';
import ProviderProfile from '../screens/localservices/ProviderProfile';
import ServiceProviderDashboard from '../screens/localservices/dashboard/ServiceProviderDashboard'; // ADD THIS

const Stack = createStackNavigator();

const ServicesStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="ServicesList"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#093028' },
        animationEnabled: true,
      }}
    >
      <Stack.Screen 
        name="ServicesList" 
        component={ServicesScreen}
      />
      
      <Stack.Screen 
        name="LocalServices" 
        component={LocalServices}
      />
      
      <Stack.Screen 
        name="CategoryProviders" 
        component={CategoryProviders}
      />
      
      <Stack.Screen 
        name="EmergencyServices" 
        component={EmergencyServices}
      />
      
      <Stack.Screen 
        name="ProviderProfile" 
        component={ProviderProfile}
      />
      
      {/* ADD THIS SCREEN */}
      <Stack.Screen 
        name="ServiceProviderDashboard" 
        component={ServiceProviderDashboard}
      />
    </Stack.Navigator>
  );
};

export default ServicesStackNavigator;