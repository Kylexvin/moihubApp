import React from 'react';
import { View, Text, Button } from 'react-native';
import axios from 'axios';

const Checkout = ({ cart, user }) => {
  const handlePlaceOrder = async () => {
    try {
      const res = await axios.post('/echem/orders', {
        items: cart,
        userId: user._id,
      });
      // Clear cart, show success screen, etc
    } catch (err) {
      console.error('Checkout failed', err);
    }
  };

  return (
    <View>
      <Text>Confirm Order</Text>
      {/* Show order summary */}
      <Button title="Place Order" onPress={handlePlaceOrder} />
    </View>
  );
};

export default Checkout;
