import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import theme from '../../theme/Theme';

const VendorDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [dashboardResponse, statsResponse] = await Promise.all([
        axios.get('/api/eshop/vendor/dashboard'),
        axios.get('/api/eshop/vendor/stats')
      ]);

      if (dashboardResponse.data.success) {
        setDashboardData(dashboardResponse.data.data);
      }

      if (statsResponse.data.success) {
        setStatsData(statsResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatCurrency = (amount) => {
    return `KSh ${amount?.toLocaleString() || 0}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return theme.Colors.success;
      case 'pending':
        return theme.Colors.warning;
      case 'processing':
        return theme.Colors.info;
      case 'cancelled':
        return theme.Colors.danger;
      default:
        return theme.Colors.textSecondary;
    }
  };

  const StatCard = ({ title, value, icon, color = theme.Colors.info }) => (
    <LinearGradient
      colors={['rgba(0, 100, 80, 0.3)', 'rgba(0, 60, 50, 0.4)']}
      style={[styles.statCard, { borderLeftColor: color }]}
    >
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </LinearGradient>
  );

  const OrderStatusItem = ({ status, count }) => (
    <View style={styles.orderStatusItem}>
      <View style={styles.orderStatusLeft}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} />
        <Text style={styles.orderStatusText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
      </View>
      <Text style={styles.orderStatusCount}>{count}</Text>
    </View>
  );

  const TopProductItem = ({ product, index }) => (
    <View style={styles.topProductItem}>
      <LinearGradient
        colors={['rgba(0, 200, 150, 0.2)', 'rgba(0, 100, 80, 0.1)']}
        style={styles.productRank}
      >
        <Text style={styles.rankNumber}>{index + 1}</Text>
      </LinearGradient>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productQuantity}>Sold: {product.quantity}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={theme.Gradients.dark} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.Colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.Gradients.dark} style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.Colors.primary}
            colors={[theme.Colors.primary]}
          />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['rgba(0, 200, 150, 0.2)', 'rgba(0, 100, 80, 0.1)']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Eshop Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Welcome back, {dashboardData?.shop?.shopName || 'Shop Owner'}
          </Text>
        </LinearGradient>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(statsData?.totalRevenue || dashboardData?.totalRevenue)}
              icon="cash-outline"
              color={theme.Colors.success}
            />
            <StatCard
              title="Total Orders"
              value={statsData?.totalOrders || dashboardData?.totalOrders || 0}
              icon="receipt-outline"
              color={theme.Colors.info}
            />
            <StatCard
              title="Total Products"
              value={dashboardData?.totalProducts || 0}
              icon="pricetags-outline"
              color={theme.Colors.warning}
            />
            <StatCard
              title="Available Products"
              value={dashboardData?.availableProducts || 0}
              icon="checkmark-circle-outline"
              color={theme.Colors.primary}
            />
          </View>
        </View>

        {/* Orders by Status */}
        {statsData?.ordersByStatus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Orders by Status</Text>
            <LinearGradient
              colors={['rgba(0, 100, 80, 0.2)', 'rgba(0, 60, 50, 0.3)']}
              style={styles.orderStatusContainer}
            >
              {Object.entries(statsData.ordersByStatus).map(([status, count]) => (
                <OrderStatusItem key={status} status={status} count={count} />
              ))}
            </LinearGradient>
          </View>
        )}

        {/* Top Products */}
        {statsData?.topProducts && statsData.topProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Products</Text>
            <LinearGradient
              colors={['rgba(0, 100, 80, 0.2)', 'rgba(0, 60, 50, 0.3)']}
              style={styles.topProductsContainer}
            >
              {statsData.topProducts.map((product, index) => (
                <TopProductItem key={index} product={product} index={index} />
              ))}
            </LinearGradient>
          </View>
        )}

        {/* Subscription Status */}
        {dashboardData?.isSubscriptionValid !== undefined && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subscription Status</Text>
            <LinearGradient
              colors={['rgba(0, 100, 80, 0.2)', 'rgba(0, 60, 50, 0.3)']}
              style={styles.subscriptionContainer}
            >
              <View style={styles.subscriptionStatus}>
                <Ionicons
                  name={dashboardData.isSubscriptionValid ? "checkmark-circle" : "warning"}
                  size={24}
                  color={dashboardData.isSubscriptionValid ? theme.Colors.success : theme.Colors.warning}
                />
                <Text style={[
                  styles.subscriptionText,
                  { color: dashboardData.isSubscriptionValid ? theme.Colors.success : theme.Colors.warning }
                ]}>
                  {dashboardData.isSubscriptionValid ? "Active" : "Expired"}
                </Text>
              </View>
              {dashboardData.shop?.subscriptionEndDate && (
                <Text style={styles.subscriptionDate}>
                  Ends: {new Date(dashboardData.shop.subscriptionEndDate).toLocaleDateString()}
                </Text>
              )}
            </LinearGradient>
          </View>
        )}
      </ScrollView>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.Colors.textSecondary,
  },
  header: {
    padding: 20,
    paddingTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 100, 80, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.Colors.text,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.Colors.textSecondary,
    marginTop: 5,
  },
  shopStatus: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 60, 50, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.2)',
  },
  shopStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.Colors.text,
    flex: 1,
  },
  statusBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvedBadge: {
    backgroundColor: theme.Colors.success,
  },
  activeBadge: {
    backgroundColor: theme.Colors.info,
  },
  openBadge: {
    backgroundColor: theme.Colors.warning,
  },
  badgeText: {
    color: theme.Colors.black,
    fontSize: 12,
    fontWeight: 'bold',
  },
  shopDescription: {
    fontSize: 14,
    color: theme.Colors.textSecondary,
    lineHeight: 20,
  },
  statsContainer: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.Colors.text,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    padding: 15,
    borderRadius: 10,
    width: '48%',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.2)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    color: theme.Colors.textSecondary,
    marginLeft: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.Colors.text,
  },
  section: {
    margin: 15,
    marginTop: 0,
  },
  orderStatusContainer: {
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.2)',
  },
  orderStatusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 100, 80, 0.1)',
  },
  orderStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  orderStatusText: {
    fontSize: 16,
    color: theme.Colors.text,
  },
  orderStatusCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.Colors.text,
  },
  topProductsContainer: {
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.2)',
  },
  topProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 100, 80, 0.1)',
  },
  productRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 150, 0.3)',
  },
  rankNumber: {
    color: theme.Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.Colors.text,
  },
  productQuantity: {
    fontSize: 14,
    color: theme.Colors.textSecondary,
    marginTop: 2,
  },
  recentOrdersContainer: {
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.2)',
  },
  orderItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 100, 80, 0.1)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.Colors.text,
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderDate: {
    fontSize: 14,
    color: theme.Colors.textSecondary,
    marginBottom: 2,
  },
  orderItems: {
    fontSize: 14,
    color: theme.Colors.textSecondary,
  },
  subscriptionContainer: {
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.2)',
  },
  subscriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  subscriptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  subscriptionDate: {
    fontSize: 14,
    color: theme.Colors.textSecondary,
  },
});

export default VendorDashboard;