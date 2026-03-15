// screens/eshop/OrdersScreen.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  Dimensions,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const API_URL = 'https://moihub.onrender.com/api';

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

// Modular Components
const Header = ({ navigation, title, username }) => (
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
    <Text style={styles.headerTitle}>
      {username ? `${username}'s Orders` : title}
    </Text>
    <TouchableOpacity 
      onPress={() => navigation.navigate('EshopHome')}
      style={styles.headerButton}
    >
      <Icon name="home" size={22} color={ShopColors.gold} />
    </TouchableOpacity>
  </LinearGradient>
);

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const statusMap = {
      pending: { color: ShopColors.warning, icon: 'schedule', label: 'PENDING' },
      confirmed: { color: ShopColors.info, icon: 'check-circle', label: 'CONFIRMED' },
      processing: { color: ShopColors.accent, icon: 'settings', label: 'PROCESSING' },
      shipped: { color: ShopColors.primary, icon: 'local-shipping', label: 'SHIPPED' },
      delivered: { color: ShopColors.success, icon: 'done-all', label: 'DELIVERED' },
      cancelled: { color: ShopColors.danger, icon: 'cancel', label: 'CANCELLED' },
    };
    return statusMap[status.toLowerCase()] || statusMap.pending;
  };

  const config = getStatusConfig(status);

  return (
    <LinearGradient
      colors={[config.color, `${config.color}dd`]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statusBadge}
    >
      <Icon name={config.icon} size={12} color={ShopColors.gold} />
      <Text style={styles.statusText}>{config.label}</Text>
    </LinearGradient>
  );
};

