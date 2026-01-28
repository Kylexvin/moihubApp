// screens/localservices/ProviderProfile.js
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
  Linking,
  Share,
  Animated,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '../theme/Theme';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // 🔥 IMPORTANT: Use your auth context
import ServicesTab from './components/ServicesTab';
import ProductsTab from './components/ProductsTab';
import ReviewsTab from './components/ReviewsTab';
import InfoTab from './components/InfoTab';

const { width, height } = Dimensions.get('window');
const { Colors, Gradients, Typography, Spacing, BorderRadius, Components, Shadows } = Theme;

const ProviderProfile = ({ route, navigation }) => {
  const { providerId } = route.params;
  const { logout } = useAuth(); // 🔥 Get logout function from context
  
  // State for API data
  const [overviewData, setOverviewData] = useState(null);
  const [servicesData, setServicesData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [reviewsData, setReviewsData] = useState([]);
  const [infoData, setInfoData] = useState(null);
  
  const [activeTab, setActiveTab] = useState('services');
  const [isSaved, setIsSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [sessionExpired, setSessionExpired] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '',
      headerTransparent: true,
      headerTintColor: Colors.text,
      headerBackground: () => (
        <Animated.View 
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: Colors.primaryDark,
            opacity: headerOpacity,
          }}
        />
      ),
    });
  }, [navigation, headerOpacity]);

  // Helper to handle API errors
  const handleApiError = (error, customMessage = 'Failed to load data') => {
    console.error('API Error:', error);
    
    // Check for 401 Unauthorized
    if (error.response?.status === 401) {
      setSessionExpired(true);
      return 'session_expired';
    }
    
    // Check for network errors
    if (!error.response) {
      return 'network_error';
    }
    
    return customMessage;
  };

  // Fetch overview data
  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setSessionExpired(false);
      setError(null);
      
      // 🔥 Auth header is automatically set by AuthContext
      const response = await axios.get(
        `/api/services/providers/${providerId}/dashboard/overview`,
        {
          timeout: 10000
        }
      );
      
      setOverviewData(response.data);
    } catch (error) {
      const errorType = handleApiError(error, 'Failed to load provider information');
      
      if (errorType === 'session_expired') {
        setError('Your session has expired. Please login again.');
        // Show a modal instead of immediate logout
        setTimeout(() => {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please login again to continue.',
            [
              {
                text: 'Login',
                onPress: () => {
                  logout();
                  navigation.replace('Login');
                }
              },
              {
                text: 'Cancel',
                style: 'cancel'
              }
            ]
          );
        }, 1000);
      } else {
        setError(errorType);
      }
    } finally {
      setLoading(false);
    }
  }, [providerId, logout, navigation]);

  // Fetch services data
  const fetchServices = async () => {
    try {
      const response = await axios.get(
        `/api/services/providers/${providerId}/dashboard/services`
      );
      
      const transformedServices = response.data.services?.map(service => ({
        id: service._id || service.id,
        name: service.name,
        duration: `${service.duration} mins`,
        price: `KES ${service.price.toLocaleString()}`,
        description: service.description,
        category: service.category || 'Service'
      })) || [];
      
      setServicesData(transformedServices);
    } catch (error) {
      handleApiError(error, 'Failed to load services');
    }
  };

  // Fetch products data
  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        `/api/services/providers/${providerId}/dashboard/products`
      );
      
      const transformedProducts = response.data.products?.map(product => ({
        id: product._id || product.id,
        name: product.name,
        price: `KES ${product.price.toLocaleString()}`,
        description: product.description,
        inStock: product.inStock,
        stockCount: product.stock
      })) || [];
      
      setProductsData(transformedProducts);
    } catch (error) {
      handleApiError(error, 'Failed to load products');
    }
  };

  // Fetch reviews data
  const fetchReviews = async () => {
    try {
      const response = await axios.get(
        `/api/services/providers/${providerId}/dashboard/reviews`
      );
      
      const transformedReviews = response.data.reviews?.map(review => ({
        id: review._id || review.id,
        rating: review.rating,
        author: review.user?.name || 'Customer',
        date: formatTimeAgo(review.createdAt),
        comment: review.comment,
        verified: review.verified || false,
        service: review.service?.name
      })) || [];
      
      setReviewsData(transformedReviews);
    } catch (error) {
      handleApiError(error, 'Failed to load reviews');
    }
  };

  // Fetch info data
  const fetchInfo = async () => {
    try {
      const response = await axios.get(
        `/api/services/providers/${providerId}/dashboard/info`
      );
      
      setInfoData(response.data);
    } catch (error) {
      handleApiError(error, 'Failed to load provider info');
    }
  };

  // Load tab data when tab changes
  useEffect(() => {
    if (!overviewData) return;
    
    if (activeTab === 'services' && servicesData.length === 0) {
      fetchServices();
    } else if (activeTab === 'products' && productsData.length === 0) {
      fetchProducts();
    } else if (activeTab === 'reviews' && reviewsData.length === 0) {
      fetchReviews();
    } else if (activeTab === 'info' && !infoData) {
      fetchInfo();
    }
  }, [activeTab, overviewData]);

  // Initial load
  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchOverview();
    
    if (activeTab === 'services') {
      await fetchServices();
    } else if (activeTab === 'products') {
      await fetchProducts();
    } else if (activeTab === 'reviews') {
      await fetchReviews();
    } else if (activeTab === 'info') {
      await fetchInfo();
    }
    
    setRefreshing(false);
  };

  const handleBookNow = (service = null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const providerName = overviewData?.header?.name || '';
    const providerImage = overviewData?.header?.profileImage || '';
    const providerRating = overviewData?.header?.rating || 0;
    const providerLocation = overviewData?.header?.location || '';
    
    if (service) {
      navigation.navigate('BookingScreen', {
        providerId,
        providerName,
        providerImage,
        providerRating,
        providerLocation,
        serviceName: service.name,
        servicePrice: service.price,
        serviceDuration: service.duration,
        serviceDescription: service.description,
      });
    } else {
      navigation.navigate('BookingScreen', {
        providerId,
        providerName,
        providerImage,
        providerRating,
        providerLocation,
      });
    }
  };

  const handleChat = async () => {
    if (!overviewData?.header?.phone) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const whatsappUrl = `https://wa.me/${overviewData.header.phone.replace('+', '')}?text=Hi ${encodeURIComponent(overviewData.header.name)}, I found you on MoiHub Services!`;
    
    try {
      await Linking.openURL(whatsappUrl);
    } catch (error) {
      Alert.alert('Error', 'Could not open WhatsApp');
    }
  };

  const handleCall = async () => {
    if (!overviewData?.header?.phone) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const phoneUrl = `tel:${overviewData.header.phone}`;
    
    try {
      await Linking.openURL(phoneUrl);
    } catch (error) {
      Alert.alert('Error', 'Could not make call');
    }
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSaved(!isSaved);
    Alert.alert(
      isSaved ? 'Removed from Saved' : 'Added to Saved', 
      isSaved ? 'This spa has been removed from your saved places.' : 'This spa has been added to your saved places.'
    );
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Check out ${overviewData?.header?.name} on MoiHub!\n⭐ ${overviewData?.header?.rating || 0} (${overviewData?.tabs?.reviews?.count || 0} reviews)\n📍 ${overviewData?.header?.location}\n📞 ${overviewData?.header?.phone}\n\nBook now: https://moihub.com/provider/${providerId}`,
        title: overviewData?.header?.name,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleGetDirections = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (infoData?.coordinates) {
      const { latitude, longitude } = infoData.coordinates;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Location', 'Address: ' + (overviewData?.header?.location || 'Location not available'));
    }
  };

  const addToCart = (product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart([...cart, product]);
    Alert.alert('Added to Cart', `${product.name} has been added to your cart.`);
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`full-${i}`} name="star" size={14} color={Colors.secondary} />);
    }
    
    if (hasHalfStar) {
      stars.push(<Ionicons key="half" name="star-half" size={14} color={Colors.secondary} />);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={14} color={Colors.textSecondary} />);
    }
    
    return stars;
  };

const renderHeader = () => {
  if (!overviewData?.header) return null;
  
  const header = overviewData.header;
  
  return (
    <View>
      {/* Cover Image with Top Right Icons */}
      <View style={styles.coverImageContainer}>
        {header.coverImage ? (
          <Image 
            source={{ uri: header.coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverImage, { backgroundColor: Colors.primary }]} />
        )}
        
        {/* Top Right Icons Container */}
        <View style={styles.topRightIcons}>
          <TouchableOpacity 
            style={styles.topIconButton}
            onPress={handleGetDirections}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="location" size={20} color={Colors.text} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.topIconButton}
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={Colors.text} 
              />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.topIconButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="share-outline" size={20} color={Colors.text} />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Overlay Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(10,10,10,0.7)', Colors.background]}
          style={styles.coverGradient}
        />
      </View>
      
      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <View style={styles.profileImageContainer}>
          {renderProfileImage(header)}
        </View>
        
        <Text style={styles.businessName}>{header.name}</Text>
        
        {/* Rating and Reviews */}
        <View style={styles.ratingContainer}>
          <View style={styles.starsContainer}>
            {renderStars(header.rating || 0)}
          </View>
          <Text style={styles.ratingText}>
            {header.rating || 0} • ({overviewData.tabs?.reviews?.count || 0} reviews)
          </Text>
        </View>
        
        {/* Location */}
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={Colors.textSecondary} />
          <Text style={styles.locationText}>{header.location}</Text>
        </View>
        
        {/* Status */}
        <View style={styles.statusBadge}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: header.status?.isOpen ? Colors.success : Colors.danger }
          ]} />
          <Text style={styles.statusText}>
            {header.status?.display || 'Closed'}
          </Text>
        </View>
      </View>
    </View>
  );
};

