import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from './theme/Theme';

const { width, height } = Dimensions.get('window');
const { Colors, Gradients, Typography, Spacing, BorderRadius, Components, Shadows } = Theme;

const CategoryProviders = ({ route, navigation }) => {
  const { categoryId, categoryName, categoryIcon, categoryColor } = route.params;
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [copiedProviderId, setCopiedProviderId] = useState(null);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  // Get unique areas from all providers
  const [allAreas, setAllAreas] = useState(['All Areas']);

  useEffect(() => {
    navigation.setOptions({
      title: categoryName,
      headerStyle: {
        backgroundColor: categoryColor || Colors.primary,
      },
      headerTintColor: Colors.text,
      headerTitleStyle: {
        ...Typography.h3,
      },
      headerBackTitleVisible: false,
      headerBackImage: () => (
        <Ionicons name="arrow-back" size={24} color={Colors.text} style={{ marginLeft: Spacing.md }} />
      ),
    });
    
    fetchProviders();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [categoryId, categoryName]);

  useEffect(() => {
    filterProviders();
  }, [searchQuery, selectedArea, providers]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`api/services/providers/${categoryId}`);
      
      const fetchedProviders = response.data.providers || [];
      setProviders(fetchedProviders);
      
      // Extract unique areas from all providers
      const areas = ['All Areas'];
      fetchedProviders.forEach(provider => {
        if (provider.areas && Array.isArray(provider.areas)) {
          provider.areas.forEach(area => {
            if (area && !areas.includes(area)) {
              areas.push(area);
            }
          });
        }
      });
      setAllAreas(areas);
      
      // Initially show all providers
      setFilteredProviders(fetchedProviders);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch providers. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProviders();
  };

  const filterProviders = () => {
    let filtered = providers;

    // Filter by search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(provider =>
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (provider.areas && provider.areas.some(area => 
          area.toLowerCase().includes(searchQuery.toLowerCase())
        ))
      );
    }

    // Filter by selected area
    if (selectedArea !== 'All Areas') {
      filtered = filtered.filter(provider =>
        provider.areas && provider.areas.includes(selectedArea)
      );
    }

    setFilteredProviders(filtered);
  };

  // COPY NUMBER WITH HAPTIC FEEDBACK
  const copyNumberWithHaptic = async (phoneNumber, providerId, providerName) => {
    try {
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Copy to clipboard
      await Clipboard.setStringAsync(phoneNumber);
      
      // Show copied state
      setCopiedProviderId(providerId);
      
      // Show temporary success animation
      setTimeout(() => {
        setCopiedProviderId(null);
      }, 2000);
      
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // DIRECT CALL FUNCTION
  const makeDirectCall = async (phoneNumber, providerName) => {
    try {
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const phoneUrl = `tel:${phoneNumber}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);
      
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        // Fallback to copying if call can't be made
        await copyNumberWithHaptic(phoneNumber, null, providerName);
        Alert.alert(
          'Call Not Supported',
          'Phone number has been copied to clipboard. You can paste it in your dialer.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Call failed:', error);
      await copyNumberWithHaptic(phoneNumber, null, providerName);
    }
  };

  // DIRECT WHATSAPP FUNCTION
  const openDirectWhatsApp = async (phoneNumber, providerName) => {
    try {
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Remove leading 0 and add country code
      const formattedNumber = phoneNumber.startsWith('0') 
        ? `254${phoneNumber.substring(1)}` 
        : phoneNumber;
      
      const whatsappUrl = `https://wa.me/${formattedNumber}?text=Hi ${encodeURIComponent(providerName)}, I found you on MoiHub Services!`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('WhatsApp not installed', 'Please install WhatsApp to use this feature');
      }
    } catch (error) {
      console.error('WhatsApp failed:', error);
    }
  };

const handleProviderPress = async (provider) => {
  // For dashboard providers, navigate to profile
  if (provider.hasDashboard) {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      console.log('Navigating to ProviderProfile...');
      
      // Since we're inside ServicesStackNavigator, navigate normally
      const result = navigation.navigate('ProviderProfile', {
        providerId: provider.id,
        providerName: provider.name,
        categoryName: categoryName,
        categoryColor: categoryColor,
        phone: provider.phone,
        location: provider.location,
      });
      
      console.log('Navigation successful!');
      
    } catch (error) {
      console.error('Navigation failed:', error);
      
      // Show error and fallback
      Alert.alert(
        'Navigation Error',
        'Could not open profile. Contact copied instead.',
        [{ text: 'OK' }]
      );
      
      await copyNumberWithHaptic(provider.phone, provider.id, provider.name);
    }
  } else {
    // For directory providers, copy number (main action)
    await copyNumberWithHaptic(provider.phone, provider.id, provider.name);
  }
};

  const getProviderInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getProviderColor = (provider) => {
    if (provider.hasDashboard) {
      return provider.canBook ? Colors.success : Colors.info;
    }
    return Colors.secondary;
  };

  const renderAreaFilter = (area) => (
    <TouchableOpacity
      key={area}
      style={[
        styles.areaFilterItem,
        selectedArea === area && styles.areaFilterItemActive
      ]}
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedArea(area);
      }}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.areaFilterText,
        selectedArea === area && styles.areaFilterTextActive
      ]}>
        {area}
      </Text>
    </TouchableOpacity>
  );

  const renderProviderItem = ({ item }) => {
    const providerColor = getProviderColor(item);
    const isDashboard = item.hasDashboard;
    const isCopied = copiedProviderId === item.id;

    return (
      <Animated.View
        style={[
          styles.providerCard,
          isCopied && styles.providerCardCopied,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Provider Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: providerColor + '20' }]}>
          <Ionicons 
            name={isDashboard ? "phone-portrait" : "call"} 
            size={14} 
            color={providerColor} 
          />
          <Text style={[styles.typeBadgeText, { color: providerColor }]}>
            {isDashboard ? 'Dashboard' : 'Directory'}
          </Text>
        </View>

        {/* Provider Header */}
        <View style={styles.providerHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: providerColor }]}>
            <Text style={styles.avatarText}>{getProviderInitials(item.name)}</Text>
          </View>
          
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{item.name}</Text>
            
            {/* Rating */}
            {item.rating > 0 && (
              <View style={styles.ratingContainer}>
                <View style={styles.ratingStars}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < Math.floor(item.rating) ? "star" : "star-outline"}
                      size={14}
                      color={Colors.warning}
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>
                  {item.rating.toFixed(1)} ({item.totalReviews || 0})
                </Text>
              </View>
            )}

            {/* Location */}
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={Colors.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.location || (item.areas && item.areas[0]) || 'Location not specified'}
              </Text>
            </View>
          </View>
        </View>

        {/* Areas Tags */}
        {item.areas && item.areas.length > 0 && (
          <View style={styles.areasContainer}>
            {item.areas.slice(0, 3).map((area, index) => (
              <View key={index} style={styles.areaTag}>
                <Text style={styles.areaTagText}>{area}</Text>
              </View>
            ))}
            {item.areas.length > 3 && (
              <View style={styles.moreAreaTag}>
                <Text style={styles.moreAreaTagText}>+{item.areas.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Quick Action Bar */}
        <View style={styles.quickActionBar}>
          {/* Copy Number Button - MAIN ACTION */}
          <TouchableOpacity
            style={[styles.quickActionButton, styles.copyButton]}
            onPress={async () => await copyNumberWithHaptic(item.phone, item.id, item.name)}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionIcon}>
              {isCopied ? (
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              ) : (
                <Ionicons name="copy" size={18} color={Colors.primary} />
              )}
            </View>
            <Text style={styles.quickActionText}>
              {isCopied ? 'Copied!' : 'Copy Number'}
            </Text>
          </TouchableOpacity>

          {/* Call Button */}
          <TouchableOpacity
            style={[styles.quickActionButton, styles.callButton]}
            onPress={async () => await makeDirectCall(item.phone, item.name)}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="call" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.quickActionText, styles.callButtonText]}>
              Call
            </Text>
          </TouchableOpacity>

          {/* WhatsApp Button */}
          <TouchableOpacity
            style={[styles.quickActionButton, styles.whatsappButton]}
            onPress={async () => await openDirectWhatsApp(item.phone, item.name)}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            </View>
            <Text style={[styles.quickActionText, styles.whatsappButtonText]}>
              WhatsApp
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Action Button */}
        <TouchableOpacity
          style={[styles.mainActionButton, { backgroundColor: providerColor }]}
          onPress={async () => await handleProviderPress(item)}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isDashboard ? "eye" : "copy"} 
            size={18} 
            color={Colors.text} 
          />
          <Text style={styles.mainActionButtonText}>
            {isDashboard ? 'View Profile' : 'Get Contact'}
          </Text>
        </TouchableOpacity>

        {/* Copied Success Indicator */}
        {isCopied && (
          <View style={styles.copiedIndicator}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.copiedText}>Number copied to clipboard!</Text>
          </View>
        )}
      </Animated.View>
    );
  };

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
          placeholder={`Search ${categoryName} providers...`}
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSearchQuery('');
            }}
          >
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  const renderAreaFilters = () => (
    <Animated.View 
      style={[
        styles.filtersContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.filterTitle}>Filter by Area:</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.areaFiltersRow}
      >
        {allAreas.map(renderAreaFilter)}
      </ScrollView>
    </Animated.View>
  );

  const renderResultsHeader = () => (
    <Animated.View 
      style={[
        styles.resultsHeader,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.resultsTitleContainer}>
        <Text style={styles.resultsTitle}>
          {filteredProviders.length} Provider{filteredProviders.length !== 1 ? 's' : ''} Found
        </Text>
        <View style={styles.resultsStats}>
          <View style={styles.statBadge}>
            <Ionicons name="phone-portrait" size={12} color={Colors.text} />
            <Text style={styles.statBadgeText}>
              {filteredProviders.filter(p => p.hasDashboard).length} Dashboard
            </Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: Colors.secondary }]}>
            <Ionicons name="call" size={12} color={Colors.text} />
            <Text style={styles.statBadgeText}>
              {filteredProviders.filter(p => !p.hasDashboard).length} Directory
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people" size={64} color={Colors.textTertiary} />
      <Text style={styles.emptyTitle}>No providers found</Text>
      <Text style={styles.emptyDescription}>
        {searchQuery || selectedArea !== 'All Areas' 
          ? 'Try adjusting your search or filters' 
          : 'Check back later for new providers in this category'}
      </Text>
      {(searchQuery || selectedArea !== 'All Areas') && (
        <TouchableOpacity 
          style={styles.clearFiltersButton}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSearchQuery('');
            setSelectedArea('All Areas');
          }}
        >
          <Text style={styles.clearFiltersText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Loading providers...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.centerContainer}>
      <Ionicons name="cloud-offline" size={64} color={Colors.textTertiary} />
      <Text style={styles.errorTitle}>Connection Error</Text>
      <Text style={styles.errorDescription}>
        {error}
      </Text>
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          fetchProviders();
        }}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  if (error && providers.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      
      <FlatList
        data={filteredProviders}
        renderItem={renderProviderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {renderSearchBar()}
            {renderAreaFilters()}
            {renderResultsHeader()}
          </>
        }
        ListEmptyComponent={renderEmptyState()}
        ListFooterComponent={<View style={styles.footerSpace} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContainer: {
    paddingBottom: Spacing.xxxl,
  },
  
  // Search Bar
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
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
  
  // Area Filters
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  filterTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  areaFiltersRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  areaFilterItem: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  areaFilterItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  areaFilterText: {
    ...Typography.caption,
    color: Colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  areaFilterTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  
  // Results Header
  resultsHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  resultsTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  resultsStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statBadge: {
    backgroundColor: Colors.info,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  statBadgeText: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '600',
  },
  
  // Provider Card
  providerCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.small,
  },
  providerCardCopied: {
    borderColor: Colors.success,
    borderWidth: 2,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  providerHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: '700',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  ratingStars: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  
  // Areas Tags
  areasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  areaTag: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  areaTagText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '500',
  },
  moreAreaTag: {
    backgroundColor: Colors.textTertiary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  moreAreaTagText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  
  // Quick Action Bar
  quickActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  copyButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  callButton: {
    backgroundColor: Colors.primary,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  quickActionIcon: {
    width: 24,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  callButtonText: {
    color: Colors.text,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
  },
  
  // Main Action Button
  mainActionButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  mainActionButtonText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  
  // Copied Indicator
  copiedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success + '20',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  copiedText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  clearFiltersButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  clearFiltersText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  
  // Loading & Error States
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
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
  
  // Footer Space
  footerSpace: {
    height: Spacing.xxxl,
  },
});

export default CategoryProviders;