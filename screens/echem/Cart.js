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
import { BlurView } from 'expo-blur';
import { MaterialIcons as Icon, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

// Pharmacy/Medical Theme (matching PharmacyProducts)
const PharmacyColors = {
  primary: '#1B5E20',      // Dark Green
  secondary: '#2E7D32',     // Medium Green
  accent: '#00ACC1',        // Dark Cyan
  success: '#43A047',       // Green
  warning: '#FB8C00',       // Orange
  error: '#E53935',         // Red
  whatsapp: '#25D366',      // WhatsApp Green
  background: '#0A1F0A',    // Very Dark Green
  surface: '#1A2E1A',       // Dark Green Surface
  card: '#1E3A1E',          // Card Background
  text: '#FFFFFF',          // White
  textSecondary: '#A5D6A7', // Light Green
  textMuted: '#558B55',     // Muted Green
  border: '#2E5A2E',        // Border Green
  gradient: ['#1B5E20', '#2E7D32', '#43A047'],
};

const Cart = ({ navigation }) => {
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
  const [prescriptionItems, setPrescriptionItems] = useState([]);

  useEffect(() => {
    StatusBar.setBarStyle('light-content', true);
    
    // Identify prescription items
    const rxItems = cartItems.filter(item => item.requiresPrescription);
    setPrescriptionItems(rxItems);

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (!isAuthenticated) {
      Alert.alert(
        '🔐 Authentication Required',
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
  }, [isAuthenticated, navigation, fadeAnim, cartItems]);

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
      '🗑️ Remove Item',
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

    // Validate Kenyan phone number
    const cleanNumber = contactNumber.replace(/\s/g, '');
    if (!/^\+254\d{9}$/.test(cleanNumber) && !/^0\d{9}$/.test(cleanNumber)) {
      Alert.alert('Invalid Number', 'Please enter a valid Kenyan phone number (e.g., +254712345678 or 0712345678)');
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
          quantity: item.quantity,
          requiresPrescription: item.requiresPrescription || false
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
            requiresPrescription: shopOrder.items.some(item => item.requiresPrescription),
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
        prescriptionItems.length > 0 ? '✅ Order Placed - Prescription Required' : '✅ Order Placed Successfully!',
        prescriptionItems.length > 0 
          ? 'Your order has been submitted. A pharmacist will review your prescription and contact you shortly.'
          : 'Your order has been submitted. The shop will contact you shortly to confirm details.',
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
              navigation.navigate('Echem'); 
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
    const isRx = item.requiresPrescription;

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
        <LinearGradient
          colors={[PharmacyColors.card, PharmacyColors.surface]}
          style={styles.itemGradient}
        >
          {/* Rx Badge for prescription items */}
          {isRx && (
            <View style={styles.rxBadge}>
              <Text style={styles.rxText}>Rx</Text>
            </View>
          )}

          <View style={styles.itemImageContainer}>
            <Image
              source={{ 
                uri: item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200'
              }}
              style={styles.itemImage}
              defaultSource={{ uri: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200' }}
            />
          </View>
          
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.shopContainer}>
              <Icon name="store" size={14} color={PharmacyColors.accent} />
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
                <Icon name="remove" size={16} color={PharmacyColors.accent} />
              </TouchableOpacity>
              
              <BlurView intensity={40} tint="dark" style={styles.quantityDisplay}>
                <Text style={styles.quantityText}>{item.quantity}</Text>
              </BlurView>
              
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  animatePress();
                  handleUpdateQuantity(item.productId, item.quantity + 1);
                }}
              >
                <Icon name="add" size={16} color={PharmacyColors.accent} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveItem(item.productId)}
            >
              <Icon name="delete-outline" size={18} color={PharmacyColors.error} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderCartItem = ({ item, index }) => (
    <CartItem item={item} index={index} />
  );

  // Floating medical icons background
  const renderFloatingIcons = () => (
    <View style={styles.floatingIcons}>
      <Text style={[styles.floatingIcon, styles.icon1]}>💊</Text>
      <Text style={[styles.floatingIcon, styles.icon2]}>🩺</Text>
      <Text style={[styles.floatingIcon, styles.icon3]}>💉</Text>
    </View>
  );

  // Show loading or login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={PharmacyColors.primary} barStyle="light-content" />
        {renderFloatingIcons()}
        <LinearGradient
          colors={[PharmacyColors.background, PharmacyColors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="account-circle" size={80} color={PharmacyColors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptyText}>
            Please log in to view your cart and place orders
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Login')}
          >
            <LinearGradient
              colors={[PharmacyColors.primary, PharmacyColors.secondary]}
              style={styles.actionButtonGradient}
            >
              <Icon name="login" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Go to Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={PharmacyColors.primary} barStyle="light-content" />
        {renderFloatingIcons()}
        <LinearGradient
          colors={[PharmacyColors.background, PharmacyColors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Icon name="shopping-cart" size={80} color={PharmacyColors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptyText}>
            Discover medical supplies and healthcare products from trusted pharmacies
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Echem')}
          >
            <LinearGradient
              colors={[PharmacyColors.primary, PharmacyColors.secondary]}
              style={styles.actionButtonGradient}
            >
              <Icon name="local-pharmacy" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Browse Pharmacy</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={PharmacyColors.primary} barStyle="light-content" />
      {renderFloatingIcons()}
      
      <LinearGradient
        colors={[PharmacyColors.background, PharmacyColors.surface]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <LinearGradient
          colors={[PharmacyColors.primary, PharmacyColors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Shopping Cart</Text>
            <View style={styles.cartBadge}>
              <BlurView intensity={60} tint="dark" style={styles.cartBadgeBlur}>
                <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
              </BlurView>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>{cartItems.length} items in your cart</Text>
        </LinearGradient>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Prescription Warning */}
          {prescriptionItems.length > 0 && (
            <View style={styles.prescriptionWarning}>
              <Icon name="warning" size={24} color={PharmacyColors.warning} />
              <View style={styles.prescriptionWarningContent}>
                <Text style={styles.prescriptionWarningTitle}>
                  Prescription Required
                </Text>
                <Text style={styles.prescriptionWarningText}>
                  {prescriptionItems.length} item(s) in your cart require a valid prescription
                </Text>
              </View>
            </View>
          )}

          {/* User Info */}
          {currentUser && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconContainer}>
                  <Icon name="person" size={18} color={PharmacyColors.accent} />
                </View>
                <Text style={styles.sectionTitle}>Patient Information</Text>
              </View>
              <BlurView intensity={30} tint="dark" style={styles.userInfoCard}>
                <Text style={styles.userInfo}>
                  {currentUser.name || currentUser.username}
                </Text>
                <Text style={styles.userEmail}>{currentUser.email}</Text>
              </BlurView>
            </View>
          )}

          {/* Cart Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Icon name="inventory" size={18} color={PharmacyColors.accent} />
              </View>
              <Text style={styles.sectionTitle}>Medications & Products</Text>
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
              <View style={styles.iconContainer}>
                <Icon name="location-on" size={18} color={PharmacyColors.accent} />
              </View>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            <BlurView intensity={30} tint="dark" style={styles.inputBlur}>
              <View style={styles.inputContainer}>
                <Icon name="location-on" size={18} color={PharmacyColors.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your delivery address"
                  placeholderTextColor={PharmacyColors.textMuted}
                  value={shippingAddress}
                  onChangeText={setShippingAddress}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
            </BlurView>
          </View>

          {/* Contact Number */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Icon name="phone" size={18} color={PharmacyColors.accent} />
              </View>
              <Text style={styles.sectionTitle}>Contact Number</Text>
            </View>
            <BlurView intensity={30} tint="dark" style={styles.inputBlur}>
              <View style={styles.inputContainer}>
                <Icon name="phone" size={18} color={PharmacyColors.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., +254712345678"
                  placeholderTextColor={PharmacyColors.textMuted}
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  keyboardType="phone-pad"
                />
              </View>
            </BlurView>
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Icon name="receipt" size={18} color={PharmacyColors.accent} />
              </View>
              <Text style={styles.sectionTitle}>Order Summary</Text>
            </View>
            <BlurView intensity={30} tint="dark" style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatPrice(getSubtotal())}</Text>
              </View>
              {prescriptionItems.length > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Prescription Items</Text>
                  <Text style={styles.summaryValue}>{prescriptionItems.length}</Text>
                </View>
              )}
              <View style={styles.summaryDivider} />
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>{formatPrice(getSubtotal())}</Text>
              </View>
            </BlurView>
          </View>

          {/* Pharmacy Information Notice */}
          <View style={styles.infoNotice}>
            <Icon name="info" size={24} color={PharmacyColors.accent} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>What happens next?</Text>
              <Text style={styles.infoText}>
                • Pharmacist will verify your order{'\n'}
                • You'll receive a confirmation call{'\n'}
                • Prescription items require verification{'\n'}
                • Track your order status
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Place Order Button */}
        <View style={styles.bottomContainer}>
          <BlurView intensity={60} tint="dark" style={styles.bottomBlur}>
            <TouchableOpacity
              style={[styles.placeOrderButton, placingOrder && styles.buttonDisabled]}
              onPress={placeOrder}
              disabled={placingOrder}
            >
              <LinearGradient
                colors={placingOrder 
                  ? [PharmacyColors.border, PharmacyColors.border]
                  : [PharmacyColors.primary, PharmacyColors.secondary]}
                style={styles.placeOrderGradient}
              >
                {placingOrder ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.placeOrderText}>Processing...</Text>
                  </>
                ) : (
                  <>
                    <Icon name="check-circle" size={20} color="#fff" />
                    <Text style={styles.placeOrderText}>
                      Place Order • {formatPrice(getSubtotal())}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PharmacyColors.background,
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
    color: PharmacyColors.textSecondary,
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
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: PharmacyColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cartBadge: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cartBadgeBlur: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 40,
  },
  prescriptionWarning: {
    flexDirection: 'row',
    backgroundColor: 'rgba(251, 140, 0, 0.1)',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PharmacyColors.warning + '40',
    alignItems: 'center',
    gap: 12,
  },
  prescriptionWarningContent: {
    flex: 1,
  },
  prescriptionWarningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PharmacyColors.warning,
    marginBottom: 4,
  },
  prescriptionWarningText: {
    fontSize: 13,
    color: PharmacyColors.textSecondary,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,172,193,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PharmacyColors.text,
  },
  userInfoCard: {
    padding: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 58, 30, 0.5)',
    borderWidth: 1,
    borderColor: PharmacyColors.border,
  },
  userInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: PharmacyColors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: PharmacyColors.textSecondary,
  },
  cartItem: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: PharmacyColors.border,
  },
  itemGradient: {
    flexDirection: 'row',
    padding: 12,
    position: 'relative',
  },
  rxBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: PharmacyColors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  rxText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemImageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: PharmacyColors.border,
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
    color: PharmacyColors.text,
    marginBottom: 6,
    lineHeight: 20,
    paddingRight: 30,
  },
  shopContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemShop: {
    fontSize: 12,
    color: PharmacyColors.accent,
    marginLeft: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: PharmacyColors.success,
    marginBottom: 2,
  },
  itemTotal: {
    fontSize: 12,
    color: PharmacyColors.textMuted,
  },
  itemActions: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  quantityDisplay: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: PharmacyColors.text,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.3)',
  },
  inputBlur: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 58, 30, 0.3)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: PharmacyColors.text,
    minHeight: 50,
  },
  summaryContainer: {
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 58, 30, 0.3)',
    borderWidth: 1,
    borderColor: PharmacyColors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: PharmacyColors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: PharmacyColors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: PharmacyColors.border,
    marginVertical: 8,
  },
  totalRow: {
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PharmacyColors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PharmacyColors.accent,
  },
  infoNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 172, 193, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PharmacyColors.accent + '40',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PharmacyColors.accent,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: PharmacyColors.textSecondary,
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
    padding: 16,
  },
  bottomBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 31, 10, 0.8)',
    borderWidth: 1,
    borderColor: PharmacyColors.border,
  },
  placeOrderButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  placeOrderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
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
    backgroundColor: 'rgba(30, 58, 30, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: PharmacyColors.border,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PharmacyColors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: PharmacyColors.textMuted,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  actionButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Cart;