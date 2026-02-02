// navigation/ServiceProviderDashboardNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ServiceProviderDashboard from '../screens/localservices/dashboard/ServiceProviderDashboard';

const Stack = createStackNavigator();

const ServiceProviderDashboardNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // This hides ALL headers in this navigator
        cardStyle: { backgroundColor: '#093028' },
        animationEnabled: true,
      }}
    >
      <Stack.Screen 
        name="ServiceProviderDashboard" 
        component={ServiceProviderDashboard}
        // You can also set headerShown: false on individual screen if needed
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default ServiceProviderDashboardNavigator;