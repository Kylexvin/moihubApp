// screens/food/FoodVendorScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import { useFoodContext } from '../../context/FoodContext';
import * as foodApi from '../../services/foodApi';

const FoodVendorScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { vendorId, shopName } = route.params;
  const { addToCart, cart } = useFoodContext();
  
  const [vendor, setVendor] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadVendorDetails = async () => {
    try {
      const response = await foodApi.fetchApprovedVendors();
      const foundVendor = response.vendors.find(v => v._id === vendorId);
      if (foundVendor) {
        setVendor(foundVendor);
      }
    } catch (error) {
      console.error('Error loading vendor details:', error);
      setError('Failed to load vendor details');
    }
  };

  const loadFoodItems = async (page = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setFoodItems([]);
        setCurrentPage(1);
        page = 1;
      }
      
      if (page > totalPages && totalPages !== 1) return;
      
      if (page > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      const response = await foodApi.fetchVendorListings(vendorId, page);
      
      if (response.success) {
        const { listings, pagination } = response;
        
        if (shouldRefresh || page === 1) {
          setFoodItems(listings);
        } else {
          setFoodItems(prevItems => [...prevItems, ...listings]);
        }
        
        setTotalPages(pagination.pages);
        setCurrentPage(page);
      } else {
        setError('Failed to load food items');
      }
    } catch (error) {
      console.error('Error loading food items:', error);
      setError('Failed to load food items. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVendorDetails();
    loadFoodItems();
  }, [vendorId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVendorDetails();
    loadFoodItems(1, true);
  };

  const loadMoreItems = () => {
    if (!loadingMore && currentPage < totalPages) {
      loadFoodItems(currentPage + 1);
    }
  };

  const handleAddToCart = (item) => {
    const result = addToCart(item, 1);
    
    if (!result.success) {
      Alert.alert('Cannot Add Item', result.message);
    } else {
      Alert.alert('Added to Cart', `${item.name} has been added to your cart.`);
    }
  };

  const renderFoodItem = ({ item, index }) => (
    <Animatable.View
      animation="fadeIn"
      delay={index * 100}
      duration={500}
    >
      <TouchableOpacity style={styles.foodCard}>
        <Image
          source={{ uri: item.imageURL || 'https://via.placeholder.com/150' }}
          style={styles.foodImage}
          resizeMode="cover"
        />
        
        <View style={styles.foodDetails}>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.foodDescription} numberOfLines={2}>
            {item.description || 'No description available'}
          </Text>
          <Text style={styles.foodPrice}>Ksh {item.price}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => handleAddToCart(item)}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderVendorHeader = () => (
    <>
      {vendor && (
        <View style={styles.vendorHeader}>

          
          <View style={styles.vendorInfo}>
            <Text style={styles.vendorName}>{vendor.shopName}</Text>
            {vendor.isOpen ? (
              <View style={styles.openBadge}>
                <Text style={styles.openBadgeText}>Open</Text>
              </View>
            ) : (
              <View style={[styles.openBadge, styles.closedBadge]}>
                <Text style={styles.openBadgeText}>Closed</Text>
              </View>
            )}
            
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.locationText}>{vendor.location}</Text>
            </View>
            
            {vendor.description && (
              <Text style={styles.vendorDescription}>
                {vendor.description}
              </Text>
            )}
          </View>
        </View>
      )}
      
      <View style={styles.menuHeader}>
        <Text style={styles.menuTitle}>Menu</Text>
        <View style={styles.menuDivider} />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Cart Indicator */}
      {cart.length > 0 && (
        <TouchableOpacity 
          style={styles.cartIndicator}
          onPress={() => navigation.navigate('Order')}
        >
          <View style={styles.cartContent}>
            <Ionicons name="cart-outline" size={20} color="#FFF" />
            <Text style={styles.cartCount}>{cart.reduce((total, item) => total + item.quantity, 0)}</Text>
          </View>
          <Text style={styles.viewCartText}>View Cart</Text>
        </TouchableOpacity>
      )}

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#004d40" />
          <Text style={styles.loadingText}>Loading menu items...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : foodItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={60} color="#999" />
          <Text style={styles.emptyText}>No menu items available</Text>
        </View>
      ) : (
        <FlatList
          data={foodItems}
          renderItem={renderFoodItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={renderVendorHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#004d40']}
              tintColor="#004d40"
            />
          }
          onEndReached={loadMoreItems}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#004d40" />
                <Text style={styles.loadingMoreText}>Loading more items...</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'ivory',
  },
  cartIndicator: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    zIndex: 10,
    // backgroundColor: '#004d40', 
    backgroundColor: '#fe5722', // deep emerald green
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
  },
  cartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  cartCount: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  viewCartText: {
    color: '#fff',
    fontSize: 12,
  },
  vendorHeader: {
    backgroundColor: '#e0f2f1', // a very light teal/emerald tint
    padding: 15,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 10,
  },
 
  vendorInfo: {
    paddingHorizontal: 5,
  },
  vendorName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#004d40',
  },
  openBadge: {
    backgroundColor: '#004d40',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  closedBadge: {
    backgroundColor: '#b0bec5',
  },
  openBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    color: '#004d40',
    marginLeft: 5,
    fontSize: 14,
  },
  vendorDescription: {
    fontSize: 14,
    color: '#004d40',
    marginTop: 4,
  },
  menuHeader: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#004d40',
  },
  menuDivider: {
    height: 2,
    backgroundColor: '#fe5722',
    width: 80,
    marginTop: 6,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  foodCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#004d40',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  foodImage: {
    width: 110,
    height: 110,
  },
  foodDetails: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  foodName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#004d40',
  },
  foodDescription: {
    fontSize: 13,
    color: '#616161',
    marginVertical: 4,
  },
  foodPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00796b', // slightly lighter emerald accent
  },
  addButton: {
    backgroundColor: '#fe5722',
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#004d40',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff5252',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#004d40',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  loadingMoreContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 6,
    color: '#004d40',
    fontSize: 14,
  },
});

export default FoodVendorScreen;
