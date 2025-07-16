import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { useCart } from '../../context/CartContext'; // Import cart context

const PharmacyProducts = ({ navigation, route }) => {
  const { pharmacySlug, pharmacyName, pharmacyId } = route.params; // Add pharmacyId to params
  const [products, setProducts] = useState([]);
  const [shopInfo, setShopInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [addingToCart, setAddingToCart] = useState(null);

  // Use cart context instead of local state
  const { cartItems, addToCart, getCartItemQuantity, getTotalQuantity } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/eshop/vendor/shops/${pharmacySlug}/products`);
        
        if (res.data.success) {
          setProducts(res.data.data);
          setShopInfo(res.data.shop);
          setFilteredProducts(res.data.data);
        } else {
          Alert.alert('Error', 'Failed to load products');
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
        Alert.alert('Error', 'Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [pharmacySlug]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // Updated addToCart function to match eshop logic
 // In PharmacyProducts.js
const handleAddToCart = async (product) => {
  if (!product.isAvailable) return;
  
  setAddingToCart(product._id);
  
  try {
    // Debug log to verify shop references
    console.log('Adding product:', {
      productId: product._id,
      shopRef: product.shop,
      shopInfoId: shopInfo._id
    });

    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      shopId: product.shop, // Directly use the shop reference from product
      shopName: shopInfo.name || pharmacyName,
      // Include these if your cart/order system needs them:
      shopSlug: shopInfo.slug,
      productSlug: product.slug
    });
    
    Alert.alert('Added to Cart!', `${product.name} was added to your cart`);
    
  } catch (error) {
    console.error('Cart Error:', {
      error: error.message,
      product: product._id,
      shopRef: product.shop
    });
    Alert.alert('Error', 'Could not add item to cart');
  } finally {
    setAddingToCart(null);
  }
};
  const renderProductCard = ({ item: product }) => {
    const isAddingThis = addingToCart === product._id;
    const itemQuantity = getCartItemQuantity(product._id);

    return (
      <View style={styles.productCard}>
        <Image
          source={{ 
            uri: product.image || 'https://via.placeholder.com/150x150?text=Product' 
          }}
          style={styles.productImage}
          resizeMode="cover"
        />
        
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {product.description}
          </Text>
          
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>KSh {product.price.toLocaleString()}</Text>
            <TouchableOpacity
              style={[
                styles.addButton, 
                !product.isAvailable && styles.disabledButton,
                isAddingThis && styles.addButtonLoading,
                itemQuantity > 0 && styles.addButtonActive
              ]}
              onPress={() => handleAddToCart(product)}
              disabled={!product.isAvailable || isAddingThis}
            >
              {isAddingThis ? (
                <ActivityIndicator size={16} color="#FFFFFF" />
              ) : (
                <>
                  <Icon 
                    name={itemQuantity > 0 ? "add" : "add-shopping-cart"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.addButtonText}>
                    {product.isAvailable ? 'Add' : 'Out of Stock'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.availabilityContainer}>
            <View style={[
              styles.availableDot, 
              { backgroundColor: product.isAvailable ? '#4CAF50' : '#F44336' }
            ]} />
            <Text style={[
              styles.availableText, 
              { color: product.isAvailable ? '#4CAF50' : '#F44336' }
            ]}>
              {product.isAvailable ? 'Available' : 'Out of Stock'}
            </Text>
          </View>

          {/* Show quantity in cart if any */}
          {itemQuantity > 0 && (
            <View style={styles.cartQuantityIndicator}>
              <Text style={styles.cartQuantityText}>
                {itemQuantity} in cart
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#2E7D32" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2E7D32" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pharmacyName}</Text>
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')} // Remove cartItems param since using context
        >
          <Icon name="shopping-cart" size={24} color="#FFFFFF" />
          {getTotalQuantity() > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{getTotalQuantity()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Shop Info */}
      {shopInfo.name && (
        <View style={styles.shopInfo}>
          <View style={styles.shopHeader}>
            <View style={styles.shopIconContainer}>
              <Icon name="storefront" size={24} color="#2E7D32" />
            </View>
            <View style={styles.shopDetails}>
              <Text style={styles.shopName}>{shopInfo.name}</Text>
              {shopInfo.contactNumber && (
                <View style={styles.shopContact}>
                  <Icon name="phone" size={14} color="#666" />
                  <Text style={styles.contactText}>{shopInfo.contactNumber}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for products..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Products List */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          Available Products ({filteredProducts.length})
        </Text>
        
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="inventory" size={60} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No products match your search' : 'No products available'}
            </Text>
            {searchQuery && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearSearchText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductCard}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cartButton: {
    padding: 8,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shopInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopIconContainer: {
    marginRight: 12,
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  shopContact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  productsList: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonActive: {
    backgroundColor: '#4CAF50',
  },
  addButtonLoading: {
    backgroundColor: '#81C784',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  availableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  availableText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cartQuantityIndicator: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  cartQuantityText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  clearSearchButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  clearSearchText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default PharmacyProducts;