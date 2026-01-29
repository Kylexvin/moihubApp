// screens/localservices/components/ProductsTab.js
import React, { useState } from 'react';
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
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Theme from '../../theme/Theme';

const { width } = Dimensions.get('window');
const { Colors, Typography, Spacing, BorderRadius } = Theme;

const ProductsTab = ({ productsData, addToCart, cart, overviewData, navigation }) => {
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  // Calculate total cart price
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      // Extract price number from string like "KES 1,500"
      const priceStr = item.price ? item.price.replace(/[^0-9]/g, '') : '0';
      return total + (parseInt(priceStr) || 0);
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
    
    addToCart(product);
  };

  const handleRemoveFromCart = (productId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updatedCart = cart.filter(item => item.id !== productId && item._id !== productId);
    // You need to pass a removeFromCart function from parent or manage state here
    // For now, just show alert
    Alert.alert('Remove Item', 'This would remove the item from cart. Add removeFromCart prop.');
  };

  const handleViewCart = () => {
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
      // Here you would make API call to submit order
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Order Submitted!',
        `Your order for ${cart.length} item(s) has been sent to ${overviewData?.header?.name || 'the provider'}. They will contact you on ${phoneNumber} to arrange delivery/payment.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear cart and close modal
              // You need to pass clearCart function from parent
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

  const renderCartModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={checkoutModalVisible}
      onRequestClose={() => setCheckoutModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Cart</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setCheckoutModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Cart Items */}
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
                      <Text style={styles.cartItemPrice}>{item.price}</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => handleRemoveFromCart(item.id || item._id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {/* Phone Input */}
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

          {/* Cart Footer */}
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
                  <Text style={styles.checkoutButtonText}>Processing...</Text>
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.tabContent}>
          <View style={styles.productsHeader}>
            <View>
              <Text style={styles.tabTitle}>Products</Text>
              <Text style={styles.tabSubtitle}>Shop premium products & supplies</Text>
            </View>
          </View>
          
          {productsData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>No products available</Text>
              <Text style={styles.emptyStateSubtext}>Check back later for updates</Text>
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {productsData.map((product) => {
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
                          {product.currency || 'KES'} {product.price?.toLocaleString?.() || product.price}
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
          
          {productsData.length > 0 && (
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

const styles = StyleSheet.create({
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