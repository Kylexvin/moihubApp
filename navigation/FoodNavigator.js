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
          <Ionicons name="chevron-back" size={24} color={tintColor} style={{ marginLeft: Platform.OS === 'ios' ? 10 : 0 }} />
        ),
      }}
    >
      <Stack.Screen 
        name="FoodHome" 
        component={FoodScreen} 
        options={{ title: 'Food Delivery' }}
      />
      <Stack.Screen 
        name="FoodVendor" 
        component={FoodVendorScreen} 
        options={({ route }) => ({ title: route.params?.shopName || 'Food Vendor' })}
      />
      <Stack.Screen 
        name="Order" 
        component={OrderScreen} 
        options={{ title: 'Place Order' }}
      />
      <Stack.Screen 
        name="MyOrders" 
        component={MyOrdersScreen} 
        options={{ title: 'My Orders' }}
      />
    </Stack.Navigator>
  );
};

export default FoodNavigator;