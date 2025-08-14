import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const LocalServices = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  // Pinned category name
  const pinnedCategoryName = 'Motorbike Services';

  // Storage keys
  const STORAGE_KEYS = {
    CATEGORIES: 'local_services_categories',
    LAST_UPDATE: 'local_services_last_update',
    CATEGORY_METADATA: 'local_services_metadata',
  };

  // Dynamic icon generator based on category name
  const generateCategoryIcon = (categoryName) => {
    const iconMap = {
      // Transport related
      'motorbike': '🏍️', 'bike': '🚲', 'car': '🚗', 'transport': '🚗', 'tuktuk': '🛺', 'taxi': '🚕',
      
      // Food & Delivery
      'food': '🍽️', 'cake': '🎂', 'bakery': '🍰', 'delivery': '🚚', 'gas': '🛢️', 'posho': '🌾', 'mill': '🌾',
      
      // Beauty & Personal Care
      'salon': '💇‍♀️', 'saloon': '💇‍♀️', 'barber': '✂️', 'kinyozi': '✂️', 'beauty': '💄', 'spa': '🧖‍♀️',
      
      // Cleaning & Laundry
      'laundry': '🧺', 'cleaning': '🧹', 'mama': '👕', 'fua': '👕', 'wash': '🧺',
      
      // Technical Services
      'repair': '🔧', 'electronic': '🔧', 'plumb': '🔧', 'electric': '⚡', 'carpenter': '🔨', 'capentry': '🔨',
      
      // Photography & Events
      'photo': '📸', 'camera': '📸', 'event': '🎉', 'media': '📸',
      
      // Default fallbacks
      'service': '🔧', 'shop': '🏪', 'store': '🏪',
    };

    const name = categoryName.toLowerCase();
    
    // Try to find a matching keyword in the category name
    for (const [keyword, icon] of Object.entries(iconMap)) {
      if (name.includes(keyword)) {
        return icon;
      }
    }
    
    // If no match found, return a default icon
    return '🔧';
  };

  // Dynamic color generator
  const generateCategoryColor = (categoryName) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF7675', 
      '#FDCB6E', '#E17055', '#A29BFE', '#6C5CE7', '#FD79A8'
    ];
    
    // Generate consistent color based on category name hash
    let hash = 0;
    for (let i = 0; i < categoryName.length; i++) {
      const char = categoryName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    initializeData();
    // Entrance animation
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [searchQuery, categories]);

  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load cached data first
      const cachedData = await loadCachedData();
      
      if (cachedData && cachedData.categories.length > 0) {
        setCategories(cachedData.categories);
        setIsOffline(false);
        
        // Check if data is stale (older than 1 hour)
        const isStale = cachedData.isStale;
        if (!isStale) {
          setLoading(false);
          return;
        }
      }
      
      // Fetch fresh data from API
      await fetchFreshData();
      
    } catch (error) {
      console.error('Error initializing data:', error);
      
      // If we have cached data, use it
      const cachedData = await loadCachedData();
      if (cachedData && cachedData.categories.length > 0) {
        setCategories(cachedData.categories);
        setIsOffline(true);
        setError('Using offline data - some information may be outdated');
      } else {
        setError('Failed to load services. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCachedData = async () => {
    try {
      const [categoriesJson, lastUpdateJson, metadataJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATE),
        AsyncStorage.getItem(STORAGE_KEYS.CATEGORY_METADATA),
      ]);

      if (!categoriesJson) return null;

      const categories = JSON.parse(categoriesJson);
      const lastUpdate = lastUpdateJson ? parseInt(lastUpdateJson) : 0;
      const metadata = metadataJson ? JSON.parse(metadataJson) : {};
      
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      const isStale = (now - lastUpdate) > oneHour;

      return {
        categories: categories.map(cat => ({
          ...cat,
          dynamicIcon: generateCategoryIcon(cat.name),
          dynamicColor: generateCategoryColor(cat.name),
          ...metadata[cat._id] // Merge any stored metadata
        })),
        isStale,
        lastUpdate
      };
    } catch (error) {
      console.error('Error loading cached data:', error);
      return null;
    }
  };

  const fetchFreshData = async () => {
    try {
      const response = await axios.get('api/services/categories', {
        timeout: 10000, // 10 second timeout
      });
      
      const freshCategories = response.data.map(category => ({
        ...category,
        dynamicIcon: generateCategoryIcon(category.name),
        dynamicColor: generateCategoryColor(category.name),
      }));
      
      setCategories(freshCategories);
      setIsOffline(false);
      
      // Cache the fresh data
      await cacheData(freshCategories);
      
    } catch (error) {
      console.error('Error fetching fresh data:', error);
      throw error;
    }
  };

  const cacheData = async (categoriesToCache) => {
    try {
      const now = Date.now();
      
      // Separate dynamic properties for separate storage
      const categoriesForStorage = categoriesToCache.map(cat => {
        const { dynamicIcon, dynamicColor, ...rest } = cat;
        return rest;
      });
      
      const metadataForStorage = {};
      categoriesToCache.forEach(cat => {
        metadataForStorage[cat._id] = {
          dynamicIcon: cat.dynamicIcon,
          dynamicColor: cat.dynamicColor,
          cachedAt: now
        };
      });

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categoriesForStorage)),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATE, now.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.CATEGORY_METADATA, JSON.stringify(metadataForStorage)),
      ]);
      
      console.log('Data cached successfully');
    } catch (error) {
      console.error('Error caching data:', error);
    }
  };

  const refreshData = async () => {
    try {
      setError(null);
      await fetchFreshData();
      Alert.alert('Success', 'Services updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh services. Using cached data.');
    }
  };

  const clearCache = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.CATEGORIES),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_UPDATE),
        AsyncStorage.removeItem(STORAGE_KEYS.CATEGORY_METADATA),
      ]);
      Alert.alert('Cache Cleared', 'Please restart the app to reload data.');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear cache.');
    }
  };

  const filterCategories = () => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCategories(filtered);
    }
  };

  const handleCategoryPress = (category) => {
    // Cache the category access for analytics/prioritization
    cacheInteraction(category._id);
    
    navigation.navigate('CategoryProviders', {
      categoryId: category._id,
      categoryName: category.name,
    });
  };

  const cacheInteraction = async (categoryId) => {
    try {
      const key = `category_interaction_${categoryId}`;
      const currentCount = await AsyncStorage.getItem(key);
      const newCount = currentCount ? parseInt(currentCount) + 1 : 1;
      await AsyncStorage.setItem(key, newCount.toString());
    } catch (error) {
      console.error('Error caching interaction:', error);
    }
  };

  const getPinnedCategory = () => {
    return categories.find(cat => cat.name === pinnedCategoryName);
  };

  const getRegularCategories = () => {
    return filteredCategories.filter(cat => cat.name !== pinnedCategoryName);
  };

  const renderOfflineIndicator = () => {
    if (!isOffline) return null;
    
    return (
      <View style={styles.offlineIndicator}>
        <Text style={styles.offlineText}>📴 Offline Mode</Text>
        <TouchableOpacity onPress={refreshData}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPinnedCategory = () => {
    const pinnedCategory = getPinnedCategory();
    if (!pinnedCategory || searchQuery !== '') return null;

    return (
      <View style={styles.pinnedContainer}>
        <View style={styles.pinnedHeader}>
          <Text style={styles.pinnedTitle}>📌 Quick Access</Text>
        </View>
        <TouchableOpacity
          style={[styles.pinnedCard, { backgroundColor: pinnedCategory.dynamicColor }]}
          onPress={() => handleCategoryPress(pinnedCategory)}
          activeOpacity={0.8}
        >
          <View style={styles.pinnedCardContent}>
            <Text style={styles.pinnedCategoryIcon}>
              {pinnedCategory.dynamicIcon}
            </Text>
            <View style={styles.pinnedTextContainer}>
              <Text style={styles.pinnedCategoryName}>{pinnedCategory.name}</Text>
              <Text style={styles.pinnedCategoryDescription}>
                {pinnedCategory.description || 'Available 24/7'}
              </Text>
            </View>
            <View style={styles.pinnedArrow}>
              <Text style={styles.pinnedArrowText}>→</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCategoryItem = ({ item, index }) => {
    const translateY = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => handleCategoryPress(item)}
          activeOpacity={0.9}
        >
          <View style={styles.categoryCardInner}>
            <View 
              style={[
                styles.categoryIconWrapper, 
                { backgroundColor: item.dynamicColor + '20' }
              ]}
            >
              <Text style={styles.categoryIcon}>
                {item.dynamicIcon}
              </Text>
            </View>
            
            <View style={styles.categoryDetails}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryDescription} numberOfLines={2}>
                {item.description || 'Professional services available'}
              </Text>
              
              <View style={styles.categoryMeta}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: '#00C851' }]} />
                  <Text style={styles.statusText}>Available</Text>
                </View>
                <Text style={styles.categoryArrow}>›</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C5CE7" />
          <Text style={styles.loadingText}>Loading services...</Text>
          <Text style={styles.loadingSubtext}>Checking for updates</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && categories.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>😔</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearCacheButton} onPress={clearCache}>
            <Text style={styles.clearCacheText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Local Services</Text>
        <Text style={styles.headerSubtitle}>Find services around campus</Text>
      </View>

      {/* Offline Indicator */}
      {renderOfflineIndicator()}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor="#A0A0A0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Pinned Category */}
        {renderPinnedCategory()}

        {/* Regular Categories */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? 
                `Results (${filteredCategories.length})` : 
                'All Services'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity onPress={refreshData} style={styles.refreshButton}>
                <Text style={styles.refreshButtonText}>↻</Text>
              </TouchableOpacity>
            )}
          </View>

          {getRegularCategories().length === 0 && searchQuery ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No services found</Text>
              <Text style={styles.emptyDescription}>
                Try adjusting your search terms
              </Text>
            </View>
          ) : (
            <FlatList
              data={getRegularCategories()}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Offline Indicator
  offlineIndicator: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  offlineText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '600',
  },

  // Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  clearButton: {
    padding: 5,
  },
  clearText: {
    fontSize: 16,
    color: '#6B7280',
  },

  scrollView: {
    flex: 1,
  },

  // Pinned Category Styles
  pinnedContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  pinnedHeader: {
    marginBottom: 15,
  },
  pinnedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  pinnedCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  pinnedCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  pinnedCategoryIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  pinnedTextContainer: {
    flex: 1,
  },
  pinnedCategoryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pinnedCategoryDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  pinnedArrow: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinnedArrowText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Categories Section
  categoriesSection: {
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  refreshButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },

  // Category Card Styles
  animatedContainer: {
    marginBottom: 15,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  categoryCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  categoryIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  categoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00C851',
  },
  categoryArrow: {
    fontSize: 24,
    color: '#D1D5DB',
    fontWeight: '300',
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearCacheButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  clearCacheText: {
    color: '#6B7280',
    fontSize: 14,
    textDecorationLine: 'underline',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },

  listContent: {
    paddingTop: 5,
  },
});

export default LocalServices;