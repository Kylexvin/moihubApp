// screens/eshop/ShopProductsScreen.js
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
  Image,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCart } from '../../context/CartContext';

const { width, height } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

const ShopProductsScreen = ({ navigation, route }) => {
  const { shopSlug, shopName, shopId } = route.params;
  const [products, setProducts] = useState([]);
  const [shopInfo, setShopInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingToCart, setAddingToCart] = useState(null);
  const [scrollY] = useState(new Animated.Value(0));

  const { cartItems, addToCart, getCartItemQuantity, getTotalQuantity } = useCart();

  useEffect(() => {
    fetchProducts();
    // Set status bar to light content for dark theme
    StatusBar.setBarStyle('light-content', true);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://moihub.onrender.com/api/eshop/vendor/shops/${shopSlug}/products`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
        setShopInfo(data.shop);
      } else {
        Alert.alert('Error', 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleAddToCart = async (product) => {
    if (!product.isAvailable) return;
    
    setAddingToCart(product._id);
    
    try {
      addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        shopId: shopId,
        shopName: shopName,
      });
      
      // Enhanced success feedback with haptic
      Alert.alert('Added to Cart! 🛒', `${product.name} has been added to your cart`);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const formatPrice = (price) => {
    return `KSh ${price.toLocaleString()}`;
  };

  const ProductCard = ({ item, index }) => {
    const isAddingThis = addingToCart === item._id;
    const itemQuantity = getCartItemQuantity(item._id);
    const [scaleAnim] = useState(new Animated.Value(1));

    const animatePress = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    };

    return (
      <Animated.View
        style={[
          styles.productCard,
          !item.isAvailable && styles.unavailableProduct,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{ 
              uri: item.image || 'https://via.placeholder.com/200x200?text=Product'
            }}
            style={styles.productImage}
            defaultSource={{ uri: 'https://via.placeholder.com/200x200?text=Product' }}
          />
          
          {/* Gradient overlay for better text readability */}
          <View style={styles.imageGradient} />
          
          {!item.isAvailable && (
            <View style={styles.unavailableBadge}>
              <Icon name="block" size={12} color="#fff" />
              <Text style={styles.unavailableText}>Out of Stock</Text>
            </View>
          )}
          
          {itemQuantity > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemQuantity}</Text>
            </View>
          )}

          {/* Quick view button */}
          <TouchableOpacity 
            style={styles.quickViewButton}
            onPress={() => {/* Navigate to product details */}}
          >
            {/* <Icon name="visibility" size={16} color="#fff" /> */}
          </TouchableOpacity>
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          {/* Rating stars (mock data - replace with actual ratings) */}
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon 
                key={star} 
                name="star" 
                size={12} 
                color={star <= 4 ? "#fbbf24" : "#4b5563"} 
              />
            ))}
            <Text style={styles.ratingText}>(4.0)</Text>
          </View>
          
          <View style={styles.productFooter}>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>
                {formatPrice(item.price)}
              </Text>
              {/* Mock discount - replace with actual discount data */}
              <Text style={styles.originalPrice}>
                KSh {(item.price * 1.2).toLocaleString()}
              </Text>
            </View>
            
            {item.isAvailable && (
              <TouchableOpacity
                style={[
                  styles.addButton,
                  isAddingThis && styles.addButtonLoading,
                  itemQuantity > 0 && styles.addButtonActive
                ]}
                onPress={() => {
                  animatePress();
                  handleAddToCart(item);
                }}
                disabled={isAddingThis}
              >
                {isAddingThis ? (
                  <ActivityIndicator size={16} color="#fff" />
                ) : (
                  <Icon 
                    name={itemQuantity > 0 ? "add" : "add-shopping-cart"} 
                    size={16} 
                    color="#fff" 
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderProductItem = ({ item, index }) => (
    <ProductCard item={item} index={index} />
  );

  const renderHeader = () => {
    const headerTranslateY = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [0, -50],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View 
        style={[
          styles.shopHeader,
          { transform: [{ translateY: headerTranslateY }] }
        ]}
      >
        <View style={styles.shopHeaderContent}>
          <View style={styles.shopTitleContainer}>
            <Icon name="store" size={24} color="#10b981" />
            <Text style={styles.shopName}>{shopInfo?.name || shopName}</Text>
          </View>
          
          {shopInfo?.contactNumber && (
            <TouchableOpacity style={styles.shopContact}>
              <Icon name="phone" size={16} color="#6ee7b7" />
              <Text style={styles.contactText}>{shopInfo.contactNumber}</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.shopStats}>
            <View style={styles.statItem}>
              <Icon name="inventory" size={16} color="#6ee7b7" />
              <Text style={styles.statText}>
                {products.length} Products
              </Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="local-shipping" size={16} color="#6ee7b7" />
              <Text style={styles.statText}>Free Delivery</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Discovering amazing products...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#064e3b" barStyle="light-content" />
      
      <Animated.FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.productsList}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inventory" size={80} color="#374151" />
            <Text style={styles.emptyTitle}>No Products Available</Text>
            <Text style={styles.emptyText}>
              This shop is currently updating their inventory. Check back soon!
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.retryText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Enhanced Floating Cart Button */}
      <TouchableOpacity
        style={styles.cartButton}
        onPress={() => navigation.navigate('Cart')}
        activeOpacity={0.8}
      >
        <Icon name="shopping-cart" size={24} color="#fff" />
        {getTotalQuantity() > 0 && (
          <Animated.View style={styles.cartBadgeFloat}>
            <Text style={styles.cartBadgeFloatText}>
              {getTotalQuantity()}
            </Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Dark slate background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  productsList: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shopHeader: {
    backgroundColor: '#064e3b', // Dark emerald
    borderRadius: 16,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  shopHeaderContent: {
    padding: 20,
  },
  shopTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
    flex: 1,
  },
  shopContact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  contactText: {
    color: '#6ee7b7',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  shopStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flex: 0.48,
  },
  statText: {
    color: '#a7f3d0',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  productCard: {
    width: ITEM_WIDTH,
    backgroundColor: '#1e293b', // Dark card background
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  unavailableProduct: {
    opacity: 0.6,
    borderColor: '#ef4444',
  },
  productImageContainer: {
    height: 150,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  },
  unavailableBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unavailableText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickViewButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 4,
    lineHeight: 18,
  },
  productDescription: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
    lineHeight: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 10,
    color: '#94a3b8',
    marginLeft: 4,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  originalPrice: {
    fontSize: 10,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  addButton: {
    backgroundColor: '#10b981',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButtonLoading: {
    backgroundColor: '#6b7280',
  },
  addButtonActive: {
    backgroundColor: '#059669',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  cartButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#10b981',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  cartBadgeFloat: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  cartBadgeFloatText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ShopProductsScreen;