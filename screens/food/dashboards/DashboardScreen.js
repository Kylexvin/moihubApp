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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const DashboardScreen = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const baseURL = Platform.OS === 'ios'
    ? 'http://localhost:5000'
    : 'https://moihub.onrender.com';

  const fetchDashboardData = async () => {
    try {
      setError(null);

      const response = await axios.get(`${baseURL}/api/food/vendors/dashboard`);

      if (response.data && response.data.data) {
        setDashboardData(response.data.data);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        // Optionally redirect to login screen
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
      
      // Update UI optimistically
      setDashboardData(prev => ({
        ...prev,
        vendor: { ...prev.vendor, isOpen: newStatus }
      }));

      // Make API call to update shop status
      await axios.patch(
        `${baseURL}/api/food/vendors/toggle-status`,
        { isOpen: newStatus }
      );
    } catch (err) {
      // Revert optimistic update on error
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

  const { activeOrders, totalOrders, totalSales, vendor } = dashboardData;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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

        <View style={styles.subscriptionInfo}>
          <Text style={styles.subscriptionLabel}>Subscription expires:</Text>
          <Text style={styles.subscriptionDate}>
            {new Date(vendor.subscriptionEndDate).toLocaleDateString()}
          </Text>
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
  actionsContainer: {
    padding: 20,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  actionCard: {
    backgroundColor: 'white',
    width: '47%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default DashboardScreen;