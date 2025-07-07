// screens/food/OrderScreen.js 
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useFoodContext } from '../../context/FoodContext';
import axios from 'axios';

const OrderScreen = () => {
  const navigation = useNavigation();
  const { 
    cart, 
    updateCartItemQuantity, 
    removeFromCart, 
    clearCart,
    addRecentOrder 
  } = useFoodContext();
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Base URL configuration
  const baseURL = Platform.OS === 'ios'
    ? 'http://localhost:5000'
    : 'https://moihub.onrender.com';

  // Create order function
  const createOrder = async (orderData) => {
    try {
      // Use axios.post directly since authorization is already configured in app.js
      const response = await axios.post(`${baseURL}/api/food/orders`, orderData);

      return {
        success: true,
        order: response.data.order,
      };
    } catch (error) {
      console.error('Order API error:', error);
      console.error('Error details:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      };
    }
  };

  // Calculate the total price
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Group items by vendor
  const groupedByVendor = cart.reduce((groups, item) => {
    if (!groups[item.vendorId]) {
      groups[item.vendorId] = {
        vendorId: item.vendorId,
        shopName: item.vendorName,
        items: []
      };
    }
    groups[item.vendorId].items.push(item);
    return groups;
  }, {});
  
  const vendors = Object.values(groupedByVendor);

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) {
      // Prompt to remove item
      Alert.alert(
        'Remove Item',
        `Remove ${item.name} from cart?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            onPress: () => removeFromCart(item._id),
            style: 'destructive'
          }
        ]
      );
      return;
    }
    updateCartItemQuantity(item._id, newQuantity);
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
      return;
    }

    if (!deliveryInstructions.trim()) {
      Alert.alert('Missing Information', 'Please provide delivery instructions.');
      return;
    }

    setLoading(true);

    try {
      const successfulOrders = [];
      
      // Handle orders by vendor
      for (const vendor of vendors) {
        console.log('Processing order for vendor:', vendor.vendorId, vendor.shopName);
        
        const orderItems = vendor.items.map(item => ({
          listingId: item._id,
          quantity: item.quantity
        }));

        const orderData = {
          items: orderItems,
          vendorId: vendor.vendorId,
          deliveryInstructions: deliveryInstructions
        };

        console.log('Sending order data:', JSON.stringify(orderData));
        
        // Use the integrated createOrder function
        const response = await createOrder(orderData);
        console.log('Order API response:', JSON.stringify(response));
        
        if (!response.success) {
          throw new Error(response.message || `Failed to place order with ${vendor.shopName}`);
        }
        
        // Store successful order in our array
        successfulOrders.push(response.order);
      }

      // Add recent orders to context for quick reference
      successfulOrders.forEach(order => addRecentOrder(order));
      
      // Clear the cart after successful orders
      clearCart();
      
      Alert.alert(
        'Order Placed Successfully',
        'Your order has been placed and will be processed shortly.',
        [{ text: 'OK', onPress: () => navigation.navigate('MyOrders') }]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(
        'Order Failed',
        error.message || 'Something went wrong. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image 
        source={{ uri: item.imageURL || 'https://via.placeholder.com/100' }} 
        style={styles.itemImage} 
      />
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>Ksh {item.price}</Text>
      </View>
      
      <View style={styles.quantityContainer}>
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item, item.quantity - 1)}
        >
          <Ionicons name="remove" size={20} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.quantity}>{item.quantity}</Text>
        
        <TouchableOpacity 
          style={styles.quantityButton}
          onPress={() => handleQuantityChange(item, item.quantity + 1)}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVendorGroup = ({ item: vendor }) => (
    <View style={styles.vendorGroup}>
      <View style={styles.vendorHeader}>
        <Ionicons name="restaurant" size={20} color="#004d40" />
        <Text style={styles.vendorName}>{vendor.shopName}</Text>
      </View>
      <FlatList
        data={vendor.items}
        renderItem={renderCartItem}
        keyExtractor={item => item._id}
        scrollEnabled={false}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <Ionicons name="cart-outline" size={80} color="#b0bec5" />
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.shopButtonText}>Go Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={vendors}
            renderItem={renderVendorGroup}
            keyExtractor={vendor => vendor.vendorId}
            contentContainerStyle={styles.listContainer}
            ListFooterComponent={(
              <View style={styles.footerContainer}>
                <Text style={styles.deliveryLabel}>Delivery Instructions:</Text>
                <TextInput
                  style={styles.deliveryInput}
                  placeholder="Room number, phone number, landmark, etc."
                  value={deliveryInstructions}
                  onChangeText={setDeliveryInstructions}
                  multiline
                />
              </View>
            )}
          />
          
          <View style={styles.summaryContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalPrice}>Ksh {totalPrice}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={placeOrder}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.placeOrderText}>Place Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'ivory',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 18,
    marginTop: 12,
    color: '#78909c',
  },
  shopButton: {
    backgroundColor: '#fe5722',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
    elevation: 2,
  },
  shopButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  vendorGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    elevation: 2,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2f1',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004d40',
    marginLeft: 8,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor:'#fe5722',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    paddingHorizontal: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#004d40',
  },
  itemPrice: {
    fontSize: 14,
    color: '#00695c',
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#fe5722',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  footerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  deliveryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004d40',
    marginBottom: 8,
  },
  deliveryInput: {
    borderWidth: 1,
    borderColor: '#fe5722',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#004d40',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004d40',
  },
  placeOrderButton: {
    backgroundColor:'#fe5722',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderScreen;