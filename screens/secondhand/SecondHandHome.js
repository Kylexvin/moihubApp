import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  RefreshControl,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

const { width } = Dimensions.get('window');
const cardWidth = (width - 45) / 2;

// Dark Warm Amber Theme (matching MarketplaceDashboard)
const MarketplaceColors = {
  primary: '#03604d',      
  primaryDark: '#0e582a',   // Dark Amber
  primaryLight: '#0b7a0b',  // Light Amber
  secondary: '#10B981',     // Teal (for success/balance)
  accent: '#8B5CF6',        // Purple (for highlights)
  background: '#0F0F0F',    // Near Black
  surface: '#1A1A1A',       // Dark Surface
  card: '#242424',          // Card Background
  text: '#FFFFFF',          // White
  textSecondary: '#9CA3AF', // Gray
  textMuted: '#6B7280',     // Dark Gray
  border: '#2D2D2D',        // Border
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  whatsapp: '#25D366',
};

const SecondHandHome = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('sellers');
  const [wantedPosts, setWantedPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    urgency: '',
    condition: '',
    minBudget: '',
    maxBudget: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Categories and options
  const categories = ['Electronics', 'Furniture', 'Clothing', 'Books', 'Sports', 'Tools', 'Home & Garden', 'Automotive', 'Other'];
  const urgencyLevels = ['low', 'medium', 'high', 'urgent'];
  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

  const handleAuthError = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      navigation.replace('Login');
    } catch (error) {
      console.error('Auth error handling failed:', error);
    }
  };

  // Build query parameters
  const buildQueryParams = useCallback((page = 1, tab = activeTab) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10'
    });

    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (filters.category) params.append('category', filters.category);
    if (filters.location) params.append('location', filters.location);

    // For wanted posts
    if (tab === 'buyers') {
      if (filters.urgency) params.append('urgency', filters.urgency);
      if (filters.minBudget) params.append('minBudget', filters.minBudget);
      if (filters.maxBudget) params.append('maxBudget', filters.maxBudget);
    }

    // For products
    if (tab === 'sellers') {
      if (filters.condition) params.append('condition', filters.condition);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    }

    return params.toString();
  }, [searchQuery, filters, activeTab]);

  // Fetch wanted posts
  const fetchWantedPosts = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);

      const queryParams = buildQueryParams(page, 'buyers');
      const { data } = await api.get(`/api/wanted/active?${queryParams}`);

      const newPosts = data.wantedPosts || [];

      setWantedPosts(prev => append ? [...prev, ...newPosts] : newPosts);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
      setHasMore(data.hasMore || false);

    } catch (err) {
      console.error('Wanted fetch error:', err);
      Alert.alert('Error', 'Failed to fetch wanted posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildQueryParams]);

  // Fetch products
  const fetchProducts = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);

      const queryParams = buildQueryParams(page, 'sellers');
      const { data } = await api.get(`/api/marketplace/approved?${queryParams}`);

      const newProducts = data.products || [];

      setProducts(prev => append ? [...prev, ...newProducts] : newProducts);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
      setHasMore(data.hasMore || false);

    } catch (err) {
      console.error('Products fetch error:', err);
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildQueryParams]);

  // WhatsApp Integration Functions
  const openWhatsApp = async (phoneNumber, message = '') => {
    if (!phoneNumber) {
      Alert.alert('Error', 'WhatsApp number not available');
      return;
    }

    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const whatsappNumber = cleanNumber.startsWith('0') ? `254${cleanNumber.substring(1)}` : cleanNumber;
    
    const defaultMessage = activeTab === 'sellers' 
      ? `Hello! I saw your product on Marketplace and I'm interested.`
      : `Hello! I saw your wanted post on Marketplace and I might have what you're looking for.`;
    
    const finalMessage = message || defaultMessage;
    const encodedMessage = encodeURIComponent(finalMessage);
    const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodedMessage}`;
    
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        const webUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert('Error', 'Could not open WhatsApp. Please make sure it is installed.');
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Get urgency color utility
  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'urgent': return MarketplaceColors.error;
      case 'high': return MarketplaceColors.warning;
      case 'medium': return MarketplaceColors.accent;
      case 'low': return MarketplaceColors.success;
      default: return MarketplaceColors.textSecondary;
    }
  };

  // Expandable Description Component
  const ExpandableDescription = ({ description, itemId, maxLines = 2 }) => {
    const isExpanded = expandedDescriptions[itemId] || false;
    const [showButton, setShowButton] = useState(false);

    const toggleExpanded = () => {
      setExpandedDescriptions(prev => ({
        ...prev,
        [itemId]: !prev[itemId]
      }));
    };

    const onTextLayout = (event) => {
      const { lines } = event.nativeEvent;
      setShowButton(lines.length > maxLines);
    };

    if (!description || description.trim() === '') {
      return null;
    }

    return (
      <View style={styles.descriptionContainer}>
        <Text 
          style={styles.description}
          numberOfLines={isExpanded ? undefined : maxLines}
          onTextLayout={onTextLayout}
        >
          {description}
        </Text>
        
        {showButton && (
          <TouchableOpacity 
            onPress={toggleExpanded}
            style={styles.showMoreButton}
          >
            <Text style={styles.showMoreText}>
              {isExpanded ? 'Show Less' : 'Show More'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Product Card Render Function (2-Column Grid)
  const renderProduct = ({ item }) => {
    const { image, name, price, category, condition, location, createdAt, sellerId, sellerWhatsApp } = item;

    return (
      <TouchableOpacity 
        style={styles.productCard}
        activeOpacity={0.9}
      >
        {/* Image Container with Price Badge */}
        <View style={styles.imageContainer}>
          {image ? (
            <Image 
              source={{ uri: image }} 
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={32} color={MarketplaceColors.textMuted} />
              <Text style={styles.placeholderSubtext}>No Image</Text>
            </View>
          )}
          
          {/* Price Badge Overlay */}
          <LinearGradient
            colors={[MarketplaceColors.primary, MarketplaceColors.primaryDark]}
            style={styles.priceBadge}
          >
            <Text style={styles.priceText}>
              Ksh {price?.toLocaleString()}
            </Text>
          </LinearGradient>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {name}
          </Text>

          {/* Seller Username */}
          {sellerId?.username && (
            <Text style={styles.sellerUsername}>
              @{sellerId.username}
            </Text>
          )}

          {/* Category and Condition Row */}
          <View style={styles.categoryRow}>
            <Text style={styles.category} numberOfLines={1}>
              {category}
            </Text>
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>
                {condition}
              </Text>
            </View>
          </View>

          {/* Location */}
          {location ? (
            <Text style={styles.location} numberOfLines={1}>
              📍 {location}
            </Text>
          ) : null}

          {/* Footer */}
          <View style={styles.productFooter}>
            <Text style={styles.timeAgo}>
              {formatTimeAgo(createdAt)}
            </Text>

            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={() => openWhatsApp(sellerWhatsApp || sellerId?.phone)}
            >
              <Ionicons name="logo-whatsapp" size={12} color="#FFFFFF" />
              <Text style={styles.whatsappButtonText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Wanted Card Render Function (Full Width)
  const renderWanted = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.wantedCard}
        activeOpacity={0.9}
      >
        {/* Header with Title and Urgency Badge */}
        <View style={styles.wantedHeader}>
          <Text style={styles.wantedTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.urgency && (
            <View style={[
              styles.urgencyBadge, 
              { backgroundColor: getUrgencyColor(item.urgency) + '20' }
            ]}>
              <Text style={[
                styles.urgencyText, 
                { color: getUrgencyColor(item.urgency) }
              ]}>
                {item.urgency.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Buyer Info Section */}
        <View style={styles.buyerInfo}>
          {item.buyerId?.username && (
            <Text style={styles.buyerUsername}>
              👤 @{item.buyerId.username}
            </Text>
          )}
          
          <Text style={styles.budget}>
            💰 Budget: Ksh {item.maxBudget?.toLocaleString()}
          </Text>
        </View>

        {/* Category with Icon */}
        <Text style={styles.wantedCategory}>
          📂 {item.category} • {item.preferredCondition}
        </Text>

        {/* Location */}
        {item.location && (
          <Text style={styles.wantedLocation}>
            📍 {item.location}
          </Text>
        )}

        {/* Expandable Description */}
        <ExpandableDescription 
          description={item.description} 
          itemId={item._id}
          maxLines={2}
        />

        {/* Footer with Divider */}
        <View style={styles.wantedFooter}>
          <Text style={styles.wantedTimeAgo}>
            {formatTimeAgo(item.createdAt)}
          </Text>
          
          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={() => openWhatsApp(item.buyerId?.phone)}
          >
            <Ionicons name="logo-whatsapp" size={12} color="#FFFFFF" />
            <Text style={styles.whatsappButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render filters
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <LinearGradient
        colors={[MarketplaceColors.primary + '10', 'transparent']}
        style={styles.filtersGradient}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Category Filter */}
        <Text style={styles.filterLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setFilters(prev => ({ ...prev, category: '' }))}
            style={[styles.filterChip, !filters.category && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, !filters.category && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setFilters(prev => ({ ...prev, category: cat }))}
              style={[styles.filterChip, filters.category === cat && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filters.category === cat && styles.filterChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Budget/Price Range */}
        <Text style={styles.filterLabel}>
          {activeTab === 'buyers' ? 'Budget Range' : 'Price Range'}
        </Text>
        <View style={styles.priceRow}>
          <View style={styles.priceInputContainer}>
            <TextInput
              placeholder="Min" 
              placeholderTextColor={MarketplaceColors.textMuted}
              value={activeTab === 'buyers' ? filters.minBudget : filters.minPrice}
              onChangeText={(text) => setFilters(prev => ({ 
                ...prev, 
                [activeTab === 'buyers' ? 'minBudget' : 'minPrice']: text 
              }))}
              style={styles.priceInput}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.priceSeparator}>to</Text>
          <View style={styles.priceInputContainer}>
            <TextInput
              placeholder="Max" 
              placeholderTextColor={MarketplaceColors.textMuted}
              value={activeTab === 'buyers' ? filters.maxBudget : filters.maxPrice}
              onChangeText={(text) => setFilters(prev => ({ 
                ...prev, 
                [activeTab === 'buyers' ? 'maxBudget' : 'maxPrice']: text 
              }))}
              style={styles.priceInput}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Urgency Filter (for buyers) */}
        {activeTab === 'buyers' && (
          <>
            <Text style={styles.filterLabel}>Urgency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              <TouchableOpacity
                onPress={() => setFilters(prev => ({ ...prev, urgency: '' }))}
                style={[styles.filterChip, !filters.urgency && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, !filters.urgency && styles.filterChipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {urgencyLevels.map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setFilters(prev => ({ ...prev, urgency: level }))}
                  style={[styles.filterChip, filters.urgency === level && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, filters.urgency === level && styles.filterChipTextActive]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Condition Filter (for sellers) */}
        {activeTab === 'sellers' && (
          <>
            <Text style={styles.filterLabel}>Condition</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              <TouchableOpacity
                onPress={() => setFilters(prev => ({ ...prev, condition: '' }))}
                style={[styles.filterChip, !filters.condition && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, !filters.condition && styles.filterChipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {conditions.map((condition) => (
                <TouchableOpacity
                  key={condition}
                  onPress={() => setFilters(prev => ({ ...prev, condition }))}
                  style={[styles.filterChip, filters.condition === condition && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, filters.condition === condition && styles.filterChipTextActive]}>
                    {condition}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Location Filter */}
        <Text style={styles.filterLabel}>Location</Text>
        <View style={styles.locationInputContainer}>
          <Ionicons name="location-outline" size={16} color={MarketplaceColors.primary} />
          <TextInput
            placeholder="Enter location"
            placeholderTextColor={MarketplaceColors.textMuted}
            value={filters.location}
            onChangeText={(text) => setFilters(prev => ({ ...prev, location: text }))}
            style={styles.locationInput}
          />
        </View>

        {/* Clear Filters */}
        <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
          <Ionicons name="close-circle" size={16} color={MarketplaceColors.text} />
          <Text style={styles.clearButtonText}>Clear All Filters</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // Load data when tab changes or search/filters change
  useEffect(() => {
    setCurrentPage(1);
    if (activeTab === 'sellers') {
      fetchProducts(1, false);
    } else {
      fetchWantedPosts(1, false);
    }
  }, [activeTab, searchQuery, filters]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      urgency: '',
      condition: '',
      minBudget: '',
      maxBudget: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearchQuery('');
  };

  // Load more items
  const loadMore = useCallback(() => {
    if (hasMore && !loading && currentPage < totalPages) {
      const nextPage = currentPage + 1;
      if (activeTab === 'sellers') {
        fetchProducts(nextPage, true);
      } else {
        fetchWantedPosts(nextPage, true);
      }
    }
  }, [hasMore, loading, currentPage, totalPages, activeTab, fetchProducts, fetchWantedPosts]);

  // Refresh data
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    if (activeTab === 'sellers') {
      fetchProducts(1, false);
    } else {
      fetchWantedPosts(1, false);
    }
  }, [activeTab, fetchProducts, fetchWantedPosts]);

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="basket-outline" size={64} color={MarketplaceColors.textMuted} />
      <Text style={styles.emptyTitle}>
        {activeTab === 'sellers' ? 'No products found' : 'No requests found'}
      </Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search or filters
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[MarketplaceColors.primary, MarketplaceColors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerGreeting}>Welcome back!</Text>
            <Text style={styles.headerTitle}>Marketplace</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('SecondHandStack', { screen: 'MarketplaceDashboard' })}
            style={styles.createButton}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.createButtonGradient}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Your Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={MarketplaceColors.primary} />
          <TextInput
            placeholder="Search products..."
            placeholderTextColor={MarketplaceColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={MarketplaceColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
        >
          <Ionicons 
            name="options-outline" 
            size={18} 
            color={showFilters ? MarketplaceColors.background : MarketplaceColors.primary} 
          />
          <Text style={[styles.filterButtonText, showFilters && styles.filterButtonTextActive]}>
            Filter
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('sellers')}
          style={[styles.tab, activeTab === 'sellers' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'sellers' && styles.tabTextActive]}>
            For Sale
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('buyers')}
          style={[styles.tab, activeTab === 'buyers' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'buyers' && styles.tabTextActive]}>
            On Demand
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && renderFilters()}

      {/* Content */}
      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={MarketplaceColors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : activeTab === 'sellers' ? (
          <FlatList
            key="sellers-list"
            data={products}
            keyExtractor={(item) => item._id}
            renderItem={renderProduct}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[MarketplaceColors.primary]}
                tintColor={MarketplaceColors.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        ) : (
          <FlatList
            key="buyers-list"
            data={wantedPosts}
            keyExtractor={(item) => item._id}
            renderItem={renderWanted}
            numColumns={1}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[MarketplaceColors.primary]}
                tintColor={MarketplaceColors.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketplaceColors.background,
  },

  // Header Styles
  header: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Search Container Styles
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MarketplaceColors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: MarketplaceColors.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MarketplaceColors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: MarketplaceColors.primary,
    borderColor: MarketplaceColors.primary,
  },
  filterButtonText: {
    color: MarketplaceColors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: MarketplaceColors.background,
  },

  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: MarketplaceColors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: MarketplaceColors.primary,
  },
  tabText: {
    fontSize: 15,
    color: MarketplaceColors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: MarketplaceColors.background,
    fontWeight: 'bold',
  },

  // Filters Panel Styles
  filtersContainer: {
    backgroundColor: MarketplaceColors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
    maxHeight: 400,
    position: 'relative',
    overflow: 'hidden',
  },
  filtersGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: MarketplaceColors.primary,
    marginBottom: 8,
    marginTop: 12,
  },
  filterRow: {
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: MarketplaceColors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
  },
  filterChipActive: {
    backgroundColor: MarketplaceColors.primary,
    borderColor: MarketplaceColors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: MarketplaceColors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: MarketplaceColors.background,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceInputContainer: {
    flex: 1,
    backgroundColor: MarketplaceColors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
  },
  priceInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: MarketplaceColors.text,
  },
  priceSeparator: {
    marginHorizontal: 12,
    fontSize: 14,
    color: MarketplaceColors.textMuted,
    fontWeight: '500',
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MarketplaceColors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
    marginBottom: 8,
    gap: 8,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: MarketplaceColors.text,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MarketplaceColors.error,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  clearButtonText: {
    color: MarketplaceColors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  // Content Styles
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // Product Card Styles
  productCard: {
    width: cardWidth,
    backgroundColor: MarketplaceColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    backgroundColor: MarketplaceColors.surface,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderSubtext: {
    fontSize: 10,
    color: MarketplaceColors.textMuted,
    fontWeight: '500',
    marginTop: 4,
  },
  priceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    color: MarketplaceColors.background,
    fontSize: 11,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: MarketplaceColors.text,
    marginBottom: 2,
    lineHeight: 16,
  },
  sellerUsername: {
    fontSize: 10,
    color: MarketplaceColors.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  category: {
    fontSize: 10,
    color: MarketplaceColors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  conditionBadge: {
    backgroundColor: MarketplaceColors.surface,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
  },
  conditionText: {
    fontSize: 8,
    color: MarketplaceColors.textMuted,
    fontWeight: '600',
  },
  location: {
    fontSize: 9,
    color: MarketplaceColors.success,
    marginBottom: 6,
    fontWeight: '500',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timeAgo: {
    fontSize: 9,
    color: MarketplaceColors.textMuted,
    flex: 1,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MarketplaceColors.whatsapp,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },

  // Wanted Card Styles
  wantedCard: {
    backgroundColor: MarketplaceColors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
    borderLeftWidth: 4,
    borderLeftColor: MarketplaceColors.primary,
  },
  wantedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  wantedTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: MarketplaceColors.text,
    flex: 1,
    marginRight: 8,
    lineHeight: 18,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  urgencyText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  buyerInfo: {
    marginBottom: 8,
  },
  buyerUsername: {
    fontSize: 12,
    color: MarketplaceColors.success,
    fontWeight: '600',
    marginBottom: 2,
  },
  budget: {
    fontSize: 13,
    color: MarketplaceColors.primary,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  wantedCategory: {
    fontSize: 11,
    color: MarketplaceColors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  wantedLocation: {
    fontSize: 11,
    color: MarketplaceColors.success,
    fontWeight: '500',
    marginBottom: 8,
  },
  descriptionContainer: {
    marginBottom: 12,
  },
  description: {
    fontSize: 12,
    color: MarketplaceColors.text,
    lineHeight: 16,
  },
  showMoreButton: {
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  showMoreText: {
    fontSize: 11,
    color: MarketplaceColors.primary,
    fontWeight: '600',
  },
  wantedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: MarketplaceColors.border,
  },
  wantedTimeAgo: {
    fontSize: 10,
    color: MarketplaceColors.textMuted,
    flex: 1,
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: MarketplaceColors.textSecondary,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: MarketplaceColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: MarketplaceColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SecondHandHome;