// screens/food/MyOrdersScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as foodApi from '../../services/foodApi';
import { useAuth } from '../../context/AuthContext';
import { useFoodContext } from '../../context/FoodContext';

const MyOrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [clearingOrders, setClearingOrders] = useState(false);
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const { vendors } = useFoodContext();
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);

  const loadOrders = async (showRefresh = false, reset = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else if (!showRefresh && !reset) {
        setLoading(true);
      }
      
      setError(null);
      const currentPage = reset ? 1 : page;
      
      // Get orders from API
      const response = await foodApi.fetchUserOrders(token, currentPage);
      
      if (response && response.success) {
        if (reset || currentPage === 1) {
          setOrders(response.orders || []);
        } else {
          setOrders(prevOrders => [...prevOrders, ...(response.orders || [])]);
        }
        
        // Check if there's more data to load
        if (!response.orders || response.orders.length === 0 || response.orders.length < 10) {
          setHasMoreData(false);
        } else {
          setHasMoreData(true);
          if (!reset) setPage(currentPage + 1);
        }
      } else {
        setError('Failed to load orders. Please try again.');
      }
    } catch (error) {
      console.error('Error loading orders:', error.message || error);
      setError('Error loading orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reset page and reload data when screen comes into focus
      setPage(1);
      loadOrders(false, true);
    });

    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setPage(1);
    loadOrders(true, true);
  };

  const loadMoreOrders = () => {
    if (hasMoreData && !loading && !refreshing) {
      loadOrders();
    }
  };

  const handleRetry = () => {
    setPage(1);
    loadOrders(false, true);
  };

  const handleClearOrders = () => {
    Alert.alert(
      "Clear Order History",
      "Are you sure you want to clear all your order history? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: clearAllOrders }
      ],
      { cancelable: true }
    );
  };

  const clearAllOrders = async () => {
    try {
      setClearingOrders(true);
      const response = await foodApi.clearUserOrders(token);
      
      if (response && response.success) {
        setOrders([]);
        Alert.alert("Success", "Your order history has been cleared successfully.");
      } else {
        Alert.alert("Error", response?.message || "Failed to clear orders. Please try again.");
      }
    } catch (error) {
      console.error('Error clearing orders:', error.message || error);
      Alert.alert("Error", "Failed to clear order history. Please try again later.");
    } finally {
      setClearingOrders(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#FFA000'; // amber
      case 'preparing': return '#1976D2'; // blue
      case 'ready': return '#7CB342'; // light green
      case 'delivered': return '#43A047'; // green
      case 'cancelled': return '#E53935'; // red
      default: return '#757575'; // grey
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOrderItem = ({ item }) => {
    // Find vendor from context if available
    let vendorName = 'Restaurant';
    let vendorLocation = '';
    
    if (item.vendorId) {
      if (typeof item.vendorId === 'object') {
        // If vendorId is an object with details
        vendorName = item.vendorId.shopName || 'Restaurant';
        vendorLocation = item.vendorId.location || '';
      } else {
        // If vendorId is just an ID, try to find vendor details from context
        const vendor = vendors.find(v => v._id === item.vendorId);
        if (vendor) {
          vendorName = vendor.shopName || 'Restaurant';
          vendorLocation = vendor.location || '';
        }
      }
    }
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item._id.substring(item._id.length - 6)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
          </View>
        </View>
        
        <View style={styles.orderInfo}>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.orderPrice}>Ksh {item.totalPrice}</Text>
        </View>
        
        <View style={styles.orderFooter}>
          <Ionicons name="restaurant-outline" size={18} color="#004d40" />
          <Text style={styles.vendorText}>
            {vendorName} {vendorLocation ? `• ${vendorLocation}` : ''} • {item.items.length} item(s)
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing && orders.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#004d40" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        {orders.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={handleClearOrders}
            disabled={clearingOrders}
          >
            {clearingOrders ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="brush-outline" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error && orders.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#b0bec5" />
          <Text style={styles.emptyText}>You don't have any orders yet</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('FoodHome')}
          >
            <Text style={styles.shopButtonText}>Start Ordering</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#004d40']}
              tintColor="#004d40"
            />
          }
          onEndReached={loadMoreOrders}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loading && orders.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#004d40" />
                <Text style={styles.footerLoaderText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#004d40',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#004d40',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff5252',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#004d40',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 12,
    color: '#78909c',
  },
  shopButton: {
    backgroundColor: '#004d40',
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
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#004d40',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderDate: {
    fontSize: 14,
    color: '#757575',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00695c',
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  vendorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#004d40',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerLoaderText: {
    fontSize: 14,
    color: '#004d40',
    marginTop: 8,
  },
});

export default MyOrdersScreen;