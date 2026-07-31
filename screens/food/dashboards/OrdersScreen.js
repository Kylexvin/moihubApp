import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Clipboard,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import theme from '../../theme/Theme';

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const baseURL = Platform.OS === 'ios'
    ? 'http://localhost:5000'
    : 'https://moihub.onrender.com';

  // Order status configurations
  const statusConfig = {
    pending: {
      color: theme.Colors.warning,
      icon: 'hourglass-outline',
      label: 'Pending',
      nextStatuses: ['confirmed', 'rejected']
    },
    confirmed: {
      color: theme.Colors.info,
      icon: 'checkmark-circle-outline',
      label: 'Confirmed',
      nextStatuses: ['delivered']
    },
    delivered: {
      color: theme.Colors.success,
      icon: 'checkmark-done-circle-outline',
      label: 'Delivered',
      nextStatuses: []
    },
    rejected: {
      color: theme.Colors.danger,
      icon: 'close-circle-outline',
      label: 'Rejected',
      nextStatuses: []
    }
  };

  const fetchOrders = async () => {
    try {
      setError(null);
      const response = await axios.get(`${baseURL}/api/food/orders/vendor`);
      
      if (response.data.success) {
        setOrders(response.data.orders);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      console.error('Fetch orders error:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      
      const response = await axios.put(
        `${baseURL}/api/food/orders/vendor/${orderId}/status`,
        { status: newStatus }
      );

      if (response.data.success) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId
              ? { ...order, status: newStatus }
              : order
          )
        );
        Alert.alert('Success', 'Order status updated successfully');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Update order status error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ========== EXTRACT PHONE FROM DELIVERY INSTRUCTIONS ==========
  const extractPhoneFromInstructions = (instructions) => {
    if (!instructions) return null;
    
    const phoneMatch = instructions.match(/PHONE:\s*([\d\s\-+()]+)/i);
    if (phoneMatch) {
      return phoneMatch[1].trim().replace(/\s/g, '');
    }
    
    const phoneMatch2 = instructions.match(/Phone:\s*([\d\s\-+()]+)/i);
    if (phoneMatch2) {
      return phoneMatch2[1].trim().replace(/\s/g, '');
    }
    
    const phoneMatch3 = instructions.match(/(07\d{8}|01\d{8}|02\d{8}|\+254\d{9})/);
    if (phoneMatch3) {
      return phoneMatch3[1];
    }
    
    return null;
  };

  // ========== EXTRACT DELIVERY ADDRESS ==========
  const extractDeliveryAddress = (instructions) => {
    if (!instructions) return null;
    const address = instructions.replace(/PHONE:\s*[\d\s\-+()]+\s*\|\s*/i, '').trim();
    return address || null;
  };

  // ========== COPY PHONE ==========
  const copyPhoneNumber = async (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'No phone number available');
      return;
    }

    try {
      await Clipboard.setString(phoneNumber);
      Alert.alert('Success', `Phone number ${phoneNumber} copied to clipboard!`);
    } catch (error) {
      console.error('Copy error:', error);
      Alert.alert('Error', 'Failed to copy phone number');
    }
  };

  // ========== CALL PHONE ==========
  const callPhoneNumber = async (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'No phone number available');
      return;
    }

    try {
      const url = `tel:${phoneNumber}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot make calls on this device');
      }
    } catch (error) {
      console.error('Call error:', error);
      Alert.alert('Error', 'Failed to open dialer');
    }
  };

  // ========== WHATSAPP ==========
  const openWhatsApp = async (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'No phone number available');
      return;
    }

    try {
      // Remove any non-digit characters
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      // Ensure it starts with 254 for Kenya
      const formattedNumber = cleanNumber.startsWith('0') 
        ? `254${cleanNumber.slice(1)}` 
        : cleanNumber.startsWith('254') ? cleanNumber : `254${cleanNumber}`;
      
      const url = `whatsapp://send?phone=${formattedNumber}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device');
      }
    } catch (error) {
      console.error('WhatsApp error:', error);
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return 'KSh 0';
    }
    return `KSh ${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const getStatusColor = (status) => {
    return statusConfig[status]?.color || theme.Colors.textSecondary;
  };

  const getStatusIcon = (status) => {
    return statusConfig[status]?.icon || 'help-outline';
  };

  const getStatusLabel = (status) => {
    return statusConfig[status]?.label || status;
  };

  const getNextStatuses = (currentStatus) => {
    return statusConfig[currentStatus]?.nextStatuses || [];
  };

  const getCustomerName = (order) => {
    if (typeof order.userId === 'object' && order.userId !== null) {
      return order.userId.name || order.userId.username || `ID: ${order.userId?._id?.slice(-6)}`;
    }
    return `ID: ${order.userId?.slice(-6) || 'Unknown'}`;
  };

  const renderOrderItem = ({ item }) => {
    const isUpdating = updatingOrderId === item._id;
    const nextStatuses = getNextStatuses(item.status);
    const customerName = getCustomerName(item);
    const phoneNumber = extractPhoneFromInstructions(item.deliveryInstructions);
    const deliveryAddress = extractDeliveryAddress(item.deliveryInstructions);
    
    return (
      <LinearGradient 
        colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
        style={styles.orderCard}
      >
        {/* ====== ORDER HEADER ====== */}
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>Order #{item._id?.slice(-6) || 'Unknown'}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Ionicons 
                name={getStatusIcon(item.status)} 
                size={14} 
                color={theme.Colors.white} 
              />
              <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
            </View>
          </View>
        </View>

        {/* ====== CUSTOMER NAME ====== */}
        <View style={styles.customerRow}>
          <Ionicons name="person-outline" size={16} color={theme.Colors.primary} />
          <Text style={styles.customerName}>{customerName}</Text>
        </View>

        {/* ====== ORDER ITEMS ====== */}
        <View style={styles.orderItems}>
          {item.items && item.items.length > 0 ? (
            item.items.map((orderItem, index) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>
                    {orderItem?.listingId?.name || 'Unknown Product'}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {formatPrice((orderItem?.listingId?.price || 0) * (orderItem?.quantity || 0))}
                  </Text>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemQuantity}>Qty: {orderItem?.quantity || 0}</Text>
                  <Text style={styles.itemUnitPrice}>
                    @ {formatPrice(orderItem?.listingId?.price || 0)} each
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noItems}>No items found</Text>
          )}
        </View>

        {/* ====== ORDER TOTAL ====== */}
        <View style={styles.orderTotal}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalAmount}>{formatPrice(item.totalPrice || 0)}</Text>
        </View>

        {/* ====== DELIVERY ADDRESS ====== */}
        {item.deliveryInstructions && (
          <View style={styles.deliverySection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={16} color={theme.Colors.primary} />
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            <Text style={styles.deliveryText}>
              {deliveryAddress || item.deliveryInstructions}
            </Text>
          </View>
        )}

        {/* ====== CUSTOMER CONTACT ====== */}
        {phoneNumber && (
          <View style={styles.contactSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="call-outline" size={16} color={theme.Colors.primary} />
              <Text style={styles.sectionTitle}>Customer Contact</Text>
            </View>
            
            <View style={styles.contactRow}>
              {/* Phone Number Display */}
              <View style={styles.phoneDisplay}>
                <Ionicons name="phone-portrait-outline" size={16} color={theme.Colors.textSecondary} />
                <Text style={styles.phoneNumber}>{phoneNumber}</Text>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.contactActions}>
                {/* Copy Button */}
                <TouchableOpacity
                  style={styles.contactActionButton}
                  onPress={() => copyPhoneNumber(phoneNumber)}
                >
                  <LinearGradient
                    colors={['rgba(80, 200, 120, 0.15)', 'rgba(80, 200, 120, 0.05)']}
                    style={styles.contactActionGradient}
                  >
                    <Ionicons name="copy-outline" size={18} color={theme.Colors.primary} />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Call Button */}
                <TouchableOpacity
                  style={styles.contactActionButton}
                  onPress={() => callPhoneNumber(phoneNumber)}
                >
                  <LinearGradient
                    colors={['rgba(52, 152, 219, 0.15)', 'rgba(52, 152, 219, 0.05)']}
                    style={styles.contactActionGradient}
                  >
                    <Ionicons name="call-outline" size={18} color="#3498db" />
                  </LinearGradient>
                </TouchableOpacity>

                {/* WhatsApp Button */}
                <TouchableOpacity
                  style={styles.contactActionButton}
                  onPress={() => openWhatsApp(phoneNumber)}
                >
                  <LinearGradient
                    colors={['rgba(37, 211, 102, 0.15)', 'rgba(37, 211, 102, 0.05)']}
                    style={styles.contactActionGradient}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ====== STATUS ACTIONS ====== */}
        {nextStatuses.length > 0 && (
          <View style={styles.actionsContainer}>
            <Text style={styles.actionsLabel}>Update Status</Text>
            <View style={styles.statusButtons}>
              {nextStatuses.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    isUpdating && styles.disabledButton
                  ]}
                  onPress={() => updateOrderStatus(item._id, status)}
                  disabled={isUpdating}
                >
                  <LinearGradient
                    colors={[getStatusColor(status), getStatusColor(status) + '80']}
                    style={styles.statusButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color={theme.Colors.white} />
                    ) : (
                      <>
                        <Ionicons name={getStatusIcon(status)} size={16} color={theme.Colors.white} />
                        <Text style={styles.statusButtonText}>{getStatusLabel(status)}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </LinearGradient>
    );
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <LinearGradient colors={theme.Gradients.dark} style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
          <Text style={styles.loadingSubText}>Please wait a moment</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={theme.Gradients.dark} style={styles.errorContainer}>
        <View style={styles.errorCard}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={48} color={theme.Colors.danger} />
          </View>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <LinearGradient colors={[theme.Colors.primary, theme.Colors.primaryDark]} style={styles.retryGradient}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.Gradients.dark} style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsHeader}>
        <LinearGradient 
          colors={['rgba(80, 200, 120, 0.1)', 'rgba(8, 48, 40, 0.2)']}
          style={styles.statCard}
        >
          <Text style={styles.statNumber}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </LinearGradient>

        <LinearGradient 
          colors={['rgba(80, 200, 120, 0.1)', 'rgba(8, 48, 40, 0.2)']}
          style={styles.statCard}
        >
          <Text style={styles.statNumber}>
            {orders.filter(order => order.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </LinearGradient>

        <LinearGradient 
          colors={['rgba(80, 200, 120, 0.1)', 'rgba(8, 48, 40, 0.2)']}
          style={styles.statCard}
        >
          <Text style={styles.statNumber}>
            {orders.filter(order => order.status === 'confirmed').length}
          </Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </LinearGradient>

        <LinearGradient 
          colors={['rgba(80, 200, 120, 0.1)', 'rgba(8, 48, 40, 0.2)']}
          style={styles.statCard}
        >
          <Text style={styles.statNumber}>
            {orders.filter(order => order.status === 'delivered').length}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </LinearGradient>
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.Colors.primary}
            colors={[theme.Colors.primary]}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={64} color={theme.Colors.textSecondary} />
            </View>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>Orders will appear here when customers place them</Text>
          </View>
        }
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    ...theme.Typography.h3,
    marginTop: theme.Spacing.lg,
  },
  loadingSubText: {
    ...theme.Typography.caption,
    marginTop: theme.Spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.Spacing.xl,
  },
  errorCard: {
    ...theme.Components.card,
    alignItems: 'center',
    padding: theme.Spacing.xl,
    width: '100%',
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
  },
  errorTitle: {
    ...theme.Typography.h3,
    marginBottom: theme.Spacing.sm,
  },
  errorText: {
    ...theme.Typography.body,
    color: theme.Colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.Spacing.xl,
  },
  retryButton: {
    width: '100%',
    borderRadius: theme.BorderRadius.md,
    overflow: 'hidden',
  },
  retryGradient: {
    paddingVertical: theme.Spacing.md,
    alignItems: 'center',
  },
  retryButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.black,
  },
  statsHeader: {
    flexDirection: 'row',
    padding: theme.Spacing.md,
    gap: theme.Spacing.sm,
  },
  statCard: {
    flex: 1,
    ...theme.Components.card,
    padding: theme.Spacing.sm,
    alignItems: 'center',
  },
  statNumber: {
    ...theme.Typography.h3,
    color: theme.Colors.primary,
  },
  statLabel: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
  },
  listContainer: {
    padding: theme.Spacing.md,
  },
  orderCard: {
    ...theme.Components.card,
    marginBottom: theme.Spacing.md,
    padding: theme.Spacing.md,
  },
  // ====== HEADER ======
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.Spacing.sm,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    ...theme.Typography.body,
    fontWeight: '600',
    color: theme.Colors.text,
  },
  orderDate: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.BorderRadius.round,
    gap: 4,
  },
  statusText: {
    color: theme.Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  // ====== CUSTOMER ======
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.Spacing.md,
    gap: theme.Spacing.xs,
  },
  customerName: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.textSecondary,
  },
  // ====== ORDER ITEMS ======
  orderItems: {
    marginBottom: theme.Spacing.sm,
    gap: theme.Spacing.xs,
  },
  orderItem: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: theme.BorderRadius.sm,
    padding: theme.Spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemName: {
    ...theme.Typography.body,
    color: theme.Colors.text,
    flex: 1,
  },
  itemPrice: {
    ...theme.Typography.body,
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
  },
  itemUnitPrice: {
    ...theme.Typography.caption,
    color: theme.Colors.textTertiary,
  },
  noItems: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: theme.Spacing.sm,
  },
  // ====== TOTAL ======
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.Colors.cardBorder,
    marginTop: theme.Spacing.xs,
    marginBottom: theme.Spacing.sm,
  },
  totalLabel: {
    ...theme.Typography.body,
    color: theme.Colors.textSecondary,
  },
  totalAmount: {
    ...theme.Typography.h3,
    color: theme.Colors.primary,
  },
  // ====== DELIVERY SECTION ======
  deliverySection: {
    backgroundColor: 'rgba(80, 200, 120, 0.05)',
    borderRadius: theme.BorderRadius.sm,
    padding: theme.Spacing.sm,
    marginBottom: theme.Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
    marginBottom: 4,
  },
  sectionTitle: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  deliveryText: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.textSecondary,
    paddingLeft: 24,
  },
  // ====== CONTACT SECTION ======
  contactSection: {
    backgroundColor: 'rgba(52, 152, 219, 0.05)',
    borderRadius: theme.BorderRadius.sm,
    padding: theme.Spacing.sm,
    marginBottom: theme.Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.1)',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 24,
  },
  phoneDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
  },
  phoneNumber: {
    ...theme.Typography.body,
    color: theme.Colors.text,
    fontWeight: '600',
  },
  contactActions: {
    flexDirection: 'row',
    gap: theme.Spacing.xs,
  },
  contactActionButton: {
    borderRadius: theme.BorderRadius.round,
    overflow: 'hidden',
  },
  contactActionGradient: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.BorderRadius.round,
  },
  // ====== STATUS ACTIONS ======
  actionsContainer: {
    marginTop: theme.Spacing.sm,
  },
  actionsLabel: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.textSecondary,
    marginBottom: theme.Spacing.sm,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.Spacing.sm,
  },
  statusButton: {
    borderRadius: theme.BorderRadius.round,
    overflow: 'hidden',
  },
  statusButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.sm,
    gap: theme.Spacing.xs,
  },
  statusButtonText: {
    color: theme.Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.Spacing.lg,
  },
  emptyText: {
    ...theme.Typography.h3,
    marginBottom: theme.Spacing.sm,
  },
  emptySubtext: {
    ...theme.Typography.body,
    color: theme.Colors.textSecondary,
    textAlign: 'center',
  },
});

export default OrdersScreen;