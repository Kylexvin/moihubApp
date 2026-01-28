import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Animated,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from './theme/Theme';
import localServicesDB from '../services/LocalServicesDatabase'; 

const { width, height } = Dimensions.get('window');
const { Colors, Gradients, Typography, Spacing, BorderRadius, Components, Shadows } = Theme;

const LocalServices = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [showAIChatbot, setShowAIChatbot] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Pinned category names - based on your data
  const pinnedCategoryNames = ['Motorbike Services', 'Matatu services', 'Boda Boda', 'Transport'];

  // Storage keys
  const STORAGE_KEYS = {
    CATEGORIES: 'local_services_categories',
    LAST_UPDATE: 'local_services_last_update',
    CATEGORY_METADATA: 'local_services_metadata',
  };

  // Enhanced category icon mapping with fallback system - FIXED CAKE ICON
// Enhanced category icon mapping
const getCategoryIcon = (categoryName) => {
  const name = categoryName.toLowerCase();
  
  // Simple mapping based on your categories
  const iconMap = {
    // Your existing categories
    'best kinyozi': 'cut',
    'cake': 'cake',
    'capentry services': 'construct',
    'cyber café': 'desktop',
    'electronic repairs': 'build',
    'gas deliveries services': 'flame',
    'laundry services': 'shirt',
    'mama fua': 'woman',
    'matatu services': 'bus',
    'motorbike services': 'bicycle',
    'photoshoot services': 'camera',
    'saloonist': 'cut',
    'test': 'star',
    'tuktuk services': 'car',
    'poshomill': 'leaf',
    
    // Default transport icons
    'transport': 'car',
    'boda boda': 'bicycle',
    'boda': 'bicycle',
  };
  
  return iconMap[name] || 'star';
};

// Enhanced color generator
const getCategoryColor = (categoryName) => {
  const name = categoryName.toLowerCase();
  
  const colorMap = {
    // Transport - Green
    'motorbike services': Colors.primary,
    'matatu services': Colors.primaryDark || '#2D6A4F',
    'tuktuk services': Colors.primary,
    'transport': Colors.primary,
    'boda boda': Colors.primary,
    
    // Food - Coral
    'cake': Colors.secondary,
    'poshomill': Colors.secondary,
    'gas deliveries services': Colors.secondary,
    
    // Beauty - Purple
    'best kinyozi': Colors.accent,
    'saloonist': Colors.accent,
    'test': Colors.accent,
    
    // Services - Blue
    'electronic repairs': Colors.info,
    'capentry services': Colors.info,
    'cyber café': Colors.info,
    
    // Cleaning - Success Green
    'laundry services': Colors.success,
    'mama fua': Colors.success,
    
    // Media - Pink/Orange
    'photoshoot services': Colors.warning,
  };
  
  return colorMap[name] || Colors.primary; // Default to primary color
};

