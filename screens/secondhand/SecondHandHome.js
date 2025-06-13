import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
  Animated,
} from 'react-native';


const API_URL = 'https://markethubbackend.onrender.com/api/products/approved';
const LOGIN_URL = 'https://markethub-mocha.vercel.app/login';
const SIGNUP_URL = 'https://markethub-mocha.vercel.app/register';
const CACHE_KEY = 'marketplace_products';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const SecondHandHome = () => {
  const [products, setProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const ITEMS_PER_PAGE = 10;

  // Cache management
  const getCachedData = () => {
    try {
      const cached = global.marketplaceCache;
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    } catch (error) {
      console.log('Cache read error:', error);
    }
    return null;
  };

  const setCachedData = (data) => {
    try {
      global.marketplaceCache = {
        data,
        timestamp: Date.now()
      };
    } catch (error) {
      console.log('Cache write error:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Try cache first
      const cachedData = getCachedData();
      if (cachedData) {
        setProducts(cachedData);
        setDisplayProducts(cachedData.slice(0, ITEMS_PER_PAGE));
        setLoading(false);
        return;
      }

      const response = await fetch(API_URL);
      const json = await response.json();
      const productsData = json.products || [];
      
      setProducts(productsData);
      setDisplayProducts(productsData.slice(0, ITEMS_PER_PAGE));
      setCachedData(productsData);
      
      setHasMore(productsData.length > ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Connection Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sellerId.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Update display when search changes
  useEffect(() => {
    const filtered = filteredProducts.slice(0, ITEMS_PER_PAGE);
    setDisplayProducts(filtered);
    setPage(1);
    setHasMore(filteredProducts.length > ITEMS_PER_PAGE);
  }, [filteredProducts]);

  // Load more items (infinite scroll)
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
      const endIndex = nextPage * ITEMS_PER_PAGE;
      const newItems = filteredProducts.slice(startIndex, endIndex);
      
      if (newItems.length > 0) {
        setDisplayProducts(prev => [...prev, ...newItems]);
        setPage(nextPage);
        setHasMore(endIndex < filteredProducts.length);
      } else {
        setHasMore(false);
      }
      
      setLoadingMore(false);
    }, 500);
  }, [filteredProducts, page, loadingMore, hasMore]);

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleWhatsApp = (phone, productName) => {
    const message = `Hey! I'm interested in "${productName}" from your marketplace listing. Is it still available? 🛍️`;
    const whatsappUrl = `whatsapp://send?phone=+254${phone.replace(/^0/, '')}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(whatsappUrl).then((supported) => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('WhatsApp not installed', 'Please install WhatsApp to contact the seller');
      }
    });
  };

  const handleCall = (phone) => {
    const phoneUrl = `tel:${phone}`;
    Linking.canOpenURL(phoneUrl).then((supported) => {
      if (supported) {
        Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Cannot make calls', 'Your device does not support phone calls');
      }
    });
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedItems[item._id];
    
    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.image} />
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>KSh {item.price}</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{item.name}</Text>
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => toggleExpanded(item._id)}
            >
              <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.description} numberOfLines={isExpanded ? undefined : 2}>
            {item.description}
          </Text>
          
       
          
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>@{item.sellerId.username}</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.whatsappButton]}
              onPress={() => handleWhatsApp(item.sellerId.phone, item.name)}
            >
              <Text style={styles.buttonIcon}>💬</Text>
              <Text style={styles.buttonText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.callButton]}
              onPress={() => handleCall(item.sellerId.phone)}
            >
              <Text style={styles.buttonIcon}>📞</Text>
              <Text style={styles.buttonText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#FF6B6B" />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Finding amazing deals... ✨</Text>
      </View>
    );
  }

return (
  <View style={styles.container}>
    <View style={styles.header}>
      {/* Add these buttons */}
      <View style={styles.authButtons}>
        <TouchableOpacity onPress={() => Linking.openURL(LOGIN_URL)}>
          <Text style={styles.authText}>Log in to Sell</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>|</Text>
        <TouchableOpacity onPress={() => Linking.openURL(SIGNUP_URL)}>
          <Text style={styles.authText}>Create Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products, sellers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#A0AEC0"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>

    <FlatList
      data={displayProducts}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      ListFooterComponent={renderFooter}
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      windowSize={10}
    />
  </View>
);
};

export default SecondHandHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  authButtons: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 8,
},

authText: {
  color: '#2B6CB0',
  fontWeight: 'bold',
  fontSize: 14,
},

separator: {
  marginHorizontal: 8,
  color: '#718096',
},

  header: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D3748',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
  },
  clearButton: {
    padding: 5,
  },
  clearIcon: {
    fontSize: 14,
    color: '#A0AEC0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#718096',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  priceTag: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  priceText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cardContent: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    flex: 1,
  },
  expandButton: {
    padding: 5,
  },
  expandIcon: {
    fontSize: 12,
    color: '#718096',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
    marginBottom: 15,
  },
  expandedContent: {
    backgroundColor: '#F7FAFC',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '500',
  },
  sellerInfo: {
    marginBottom: 20,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4C51BF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  callButton: {
    backgroundColor: '#4299E1',
  },
  buttonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#718096',
  },
});