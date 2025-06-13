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
          backgroundColor: '#6366f1',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="EshopHome"
        component={EshopHomeScreen}
        options={{
          title: '🛍️ E-Shop Categories',
          headerStyle: {
            backgroundColor: '#6366f1',
          },
        }}
      />
      <Stack.Screen
        name="CategoryShops"
        component={CategoryShopsScreen}
        options={({ route }) => ({
          title: `🏪 ${route.params?.categoryName || 'Shops'}`,
        })}
      />
      <Stack.Screen
        name="ShopProducts"
        component={ShopProductsScreen}
        options={({ route }) => ({
          title: `📦 ${route.params?.shopName || 'Products'}`,
        })}
      />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          title: '📱 Product Details',
        }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: '🛒 Shopping Cart',
        }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: '📋 My Orders',
        }}
      />
    </Stack.Navigator>
  );
};

export default EshopNavigator;