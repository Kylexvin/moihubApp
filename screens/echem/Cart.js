import React from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Assume cart is from context or state
const Cart = ({ cart }) => {
  const navigation = useNavigation();

  const goToCheckout = () => {
    navigation.navigate('Checkout');
  };

  return (
    <View>
      <FlatList
        data={cart}
        keyExtractor={(item) => item.product._id}
        renderItem={({ item }) => (
          <Text>{item.product.name} x {item.quantity}</Text>
        )}
      />
      <Button title="Proceed to Checkout" onPress={goToCheckout} />
    </View>
  );
};

export default Cart;