// 🔥 NEW: Separate function to handle profile image
const renderProfileImage = (header) => {
  const imageUrl = header.profileImage || header.image || header.avatar || header.logo;
  
  console.log('Profile Image Debug:', {
    url: imageUrl,
    exists: !!imageUrl,
    type: typeof imageUrl
  });
  
  if (imageUrl) {
    return (
      <Image 
        source={{ uri: imageUrl }}
        style={styles.profileImage}
        resizeMode="cover"
        onError={(e) => {
          console.log('Profile image loading error:', {
            error: e.nativeEvent.error,
            url: imageUrl,
            headers: e.nativeEvent.responseHeaders
          });
        }}
        onLoadStart={() => console.log('Profile image loading started...')}
        onLoad={() => console.log('Profile image loaded successfully!')}
        onLoadEnd={() => console.log('Profile image load ended')}
      />
    );
  }
  
  // Fallback icon
  return (
    <View style={[styles.profileImage, { 
      backgroundColor: Colors.card, 
      justifyContent: 'center', 
      alignItems: 'center' 
    }]}>
      <Ionicons name="business" size={40} color={Colors.textSecondary} />
    </View>
  );
};

  const renderActionButtons = () => {
    if (!overviewData?.actions) return null;
    
    const { primary } = overviewData.actions;
    
    return (
      <View style={styles.actionButtonsContainer}>
        {/* Primary Actions */}
        <View style={styles.primaryActions}>
          {primary.map((action, index) => {
            if (!action.enabled) return null;
            
            let buttonStyle = styles.actionButton;
            let onPress = () => {};
            
            switch (action.type) {
              case 'book_now':
                buttonStyle = [styles.actionButton, styles.bookButton];
                onPress = () => handleBookNow();
                break;
              case 'chat':
                buttonStyle = [styles.actionButton, styles.chatButton];
                onPress = handleChat;
                break;
              case 'call':
                buttonStyle = [styles.actionButton, styles.callButton];
                onPress = handleCall;
                break;
              default:
                return null;
            }
            
            return (
              <TouchableOpacity 
                key={index}
                style={buttonStyle}
                onPress={onPress}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={
                    action.type === 'book_now' ? 'calendar' :
                    action.type === 'chat' ? 'chatbubble' :
                    'call'
                  } 
                  size={20} 
                  color={Colors.text} 
                />
                <Text style={styles.actionButtonText}>{action.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderTabs = () => {
    if (!overviewData?.tabs) return null;
    
    return (
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {['services', 'products', 'reviews', 'info'].map((tab) => {
            const count = overviewData?.tabs?.[tab]?.count || 0;
            
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
                {count > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'services':
        return (
          <ServicesTab 
            servicesData={servicesData}
            handleBookNow={handleBookNow}
            overviewData={overviewData}
          />
        );
      case 'products':
        return (
          <ProductsTab 
            productsData={productsData}
            addToCart={addToCart}
            cart={cart}
            overviewData={overviewData}
          />
        );
      case 'reviews':
        return (
          <ReviewsTab 
            reviewsData={reviewsData}
            overviewData={overviewData}
            renderStars={renderStars}
            formatTimeAgo={formatTimeAgo}
          />
        );
      case 'info':
        return (
          <InfoTab 
            infoData={infoData}
            overviewData={overviewData}
            handleGetDirections={handleGetDirections}
            handleCall={handleCall}
            handleChat={handleChat}
          />
        );
      default:
        return (
          <ServicesTab 
            servicesData={servicesData}
            handleBookNow={handleBookNow}
            overviewData={overviewData}
          />
        );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading provider information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (sessionExpired) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="log-out" size={64} color={Colors.danger} />
          <Text style={styles.errorText}>Session Expired</Text>
          <Text style={styles.errorSubtext}>Please login again to continue</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => {
              logout();
              navigation.replace('Login');
            }}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !sessionExpired) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOverview}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!overviewData) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Animated.ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {renderHeader()}
        {renderActionButtons()}
        {renderTabs()}
        {renderTabContent()}
        
        <View style={styles.footerSpace} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  
  // Header styles (same as before)...
  coverImageContainer: {
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 250,
  },
  topRightIcons: {
    position: 'absolute',
    top: 50,
    right: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  profileInfo: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
    marginTop: -60,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.card,
    borderWidth: 3,
    borderColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  profileImage: {
    width: 94,
    height: 94,
    borderRadius: BorderRadius.xl - 3,
  },
  businessName: {
    ...Typography.h1,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  ratingText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  locationText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  
  // Action Buttons
  actionButtonsContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  bookButton: {
    backgroundColor: Colors.primary,
  },
  chatButton: {
    backgroundColor: '#25D366',
  },
  callButton: {
    backgroundColor: Colors.success,
  },
  actionButtonText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Tabs
  tabsContainer: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tabsScrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.text,
  },
  tabBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '700',
  },
  
  // Footer
  footerSpace: {
    height: Spacing.xxxl,
  },
  
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    marginTop: Spacing.md,
    ...Typography.h3,
    color: Colors.danger,
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  loginButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
});

export default ProviderProfile;