import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const StatsScreen = ({ navigation }) => {
  const { currentUser, token, isAuthenticated, logout } = useAuth();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [detailStats, setDetailStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user is admin
  const isAdmin = currentUser?.role === 'admin' || currentUser?.isAdmin === true;

  useEffect(() => {
    // Check authentication and admin status
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please log in to access statistics.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    if (!isAdmin) {
      Alert.alert(
        'Access Denied',
        'Admin privileges required to view statistics.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }

    fetchStats();
  }, [isAuthenticated, isAdmin]);

  const fetchStats = async () => {
    if (!token) {
      Alert.alert('Error', 'No authentication token found');
      return;
    }

    try {
      setLoading(true);
      
      // Configure headers with authorization token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Fetch dashboard stats
      const dashboardResponse = await axios.get(
        'http://192.168.100.51:5000/api/stats/dashboard',
        config
      );
      
      // Fetch detailed stats
      const detailResponse = await axios.get(
        'http://192.168.100.51:5000/api/stats/app',
        config
      );
      
      if (dashboardResponse.data.success && detailResponse.data.success) {
        setDashboardStats(dashboardResponse.data.data);
        setDetailStats(detailResponse.data.data);
      } else {
        Alert.alert('Error', 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
                navigation.navigate('Login'); // Adjust navigation as needed
              }
            }
          ]
        );
      } else if (error.response?.status === 403) {
        Alert.alert(
          'Access Denied',
          'You do not have permission to view these statistics.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', 'Network error occurred while fetching statistics');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const formatPercentage = (num) => {
    if (num === null || num === undefined) return '0%';
    return `${parseFloat(num).toFixed(1)}%`;
  };

  const StatCard = ({ title, value, subtitle, color = '#3b82f6', icon }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardContent}>
        {icon && (
          <View style={[styles.statIcon, { backgroundColor: color }]}>
            <Icon name={icon} size={20} color="#fff" />
          </View>
        )}
        <View style={styles.statText}>
          <Text style={styles.statValue}>{formatNumber(value)}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );

  const SectionCard = ({ title, children, color = '#f8fafc' }) => (
    <View style={[styles.sectionCard, { backgroundColor: color }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const DistributionItem = ({ label, value, total }) => {
    const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
    return (
      <View style={styles.distributionItem}>
        <Text style={styles.distributionLabel}>{label}</Text>
        <View style={styles.distributionValue}>
          <Text style={styles.distributionNumber}>{formatNumber(value)}</Text>
          <Text style={styles.distributionPercent}>({percentage}%)</Text>
        </View>
      </View>
    );
  };

  const TabButton = ({ title, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Show loading while checking authentication
  if (!isAuthenticated || !isAdmin) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  if (!dashboardStats || !detailStats) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Failed to load statistics</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStats}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform Statistics</Text>
        <View style={styles.headerActions}>
          <Text style={styles.adminBadge}>Admin</Text>
          <TouchableOpacity onPress={fetchStats} style={styles.refreshButton}>
            <Icon name="refresh" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TabButton
          title="Overview"
          isActive={activeTab === 'overview'}
          onPress={() => setActiveTab('overview')}
        />
        <TabButton
          title="Details"
          isActive={activeTab === 'details'}
          onPress={() => setActiveTab('details')}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && (
          <>
            {/* Overview Stats */}
            <SectionCard title="Platform Overview">
              <View style={styles.overviewGrid}>
                <StatCard
                  title="Total Users"
                  value={dashboardStats.totalUsers}
                  color="#3b82f6"
                  icon="people"
                />
                <StatCard
                  title="Total Businesses"
                  value={dashboardStats.totalBusinesses}
                  color="#10b981"
                  icon="business"
                />
                <StatCard
                  title="Total Listings"
                  value={dashboardStats.totalListings}
                  color="#f59e0b"
                  icon="list"
                />
              </View>
            </SectionCard>

            {/* Recent Activity */}
            <SectionCard title="Recent Activity" color="#fef7ff">
              <View style={styles.activityGrid}>
                <StatCard
                  title="New Users"
                  value={dashboardStats.recentActivity.newUsers}
                  color="#8b5cf6"
                  icon="person-add"
                />
                <StatCard
                  title="New Profiles"
                  value={dashboardStats.recentActivity.newProfiles}
                  color="#ec4899"
                  icon="account-circle"
                />
                <StatCard
                  title="Total New Activity"
                  value={dashboardStats.recentActivity.totalNewActivity}
                  color="#06b6d4"
                  icon="trending-up"
                />
              </View>
            </SectionCard>

            {/* Quick Summary */}
            <SectionCard title="Summary" color="#f0fdf4">
              <View style={styles.summaryGrid}>
                <StatCard
                  title="Platform"
                  value={detailStats.summary.totalPlatformUsers}
                  color="#84cc16"
                  icon="group"
                />
                <StatCard
                  title="LinkMe "
                  value={detailStats.summary.totalProfiles}
                  color="#22c55e"
                  icon="account-box"
                />
              </View>
            </SectionCard>
          </>
        )}

        {activeTab === 'details' && (
          <>
            {/* Users Section */}
           <SectionCard title="Users Analytics" color="#eff6ff">
  <View style={styles.detailGrid}>
    <StatCard
      title="Total Users"
      value={detailStats.users.total}
      subtitle="All registered users"
      color="#3b82f6"
      icon="people"
    />
    <StatCard
      title="Online Now"
      value={detailStats.users.onlineNow}
      subtitle="Currently online"
      color="#10b981"
      icon="wifi"
    />
    <StatCard
      title="Active (24h)"
      value={detailStats.users.activeLast24h}
      subtitle="Used app in last 24h"
      color="#22c55e"
      icon="access-time"
    />
    <StatCard
      title="New This Month"
      value={detailStats.users.newThisMonth}
      subtitle="Recent signups"
      color="#f59e0b"
      icon="person-add"
    />
    <StatCard
      title="Inactive Users"
      value={detailStats.users.inactiveUsers}
      subtitle="No activity in 24h"
      color="#ef4444"
      icon="person-outline"
    />
  </View>
</SectionCard>


            {/* LinkMe Section */}
            <SectionCard title="LinkMe Profiles" color="#fef7ff">
              <View style={styles.detailGrid}>
                <StatCard
                  title="Total Profiles"
                  value={detailStats.linkMe.total}
                  color="#8b5cf6"
                  icon="link"
                />
                <StatCard
                  title="Approved"
                  value={detailStats.linkMe.approved}
                  subtitle={formatPercentage(detailStats.linkMe.approvalRate)}
                  color="#10b981"
                  icon="check-circle"
                />
                <StatCard
                  title="Completed"
                  value={detailStats.linkMe.completed}
                  color="#06b6d4"
                  icon="done-all"
                />
                <StatCard
                  title="Draft"
                  value={detailStats.linkMe.draft}
                  color="#f59e0b"
                  icon="edit"
                />
              </View>
              
              <Text style={styles.subsectionTitle}>Gender Distribution</Text>
              <View style={styles.distributionContainer}>
                <DistributionItem
                  label="Male"
                  value={detailStats.linkMe.genderDistribution.male}
                  total={detailStats.linkMe.total}
                />
                <DistributionItem
                  label="Female"
                  value={detailStats.linkMe.genderDistribution.female}
                  total={detailStats.linkMe.total}
                />
              </View>
            </SectionCard>

            {/* Shops Section */}
            <SectionCard title="E-Shops Analytics" color="#f0fdf4">
              <View style={styles.detailGrid}>
                <StatCard
                  title="Total Shops"
                  value={detailStats.shops.total}
                  color="#22c55e"
                  icon="store"
                />
                <StatCard
                  title="Active Shops"
                  value={detailStats.shops.active}
                  color="#10b981"
                  icon="storefront"
                />
                <StatCard
                  title="Open Now"
                  value={detailStats.shops.open}
                  color="#84cc16"
                  icon="schedule"
                />
                <StatCard
                  title="Subscribed"
                  value={detailStats.shops.subscribed}
                  color="#06b6d4"
                  icon="card-membership"
                />
              </View>
              
              <Text style={styles.subsectionTitle}>Category Distribution</Text>
              <View style={styles.distributionContainer}>
                {Object.entries(detailStats.shops.categoryDistribution).map(([category, count]) => (
                  <DistributionItem
                    key={category}
                    label={category}
                    value={count}
                    total={detailStats.shops.total}
                  />
                ))}
              </View>
            </SectionCard>

            {/* Food Vendors Section */}
            <SectionCard title="Food Vendors" color="#fef3c7">
              <View style={styles.detailGrid}>
                <StatCard
                  title="Total Vendors"
                  value={detailStats.foodVendors.total}
                  color="#f59e0b"
                  icon="restaurant"
                />
                <StatCard
                  title="Active Vendors"
                  value={detailStats.foodVendors.active}
                  color="#10b981"
                  icon="restaurant-menu"
                />
                <StatCard
                  title="Open Now"
                  value={detailStats.foodVendors.open}
                  color="#84cc16"
                  icon="schedule"
                />
              </View>
              
              <Text style={styles.subsectionTitle}>Location Distribution</Text>
              <View style={styles.distributionContainer}>
                {Object.entries(detailStats.foodVendors.locationDistribution).map(([location, count]) => (
                  <DistributionItem
                    key={location}
                    label={location}
                    value={count}
                    total={detailStats.foodVendors.total}
                  />
                ))}
              </View>
            </SectionCard>

            {/* Orders Section */}
            <SectionCard title="Orders Analytics" color="#fef2f2">
              <View style={styles.detailGrid}>
                <StatCard
                  title="Total Orders"
                  value={detailStats.orders.total}
                  color="#ef4444"
                  icon="shopping-cart"
                />
                <StatCard
                  title="This Month"
                  value={detailStats.orders.thisMonth}
                  color="#f59e0b"
                  icon="calendar-today"
                />
                <StatCard
                  title="Revenue"
                  value={`KES${detailStats.orders.totalRevenue}`}
                  color="#10b981"
                  icon="attach-money"
                />
              </View>
              
              <Text style={styles.subsectionTitle}>Order Status</Text>
              <View style={styles.distributionContainer}>
                {Object.entries(detailStats.orders.statusDistribution).map(([status, count]) => (
                  <DistributionItem
                    key={status}
                    label={status.charAt(0).toUpperCase() + status.slice(1)}
                    value={count}
                    total={detailStats.orders.total}
                  />
                ))}
              </View>
            </SectionCard>

            {/* Roommates Section */}
            <SectionCard title="Roommate Finder" color="#f0f9ff">
              <View style={styles.detailGrid}>
                <StatCard
                  title="Total Users"
                  value={detailStats.roommates.total}
                  color="#0ea5e9"
                  icon="people"
                />
                <StatCard
                  title="Has Room"
                  value={detailStats.roommates.hasRoom}
                  color="#10b981"
                  icon="home"
                />
                <StatCard
                  title="Looking for Room"
                  value={detailStats.roommates.lookingForRoom}
                  color="#f59e0b"
                  icon="search"
                />
              </View>
              
              <Text style={styles.subsectionTitle}>Gender Distribution</Text>
              <View style={styles.distributionContainer}>
                {Object.entries(detailStats.roommates.genderDistribution).map(([gender, count]) => (
                  <DistributionItem
                    key={gender}
                    label={gender.charAt(0).toUpperCase() + gender.slice(1)}
                    value={count}
                    total={detailStats.roommates.total}
                  />
                ))}
              </View>
              
              <Text style={styles.subsectionTitle}>Location Distribution</Text>
              <View style={styles.distributionContainer}>
                {Object.entries(detailStats.roommates.locationDistribution).map(([location, count]) => (
                  <DistributionItem
                    key={location}
                    label={location}
                    value={count}
                    total={detailStats.roommates.total}
                  />
                ))}
              </View>
            </SectionCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminBadge: {
    backgroundColor: '#10b981',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 12,
  },
  refreshButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activeTabButton: {
    backgroundColor: '#3b82f6',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginVertical: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '48%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  distributionContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  distributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  distributionLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  distributionValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distributionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  distributionPercent: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default StatsScreen;