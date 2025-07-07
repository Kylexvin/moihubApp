// navigation/FoodListingsStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ListingsScreen from '../screens/food/dashboards/ListingsScreen';
import AddListingScreen from '../screens/food/dashboards/AddListingScreen';
import EditListingScreen from '../screens/food/dashboards/EditListingScreen';
import ListingDetailsScreen from '../screens/food/dashboards/ListingDetailsScreen';

const Stack = createNativeStackNavigator();

const FoodListingsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false // ⛔ no default headers, screens will handle their own
      }}
    >
      <Stack.Screen name="ListingsMain" component={ListingsScreen} />
      <Stack.Screen name="AddListing" component={AddListingScreen} />
      <Stack.Screen name="EditListing" component={EditListingScreen} />
      <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} />
    </Stack.Navigator>
  );
};

export default FoodListingsStack;
