import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RentalHome from './RentalHome';
import RentalDetail from './RentalDetail';

const Stack = createNativeStackNavigator();

const AccomStack = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        headerStyle: {
          backgroundColor: '#059669',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="RentalHome"
        component={RentalHome}
        options={{ 
          title: 'Available Rentals',
          headerStyle: {
            backgroundColor: '#059669',
          },
        }}
      />
      <Stack.Screen
        name="RentalDetail"
        component={RentalDetail}
        options={{ 
          title: 'Rental Details',
          headerStyle: {
            backgroundColor: '#059669',
          },
        }}
      />
    </Stack.Navigator>
  );
};

export default AccomStack;