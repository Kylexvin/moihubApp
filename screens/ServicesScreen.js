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

const ServicesScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [showAIChatbot, setShowAIChatbot] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [dbReady, setDbReady] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

// Replace the getCategoryIcon function with this corrected version:
const getCategoryIcon = (categoryName) => {
  const name = categoryName.toLowerCase();
  const iconMap = {
    // Transport icons
    'matatu services': 'bus',
    'matatu services': 'bus',
    'boda boda': 'bicycle',
    'motorbike services': 'bicycle',
    'tuktuk services': 'car',
    'transport': 'car',
    
    // Service icons
    'electronic repairs': 'build',
    'laundry services': 'shirt',
    'photoshoot services': 'camera',
    'cyber café': 'desktop',
    'cyber cafe': 'desktop',
    'gas deliveries': 'flame',
    'gas deliveries services': 'flame',
    
    // Beauty/Hair icons
    'saloonist': 'cut',
    'kinyozi': 'cut',
    'best kinyozi': 'cut',
    
    // Food icons
    'food ': 'ice-cream', // Changed from 'cake' to 'ice-cream'
    'poshomill': 'nutrition', // Alternative: 'leaf' or 'restaurant'
    
    // Other services
    'capentry services': 'construct',
    'mama fua': 'woman',
    'test': 'star',
    
    // Additional mappings for your API categories
    'electronic repairs': 'hardware-chip',
    'laundry services': 'shirt',
    'photoshoot services': 'camera',
  };
  
  // Return the icon or a sensible default
  return iconMap[name] || 'business';
};

