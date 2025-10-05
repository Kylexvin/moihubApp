// screens/eshop/dashboards/OrdersScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { useSocket } from '../../../context/SocketContext'; 

const { width, height } = Dimensions.get('window');

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filter, setFilter] = useState('all'); 
  const [newOrderCount, setNewOrderCount] = useState(0);
  const socket = useSocket(); 

  // Status colors
  const statusColors = {
    pending: '#FF9500',
    processing: '#007AFF',
    completed: '#34C759',
    cancelled: '#FF3B30',
  };

  const statusIcons = {
    pending: 'time-outline',
    processing: 'sync-outline',
    completed: 'checkmark-circle-outline',
    cancelled: 'close-circle-outline',
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/eshop/orders/vendor');
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch single order details
  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await axios.get(`/api/eshop/orders/vendor/${orderId}`);
      if (response.data.success) {
        setSelectedOrder(response.data.data);
        setModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to fetch order details');
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    Alert.alert(
      'Confirm Status Update',
      `Are you sure you want to change the order status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          style: 'default',
          onPress: async () => {
            try {
              setUpdatingStatus(true);
              const response = await axios.patch(`/api/eshop/orders/vendor/${orderId}/status`, {
                status: newStatus
              });
              
              if (response.data.success) {
                Alert.alert('Success', `Order status updated to ${newStatus}`);
                setSelectedOrder(response.data.data);
                fetchOrders(); // Refresh the orders list
              }
            } catch (error) {
              console.error('Error updating order status:', error);
              const errorMessage = error.response?.data?.message || 'Failed to update order status';
              Alert.alert('Error', errorMessage);
            } finally {
              setUpdatingStatus(false);
            }
          }
        }
      ]
    );
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  // Setup socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for new orders
    const handleNewOrder = (orderData) => {
      console.log('New order received:', orderData);
      setNewOrderCount(prev => prev + 1);
      
      // Show alert for new order
      Alert.alert(
        'New Order! 🎉',
        `New order from ${orderData.user?.email || 'customer'} for ${formatCurrency(orderData.totalAmount)}`,
        [
          { 
            text: 'View Orders', 
            onPress: () => {
              setNewOrderCount(0);
              fetchOrders();
            }
          },
          { 
            text: 'Dismiss', 
            style: 'cancel',
            onPress: () => setNewOrderCount(0)
          }
        ]
      );
      
      // Auto-refresh orders
      fetchOrders();
    };

    // Listen for order status updates
    const handleOrderUpdate = (updatedOrder) => {
      console.log('Order updated:', updatedOrder);
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === updatedOrder._id ? updatedOrder : order
        )
      );
      
      // Update selected order if it's currently being viewed
      if (selectedOrder && selectedOrder._id === updatedOrder._id) {
        setSelectedOrder(updatedOrder);
      }
    };

    // Listen for order cancellations
    const handleOrderCancellation = (cancelledOrder) => {
      console.log('Order cancelled:', cancelledOrder);
      Alert.alert(
        'Order Cancelled',
        `Order #${cancelledOrder._id.slice(-8)} has been cancelled by the customer.`,
        [{ text: 'OK' }]
      );
      fetchOrders();
    };

    // Register socket event listeners
    socket.on('new_order', handleNewOrder);
    socket.on('order_updated', handleOrderUpdate);
    socket.on('order_cancelled', handleOrderCancellation);

    // Cleanup listeners on unmount
    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_updated', handleOrderUpdate);
      socket.off('order_cancelled', handleOrderCancellation);
    };
  }, [socket, selectedOrder]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground, refresh orders
        fetchOrders();
        setNewOrderCount(0);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Focus effect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  // Filter orders based on selected filter
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `KES ${amount.toLocaleString()}`;
  };

  // Render order item
  const renderOrderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => fetchOrderDetails(item._id)}
      activeOpacity={0.8}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderId}>#{item._id.slice(-8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
            <Ionicons name={statusIcons[item.status]} size={12} color="white" />
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.customerEmail}>{item.user.email}</Text>
        <Text style={styles.itemCount}>
          {item.items.length} item{item.items.length > 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalAmount}>{formatCurrency(item.totalAmount)}</Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );

  // Render filter buttons
  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {['all', 'pending', 'processing', 'completed', 'cancelled'].map((filterType) => (
        <TouchableOpacity
          key={filterType}
          style={[
            styles.filterButton,
            filter === filterType && styles.activeFilterButton
          ]}
          onPress={() => setFilter(filterType)}
        >
          <Text style={[
            styles.filterButtonText,
            filter === filterType && styles.activeFilterButtonText
          ]}>
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render order details modal
  const renderOrderModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Order Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {selectedOrder && (
          <View style={styles.modalContent}>
            <View style={styles.orderInfoCard}>
              <Text style={styles.orderInfoTitle}>Order #{selectedOrder._id.slice(-8)}</Text>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Status:</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[selectedOrder.status] }]}>
                  <Ionicons name={statusIcons[selectedOrder.status]} size={12} color="white" />
                  <Text style={styles.statusText}>{selectedOrder.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Date:</Text>
                <Text style={styles.orderInfoValue}>{formatDate(selectedOrder.createdAt)}</Text>
              </View>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Customer:</Text>
                <Text style={styles.orderInfoValue}>{selectedOrder.user.email}</Text>
              </View>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Contact:</Text>
                <Text style={styles.orderInfoValue}>{selectedOrder.contactNumber}</Text>
              </View>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Message info</Text>
                <Text style={styles.orderInfoValue}>{selectedOrder.shippingAddress}</Text>
              </View>
            </View>

            <View style={styles.itemsCard}>
              <Text style={styles.itemsTitle}>Items ({selectedOrder.items.length})</Text>
              {selectedOrder.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {item.product ? item.product.name : 'Product not found'}
                    </Text>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>{formatCurrency(selectedOrder.totalAmount)}</Text>
              </View>
            </View>

            {/* Status update buttons */}
            {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
              <View style={styles.statusUpdateCard}>
                <Text style={styles.statusUpdateTitle}>Update Status</Text>
                <View style={styles.statusButtonsContainer}>
                  {selectedOrder.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.statusButton, { backgroundColor: statusColors.processing }]}
                      onPress={() => updateOrderStatus(selectedOrder._id, 'processing')}
                      disabled={updatingStatus}
                    >
                      {updatingStatus ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <>
                          <Ionicons name="sync-outline" size={16} color="white" />
                          <Text style={styles.statusButtonText}>Mark Processing</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  
                  {(selectedOrder.status === 'pending' || selectedOrder.status === 'processing') && (
                    <>
                      <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: statusColors.completed }]}
                        onPress={() => updateOrderStatus(selectedOrder._id, 'completed')}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                            <Text style={styles.statusButtonText}>Mark Completed</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: statusColors.cancelled }]}
                        onPress={() => updateOrderStatus(selectedOrder._id, 'cancelled')}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Ionicons name="close-circle-outline" size={16} color="white" />
                            <Text style={styles.statusButtonText}>Cancel Order</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Orders</Text>
          {newOrderCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{newOrderCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={fetchOrders} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {renderFilterButtons()}

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No orders found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all' ? 'You have no orders yet' : `No ${filter} orders found`}
            </Text>
          </View>
        }
      />

      {renderOrderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  notificationBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  notificationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  refreshButton: {
    padding: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  orderDetails: {
    marginBottom: 12,
  },
  customerEmail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 12,
    color: '#666',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  orderInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  orderInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  orderInfoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  itemsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  statusUpdateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  statusUpdateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusButtonsContainer: {
    gap: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OrdersScreen;