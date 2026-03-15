// screens/food/OrderScreen.js
import React, { useState, useEffect } from 'react';
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
  Platform,
  ScrollView,
  Dimensions,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useFoodContext } from '../../context/FoodContext';
import * as foodApi from '../../services/foodApi';
import axios from 'axios';

const { width } = Dimensions.get('window');

// Food-themed color palette matching other screens
const FoodColors = {
  primary: '#FF6B35',      // Tangy Orange
  secondary: '#F7C35C',    // Honey Yellow
  accent: '#EF476F',       // Watermelon Pink
  success: '#06D6A0',      // Mint Green
  background: '#0a0a0a',
  card: '#1a1a1a',
  text: '#FFFFFF',
  textSecondary: '#FFE5D9', // Cream
};

const OrderScreen = () => {
  const navigation = useNavigation();
  const { 
    cart, 
    addToCart,
    updateCartItemQuantity, 
    removeFromCart, 
    clearCart,
    addRecentOrder 
  } = useFoodContext();
  
  // Combined delivery info object with multiple fields
  const [deliveryInfo, setDeliveryInfo] = useState({
    phoneNumber: '',
    deliveryAddress: '',
    apartmentSuite: '',
    deliveryInstructions: '',
    contactName: '',
    preferredDeliveryTime: 'ASAP',
    isBusiness: false,
    businessName: '',
    landmark: '',
    specialInstructions: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [popularItems, setPopularItems] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [expandedVendors, setExpandedVendors] = useState({});
  
  // Base URL configuration
  const baseURL = Platform.OS === 'ios'
    ? 'http://localhost:5000'
    : 'https://moihub.onrender.com';

  // Fetch popular items from vendors in cart
  useEffect(() => {
    if (cart.length > 0) {
      fetchPopularItems();
    }
  }, [cart]);

  const fetchPopularItems = async () => {
    if (cart.length === 0) return;
    
    setLoadingPopular(true);
    try {
      // Get unique vendor IDs from cart
      const vendorIds = [...new Set(cart.map(item => item.vendorId))];
      
      // Fetch items from each vendor
      const popularPromises = vendorIds.map(async (vendorId) => {
        const response = await foodApi.fetchVendorListings(vendorId, 1);
        if (response.success) {
          // Get items not already in cart and mark as popular if they have high ratings or are featured
          const cartItemIds = new Set(cart.map(item => item._id));
          return response.listings
            .filter(item => !cartItemIds.has(item._id))
            .slice(0, 3) // Get top 3 items
            .map(item => ({
              ...item,
              vendorName: cart.find(c => c.vendorId === vendorId)?.vendorName,
              vendorId
            }));
        }
        return [];
      });

      const results = await Promise.all(popularPromises);
      const flatPopular = results.flat();
      setPopularItems(flatPopular);
    } catch (error) {
      console.error('Error fetching popular items:', error);
    } finally {
      setLoadingPopular(false);
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

  const toggleVendorExpand = (vendorId) => {
    setExpandedVendors(prev => ({
      ...prev,
      [vendorId]: !prev[vendorId]
    }));
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) {
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

  const handleAddPopularItem = (item) => {
    const result = addToCart(item, 1);
    if (result.success) {
      Alert.alert(
        'Added! 🎉',
        `${item.name} added to your cart`,
        [{ text: 'OK' }]
      );
      // Refresh popular items to remove the one just added
      fetchPopularItems();
    }
  };

  const handleDeliveryInfoChange = (field, value) => {
    setDeliveryInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate required fields
// Validate required fields
const validateDeliveryInfo = () => {
  const requiredFields = {
    phoneNumber: 'Phone number',
    deliveryAddress: 'Delivery address',
    contactName: 'Contact name'
  };

  const missingFields = [];
  
  Object.entries(requiredFields).forEach(([field, label]) => {
    if (!deliveryInfo[field].trim()) {
      missingFields.push(label);
    }
  });

  // More flexible phone number validation
  if (deliveryInfo.phoneNumber) {
    // Remove all non-numeric characters
    const cleanedNumber = deliveryInfo.phoneNumber.replace(/[^0-9]/g, '');
    
    // Check if it's a valid Kenyan number
    // Allows: 0712345678, 712345678, +254712345678, 254712345678
    const isValidKenyanNumber = (
      // 9 digits after 0 (total 10 digits starting with 0)
      (cleanedNumber.length === 10 && cleanedNumber.startsWith('0')) ||
      // 9 digits (starting with 7 or 1)
      (cleanedNumber.length === 9 && (cleanedNumber.startsWith('7') || cleanedNumber.startsWith('1'))) ||
      // 12 digits with 254 (including +254 which becomes 254)
      (cleanedNumber.length === 12 && cleanedNumber.startsWith('254')) ||
      // 9 digits with +254 (counted as 9 after removing +)
      (deliveryInfo.phoneNumber.startsWith('+254') && deliveryInfo.phoneNumber.replace('+254', '').length === 9)
    );

    if (!isValidKenyanNumber) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid Kenyan phone number:\n' +
        '• 0712345678\n' +
        '• 712345678\n' +
        '• +254712345678\n' +
        '• 254712345678'
      );
      return false;
    }
  }

  if (missingFields.length > 0) {
    Alert.alert(
      'Missing Information',
      `Please fill in the following fields:\n• ${missingFields.join('\n• ')}`
    );
    return false;
  }

  return true;
};


  // Create order function with combined delivery info
// Create order function with single string deliveryInstructions
const createOrder = async (orderData) => {
  try {
    const response = await axios.post(`${baseURL}/api/food/orders`, orderData);
    return {
      success: true,
      order: response.data.order,
    };
  } catch (error) {
    console.error('Order API error:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
    };
  }
};

const placeOrder = async () => {
  if (cart.length === 0) {
    Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
    return;
  }

  // Validate delivery info
  if (!validateDeliveryInfo()) {
    return;
  }

  setLoading(true);

  try {
    const successfulOrders = [];
    
    // Format phone number
    const formatPhoneNumber = (phone) => {
      const cleaned = phone.replace(/[^0-9]/g, '');
      if (cleaned.length === 9) {
        return '254' + cleaned;
      }
      if (cleaned.length === 10 && cleaned.startsWith('0')) {
        return '254' + cleaned.substring(1);
      }
      return cleaned;
    };
    
    for (const vendor of vendors) {
      console.log('Processing order for vendor:', vendor.vendorId, vendor.shopName);
      
      const orderItems = vendor.items.map(item => ({
        listingId: item._id,
        quantity: item.quantity
      }));

      // COMBINE ALL FIELDS INTO ONE STRING
      const deliveryString = `
Contact: ${deliveryInfo.contactName}
Phone: ${formatPhoneNumber(deliveryInfo.phoneNumber)}
Address: ${deliveryInfo.deliveryAddress}${deliveryInfo.apartmentSuite ? `, ${deliveryInfo.apartmentSuite}` : ''}${deliveryInfo.landmark ? ` (near ${deliveryInfo.landmark})` : ''}
${deliveryInfo.isBusiness ? `Business: ${deliveryInfo.businessName}` : ''}
Delivery Time: ${deliveryInfo.preferredDeliveryTime}
${deliveryInfo.specialInstructions ? `Special Instructions: ${deliveryInfo.specialInstructions}` : ''}
      `.trim();

      // Prepare order data with ONE STRING field
      const orderData = {
        items: orderItems,
        vendorId: vendor.vendorId,
        deliveryInstructions: deliveryString // Single string containing all info
      };

      console.log('Sending order data:', JSON.stringify(orderData));
      
      const response = await createOrder(orderData);
      console.log('Order API response:', JSON.stringify(response));
      
      if (!response.success) {
        throw new Error(response.message || `Failed to place order with ${vendor.shopName}`);
      }
      
      successfulOrders.push(response.order);
    }

    successfulOrders.forEach(order => addRecentOrder(order));
    
    clearCart();
    
    Alert.alert(
      'Order Placed! 🎉',
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
    <Animatable.View animation="fadeInLeft" duration={300}>
      <View style={styles.cartItem}>
        <Image 
          source={{ uri: item.imageURL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }} 
          style={styles.itemImage} 
        />
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>Ksh {item.price}</Text>
          {item.description && (
            <Text style={styles.itemDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item, item.quantity - 1)}
          >
            <LinearGradient
              colors={[FoodColors.primary, FoodColors.primary + 'dd']}
              style={styles.quantityButtonGradient}
            >
              <Ionicons name="remove" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.quantity}>{item.quantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item, item.quantity + 1)}
          >
            <LinearGradient
              colors={[FoodColors.primary, FoodColors.primary + 'dd']}
              style={styles.quantityButtonGradient}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Animatable.View>
  );

  const renderPopularItem = ({ item }) => (
    <Animatable.View animation="fadeInUp" duration={400}>
      <TouchableOpacity 
        style={styles.popularItemCard}
        onPress={() => handleAddPopularItem(item)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['rgba(255,107,53,0.1)', 'rgba(247,195,92,0.05)']}
          style={styles.popularGradient}
        >
          <Image
            source={{ uri: item.imageURL || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' }}
            style={styles.popularImage}
          />
          <View style={styles.popularInfo}>
            <Text style={styles.popularName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.popularVendor}>{item.vendorName}</Text>
            <View style={styles.popularMeta}>
              <Text style={styles.popularPrice}>Ksh {item.price}</Text>
              <View style={styles.popularBadge}>
                <Ionicons name="flame" size={12} color={FoodColors.primary} />
                <Text style={styles.popularBadgeText}>Popular</Text>
              </View>
            </View>
          </View>
          <View style={styles.popularAdd}>
            <Ionicons name="add-circle" size={32} color={FoodColors.primary} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderVendorGroup = ({ item: vendor }) => {
    const isExpanded = expandedVendors[vendor.vendorId] !== false;
    
    return (
      <Animatable.View animation="fadeInUp" duration={400}>
        <LinearGradient
          colors={['rgba(255,107,53,0.05)', 'rgba(247,195,92,0.02)']}
          style={styles.vendorGroup}
        >
          <TouchableOpacity 
            style={styles.vendorHeader}
            onPress={() => toggleVendorExpand(vendor.vendorId)}
            activeOpacity={0.7}
          >
            <View style={styles.vendorHeaderLeft}>
              <View style={styles.vendorIconContainer}>
                <Ionicons name="restaurant" size={20} color={FoodColors.primary} />
              </View>
              <View>
                <Text style={styles.vendorName}>{vendor.shopName}</Text>
                <Text style={styles.vendorItemCount}>
                  {vendor.items.length} item{vendor.items.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color={FoodColors.textSecondary} 
            />
          </TouchableOpacity>
          
          {isExpanded && (
            <View style={styles.vendorItems}>
              <FlatList
                data={vendor.items}
                renderItem={renderCartItem}
                keyExtractor={item => item._id}
                scrollEnabled={false}
              />
            </View>
          )}
        </LinearGradient>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[FoodColors.background, '#1a1a1a', FoodColors.background]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Food Emojis */}
      <View style={styles.floatingFoods}>
        <Text style={[styles.floatingFood, styles.food1]}>🍕</Text>
        <Text style={[styles.floatingFood, styles.food2]}>🍔</Text>
        <Text style={[styles.floatingFood, styles.food3]}>🌮</Text>
        <Text style={[styles.floatingFood, styles.food4]}>🍣</Text>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={FoodColors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart</Text>
        {cart.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              Alert.alert(
                'Clear Cart',
                'Remove all items from cart?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', onPress: clearCart, style: 'destructive' }
                ]
              );
            }}
            style={styles.clearButton}
          >
            <Ionicons name="trash-outline" size={20} color={FoodColors.accent} />
          </TouchableOpacity>
        )}
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <Animatable.View animation="bounceIn" duration={1000}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyEmoji}>🛒</Text>
            </View>
          </Animatable.View>
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartText}>
            Looks like you haven't added anything to your cart yet
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={[FoodColors.primary, FoodColors.primary + 'dd']}
              style={styles.shopButtonGradient}
            >
              <Text style={styles.shopButtonText}>Browse Restaurants</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Cart Items */}
            <View style={styles.cartSection}>
              {vendors.map(vendor => (
                <View key={vendor.vendorId}>
                  {renderVendorGroup({ item: vendor })}
                </View>
              ))}
            </View>

            {/* Popular Suggestions */}
            {popularItems.length > 0 && (
              <View style={styles.popularSection}>
                <View style={styles.popularHeader}>
                  <View style={styles.popularTitleContainer}>
                    <Ionicons name="flame" size={24} color={FoodColors.primary} />
                    <Text style={styles.popularTitle}>Popular Add-ons</Text>
                  </View>
                  <Text style={styles.popularSubtitle}>
                    Frequently ordered with your items
                  </Text>
                </View>

                {loadingPopular ? (
                  <ActivityIndicator size="small" color={FoodColors.primary} />
                ) : (
                  <FlatList
                    data={popularItems}
                    renderItem={renderPopularItem}
                    keyExtractor={item => item._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.popularList}
                  />
                )}
              </View>
            )}

            {/* Delivery Information - Multiple Fields */}
            <View style={styles.deliverySection}>
              <LinearGradient
                colors={['rgba(255,107,53,0.05)', 'rgba(247,195,92,0.02)']}
                style={styles.deliveryCard}
              >
                <View style={styles.deliveryHeader}>
                  <Ionicons name="information-circle" size={24} color={FoodColors.primary} />
                  <Text style={styles.deliveryTitle}>Delivery Information</Text>
                </View>

                {/* Contact Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contact Name *</Text>
                  <TextInput
                    style={styles.deliveryInput}
                    placeholder="Name"
                    placeholderTextColor="#888"
                    value={deliveryInfo.contactName}
                    onChangeText={(value) => handleDeliveryInfoChange('contactName', value)}
                  />
                </View>

                {/* Phone Number */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number(for calls) *</Text>
                  <View style={styles.phoneInputContainer}>
                    <Text style={styles.countryCode}>+254</Text>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="712345678"
                      placeholderTextColor="#888"
                      keyboardType="phone-pad"
                      value={deliveryInfo.phoneNumber.replace(/^0+/, '')}
                      onChangeText={(value) => handleDeliveryInfoChange('phoneNumber', value)}
                      maxLength={9}
                    />
                  </View>
                  <Text style={styles.inputHint}>Enter 9 digits after 0 or +254</Text>
                </View>

                {/* Business/Personal Switch */}
                <View style={styles.switchContainer}>
                  <Text style={styles.inputLabel}>Order Type</Text>
                  <View style={styles.switchRow}>
                    <Text style={[styles.switchLabel, !deliveryInfo.isBusiness && styles.activeSwitchLabel]}>
                      Personal
                    </Text>
                    <Switch
                      value={deliveryInfo.isBusiness}
                      onValueChange={(value) => handleDeliveryInfoChange('isBusiness', value)}
                      trackColor={{ false: '#333', true: FoodColors.primary }}
                      thumbColor="#fff"
                    />
                    <Text style={[styles.switchLabel, deliveryInfo.isBusiness && styles.activeSwitchLabel]}>
                      Business
                    </Text>
                  </View>
                </View>

                {/* Business Name (conditional) */}
                {deliveryInfo.isBusiness && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}> Name</Text>
                    <TextInput
                      style={styles.deliveryInput}
                      placeholder="Business/shop name"
                      placeholderTextColor="#888"
                      value={deliveryInfo.businessName}
                      onChangeText={(value) => handleDeliveryInfoChange('businessName', value)}
                    />
                  </View>
                )}

                {/* Delivery Address */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Delivery Address *</Text>
                  <TextInput
                    style={styles.deliveryInput}
                    placeholder="Hostel name, plot name, building name.."
                    placeholderTextColor="#888"
                    value={deliveryInfo.deliveryAddress}
                    onChangeText={(value) => handleDeliveryInfoChange('deliveryAddress', value)}
                  />
                </View>

                {/* Apartment/Suite */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Apartment/Suite </Text>
                  <TextInput
                    style={styles.deliveryInput}
                    placeholder="Room number, floor, block..."
                    placeholderTextColor="#888"
                    value={deliveryInfo.apartmentSuite}
                    onChangeText={(value) => handleDeliveryInfoChange('apartmentSuite', value)}
                  />
                </View>

                {/* Landmark */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Landmark (Optional)</Text>
                  <TextInput
                    style={styles.deliveryInput}
                    placeholder="Nearby landmark"
                    placeholderTextColor="#888"
                    value={deliveryInfo.landmark}
                    onChangeText={(value) => handleDeliveryInfoChange('landmark', value)}
                  />
                </View>

                {/* Preferred Delivery Time */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Preferred Delivery Time</Text>
                  <View style={styles.timeOptions}>
                    {['ASAP', '30 min', '1 hour', 'Schedule'].map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeOption,
                          deliveryInfo.preferredDeliveryTime === time && styles.timeOptionSelected
                        ]}
                        onPress={() => handleDeliveryInfoChange('preferredDeliveryTime', time)}
                      >
                        <Text style={[
                          styles.timeOptionText,
                          deliveryInfo.preferredDeliveryTime === time && styles.timeOptionTextSelected
                        ]}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Special Instructions */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Special Instructions</Text>
                  <TextInput
                    style={[styles.deliveryInput, styles.textArea]}
                    placeholder="Spices, preferences, special requests..."
                    placeholderTextColor="#888"
                    value={deliveryInfo.specialInstructions}
                    onChangeText={(value) => handleDeliveryInfoChange('specialInstructions', value)}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </LinearGradient>
            </View>

            {/* Order Summary */}
            <View style={styles.summarySection}>
              <LinearGradient
                colors={['rgba(255,107,53,0.08)', 'rgba(247,195,92,0.03)']}
                style={styles.summaryCard}
              >
                <Text style={styles.summaryTitle}>Order Summary</Text>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>Ksh {totalPrice}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={styles.summaryValue}>Free</Text>
                </View>
                
                <View style={styles.summaryDivider} />
                
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>Ksh {totalPrice}</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* Place Order Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={placeOrder}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[FoodColors.primary, FoodColors.primary + 'dd']}
                style={styles.placeOrderGradient}
              >
                <View style={styles.placeOrderContent}>
                  <View>
                    <Text style={styles.placeOrderTotal}>Ksh {totalPrice}</Text>
                    <Text style={styles.placeOrderLabel}>Total</Text>
                  </View>
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={styles.placeOrderAction}>
                      <Text style={styles.placeOrderText}>Place Order</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

// Add these new styles to your existing StyleSheet
const additionalStyles = {
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: FoodColors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
  },
  countryCode: {
    paddingHorizontal: 12,
    fontSize: 14,
    color: FoodColors.primary,
    fontWeight: '600',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,107,53,0.2)',
    paddingVertical: 12,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: FoodColors.text,
  },
  inputHint: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    marginLeft: 4,
  },
  switchContainer: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
  },
  switchLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  activeSwitchLabel: {
    color: FoodColors.primary,
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
  },
  timeOptionSelected: {
    backgroundColor: FoodColors.primary,
    borderColor: FoodColors.primary,
  },
  timeOptionText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  timeOptionTextSelected: {
    color: '#fff',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
};

// Merge the new styles with your existing styles
const styles = StyleSheet.create({
  ...StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: FoodColors.background,
    },
    floatingFoods: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      zIndex: 0,
    },
    floatingFood: {
      position: 'absolute',
      fontSize: 24,
      opacity: 0.1,
    },
    food1: {
      top: '10%',
      right: '5%',
      transform: [{ rotate: '15deg' }],
    },
    food2: {
      top: '30%',
      left: '5%',
      transform: [{ rotate: '-10deg' }],
    },
    food3: {
      bottom: '20%',
      right: '10%',
      transform: [{ rotate: '25deg' }],
    },
    food4: {
      bottom: '40%',
      left: '8%',
      transform: [{ rotate: '-15deg' }],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      zIndex: 10,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,107,53,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: FoodColors.text,
    },
    clearButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(239,71,111,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    cartSection: {
      padding: 16,
      paddingTop: 8,
    },
    vendorGroup: {
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,107,53,0.1)',
      overflow: 'hidden',
    },
    vendorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    vendorHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    vendorIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: 'rgba(255,107,53,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    vendorName: {
      fontSize: 16,
      fontWeight: '700',
      color: FoodColors.text,
      marginBottom: 2,
    },
    vendorItemCount: {
      fontSize: 12,
      color: FoodColors.textSecondary,
    },
    vendorItems: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    cartItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,107,53,0.1)',
    },
    itemImage: {
      width: 60,
      height: 60,
      borderRadius: 12,
    },
    itemDetails: {
      flex: 1,
      paddingHorizontal: 12,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: FoodColors.text,
      marginBottom: 2,
    },
    itemPrice: {
      fontSize: 14,
      fontWeight: '700',
      color: FoodColors.primary,
      marginBottom: 2,
    },
    itemDescription: {
      fontSize: 12,
      color: FoodColors.textSecondary,
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    quantityButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      overflow: 'hidden',
    },
    quantityButtonGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    quantity: {
      fontSize: 16,
      marginHorizontal: 12,
      minWidth: 20,
      textAlign: 'center',
      color: FoodColors.text,
      fontWeight: '600',
    },
    popularSection: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    popularHeader: {
      marginBottom: 12,
    },
    popularTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    popularTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: FoodColors.text,
      marginLeft: 8,
    },
    popularSubtitle: {
      fontSize: 13,
      color: FoodColors.textSecondary,
    },
    popularList: {
      paddingRight: 16,
    },
    popularItemCard: {
      width: 240,
      marginRight: 12,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,107,53,0.1)',
    },
    popularGradient: {
      flexDirection: 'row',
      padding: 12,
    },
    popularImage: {
      width: 60,
      height: 60,
      borderRadius: 10,
      marginRight: 12,
    },
    popularInfo: {
      flex: 1,
    },
    popularName: {
      fontSize: 15,
      fontWeight: '600',
      color: FoodColors.text,
      marginBottom: 2,
    },
    popularVendor: {
      fontSize: 11,
      color: FoodColors.textSecondary,
      marginBottom: 4,
    },
    popularMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    popularPrice: {
      fontSize: 14,
      fontWeight: '700',
      color: FoodColors.primary,
    },
    popularBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,107,53,0.1)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    popularBadgeText: {
      fontSize: 10,
      color: FoodColors.primary,
      marginLeft: 2,
      fontWeight: '600',
    },
    popularAdd: {
      justifyContent: 'center',
    },
    deliverySection: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    deliveryCard: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,107,53,0.1)',
    },
    deliveryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    deliveryTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: FoodColors.text,
      marginLeft: 8,
    },
    deliveryInput: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 14,
      color: FoodColors.text,
      borderWidth: 1,
      borderColor: 'rgba(255,107,53,0.2)',
    },
    summarySection: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    summaryCard: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,107,53,0.1)',
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: FoodColors.text,
      marginBottom: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: FoodColors.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: FoodColors.text,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: 'rgba(255,107,53,0.1)',
      marginVertical: 12,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: FoodColors.text,
    },
    totalValue: {
      fontSize: 20,
      fontWeight: '800',
      color: FoodColors.primary,
    },
    footer: {
      padding: 16,
      paddingBottom: Platform.OS === 'ios' ? 34 : 16,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,107,53,0.1)',
    },
    placeOrderButton: {
      borderRadius: 30,
      overflow: 'hidden',
      shadowColor: FoodColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    placeOrderGradient: {
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    placeOrderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    placeOrderTotal: {
      fontSize: 18,
      fontWeight: '800',
      color: '#fff',
    },
    placeOrderLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
    },
    placeOrderAction: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    placeOrderText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
      marginRight: 8,
    },
    bottomPadding: {
      height: 20,
    },
    emptyCart: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: 'rgba(255,107,53,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyEmoji: {
      fontSize: 60,
    },
    emptyCartTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: FoodColors.primary,
      marginBottom: 8,
    },
    emptyCartText: {
      fontSize: 16,
      color: FoodColors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    shopButton: {
      borderRadius: 30,
      overflow: 'hidden',
    },
    shopButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 14,
      gap: 8,
    },
    shopButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
  }),
  ...additionalStyles
});

export default OrderScreen;
