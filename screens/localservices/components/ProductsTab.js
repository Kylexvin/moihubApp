import React, { useState, useEffect, useCallback } from 'react';
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
  const [selectedProducts, setSelectedProducts] = useState([]); // For inquiry cart
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

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
        image: product.image,
        isSelected: false // Add selection state
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

  const toggleProductSelection = (productId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId 
          ? { ...product, isSelected: !product.isSelected }
          : product
      )
    );
    
    // Update selected products list
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProducts(prev => {
        const isAlreadySelected = prev.some(p => p.id === productId);
        if (isAlreadySelected) {
          return prev.filter(p => p.id !== productId);
        } else {
          return [...prev, { ...product, isSelected: true }];
        }
      });
    }
  };

  const clearSelection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProducts(prev => prev.map(p => ({ ...p, isSelected: false })));
    setSelectedProducts([]);
  };

  const openInquiryModal = () => {
    if (selectedProducts.length === 0) {
      Alert.alert('No Products Selected', 'Please select at least one product to inquire about.');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setInquiryMessage('');
    setContactPhone('');
    setInquiryModalVisible(true);
  };

  const handleSubmitInquiry = async () => {
    if (!inquiryMessage.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }
    
    if (!contactPhone.trim()) {
      Alert.alert('Error', 'Please enter your contact phone number');
      return;
    }

    // LENIENT Phone validation - accept various formats
    const cleanPhone = contactPhone.trim();
    
    // Remove all non-digit characters except leading +
    const sanitizedPhone = cleanPhone.replace(/[^\d+]/g, '');
    
    // Check if it's a reasonable length (7-13 digits including optional +254)
    if (sanitizedPhone.length < 9 || sanitizedPhone.length > 13) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number (e.g., 0712345678 or +254712345678)');
      return;
    }
    
    // Check if it starts with valid prefixes
    const isValidKenyanPhone = 
      sanitizedPhone.startsWith('+254') || 
      sanitizedPhone.startsWith('254') ||
      sanitizedPhone.startsWith('07') ||
      sanitizedPhone.startsWith('01') ||
      /^[17]\d{8}$/.test(sanitizedPhone); // 9 digits starting with 1 or 7
    
    if (!isValidKenyanPhone) {
      Alert.alert('Invalid Phone', 'Please enter a valid Kenyan phone number');
      return;
    }

    try {
      setIsSubmittingInquiry(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Format phone for API
      let formattedPhone = sanitizedPhone;
      
      // Convert to +254 format if not already
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('254')) {
        formattedPhone = '+' + formattedPhone;
      } else if (/^[17]\d{8}$/.test(formattedPhone)) {
        formattedPhone = '+254' + formattedPhone;
      }
      
      // Remove any plus if user entered multiple
      formattedPhone = formattedPhone.replace(/\++/g, '+');

      // Send individual inquiries for each selected product
      const inquiryPromises = selectedProducts.map(product =>
        axios.post('/api/services/questions/product', {
          providerId,
          productId: product.id,
          message: `${inquiryMessage}\n\nProduct: ${product.name}\nPrice: KES ${product.price.toLocaleString()}`,
          customerPhone: formattedPhone,
          contactMethod: 'whatsapp'
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        })
      );

      await Promise.all(inquiryPromises);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Inquiries Sent!',
        `Your questions about ${selectedProducts.length} product(s) have been sent to the provider.`,
        [{ 
          text: 'OK', 
          onPress: () => {
            setInquiryModalVisible(false);
            clearSelection();
          }
        }]
      );
    } catch (error) {
      console.error('Inquiry error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Failed to Send',
        error.response?.data?.message || 'Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // Skeleton Loading Component
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.skeletonProductCard}>
          <View style={styles.skeletonProductImage} />
          <View style={styles.skeletonProductInfo}>
            <View style={styles.skeletonProductTitle} />
            <View style={styles.skeletonProductDescription} />
            <View style={styles.skeletonProductFooter}>
              <View style={styles.skeletonProductPrice} />
              <View style={styles.skeletonSelectButton} />
            </View>
          </View>
        </View>
      ))}
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

  // Inquiry Modal
  const renderInquiryModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={inquiryModalVisible}
      onRequestClose={() => setInquiryModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Inquire About Products</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setInquiryModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.inquiryContent} showsVerticalScrollIndicator={false}>
            {/* Selected Products Summary */}
            <View style={styles.selectedProductsSection}>
              <Text style={styles.sectionTitle}>Selected Products ({selectedProducts.length})</Text>
              {selectedProducts.map((product, index) => (
                <View key={`${product.id}-${index}`} style={styles.selectedProductItem}>
                  {product.image ? (
                    <Image source={{ uri: product.image }} style={styles.selectedProductImage} />
                  ) : (
                    <View style={styles.selectedProductImagePlaceholder}>
                      <Ionicons name="cube" size={16} color={Colors.textSecondary} />
                    </View>
                  )}
                  <View style={styles.selectedProductInfo}>
                    <Text style={styles.selectedProductName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.selectedProductPrice}>
                      KES {product.price?.toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Contact Info */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Your Phone Number *</Text>
              <View style={styles.phoneInputWrapper}>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="0712345678 or +254712345678"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="phone-pad"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  maxLength={13} // Allow for +254 prefix
                />
              </View>
              <Text style={styles.inputNote}>
                Provider will contact you on this number via WhatsApp
              </Text>
            </View>

            {/* Message */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Your Message *</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Ask about pricing, availability, delivery, etc..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={4}
                value={inquiryMessage}
                onChangeText={setInquiryMessage}
              />
              <Text style={styles.inputNote}>
                Your message will be sent for each selected product
              </Text>
            </View>

            {/* Inquiry Summary */}
            <View style={styles.summarySection}>
              <Ionicons name="information-circle" size={20} color={Colors.textSecondary} />
              <Text style={styles.summaryText}>
                You're inquiring about {selectedProducts.length} product(s). The provider will receive individual messages for each product.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.cancelButton, { marginRight: Spacing.sm }]}
              onPress={() => setInquiryModalVisible(false)}
              disabled={isSubmittingInquiry}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.submitButton, isSubmittingInquiry && styles.submitButtonDisabled]}
              onPress={handleSubmitInquiry}
              disabled={isSubmittingInquiry}
            >
              {isSubmittingInquiry ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <>
                  <Ionicons name="send" size={18} color={Colors.text} />
                  <Text style={styles.submitButtonText}>
                    Send Inquiry ({selectedProducts.length})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
      {/* Selection Summary Bar */}
      {selectedProducts.length > 0 && (
        <View style={styles.selectionSummary}>
          <View style={styles.selectionSummaryLeft}>
            <Ionicons name="checkbox" size={20} color={Colors.primary} />
            <Text style={styles.selectionCount}>
              {selectedProducts.length} selected
            </Text>
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearSelection}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.inquireButton}
            onPress={openInquiryModal}
          >
            <Ionicons name="chatbubble" size={16} color={Colors.text} />
            <Text style={styles.inquireButtonText}>
              Inquire ({selectedProducts.length})
            </Text>
          </TouchableOpacity>
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
              <Text style={styles.tabSubtitle}>
                Select products to inquire about pricing & availability
              </Text>
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
                const isSelected = product.isSelected;
                
                return (
                  <View 
                    key={product.id} 
                    style={[
                      styles.productCard,
                      isSelected && styles.productCardSelected
                    ]}
                  >
                    {/* Selection Checkbox */}
                    <TouchableOpacity 
                      style={styles.selectionCheckbox}
                      onPress={() => toggleProductSelection(product.id)}
                    >
                      <View style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected
                      ]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color={Colors.text} />
                        )}
                      </View>
                    </TouchableOpacity>
                    
                    {/* Product Image */}
                    <TouchableOpacity 
                      style={styles.productImageContainer}
                      onPress={() => toggleProductSelection(product.id)}
                      activeOpacity={0.7}
                    >
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
                      {isSelected && (
                        <View style={styles.selectedOverlay}>
                          <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                        </View>
                      )}
                    </TouchableOpacity>
                    
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
                          KES {product.price?.toLocaleString()}
                        </Text>
                        
                        {/* Stock Status */}
                        <View style={[
                          styles.stockBadge,
                          { 
                            backgroundColor: isInStock ? 
                              Colors.success + '20' : 
                              Colors.danger + '20' 
                          }
                        ]}>
                          <View style={[
                            styles.stockDot,
                            { 
                              backgroundColor: isInStock ? 
                                Colors.success : 
                                Colors.danger 
                            }
                          ]} />
                          <Text style={[
                            styles.stockText,
                            { 
                              color: isInStock ? 
                                Colors.success : 
                                Colors.danger 
                            }
                          ]}>
                            {isInStock ? 'In Stock' : 'Out of Stock'}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Selection Button */}
                      <TouchableOpacity 
                        style={[
                          styles.selectButton,
                          isSelected && styles.selectButtonSelected,
                          !isInStock && styles.selectButtonDisabled
                        ]}
                        onPress={() => toggleProductSelection(product.id)}
                        activeOpacity={0.8}
                        disabled={!isInStock}
                      >
                        <Text style={[
                          styles.selectButtonText,
                          isSelected && styles.selectButtonTextSelected
                        ]}>
                          {isSelected ? 'Selected' : 'Select to Inquire'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          
          {products.length > 0 && (
            <View style={styles.instructionNote}>
              <Ionicons name="information-circle" size={16} color={Colors.textSecondary} />
              <Text style={styles.instructionNoteText}>
                Select multiple products to inquire about pricing, availability, and delivery options
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Inquiry Modal */}
      {renderInquiryModal()}
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
  // Selection Summary Bar
  selectionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  selectionSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  selectionCount: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  clearButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: Colors.card + '80',
    borderRadius: BorderRadius.sm,
  },
  clearButtonText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  inquireButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  inquireButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  // Product Grid
  tabContent: {
    padding: Spacing.lg,
  },
  productsHeader: {
    marginBottom: Spacing.lg,
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
    position: 'relative',
  },
  productCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.card + '80',
  },
  selectionCheckbox: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  productImageContainer: {
    width: '100%',
    height: 100,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.card + '80',
    position: 'relative',
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
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
  },
  selectButton: {
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  selectButtonSelected: {
    backgroundColor: Colors.primary,
  },
  selectButtonDisabled: {
    borderColor: Colors.textSecondary,
    backgroundColor: Colors.card + '40',
  },
  selectButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  selectButtonTextSelected: {
    color: Colors.text,
  },
  instructionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  instructionNoteText: {
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
    maxHeight: '90%',
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
  inquiryContent: {
    maxHeight: 500,
    padding: Spacing.lg,
  },
  selectedProductsSection: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  selectedProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  selectedProductImage: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  selectedProductImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.card + '80',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  selectedProductPrice: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.xs,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    color: Colors.text,
    fontSize: 16,
  },
  messageInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  summarySection: {
    flexDirection: 'row',
    backgroundColor: Colors.card + '40',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  submitButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  // Skeleton Styles
  skeletonContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  skeletonProductCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.card + '80',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.md,
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
  skeletonSelectButton: {
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
});

export default ProductsTab; 