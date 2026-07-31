import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  TextInput,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Theme from '../../theme/Theme';

const { width, height } = Dimensions.get('window');

const ProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Animation for search bar
  const searchAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // Animate search bar on focus
  useEffect(() => {
    Animated.spring(searchAnim, {
      toValue: isSearchFocused ? 1 : 0,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  }, [isSearchFocused]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/eshop/vendor/my-products');

      if (response.data.success) {
        setProducts(response.data.data);
        setFilteredProducts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleDeleteProduct = async (productId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`/api/eshop/vendor/product/${productId}`);
              Alert.alert('Success', 'Product deleted successfully');
              fetchProducts();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const handleToggleAvailability = async (productId) => {
    try {
      const response = await axios.patch(
        `/api/eshop/vendor/product/${productId}/toggle`
      );

      if (response.data.success) {
        Alert.alert('Success', response.data.message);
        fetchProducts();
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      Alert.alert('Error', 'Failed to update product availability');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const renderProduct = ({ item }) => (
    <LinearGradient
      colors={['rgba(0, 100, 80, 0.2)', 'rgba(0, 60, 50, 0.3)']}
      style={styles.productCard}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.productPrice}>KSh {item.price}</Text>
        
        <View style={styles.availabilityContainer}>
          <View style={[
            styles.availabilityBadge,
            { backgroundColor: item.isAvailable ? Theme.Colors.success : Theme.Colors.danger }
          ]}>
            <Text style={styles.availabilityText}>
              {item.isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditProduct', { product: item })}
        >
          <Ionicons name="pencil" size={20} color={Theme.Colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleAvailability(item._id)}
        >
          <Ionicons 
            name={item.isAvailable ? "eye-off" : "eye"} 
            size={20} 
            color={Theme.Colors.warning}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteProduct(item._id)}
        >
          <Ionicons name="trash" size={20} color={Theme.Colors.danger} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderEmptyState = () => {
    if (searchQuery.trim() !== '') {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={60} color={Theme.Colors.textTertiary} />
          <Text style={styles.emptyStateText}>No results found</Text>
          <Text style={styles.emptyStateSubtext}>
            Try adjusting your search terms
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Ionicons name="storefront-outline" size={80} color={Theme.Colors.textTertiary} />
        <Text style={styles.emptyStateText}>No products yet</Text>
        <Text style={styles.emptyStateSubtext}>
          Start by adding your first product
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={Theme.Gradients.dark} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.Colors.primary} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Theme.Gradients.dark} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Products</Text>
        <Text style={styles.productCount}>
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Animated.View style={[
          styles.searchWrapper,
          {
            borderColor: searchAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(0, 100, 80, 0.3)', Theme.Colors.primary]
            }),
            borderWidth: searchAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 2]
            }),
          }
        ]}>
          <Ionicons 
            name="search-outline" 
            size={20} 
            color={isSearchFocused ? Theme.Colors.primary : Theme.Colors.textTertiary} 
            style={styles.searchIcon}
          />
          
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Theme.Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={Theme.Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </Animated.View>
        
        {/* Search Results Count */}
        {searchQuery.trim() !== '' && filteredProducts.length > 0 && (
          <Text style={styles.searchResultCount}>
            Found {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </Text>
        )}
      </View>
      
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={Theme.Colors.primary}
            colors={[Theme.Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
      
      {/* FAB Button */}
      <SafeAreaView style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateProduct')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Theme.Colors.primary, Theme.Colors.primaryDark]}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color={Theme.Colors.black} />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 100, 80, 0.2)',
    backgroundColor: 'rgba(0, 60, 50, 0.3)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.Colors.text,
  },
  productCount: {
    fontSize: 14,
    color: Theme.Colors.textSecondary,
    marginTop: 4,
  },
  // Search Styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'rgba(0, 60, 50, 0.15)',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.2)',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Theme.Colors.text,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchResultCount: {
    fontSize: 12,
    color: Theme.Colors.textSecondary,
    marginTop: 6,
    paddingLeft: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  productCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.2)',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: 'rgba(0, 100, 80, 0.1)',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.Colors.text,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: Theme.Colors.textSecondary,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.Colors.primary,
    marginBottom: 8,
  },
  availabilityContainer: {
    flexDirection: 'row',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    color: Theme.Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 100, 80, 0.15)',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
    pointerEvents: 'box-none',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.Colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Theme.Colors.textSecondary,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Theme.Colors.textSecondary,
  },
});

export default ProductsScreen;