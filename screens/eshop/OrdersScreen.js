// screens/eshop/OrdersScreen.js
import React, { useState, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Adjust path as needed

const API_URL = 'https://moihub.onrender.com/api';

const OrdersScreen = ({ navigation }) => {
  const { isAuthenticated, token, currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchOrders();
    } else {
      // Redirect to login if not authenticated
      navigation.replace('Login');
    }
  }, [isAuthenticated, token]);

  const fetchOrders = async (page = 1, isRefresh = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Using axios which already has the auth header set from context
      const response = await axios.get(
        `${API_URL}/eshop/orders/my-orders?page=${page}&limit=10`
      );
      
      const data = response.data;
      
      if (data.success) {
        if (page === 1 || isRefresh) {
          setOrders(data.data);
        } else {
          setOrders(prevOrders => [...prevOrders, ...data.data]);
        }
        setCurrentPage(data.currentPage);
        setTotalPages(data.totalPages);
      } else {
        Alert.alert('Error', 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        Alert.alert(
          'Authentication Error', 
          'Your session has expired. Please login again.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Login')
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(1, true);
  };

  const loadMoreOrders = () => {
    if (currentPage < totalPages && !loadingMore) {
      fetchOrders(currentPage + 1);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };



  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#f59e0b';
      case 'confirmed':
        return '#3b82f6';
      case 'processing':
        return '#8b5cf6';
      case 'shipped':
        return '#06b6d4';
      case 'delivered':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'schedule';
      case 'confirmed':
        return 'check-circle';
      case 'processing':
        return 'settings';
      case 'shipped':
        return 'local-shipping';
      case 'delivered':
        return 'done-all';
      case 'cancelled':
        return 'cancel';
      default:
        return 'info';
    }
  };

  const formatPrice = (price) => {
    return `KSh ${price.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrderItem = ({ item }) => {
    const isExpanded = expandedOrders.has(item._id);
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);

    return (
      <View style={styles.orderCard}>
        <TouchableOpacity
          style={styles.orderHeader}
          onPress={() => toggleOrderExpansion(item._id)}
          activeOpacity={0.7}
        >
          <View style={styles.orderInfo}>
            <View style={styles.orderMeta}>
              <Text style={styles.orderId}>Order #{item._id.slice(-8)}</Text>
              <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
            </View>
            
            <View style={styles.shopInfo}>
              <Icon name="store" size={16} color="#666" />
              <Text style={styles.shopName}>{item.shop.shopName}</Text>
            </View>
            
            <View style={styles.orderSummary}>
              <Text style={styles.itemCount}>
                {item.items.length} item{item.items.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.totalAmount}>{formatPrice(item.totalAmount)}</Text>
            </View>
          </View>

          <View style={styles.orderRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Icon name={statusIcon} size={14} color="white" />
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
            
            <Icon 
              name={isExpanded ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="#666" 
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.orderDetails}>
            <View style={styles.separator} />
            
            {/* Order Items */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>Items Ordered</Text>
              {item.items.map((orderItem, index) => (
                <View key={index} style={styles.itemRow}>
                  <Image
                    source={{ uri: orderItem.product.image }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <View style={styles.itemDetails}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {orderItem.product.name}
                    </Text>
                    <View style={styles.itemMeta}>
                      <Text style={styles.quantity}>Qty: {orderItem.quantity}</Text>
                      <Text style={styles.price}>{formatPrice(orderItem.price)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Shipping Information */}
            <View style={styles.shippingSection}>
              <Text style={styles.sectionTitle}>Shipping Information</Text>
              <View style={styles.infoRow}>
                <Icon name="location-on" size={16} color="#666" />
                <Text style={styles.infoText}>{item.shippingAddress}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="phone" size={16} color="#666" />
                <Text style={styles.infoText}>{item.contactNumber}</Text>
              </View>
            </View>

            {/* Order Summary */}
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Order Total:</Text>
                <Text style={styles.summaryValue}>{formatPrice(item.totalAmount)}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            {/* <View style={styles.actionButtons}>
              {item.status.toLowerCase() === 'pending' && (
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => cancelOrder(item._id)}
                >
                  <Text style={styles.cancelButtonText}>Cancel Order</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.trackButton}
                onPress={() => navigation.navigate('OrderTracking', { orderId: item._id })}
              >
                <Icon name="track-changes" size={16} color="white" />
                <Text style={styles.trackButtonText}>Track Order</Text>
              </TouchableOpacity>
            </View> */}
          </View>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#007bff" />
        <Text style={styles.loadingText}>Loading more orders...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="shopping-bag" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Orders Found</Text>
      <Text style={styles.emptyMessage}>
        You haven't placed any orders yet. Start shopping to see your orders here.
      </Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  // Show loading while checking authentication
  if (!isAuthenticated || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        
      
        
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreOrders}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={orders.length === 0 ? styles.emptyContainer : styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  userInfo: {
    fontSize: 12,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  orderDetails: {
    paddingBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  itemsSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 12,
    color: '#666',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
  },
  shippingSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  summarySection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007bff',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007bff',
    borderRadius: 6,
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  shopButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default OrdersScreen;