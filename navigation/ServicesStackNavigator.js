import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ServicesScreen from '../screens/ServicesScreen';
import LocalServices from '../screens/LocalServices';
import EmergencyServices from '../screens/EmergencyServices';
import LinkMeNavigator from './LinkMeNavigator'; 


const Stack = createStackNavigator();

const ServicesStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServicesList" component={ServicesScreen} />
      <Stack.Screen name="LocalServices" component={LocalServices} />
      <Stack.Screen name="EmergencyServices" component={EmergencyServices} />
       <Stack.Screen name="LinkMeStack" component={LinkMeNavigator} />
    </Stack.Navigator>
  );
};

export default ServicesStackNavigator;
