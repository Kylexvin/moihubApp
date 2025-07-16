import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PharmacyLanding from '../screens/echem/PharmacyLanding';
import PharmacyProducts from '../screens/echem/PharmacyProducts';
import Cart from '../screens/echem/Cart';
import Checkout from '../screens/echem/Checkout';

const Stack = createNativeStackNavigator();

const EchemNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="PharmacyLanding"
      screenOptions={{ headerShown: false }} // 🔥 disables all headers
    >
      <Stack.Screen name="PharmacyLanding" component={PharmacyLanding} />
      <Stack.Screen name="PharmacyProducts" component={PharmacyProducts} />
      <Stack.Screen name="Cart" component={Cart} />
      <Stack.Screen name="Checkout" component={Checkout} />
    </Stack.Navigator>
  );
};

export default EchemNavigator;
