import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/food/dashboards/DashboardScreen';
import OrdersScreen from '../screens/food/dashboards/OrdersScreen';
import FoodListingsStack from '../navigation/FoodListingsStack';

import ProfileScreen from '../screens/food/dashboards/ProfileScreen';
import SettingsScreen from '../screens/food/dashboards/SettingsScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

const FoodVendorNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'speedometer-outline',
            Orders: 'receipt-outline',
            Listings: 'restaurant-outline',
            Profile: 'person-outline',
            Settings: 'settings-outline'
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4caf50',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Listings" component={FoodListingsStack} />

      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default FoodVendorNavigator;
