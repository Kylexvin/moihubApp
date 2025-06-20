// navigation/EshopNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import EshopHomeScreen from '../screens/eshop/EshopHomeScreen';
import CategoryShopsScreen from '../screens/eshop/CategoryShopsScreen';
import ShopProductsScreen from '../screens/eshop/ShopProductsScreen';
import ProductDetailScreen from '../screens/eshop/ProductDetailScreen';
import CartScreen from '../screens/eshop/CartScreen';
import OrdersScreen from '../screens/eshop/OrdersScreen';

const Stack = createStackNavigator();

const EshopNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="EshopHome"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#059669', // Emerald 600
          elevation: 4,
          shadowOpacity: 0.1,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTitleAlign: 'center',
        cardStyle: {
          backgroundColor: '#f8fafc',
        },
      }}
    >
      <Stack.Screen
        name="EshopHome"
        component={EshopHomeScreen}
        options={{
          title: '🛍️ E-Shop',
          headerStyle: {
            backgroundColor: '#059669',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerShown: false, // Hide header for home screen since we have custom header
        }}
      />
      <Stack.Screen
        name="CategoryShops"
        component={CategoryShopsScreen}
        options={({ route }) => ({
          title: `🏪 ${route.params?.categoryName || 'Shops'}`,
          headerStyle: {
            backgroundColor: '#047857', // Emerald 700
          },
           headerShown: false, 
        })}
      />
      <Stack.Screen
        name="ShopProducts"
        component={ShopProductsScreen}
        options={({ route }) => ({
          title: `📦 ${route.params?.shopName || 'Products'}`,
          headerStyle: {
            backgroundColor: '#047857', // Emerald 700
          },
           headerShown: false, 
        })}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          title: '📱 Product Details',
          headerStyle: {
            backgroundColor: '#047857', // Emerald 700
          },
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: '🛒 Shopping Cart',
          headerStyle: {
            backgroundColor: '#10b981', // Emerald 500
          },  headerShown: false, 
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: '📋 My Orders',
          headerStyle: {
            backgroundColor: '#10b981', // Emerald 500
          },
          headerBackTitleVisible: false, 
        }}
      />
    </Stack.Navigator>
  );
};

export default EshopNavigator;