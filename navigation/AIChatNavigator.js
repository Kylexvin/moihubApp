// C:\Users\Administrator\Projects\moihub-clean\navigation\AIChatNavigator.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AIChatMainScreen from '../screens/ai/AIChatMainScreen'; // Changed import name

const Stack = createStackNavigator();

const AIChatNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#f5f5f5' },
      }}
    >
      <Stack.Screen 
        name="AIChatMainScreen" // Changed from 'AIChat' to 'AIChatMainScreen'
        component={AIChatMainScreen}
        options={{
          title: 'AI Assistant',
        }}
      />
    </Stack.Navigator>
  );
};

export default AIChatNavigator;