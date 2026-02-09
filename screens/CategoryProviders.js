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
import localServicesDB from '../services/LocalServicesDatabase';

const { width, height } = Dimensions.get('window');
const { Colors, Gradients, Typography, Spacing, BorderRadius, Components, Shadows } = Theme;

const CategoryProvidersScreen = ({ route, navigation }) => {
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
      
      // Initialize database
      await localServicesDB.init();
      
      // Try network first
      try {
        const freshProviders = await fetchFreshProviders();
        
        if (freshProviders && freshProviders.length > 0) {
          // Save to SQLite
          await localServicesDB.saveProviders(categoryId, freshProviders);
          
          setProviders(freshProviders);
          setFilteredProviders(freshProviders);
          setIsOffline(false);
        }
      } catch (networkError) {
        // Load from SQLite
        const dbProviders = await localServicesDB.getProvidersByCategory(categoryId);
        
        if (dbProviders.length > 0) {
          setProviders(dbProviders);
          setFilteredProviders(dbProviders);
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
      // Mock API endpoint - replace with your actual API
      const response = await axios.get(`/api/services/providers/${categoryId}`, {
        timeout: 10000,
      });
      
      let providersArray = [];
      
      if (response.data?.providers) {
        providersArray = response.data.providers;
      } else if (Array.isArray(response.data)) {
        providersArray = response.data;
      }
      
      return providersArray.map(provider => ({
        id: provider.id || provider._id,
        providerName: provider.name || provider.providerName,
        phone: provider.phone || provider.phoneNumber,
        address: provider.address || provider.areasOfOperation?.[0] || '',
        rating: provider.rating || 0,
        ratingCount: provider.ratingCount || provider.totalReviews || 0,
        providerType: provider.providerType || 'directory',
        isBookable: provider.isBookable || false,
        description: provider.description || '',
        services: provider.services || []
      }));
      
    } catch (error) {
      console.error('Error fetching providers:', error.message);
      throw error;
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
        (provider.address && provider.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (provider.description && provider.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProviders(filtered);
    }
  };

  const handleCallProvider = (provider) => {
    if (!provider.phone) {
      Alert.alert('No Phone', 'This provider has no phone number listed');
      return;
    }
    
    const phoneNumber = provider.phone.startsWith('+') 
      ? provider.phone 
      : `+${provider.phone}`;
    
    Linking.openURL(`tel:${phoneNumber}`).catch(err => {
      console.log('Failed to open phone dialer:', err);
      Alert.alert('Error', 'Could not make phone call');
    });
  };

  const handleWhatsAppProvider = (provider) => {
    if (!provider.phone) {
      Alert.alert('No Phone', 'This provider has no WhatsApp number');
      return;
    }
    
    const phoneNumber = provider.phone.replace('+', '');
    const message = `Hello, I found your ${categoryName} service on Moi University Services Hub.`;
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.openURL(whatsappUrl).catch(err => {
      const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      Linking.openURL(webUrl).catch(err => {
        Alert.alert('Error', 'WhatsApp is not installed');
      });
    });
  };

  const handleViewProfile = (provider) => {
    navigation.navigate('ProviderProfile', {
      providerId: provider.id,
      providerName: provider.providerName,
      providerType: provider.providerType,
      providerPhone: provider.phone,
      providerAddress: provider.address,
      providerDescription: provider.description
    });
  };

  const renderProviderCard = ({ item: provider }) => (
    <View style={[styles.providerCard, Components.card]}>
      <View style={styles.providerCardHeader}>
        <View style={styles.providerAvatar}>
          <Text style={styles.providerAvatarText}>
            {provider.providerName.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.providerInfo}>
          <Text style={styles.providerName} numberOfLines={1}>
            {provider.providerName}
          </Text>
          
          {provider.address ? (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={12} color={Colors.textSecondary} />
              <Text style={styles.providerAddress} numberOfLines={1}>
                {provider.address}
              </Text>
            </View>
          ) : null}
          
          {provider.description ? (
            <Text style={styles.providerDescription} numberOfLines={2}>
              {provider.description}
            </Text>
          ) : null}
        </View>
      </View>
      
      <View style={styles.providerCardFooter}>
        {provider.providerType === 'dashboard' ? (
          <TouchableOpacity 
            style={styles.viewProfileButton}
            onPress={() => handleViewProfile(provider)}
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
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
      <Text style={styles.emptyStateTitle}>No Providers Found</Text>
      <Text style={styles.emptyStateDescription}>
        {searchQuery 
          ? 'No providers match your search'
          : `No ${categoryName.toLowerCase()} providers available yet`
        }
      </Text>
      {isOffline && (
        <Text style={styles.emptyStateHint}>
          Connect to internet to load providers
        </Text>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {categoryName}
        </Text>
        <Text style={styles.headerSubtitle}>
          {filteredProviders.length} {filteredProviders.length === 1 ? 'provider' : 'providers'}
        </Text>
      </View>
      <View style={{ width: 40 }} />
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading {categoryName} providers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      
      {renderHeader()}
      
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${categoryName} providers...`}
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
      </View>
      
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
          filteredProviders.length > 0 && searchQuery ? (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                Search Results ({filteredProviders.length})
              </Text>
            </View>
          ) : null
        }
      />

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
  },
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchWrapper: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
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
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  resultsHeader: {
    marginBottom: Spacing.md,
  },
  resultsTitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  providerCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  providerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  providerName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerAddress: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  providerDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  providerCardFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: Spacing.md,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  viewProfileText: {
    ...Typography.button,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  directoryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  callButtonText: {
    ...Typography.button,
    color: Colors.primary,
    marginLeft: 4,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366' + '10',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#25D366' + '30',
  },
  whatsappButtonText: {
    ...Typography.button,
    color: '#25D366',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyStateDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emptyStateHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  offlineText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
});

export default CategoryProvidersScreen;