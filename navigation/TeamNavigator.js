// navigation/TeamNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TeamScreen from '../screens/team/TeamScreen';

const Stack = createNativeStackNavigator();

const TeamNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="TeamScreen" 
        component={TeamScreen} 
        options={{ title: 'Meet the Team' }} 
      />
    </Stack.Navigator>
  );
};

export default TeamNavigator;