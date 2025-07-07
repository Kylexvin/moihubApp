import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const baseURL = Platform.OS === 'ios' 
  ? 'http://localhost:5000' 
  : 'https://moihub.onrender.com';

const ListingsScreen = ({ navigation }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    isActive: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loadingMore, setLoadingMore] = useState(false);

// Fetch listings from API (fixed version)
const fetchListings = useCallback(async (page = 1, shouldReset = false) => {
  try {
    if (page === 1) {
      shouldReset ? setRefreshing(true) : setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const limit = pagination.limit;

    // Build params and remove empty filters
    const rawParams = {
      page,
      limit,
      ...filters
    };

    const params = {};
    for (const key in rawParams) {
      if (
        rawParams[key] !== '' &&
        rawParams[key] !== null &&
        rawParams[key] !== undefined
      ) {
        params[key] = rawParams[key];
      }
    }

    const response = await axios.get('/api/food/listings/vendor', { params });

    const { listings: newListings, pagination: newPagination } = response.data;

    if (page === 1) {
      setListings(newListings);
    } else {
      setListings(prev => [...prev, ...newListings]);
    }

    setPagination(newPagination);
  } catch (error) {
    console.error('Error fetching listings:', error?.response?.data || error.message);
    Alert.alert('Error', 'Failed to fetch listings. Please try again.');
  } finally {
    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  }
}, [filters, pagination.limit]);

  // Initial load
useEffect(() => {
  fetchListings(1, true);
}, [fetchListings]);
useEffect(() => {
  const test = async () => {
    const res = await axios.get('/api/food/listings/vendor');
    console.log('Listings:', res.data);
  };
  test();
}, []);

  // Apply filters
  const applyFilters = () => {
    setFilterModalVisible(false);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchListings(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      category: '',
      isActive: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  // Toggle listing status
  const toggleListingStatus = async (listingId, currentStatus) => {
    try {
      await axios.patch(`${baseURL}/api/food/listings/${listingId}/toggle-status`);

      // Update local state
      setListings(prev =>
        prev.map(listing =>
          listing._id === listingId
            ? { ...listing, isActive: !currentStatus }
            : listing
        )
      );

      Alert.alert(
        'Success',
        `Listing ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      console.error('Error toggling listing status:', error);
      Alert.alert('Error', 'Failed to update listing status');
    }
  };

  // Delete listing
  const deleteListing = async (listingId) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${baseURL}/api/food/listings/${listingId}`);

              // Remove from local state
              setListings(prev => prev.filter(listing => listing._id !== listingId));
              Alert.alert('Success', 'Listing deleted successfully');
            } catch (error) {
              console.error('Error deleting listing:', error);
              Alert.alert('Error', 'Failed to delete listing');
            }
          }
        }
      ]
    );
  };

  // Load more listings
  const loadMoreListings = () => {
    if (pagination.page < pagination.pages && !loadingMore) {
      fetchListings(pagination.page + 1);
    }
  };

  // Refresh listings
  const onRefresh = () => {
    fetchListings(1, true);
  };

  // Navigate to add listing
  const navigateToAddListing = () => {
    navigation.navigate('AddListing');
  };

  // Navigate to listing details
  const navigateToListingDetails = (listing) => {
    navigation.navigate('ListingDetails', { listing });
  };

  // Navigate to edit listing
  const navigateToEditListing = (listing) => {
    navigation.navigate('EditListing', { listing });
  };

  // Render listing item
  const renderListingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listingCard}
      onPress={() => navigateToListingDetails(item)}
    >
      <View style={styles.listingImageContainer}>
        <Image
          source={{ uri: item.imageURL }}
          style={styles.listingImage}
          defaultSource={require('../../../assets/moihublogo.png')}
        />
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.isActive ? '#4caf50' : '#f44336' }
        ]}>
          <Text style={styles.statusText}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.listingInfo}>
        <Text style={styles.listingName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.listingPrice}>
          KES {item.price.toLocaleString()}
        </Text>
        <Text style={styles.listingCategory}>
          {item.category}
        </Text>
        <Text style={styles.listingDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.listingActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => toggleListingStatus(item._id, item.isActive)}
        >
          <Ionicons
            name={item.isActive ? 'pause-circle' : 'play-circle'}
            size={24}
            color={item.isActive ? '#f44336' : '#4caf50'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigateToEditListing(item)}
        >
          <Ionicons name="create" size={24} color="#2196f3" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => deleteListing(item._id)}
        >
          <Ionicons name="trash" size={24} color="#f44336" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>No listings yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Add your first listing to get started
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={navigateToAddListing}
      >
        <Text style={styles.addButtonText}>Add Listing</Text>
      </TouchableOpacity>
    </View>
  );

  // Filter Modal
  const FilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Listings</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Enter category"
              value={filters.category}
              onChangeText={(text) => setFilters(prev => ({ ...prev, category: text }))}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.isActive === '' && styles.filterOptionActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, isActive: '' }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.isActive === '' && styles.filterOptionTextActive
                ]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.isActive === 'true' && styles.filterOptionActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, isActive: 'true' }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.isActive === 'true' && styles.filterOptionTextActive
                ]}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.isActive === 'false' && styles.filterOptionActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, isActive: 'false' }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.isActive === 'false' && styles.filterOptionTextActive
                ]}>Inactive</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.sortBy === 'createdAt' && styles.filterOptionActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, sortBy: 'createdAt' }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.sortBy === 'createdAt' && styles.filterOptionTextActive
                ]}>Date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.sortBy === 'name' && styles.filterOptionActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, sortBy: 'name' }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.sortBy === 'name' && styles.filterOptionTextActive
                ]}>Name</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.sortBy === 'price' && styles.filterOptionActive
                ]}
                onPress={() => setFilters(prev => ({ ...prev, sortBy: 'price' }))}
              >
                <Text style={[
                  styles.filterOptionText,
                  filters.sortBy === 'price' && styles.filterOptionTextActive
                ]}>Price</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Loading listings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Listings</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="filter" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addListingButton}
            onPress={navigateToAddListing}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={listings}
        renderItem={renderListingItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreListings}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#4caf50" />
            </View>
          ) : null
        }
        contentContainerStyle={listings.length === 0 && styles.emptyContainer}
      />

      <FilterModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  addListingButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listingCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  listingImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  listingImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listingInfo: {
    marginBottom: 12,
  },
  listingName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
    marginBottom: 4,
  },
  listingCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  listingDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 18,
  },
  listingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterOptionActive: {
    backgroundColor: '#4caf50',
  },
  filterOptionText: {
    color: '#666',
    fontSize: 14,
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4caf50',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ListingsScreen;