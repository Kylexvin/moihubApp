// screens/food/FoodScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFoodContext } from '../../context/FoodContext';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

const FoodScreen = () => {
  const navigation = useNavigation();
  const { vendors, loadingVendors, vendorError, loadVendors, cart } = useFoodContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const filteredVendors = vendors.filter(vendor => 
    vendor.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVendors();
    setRefreshing(false);
  };

  const renderVendorItem = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={500}
    >
      <TouchableOpacity
        style={styles.vendorCard}
        onPress={() => navigation.navigate('FoodVendor', { 
          vendorId: item._id,
          shopName: item.shopName 
        })}
      >
        <View style={styles.vendorImageContainer}>
          {/* Placeholder image, in a real app you'd use the vendor's image */}
          <Image
            source={require('../../assets/image.jpg')}
            style={styles.vendorImage}
            resizeMode="cover"
          />
          {item.isOpen && (
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>Open</Text>
            </View>
          )}
        </View>
        
        <View style={styles.vendorDetails}>
          <Text style={styles.vendorName}>{item.shopName}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
          <Text style={styles.vendorDescription} numberOfLines={2}>
            {item.description || "Delicious food delivered to your door"}
          </Text>
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for food vendors..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* My Orders Button */}
      <TouchableOpacity 
        style={styles.myOrdersButton}
        onPress={() => navigation.navigate('MyOrders')}
      >
        <Ionicons name="receipt-outline" size={18} color="#005f4b" />
        <Text style={styles.myOrdersText}>My Orders</Text>
      </TouchableOpacity>

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

      {/* Content */}
      {loadingVendors && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#005f4b" />
          <Text style={styles.loadingText}>Loading food vendors...</Text>
        </View>
      ) : vendorError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#FF6B6B" />
          <Text style={styles.errorText}>{vendorError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadVendors}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredVendors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="fast-food-outline" size={60} color="#999" />
          <Text style={styles.emptyText}>
            {searchQuery.length > 0 
              ? 'No vendors match your search'
              : 'No food vendors available yet'}
          </Text>
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredVendors}
          renderItem={renderVendorItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#005f4b']}
              tintColor="#005f4b"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9F8',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0EFEC',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  myOrdersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#BDE2D7',
    borderRadius: 8,
    marginBottom: 12,
  },
  myOrdersText: {
    marginLeft: 6,
    color: '#005f4b',
    fontWeight: '600',
  },
  cartIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007d63',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  cartContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartCount: {
    marginLeft: 6,
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  viewCartText: {
    color: '#FFF',
    fontWeight: '500',
  },
  vendorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  vendorImageContainer: {
    position: 'relative',
    height: 160,
    backgroundColor: '#EEE',
  },
  vendorImage: {
    width: '100%',
    height: '100%',
  },
  openBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  openBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  vendorDetails: {
    padding: 12,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
  },
  vendorDescription: {
    color: '#444',
    fontSize: 14,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 12,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  clearSearchText: {
    marginTop: 8,
    color: '#007d63',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
});


export default FoodScreen;