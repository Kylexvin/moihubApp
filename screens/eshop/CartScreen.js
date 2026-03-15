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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

// Royal Purple & Gold theme colors
const ShopColors = {
  primary: '#6B4EFF',      // Royal Purple
  secondary: '#9F7AEA',     // Lavender
  accent: '#FFD700',        // Gold
  success: '#4CAF50',       // Green
  warning: '#FF9800',       // Orange
  info: '#00ACC1',          // Cyan
  danger: '#F44336',        // Red
  background: '#0A0A0F',    // Deep Dark
  surface: '#1A1A2E',       // Dark Purple
  card: '#26264D',          // Royal Card
  text: '#FFFFFF',          // White
  textSecondary: '#E0B0FF', // Light Purple
  textMuted: '#9F8BB3',     // Muted Purple
  border: '#3D3D6B',        // Purple Border
  gold: '#FFD700',          // Pure Gold
  goldLight: '#FFE55C',     // Light Gold
  purpleLight: '#8B6FF6',   // Light Purple
};

// Header Component
const Header = ({ navigation, title, itemCount }) => (
  <LinearGradient
    colors={[ShopColors.primary, ShopColors.secondary]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.header}
  >
    <TouchableOpacity 
      onPress={() => navigation.goBack()}
      style={styles.headerButton}
    >
      <Icon name="arrow-back" size={24} color={ShopColors.gold} />
    </TouchableOpacity>
    
    <View style={styles.headerTitleContainer}>
      <Text style={styles.headerTitle}>{title}</Text>
      {itemCount > 0 && (
        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>{itemCount}</Text>
        </View>
      )}
    </View>
    
    <TouchableOpacity 
      onPress={() => navigation.navigate('EshopHome')}
      style={styles.headerButton}
    >
      <Icon name="home" size={22} color={ShopColors.gold} />
    </TouchableOpacity>
  </LinearGradient>
);

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
        'Your order has been submitted. The shop owner will contact you shortly.',
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
    
    // Default placeholder image
    const DEFAULT_PLACEHOLDER = 'https://via.placeholder.com/300x300?text=No+Image';

    const getImageUrl = () => {
      if (item.image && typeof item.image === 'string' && item.image.trim() !== '') {
        return item.image;
      }
      return DEFAULT_PLACEHOLDER;
    };

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
      <Animatable.View 
        animation="fadeInUp" 
        duration={400} 
        delay={index * 100}
      >
        <Animated.View style={[styles.cartItem, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={[ShopColors.card, ShopColors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.itemGradient}
          >
            {/* Gold Accent Line */}
            <View style={styles.itemGoldAccent} />
            
            <View style={styles.itemImageContainer}>
              <Image
                source={{ uri: getImageUrl() }}
                style={styles.itemImage}
                defaultSource={{ uri: DEFAULT_PLACEHOLDER }}
                onError={(e) => console.log('Image failed to load')}
              />
            </View>
            
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name || 'Unnamed Product'}
              </Text>
              
              <View style={styles.shopContainer}>
                <Icon name="store" size={14} color={ShopColors.gold} />
                <Text style={styles.itemShop}>{item.shopName || 'Unknown Shop'}</Text>
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
                  <Icon name="remove" size={18} color={ShopColors.gold} />
                </TouchableOpacity>
                
                <LinearGradient
                  colors={[ShopColors.primary, ShopColors.secondary]}
                  style={styles.quantityDisplay}
                >
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                </LinearGradient>
                
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => {
                    animatePress();
                    handleUpdateQuantity(item.productId, item.quantity + 1);
                  }}
                >
                  <Icon name="add" size={18} color={ShopColors.gold} />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveItem(item.productId)}
              >
                <Icon name="delete-outline" size={20} color={ShopColors.danger} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animatable.View>
    );
  };

  const renderCartItem = ({ item, index }) => (
    <CartItem item={item} index={index} />
  );

  // Floating Icons Component
  const FloatingIcons = () => (
    <View style={styles.floatingIcons}>
      <Text style={[styles.floatingIcon, styles.icon1]}>👑</Text>
      <Text style={[styles.floatingIcon, styles.icon2]}>✨</Text>
      <Text style={[styles.floatingIcon, styles.icon3]}>🛍️</Text>
      <Text style={[styles.floatingIcon, styles.icon4]}>💎</Text>
    </View>
  );

  // Show loading or login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <LinearGradient colors={[ShopColors.background, ShopColors.surface]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={ShopColors.primary} />
        <FloatingIcons />
        <SafeAreaView style={styles.safeArea}>
          <Animatable.View animation="fadeIn" duration={500} style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Icon name="account-circle" size={64} color={ShopColors.gold} />
            </View>
            <Text style={styles.emptyTitle}>Login Required</Text>
            <Text style={styles.emptyText}>
              Please log in to view your cart and place orders
            </Text>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => navigation.navigate('Login')}
            >
              <LinearGradient
                colors={[ShopColors.primary, ShopColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Icon name="login" size={20} color={ShopColors.gold} />
                <Text style={styles.actionButtonText}>Go to Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (cartItems.length === 0) {
    return (
      <LinearGradient colors={[ShopColors.background, ShopColors.surface]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={ShopColors.primary} />
        <FloatingIcons />
        <SafeAreaView style={styles.safeArea}>
          <Animatable.View animation="fadeIn" duration={500} style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Icon name="shopping-cart" size={64} color={ShopColors.gold} />
            </View>
            <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
            <Text style={styles.emptyText}>
              Discover amazing products from local shops and add them to your cart
            </Text>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => navigation.navigate('EshopHome')}
            >
              <LinearGradient
                colors={[ShopColors.primary, ShopColors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Icon name="storefront" size={20} color={ShopColors.gold} />
                <Text style={styles.actionButtonText}>Start Shopping</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[ShopColors.background, ShopColors.surface]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={ShopColors.primary} />
      <FloatingIcons />
      
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Header 
            navigation={navigation} 
            title="Shopping Cart" 
            itemCount={cartItems.length}
          />
          
          <ScrollView 
            style={styles.scrollView} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >

            {/* User Info */}
            {currentUser && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="person" size={20} color={ShopColors.gold} />
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                </View>
                <LinearGradient
                  colors={[ShopColors.card, ShopColors.surface]}
                  style={styles.userInfoCard}
                >
                  <Text style={styles.userInfo}>
                    {currentUser.name || currentUser.username}
                  </Text>
                  <Text style={styles.userEmail}>{currentUser.email}</Text>
                </LinearGradient>
              </View>
            )}

            {/* Cart Items */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="inventory" size={20} color={ShopColors.gold} />
                <Text style={styles.sectionTitle}>Your Items</Text>
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
                <Ionicons name="chatbubble-outline" size={20} color={ShopColors.gold} />
                <Text style={styles.sectionTitle}>Your Inquiry Message</Text>
              </View>
              <LinearGradient
                colors={[ShopColors.card, ShopColors.surface]}
                style={styles.inputGradient}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your message"
                  placeholderTextColor={ShopColors.textMuted}
                  value={shippingAddress}
                  onChangeText={setShippingAddress}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </LinearGradient>
            </View>

            {/* Contact Number */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="phone" size={20} color={ShopColors.gold} />
                <Text style={styles.sectionTitle}>Your Contact Number</Text>
              </View>
              <LinearGradient
                colors={[ShopColors.card, ShopColors.surface]}
                style={styles.inputGradient}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your phone number (calls)"
                  placeholderTextColor={ShopColors.textMuted}
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  keyboardType="phone-pad"
                />
              </LinearGradient>
            </View>

            {/* Order Summary */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="receipt" size={20} color={ShopColors.gold} />
                <Text style={styles.sectionTitle}>Order Summary</Text>
              </View>
              <LinearGradient
                colors={[ShopColors.card, ShopColors.surface]}
                style={styles.summaryContainer}
              >
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Items Total</Text>
                  <Text style={styles.summaryValue}>{formatPrice(getSubtotal())}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>{formatPrice(getSubtotal())}</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Information Notice */}
            <Animatable.View animation="fadeInUp" delay={500}>
              <LinearGradient
                colors={[ShopColors.card, ShopColors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.infoNotice}
              >
                <Icon name="info" size={20} color={ShopColors.gold} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>What happens next?</Text>
                  <Text style={styles.infoText}>
                    • Shop owners will contact you to confirm your order{'\n'}
                    • Payment and delivery details will be arranged directly{'\n'}
                    • Track your orders in the "Orders" section
                  </Text>
                </View>
              </LinearGradient>
            </Animatable.View>

            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Place Order Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={[styles.placeOrderButton, placingOrder && styles.buttonDisabled]}
              onPress={placeOrder}
              disabled={placingOrder}
            >
              <LinearGradient
                colors={placingOrder ? [ShopColors.textMuted, ShopColors.border] : [ShopColors.success, '#2E7D32']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.placeOrderGradient}
              >
                {placingOrder ? (
                  <>
                    <ActivityIndicator size={20} color={ShopColors.gold} />
                    <Text style={styles.placeOrderText}>Placing Inquiry...</Text>
                  </>
                ) : (
                  <>
                    <Icon name="send" size={20} color={ShopColors.gold} />
                    <Text style={styles.placeOrderText}>
                      Inquire - {formatPrice(getSubtotal())}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  floatingIcons: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  floatingIcon: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.1,
    color: ShopColors.gold,
  },
  icon1: {
    top: '10%',
    right: '5%',
    transform: [{ rotate: '15deg' }],
  },
  icon2: {
    top: '30%',
    left: '5%',
    transform: [{ rotate: '-10deg' }],
  },
  icon3: {
    bottom: '20%',
    right: '10%',
    transform: [{ rotate: '25deg' }],
  },
  icon4: {
    bottom: '40%',
    left: '8%',
    transform: [{ rotate: '-15deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.gold + '20',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ShopColors.gold + '10',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.gold,
    letterSpacing: 0.5,
  },
  itemCountBadge: {
    backgroundColor: ShopColors.gold,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  itemCountText: {
    color: ShopColors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
    fontSize: 16,
    fontWeight: '700',
    color: ShopColors.gold,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  userInfoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  userInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: ShopColors.textSecondary,
  },
  cartItem: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  itemGradient: {
    flexDirection: 'row',
    padding: 12,
    position: 'relative',
  },
  itemGoldAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: ShopColors.gold,
  },
  itemImageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
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
    fontSize: 15,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  shopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemShop: {
    fontSize: 12,
    color: ShopColors.gold,
    marginLeft: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.gold,
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 12,
    color: ShopColors.textMuted,
  },
  itemActions: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.background,
    borderRadius: 20,
    padding: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  quantityButton: {
    backgroundColor: ShopColors.card,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  quantityDisplay: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.gold,
  },
  removeButton: {
    backgroundColor: ShopColors.danger + '10',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ShopColors.danger + '40',
  },
  inputGradient: {
    borderRadius: 12,
    padding: 1,
  },
  textInput: {
    backgroundColor: ShopColors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: ShopColors.text,
    minHeight: 50,
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  summaryContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: ShopColors.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: ShopColors.textSecondary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: ShopColors.gold + '20',
    marginVertical: 8,
  },
  totalRow: {
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: ShopColors.gold,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: ShopColors.gold,
  },
  infoNotice: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.gold,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
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
    backgroundColor: ShopColors.background + '95',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: ShopColors.gold + '20',
    backdropFilter: 'blur(10px)',
  },
  placeOrderButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: ShopColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  placeOrderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  placeOrderText: {
    color: ShopColors.gold,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ShopColors.gold + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: ShopColors.gold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: ShopColors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyActionButton: {
    borderRadius: 30,
    overflow: 'hidden',
    width: '100%',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  actionButtonText: {
    color: ShopColors.gold,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CartScreen;