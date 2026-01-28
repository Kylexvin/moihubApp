import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Animated,
  FlatList,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from './theme/Theme';

const { width, height } = Dimensions.get('window');
const { Colors, Gradients, Typography, Spacing, BorderRadius, Components, Shadows } = Theme;

const CategoryProviders = ({ route, navigation }) => {
  const { categoryId, categoryName } = route.params;
  
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
  }, [categoryId]);

  useEffect(() => {
    filterProviders();
  }, [searchQuery, providers]);

  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try network first
      try {
        const freshProviders = await fetchFreshProviders();
        
        if (!freshProviders || freshProviders.length === 0) {
          console.log('No providers found');
        }
        
        setProviders(freshProviders || []);
        setFilteredProviders(freshProviders || []);
        setIsOffline(false);
        
        // Cache to AsyncStorage
        await cacheProviders(freshProviders || []);
        
      } catch (networkError) {
        // Load from cache
        const cachedProviders = await loadCachedProviders();
        
        if (cachedProviders && cachedProviders.length > 0) {
          setProviders(cachedProviders);
          setFilteredProviders(cachedProviders);
          setIsOffline(true);
        } else {
          setProviders([]);
          setFilteredProviders([]);
          setIsOffline(true);
        }
      }
      
    } catch (error) {
      console.error('Error initializing providers:', error);
      setError('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshProviders = async () => {
    try {
      const response = await axios.get(`/api/services/providers/${categoryId}`, {
        timeout: 10000,
      });
      
      let providersArray = [];
      
      if (response.data && Array.isArray(response.data.providers)) {
        providersArray = response.data.providers;
      } else if (Array.isArray(response.data)) {
        providersArray = response.data;
      }
      
      // Format providers
      return providersArray.map(provider => ({
        id: provider.id || provider._id,
        providerName: provider.name || provider.providerName,
        phone: provider.phone || provider.phoneNumber,
        address: provider.address || provider.areasOfOperation?.[0] || '',
        rating: provider.rating || 0,
        ratingCount: provider.ratingCount || provider.totalReviews || 0,
        providerType: provider.providerType || 'directory',
        isBookable: provider.isBookable || false,
      }));
      
    } catch (error) {
      console.error('Error fetching providers:', error.message);
      throw error;
    }
  };

  const loadCachedProviders = async () => {
    try {
      const providersKey = `services_providers_${categoryId}`;
      const providersJson = await AsyncStorage.getItem(providersKey);
      
      if (!providersJson) return null;
      
      return JSON.parse(providersJson);
    } catch (error) {
      console.error('Error loading cached providers:', error);
      return null;
    }
  };

  const cacheProviders = async (providersToCache) => {
    try {
      const providersKey = `services_providers_${categoryId}`;
      await AsyncStorage.setItem(providersKey, JSON.stringify(providersToCache));
    } catch (error) {
      console.error('Error caching providers:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await initializeData();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh providers');
    } finally {
      setRefreshing(false);
    }
  };

  const filterProviders = () => {
    if (searchQuery.trim() === '') {
      setFilteredProviders(providers);
    } else {
      const filtered = providers.filter(provider =>
        provider.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (provider.address && provider.address.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProviders(filtered);
    }
  };

  // DIRECT ACTIONS - NO BULLSHIT ALERTS
  const handleCallProvider = (provider) => {
    const phoneNumber = provider.phone?.startsWith('+') 
      ? provider.phone 
      : `+${provider.phone}`;
    
    Linking.openURL(`tel:${phoneNumber}`).catch(err => {
      console.log('Failed to open phone dialer:', err);
    });
  };

  const handleWhatsAppProvider = (provider) => {
    const phoneNumber = provider.phone?.replace('+', '');
    
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
    Linking.openURL(whatsappUrl).catch(err => {
      const webUrl = `https://wa.me/${phoneNumber}`;
      Linking.openURL(webUrl).catch(err => {
        console.log('Failed to open WhatsApp:', err);
      });
    });
  };

const handleViewProfile = (provider) => {
  console.log('View Profile:', provider.providerName);
  
  // Navigate to ProviderProfile with actual provider data
  navigation.navigate('ProviderProfile', {
    providerId: provider.id,
    providerName: provider.providerName,
    providerType: provider.providerType,
    // Pass phone for contact buttons
    providerPhone: provider.phone,
  });
};


  const renderProviderCard = ({ item: provider }) => (
    <View style={[Components.card, styles.providerCard]}>
      <View style={styles.providerCardHeader}>
        <View style={styles.providerAvatar}>
          <Text style={styles.providerAvatarText}>
            {provider.providerName.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.providerInfo}>
          <Text style={Typography.h3} numberOfLines={1}>
            {provider.providerName}
          </Text>
          
          <View style={styles.providerMeta}>
            {provider.address && (
              <View style={styles.locationContainer}>
                <Ionicons name="location" size={12} color={Colors.textSecondary} />
                <Text style={Typography.caption} numberOfLines={1}>
                  {provider.address}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.providerCardFooter}>
        {provider.providerType === 'dashboard' ? (
          <TouchableOpacity 
            style={Components.buttonPrimary}
            onPress={() => handleViewProfile(provider)}
          >
            <Text style={Components.buttonTextPrimary}>View Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.directoryActions}>
            <TouchableOpacity 
              style={styles.callButton}
              onPress={() => handleCallProvider(provider)}
            >
              <Ionicons name="call" size={16} color={Colors.primary} />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.whatsappButton}
              onPress={() => handleWhatsAppProvider(provider)}
            >
              <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
              <Text style={styles.whatsappButtonText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="business" size={64} color={Colors.textTertiary} />
      <Text style={Typography.h2}>No Providers Found</Text>
      <Text style={[Typography.bodySmall, styles.emptyStateDescription]}>
        {searchQuery 
          ? 'No providers match your search'
          : `No ${categoryName.toLowerCase()} providers are registered yet`
        }
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={Typography.bodySmall}>Loading {categoryName} providers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      

      
      <FlatList
        data={filteredProviders}
        renderItem={renderProviderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={
          filteredProviders.length > 0 && (
            <Animated.View style={styles.resultsHeader}>
              <Text style={Typography.h3}>
                {searchQuery ? 'Search Results' : 'Available Providers'}
              </Text>
              <Text style={Typography.caption}>
                {filteredProviders.length} {filteredProviders.length === 1 ? 'provider' : 'providers'}
              </Text>
            </Animated.View>
          )
        }
      />

      {isOffline && !loading && (
        <View style={styles.offlineBanner}>
          <Ionicons name="wifi" size={16} color={Colors.text} />
          <Text style={Typography.caption}>Offline Mode • Using cached data</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  // SIMPLE SEARCH BAR
  searchContainer: {
    backgroundColor: Colors.primary,
    paddingTop: StatusBar.currentHeight || 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: Typography.body.fontSize,
    color: Colors.text,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  providerCard: {
    marginBottom: Spacing.md,
  },
  providerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  providerAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  providerInfo: {
    flex: 1,
  },
  providerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  directoryActions: {
    flexDirection: 'row',
    flex: 1,
    gap: Spacing.sm,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  callButtonText: {
    fontSize: Typography.button.fontSize,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366' + '10',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#25D366' + '30',
  },
  whatsappButtonText: {
    fontSize: Typography.button.fontSize,
    fontWeight: '600',
    color: '#25D366',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateDescription: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.warning + '20',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
});

export default CategoryProviders;