const OrderItemCard = React.memo(({ item, isExpanded, onToggle, navigation }) => {
  const formatPrice = (price) => `KSh ${price.toLocaleString()}`;
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Default placeholder image (you can replace with your own placeholder)
  const DEFAULT_PLACEHOLDER = 'https://via.placeholder.com/300x300?text=No+Image';

  const handleViewProduct = useCallback((product) => {
    if (!product || !product._id) {
      Alert.alert('Error', 'Product information is not available');
      return;
    }
    navigation.navigate('ProductDetail', {
      productId: product._id,
      productName: product.name || 'Product',
    });
  }, [navigation]);

  const handleTrackOrder = useCallback(() => {
    Alert.alert('Track Order', 'Tracking feature coming soon!');
  }, []);

  const handleContactShop = useCallback(() => {
    if (!item.shop) {
      Alert.alert('Contact Shop', 'Shop information is not available');
      return;
    }
    Alert.alert('Contact Shop', `Contact ${item.shop.shopName || 'shop'} coming soon!`);
  }, [item.shop]);

 const handleShopPress = useCallback(() => {
  if (!item.shop || !item.shop._id) {
    Alert.alert('Shop Unavailable', 'This shop is no longer available');
    return;
  }
  
  // Check if shop has slug, if not, you might need to fetch it or use shopId as fallback
  if (!item.shop.slug) {
    // If slug is missing, you can either:
    // 1. Generate a slug from shop name (not ideal but works as fallback)
    const generatedSlug = item.shop.shopName
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'shop';
    
    navigation.navigate('ShopProducts', {
      shopSlug: generatedSlug,
      shopName: item.shop.shopName,
      shopId: item.shop._id,
    });
  } else {
    navigation.navigate('ShopProducts', {
      shopSlug: item.shop.slug,
      shopName: item.shop.shopName,
      shopId: item.shop._id,
    });
  }
}, [navigation, item.shop]);

  const handleReorder = useCallback(() => {
    Alert.alert('Reorder', 'Add all items to cart?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Reorder', 
        onPress: () => navigation.navigate('Cart')
      }
    ]);
  }, [navigation]);

  // Get valid image URL with fallback
  const getImageUrl = (product) => {
    if (!product) return DEFAULT_PLACEHOLDER;
    
    // Check if image exists and is a valid string
    if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
      return product.image;
    }
    
    return DEFAULT_PLACEHOLDER;
  };

  // Safely get shop name with fallback
  const shopName = item.shop?.shopName || 'Unknown Shop';
  
  return (
    <Animatable.View animation="fadeInUp" duration={400}>
      <View style={styles.orderCard}>
        <LinearGradient
          colors={[ShopColors.card, ShopColors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Gold Accent Line */}
          <View style={styles.cardGoldAccent} />
          
          <TouchableOpacity
            style={styles.orderHeader}
            onPress={onToggle}
            activeOpacity={0.7}
          >
            <View style={styles.orderInfo}>
              <View style={styles.orderMeta}>
                <Text style={styles.orderId}>#{item._id.slice(-8)}</Text>
                <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
              </View>
              
              {/* Shop Info with null check */}
              <TouchableOpacity 
                style={styles.shopInfo}
                onPress={item.shop?._id ? handleShopPress : null}
                disabled={!item.shop?._id}
              >
                <Icon name="store" size={14} color={ShopColors.gold} />
                <Text style={styles.shopName}>
                  {shopName}
                </Text>
                {item.shop?._id && <Icon name="chevron-right" size={16} color={ShopColors.gold} />}
              </TouchableOpacity>
              
              <View style={styles.orderSummary}>
                <Text style={styles.itemCount}>
                  {item.items.length} item{item.items.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.totalAmount}>{formatPrice(item.totalAmount)}</Text>
              </View>
            </View>

            <View style={styles.orderRight}>
              <StatusBadge status={item.status} />
              <Icon 
                name={isExpanded ? 'expand-less' : 'expand-more'} 
                size={24} 
                color={ShopColors.gold} 
              />
            </View>
          </TouchableOpacity>

          {isExpanded && (
            <Animatable.View animation="fadeIn" duration={300}>
              <View style={styles.orderDetails}>
                <View style={styles.divider} />
                
                {/* Items Section */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>
                    <Icon name="shopping-bag" size={16} color={ShopColors.gold} /> ITEMS ORDERED
                  </Text>
                  {item.items.map((orderItem, index) => {
                    // Skip if product is null
                    if (!orderItem.product) {
                      return (
                        <View key={index} style={styles.itemRow}>
                          <View style={[styles.productImage, styles.placeholderImage]}>
                            <Icon name="image-not-supported" size={24} color={ShopColors.gold} />
                          </View>
                          <View style={styles.itemDetails}>
                            <Text style={styles.productName}>Product Unavailable</Text>
                            <View style={styles.itemMeta}>
                              <Text style={styles.quantity}>
                                Qty: {orderItem.quantity || 0}
                              </Text>
                              <Text style={styles.price}>
                                {formatPrice(orderItem.price || 0)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    }

                    return (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.itemRow}
                        onPress={() => handleViewProduct(orderItem.product)}
                      >
                        <Image
                          source={{ uri: getImageUrl(orderItem.product) }}
                          style={styles.productImage}
                          resizeMode="cover"
                          onError={(e) => {
                            console.log('Image failed to load:', e.nativeEvent.error);
                            // You could set a fallback state here if needed
                          }}
                        />
                        <View style={styles.itemDetails}>
                          <Text style={styles.productName} numberOfLines={2}>
                            {orderItem.product.name || 'Unnamed Product'}
                          </Text>
                          <View style={styles.itemMeta}>
                            <Text style={styles.quantity}>
                              Qty: {orderItem.quantity}
                            </Text>
                            <Text style={styles.price}>
                              {formatPrice(orderItem.price)}
                            </Text>
                          </View>
                        </View>
                        <Icon name="chevron-right" size={20} color={ShopColors.gold} />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Shipping Section */}
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>
                    <Icon name="local-shipping" size={16} color={ShopColors.gold} /> SHIPPING DETAILS
                  </Text>
                  <View style={styles.infoRow}>
                    <Icon name="location-on" size={16} color={ShopColors.gold} />
                    <Text style={styles.infoText}>{item.shippingAddress || 'No address provided'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Icon name="phone" size={16} color={ShopColors.gold} />
                    <Text style={styles.infoText}>{item.contactNumber || 'No contact number'}</Text>
                  </View>
                </View>

                {/* Summary Section */}
                <LinearGradient
                  colors={[ShopColors.card, ShopColors.surface]}
                  style={styles.summarySection}
                >
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>{formatPrice(item.totalAmount || 0)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Shipping</Text>
                    <Text style={styles.summaryValue}>Free</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatPrice(item.totalAmount || 0)}</Text>
                  </View>
                </LinearGradient>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={handleTrackOrder}
                  >
                    <LinearGradient
                      colors={[ShopColors.info, '#00838F']}
                      style={styles.actionButtonGradient}
                    >
                      <Icon name="track-changes" size={16} color={ShopColors.gold} />
                      <Text style={styles.actionButtonText}>Track</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={handleContactShop}
                  >
                    <LinearGradient
                      colors={[ShopColors.accent, '#7B1FA2']}
                      style={styles.actionButtonGradient}
                    >
                      <Icon name="message" size={16} color={ShopColors.gold} />
                      <Text style={styles.actionButtonText}>Contact</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={handleShopPress}
                  >
                    <LinearGradient
                      colors={[ShopColors.primary, ShopColors.secondary]}
                      style={styles.actionButtonGradient}
                    >
                      <Icon name="shopping-cart" size={16} color={ShopColors.gold} />
                      <Text style={styles.actionButtonText}>Shop Again</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Reorder Button */}
                {item.status && item.status.toLowerCase() === 'delivered' && (
                  <TouchableOpacity 
                    style={styles.reorderButton}
                    onPress={handleReorder}
                  >
                    <LinearGradient
                      colors={[ShopColors.success, '#2E7D32']}
                      style={styles.reorderGradient}
                    >
                      <Icon name="refresh" size={18} color={ShopColors.gold} />
                      <Text style={styles.reorderText}>Reorder All Items</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </Animatable.View>
          )}
        </LinearGradient>
      </View>
    </Animatable.View>
  );
});

const EmptyState = ({ navigation }) => (
  <Animatable.View animation="fadeIn" duration={500} style={styles.emptyState}>
    <LinearGradient
      colors={[ShopColors.card, ShopColors.surface]}
      style={styles.emptyGradient}
    >
      <View style={styles.emptyIconContainer}>
        <Icon name="shopping-bag" size={64} color={ShopColors.gold} />
      </View>
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptyMessage}>
        Your orders will appear here once you start shopping.
      </Text>
      
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => navigation.navigate('EshopHome')}
      >
        <LinearGradient
          colors={[ShopColors.primary, ShopColors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.shopButtonText}>Browse Shops</Text>
          <Icon name="arrow-forward" size={20} color={ShopColors.gold} />
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  </Animatable.View>
);

const LoadingFooter = () => (
  <View style={styles.loadingFooter}>
    <ActivityIndicator size="small" color={ShopColors.gold} />
    <Text style={styles.loadingText}>Loading more orders...</Text>
  </View>
);

// Main Component
const OrdersScreen = ({ navigation }) => {
  const { isAuthenticated, token, currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && token) {
        fetchOrders(1, true);
      }
    }, [isAuthenticated, token])
  );

  const fetchOrders = async (page = 1, isRefresh = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await axios.get(
        `${API_URL}/eshop/orders/my-orders?page=${page}&limit=10`
      );
      
      const data = response.data;
      
      if (data.success) {
        if (page === 1 || isRefresh) {
          setOrders(data.data);
        } else {
          setOrders(prev => [...prev, ...data.data]);
        }
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again', [
          { text: 'OK', onPress: () => navigation.replace('Login') }
        ]);
      } else {
        Alert.alert('Error', 'Failed to fetch orders');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders(1, true);
  }, []);

  const loadMoreOrders = useCallback(() => {
    if (currentPage < totalPages && !loadingMore) {
      fetchOrders(currentPage + 1);
    }
  }, [currentPage, totalPages, loadingMore]);

  const toggleOrderExpansion = useCallback((orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }, []);

  // Memoize render function
  const renderOrderItem = useCallback(({ item }) => (
    <OrderItemCard
      item={item}
      isExpanded={expandedOrders.has(item._id)}
      onToggle={() => toggleOrderExpansion(item._id)}
      navigation={navigation}
    />
  ), [expandedOrders, toggleOrderExpansion, navigation]);

  if (!isAuthenticated) {
    return (
      <LinearGradient colors={[ShopColors.background, ShopColors.surface]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={ShopColors.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ShopColors.gold} />
          <Text style={styles.loadingMainText}>Redirecting to login...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={[ShopColors.background, ShopColors.surface]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={ShopColors.primary} />
        
        {/* Floating Icons */}
        <View style={styles.floatingIcons}>
          <Text style={[styles.floatingIcon, styles.icon1]}>👑</Text>
          <Text style={[styles.floatingIcon, styles.icon2]}>✨</Text>
          <Text style={[styles.floatingIcon, styles.icon3]}>🛍️</Text>
          <Text style={[styles.floatingIcon, styles.icon4]}>💎</Text>
        </View>

        <Header 
          navigation={navigation} 
          title="My Orders" 
          username={currentUser?.username}
        />
        <View style={styles.loadingContainer}>
          <Animatable.View animation="pulse" iterationCount="infinite">
            <View style={styles.loadingIcon}>
              <Icon name="receipt" size={60} color={ShopColors.gold} />
            </View>
          </Animatable.View>
          <ActivityIndicator size="large" color={ShopColors.gold} />
          <Text style={styles.loadingMainText}>Loading your orders...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[ShopColors.background, ShopColors.surface]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={ShopColors.primary} />
      
      {/* Floating Icons */}
      <View style={styles.floatingIcons}>
        <Text style={[styles.floatingIcon, styles.icon1]}>👑</Text>
        <Text style={[styles.floatingIcon, styles.icon2]}>✨</Text>
        <Text style={[styles.floatingIcon, styles.icon3]}>🛍️</Text>
        <Text style={[styles.floatingIcon, styles.icon4]}>💎</Text>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <Header 
          navigation={navigation} 
          title="My Orders" 
          username={currentUser?.username}
        />
        
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={ShopColors.gold}
              colors={[ShopColors.gold]}
            />
          }
          onEndReached={loadMoreOrders}
          onEndReachedThreshold={0.1}
          ListFooterComponent={loadingMore ? <LoadingFooter /> : null}
          ListEmptyComponent={<EmptyState navigation={navigation} />}
          contentContainerStyle={styles.listContainer}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.gold,
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  cardGradient: {
    position: 'relative',
  },
  cardGoldAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: ShopColors.gold,
  },
  orderHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: ShopColors.gold,
  },
  orderDate: {
    fontSize: 12,
    color: ShopColors.textMuted,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopName: {
    fontSize: 14,
    color: ShopColors.gold,
    marginLeft: 6,
    marginRight: 4,
    fontWeight: '500',
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: ShopColors.textMuted,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: ShopColors.gold,
  },
  orderRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: ShopColors.gold,
    letterSpacing: 0.5,
  },
  orderDetails: {
    padding: 16,
    paddingTop: 0,
  },
  divider: {
    height: 1,
    backgroundColor: ShopColors.gold + '20',
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ShopColors.gold,
    marginBottom: 12,
    letterSpacing: 1,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: ShopColors.background + '80',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ShopColors.gold + '10',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  itemDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: ShopColors.text,
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 12,
    color: ShopColors.textMuted,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.gold,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    backgroundColor: ShopColors.background + '80',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ShopColors.gold + '10',
  },
  infoText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    marginLeft: 10,
    flex: 1,
  },
  summarySection: {
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: ShopColors.gold + '20',
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  actionButtonText: {
    color: ShopColors.gold,
    fontSize: 11,
    fontWeight: '600',
  },
  reorderButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  reorderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  reorderText: {
    color: ShopColors.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: ShopColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ShopColors.gold + '40',
  },
  loadingMainText: {
    marginTop: 15,
    fontSize: 16,
    color: ShopColors.textSecondary,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: ShopColors.textMuted,
    marginLeft: 8,
  },
  emptyState: {
    marginHorizontal: 16,
    marginTop: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  emptyGradient: {
    padding: 32,
    alignItems: 'center',
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
    fontSize: 22,
    fontWeight: '800',
    color: ShopColors.gold,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: ShopColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
    backgroundColor: ShopColors.background, // Add background color for loading state
  },
  placeholderImage: {
    backgroundColor: ShopColors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },

  shopButton: {
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
  shopButtonText: {
    color: ShopColors.gold,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrdersScreen;
