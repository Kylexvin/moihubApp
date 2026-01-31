// screens/localservices/components/ProductsTab.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import Theme from '../../theme/Theme';

const { width } = Dimensions.get('window');
const { Colors, Typography, Spacing, BorderRadius, Shadows } = Theme;

const ProductsTab = ({ providerId, token, navigation, overviewData }) => {
  // Internal state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  
  // Cart reference for callbacks
  const cartRef = useRef([]);
  cartRef.current = cart;

  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      
      const response = await axios.get(
        `/api/services/providers/${providerId}/dashboard/products`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: 10000
        }
      );
      
      const transformedProducts = response.data.products?.map(product => ({
        id: product._id || product.id,
        _id: product._id || product.id,
        name: product.name,
        price: product.price,
        currency: product.currency || 'KES',
        description: product.description,
        inStock: product.inStock,
        stock: product.stock || product.stockCount || 0,
        image: product.image
      })) || [];
      
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [providerId, token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchProducts();
  };

  // Calculate total cart price
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
      return total + price;
    }, 0);
  };

  const handleAddToCart = (product) => {
    // Check if product is in stock
    if (product.stock <= 0) {
      Alert.alert('Out of Stock', `${product.name} is currently out of stock.`);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.id === product.id || item._id === product._id);
    if (existingItem) {
      Alert.alert('Already in Cart', `${product.name} is already in your cart.`);
      return;
    }
    
    setCart([...cart, product]);
    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`);
  };

  const handleRemoveFromCart = (productId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedCart = cart.filter(item => item.id !== productId && item._id !== productId);
    setCart(updatedCart);
  };

  const handleViewCart = () => {
    if (cart.length === 0) {
      Alert.alert('Cart Empty', 'Your cart is empty. Add some products first.');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCheckoutModalVisible(true);
  };

  const handleCheckout = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Phone Required', 'Please enter your phone number for delivery/contact.');
      return;
    }

    // Validate Kenyan phone number
    const phoneRegex = /^(\+254|0)[17]\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Invalid Phone', 'Please enter a valid Kenyan phone number (e.g., 0712345678)');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoadingCheckout(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Order Submitted!',
        `Your order for ${cart.length} item(s) has been sent to ${overviewData?.header?.name || 'the provider'}. They will contact you on ${phoneNumber} to arrange delivery/payment.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCart([]);
              setCheckoutModalVisible(false);
              setPhoneNumber('');
              Alert.alert('Success', 'Thank you for your order!');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit order. Please try again.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  // Skeleton Loading Component
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {/* Cart Summary Skeleton */}
      <View style={styles.skeletonCartSummary} />
      
      {/* Product Grid Skeleton */}
      <View style={styles.skeletonProductsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.skeletonProductCard}>
            <View style={styles.skeletonProductImage} />
            <View style={styles.skeletonProductInfo}>
              <View style={styles.skeletonProductTitle} />
              <View style={styles.skeletonProductDescription} />
              <View style={styles.skeletonProductFooter}>
                <View style={styles.skeletonProductPrice} />
                <View style={styles.skeletonAddButton} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  // Error Component
  const renderError = () => (
    <View style={styles.errorContainer}>
      <ScrollView
        contentContainerStyle={styles.errorScrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <Ionicons name="alert-circle" size={48} color={Colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderCartModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={checkoutModalVisible}
      onRequestClose={() => setCheckoutModalVisible(false)}
    >
      {/* Modal content - SAME AS YOUR ORIGINAL */}
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Cart</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setCheckoutModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.cartItemsContainer} showsVerticalScrollIndicator={false}>
            {cart.length === 0 ? (
              <View style={styles.emptyCart}>
                <Ionicons name="cart-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyCartText}>Your cart is empty</Text>
                <Text style={styles.emptyCartSubtext}>Add products from the list</Text>
              </View>
            ) : (
              <>
                {cart.map((item, index) => (
                  <View key={`${item.id || item._id}-${index}`} style={styles.cartItem}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.cartItemImage} />
                    ) : (
                      <View style={styles.cartItemImagePlaceholder}>
                        <Ionicons name="cube" size={20} color={Colors.textSecondary} />
                      </View>
                    )}
                    
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cartItemPrice}>
                        {item.currency || 'KES'} {typeof item.price === 'number' ? item.price.toLocaleString() : item.price}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => handleRemoveFromCart(item.id || item._id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.phoneLabel}>Your Phone Number *</Text>
                  <View style={styles.phoneInputWrapper}>
                    <Text style={styles.phonePrefix}>+254</Text>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="712345678"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      maxLength={9}
                    />
                  </View>
                  <Text style={styles.phoneNote}>
                    Provider will contact you on this number
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {cart.length > 0 && (
            <View style={styles.cartFooter}>
              <View style={styles.cartTotalRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalAmount}>
                  KES {getCartTotal().toLocaleString()}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.checkoutButton,
                  loadingCheckout && styles.checkoutButtonDisabled
                ]}
                onPress={handleCheckout}
                disabled={loadingCheckout}
              >
                {loadingCheckout ? (
                  <ActivityIndicator size="small" color={Colors.text} />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color={Colors.text} />
                    <Text style={styles.checkoutButtonText}>Submit Order</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return renderSkeleton();
  }

  if (error) {
    return renderError();
  }

  return (
    <View style={styles.container}>
      {/* Cart Summary Bar */}
      {cart.length > 0 && (
        <View style={styles.cartSummary}>
          <View style={styles.cartSummaryLeft}>
            <Ionicons name="cart" size={20} color={Colors.text} />
            <Text style={styles.cartCount}>{cart.length} item{cart.length !== 1 ? 's' : ''}</Text>
            <Text style={styles.cartTotal}>KES {getCartTotal().toLocaleString()}</Text>
          </View>
          
          <View style={styles.cartSummaryRight}>
            <TouchableOpacity 
              style={styles.viewCartButton}
              onPress={handleViewCart}
            >
              <Text style={styles.viewCartText}>View Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.tabContent}>
          <View style={styles.productsHeader}>
            <View>
              <Text style={styles.tabTitle}>Products</Text>
              <Text style={styles.tabSubtitle}>Shop premium products & supplies</Text>
            </View>
          </View>
          
          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>No products available</Text>
              <Text style={styles.emptyStateSubtext}>Check back later for updates</Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {products.map((product) => {
                const isInStock = product.stock > 0;
                
                return (
                  <View key={product.id || product._id} style={styles.productCard}>
                    {/* Product Image */}
                    <View style={styles.productImageContainer}>
                      {product.image ? (
                        <Image 
                          source={{ uri: product.image }}
                          style={styles.productImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.productImagePlaceholder}>
                          <Ionicons name="cube" size={24} color={Colors.textSecondary} />
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {product.name}
                      </Text>
                      
                      {product.description ? (
                        <Text style={styles.productDescription} numberOfLines={2}>
                          {product.description}
                        </Text>
                      ) : null}
                      
                      <View style={styles.productFooter}>
                        <Text style={styles.productPrice}>
                          {product.currency || 'KES'} {typeof product.price === 'number' ? product.price.toLocaleString() : product.price}
                        </Text>
                        
                        {/* Availability Badge */}
                        <View style={[
                          styles.availabilityBadge,
                          { 
                            backgroundColor: isInStock ? 
                              Colors.success + '20' : 
                              Colors.danger + '20' 
                          }
                        ]}>
                          <View style={[
                            styles.availabilityDot,
                            { 
                              backgroundColor: isInStock ? 
                                Colors.success : 
                                Colors.danger 
                            }
                          ]} />
                          <Text style={[
                            styles.availabilityText,
                            { 
                              color: isInStock ? 
                                Colors.success : 
                                Colors.danger 
                            }
                          ]}>
                            {isInStock ? 'Available' : 'Sold Out'}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Add to Cart Button */}
                      <TouchableOpacity 
                        style={[
                          styles.addToCartButton,
                          !isInStock && styles.addToCartButtonDisabled
                        ]}
                        onPress={() => handleAddToCart(product)}
                        activeOpacity={0.8}
                        disabled={!isInStock}
                      >
                        {isInStock ? (
                          <>
                            <Ionicons name="add-circle" size={18} color={Colors.primary} />
                            <Text style={styles.addToCartText}>Add to Cart</Text>
                          </>
                        ) : (
                          <>
                            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                            <Text style={styles.addToCartTextDisabled}>Out of Stock</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          
          {products.length > 0 && (
            <View style={styles.shoppingNote}>
              <Ionicons name="information-circle" size={16} color={Colors.textSecondary} />
              <Text style={styles.shoppingNoteText}>
                Add products to cart and purchase them during booking or checkout separately
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cart/Checkout Modal */}
      {renderCartModal()}
    </View>
  );
};

// Add these skeleton styles to your existing styles
const styles = StyleSheet.create({
  // Skeleton Styles
  skeletonContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  skeletonCartSummary: {
    height: 50,
    backgroundColor: Colors.card + '80',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  skeletonProductsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  skeletonProductCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.card + '80',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  skeletonProductImage: {
    width: '100%',
    height: 100,
    backgroundColor: Colors.card + '60',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  skeletonProductInfo: {
    gap: Spacing.sm,
  },
  skeletonProductTitle: {
    width: '70%',
    height: 16,
    backgroundColor: Colors.card + '60',
    borderRadius: BorderRadius.sm,
  },
  skeletonProductDescription: {
    width: '90%',
    height: 12,
    backgroundColor: Colors.card + '60',
    borderRadius: BorderRadius.sm,
  },
  skeletonProductFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  skeletonProductPrice: {
    width: 60,
    height: 16,
    backgroundColor: Colors.card + '60',
    borderRadius: BorderRadius.sm,
  },
  skeletonAddButton: {
    width: 80,
    height: 30,
    backgroundColor: Colors.card + '60',
    borderRadius: BorderRadius.sm,
  },
  // Error Styles
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorScrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    minHeight: 300,
  },
  errorText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: Colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
  // Keep all your original styles below (exactly as in your ProductsTab.js)
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  cartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },



  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  cartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  cartSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cartCount: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  cartTotal: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  cartSummaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  viewCartButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  viewCartText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  tabContent: {
    padding: Spacing.lg,
  },
  tabTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  tabSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  productsHeader: {
    marginBottom: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  productCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  productImageContainer: {
    width: '100%',
    height: 100,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.card + '80',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.card + '40',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 16,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  productPrice: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  availabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  addToCartButtonDisabled: {
    borderColor: Colors.textSecondary,
    backgroundColor: Colors.card + '40',
  },
  addToCartText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  addToCartTextDisabled: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  shoppingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  shoppingNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  cartItemsContainer: {
    maxHeight: 400,
    padding: Spacing.lg,
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyCartText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyCartSubtext: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cartItemImage: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  cartItemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.card + '80',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  cartItemPrice: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  phoneInputContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  phoneLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  phonePrefix: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
    color: Colors.text,
    fontSize: 16,
  },
  phoneNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  cartFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  totalLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  totalAmount: {
    ...Typography.h3,
    color: Colors.primary,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProductsTab;