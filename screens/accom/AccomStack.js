import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RentalHome from './RentalHome';
import RentalDetail from './RentalDetail';
import CreateRental from './CreateRental';

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
      <Stack.Screen
        name="CreateRental"
        component={CreateRental}
        options={{
          title: 'Create Listing',
          headerShown: false,
          headerStyle: {
            backgroundColor: '#059669',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

export default AccomStack;
