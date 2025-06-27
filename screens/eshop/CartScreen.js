// screens/eshop/CartScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

const CartScreen = ({ navigation }) => {
  const { token, currentUser, isAuthenticated } = useAuth();
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal 
  } = useCart();

  const [shippingAddress, setShippingAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please log in to view your cart and place orders.',
        [
          {
            text: 'Login',
            onPress: () => navigation.navigate('Login')
          },
          {
            text: 'Cancel',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  }, [isAuthenticated, navigation, fadeAnim]);

  const formatPrice = (price) => {
    return `KSh ${price.toLocaleString()}`;
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId) => {
    const item = cartItems.find(item => item.productId === productId);
    Alert.alert(
      'Remove Item',
      `Remove "${item?.name}" from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            removeFromCart(productId);
          }
        }
      ]
    );
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const validateForm = () => {
    if (!isAuthenticated || !token) {
      Alert.alert('Error', 'Please log in to place an order');
      return false;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return false;
    }
    
    if (!shippingAddress.trim()) {
      Alert.alert('Missing Information', 'Please enter your delivery address');
      return false;
    }
    
    if (!contactNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter your contact number');
      return false;
    }
    
    return true;
  };

  const placeOrder = async () => {
    if (!validateForm()) return;
    
    setPlacingOrder(true);
    
    try {
      // Group items by shop
      const itemsByShop = cartItems.reduce((groups, item) => {
        const shopId = item.shopId;
        if (!groups[shopId]) {
          groups[shopId] = {
            shopId,
            shopName: item.shopName,
            items: []
          };
        }
        groups[shopId].items.push({
          productId: item.productId,
          quantity: item.quantity
        });
        return groups;
      }, {});

      // Place order for each shop
      const orderPromises = Object.values(itemsByShop).map(async (shopOrder) => {
        const response = await fetch('https://moihub.onrender.com/api/eshop/orders/place', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            shopId: shopOrder.shopId,
            items: shopOrder.items,
            shippingAddress: shippingAddress.trim(),
            contactNumber: contactNumber.trim(),
            userId: currentUser?.id || currentUser?._id,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          }
          throw new Error(data.message || `Failed to place order for ${shopOrder.shopName}`);
        }
        
        if (!data.success) {
          throw new Error(data.message || `Failed to place order for ${shopOrder.shopName}`);
        }
        
        return data;
      });

      await Promise.all(orderPromises);
      
      Alert.alert(
        'Order Placed Successfully! 🎉',
        'Your order has been submitted. The shop owner will contact you shortly to confirm details and arrange delivery.',
        [
          {
            text: 'Track Orders',
            onPress: () => {
              clearCart();
              navigation.navigate('Orders');
            }
          },
          {
            text: 'Continue Shopping',
            onPress: () => {
              clearCart();
              navigation.navigate('EshopHome');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error placing order:', error);
      
      if (error.message.includes('Authentication failed')) {
        Alert.alert(
          'Session Expired', 
          'Your session has expired. Please log in again.',
          [
            {
              text: 'Login',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert('Order Failed', error.message || 'Unable to place order. Please try again.');
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  const CartItem = ({ item, index }) => {
    const [scaleAnim] = useState(new Animated.Value(1));

    const animatePress = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    };

    return (
      <Animated.View style={[styles.cartItem, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.itemImageContainer}>
          <Image
            source={{ 
              uri: item.image || 'https://via.placeholder.com/80x80?text=Product'
            }}
            style={styles.itemImage}
            defaultSource={{ uri: 'https://via.placeholder.com/80x80?text=Product' }}
          />
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.shopContainer}>
            <Icon name="store" size={14} color="#6ee7b7" />
            <Text style={styles.itemShop}>{item.shopName}</Text>
          </View>
          <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.itemTotal}>
            Total: {formatPrice(item.price * item.quantity)}
          </Text>
        </View>
        
        <View style={styles.itemActions}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                animatePress();
                handleUpdateQuantity(item.productId, item.quantity - 1);
              }}
            >
              <Icon name="remove" size={18} color="#10b981" />
            </TouchableOpacity>
            
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{item.quantity}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                animatePress();
                handleUpdateQuantity(item.productId, item.quantity + 1);
              }}
            >
              <Icon name="add" size={18} color="#10b981" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.productId)}
          >
            <Icon name="delete-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderCartItem = ({ item, index }) => (
    <CartItem item={item} index={index} />
  );

  // Show loading or login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#064e3b" barStyle="light-content" />
        <View style={styles.emptyContainer}>
          <Icon name="account-circle" size={80} color="#374151" />
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptyText}>
            Please log in to view your cart and place orders
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Icon name="login" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#064e3b" barStyle="light-content" />
        <View style={styles.emptyContainer}>
          <Icon name="shopping-cart" size={80} color="#374151" />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptyText}>
            Discover amazing products from local shops and add them to your cart
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EshopHome')}
          >
            <Icon name="storefront" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#064e3b" barStyle="light-content" />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
         

          {/* User Info */}
          {currentUser && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                
              </View>
              <View style={styles.userInfoCard}>
                <Text style={styles.userInfo}>
                  {currentUser.name || currentUser.username}
                </Text>
                <Text style={styles.userEmail}>{currentUser.email}</Text>
              </View>
            </View>
          )}

          {/* Cart Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="inventory" size={20} color="#6ee7b7" />
              <Text style={styles.sectionTitle}>Items</Text>
            </View>
            <FlatList
              data={cartItems}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.productId}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Delivery Address */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="location-on" size={20} color="#6ee7b7" />
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your where to be delivered"
              placeholderTextColor="#94a3b8"
              value={shippingAddress}
              onChangeText={setShippingAddress}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Contact Number */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="phone" size={20} color="#6ee7b7" />
              <Text style={styles.sectionTitle}>Contact Number</Text>
            </View>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your phone number (calls)"
              placeholderTextColor="#94a3b8"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
            />
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="receipt" size={20} color="#6ee7b7" />
              <Text style={styles.sectionTitle}>Order Summary</Text>
            </View>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items Total</Text>
                <Text style={styles.summaryValue}>{formatPrice(getSubtotal())}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>{formatPrice(getSubtotal())}</Text>
              </View>
            </View>
          </View>

          {/* Information Notice */}
          <View style={styles.infoNotice}>
            <Icon name="info" size={20} color="#6ee7b7" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>What happens next?</Text>
              <Text style={styles.infoText}>
                • Shop owners will contact you to confirm your order{'\n'}
                • Payment and delivery details will be arranged directly{'\n'}
                • Track your orders in the "Orders" section
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Place Order Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.placeOrderButton, placingOrder && styles.buttonDisabled]}
            onPress={placeOrder}
            disabled={placingOrder}
          >
            {placingOrder ? (
              <>
                <ActivityIndicator size={20} color="#fff" />
                <Text style={styles.placeOrderText}>Placing Order...</Text>
              </>
            ) : (
              <>
                <Icon name="send" size={20} color="#fff" />
                <Text style={styles.placeOrderText}>
                  Place Order - {formatPrice(getSubtotal())}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#064e3b',
    padding: 20,
    paddingTop: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a7f3d0',
    marginLeft: 36,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9',
    marginLeft: 8,
  },
  userInfoCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#94a3b8',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemImageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemImage: {
    width: 70,
    height: 70,
    resizeMode: 'cover',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 6,
    lineHeight: 20,
  },
  shopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemShop: {
    fontSize: 12,
    color: '#6ee7b7',
    marginLeft: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 12,
    color: '#94a3b8',
  },
  itemActions: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 4,
    marginBottom: 8,
  },
  quantityButton: {
    backgroundColor: 'white',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityDisplay: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  removeButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f1f5f9',
    minHeight: 50,
  },
  summaryContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f1f5f9',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 8,
  },
  totalRow: {
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  infoNotice: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6ee7b7',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#a7f3d0',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  placeOrderButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#6b7280',
    elevation: 0,
    shadowOpacity: 0,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  actionButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CartScreen;