// Also update the color mapping for better consistency:
const getCategoryColor = (categoryName) => {
  const name = categoryName.toLowerCase();
  const colorMap = {
    // Transport - Green
    'matatu services': '#10B981',
    'boda boda': '#059669',
    'motorbike services': '#10B981',
    'transport': '#3B82F6',
    'tuktuk services': '#10B981',
    
    // Food/Drink - Orange/Yellow
    'cake': '#F59E0B',
    'poshomill': '#F59E0B',
    'gas deliveries': '#F59E0B',
    
    // Tech/Electronics - Purple
    'electronic repairs': '#8B5CF6',
    'cyber café': '#8B5CF6',
    'cyber cafe': '#8B5CF6',
    
    // Beauty/Salon - Pink
    'saloonist': '#EC4899',
    'best kinyozi': '#EC4899',
    'kinyozi': '#EC4899',
    
    // Cleaning/Laundry - Blue
    'laundry services': '#06B6D4',
    'mama fua': '#06B6D4',
    
    // Photography - Pink
    'photoshoot services': '#EC4899',
    
    // Carpentry - Brown/Orange
    'capentry services': '#F59E0B',
    
    // Test - Purple
    'test': '#8B5CF6',
  };
  
  return colorMap[name] || Colors.primary;
};

  const initializeCategory = (category) => {
    if (!category) return null;
    
    const categoryName = category.name || '';
    const isPinned = category.isPinned || false;
    const icon = getCategoryIcon(categoryName);
    const color = getCategoryColor(categoryName);
    const bgColor = color + '20';

    return {
      _id: category.id || category._id,
      id: category.id || category._id,
      name: categoryName,
      description: category.description || '',
      icon,
      color,
      bgColor,
      isPinned,
      providerCount: category.providerCount || 0,
      allowDashboard: category.allowDashboard || false,
      allowBooking: category.allowBooking || false
    };
  };

  // Initialize database in background
  useEffect(() => {
    const initDatabase = async () => {
      try {
        console.log('🔄 Initializing database in background...');
        await localServicesDB.init();
        setDbReady(true);
        console.log('✅ Database ready');
      } catch (error) {
        console.log('⚠️ Database init failed, will use fallback:', error.message);
      }
    };
    
    initDatabase();
  }, []);

  // Main data initialization
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
      
      console.log('🚀 Starting data load...');
      
      // SHOW DEFAULT CATEGORIES IMMEDIATELY
      const defaultCategories = [
        {
          _id: 'matatu_services',
          id: 'matatu_services',
          name: 'Matatu Services',
          description: 'Public transport services around campus',
          icon: 'bus',
          color: '#10B981',
          bgColor: '#10B98120',
          isPinned: true,
          providerCount: 12,
          allowDashboard: false,
          allowBooking: false
        },
        {
          _id: 'boda_boda',
          id: 'boda_boda',
          name: 'Boda Boda',
          description: 'Motorbike taxi and delivery services',
          icon: 'bicycle',
          color: '#059669',
          bgColor: '#05966920',
          isPinned: true,
          providerCount: 8,
          allowDashboard: false,
          allowBooking: false
        }
      ];
      
      // Show default categories immediately
      setCategories(defaultCategories);
      console.log('📱 Default categories shown immediately');
      
      // Try to fetch fresh data in background
      fetchFreshDataInBackground();
      
    } catch (error) {
      console.error('❌ Initial load error:', error);
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshDataInBackground = async () => {
    console.log('🌐 Starting background data sync...');
    
    try {
      // Try network first
      const freshCategories = await fetchFreshData();
      
      if (freshCategories && freshCategories.length > 0) {
        console.log(`🔄 Updating with ${freshCategories.length} fresh categories`);
        
        // Merge with defaults (keep pinned categories)
        const mergedCategories = mergeCategoriesWithDefaults(freshCategories);
        
        // Update UI
        setCategories(mergedCategories);
        setIsOffline(false);
        
        // Save to SQLite in background (if ready)
        if (dbReady) {
          try {
            await localServicesDB.saveCategories(freshCategories);
            console.log('💾 Saved to SQLite');
          } catch (dbError) {
            console.log('⚠️ Could not save to SQLite:', dbError.message);
          }
        }
        
        // Also save to AsyncStorage as backup
        await AsyncStorage.setItem('local_services_cache', JSON.stringify(freshCategories));
        await AsyncStorage.setItem('local_services_cache_time', Date.now().toString());
        
        console.log('✅ Background sync complete');
      }
    } catch (networkError) {
      console.log('📶 Network failed, checking cache...');
      
      // Try to load from AsyncStorage cache
      try {
        const cacheTime = await AsyncStorage.getItem('local_services_cache_time');
        const cacheData = await AsyncStorage.getItem('local_services_cache');
        
        if (cacheData && cacheTime) {
          const cachedCategories = JSON.parse(cacheData);
          const cacheAge = Date.now() - parseInt(cacheTime);
          const oneHour = 60 * 60 * 1000;
          
          if (cacheAge < oneHour * 24) { // Cache valid for 24 hours
            console.log(`📂 Loading ${cachedCategories.length} categories from cache`);
            
            const mergedCategories = mergeCategoriesWithDefaults(cachedCategories);
            setCategories(mergedCategories);
            setIsOffline(true);
            setError('Using cached data. Connect for latest updates.');
          }
        }
      } catch (cacheError) {
        console.log('📭 No cache available');
        setIsOffline(true);
        setError('No internet connection. Basic services available.');
      }
    }
  };

  const mergeCategoriesWithDefaults = (freshCategories) => {
    const defaultPinnedIds = ['matatu_services', 'boda_boda'];
    
    // Initialize fresh categories
    const initializedFresh = freshCategories
      .map(cat => initializeCategory(cat))
      .filter(cat => cat !== null);
    
    // Check if we have our default pinned categories
    const hasMatatu = initializedFresh.some(cat => 
      cat.name.toLowerCase().includes('matatu'));
    const hasBoda = initializedFresh.some(cat => 
      cat.name.toLowerCase().includes('boda boda') || 
      cat.name.toLowerCase().includes('motorbike'));
    
    let result = [...initializedFresh];
    
    // Add default Matatu if not present
    if (!hasMatatu) {
      result.push({
        _id: 'matatu_services',
        id: 'matatu_services',
        name: 'Matatu Services',
        description: 'Public transport services around campus',
        icon: 'bus',
        color: '#10B981',
        bgColor: '#10B98120',
        isPinned: true,
        providerCount: 12,
        allowDashboard: false,
        allowBooking: false
      });
    }
    
    // Add default Boda Boda if not present
    if (!hasBoda) {
      result.push({
        _id: 'boda_boda',
        id: 'boda_boda',
        name: 'Boda Boda',
        description: 'Motorbike taxi and delivery services',
        icon: 'bicycle',
        color: '#059669',
        bgColor: '#05966920',
        isPinned: true,
        providerCount: 8,
        allowDashboard: false,
        allowBooking: false
      });
    }
    
    return result;
  };

  const fetchFreshData = async () => {
    try {
      console.log('🌐 Fetching fresh data...');
      
      const response = await axios.get('/api/services/categories', {
        timeout: 8000, // Shorter timeout
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      console.log('✅ API response received');
      
      let categoriesArray = response.data?.categories || [];
      
      if (!Array.isArray(categoriesArray)) {
        categoriesArray = [];
      }
      
      // Mark Matatu and Boda Boda as pinned
      const processedCategories = categoriesArray.map(category => {
        const name = (category.name || '').toLowerCase();
        const isPinned = name.includes('matatu') || 
                        name.includes('boda boda') || 
                        name.includes('motorbike');
        
        return {
          ...category,
          id: category._id,
          isPinned,
          providerCount: 0
        };
      });
      
      console.log(`📊 Processed ${processedCategories.length} categories`);
      return processedCategories;
      
    } catch (error) {
      console.error('❌ Fetch error:', error.message);
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchFreshDataInBackground();
    } catch (error) {
      console.log('Refresh error:', error);
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

  const handleAddService = () => {
    Alert.alert('Coming Soon', 'Service addition feature is under development');
  };

  const getPinnedCategories = () => {
    return categories.filter(cat => cat.isPinned);
  };

  const getRegularCategories = () => {
    return filteredCategories.filter(cat => !cat.isPinned);
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
        <Text style={styles.welcomeText}>Moi University</Text>
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
          placeholder="Search for services..."
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

  const renderPinnedServices = () => {
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
                { backgroundColor: category.bgColor }
              ]}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={styles.featuredGridCardHeader}>
                <View style={[styles.featuredGridIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon} size={22} color="#FFFFFF" />
                </View>
                <View style={styles.featuredGridBadge}>
                  <Text style={styles.featuredGridBadgeText}>POPULAR</Text>
                </View>
              </View>
              <View style={styles.featuredGridCardContent}>
                <Text style={styles.featuredGridCardTitle} numberOfLines={2}>
                  {category.name}
                </Text>
                <Text style={styles.featuredGridCardDescription} numberOfLines={2}>
                  {category.description}
                </Text>
                {category.providerCount > 0 && (
                  <View style={styles.featuredGridStats}>
                    <View style={styles.featuredGridStatItem}>
                      <Ionicons name="business" size={12} color={Colors.textSecondary} />
                      <Text style={styles.featuredGridStatText}>
                        {category.providerCount} providers
                      </Text>
                    </View>
                  </View>
                )}
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
              Try different keywords or check your connection
            </Text>
          </View>
        </View>
      );
    }

    if (regularCategories.length === 0 && !searchQuery) {
      return null;
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
          {regularCategories.map((category) => (
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
              {category.providerCount > 0 && (
                <View style={styles.serviceStatus}>
                  <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                  <Text style={styles.serviceStatusText}>{category.providerCount} available</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    );
  };

  // Show loading only for first 500ms, then show default content
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading services...</Text>
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
        {renderPinnedServices()}
        {renderAllServices()}
        
        <View style={styles.footerSpace} />
      </ScrollView>

      {isOffline && !loading && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi" size={16} color={Colors.text} />
          <Text style={styles.offlineText}>Offline Mode • Using cached data</Text>
          {refreshing && (
            <ActivityIndicator size="small" color={Colors.text} style={{ marginLeft: 8 }} />
          )}
        </View>
      )}
      
      {/* Background sync indicator */}
      {refreshing && !isOffline && (
        <View style={styles.syncIndicator}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.syncText}>Syncing...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  
  // Header Styles
  headerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + Spacing.md,
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
  
  // Featured Services
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
    backgroundColor: Colors.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
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
    marginBottom: 4,
  },
  featuredGridCardDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    lineHeight: 14,
  },
  featuredGridStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  featuredGridStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    backgroundColor: Colors.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
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
  
  // Sync Indicator
  syncIndicator: {
    position: 'absolute',
    top: Spacing.xl + Spacing.md + 10,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card + 'CC',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.xs,
  },
  syncText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  
  // Footer Space
  footerSpace: {
    height: Spacing.xxxl,
  },
});

export default ServicesScreen;