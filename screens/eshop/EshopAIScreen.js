// screens/eshop/EshopAIScreen.js
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Dimensions,
  Keyboard,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useCart } from '../../context/CartContext';

const { width } = Dimensions.get('window');

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

const QUICK_SEARCHES = [
  { label: '🍞 Bread', query: 'bread' },
  { label: '📱 Charger', query: 'phone charger' },
  { label: '🧴 Lotion', query: 'lotion under 200' },
  { label: '✏️ Pens', query: 'pens cheap' },
  { label: '🥤 Juice', query: 'juice' },
  { label: '💊 Panadol', query: 'panadol' },
];

// ─── Shop Card ────────────────────────────────────────────────────────────────
const ShopCard = React.memo(({ shop, navigation }) => {
  const handleViewShop = () => {
    navigation.navigate('ShopProducts', {
      shopSlug: shop.slug,
      shopName: shop.shopName,
      shopId: shop._id || shop.shopId,
    });
  };

  return (
    <View style={styles.resultCard}>
      <LinearGradient
        colors={[ShopColors.card, ShopColors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.resultCardGradient}
      >
        <View style={styles.cardGoldAccent} />
        <View style={styles.shopCardBody}>
          <View style={styles.shopLogoContainer}>
            {shop.logo && shop.logo !== 'default-shop.png' ? (
              <Image source={{ uri: shop.logo }} style={styles.shopLogo} />
            ) : (
              <LinearGradient
                colors={[ShopColors.primary, ShopColors.secondary]}
                style={styles.shopLogoPlaceholder}
              >
                <Icon name="store" size={28} color={ShopColors.gold} />
              </LinearGradient>
            )}
            {shop.isOpen && <View style={styles.shopOpenBadge} />}
          </View>
          <View style={styles.shopCardInfo}>
            <Text style={styles.shopCardName}>{shop.shopName}</Text>
            {shop.description ? (
              <Text style={styles.shopCardDescription} numberOfLines={2}>{shop.description}</Text>
            ) : null}
            <View style={styles.shopCardMeta}>
              {shop.address ? (
                <View style={styles.shopMetaRow}>
                  <Icon name="location-on" size={11} color={ShopColors.textMuted} />
                  <Text style={styles.shopMetaText} numberOfLines={1}>{shop.address}</Text>
                </View>
              ) : null}
              {shop.phoneNumber ? (
                <View style={styles.shopMetaRow}>
                  <Icon name="phone" size={11} color={ShopColors.textMuted} />
                  <Text style={styles.shopMetaText}>{shop.phoneNumber}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.viewShopFullButton} onPress={handleViewShop}>
          <LinearGradient
            colors={[ShopColors.primary, ShopColors.secondary]}
            style={styles.viewShopFullGradient}
          >
            <Icon name="store" size={16} color={ShopColors.gold} />
            <Text style={styles.viewShopFullText}>View Shop & Products</Text>
            <Icon name="arrow-forward" size={16} color={ShopColors.gold} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
});

// ─── Product Result Card ──────────────────────────────────────────────────────
const AIProductCard = React.memo(({ item, onAddToCart, isAdding, navigation }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { cartItems } = useCart();

  const itemQuantity = cartItems.find(ci => ci.productId === item.productId)?.quantity || 0;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handleAddToCart = () => {
    if (isAdding) return;
    animatePress();
    onAddToCart(item);
  };

  const handleViewShop = () => {
    if (!item.shop) return;
    navigation.navigate('ShopProducts', {
      shopSlug: item.shop.slug,
      shopName: item.shop.shopName,
      shopId: item.shop.shopId,
    });
  };

  return (
    <Animated.View style={[styles.resultCard, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={[ShopColors.card, ShopColors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.resultCardGradient}
      >
        <View style={styles.cardGoldAccent} />
        {item.badge && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        <View style={styles.resultCardBody}>
          <View style={styles.resultImageContainer}>
            <Image
              source={{ uri: item.image || 'https://via.placeholder.com/100x100?text=Product' }}
              style={styles.resultImage}
            />
            {itemQuantity > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemQuantity}</Text>
              </View>
            )}
          </View>
          <View style={styles.resultInfo}>
            <Text style={styles.resultName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.resultDescription} numberOfLines={2}>{item.description}</Text>
            <View style={styles.resultPriceRow}>
              <Text style={styles.resultPrice}>KSh {item.price?.toLocaleString()}</Text>
              {!item.isAvailable && (
                <View style={styles.outOfStockBadge}>
                  <Text style={styles.outOfStockText}>Out of stock</Text>
                </View>
              )}
            </View>
            {item.shop && (
              <TouchableOpacity style={styles.shopInfoRow} onPress={handleViewShop}>
                <Icon name="store" size={12} color={ShopColors.textMuted} />
                <Text style={styles.shopInfoText} numberOfLines={1}>{item.shop.shopName}</Text>
                {item.shop.isOpen && <View style={styles.openDot} />}
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.resultCTAs}>
          <TouchableOpacity style={styles.viewShopButton} onPress={handleViewShop}>
            <Text style={styles.viewShopText}>View Shop</Text>
          </TouchableOpacity>
          {item.isAvailable && (
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={handleAddToCart}
              disabled={isAdding}
            >
              <LinearGradient
                colors={[ShopColors.primary, ShopColors.secondary]}
                style={styles.addToCartGradient}
              >
                {isAdding ? (
                  <ActivityIndicator size={14} color={ShopColors.gold} />
                ) : (
                  <>
                    <Icon
                      name={itemQuantity > 0 ? 'add' : 'add-shopping-cart'}
                      size={14}
                      color={ShopColors.gold}
                    />
                    <Text style={styles.addToCartText}>
                      {itemQuantity > 0 ? 'Add More' : 'Add to Cart'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const EshopAIScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [addingMap, setAddingMap] = useState({});
  const [inputFocused, setInputFocused] = useState(false);

  const inputRef = useRef(null);
  const { addToCart, cartItems } = useCart();
  const cartTotal = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const search = useCallback(async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q) return;

    Keyboard.dismiss();
    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('https://moihub.onrender.com/api/eshop/orders/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        message: 'Network error. Please check your connection.',
        cards: [],
        shops: [],
        suggestions: [],
      });
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleQuickSearch = useCallback((q) => {
    setQuery(q);
    search(q);
  }, [search]);

  const handleAddToCart = useCallback((item) => {
    if (!item.shop) return;
    setAddingMap(prev => ({ ...prev, [item.productId]: true }));
    addToCart({
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      shopId: item.shop.shopId,
      shopName: item.shop.shopName,
    });
    setTimeout(() => {
      setAddingMap(prev => ({ ...prev, [item.productId]: false }));
    }, 300);
  }, [addToCart]);

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    inputRef.current?.focus();
  };

  const listData = React.useMemo(() => {
    if (!results) return [];
    const items = [];
    if (results.shops?.length > 0) {
      results.shops.forEach(shop => items.push({ _type: 'shop', ...shop }));
    }
    if (results.cards?.length > 0) {
      results.cards.forEach(card => items.push({ _type: 'product', ...card }));
    }
    return items;
  }, [results]);

  const renderItem = useCallback(({ item }) => {
    if (item._type === 'shop') {
      return <ShopCard shop={item} navigation={navigation} />;
    }
    return (
      <AIProductCard
        item={item}
        onAddToCart={handleAddToCart}
        isAdding={!!addingMap[item.productId]}
        navigation={navigation}
      />
    );
  }, [addingMap, handleAddToCart, navigation]);

  const renderEmptyState = () => (
    <Animatable.View animation="fadeInUp" duration={500} style={styles.emptyState}>
      <LinearGradient
        colors={[ShopColors.primary, ShopColors.secondary]}
        style={styles.aiIconContainer}
      >
        <Icon name="auto-awesome" size={40} color={ShopColors.gold} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>AI Product Search</Text>
      <Text style={styles.emptySubtitle}>
        Ask me anything — I'll find products, compare prices, and locate shops for you.
      </Text>
      <View style={styles.examplesContainer}>
        <Text style={styles.examplesLabel}>Try asking:</Text>
        {[
          '"cheap phone charger under 200"',
          '"grace shop"',
          '"snacks affordable"',
          '"hp laptop"',
        ].map((ex, i) => (
          <TouchableOpacity
            key={i}
            style={styles.exampleChip}
            onPress={() => handleQuickSearch(ex.replace(/"/g, ''))}
          >
            <Icon name="search" size={12} color={ShopColors.gold} />
            <Text style={styles.exampleChipText}>{ex}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.quickSearchLabel}>Quick searches</Text>
      <View style={styles.quickSearchRow}>
        {QUICK_SEARCHES.map((qs, i) => (
          <TouchableOpacity
            key={i}
            style={styles.quickChip}
            onPress={() => handleQuickSearch(qs.query)}
          >
            <Text style={styles.quickChipText}>{qs.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animatable.View>
  );

  const renderResultsHeader = () => {
    if (!results) return null;
    return (
      <Animatable.View animation="fadeIn" duration={300} style={styles.resultsHeader}>
        <Text style={styles.resultsMessage}>{results.message}</Text>
        {results.understood && (
          <View style={styles.understoodRow}>
            {results.understood.maxPrice !== 'Any price' && (
              <View style={styles.understoodPill}>
                <Icon name="attach-money" size={12} color={ShopColors.gold} />
                <Text style={styles.understoodPillText}>{results.understood.maxPrice}</Text>
              </View>
            )}
            {results.understood.category !== 'Any' && (
              <View style={styles.understoodPill}>
                <Icon name="category" size={12} color={ShopColors.gold} />
                <Text style={styles.understoodPillText}>{results.understood.category}</Text>
              </View>
            )}
          </View>
        )}
      </Animatable.View>
    );
  };

  const renderSuggestions = () => {
    if (!results?.suggestions?.length) return null;
    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsLabel}>Try also:</Text>
        <View style={styles.suggestionsRow}>
          {results.suggestions.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestionChip}
              onPress={() => handleQuickSearch(s)}
            >
              <Icon name="search" size={12} color={ShopColors.gold} />
              <Text style={styles.suggestionChipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={[ShopColors.background, ShopColors.surface]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={ShopColors.primary} />

      <View style={styles.floatingIcons} pointerEvents="none">
        <Text style={[styles.floatingIcon, styles.icon1]}>👑</Text>
        <Text style={[styles.floatingIcon, styles.icon2]}>✨</Text>
        <Text style={[styles.floatingIcon, styles.icon3]}>🛍️</Text>
        <Text style={[styles.floatingIcon, styles.icon4]}>💎</Text>
      </View>

      <SafeAreaView style={styles.safeArea}>

        {/*
          Header fix:
          - headerWrapper has overflow:hidden + borderRadius — clips the gradient visually
          - LinearGradient (header) has NO overflow:hidden — touches are never clipped
          - Buttons inside are fully tappable
        */}
        <Animatable.View animation="fadeInDown" duration={600} style={styles.headerWrapper}>
          <LinearGradient
            colors={[ShopColors.primary, ShopColors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerGlow} pointerEvents="none" />
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="arrow-back" size={24} color={ShopColors.gold} />
              </TouchableOpacity>

              <View style={styles.headerTitleRow}>
                <Icon name="auto-awesome" size={22} color={ShopColors.gold} />
                <Text style={styles.headerTitle}>AI Search</Text>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate('Cart')}
                style={styles.cartHeaderButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="shopping-cart" size={24} color={ShopColors.gold} />
                {cartTotal > 0 && (
                  <View style={styles.cartHeaderBadge}>
                    <Text style={styles.cartHeaderBadgeText}>{cartTotal}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animatable.View>

        {/* Search Bar */}
        <Animatable.View animation="fadeInDown" delay={150} duration={500} style={styles.searchBarContainer}>
          <View style={[styles.searchBar, inputFocused && styles.searchBarFocused]}>
            <Icon name="search" size={22} color={ShopColors.gold} style={styles.searchBarIcon} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search products, shops, prices..."
              placeholderTextColor={ShopColors.textMuted}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onSubmitEditing={() => search()}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
                <Icon name="close" size={18} color={ShopColors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => search()}
            disabled={loading || !query.trim()}
          >
            <LinearGradient
              colors={query.trim() ? [ShopColors.primary, ShopColors.secondary] : [ShopColors.card, ShopColors.surface]}
              style={styles.searchButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size={20} color={ShopColors.gold} />
              ) : (
                <Icon name="send" size={20} color={ShopColors.gold} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>

        {/* Quick chips */}
        {!results && !loading && (
          <Animatable.View animation="fadeIn" delay={250} duration={400} style={styles.quickChipsRow}>
            {QUICK_SEARCHES.map((qs, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickChip}
                onPress={() => handleQuickSearch(qs.query)}
              >
                <Text style={styles.quickChipText}>{qs.label}</Text>
              </TouchableOpacity>
            ))}
          </Animatable.View>
        )}

        {/* Loading */}
        {loading && (
          <Animatable.View animation="fadeIn" style={styles.loadingContainer}>
            <Animatable.View animation="pulse" iterationCount="infinite">
              <LinearGradient
                colors={[ShopColors.primary, ShopColors.secondary]}
                style={styles.loadingIcon}
              >
                <Icon name="auto-awesome" size={32} color={ShopColors.gold} />
              </LinearGradient>
            </Animatable.View>
            <Text style={styles.loadingText}>Finding the best products for you...</Text>
          </Animatable.View>
        )}

        {/* Results */}
        {!loading && (
          <FlatList
            data={listData}
            keyExtractor={(item, index) =>
              item._type === 'shop'
                ? `shop-${item._id || item.shopId || index}`
                : `product-${item.productId?.toString() || index}`
            }
            renderItem={renderItem}
            ListHeaderComponent={results ? renderResultsHeader : renderEmptyState}
            ListFooterComponent={renderSuggestions}
            ListEmptyComponent={
              results && !loading ? (
                <Animatable.View animation="fadeIn" style={styles.noResultsContainer}>
                  <Icon name="search-off" size={48} color={ShopColors.textMuted} />
                  <Text style={styles.noResultsText}>{results.message}</Text>
                  {results.suggestions?.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.suggestionChip}
                      onPress={() => handleQuickSearch(s)}
                    >
                      <Text style={styles.suggestionChipText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </Animatable.View>
              ) : null
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  floatingIcons: { position: 'absolute', width: '100%', height: '100%', zIndex: 0 },
  floatingIcon: { position: 'absolute', fontSize: 24, opacity: 0.08, color: ShopColors.gold },
  icon1: { top: '10%', right: '5%', transform: [{ rotate: '15deg' }] },
  icon2: { top: '35%', left: '4%', transform: [{ rotate: '-10deg' }] },
  icon3: { bottom: '20%', right: '8%', transform: [{ rotate: '25deg' }] },
  icon4: { bottom: '45%', left: '6%', transform: [{ rotate: '-15deg' }] },

  // overflow:hidden lives here (on wrapper) not on the gradient — this is the fix
  headerWrapper: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    // NO overflow:hidden — buttons inside are fully touchable
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: ShopColors.gold },
  backButton: { padding: 8 },
  cartHeaderButton: { padding: 8, position: 'relative' },
  cartHeaderBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: ShopColors.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ShopColors.background,
  },
  cartHeaderBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  headerGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ShopColors.gold + '10',
  },

  searchBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.card,
    borderRadius: 25,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
    minHeight: 50,
  },
  searchBarFocused: { borderColor: ShopColors.gold, backgroundColor: ShopColors.surface },
  searchBarIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: ShopColors.text,
    fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  clearBtn: { padding: 4 },
  searchButton: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden' },
  searchButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 25 },

  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  quickChip: {
    backgroundColor: ShopColors.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: ShopColors.gold + '25',
  },
  quickChipText: { color: ShopColors.gold, fontSize: 12, fontWeight: '600' },

  listContent: { paddingHorizontal: 16, paddingBottom: 40 },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: { color: ShopColors.textSecondary, fontSize: 15 },

  emptyState: { alignItems: 'center', paddingTop: 20, paddingBottom: 40 },
  aiIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: ShopColors.gold, marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14,
    color: ShopColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  examplesContainer: { width: '100%', marginBottom: 24 },
  examplesLabel: {
    color: ShopColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  exampleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ShopColors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  exampleChipText: { color: ShopColors.textSecondary, fontSize: 13 },
  quickSearchLabel: {
    color: ShopColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
  },
  quickSearchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },

  resultsHeader: { paddingVertical: 12 },
  resultsMessage: { color: ShopColors.textSecondary, fontSize: 14, marginBottom: 8, fontStyle: 'italic' },
  understoodRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  understoodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ShopColors.gold + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ShopColors.gold + '30',
  },
  understoodPillText: { color: ShopColors.gold, fontSize: 11, fontWeight: '600' },

  resultCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  resultCardGradient: { position: 'relative', padding: 14 },
  cardGoldAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 3,
    backgroundColor: ShopColors.gold,
  },

  shopCardBody: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  shopLogoContainer: { position: 'relative' },
  shopLogo: { width: 70, height: 70, borderRadius: 14, backgroundColor: ShopColors.surface },
  shopLogoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopOpenBadge: {
    position: 'absolute',
    bottom: 2, right: 2,
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: ShopColors.success,
    borderWidth: 1.5,
    borderColor: ShopColors.background,
  },
  shopCardInfo: { flex: 1 },
  shopCardName: { fontSize: 16, fontWeight: '800', color: ShopColors.gold, marginBottom: 4 },
  shopCardDescription: { fontSize: 12, color: ShopColors.textSecondary, lineHeight: 16, marginBottom: 6 },
  shopCardMeta: { gap: 3 },
  shopMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopMetaText: { fontSize: 11, color: ShopColors.textMuted, flex: 1 },
  viewShopFullButton: { borderRadius: 16, overflow: 'hidden' },
  viewShopFullGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  viewShopFullText: { color: ShopColors.gold, fontSize: 14, fontWeight: '700' },

  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: ShopColors.gold + '20',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: ShopColors.gold + '40',
  },
  badgeText: { color: ShopColors.gold, fontSize: 11, fontWeight: '700' },
  resultCardBody: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  resultImageContainer: { position: 'relative' },
  resultImage: { width: 90, height: 90, borderRadius: 14, backgroundColor: ShopColors.surface },
  cartBadge: {
    position: 'absolute',
    top: -6, right: -6,
    backgroundColor: ShopColors.primary,
    width: 20, height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: ShopColors.background,
  },
  cartBadgeText: { color: ShopColors.gold, fontSize: 10, fontWeight: 'bold' },
  resultInfo: { flex: 1, justifyContent: 'space-between' },
  resultName: { fontSize: 15, fontWeight: '700', color: ShopColors.gold, lineHeight: 20 },
  resultDescription: { fontSize: 12, color: ShopColors.textSecondary, lineHeight: 16, marginTop: 2 },
  resultPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  resultPrice: { fontSize: 16, fontWeight: '800', color: ShopColors.gold },
  outOfStockBadge: {
    backgroundColor: ShopColors.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  outOfStockText: { color: ShopColors.error, fontSize: 10, fontWeight: '600' },
  shopInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  shopInfoText: { color: ShopColors.textMuted, fontSize: 11, flex: 1 },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ShopColors.success },
  resultCTAs: { flexDirection: 'row', gap: 10 },
  viewShopButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ShopColors.gold + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewShopText: { color: ShopColors.gold, fontSize: 13, fontWeight: '600' },
  addToCartButton: { flex: 1.4, borderRadius: 20, overflow: 'hidden' },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  addToCartText: { color: ShopColors.gold, fontSize: 13, fontWeight: '700' },

  suggestionsContainer: { paddingTop: 8, paddingBottom: 20 },
  suggestionsLabel: { color: ShopColors.textMuted, fontSize: 12, marginBottom: 8 },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ShopColors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ShopColors.gold + '20',
  },
  suggestionChipText: { color: ShopColors.textSecondary, fontSize: 12 },

  noResultsContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  noResultsText: { color: ShopColors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});

export default EshopAIScreen;