// screens/eshop/CategoryShopsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

// Royal Purple & Gold theme colors
const ShopColors = {
  primary: '#6B4EFF',      // Royal Purple
  secondary: '#9F7AEA',     // Lavender
  accent: '#FFD700',        // Gold
  success: '#4CAF50',       // Green
  warning: '#FF9800',       // Orange
  error: '#F44336',         // Red
  background: '#0A0A0F',    // Deep Dark
  surface: '#1A1A2E',       // Dark Purple
  card: '#26264D',          // Royal Card
  text: '#FFFFFF',          // White
  textSecondary: '#E0B0FF', // Light Purple
  textMuted: '#9F8BB3',     // Muted Purple
  border: '#3D3D6B',        // Purple Border
  gold: '#FFD700',          // Pure Gold
  goldLight: '#FFE55C',     // Light Gold
  purpleLight: '#8B6FF6',   // Light Purple
};

const CategoryShopsScreen = ({ navigation, route }) => {
  const { categorySlug, categoryName, categoryId } = route.params;
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://moihub.onrender.com/api/eshop/vendor/categories/${categorySlug}/shops`);
      const data = await response.json();
      
      if (data.success) {
        setShops(data.data);
      } else {
        Alert.alert('Error', 'Failed to fetch shops');
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShops();
    setRefreshing(false);
  };

  const handleShopPress = (shop) => {
    navigation.navigate('ShopProducts', {
      shopSlug: shop.slug,
      shopName: shop.shopName,
      shopId: shop._id,
    });
  };

  const getShopStatus = (shop) => {
    if (!shop.isActive) return { text: 'Inactive', color: ShopColors.error, icon: 'block' };
    if (!shop.isOpen) return { text: 'Closed', color: ShopColors.warning, icon: 'schedule' };
    if (!shop.isApproved) return { text: 'Pending', color: ShopColors.textMuted, icon: 'hourglass-empty' };
    if (new Date(shop.subscriptionEndDate) < new Date()) {
      return { text: 'Expired', color: ShopColors.error, icon: 'event-busy' };
    }
    return { text: 'Open Now', color: ShopColors.success, icon: 'storefront' };
  };

  const getShopIcon = (index) => {
    const icons = [
      'store',
      'shopping-bag',
      'local-mall',
      'storefront',
      'shopping-basket',
      'business',
      'apartment',
      'domain',
    ];
    return icons[index % icons.length];
  };

  const renderShopItem = ({ item, index }) => {
    const status = getShopStatus(item);
    const isAvailable = item.isActive && item.isOpen && item.isApproved && 
                       new Date(item.subscriptionEndDate) > new Date();

    return (
      <Animatable.View 
        animation="fadeInUp" 
        delay={index * 100}
        duration={500}
      >
        <TouchableOpacity
          style={[
            styles.shopCard,
            !isAvailable && styles.unavailableShop
          ]}
          onPress={() => isAvailable && handleShopPress(item)}
          activeOpacity={isAvailable ? 0.9 : 1}
        >
          <LinearGradient
            colors={[ShopColors.card, ShopColors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Gold Accent Line */}
            <View style={styles.cardGoldAccent} />
            
            {/* Decorative Pattern */}
            <View style={styles.cardPattern}>
              <Text style={styles.patternIcon}>👑</Text>
              <Text style={styles.patternIcon}>✨</Text>
            </View>

            <View style={styles.shopHeader}>
              {/* Shop Icon with Gold Border */}
              <View style={styles.shopIconContainer}>
                <LinearGradient
                  colors={[ShopColors.primary, ShopColors.secondary]}
                  style={styles.iconGradient}
                >
                  <Icon name={getShopIcon(index)} size={32} color={ShopColors.gold} />
                </LinearGradient>
              </View>
              
              <View style={styles.shopInfo}>
                <View style={styles.shopTitleRow}>
                  <Text style={styles.shopName} numberOfLines={1}>{item.shopName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                    <Icon name={status.icon} size={12} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                  </View>
                </View>
                
                <Text style={styles.shopDescription} numberOfLines={2}>
                  {item.description || 'Quality products and excellent service'}
                </Text>
                
                <View style={styles.shopMeta}>
                  {item.address && (
                    <View style={styles.metaItem}>
                      <Icon name="location-on" size={14} color={ShopColors.gold} />
                      <Text style={styles.metaText} numberOfLines={1}>{item.address}</Text>
                    </View>
                  )}
                  {item.phoneNumber && (
                    <View style={styles.metaItem}>
                      <Icon name="phone" size={14} color={ShopColors.gold} />
                      <Text style={styles.metaText}>{item.phoneNumber}</Text>
                    </View>
                  )}
                  {item.rating && (
                    <View style={styles.metaItem}>
                      <Icon name="star" size={14} color={ShopColors.gold} />
                      <Text style={styles.metaText}>{item.rating} ★</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {isAvailable ? (
              <View style={styles.shopFooter}>
                <Text style={styles.browseText}>Browse Products</Text>
                <Icon name="arrow-forward" size={20} color={ShopColors.gold} />
              </View>
            ) : (
              <View style={styles.unavailableFooter}>
                <Icon name="lock" size={16} color={ShopColors.textMuted} />
                <Text style={styles.unavailableText}>Currently unavailable</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  const renderHeader = () => (
    <Animatable.View animation="fadeInDown" duration={500}>
      <LinearGradient
        colors={[ShopColors.primary, ShopColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerInfo}
      >
        <View style={styles.categoryHeader}>
          <View style={styles.categoryIconContainer}>
            <Icon name="category" size={28} color={ShopColors.gold} />
          </View>
          <View style={styles.categoryDetails}>
            <Text style={styles.categoryTitle}>{categoryName}</Text>
            <Text style={styles.shopsCount}>
              {shops.length} {shops.length === 1 ? 'shop' : 'shops'} available
            </Text>
          </View>
        </View>
        
        {shops.length > 0 && (
          <View style={styles.filterContainer}>
            <TouchableOpacity style={styles.filterButton}>
              <Icon name="filter-list" size={16} color={ShopColors.gold} />
              <Text style={styles.filterText}>Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Icon name="sort" size={16} color={ShopColors.gold} />
              <Text style={styles.filterText}>Sort</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Gold Glow Effect */}
        <View style={styles.headerGlow} />
      </LinearGradient>
    </Animatable.View>
  );

  if (loading) {
    return (
      <LinearGradient colors={[ShopColors.background, ShopColors.surface]} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={ShopColors.primary} />
        <View style={styles.loadingContainer}>
          <Animatable.View animation="pulse" iterationCount="infinite">
            <View style={styles.loadingIcon}>
              <Icon name="storefront" size={60} color={ShopColors.gold} />
            </View>
          </Animatable.View>
          <ActivityIndicator size="large" color={ShopColors.gold} />
          <Text style={styles.loadingText}>Finding shops in {categoryName}...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[ShopColors.background, ShopColors.surface]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={ShopColors.primary} />
      
      {/* Floating Icons */}
      <View style={styles.floatingIcons}>
        <Text style={[styles.floatingIcon, styles.icon1]}>👑</Text>
        <Text style={[styles.floatingIcon, styles.icon2]}>✨</Text>
        <Text style={[styles.floatingIcon, styles.icon3]}>🛍️</Text>
        <Text style={[styles.floatingIcon, styles.icon4]}>💎</Text>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={shops}
          renderItem={renderShopItem}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.shopsList}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <Animatable.View animation="fadeIn" duration={500} style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Icon name="store" size={60} color={ShopColors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Shops Found</Text>
              <Text style={styles.emptyText}>
                No shops are currently available in the {categoryName} category.
              </Text>
              <Text style={styles.emptySubtext}>
                Check back later or try refreshing.
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchShops}>
                <LinearGradient
                  colors={[ShopColors.primary, ShopColors.secondary]}
                  style={styles.retryGradient}
                >
                  <Icon name="refresh" size={16} color={ShopColors.gold} />
                  <Text style={styles.retryText}>Retry</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animatable.View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  floatingIcons: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  floatingIcon: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.1,
    color: ShopColors.gold,
  },
  icon1: {
    top: '10%',
    right: '5%',
    transform: [{ rotate: '15deg' }],
  },
  icon2: {
    top: '30%',
    left: '5%',
    transform: [{ rotate: '-10deg' }],
  },
  icon3: {
    bottom: '20%',
    right: '10%',
    transform: [{ rotate: '25deg' }],
  },
  icon4: {
    bottom: '40%',
    left: '8%',
    transform: [{ rotate: '-15deg' }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: ShopColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ShopColors.gold + '40',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: ShopColors.textSecondary,
  },
  headerInfo: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: ShopColors.gold + '15',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIconContainer: {
    backgroundColor: ShopColors.gold + '20',
    borderRadius: 16,
    padding: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: ShopColors.gold,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: ShopColors.gold,
    marginBottom: 4,
  },
  shopsCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.gold + '15',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  filterText: {
    fontSize: 14,
    color: ShopColors.gold,
    fontWeight: '600',
    marginLeft: 6,
  },
  shopsList: {
    paddingBottom: 20,
  },
  shopCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  cardGradient: {
    padding: 16,
    position: 'relative',
  },
  cardGoldAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: ShopColors.gold,
  },
  cardPattern: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    opacity: 0.1,
  },
  patternIcon: {
    fontSize: 16,
    marginHorizontal: 1,
  },
  unavailableShop: {
    opacity: 0.7,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  shopIconContainer: {
    marginRight: 12,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ShopColors.gold,
  },
  shopInfo: {
    flex: 1,
  },
  shopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.gold,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    justifyContent: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  shopDescription: {
    fontSize: 13,
    color: ShopColors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  shopMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: ShopColors.textMuted,
    marginLeft: 6,
    flex: 1,
  },
  shopFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ShopColors.gold + '20',
  },
  browseText: {
    fontSize: 14,
    color: ShopColors.gold,
    fontWeight: '600',
  },
  unavailableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ShopColors.gold + '20',
    gap: 6,
  },
  unavailableText: {
    fontSize: 13,
    color: ShopColors.textMuted,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    backgroundColor: ShopColors.card,
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.gold,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: ShopColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: ShopColors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  retryText: {
    color: ShopColors.gold,
    fontWeight: '600',
    fontSize: 14,
  },
});

export default CategoryShopsScreen;
