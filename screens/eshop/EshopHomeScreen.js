// screens/eshop/EshopHomeScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Linking,
  Image,
  RefreshControl,
  StatusBar,
  TextInput,
  Keyboard,
  Animated,
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

// ==================== TOAST COMPONENT ====================
const Toast = ({ message, visible }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
        ]).start();
      }, 1600);

      return () => clearTimeout(timer);
    }
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toastContainer,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.toastContent}>
        <Icon name="check-circle" size={18} color={ShopColors.success} />
        <Text style={styles.toastText} numberOfLines={1}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// ==================== SKELETON COMPONENTS ====================
const SkeletonBlock = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return <Animated.View style={[styles.skeletonBase, style, { opacity }]} />;
};

const TrendingSkeleton = () => (
  <View style={styles.trendingList}>
    {[1, 2, 3].map((i) => (
      <View key={i} style={styles.trendingCard}>
        <SkeletonBlock style={{ width: '100%', height: 120 }} />
        <View style={{ padding: 10 }}>
          <SkeletonBlock style={{ width: '80%', height: 12, marginBottom: 6 }} />
          <SkeletonBlock style={{ width: '50%', height: 12, marginBottom: 6 }} />
          <SkeletonBlock style={{ width: '60%', height: 10 }} />
        </View>
      </View>
    ))}
  </View>
);

const CategorySkeleton = () => {
  const numColumns = 2;
  const gap = 12;
  const horizontalPadding = 32;
  const cardWidth = (width - horizontalPadding - gap) / numColumns;

  return (
    <View style={styles.categoriesGrid}>
      {[1, 2, 3, 4].map((i) => (
        <SkeletonBlock key={i} style={{ width: cardWidth, height: 110, borderRadius: 12, marginBottom: 12 }} />
      ))}
    </View>
  );
};

const PlatformBannerSkeleton = () => (
  <SkeletonBlock style={{ width: '100%', height: 128, borderRadius: 16 }} />
);

const EshopHomeScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [platformProducts, setPlatformProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [errors, setErrors] = useState({ categories: false, trending: false, platform: false });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ shops: [], products: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '' });

  const { cartItems, addToCart } = useCart();

  
  const API_BASE = 'https://moihub.onrender.com/api/eshop/vendor';

  // Search is only "active" once the user has actually typed and submitted something
  const isSearchActive = searchQuery.trim().length > 0;

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {}, [cartItems])
  );

  const showToast = (message) => {
    setToast({ visible: false, message: '' });
    // re-trigger on next tick so repeated adds still animate
    requestAnimationFrame(() => setToast({ visible: true, message }));
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchCategories(),
      fetchTrendingProducts(),
      fetchPlatformProducts(),
    ]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      setErrors((prev) => ({ ...prev, categories: false }));
      const response = await fetch(`${API_BASE}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      } else {
        setErrors((prev) => ({ ...prev, categories: true }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setErrors((prev) => ({ ...prev, categories: true }));
    }
  };

  const fetchTrendingProducts = async () => {
    try {
      setErrors((prev) => ({ ...prev, trending: false }));
      const response = await fetch(`${API_BASE}/trending?limit=10`);
      const data = await response.json();
      if (data.success) {
        setTrendingProducts(data.data);
      } else {
        setErrors((prev) => ({ ...prev, trending: true }));
      }
    } catch (error) {
      console.error('Error fetching trending products:', error);
      setErrors((prev) => ({ ...prev, trending: true }));
    }
  };

const fetchPlatformProducts = async () => {
  try {
    setErrors((prev) => ({ ...prev, platform: false }));
    const response = await fetch(`${API_BASE}/platform-products?limit=6`);
    
    // If 404, it means no platform shop or closed - just hide it
    if (response.status === 404) {
      setPlatformProducts([]);
      setErrors((prev) => ({ ...prev, platform: false }));
      return;
    }
    
    const data = await response.json();
    if (data.success) {
      setPlatformProducts(data.data);
    } else {
      // Only set error if it's not a "not found" case
      if (data.message?.toLowerCase().includes('not found')) {
        setPlatformProducts([]);
        setErrors((prev) => ({ ...prev, platform: false }));
      } else {
        setErrors((prev) => ({ ...prev, platform: true }));
      }
    }
  } catch (error) {
    console.error('Error fetching platform products:', error);
    
    setPlatformProducts([]);
    setErrors((prev) => ({ ...prev, platform: false }));
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
    setSearchError(false);
    try {
      const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();
      if (data.success) {
        setSearchResults({
          shops: data.data.shops || [],
          products: data.data.products || [],
        });
      } else {
        setSearchError(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(true);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ shops: [], products: [] });
    setIsSearching(false);
    setSearchError(false);
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
      showToast('Unable to add — shop info missing');
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

    showToast(`${product.name} added to cart`);
  };

  const handleWhatsAppPress = () => {
    const phoneNumber = '+254768610613';
    const message = 'Hi! I need help with the E-Shop in Moihub app.';
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      showToast('Unable to open WhatsApp');
    });
  };

  const handleMyOrdersPress = () => {
    navigation.navigate('Orders');
  };

  const handleOnboardingPress = () => {
    navigation.navigate('OnboardingNavigator');
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
        <TouchableOpacity style={styles.quickActionButton} onPress={handleMyOrdersPress}>
          <View style={styles.quickActionIcon}>
            <Icon name="receipt-long" size={24} color={ShopColors.gold} />
          </View>
          <Text style={styles.quickActionText}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionButton} onPress={handleWhatsAppPress}>
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

  // 3. Search Results - Shops + Products (only rendered while isSearchActive)
  const renderSearchResults = () => {
    const { shops = [], products = [] } = searchResults;

    if (isSearching) {
      return (
        <View style={styles.searchResultsContainer}>
          <ActivityIndicator size="large" color={ShopColors.gold} />
          <Text style={styles.searchResultsText}>Searching...</Text>
        </View>
      );
    }

    if (searchError) {
      return (
        <View style={styles.searchResultsContainer}>
          <View style={styles.errorState}>
            <Icon name="error-outline" size={36} color={ShopColors.error} />
            <Text style={styles.errorStateText}>Couldn't complete the search</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleSearch}>
              <Icon name="refresh" size={16} color={ShopColors.gold} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const hasResults = shops.length > 0 || products.length > 0;

    return (
      <View style={styles.searchResultsContainer}>
        {shops.length > 0 && (
          <>
            <View style={styles.searchSectionHeader}>
              <Icon name="storefront" size={16} color={ShopColors.gold} />
              <Text style={styles.searchResultsSectionTitle}>Shops ({shops.length})</Text>
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
                    <View
                      style={[
                        styles.shopStatusDot,
                        { backgroundColor: shop.isOpen ? ShopColors.success : ShopColors.error },
                      ]}
                    />
                    <Text
                      style={[
                        styles.shopStatusText,
                        { color: shop.isOpen ? ShopColors.success : ShopColors.error },
                      ]}
                    >
                      {shop.isOpen ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={24} color={ShopColors.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {products.length > 0 && (
          <>
            <View style={styles.searchSectionHeader}>
              <Icon name="shopping-bag" size={16} color={ShopColors.gold} />
              <Text style={styles.searchResultsSectionTitle}>Products ({products.length})</Text>
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

        {!hasResults && (
          <View style={styles.searchEmptyContainer}>
            <Icon name="search-off" size={40} color={ShopColors.textMuted} />
            <Text style={styles.searchResultsEmpty}>No results found for "{searchQuery}"</Text>
            <Text style={styles.searchResultsEmptySub}>
              Try different keywords or browse categories
            </Text>
            <TouchableOpacity style={styles.searchClearButton} onPress={clearSearch}>
              <Text style={styles.searchClearText}>Back to home</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasResults && (
          <TouchableOpacity style={styles.searchClearButton} onPress={clearSearch}>
            <Text style={styles.searchClearText}>Clear Results</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 4. Platform Store Section
  const renderPlatformStore = () => {
    if (loading) return <PlatformBannerSkeleton />;

  if (errors.platform) {
    return (
      <View style={styles.errorState}>
        <Icon name="error-outline" size={28} color={ShopColors.error} />
        <Text style={styles.errorStateText}>Couldn't load the official store</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPlatformProducts}>
          <Icon name="refresh" size={16} color={ShopColors.gold} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (platformProducts.length === 0) return null;

    return (
      <Animatable.View animation="fadeInUp" delay={250} duration={500}>
        <View style={styles.platformBannerContainer}>
          <TouchableOpacity
            style={styles.platformBanner}
            onPress={() => {
              if (platformProducts[0]?.shop) {
                handleShopPress(platformProducts[0].shop);
              }
            }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#6B4EFF', '#9F7AEA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.platformBannerGradient}
            >
              <View style={styles.platformBannerContent}>
                <View style={styles.platformBannerBadge}>
                  <Icon name="verified" size={14} color={ShopColors.gold} />
                  <Text style={styles.platformBannerBadgeText}>Official Store</Text>
                </View>
                <Text style={styles.platformBannerTitle}>Moihub Official Store</Text>
                <Text style={styles.platformBannerSubtitle}>
                  Trusted products • Verified quality • Fast delivery
                </Text>
                <View style={styles.platformBannerCTA}>
                  <Text style={styles.platformBannerCTAText}>Shop Now</Text>
                  <Icon name="arrow-forward" size={18} color={ShopColors.gold} />
                </View>
              </View>
              <View style={styles.platformBannerIcon}>
                <Icon name="storefront" size={50} color={ShopColors.gold} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    );
  };

  // 5. Trending Products
  const renderTrendingProducts = () => {
    if (loading) {
      return (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Products</Text>
          </View>
          <TrendingSkeleton />
        </View>
      );
    }

    if (errors.trending) {
      return (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Products</Text>
          </View>
          <View style={styles.errorState}>
            <Icon name="error-outline" size={28} color={ShopColors.error} />
            <Text style={styles.errorStateText}>Couldn't load trending products</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTrendingProducts}>
              <Icon name="refresh" size={16} color={ShopColors.gold} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (trendingProducts.length === 0) return null;

    return (
      <Animatable.View animation="fadeInUp" delay={300} duration={500}>
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Products</Text>
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
                <View style={styles.trendingImageWrapper}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.trendingImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.trendingAddButton}
                    onPress={() => handleAddToCart(item)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Icon name="add-shopping-cart" size={16} color={ShopColors.gold} />
                  </TouchableOpacity>
                </View>
                <View style={styles.trendingInfo}>
                  <Text style={styles.trendingName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.trendingPrice}>KES {item.price}</Text>
                  <Text style={styles.trendingShop} numberOfLines={1}>
                    {item.shop?.shopName}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.trendingList}
          />
        </View>
      </Animatable.View>
    );
  };

  // 6. Categories - 2-Column Grid with Images
  const renderCategories = () => {
    const numColumns = 2;
    const gap = 12;
    const horizontalPadding = 32;
    const cardWidth = (width - horizontalPadding - gap) / numColumns;

    if (loading) {
      return (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop Categories</Text>
          </View>
          <CategorySkeleton />
        </View>
      );
    }

    if (errors.categories) {
      return (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop Categories</Text>
          </View>
          <View style={styles.errorState}>
            <Icon name="error-outline" size={28} color={ShopColors.error} />
            <Text style={styles.errorStateText}>Couldn't load categories</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
              <Icon name="refresh" size={16} color={ShopColors.gold} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (categories.length === 0) return null;

    return (
      <Animatable.View animation="fadeInUp" delay={400} duration={500}>
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop Categories</Text>
          </View>

          <View style={styles.categoriesGrid}>
            {categories.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={[styles.categoryCard, { width: cardWidth }]}
                onPress={() => handleCategoryPress(item)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: item.image || 'https://via.placeholder.com/400x200' }}
                  style={styles.categoryCardImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
                  locations={[0, 0.5, 1]}
                  style={styles.categoryCardGradient}
                >
                  <Text style={styles.categoryCardName}>{item.name}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animatable.View>
    );
  };

  // 7. Want Your Shop Here
  const renderShopHere = () => (
    <Animatable.View animation="fadeInUp" delay={600} duration={500}>
      <View style={styles.shopHereSection}>
        <TouchableOpacity
          style={styles.shopHereCard}
          onPress={handleOnboardingPress}
          activeOpacity={0.8}
        >
          <LinearGradient colors={[ShopColors.card, ShopColors.surface]} style={styles.shopHereGradient}>
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

  // 8. Cart FAB
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
          <LinearGradient colors={[ShopColors.primary, ShopColors.secondary]} style={styles.fabGradient}>
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

          {renderSearchBar()}
          {renderQuickActions()}

          {isSearchActive ? (
            renderSearchResults()
          ) : (
            <>
              {renderPlatformStore()}
              {renderTrendingProducts()}
              {renderCategories()}
              {renderShopHere()}
            </>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {renderCartFAB()}
        <Toast message={toast.message} visible={toast.visible} />
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
  icon1: { top: '10%', right: '5%', transform: [{ rotate: '15deg' }] },
  icon2: { top: '30%', left: '5%', transform: [{ rotate: '-10deg' }] },
  icon3: { bottom: '20%', right: '10%', transform: [{ rotate: '25deg' }] },
  icon4: { bottom: '40%', left: '8%', transform: [{ rotate: '-15deg' }] },
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
  searchShopInfo: { flex: 1 },
  searchShopName: { fontSize: 14, fontWeight: '600', color: ShopColors.text },
  searchShopCategory: { fontSize: 12, color: ShopColors.textSecondary },
  searchShopMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  searchShopProducts: { fontSize: 11, color: ShopColors.textMuted },
  shopStatusDot: { width: 6, height: 6, borderRadius: 3 },
  shopStatusText: { fontSize: 10, fontWeight: '500' },
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
  searchResultInfo: { flex: 1 },
  searchResultName: { fontSize: 14, fontWeight: '600', color: ShopColors.text },
  searchResultPrice: { fontSize: 13, fontWeight: '700', color: ShopColors.gold },
  searchResultShop: { fontSize: 11, color: ShopColors.textMuted },
  searchResultAddButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: ShopColors.primary + '20',
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  searchClearButton: { alignItems: 'center', paddingTop: 10 },
  searchClearText: { color: ShopColors.textMuted, fontSize: 13 },
  searchEmptyContainer: { alignItems: 'center', paddingVertical: 20 },
  searchResultsEmpty: { textAlign: 'center', color: ShopColors.textMuted, fontSize: 14, marginTop: 8 },
  searchResultsEmptySub: {
    textAlign: 'center',
    color: ShopColors.textMuted,
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  // Error state (shared)
  errorState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  errorStateText: {
    color: ShopColors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: ShopColors.primary + '20',
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  retryButtonText: {
    color: ShopColors.gold,
    fontSize: 13,
    fontWeight: '600',
  },
  // Skeletons
  skeletonBase: {
    backgroundColor: ShopColors.card,
    borderRadius: 8,
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
  quickActionButton: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ShopColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionText: { fontSize: 11, color: ShopColors.textSecondary, fontWeight: '500' },
  // Section
  sectionContainer: { marginHorizontal: 16, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: ShopColors.gold },
  // Platform Banner
  platformBannerContainer: { marginHorizontal: 16, marginBottom: 20 },
  platformBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ShopColors.gold + '40',
  },
  platformBannerGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformBannerContent: { flex: 1 },
  platformBannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: ShopColors.gold + '40',
  },
  platformBannerBadgeText: { fontSize: 10, color: ShopColors.gold, fontWeight: '600' },
  platformBannerTitle: { fontSize: 20, fontWeight: '700', color: ShopColors.gold, marginBottom: 4 },
  platformBannerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  platformBannerCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  platformBannerCTAText: { fontSize: 14, fontWeight: '600', color: ShopColors.gold },
  platformBannerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,215,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
    marginLeft: 12,
  },
  // Trending Products
  trendingList: { paddingRight: 4 },
  trendingCard: {
    width: 140,
    backgroundColor: ShopColors.card,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  trendingImageWrapper: {
    width: '100%',
    height: 120,
    position: 'relative',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
    backgroundColor: ShopColors.surface,
  },
  trendingInfo: {
    padding: 10,
  },
  trendingName: { fontSize: 13, fontWeight: '600', color: ShopColors.text, marginBottom: 2 },
  trendingPrice: { fontSize: 14, fontWeight: '700', color: ShopColors.gold, marginBottom: 2 },
  trendingShop: { fontSize: 11, color: ShopColors.textMuted },
  // Add-to-cart now floats on the image, never over text
  trendingAddButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(10,10,15,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ShopColors.gold + '50',
  },
  // Categories
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: ShopColors.card,
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
    height: 110,
    position: 'relative',
  },
  categoryCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  categoryCardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 12,
    minHeight: 50,
    justifyContent: 'flex-end',
  },
  categoryCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Want Your Shop Here - KEPT
  shopHereSection: { marginHorizontal: 16, marginBottom: 30 },
  shopHereCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: ShopColors.gold + '30' },
  shopHereGradient: { flexDirection: 'row', alignItems: 'center', padding: 16, position: 'relative' },
  shopHereGoldAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: ShopColors.gold,
  },
  shopHereIconContainer: { marginRight: 12 },
  shopHereIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  shopHereContent: { flex: 1 },
  shopHereTitle: { fontSize: 16, fontWeight: '700', color: ShopColors.gold, marginBottom: 2 },
  shopHereSubtitle: { fontSize: 12, color: ShopColors.textMuted, lineHeight: 16 },
  shopHereArrow: { marginLeft: 8 },
  // Cart FAB
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
  fabGradient: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
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
  fabBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  bottomPadding: { height: 80 },
  // Toast
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10001,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ShopColors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ShopColors.gold + '40',
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  toastText: {
    color: ShopColors.text,
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
});

export default EshopHomeScreen;