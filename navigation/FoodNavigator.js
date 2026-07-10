// navigation/FoodNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import food-related screens
import FoodScreen from '../screens/food/FoodScreen';
import FoodVendorScreen from '../screens/food/FoodVendorScreen';
import OrderScreen from '../screens/food/OrderScreen';
import MyOrdersScreen from '../screens/food/MyOrdersScreen';

const Stack = createNativeStackNavigator();

const FoodNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="FoodHome"
      screenOptions={{
        headerShown: false, 
        gestureEnabled: true
        
      }}
    >
      <Stack.Screen 
        name="FoodHome" 
        component={FoodScreen} 
      />
      <Stack.Screen 
        name="FoodVendor" 
        component={FoodVendorScreen}
        options={{
          headerShown: false, 
          headerStyle: {
            backgroundColor: 'ivory',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitleVisible: false,
          headerShadowVisible: false,
          headerBackImage: ({ tintColor }) => (
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={tintColor} 
              style={{ marginLeft: Platform.OS === 'ios' ? 10 : 0 }} 
            />
          ),
          title: 'Restaurant',
        }}
      />
      <Stack.Screen 
        name="Order" 
        component={OrderScreen}
        options={{
          headerShown: false, 
          headerStyle: {
            backgroundColor: '#005f4b',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitleVisible: false,
          headerShadowVisible: false,
          headerBackImage: ({ tintColor }) => (
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={tintColor} 
              style={{ marginLeft: Platform.OS === 'ios' ? 10 : 0 }} 
            />
          ),
          title: 'Your Order',
        }}
      />
      <Stack.Screen 
        name="MyOrders" 
        component={MyOrdersScreen}
        options={{
          headerShown: false, 
          headerStyle: {
            backgroundColor: '#005f4b',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitleVisible: false,
          headerShadowVisible: false,
          headerBackImage: ({ tintColor }) => (
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={tintColor} 
              style={{ marginLeft: Platform.OS === 'ios' ? 10 : 0 }} 
            />
          ),
          title: 'Order History',
        }}
      />
    </Stack.Navigator>
  );
};

export default FoodNavigator;