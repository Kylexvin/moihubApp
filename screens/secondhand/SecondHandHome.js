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
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../utils/api'; 
const { width } = Dimensions.get('window');
const cardWidth = (width - 45) / 2; 






const SecondHandHome = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('sellers');
  const [wantedPosts, setWantedPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [token, setToken] = useState('');
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
  const buildQueryParams = useCallback((page = 1) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10'
    });

    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (filters.category) params.append('category', filters.category);
    if (filters.location) params.append('location', filters.location);

    // For wanted posts
    if (activeTab === 'buyers') {
      if (filters.urgency) params.append('urgency', filters.urgency);
      if (filters.minBudget) params.append('minBudget', filters.minBudget);
      if (filters.maxBudget) params.append('maxBudget', filters.maxBudget);
    }

    // For products
    if (activeTab === 'sellers') {
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

    const queryParams = buildQueryParams(page);
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

    const queryParams = buildQueryParams(page);
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

const startConversation = async (user, chatType = 'normal') => {
  if (!user?._id) {
    Alert.alert('Error', 'Invalid user details');
    return;
  }

  try {
    const { data } = await api.post('/api/messages/conversations', {

      participantId: user._id,
      chatType
    });

    navigation.navigate('MessageStackNavigator', {
      screen: 'ChatScreen',
      params: {
        conversationId: data._id,
        conversation: data,
        otherUser: user,
        chatType: data.chatType || chatType
      }
    });

  } catch (err) {
    if (err.response?.status === 401) {
      handleAuthError();
    } else {
      console.error('Conversation error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to start conversation');
    }
  }
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
    case 'urgent': return '#EF4444';
    case 'high': return '#F97316';
    case 'medium': return '#EAB308';
    case 'low': return '#22C55E';
    default: return '#6B7280';
  }
};

// Handle chat start utility
const handleStartChat = (user) => {
  if (!user?._id) {
    Alert.alert('Error', 'User information is missing');
    return;
  }
  startConversation(user);
};

