// navigation/ServicesStackNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ServicesScreen from '../screens/ServicesScreen';
import LocalServices from '../screens/LocalServices';
import CategoryProviders from '../screens/CategoryProviders';
import EmergencyServices from '../screens/EmergencyServices';


const Stack = createStackNavigator();

const ServicesStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServicesList" component={ServicesScreen} />
      <Stack.Screen name="LocalServices" component={LocalServices} />
      <Stack.Screen name="CategoryProviders" component={CategoryProviders} />
      <Stack.Screen name="EmergencyServices" component={EmergencyServices} />
      
    </Stack.Navigator>
  );
};

export default ServicesStackNavigator;