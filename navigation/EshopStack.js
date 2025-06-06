import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EShopHome from '../screens/eshop/HomeScreen';

const Stack = createNativeStackNavigator();

const EShopStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="EShopHome" component={EShopHome} options={{ headerShown: false }} />
  </Stack.Navigator>
);

export default EShopStack;
