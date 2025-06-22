// screens/food/FoodScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  StatusBar
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
      duration={600}
    >
      <TouchableOpacity
        style={styles.vendorCard}
        onPress={() => navigation.navigate('FoodVendor', { 
          vendorId: item._id,
          shopName: item.shopName 
        })}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.vendorInfo}>
            <View style={styles.vendorHeader}>
              <Text style={styles.vendorName}>{item.shopName}</Text>
              {item.isOpen ? (
                <View style={styles.statusOpen}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Open</Text>
                </View>
              ) : (
                <View style={styles.statusClosed}>
                  <View style={[styles.statusDot, styles.closedDot]} />
                  <Text style={[styles.statusText, styles.closedText]}>Closed</Text>
                </View>
              )}
            </View>
            
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color="#8DA99F" />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
            
            {item.description && (
              <Text style={styles.vendorDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="#556B66" />
        </View>
      </TouchableOpacity>
    </Animatable.View>
  );



  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#fe5722" />
      


      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#8DA99F" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants, cuisine..."
            placeholderTextColor="#556B66"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#8DA99F" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('MyOrders')}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="receipt-outline" size={20} color="#A7C4A0" />
          </View>
          <Text style={styles.quickActionText}>My Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loadingVendors && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#A7C4A0" />
          <Text style={styles.loadingText}>Finding restaurants near you...</Text>
        </View>
      ) : vendorError ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="restaurant-outline" size={50} color="#E74C3C" />
          </View>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{vendorError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadVendors}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : filteredVendors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="fast-food-outline" size={50} color="#556B66" />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery.length > 0 
              ? 'No restaurants found'
              : 'No restaurants available'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery.length > 0 
              ? 'Try searching with different keywords'
              : 'Check back later for new restaurants'}
          </Text>
          {searchQuery.length > 0 && (
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
          data={filteredVendors}
          renderItem={renderVendorItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#A7C4A0']}
              tintColor="#A7C4A0"
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <Animatable.View 
          animation="slideInUp" 
          duration={300}
          style={styles.floatingCart}
        >
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => navigation.navigate('Order')}
            activeOpacity={0.9}
          >
            <View style={styles.cartInfo}>
              <View style={styles.cartIcon}>
                <Ionicons name="cart" size={20} color="#FFF" />
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </Text>
                </View>
              </View>
              <Text style={styles.cartText}>View Cart</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </Animatable.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'ivory',
  },
  
  // Header Styles
  headerContainer: {
    backgroundColor: '#fe5722',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#fe5722',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
 

  // Search Bar Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FAFAFA',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: '#fe5722',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fe5722',
    fontWeight: '500',
  },
  clearButton: {
    padding: 5,
  },

  // Quick Actions Styles
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  quickActionIcon: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: '#FFF3F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fe5722',
  },

  // List Styles
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  separator: {
    height: 12,
  },

  // Vendor Card Styles
  vendorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#fe5722',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  vendorInfo: {
    flex: 1,
    marginRight: 12,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C2C2C',
    flex: 1,
    marginRight: 10,
  },
  
  // Status Styles
  statusOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusClosed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  closedDot: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  closedText: {
    color: '#F44336',
  },

  // Location and Description Styles
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 5,
    fontWeight: '500',
  },
  vendorDescription: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
    marginTop: 2,
  },

  // Loading States
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  retryButton: {
    backgroundColor: '#fe5722',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#fe5722',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Empty States
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  clearSearchButton: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clearSearchText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '600',
  },

  // Floating Cart Styles
  floatingCart: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fe5722',
    borderRadius: 16,
    shadowColor: '#fe5722',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartIcon: {
    position: 'relative',
    marginRight: 12,
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF8A50',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fe5722',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});


export default FoodScreen;