import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const DashboardScreen = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);

  const baseURL = Platform.OS === 'ios'
    ? 'http://localhost:5000'
    : 'https://moihub.onrender.com';

  const checkSubscriptionStatus = (subscriptionEndDate) => {
    const today = new Date();
    const endDate = new Date(subscriptionEndDate);
    return today > endDate;
  };

  const getDaysRemaining = (subscriptionEndDate) => {
    const today = new Date();
    const endDate = new Date(subscriptionEndDate);
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  const handleContactAdmin = () => {
    const phoneNumber = '0768610613';
    const message = `Hello, my subscription has expired. Shop: ${dashboardData?.vendor?.shopName || 'Unknown'}. Please help me renew it.`;
    
    Alert.alert(
      'Contact Admin',
      'Choose how to contact the admin:',
      [
        {
          text: 'Call',
          onPress: () => Linking.openURL(`tel:${phoneNumber}`)
        },
        {
          text: 'WhatsApp',
          onPress: () => Linking.openURL(`whatsapp://send?phone=254768610613&text=${encodeURIComponent(message)}`)
        },
        {
          text: 'SMS',
          onPress: () => Linking.openURL(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const fetchDashboardData = async () => {
    try {
      setError(null);

      const response = await axios.get(`${baseURL}/api/food/vendors/dashboard`);

      if (response.data && response.data.data) {
        const data = response.data.data;
        setDashboardData(data);
        
        // Check subscription status
        const isExpired = checkSubscriptionStatus(data.vendor.subscriptionEndDate);
        setSubscriptionExpired(isExpired);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const toggleShopStatus = async () => {
    try {
      const newStatus = !dashboardData.vendor.isOpen;
      
      setDashboardData(prev => ({
        ...prev,
        vendor: { ...prev.vendor, isOpen: newStatus }
      }));

      await axios.patch(
        `${baseURL}/api/food/vendors/toggle-status`,
        { isOpen: newStatus }
      );
    } catch (err) {
      setDashboardData(prev => ({
        ...prev,
        vendor: { ...prev.vendor, isOpen: !dashboardData.vendor.isOpen }
      }));
      
      Alert.alert('Error', 'Failed to update shop status');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDashboardData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show subscription expired screen
  if (subscriptionExpired) {
    return (
      <View style={styles.subscriptionExpiredContainer}>
        <Ionicons name="time-outline" size={80} color="#f44336" />
        <Text style={styles.expiredTitle}>Subscription Expired</Text>
        <Text style={styles.expiredMessage}>
          Your subscription has expired on {new Date(dashboardData.vendor.subscriptionEndDate).toLocaleDateString()}.
        </Text>
        <Text style={styles.expiredSubMessage}>
          Please contact the admin to renew your subscription and continue using the dashboard.
        </Text>
        
        <TouchableOpacity 
          style={styles.contactAdminButton}
          onPress={handleContactAdmin}
        >
          <Ionicons name="call-outline" size={20} color="white" />
          <Text style={styles.contactAdminButtonText}>Contact Admin</Text>
        </TouchableOpacity>
        
        <Text style={styles.adminNumber}>0768610613</Text>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchDashboardData}
        >
          <Ionicons name="refresh-outline" size={20} color="#4caf50" />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { activeOrders, totalOrders, totalSales, vendor } = dashboardData;
  const daysRemaining = getDaysRemaining(vendor.subscriptionEndDate);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Subscription Warning Banner */}
      {daysRemaining <= 7 && daysRemaining > 0 && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={20} color="#ff9800" />
          <Text style={styles.warningText}>
            Subscription expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={handleContactAdmin}>
            <Text style={styles.renewLink}>Renew</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.shopName}>{vendor.shopName}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.statusButton,
            { backgroundColor: vendor.isOpen ? '#4caf50' : '#f44336' }
          ]}
          onPress={toggleShopStatus}
        >
          <Text style={styles.statusButtonText}>
            {vendor.isOpen ? 'OPEN' : 'CLOSED'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <View style={styles.statsIconContainer}>
            <Ionicons name="timer-outline" size={24} color="#ff9800" />
          </View>
          <View style={styles.statsContent}>
            <Text style={styles.statsNumber}>{activeOrders}</Text>
            <Text style={styles.statsLabel}>Active Orders</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsIconContainer}>
            <Ionicons name="receipt-outline" size={24} color="#2196f3" />
          </View>
          <View style={styles.statsContent}>
            <Text style={styles.statsNumber}>{totalOrders}</Text>
            <Text style={styles.statsLabel}>Total Orders</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsIconContainer}>
            <Ionicons name="wallet-outline" size={24} color="#4caf50" />
          </View>
          <View style={styles.statsContent}>
            <Text style={styles.statsNumber}>KSh {totalSales.toLocaleString()}</Text>
            <Text style={styles.statsLabel}>Total Sales</Text>
          </View>
        </View>
      </View>

      {/* Vendor Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Shop Information</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#666" />
          <Text style={styles.infoText}>{vendor.location}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color="#666" />
          <Text style={styles.infoText}>{vendor.phone}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>{vendor.description}</Text>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Approved</Text>
            <View style={[styles.statusIndicator, { backgroundColor: vendor.isApproved ? '#4caf50' : '#f44336' }]}>
              <Ionicons 
                name={vendor.isApproved ? 'checkmark' : 'close'} 
                size={16} 
                color="white" 
              />
            </View>
          </View>

          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Active</Text>
            <View style={[styles.statusIndicator, { backgroundColor: vendor.isActive ? '#4caf50' : '#f44336' }]}>
              <Ionicons 
                name={vendor.isActive ? 'checkmark' : 'close'} 
                size={16} 
                color="white" 
              />
            </View>
          </View>
        </View>

        <View style={[
          styles.subscriptionInfo,
          { backgroundColor: daysRemaining <= 7 ? '#fff3cd' : '#f8f9fa' }
        ]}>
          <Text style={styles.subscriptionLabel}>Subscription expires:</Text>
          <Text style={[
            styles.subscriptionDate,
            { color: daysRemaining <= 7 ? '#856404' : '#333' }
          ]}>
            {new Date(vendor.subscriptionEndDate).toLocaleDateString()}
          </Text>
          {daysRemaining <= 7 && (
            <Text style={styles.daysRemaining}>
              ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining)
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscriptionExpiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 30,
  },
  expiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f44336',
    marginTop: 20,
    marginBottom: 15,
  },
  expiredMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  expiredSubMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  contactAdminButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  contactAdminButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  adminNumber: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: 'bold',
    marginBottom: 30,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  refreshButtonText: {
    color: '#4caf50',
    fontSize: 16,
    marginLeft: 8,
  },
  warningBanner: {
    backgroundColor: '#fff3cd',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  warningText: {
    flex: 1,
    marginLeft: 10,
    color: '#856404',
    fontSize: 14,
  },
  renewLink: {
    color: '#4caf50',
    fontWeight: 'bold',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statsContainer: {
    padding: 20,
    gap: 15,
  },
  statsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#fe5722',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statsContent: {
    flex: 1,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statsLabel: {
    fontSize: 14,
    color: '#fe5722',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#fe5722',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fe5722',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 15,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statusIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionInfo: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  subscriptionLabel: {
    fontSize: 14,
    color: '#666',
  },
  subscriptionDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  daysRemaining: {
    fontSize: 12,
    color: '#856404',
    marginTop: 5,
    fontStyle: 'italic',
  },
});

export default DashboardScreen;