// Expandable Description Component
const ExpandableDescription = ({ description, itemId, maxLines = 2 }) => {
  const isExpanded = expandedDescriptions[itemId] || false;
  const [showButton, setShowButton] = useState(false);
  const [numberOfLines, setNumberOfLines] = useState(0);

  const toggleExpanded = () => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const onTextLayout = (event) => {
    const { lines } = event.nativeEvent;
    setNumberOfLines(lines);
    
    // Show "Show More" button if text exceeds maxLines
    setShowButton(lines > maxLines);
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
  const { image, name, price, category, condition, location, createdAt, sellerId } = item;

  return (
    <View style={styles.productCard}>
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
            <Text style={styles.placeholderText}>📷</Text>
            <Text style={styles.placeholderSubtext}>No Image</Text>
          </View>
        )}
        
        {/* Price Badge Overlay */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>
            Ksh {price?.toLocaleString()}
          </Text>
        </View>
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
            style={styles.chatButton}
            onPress={() => handleStartChat(sellerId)}
          >
            <Text style={styles.chatButtonText}>💬</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Wanted Card Render Function (Full Width)
const renderWanted = ({ item }) => {
  return (
    <View style={styles.wantedCard}>
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
          style={styles.wantedChatButton}
          onPress={() => handleStartChat(item.buyerId)}
        >
          <Text style={styles.wantedChatButtonText}>💬 Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

  // Render filters
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
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
          <TextInput
            placeholder="Min" placeholderTextColor="#888"
            value={activeTab === 'buyers' ? filters.minBudget : filters.minPrice}
            onChangeText={(text) => setFilters(prev => ({ 
              ...prev, 
              [activeTab === 'buyers' ? 'minBudget' : 'minPrice']: text 
            }))}
            style={styles.priceInput}
            keyboardType="numeric"
          />
          <Text style={styles.priceSeparator}>to</Text>
          <TextInput
            placeholder="Max" placeholderTextColor="#888"
            value={activeTab === 'buyers' ? filters.maxBudget : filters.maxPrice}
            onChangeText={(text) => setFilters(prev => ({ 
              ...prev, 
              [activeTab === 'buyers' ? 'maxBudget' : 'maxPrice']: text 
            }))}
            style={styles.priceInput}
            keyboardType="numeric"
          />
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
        <TextInput
          placeholder="Enter location"
          value={filters.location}
          onChangeText={(text) => setFilters(prev => ({ ...prev, location: text }))}
          style={styles.locationInput}
        />

        {/* Clear Filters */}
        <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear All Filters</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
     
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SecondHandStack', { screen: 'MarketplaceDashboard' })}
          style={styles.dashboardButton}
        >
          <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search products..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
        >
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
            Wanted
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && renderFilters()}

      {/* Content */}
      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
  data={activeTab === 'sellers' ? products : wantedPosts}
  keyExtractor={(item) => item._id}
  renderItem={activeTab === 'sellers' ? renderProduct : renderWanted}
  numColumns={2}   // <-- Important!
  columnWrapperStyle={{ justifyContent: 'space-between' }}  // Optional but recommended
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={['#3B82F6']}
    />
  }
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  contentContainerStyle={styles.listContainer}
  showsVerticalScrollIndicator={false}
  ListEmptyComponent={
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        {activeTab === 'sellers' ? 'No products found' : 'No requests found'}
      </Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search or filters
      </Text>
    </View>
  }
/>

        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  
  dashboardButton: {
    backgroundColor: '#216450ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  
  dashboardButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Search Container Styles
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 12,
  },
  
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#216450ff',
    fontWeight: '400',
  },
  
  filterButton: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  
  filterButtonActive: {
    backgroundColor: '#216450ff',
  },
  
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  
  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  
  tabActive: {
    backgroundColor: '#216450ff',
  },
  
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Filters Panel Styles
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    maxHeight: 300,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    marginTop: 16,
  },
  
  filterRow: {
    marginBottom: 8,
  },
  
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  
  filterChipActive: {
    backgroundColor: '#216450ff',
    borderColor: '#216450ff',
  },
  
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  priceInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  
  priceSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '##216450ff',
    fontWeight: '500',
  },
  
  locationInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#216450ff',
    marginBottom: 8,
  },
  
  clearButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Content Styles
  content: {
    flex: 1,
  },
  
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Product Card Styles (2-Column Grid)
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    width: cardWidth,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },

  imageContainer: {
    position: 'relative',
    height: 160,
    backgroundColor: '#F8F9FA',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderText: {
    fontSize: 32,
    color: '#ADB5BD',
    marginBottom: 4,
  },

  placeholderSubtext: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },

  priceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  priceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  productInfo: {
    padding: 12,
  },

  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 6,
    lineHeight: 18,
  },

  sellerUsername: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
    marginBottom: 6,
  },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  category: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
    flex: 1,
  },

  conditionBadge: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },

  conditionText: {
    fontSize: 10,
    color: '#495057',
    fontWeight: '600',
  },

  location: {
    fontSize: 11,
    color: '#28A745',
    marginBottom: 8,
    fontWeight: '500',
  },

  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },

  timeAgo: {
    fontSize: 10,
    color: '#ADB5BD',
    flex: 1,
  },

  chatButton: {
    backgroundColor: '#216450ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 36,
    alignItems: 'center',
  },

  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Wanted Card Styles (Full Width)
  wantedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },

  wantedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  wantedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },

  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  buyerInfo: {
    marginBottom: 12,
  },

  buyerUsername: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: '600',
    marginBottom: 4,
  },

  budget: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
    marginBottom: 8,
  },

  wantedCategory: {
    fontSize: 13,
    color: '#6C757D',
    fontWeight: '500',
    marginBottom: 8,
  },

  wantedLocation: {
    fontSize: 12,
    color: '#28A745',
    fontWeight: '500',
    marginBottom: 12,
  },

  // Description Styles
  descriptionContainer: {
    marginBottom: 12,
  },

  description: {
    fontSize: 13,
    color: '#495057',
    lineHeight: 18,
  },

  showMoreButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },

  showMoreText: {
    fontSize: 12,
    color: '#007BFF',
    fontWeight: '600',
  },

  wantedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },

  wantedTimeAgo: {
    fontSize: 11,
    color: '#ADB5BD',
    flex: 1,
  },

  wantedChatButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  wantedChatButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
    fontWeight: '500',
  },
  
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Responsive adjustments for smaller screens
  '@media (max-width: 375)': {
    productName: {
      fontSize: 13,
    },
    wantedTitle: {
      fontSize: 15,
    },
    budget: {
      fontSize: 13,
    },
  },
});
export default SecondHandHome;