// Fixed initializeCategory function
const initializeCategory = (category) => {
  if (!category) return null;
  
  const categoryName = category.name || '';
  const categoryId = category._id || category.id;
  
  // Determine if pinned (based on your pinnedCategoryNames)
  const isPinned = pinnedCategoryNames.some(pinnedName => 
    categoryName.toLowerCase().includes(pinnedName.toLowerCase())
  );
  
  const icon = getCategoryIcon(categoryName);
  const color = getCategoryColor(categoryName);
  const bgColor = color + '20'; // 20 = 12% opacity
  
  return {
    _id: categoryId,
    id: categoryId, // Also include id for compatibility
    name: categoryName,
    description: category.description || '',
    allowDashboard: category.allowDashboard || false,
    allowBooking: category.allowBooking || false,
    systemOnly: category.systemOnly || false,
    createdAt: category.createdAt ? new Date(category.createdAt).getTime() : Date.now(),
    updatedAt: category.updatedAt ? new Date(category.updatedAt).getTime() : Date.now(),
    icon,
    color,
    bgColor,
    isPinned,
    
    // Add providerCount if available
    providerCount: category.providerCount || 0
  };
};
  useEffect(() => {
    initializeData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [searchQuery, categories]);

const initializeData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    console.log('🔄 Initializing services data...');
    
    // Initialize dedicated services database
    await localServicesDB.init();
    
    // Try network first
    try {
      console.log('🌐 Attempting to fetch from network...');
      const freshCategories = await fetchFreshData();
      
      if (!freshCategories || freshCategories.length === 0) {
        throw new Error('No categories received from API');
      }
      
      console.log(`📊 Setting ${freshCategories.length} categories`);
      setCategories(freshCategories);
      setIsOffline(false);
      
      // Save to SQLite (dedicated database)
      console.log('💾 Saving to SQLite database...');
      const saveSuccess = await localServicesDB.saveCategories(freshCategories);
      
      if (saveSuccess) {
        console.log('✅ Categories saved to SQLite');
      } else {
        console.warn('⚠️ Failed to save categories to SQLite');
      }
      
      // Also keep AsyncStorage as backup
      console.log('💾 Caching to AsyncStorage...');
      await cacheData(freshCategories);
      
    } catch (networkError) {
      console.log('📶 Offline mode: Loading from SQLite...', networkError.message);
      
      // Load from dedicated SQLite database
      const sqliteCategories = await localServicesDB.getCategories();
      console.log(`📊 Found ${sqliteCategories.length} categories in SQLite`);
      
      if (sqliteCategories.length > 0) {
        setCategories(sqliteCategories);
        setIsOffline(true);
        console.log('✅ Loaded categories from SQLite');
      } else {
        console.log('🔄 Falling back to AsyncStorage...');
        // Fallback to AsyncStorage
        const cachedData = await loadCachedData();
        if (cachedData?.categories?.length > 0) {
          console.log(`📊 Found ${cachedData.categories.length} categories in AsyncStorage`);
          setCategories(cachedData.categories);
          setIsOffline(true);
        } else {
          console.log('🔄 Loading default pinned categories...');
          // Show default pinned categories from SQLite
          const pinned = await localServicesDB.getPinnedCategories();
          console.log(`📊 Found ${pinned.length} default pinned categories`);
          setCategories(pinned);
          setIsOffline(true);
          setError('Using offline data. Connect for latest services.');
        }
      }
    }
  } catch (error) {
    console.error('❌ Initialize error:', error);
    setError('Failed to load services: ' + error.message);
  } finally {
    setLoading(false);
    console.log('🏁 Data initialization complete');
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
      const oneHour = 60 * 60 * 1000;
      const isStale = (now - lastUpdate) > oneHour;

      return {
        categories: categories.map(cat => ({
          ...cat,
          ...initializeCategory(cat),
          ...metadata[cat._id]
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
    console.log('🌐 Fetching fresh categories from API...');
    
    const response = await axios.get('/api/services/categories', {
      timeout: 10000,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('📥 API Response:', response.data);
    
    // Check response structure
    let categoriesArray;
    
    if (Array.isArray(response.data)) {
      categoriesArray = response.data;
    } else if (response.data && Array.isArray(response.data.categories)) {
      categoriesArray = response.data.categories;
    } else {
      throw new Error('Invalid response format from API');
    }
    
    if (!categoriesArray || categoriesArray.length === 0) {
      console.warn('⚠️ API returned empty categories array');
      return [];
    }
    
    // Initialize each category and filter out nulls
    const freshCategories = categoriesArray
      .map(category => initializeCategory(category))
      .filter(category => category !== null); // Filter out null categories
    
    console.log(`✅ Fetched ${freshCategories.length} categories`);
    return freshCategories;
    
  } catch (error) {
    console.error('❌ Error fetching fresh data:', error.message);
    throw error;
  }
};

  const cacheData = async (categoriesToCache) => {
    try {
      const now = Date.now();
      
      const categoriesForStorage = categoriesToCache.map(cat => {
        const { icon, color, bgColor, isPinned, ...rest } = cat;
        return rest;
      });
      
      const metadataForStorage = {};
      categoriesToCache.forEach(cat => {
        metadataForStorage[cat._id] = {
          icon: cat.icon,
          color: cat.color,
          bgColor: cat.bgColor,
          isPinned: cat.isPinned,
          cachedAt: now
        };
      });

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categoriesForStorage)),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_UPDATE, now.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.CATEGORY_METADATA, JSON.stringify(metadataForStorage)),
      ]);
      
    } catch (error) {
      console.error('Error caching data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchFreshData();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh services');
    } finally {
      setRefreshing(false);
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
    navigation.navigate('CategoryProviders', {
      categoryId: category._id,
      categoryName: category.name,
    });
  };

  const getPinnedCategories = () => {
    return categories.filter(cat => cat.isPinned);
  };

  const getRegularCategories = () => {
    return filteredCategories.filter(cat => !cat.isPinned);
  };

  const handleAddService = () => {
    navigation.navigate('AddService', { 
      categories: categories.map(cat => ({ id: cat._id, name: cat.name }))
    });
  };

  const handleAIChatbot = () => {
    setShowAIChatbot(true);
  };

  const handleAISearch = () => {
    if (aiQuery.trim()) {
      // Intelligent search logic
      const query = aiQuery.toLowerCase();
      
      // Check for specific service types
      const transportKeywords = ['transport', 'bike', 'motorbike', 'boda', 'matatu', 'bus', 'psv', 'commute', 'tuktuk'];
      const isTransportQuery = transportKeywords.some(keyword => query.includes(keyword));
      
      if (isTransportQuery) {
        const transportCategories = categories.filter(cat => 
          cat.isPinned || 
          cat.name.toLowerCase().includes('transport') ||
          cat.name.toLowerCase().includes('motorbike') ||
          cat.name.toLowerCase().includes('matatu') ||
          cat.name.toLowerCase().includes('bus') ||
          cat.name.toLowerCase().includes('tuktuk')
        );
        
        if (transportCategories.length > 0) {
          // Navigate to first transport category or show options
          handleCategoryPress(transportCategories[0]);
          setShowAIChatbot(false);
          setAiQuery('');
          return;
        }
      }
      
      // Fallback to regular search
      setSearchQuery(aiQuery);
      setShowAIChatbot(false);
      setAiQuery('');
    }
  };

  const renderHeader = () => (
    <Animated.View 
      style={[
        styles.headerContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View>
        <Text style={styles.welcomeText}>Discover Moi University</Text>
        <Text style={styles.headerTitle}>Services Hub</Text>
      </View>
      <TouchableOpacity 
        style={styles.addServiceButton}
        onPress={handleAddService}
      >
        <Ionicons name="add-circle" size={24} color={Colors.primary} />
        <Text style={styles.addServiceText}>Add Service</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSearchBar = () => (
    <Animated.View 
      style={[
        styles.searchContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for services, repairs, delivery..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  const renderPinnedServicesGrid = () => {
    const pinnedCategories = getPinnedCategories();
    if (pinnedCategories.length === 0 || searchQuery !== '') return null;

    return (
      <Animated.View 
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.featuredTitleContainer}>
            <Ionicons name="star" size={20} color={Colors.warning} />
            <Text style={styles.featuredTitle}>Featured Services</Text>
          </View>
          <View style={styles.featuredBadge}>
            <Ionicons name="pin" size={12} color={Colors.text} />
            <Text style={styles.featuredBadgeText}>PINNED</Text>
          </View>
        </View>
        
        <View style={styles.featuredGrid}>
          {pinnedCategories.map((category) => (
            <TouchableOpacity
              key={category._id}
              style={[
                styles.featuredGridCard, 
                { 
                  backgroundColor: category.bgColor,
                  borderWidth: 0, // FIXED: Remove border on pinned cards
                }
              ]}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={styles.featuredGridCardHeader}>
                <View style={[styles.featuredGridIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon} size={22} color="#FFFFFF" />
                </View>
                <View style={styles.featuredGridBadge}>
                  <Text style={styles.featuredGridBadgeText}>FEATURED</Text>
                </View>
              </View>
              <View style={styles.featuredGridCardContent}>
                <Text style={styles.featuredGridCardTitle} numberOfLines={2}>
                  {category.name}
                </Text>
                <View style={styles.featuredGridStats}>
                  <View style={styles.featuredGridStatItem}>
                    <Ionicons name="time" size={12} color={Colors.textSecondary} />
                    <Text style={styles.featuredGridStatText}>24/7</Text>
                  </View>
                  <View style={styles.featuredGridStatItem}>
                    <Ionicons name="star" size={12} color={Colors.warning} />
                    <Text style={styles.featuredGridStatText}>4.5+</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderAllServices = () => {
    const regularCategories = getRegularCategories();
    
    if (regularCategories.length === 0 && searchQuery) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Search Results</Text>
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyStateTitle}>No services found</Text>
            <Text style={styles.emptyStateDescription}>
              Try different keywords or use AI search for better results
            </Text>
            <TouchableOpacity 
              style={styles.aiSearchButton}
              onPress={handleAIChatbot}
            >
              <Ionicons name="sparkles" size={16} color={Colors.text} />
              <Text style={styles.aiSearchText}>Try AI Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <Animated.View 
        style={[
          styles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Results (${regularCategories.length})` : 'All Services'}
          </Text>
          {!searchQuery && regularCategories.length > 0 && (
            <Text style={styles.servicesCount}>{regularCategories.length} services</Text>
          )}
        </View>
        
        <View style={styles.servicesGrid}>
          {regularCategories.map((category, index) => (
            <TouchableOpacity
              key={category._id}
              style={styles.serviceCard}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={[styles.serviceIcon, { backgroundColor: category.bgColor }]}>
                <Ionicons name={category.icon} size={24} color={category.color} />
              </View>
              <Text style={styles.serviceName} numberOfLines={2}>{category.name}</Text>
              <View style={styles.serviceStatus}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                <Text style={styles.serviceStatusText}>Available</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderAIChatbotModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showAIChatbot}
      onRequestClose={() => setShowAIChatbot(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowAIChatbot(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.aiChatbotContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.aiHeader}>
                <View style={styles.aiHeaderIcon}>
                  <Ionicons name="sparkles" size={24} color={Colors.primary} />
                </View>
                <View style={styles.aiHeaderContent}>
                  <Text style={styles.aiTitle}>AI Service Finder</Text>
                  <Text style={styles.aiSubtitle}>Describe what you need in natural language</Text>
                </View>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowAIChatbot(false)}
                >
                  <Ionicons name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.aiExamples}>
                <Text style={styles.examplesTitle}>Examples:</Text>
                <TouchableOpacity 
                  style={styles.exampleChip}
                  onPress={() => setAiQuery("I need a plumber for a leaky pipe")}
                >
                  <Text style={styles.exampleText}>"I need a plumber for a leaky pipe"</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exampleChip}
                  onPress={() => setAiQuery("Find motorbike repair near me")}
                >
                  <Text style={styles.exampleText}>"Find motorbike repair near me"</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exampleChip}
                  onPress={() => setAiQuery("Find matatu services for daily commute")}
                >
                  <Text style={styles.exampleText}>"Find matatu services for daily commute"</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exampleChip}
                  onPress={() => setAiQuery("I need a boda boda for quick delivery")}
                >
                  <Text style={styles.exampleText}>"I need a boda boda for quick delivery"</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.aiInputContainer}>
                <TextInput
                  style={styles.aiInput}
                  placeholder="Describe what service you need..."
                  placeholderTextColor={Colors.textSecondary}
                  value={aiQuery}
                  onChangeText={setAiQuery}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity 
                  style={[
                    styles.aiActionButton,
                    !aiQuery.trim() && styles.aiActionButtonDisabled
                  ]}
                  onPress={handleAISearch}
                  disabled={!aiQuery.trim()}
                >
                  <Ionicons name="search" size={20} color={Colors.text} />
                  <Text style={styles.aiActionButtonText}>Find Services</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading premium services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && categories.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={64} color={Colors.textTertiary} />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorDescription}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeader()}
        {renderSearchBar()}
        {renderPinnedServicesGrid()}
        {renderAllServices()}
        
        {/* Footer Space */}
        <View style={styles.footerSpace} />
      </ScrollView>

      {/* AI Chatbot FAB */}
      <TouchableOpacity 
        style={styles.aiFab}
        onPress={handleAIChatbot}
        activeOpacity={0.8}
      >
        <Ionicons name="sparkles" size={24} color={Colors.text} />
      </TouchableOpacity>

      {/* AI Chatbot Modal */}
      {renderAIChatbotModal()}

      {isOffline && !loading && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi" size={16} color={Colors.text} />
          <Text style={styles.offlineText}>Offline Mode • Using cached data</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 0, // FIXED: Remove space between status bar and screen
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  
  // Header Styles
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + Spacing.md, // FIXED: Added extra padding to account for status bar
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.text,
  },
  addServiceButton: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  addServiceText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  
  // Search Styles
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  searchWrapper: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  
  // Section Styles
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  servicesCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  
  // Featured Services Grid
  featuredTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featuredTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  featuredBadge: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  featuredBadgeText: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '700',
  },
  featuredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featuredGridCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    ...Components.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 0, // FIXED: Remove border on pinned cards
    overflow: 'hidden', // Added for better shadow rendering
  },
  featuredGridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  featuredGridIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredGridBadge: {
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  featuredGridBadgeText: {
    fontSize: 8,
    color: Colors.text,
    fontWeight: '700',
  },
  featuredGridCardContent: {
    flex: 1,
  },
  featuredGridCardTitle: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: Spacing.xs,
    minHeight: 36,
  },
  featuredGridStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  featuredGridStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  featuredGridStatText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  
  // All Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    ...Components.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  serviceName: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: Spacing.xs,
    minHeight: 32,
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  serviceStatusText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '500',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyStateTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyStateDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  aiSearchButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  aiSearchText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  
  // AI Chatbot FAB
  aiFab: {
    position: 'absolute',
    bottom: 20,
    right: Spacing.lg,
    backgroundColor: Colors.accent,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
    zIndex: 1000,
  },
  
  // AI Chatbot Modal - FIXED TRANSPARENCY
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)', // Fixed: Increased opacity to 0.92
    justifyContent: 'flex-end',
  },
  aiChatbotContainer: {
    backgroundColor: Colors.background, // Fixed: Use solid background color
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: height * 0.75,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.large, // Added shadow for depth
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  aiHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  aiHeaderContent: {
    flex: 1,
  },
  aiTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  aiSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  aiExamples: {
    marginBottom: Spacing.lg,
  },
  examplesTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  exampleChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  exampleText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  aiInputContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  aiInput: {
    ...Typography.body,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  aiActionButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  aiActionButtonDisabled: {
    opacity: 0.5,
  },
  aiActionButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  errorDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  retryButton: {
    ...Components.buttonPrimary,
    minWidth: 120,
  },
  retryButtonText: {
    ...Components.buttonTextPrimary,
  },
  
  // Offline Banner
  offlineBanner: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.xs,
  },
  offlineText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  
  // Footer Space
  footerSpace: {
    height: Spacing.xxxl,
  },
});

export default LocalServices;