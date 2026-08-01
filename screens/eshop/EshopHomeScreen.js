// screens/eshop/EshopHomeScreen.js
import React, { useState, useEffect, useCallback } from 'react';
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
  ScrollView,
  Linking,
  Image,
  RefreshControl,
  StatusBar,
  TextInput,
  Keyboard,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { useFocusEffect } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

// Royal Purple & Gold theme colors
const ShopColors = {
  primary: '#6B4EFF',
  secondary: '#9F7AEA',
  accent: '#FFD700',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  background: '#0A0A0F',
  surface: '#1A1A2E',
  card: '#26264D',
  text: '#FFFFFF',
  textSecondary: '#E0B0FF',
  textMuted: '#9F8BB3',
  border: '#3D3D6B',
  gold: '#FFD700',
  goldLight: '#FFE55C',
  purpleLight: '#8B6FF6',
};

const EshopHomeScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ shops: [], products: [] });
  const [isSearching, setIsSearching] = useState(false);
  
  const { cartItems, addToCart } = useCart();

  const API_BASE = 'https://moihub.onrender.com/api/eshop/vendor';

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Cart count is derived from cartItems in the FAB render
    }, [cartItems])
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCategories(),
        fetchTrendingProducts()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTrendingProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/trending?limit=10`);
      const data = await response.json();
      if (data.success) {
        setTrendingProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching trending products:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    Keyboard.dismiss();
    
    if (!searchQuery.trim()) {
      setSearchResults({ shops: [], products: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();
      if (data.success) {
        setSearchResults({
          shops: data.data.shops || [],
          products: data.data.products || []
        });
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ shops: [], products: [] });
    setIsSearching(false);
    Keyboard.dismiss();
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('CategoryShops', {
      categorySlug: category.slug,
      categoryName: category.name,
      categoryId: category._id,
    });
  };

  const handleProductPress = (product) => {
    if (product.shop?.slug) {
      navigation.navigate('ShopProducts', {
        shopSlug: product.shop.slug,
        shopName: product.shop.shopName,
        shopId: product.shop._id,
      });
    }
  };

  const handleShopPress = (shop) => {
    navigation.navigate('ShopProducts', {
      shopSlug: shop.slug,
      shopName: shop.shopName,
      shopId: shop._id,
    });
  };

  const handleAddToCart = (product) => {
    if (!product.shop || !product.shop._id) {
      Alert.alert('Error', 'Shop information missing for this product');
      return;
    }

    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      shopId: product.shop._id,
      shopName: product.shop.shopName,
    });
    
    Alert.alert('Added to Cart', `${product.name} added to your cart`);
  };

  const handleWhatsAppPress = () => {
    const phoneNumber = '+254768610613';
    const message = 'Hi! I need help with the E-Shop in Moihub app.';
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp. Please make sure it is installed.');
    });
  };

  const handleMyOrdersPress = () => {
    navigation.navigate('Orders');
  };

  const handleOnboardingPress = () => {
    navigation.navigate('OnboardingNavigator');
  };

  const getIconName = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('boutique') || name.includes('fashion') || name.includes('clothing')) return 'checkroom';
    if (name.includes('gift') || name.includes('accessories') || name.includes('jewelry')) return 'card-giftcard';
    if (name.includes('food') || name.includes('restaurant') || name.includes('cafe')) return 'restaurant';
    if (name.includes('electronics') || name.includes('gadgets') || name.includes('tech')) return 'devices';
    if (name.includes('home') || name.includes('furniture') || name.includes('decor')) return 'home';
    if (name.includes('pharmacy') || name.includes('medical') || name.includes('health')) return 'local-pharmacy';
    if (name.includes('mali') || name.includes('general') || name.includes('variety')) return 'store';
    if (name.includes('beauty') || name.includes('cosmetics') || name.includes('salon')) return 'face';
    if (name.includes('sports') || name.includes('fitness') || name.includes('gym')) return 'fitness-center';
    if (name.includes('books') || name.includes('stationery') || name.includes('education')) return 'menu-book';
    if (name.includes('auto') || name.includes('car') || name.includes('vehicle')) return 'directions-car';
    if (name.includes('pet') || name.includes('animal')) return 'pets';
    if (name.includes('toy') || name.includes('kids') || name.includes('children')) return 'toys';
    if (name.includes('flower') || name.includes('garden') || name.includes('plant')) return 'local-florist';
    if (name.includes('shoe') || name.includes('footwear')) return 'shopping-bag';
    return 'storefront';
  };

  // ==================== RENDER COMPONENTS ====================

  // 1. Search Bar
  const renderSearchBar = () => (
    <Animatable.View animation="fadeInDown" duration={500}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={24} color={ShopColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products or shops..."
            placeholderTextColor={ShopColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Icon name="close" size={20} color={ShopColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animatable.View>
  );

  // 2. Quick Actions Row
  const renderQuickActions = () => (
    <Animatable.View animation="fadeInUp" delay={200} duration={500}>
      <LinearGradient
        colors={[ShopColors.surface, ShopColors.card]}
        style={styles.quickActionsContainer}
      >
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={handleMyOrdersPress}
        >
          <View style={styles.quickActionIcon}>
            <Icon name="receipt-long" size={24} color={ShopColors.gold} />
          </View>
          <Text style={styles.quickActionText}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={handleWhatsAppPress}
        >
          <View style={styles.quickActionIcon}>
            <Icon name="chat" size={24} color={ShopColors.gold} />
          </View>
          <Text style={styles.quickActionText}>Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('EshopAI')}
        >
          <View style={styles.quickActionIcon}>
            <Icon name="auto-awesome" size={24} color={ShopColors.gold} />
          </View>
          <Text style={styles.quickActionText}>AI Search</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animatable.View>
  );

  // 3. Search Results - Shops + Products
  const renderSearchResults = () => {
    const { shops = [], products = [] } = searchResults;
    
    if (!isSearching && shops.length === 0 && products.length === 0) return null;
    
    if (isSearching) {
      return (
        <View style={styles.searchResultsContainer}>
          <ActivityIndicator size="large" color={ShopColors.gold} />
          <Text style={styles.searchResultsText}>Searching...</Text>
        </View>
      );
    }

    return (
      <View style={styles.searchResultsContainer}>
        {/* Shops Section */}
        {shops.length > 0 && (
          <>
            <View style={styles.searchSectionHeader}>
              <Icon name="storefront" size={16} color={ShopColors.gold} />
              <Text style={styles.searchResultsSectionTitle}>
                Shops ({shops.length})
              </Text>
            </View>
            {shops.map((shop) => (
              <TouchableOpacity
                key={shop._id}
                style={styles.searchShopItem}
                onPress={() => handleShopPress(shop)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: shop.logo || 'https://via.placeholder.com/50' }}
                  style={styles.searchShopImage}
                  resizeMode="cover"
                />
                <View style={styles.searchShopInfo}>
                  <Text style={styles.searchShopName} numberOfLines={1}>
                    {shop.shopName}
                  </Text>
                  <Text style={styles.searchShopCategory}>
                    {shop.category?.name || 'General'}
                  </Text>
                  <View style={styles.searchShopMeta}>
                    <Text style={styles.searchShopProducts}>
                      {shop.productCount || 0} products
                    </Text>
                    <View style={[
                      styles.shopStatusDot,
                      { backgroundColor: shop.isOpen ? ShopColors.success : ShopColors.error }
                    ]} />
                    <Text style={[
                      styles.shopStatusText,
                      { color: shop.isOpen ? ShopColors.success : ShopColors.error }
                    ]}>
                      {shop.isOpen ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={24} color={ShopColors.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Products Section */}
        {products.length > 0 && (
          <>
            <View style={styles.searchSectionHeader}>
              <Icon name="shopping-bag" size={16} color={ShopColors.gold} />
              <Text style={styles.searchResultsSectionTitle}>
                Products ({products.length})
              </Text>
            </View>
            {products.map((product) => (
              <TouchableOpacity
                key={product._id}
                style={styles.searchResultItem}
                onPress={() => handleProductPress(product)}
                activeOpacity={0.7}
              >
                <Image
                  source={{ uri: product.image }}
                  style={styles.searchResultImage}
                  resizeMode="cover"
                />
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.searchResultPrice}>KES {product.price}</Text>
                  <Text style={styles.searchResultShop} numberOfLines={1}>
                    📍 {product.shop?.shopName}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.searchResultAddButton}
                  onPress={() => handleAddToCart(product)}
                >
                  <Icon name="add-shopping-cart" size={20} color={ShopColors.gold} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}

        {shops.length === 0 && products.length === 0 && (
          <View style={styles.searchEmptyContainer}>
            <Icon name="search-off" size={40} color={ShopColors.textMuted} />
            <Text style={styles.searchResultsEmpty}>
              No results found for "{searchQuery}"
            </Text>
            <Text style={styles.searchResultsEmptySub}>
              Try different keywords or browse categories
            </Text>
          </View>
        )}

        {(shops.length > 0 || products.length > 0) && (
          <TouchableOpacity style={styles.searchClearButton} onPress={clearSearch}>
            <Text style={styles.searchClearText}>Clear Results</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 4. Trending Products
  const renderTrendingProducts = () => {
    if (trendingProducts.length === 0) return null;

    return (
      <Animatable.View animation="fadeInUp" delay={300} duration={500}>
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Trending Products</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={trendingProducts}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.trendingCard}
                onPress={() => handleProductPress(item)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.trendingImage}
                  resizeMode="cover"
                />
                <View style={styles.trendingInfo}>
                  <Text style={styles.trendingName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.trendingPrice}>KES {item.price}</Text>
                  <Text style={styles.trendingShop} numberOfLines={1}>
                    {item.shop?.shopName}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.trendingAddButton}
                  onPress={() => handleAddToCart(item)}
                >
                  <Icon name="add-shopping-cart" size={16} color={ShopColors.gold} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.trendingList}
          />
        </View>
      </Animatable.View>
    );
  };

  // 5. Categories - Grid (3 columns with proper sizing)
  const renderCategories = () => {
    if (categories.length === 0) return null;

    const numColumns = 3;
    const gap = 8;
    const horizontalPadding = 32;
    const chipWidth = (width - horizontalPadding - (numColumns - 1) * gap) / numColumns;

    return (
      <Animatable.View animation="fadeInUp" delay={400} duration={500}>
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📂 Shop Categories</Text>
          </View>

          <View style={styles.categoriesGrid}>
            {categories.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={[styles.categoryChip, { width: chipWidth }]}
                onPress={() => handleCategoryPress(item)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[ShopColors.card, ShopColors.surface]}
                  style={styles.categoryChipGradient}
                >
                  <Icon name={getIconName(item.name)} size={18} color={ShopColors.gold} />
                  <Text style={styles.categoryChipText} numberOfLines={1}>
                    {item.name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animatable.View>
    );
  };

  // 6. Want Your Shop Here
  const renderShopHere = () => (
    <Animatable.View animation="fadeInUp" delay={600} duration={500}>
      <View style={styles.shopHereSection}>
        <TouchableOpacity
          style={styles.shopHereCard}
          onPress={handleOnboardingPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[ShopColors.card, ShopColors.surface]}
            style={styles.shopHereGradient}
          >
            <View style={styles.shopHereGoldAccent} />

            <View style={styles.shopHereIconContainer}>
              <LinearGradient
                colors={[ShopColors.primary, ShopColors.secondary]}
                style={styles.shopHereIcon}
              >
                <Icon name="store" size={28} color={ShopColors.gold} />
              </LinearGradient>
            </View>

            <View style={styles.shopHereContent}>
              <Text style={styles.shopHereTitle}>Want Your Shop Here?</Text>
              <Text style={styles.shopHereSubtitle}>
                Join our marketplace and start selling to thousands of customers
              </Text>
            </View>

            <View style={styles.shopHereArrow}>
              <Icon name="arrow-forward" size={20} color={ShopColors.gold} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );

  // 7. Cart FAB - Badge OUTSIDE the gradient
  const renderCartFAB = () => {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    return (
      <Animatable.View
        animation="bounceIn"
        duration={1000}
        delay={800}
        style={styles.fabContainer}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => navigation.navigate('Cart')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[ShopColors.primary, ShopColors.secondary]}
            style={styles.fabGradient}
          >
            <Icon name="shopping-cart" size={28} color={ShopColors.gold} />
          </LinearGradient>
          {totalItems > 0 && (
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeText}>{totalItems}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  // ==================== LOADING STATE ====================
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
          <Text style={styles.loadingText}>Loading your shopping experience...</Text>
        </View>
      </LinearGradient>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <LinearGradient colors={[ShopColors.background, ShopColors.surface]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={ShopColors.primary} />

      {/* Floating Icons - KEPT */}
      <View style={styles.floatingIcons}>
        <Text style={[styles.floatingIcon, styles.icon1]}>👑</Text>
        <Text style={[styles.floatingIcon, styles.icon2]}>✨</Text>
        <Text style={[styles.floatingIcon, styles.icon3]}>🛍️</Text>
        <Text style={[styles.floatingIcon, styles.icon4]}>💎</Text>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[ShopColors.gold]}
              tintColor={ShopColors.gold}
            />
          }
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animatable.View animation="fadeInDown" duration={800}>
            <LinearGradient
              colors={[ShopColors.primary, ShopColors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.header}
            >
              <View style={styles.headerContent}>
                <Icon name="storefront" size={32} color={ShopColors.gold} />
                <Text style={styles.headerTitle}>E-Shop</Text>
              </View>
              <Text style={styles.headerSubtitle}>Discover amazing deals from trusted vendors</Text>
              <View style={styles.headerGlow} />
            </LinearGradient>
          </Animatable.View>

          {/* Search Bar */}
          {renderSearchBar()}

          {/* Quick Actions */}
          {renderQuickActions()}

          {/* Search Results - Shops + Products */}
          {renderSearchResults()}

          {/* Only show other sections if not searching and no results */}
          {!isSearching && searchResults.shops.length === 0 && searchResults.products.length === 0 && (
            <>
              {/* Trending Products */}
              {renderTrendingProducts()}

              {/* Categories */}
              {renderCategories()}

              {/* Want Your Shop Here */}
              {renderShopHere()}
            </>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Cart FAB */}
        {renderCartFAB()}
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
  scrollContent: {
    paddingBottom: 80,
  },
  // Floating Icons - KEPT
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
  // Loading
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
  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: ShopColors.gold,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  headerGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: ShopColors.gold + '10',
  },
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: ShopColors.text,
    paddingVertical: 4,
  },
  // Search Results
  searchResultsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: ShopColors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  searchResultsText: {
    textAlign: 'center',
    color: ShopColors.textSecondary,
    marginTop: 10,
  },
  searchSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  searchResultsSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: ShopColors.gold,
  },
  // Shop Items
  searchShopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  searchShopImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: ShopColors.surface,
  },
  searchShopInfo: {
    flex: 1,
  },
  searchShopName: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
  },
  searchShopCategory: {
    fontSize: 12,
    color: ShopColors.textSecondary,
  },
  searchShopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  searchShopProducts: {
    fontSize: 11,
    color: ShopColors.textMuted,
  },
  shopStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  shopStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  // Product Items
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: ShopColors.surface,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
  },
  searchResultPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: ShopColors.gold,
  },
  searchResultShop: {
    fontSize: 11,
    color: ShopColors.textMuted,
  },
  searchResultAddButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: ShopColors.primary + '20',
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  searchClearButton: {
    alignItems: 'center',
    paddingTop: 10,
  },
  searchClearText: {
    color: ShopColors.textMuted,
    fontSize: 13,
  },
  searchEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  searchResultsEmpty: {
    textAlign: 'center',
    color: ShopColors.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
  searchResultsEmptySub: {
    textAlign: 'center',
    color: ShopColors.textMuted,
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ShopColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 11,
    color: ShopColors.textSecondary,
    fontWeight: '500',
  },
  // Section
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.gold,
  },
  seeAllText: {
    fontSize: 13,
    color: ShopColors.textMuted,
  },
  // Trending Products
  trendingList: {
    paddingRight: 4,
  },
  trendingCard: {
    width: 140,
    backgroundColor: ShopColors.card,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  trendingImage: {
    width: '100%',
    height: 120,
    backgroundColor: ShopColors.surface,
  },
  trendingInfo: {
    padding: 10,
  },
  trendingName: {
    fontSize: 13,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 2,
  },
  trendingPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: ShopColors.gold,
    marginBottom: 2,
  },
  trendingShop: {
    fontSize: 11,
    color: ShopColors.textMuted,
  },
  trendingAddButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ShopColors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  // Categories - Grid (3 columns)
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  categoryChip: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
    marginBottom: 8,
  },
  categoryChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 6,
    minHeight: 48,
  },
  categoryChipText: {
    fontSize: 12,
    color: ShopColors.text,
    fontWeight: '500',
    flexShrink: 1,
  },
  // Want Your Shop Here - KEPT
  shopHereSection: {
    marginHorizontal: 16,
    marginBottom: 30,
  },
  shopHereCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  shopHereGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  shopHereGoldAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: ShopColors.gold,
  },
  shopHereIconContainer: {
    marginRight: 12,
  },
  shopHereIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopHereContent: {
    flex: 1,
  },
  shopHereTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ShopColors.gold,
    marginBottom: 2,
  },
  shopHereSubtitle: {
    fontSize: 12,
    color: ShopColors.textMuted,
    lineHeight: 16,
  },
  shopHereArrow: {
    marginLeft: 8,
  },
  // Cart FAB - Badge outside gradient
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 9999,
    elevation: 15,
    pointerEvents: 'box-none',
  },
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'visible',
    shadowColor: ShopColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
    position: 'relative',
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: ShopColors.error,
    borderRadius: 14,
    minWidth: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2.5,
    borderColor: ShopColors.background,
    zIndex: 10000,
    elevation: 20,
    shadowColor: ShopColors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 80,
  },
});

export default EshopHomeScreen;