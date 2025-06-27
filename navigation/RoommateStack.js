import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoommateBrowse from '../screens/roommate/RoommateBrowse';
import RoommateCreate from '../screens/roommate/RoommateCreate';

const Stack = createNativeStackNavigator();

const RoommateStack = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        headerStyle: {
          backgroundColor: '#093028',
        },
        headerTintColor: '#E0FFF5',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="RoommateBrowse" 
        component={RoommateBrowse} 
        options={{ title: 'Browse Roommates' }} 
      />
      <Stack.Screen 
        name="RoommateCreate" 
        component={RoommateCreate} 
        options={{ title: 'Create Listing' }} 
      />
    </Stack.Navigator>
  );
};

export default RoommateStack;