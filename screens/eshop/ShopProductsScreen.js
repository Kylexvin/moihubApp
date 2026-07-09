// screens/eshop/ShopProductsScreen.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  TextInput,
  Keyboard,
  Platform,
  ScrollView
  
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useCart } from '../../context/CartContext';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

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
};

// -------------------------------------------------------------------
// ProductCard
// -------------------------------------------------------------------
const ProductCard = React.memo(({ item, onAddToCart, isAdding }) => {
  const { cartItems } = useCart();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const itemQuantity = useMemo(() => {
    const cartItem = cartItems.find(ci => ci.productId === item._id);
    return cartItem?.quantity || 0;
  }, [cartItems, item._id]);

  const animatePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (!item.isAvailable || isAdding) return;
    animatePress();
    onAddToCart(item);
  }, [item, isAdding, animatePress, onAddToCart]);

  return (
    <Animated.View
      style={[
        styles.productCard,
        !item.isAvailable && styles.unavailableProduct,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <LinearGradient
        colors={[ShopColors.card, ShopColors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        <View style={styles.cardGoldAccent} />
        <View style={styles.cardPattern}>
          <Text style={styles.patternIcon}>👑</Text>
          <Text style={styles.patternIcon}>✨</Text>
        </View>

        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/200x200?text=Product' }}
            style={styles.productImage}
            defaultSource={{ uri: 'https://via.placeholder.com/200x200?text=Product' }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.imageGradient}
          />
          {!item.isAvailable && (
            <View style={styles.unavailableBadge}>
              <Icon name="block" size={12} color={ShopColors.gold} />
              <Text style={styles.unavailableText}>Out of Stock</Text>
            </View>
          )}
          {itemQuantity > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemQuantity}</Text>
            </View>
          )}
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.category.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>

          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                name="star"
                size={12}
                color={star <= 4 ? ShopColors.gold : ShopColors.textMuted}
              />
            ))}
            <Text style={styles.ratingText}>(4.0)</Text>
          </View>

          <View style={styles.productFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>KSh {item.price.toLocaleString()}</Text>
              <Text style={styles.originalPrice}>KSh {(item.price * 1.2).toLocaleString()}</Text>
            </View>
            {item.isAvailable && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handlePress}
                disabled={isAdding}
              >
                <LinearGradient
                  colors={[ShopColors.primary, ShopColors.secondary]}
                  style={styles.addButtonGradient}
                >
                  {isAdding ? (
                    <ActivityIndicator size={16} color={ShopColors.gold} />
                  ) : (
                    <Icon
                      name={itemQuantity > 0 ? 'add' : 'add-shopping-cart'}
                      size={16}
                      color={ShopColors.gold}
                    />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

// -------------------------------------------------------------------
// CategoryChips
// -------------------------------------------------------------------
const CategoryChips = React.memo(({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <View style={styles.categoryChipsContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryChipsScroll}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            !selectedCategory && styles.categoryChipSelected
          ]}
          onPress={() => onSelectCategory(null)}
        >
          <Text style={[
            styles.categoryChipText,
            !selectedCategory && styles.categoryChipTextSelected
          ]}>All</Text>
        </TouchableOpacity>
        
        {categories.map((category) => (
          <TouchableOpacity
            key={category._id}
            style={[
              styles.categoryChip,
              selectedCategory === category._id && styles.categoryChipSelected
            ]}
            onPress={() => onSelectCategory(category._id)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category._id && styles.categoryChipTextSelected
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

// -------------------------------------------------------------------
// ShopHeader
// -------------------------------------------------------------------
const ShopHeader = React.memo(({
  shopInfo,
  shopName,
  filteredCount,
  searchQuery,
  searchFocused,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  onClearSearch,
  onScrollToTop,
  searchInputRef,
  categories,
  selectedCategory,
  onSelectCategory,
}) => (
  <>
    <View style={styles.shopHeader}>
      <LinearGradient
        colors={[ShopColors.primary, ShopColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.shopHeaderGradient}
      >
        <View style={styles.shopHeaderContent}>
          <View style={styles.shopTitleRow}>
            <View style={styles.shopTitleContainer}>
              <Icon name="store" size={28} color={ShopColors.gold} />
              <Text style={styles.shopName}>{shopInfo?.name || shopName}</Text>
            </View>
            <TouchableOpacity style={styles.shopStatsHeader} onPress={onScrollToTop}>
              <View style={styles.statItemHeader}>
                <Icon name="inventory" size={16} color={ShopColors.gold} />
                <Text style={styles.statText}>{filteredCount}</Text>
              </View>
            </TouchableOpacity>
          </View>

         


        </View>
        <View style={styles.headerGlow} />
      </LinearGradient>
    </View>

    <View style={styles.searchContainer}>
      <View style={[
        styles.searchInputContainer,
        searchFocused && styles.searchInputContainerFocused,
      ]}>
        <Icon name="search" size={20} color={ShopColors.gold} style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={ShopColors.textMuted}
          value={searchQuery}
          onChangeText={onSearchChange}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={onClearSearch} style={styles.clearButton}>
            <Icon name="close" size={18} color={ShopColors.gold} />
          </TouchableOpacity>
        )}
      </View>

      {searchQuery.length > 0 && (
        <View style={styles.searchResultsInfo}>
          <Text style={styles.searchResultsText}>
            Found {filteredCount} product{filteredCount !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={onClearSearch} style={styles.clearSearchButton}>
            <Text style={styles.clearSearchText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>

    {/* Category Chips */}
    {categories.length > 0 && (
      <CategoryChips
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
      />
    )}
  </>
));

// -------------------------------------------------------------------
// Main Screen
// -------------------------------------------------------------------
const ShopProductsScreen = ({ navigation, route }) => {
  const { shopSlug, shopName, shopId } = route.params;
  const [products, setProducts] = useState([]);
  const [shopInfo, setShopInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingMap, setAddingMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);
  const { cartItems, addToCart } = useCart();
  const flatListRef = useRef(null);

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartTotal(total);
  }, [cartItems]);

  useFocusEffect(
    useCallback(() => {
      const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      setCartTotal(total);
    }, [cartItems])
  );

  // Fetch categories for this shop
  useEffect(() => {
    fetchCategories();
  }, [shopSlug]);

const fetchCategories = async () => {
  try {
    const response = await axios.get(
      `/api/eshop/vendor/shops/${shopSlug}/categories`
    );
    if (response.data.success) {
      setCategories(response.data.data);
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
};

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    if (!products.length) return [];
    
    let filtered = products;
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => 
        product.category?._id === selectedCategory || product.category === selectedCategory
      );
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [products, selectedCategory, searchQuery]);

  // Initial fetch
  useEffect(() => {
    fetchProducts(1);
    StatusBar.setBarStyle('light-content', true);
  }, []);

  // Refetch when category changes
  useEffect(() => {
    if (!loading) {
      fetchProducts(1);
    }
  }, [selectedCategory]);

const fetchProducts = async (page = 1, append = false) => {
  try {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    
    let url = `/api/eshop/vendor/shops/${shopSlug}/products?page=${page}&limit=10`;
    
    if (selectedCategory) {
      url += `&category=${selectedCategory}`;
    }
    
    const response = await axios.get(url);
    
    if (response.data.success) {
      if (append) {
        setProducts(prev => [...prev, ...response.data.data]);
      } else {
        setProducts(response.data.data);
      }
      setShopInfo(response.data.shop);
      setCurrentPage(response.data.currentPage || page);
      setTotalPages(response.data.totalPages || 1);
      setHasMore(page < response.data.totalPages);
    } else {
      Alert.alert('Error', 'Failed to fetch products');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    Alert.alert('Error', 'Network error. Please check your connection.');
  } finally {
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }
};

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await fetchProducts(1);
    setRefreshing(false);
  };

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = currentPage + 1;
      fetchProducts(nextPage, true);
    }
  }, [loadingMore, hasMore, loading, currentPage]);

  const handleAddToCart = useCallback(async (product) => {
    setAddingMap(prev => ({ ...prev, [product._id]: true }));
    try {
      addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        shopId,
        shopName,
      });
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    } finally {
      setAddingMap(prev => ({ ...prev, [product._id]: false }));
    }
  }, [shopId, shopName, addToCart]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, []);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  }, []);

  const renderProductItem = useCallback(({ item }) => (
    <ProductCard
      item={item}
      onAddToCart={handleAddToCart}
      isAdding={!!addingMap[item._id]}
    />
  ), [addingMap, handleAddToCart]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={ShopColors.gold} />
        <Text style={styles.footerLoaderText}>Loading more...</Text>
      </View>
    );
  }, [loadingMore]);

  const headerProps = useMemo(() => ({
    shopInfo,
    shopName,
    filteredCount: filteredProducts.length,
    searchQuery,
    searchFocused,
    onSearchChange: setSearchQuery,
    onSearchFocus: () => setSearchFocused(true),
    onSearchBlur: () => setSearchFocused(false),
    onClearSearch: clearSearch,
    onScrollToTop: scrollToTop,
    searchInputRef,
    categories,
    selectedCategory,
    onSelectCategory: handleCategorySelect,
  }), [shopInfo, shopName, filteredProducts.length, searchQuery, searchFocused, clearSearch, scrollToTop, categories, selectedCategory, handleCategorySelect]);

  const renderHeader = useCallback(() => <ShopHeader {...headerProps} />, [headerProps]);

  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      {searchQuery.length > 0 ? (
        <>
          <View style={styles.emptyIconContainer}>
            <Icon name="search-off" size={60} color={ShopColors.gold} />
          </View>
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptyText}>
            No products match "{searchQuery}". Try different keywords.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={clearSearch}>
            <LinearGradient
              colors={[ShopColors.primary, ShopColors.secondary]}
              style={styles.retryGradient}
            >
              <Icon name="close" size={20} color={ShopColors.gold} />
              <Text style={styles.retryText}>Clear Search</Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.emptyIconContainer}>
            <Icon name="inventory" size={60} color={ShopColors.gold} />
          </View>
          <Text style={styles.emptyTitle}>No Products Available</Text>
          <Text style={styles.emptyText}>
            This shop is currently updating their inventory. Check back soon!
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <LinearGradient
              colors={[ShopColors.primary, ShopColors.secondary]}
              style={styles.retryGradient}
            >
              <Icon name="refresh" size={20} color={ShopColors.gold} />
              <Text style={styles.retryText}>Refresh</Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
    </View>
  ), [searchQuery, clearSearch]);

  if (loading) {
    return (
      <LinearGradient colors={[ShopColors.background, ShopColors.surface]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Animatable.View animation="pulse" iterationCount="infinite">
            <View style={styles.loadingIcon}>
              <Icon name="storefront" size={60} color={ShopColors.gold} />
            </View>
          </Animatable.View>
          <ActivityIndicator size="large" color={ShopColors.gold} />
          <Text style={styles.loadingText}>Discovering amazing products...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[ShopColors.background, ShopColors.surface]} style={styles.container}>
      <StatusBar backgroundColor={ShopColors.primary} barStyle="light-content" />

      <View style={styles.floatingIcons} pointerEvents="none">
        <Text style={[styles.floatingIcon, styles.icon1]}>👑</Text>
        <Text style={[styles.floatingIcon, styles.icon2]}>✨</Text>
        <Text style={[styles.floatingIcon, styles.icon3]}>🛍️</Text>
        <Text style={[styles.floatingIcon, styles.icon4]}>💎</Text>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <AnimatedFlatList
          ref={flatListRef}
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.productsList}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onScrollBeginDrag={Keyboard.dismiss}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={ListEmptyComponent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={6}
          windowSize={7}
          initialNumToRender={6}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
        />

        <View style={styles.cartButtonContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[ShopColors.primary, ShopColors.secondary]}
              style={styles.cartButtonGradient}
            >
              <Icon name="shopping-cart" size={24} color={ShopColors.gold} />
            </LinearGradient>
          </TouchableOpacity>
          {cartTotal > 0 && (
            <View style={styles.cartBadgeFloat}>
              <Text style={styles.cartBadgeFloatText}>{cartTotal}</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, position: 'relative' },
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  loadingText: { marginTop: 15, fontSize: 16, color: ShopColors.textSecondary },
  productsList: { padding: 16, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  
  // Category Chips
  categoryChipsContainer: {
    marginBottom: 16,
  },
  categoryChipsScroll: {
    paddingHorizontal: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: ShopColors.card,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: ShopColors.gold,
    borderColor: ShopColors.gold,
  },
  categoryChipText: {
    fontSize: 13,
    color: ShopColors.textMuted,
  },
  categoryChipTextSelected: {
    color: ShopColors.background,
    fontWeight: '600',
  },
  
  shopHeader: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: ShopColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  shopHeaderGradient: { position: 'relative', overflow: 'hidden' },
  headerGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: ShopColors.gold + '15',
  },
  shopHeaderContent: { padding: 20 },
  shopTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shopTitleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  shopName: {
    fontSize: 22,
    fontWeight: '700',
    color: ShopColors.gold,
    marginLeft: 10,
    flex: 1,
  },
  shopStatsHeader: { alignItems: 'flex-end' },
  statItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.gold + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  statText: { color: ShopColors.gold, fontSize: 12, marginLeft: 4, fontWeight: '600' },
  shopContact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.gold + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  contactText: { color: ShopColors.gold, fontSize: 14, marginLeft: 6, fontWeight: '500' },
  shopStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.gold + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    flex: 0.48,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  searchContainer: { marginBottom: 20, zIndex: 1000 },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.card,
    borderRadius: 25,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
    minHeight: 50,
  },
  searchInputContainerFocused: {
    borderColor: ShopColors.gold,
    backgroundColor: ShopColors.surface,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: ShopColors.text,
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 8,
  },
  clearButton: { padding: 4 },
  searchResultsInfo: {
    marginTop: 8,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchResultsText: { color: ShopColors.gold, fontSize: 12, fontStyle: 'italic' },
  clearSearchButton: {
    backgroundColor: ShopColors.gold + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  clearSearchText: { color: ShopColors.gold, fontSize: 12, fontWeight: '500' },
  productCard: {
    width: ITEM_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  cardGradient: { position: 'relative' },
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
    zIndex: 1,
  },
  patternIcon: { fontSize: 16, marginHorizontal: 1 },
  unavailableProduct: { opacity: 0.6, borderColor: ShopColors.error },
  productImageContainer: { height: 150, position: 'relative' },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 },
  unavailableBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: ShopColors.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ShopColors.gold,
  },
  unavailableText: { color: ShopColors.gold, fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  categoryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: ShopColors.gold + '90',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryBadgeText: {
    color: ShopColors.background,
    fontSize: 9,
    fontWeight: '600',
  },
  cartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: ShopColors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ShopColors.gold,
  },
  cartBadgeText: { color: ShopColors.gold, fontSize: 12, fontWeight: 'bold' },
  productInfo: { padding: 12 },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: ShopColors.gold,
    marginBottom: 4,
    lineHeight: 18,
  },
  productDescription: {
    fontSize: 12,
    color: ShopColors.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingText: { fontSize: 10, color: ShopColors.textMuted, marginLeft: 4 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceContainer: { flex: 1 },
  productPrice: { fontSize: 15, fontWeight: '700', color: ShopColors.gold },
  originalPrice: { fontSize: 10, color: ShopColors.textMuted, textDecorationLine: 'line-through' },
  addButton: { borderRadius: 20, overflow: 'hidden' },
  addButtonGradient: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: ShopColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.gold,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: ShopColors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  retryButton: { borderRadius: 25, overflow: 'hidden' },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: { color: ShopColors.gold, fontSize: 14, fontWeight: '600', marginLeft: 8 },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  footerLoaderText: {
    color: ShopColors.textMuted,
    fontSize: 12,
    marginLeft: 8,
  },
  cartButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 9999,
    elevation: 10,
    width: 56,
    height: 56,
  },
  cartButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: ShopColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  cartButtonGradient: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeFloat: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: ShopColors.error,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: ShopColors.background,
    zIndex: 10000,
    elevation: 11,
  },
  cartBadgeFloatText: { color: ShopColors.text, fontSize: 10, fontWeight: 'bold' },
});

export default ShopProductsScreen;
