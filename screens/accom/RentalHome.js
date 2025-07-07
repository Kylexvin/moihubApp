import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const API_URL = 'https://moihub.onrender.com/api';

const RentalHome = ({ navigation }) => {
  const { token, isAuthenticated } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    location: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    vacancyStatus: '',
  });
  
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // Rental types and locations for filter dropdown
  const rentalTypes = ['bedsitter', 'one-bedroom', 'two-bedroom'];
  const vacancyStatuses = [
  { label: 'All', value: '' },
  { label: 'Vacant (Voted)', value: 'vacant' },
  { label: 'Occupied (Voted)', value: 'occupied' },
  { label: 'Vacant (Admin)', value: 'admin_vacant' },
  { label: 'Occupied (Admin)', value: 'admin_occupied' },
  { label: 'Unverified', value: 'unverified' }
];

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/rentals?page=${page}&limit=10`);
      if (response.data.success) {
        setRentals(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching rentals:', error);
      Alert.alert('Error', 'Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

const normalizeFilter = (key, value) => {
  if (typeof value !== 'string') return value;

  switch (key) {
    case 'type':
      return value.toLowerCase();
    case 'vacancyStatus':
      switch (value.toLowerCase()) {
        case 'vacant': return 'verified_vacant';
        case 'occupied': return 'verified_occupied';
        case 'admin_vacant': return 'admin_verified_vacant';
        case 'admin_occupied': return 'admin_verified_occupied';
        case 'unverified': return 'unverified';
        default: return value;
      }
    default:
      return value.trim();
  }
};


const searchRentals = async (query = '', appliedFilters = {}) => {
  if (!query.trim() && Object.keys(appliedFilters).length === 0) {
    fetchRentals(); // fallback to all
    return;
  }

  try {
    setIsSearching(true);

    const params = {
      page: 1,
      limit: 10,
    };

    if (query && query.trim()) {
      params.q = query.trim();
    }

    Object.keys(appliedFilters).forEach(key => {
      const raw = appliedFilters[key];
      if (raw !== undefined && raw.toString().trim() !== '') {
        params[key] = normalizeFilter(key, raw);
      }
    });

    console.log('🔍 Search params:', params);

    const response = await axios.get(`${API_URL}/rentals/search`, { params });

    if (response.data.success) {
      setRentals(response.data.data);
      setPagination(response.data.pagination);
    }

  } catch (error) {
    console.error('Search error:', error);
    Alert.alert('Error', error.response?.data?.message || 'Search failed');
  } finally {
    setIsSearching(false);
  }
};


  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    setFilters({
      location: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      vacancyStatus: '',
    });
    await fetchRentals();
    setRefreshing(false);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    
    // Get active filters
    const activeFilters = getActiveFilters();
    
    // Perform search with current query and filters
    if (text.length > 0 || Object.keys(activeFilters).length > 0) {
      searchRentals(text, activeFilters);
    } else {
      fetchRentals();
    }
  };

  const getActiveFilters = () => {
    const activeFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key].toString().trim() !== '') {
        activeFilters[key] = filters[key];
      }
    });
    return activeFilters;
  };

  const handleCreateRental = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please log in to create a rental listing',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    navigation.navigate('CreateRental');
  };

  const applyFilters = () => {
    setShowFilterModal(false);
    
    const activeFilters = getActiveFilters();
    console.log('Applying filters:', activeFilters);
    
    // Search with current query and new filters
    searchRentals(searchQuery, activeFilters);
  };

  const resetFilters = () => {
    setFilters({
      location: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      vacancyStatus: '',
    });
    setSearchQuery('');
    setShowFilterModal(false);
    fetchRentals();
  };

  const clearSearch = () => {
    setSearchQuery('');
    const activeFilters = getActiveFilters();
    if (Object.keys(activeFilters).length > 0) {
      searchRentals('', activeFilters);
    } else {
      fetchRentals();
    }
  };

  const getVacancyStatusColor = (rental) => {
    // If admin has confirmed the status
    if (rental.adminOverride?.isActive) {
      return rental.hasVacant ? '#4CAF50' : '#F44336';
    }
    
    // If community voting is active
    if (rental.voteStats?.totalVotes > 0) {
      const vacantRatio = rental.voteStats.vacantVotes / rental.voteStats.totalVotes;
      if (vacantRatio > 0.6) return '#8BC34A';
      if (vacantRatio < 0.4) return '#FF7043';
      return '#FF9800';
    }
    
    return '#9E9E9E';
  };

  const getVacancyStatusText = (rental) => {
    // If admin has confirmed the status
    if (rental.adminOverride?.isActive) {
      return rental.hasVacant ? 'Available ✓' : 'Occupied ✓';
    }
    
    // If community voting is active
    if (rental.voteStats?.totalVotes > 0) {
      const vacantRatio = rental.voteStats.vacantVotes / rental.voteStats.totalVotes;
      if (vacantRatio > 0.6) return 'Likely Available';
      if (vacantRatio < 0.4) return 'Likely Occupied';
      return 'Status Disputed';
    }
    
    return 'Unverified';
  };

  const getStatusIcon = (rental) => {
    // If admin has confirmed the status
    if (rental.adminOverride?.isActive) {
      return rental.hasVacant ? 'checkmark-circle' : 'close-circle';
    }
    
    // If community voting is active
    if (rental.voteStats?.totalVotes > 0) {
      const vacantRatio = rental.voteStats.vacantVotes / rental.voteStats.totalVotes;
      if (vacantRatio > 0.6) return 'checkmark-circle-outline';
      if (vacantRatio < 0.4) return 'close-circle-outline';
      return 'help-circle-outline';
    }
    
    return 'help-circle-outline';
  };

  const renderStatusInfo = (rental) => {
    // If admin has confirmed the status
    if (rental.adminOverride?.isActive) {
      return (
        <View style={styles.statusInfo}>
          <View style={styles.statusHeader}>
            <Ionicons name="shield-checkmark" size={14} color="#4CAF50" />
            <Text style={styles.statusInfoText}>Admin Verified</Text>
          </View>
          <Text style={styles.statusInfoDetail}>
            Confirmed: {new Date(rental.adminOverride.timestamp).toLocaleDateString()}
          </Text>
          {rental.adminOverride.reason && (
            <Text style={styles.statusInfoDetail}>
              Note: {rental.adminOverride.reason}
            </Text>
          )}
        </View>
      );
    }
    
    // If community voting is active
    if (rental.voteStats?.totalVotes > 0) {
      const vacantRatio = rental.voteStats.vacantVotes / rental.voteStats.totalVotes;
      return (
        <View style={styles.statusInfo}>
          <View style={styles.statusHeader}>
            <Ionicons name="people" size={14} color="#2196F3" />
            <Text style={styles.statusInfoText}>Community Votes</Text>
          </View>
          <Text style={styles.statusInfoDetail}>
            {rental.voteStats.vacantVotes} say vacant, {rental.voteStats.occupiedVotes} say occupied
          </Text>
          <Text style={styles.statusInfoDetail}>
            Confidence: {Math.round(Math.max(vacantRatio, 1 - vacantRatio) * 100)}%
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.statusInfo}>
        <View style={styles.statusHeader}>
          <Ionicons name="help-circle" size={14} color="#9E9E9E" />
          <Text style={styles.statusInfoText}>Status Unverified</Text>
        </View>
        <Text style={styles.statusInfoDetail}>
          Community voting needed
        </Text>
      </View>
    );
  };

  const renderRentalItem = ({ item }) => (
    <TouchableOpacity
      style={styles.rentalCard}
      onPress={() => navigation.navigate('RentalDetail', { rentalId: item._id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.rentalName}>{item.name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getVacancyStatusColor(item) }
        ]}>
          <Ionicons 
            name={getStatusIcon(item)} 
            size={14} 
            color="white" 
            style={{ marginRight: 4 }} 
          />
          <Text style={styles.statusText}>
            {getVacancyStatusText(item)}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="home-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.type}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.priceText}>KSh {item.amount.toLocaleString()}</Text>
        </View>

        {renderStatusInfo(item)}
      </View>
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Rentals</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
            {/* Location Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Location</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Enter location (e.g., Stage, Chebarus)"
                value={filters.location}
                onChangeText={(text) => setFilters({ ...filters, location: text })}
              />
            </View>

            {/* Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Property Type</Text>
              <View style={styles.typeOptions}>
                {rentalTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      filters.type === type && styles.selectedTypeOption
                    ]}
                    onPress={() => setFilters({ ...filters, type: filters.type === type ? '' : type })}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      filters.type === type && styles.selectedTypeOptionText
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Price Range (KSh)</Text>
              <View style={styles.priceRange}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChangeText={(text) => setFilters({ ...filters, minPrice: text })}
                  keyboardType="numeric"
                />
                <Text style={styles.priceSeparator}>-</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChangeText={(text) => setFilters({ ...filters, maxPrice: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Vacancy Status Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Vacancy Status</Text>
              <View style={styles.statusOptions}>
                {vacancyStatuses.map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.statusOption,
                      filters.vacancyStatus === status.value && styles.selectedStatusOption
                    ]}
                    onPress={() => setFilters({ 
                      ...filters, 
                      vacancyStatus: filters.vacancyStatus === status.value ? '' : status.value 
                    })}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      filters.vacancyStatus === status.value && styles.selectedStatusOptionText
                    ]}>
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Active Filters Display */}
            {Object.keys(getActiveFilters()).length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Active Filters</Text>
                <View style={styles.activeFilters}>
                  {Object.entries(getActiveFilters()).map(([key, value]) => (
                    <View key={key} style={styles.activeFilter}>
                      <Text style={styles.activeFilterText}>
                        {key === 'vacancyStatus' 
                          ? vacancyStatuses.find(s => s.value === value)?.label || value
                          : `${key}: ${value}`
                        }
                      </Text>
                      <TouchableOpacity
                        onPress={() => setFilters({ ...filters, [key]: '' })}
                        style={styles.removeFilter}
                      >
                        <Ionicons name="close-circle" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading rentals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location, name, or type..."
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
          {isSearching && (
            <ActivityIndicator size="small" color="#2196F3" />
          )}
          <TouchableOpacity
            style={[
              styles.filterButton,
              Object.keys(getActiveFilters()).length > 0 && styles.filterButtonActive
            ]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter-outline" size={20} color="#666" />
            {Object.keys(getActiveFilters()).length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {Object.keys(getActiveFilters()).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Results Info */}
      {(searchQuery || Object.keys(getActiveFilters()).length > 0) && (
        <View style={styles.searchInfo}>
          <Text style={styles.searchInfoText}>
            {searchQuery && `Search: "${searchQuery}"`}
            {searchQuery && Object.keys(getActiveFilters()).length > 0 && ' • '}
            {Object.keys(getActiveFilters()).length > 0 && 
              `${Object.keys(getActiveFilters()).length} filter(s) applied`
            }
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setFilters({
                location: '',
                type: '',
                minPrice: '',
                maxPrice: '',
                vacancyStatus: '',
              });
              fetchRentals();
            }}
            style={styles.clearAllButton}
          >
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Rentals List */}
      <FlatList
        data={rentals}
        renderItem={renderRentalItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No rentals found</Text>
            <Text style={styles.emptySubText}>
              {searchQuery || Object.keys(getActiveFilters()).length > 0 
                ? 'Try adjusting your search or filters' 
                : 'Pull to refresh'
              }
            </Text>
          </View>
        }
      />

      {/* Pagination Info */}
      {pagination.total > 0 && (
        <View style={styles.paginationContainer}>
          <Text style={styles.paginationText}>
            Showing {rentals.length} of {pagination.total} rentals
          </Text>
        </View>
      )}

      {/* Filter Modal */}
      {renderFilterModal()}

      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateRental}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
    marginLeft: 5,
  },
  filterButton: {
    marginLeft: 10,
    padding: 5,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#2196F3',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e8f5e8',
    borderBottomWidth: 1,
    borderBottomColor: '#c8e6c9',
  },
  searchInfoText: {
    fontSize: 14,
    color: '#2e7d32',
    flex: 1,
  },
  clearAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  clearAllText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  rentalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rentalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statusInfo: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusInfoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
  },
  statusInfoDetail: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 2,
  },
  adminLockInfo: {
    backgroundColor: '#f3e5f5',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  adminLockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminLockText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9C27B0',
  },
  adminLockReason: {
    fontSize: 11,
    color: '#7B1FA2',
    marginTop: 2,
  },
  adminLockDate: {
    fontSize: 10,
    color: '#7B1FA2',
    marginTop: 1,
  },
  voteStats: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  voteText: {
    fontSize: 12,
    color: '#888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  paginationContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paginationText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  selectedTypeOption: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedTypeOptionText: {
    color: '#fff',
  },
  statusOptions: {
    flexDirection: 'column',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  selectedStatusOption: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedStatusOptionText: {
    color: '#fff',
  },
  priceRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  priceSeparator: {
    fontSize: 16,
    color: '#666',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    color: '#1976d2',
  },
  removeFilter: {
    padding: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});
export default RentalHome;  