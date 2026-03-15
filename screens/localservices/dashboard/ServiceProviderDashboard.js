// screens/localservices/dashboard/ServiceProviderDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import Theme from '../../theme/Theme';

// Import the other dashboard components
import BusinessProfile from './BusinessProfile';
import ServiceManagement from './ServiceManagement';
import ProductManagement from './ProductManagement';
import BookingManagement from './BookingManagement';

const { Colors, Typography, Spacing, BorderRadius, Shadows } = Theme;

const ServiceProviderDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [error, setError] = useState(null);
  const [activeScreen, setActiveScreen] = useState('dashboard');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/services/dashboard/overview');
      
      if (response.data.overview) {
        setOverviewData(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      
      let errorMessage = 'Failed to load dashboard data';
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setError(errorMessage);
      setOverviewData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatRating = (rating) => {
    return rating?.toFixed(1) || '0.0';
  };

  const formatExpiryDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getPlanColor = (plan) => {
    return plan === 'paid' ? Colors.success : Colors.warning;
  };

  // RENDER THE ACTIVE SCREEN
  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return renderDashboardContent();
      case 'businessProfile':
        return <BusinessProfile />;
      case 'serviceManagement':
        return <ServiceManagement />;
      case 'productManagement':
        return <ProductManagement />;
      case 'bookingManagement':
        return <BookingManagement />;
      default:
        return renderDashboardContent();
    }
  };

  // DASHBOARD CONTENT COMPONENT
  const renderDashboardContent = () => {
    const provider = overviewData?.overview?.provider;
    const subscription = overviewData?.overview?.subscription;
    const stats = overviewData?.overview?.stats;

    const StatCard = ({ icon, title, value, color = Colors.primary, onPress }) => (
      <TouchableOpacity 
        style={[styles.statCard, { borderColor: color + '40' }]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{title}</Text>
      </TouchableOpacity>
    );

    const QuickActionButton = ({ icon, label, color = Colors.primary, onPress }) => (
      <TouchableOpacity 
        style={[styles.quickActionButton, { backgroundColor: color + '15' }]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Ionicons name={icon} size={24} color={color} />
        <Text style={[styles.quickActionText, { color }]}>{label}</Text>
      </TouchableOpacity>
    );

    const DashboardSection = ({ title, children, rightAction }) => (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {rightAction && (
            <TouchableOpacity onPress={rightAction.onPress} activeOpacity={0.7}>
              <Text style={styles.sectionAction}>{rightAction.label}</Text>
            </TouchableOpacity>
          )}
        </View>
        {children}
      </View>
    );

    return (
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
            progressBackgroundColor={Colors.primaryDark}
          />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeGreeting}>Welcome back,</Text>
            <Text style={styles.welcomeName}>{provider?.name || 'Service Provider'}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => setActiveScreen('businessProfile')}
          >
            <Ionicons name="business" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Business Info */}
        <View style={styles.businessInfoCard}>
          <View style={styles.businessInfoRow}>
            <Ionicons name="location" size={16} color={Colors.textSecondary} />
            <Text style={styles.businessInfoText}>
              {provider?.areas?.join(', ') || 'No locations set'}
            </Text>
          </View>
          <View style={styles.businessInfoRow}>
            <Ionicons name="call" size={16} color={Colors.textSecondary} />
            <Text style={styles.businessInfoText}>{provider?.phone || 'No phone number'}</Text>
          </View>
          <View style={styles.businessInfoRow}>
            <Ionicons name="grid" size={16} color={Colors.textSecondary} />
            <Text style={styles.businessInfoText}>{provider?.category || 'No category'}</Text>
          </View>
        </View>

        {/* Stats Overview */}
        <DashboardSection title="Business Overview">
          <View style={styles.statsGrid}>
            <StatCard
              icon="construct-outline"
              title="Services"
              value={stats?.services || 0}
              color={Colors.info}
              onPress={() => setActiveScreen('serviceManagement')}
            />
            <StatCard
              icon="bag-outline"
              title="Products"
              value={stats?.products || 0}
              color={Colors.secondary}
              onPress={() => setActiveScreen('productManagement')}
            />
            <StatCard
              icon="time-outline"
              title="Pending"
              value={stats?.pendingBookings || 0}
              color={Colors.warning}
              onPress={() => setActiveScreen('bookingManagement')}
            />
            <StatCard
              icon="star-outline"
              title="Rating"
              value={formatRating(stats?.averageRating)}
              color={Colors.accent}
            />
          </View>
        </DashboardSection>

        {/* Subscription Status */}
        <DashboardSection title="Subscription">
          <TouchableOpacity 
            style={[
              styles.subscriptionCard,
              { 
                backgroundColor: getPlanColor(subscription?.plan) + '15',
                borderColor: getPlanColor(subscription?.plan) + '40'
              }
            ]}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Subscription', `Plan: ${subscription?.plan || 'N/A'}\nStatus: ${subscription?.isActive ? 'Active' : 'Inactive'}\nExpires: ${formatExpiryDate(subscription?.expiresAt)}`)}
          >
            <View style={styles.subscriptionHeader}>
              <Ionicons 
                name={subscription?.isActive ? "shield-checkmark" : "shield-warning"} 
                size={24} 
                color={getPlanColor(subscription?.plan)} 
              />
              <View style={styles.subscriptionInfo}>
                <Text style={[
                  styles.subscriptionPlan,
                  { color: getPlanColor(subscription?.plan) }
                ]}>
                  {subscription?.plan === 'paid' ? 'PRO PLAN' : 'BASIC PLAN'}
                </Text>
                <Text style={styles.subscriptionStatus}>
                  {subscription?.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <View style={styles.subscriptionFooter}>
              <Text style={styles.subscriptionExpiry}>
                Expires: {formatExpiryDate(subscription?.expiresAt)}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </DashboardSection>

        {/* Quick Actions */}
        <DashboardSection title="Quick Actions">
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              icon="add-circle"
              label="Add Service"
              color={Colors.primary}
              onPress={() => setActiveScreen('serviceManagement')}
            />
            <QuickActionButton
              icon="bag-add"
              label="Add Product"
              color={Colors.secondary}
              onPress={() => setActiveScreen('productManagement')}
            />
            <QuickActionButton
              icon="calendar"
              label="Bookings"
              color={Colors.info}
              onPress={() => setActiveScreen('bookingManagement')}
            />
            <QuickActionButton
              icon="business"
              label="Profile"
              color={Colors.accent}
              onPress={() => setActiveScreen('businessProfile')}
            />
          </View>
        </DashboardSection>

        {/* Profile Completion Alert */}
        {!overviewData?.overview?.profileComplete && (
          <TouchableOpacity 
            style={styles.profileAlertCard}
            onPress={() => setActiveScreen('businessProfile')}
            activeOpacity={0.8}
          >
            <View style={styles.profileAlertContent}>
              <View style={styles.profileAlertIcon}>
                <Ionicons name="alert-circle" size={20} color={Colors.warning} />
              </View>
              <View style={styles.profileAlertText}>
                <Text style={styles.profileAlertTitle}>Complete Your Profile</Text>
                <Text style={styles.profileAlertSubtitle}>
                  Finish setting up your business to attract more customers
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={Colors.warning} />
            </View>
          </TouchableOpacity>
        )}

        {/* Business Metrics */}
        <DashboardSection title="Business Metrics">
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{stats?.totalBookings || 0}</Text>
              <Text style={styles.metricLabel}>Total Bookings</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{stats?.totalReviews || 0}</Text>
              <Text style={styles.metricLabel}>Reviews</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{formatRating(stats?.averageRating)}</Text>
              <Text style={styles.metricLabel}>Avg Rating</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{stats?.pendingBookings || 0}</Text>
              <Text style={styles.metricLabel}>Pending</Text>
            </View>
          </View>
        </DashboardSection>

        {/* Bottom Padding for bottom navigation */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !overviewData && activeScreen === 'dashboard') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.errorTitle}>Unable to Load Dashboard</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchDashboardData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Main Content Area */}
      <View style={styles.content}>
        {renderActiveScreen()}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavContainer}>
        <TouchableOpacity 
          style={styles.bottomNavButton}
          onPress={() => setActiveScreen('dashboard')}
        >
          <Ionicons 
            name={activeScreen === 'dashboard' ? 'home' : 'home-outline'} 
            size={24} 
            color={activeScreen === 'dashboard' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[
            styles.bottomNavText, 
            { color: activeScreen === 'dashboard' ? Colors.primary : Colors.textSecondary }
          ]}>
            Dashboard
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.bottomNavButton}
          onPress={() => setActiveScreen('bookingManagement')}
        >
          <Ionicons 
            name={activeScreen === 'bookingManagement' ? 'calendar' : 'calendar-outline'} 
            size={24} 
            color={activeScreen === 'bookingManagement' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[
            styles.bottomNavText, 
            { color: activeScreen === 'bookingManagement' ? Colors.primary : Colors.textSecondary }
          ]}>
            Bookings
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.bottomNavButton}
          onPress={() => setActiveScreen('serviceManagement')}
        >
          <Ionicons 
            name={activeScreen === 'serviceManagement' ? 'construct' : 'construct-outline'} 
            size={24} 
            color={activeScreen === 'serviceManagement' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[
            styles.bottomNavText, 
            { color: activeScreen === 'serviceManagement' ? Colors.primary : Colors.textSecondary }
          ]}>
            Services
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.bottomNavButton}
          onPress={() => setActiveScreen('productManagement')}
        >
          <Ionicons 
            name={activeScreen === 'productManagement' ? 'bag' : 'bag-outline'} 
            size={24} 
            color={activeScreen === 'productManagement' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[
            styles.bottomNavText, 
            { color: activeScreen === 'productManagement' ? Colors.primary : Colors.textSecondary }
          ]}>
            Products
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.bottomNavButton}
          onPress={() => setActiveScreen('businessProfile')}
        >
          <Ionicons 
            name={activeScreen === 'businessProfile' ? 'business' : 'business-outline'} 
            size={24} 
            color={activeScreen === 'businessProfile' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[
            styles.bottomNavText, 
            { color: activeScreen === 'businessProfile' ? Colors.primary : Colors.textSecondary }
          ]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  headerBack: {
    padding: Spacing.xs,
  },
  headerBackPlaceholder: {
    width: 40,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  headerRefresh: {
    padding: Spacing.xs,
  },
  headerRefreshPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  welcomeSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeGreeting: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  welcomeName: {
    ...Typography.h2,
    color: Colors.white,
    fontWeight: '700',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  businessInfoCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.small,
  },
  businessInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  businessInfoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.white,
    fontWeight: '600',
  },
  sectionAction: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.small,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  subscriptionCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.small,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  subscriptionInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  subscriptionPlan: {
    ...Typography.body,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subscriptionStatus: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  subscriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionExpiry: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  quickActionButton: {
    width: '47%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickActionText: {
    ...Typography.caption,
    marginTop: Spacing.sm,
    fontWeight: '600',
  },
  profileAlertCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.warning + '10',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  profileAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAlertIcon: {
    marginRight: Spacing.md,
  },
  profileAlertText: {
    flex: 1,
  },
  profileAlertTitle: {
    ...Typography.body,
    color: Colors.warning,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  profileAlertSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  metricItem: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  metricValue: {
    ...Typography.h3,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: Spacing.xxl,
  },
  bottomNavContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryDark,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.sm + 6,
  },
  bottomNavButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  bottomNavText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    fontSize: 10,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.xxl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  errorTitle: {
    ...Typography.h3,
    color: Colors.white,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.button,
    color: Colors.black,
    fontWeight: '600',
  },
});

export default ServiceProviderDashboard;
