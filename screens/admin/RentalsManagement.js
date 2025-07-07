import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const TABS = {
  ALL: 'all',
  PENDING: 'pending',
  APPROVED: 'approved'
};

const VACANCY_STATUS = {
  VERIFIED_VACANT: 'verified_vacant',
  VERIFIED_OCCUPIED: 'verified_occupied',
  UNVERIFIED: 'unverified'
};

const RentalsManagement = ({ navigation }) => {
  const { currentUser } = useAuth();
  
  // Core state
  const [allRentals, setAllRentals] = useState([]);
  const [activeTab, setActiveTab] = useState(TABS.ALL);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [processingIds, setProcessingIds] = useState(new Set());
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    type: '',
    vacancyStatus: '',
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    hasMore: false
  });

  // Memoized filtered rentals based on active tab
  const filteredRentals = useMemo(() => {
    if (!allRentals.length) return [];
    
    let filtered = [...allRentals];
    
    // Filter by tab
    switch (activeTab) {
      case TABS.PENDING:
        filtered = filtered.filter(rental => rental.isApproved === false);
        break;
      case TABS.APPROVED:
        filtered = filtered.filter(rental => rental.isApproved === true);
        break;
      case TABS.ALL:
      default:
        // Show all rentals
        break;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(rental =>
        rental.name?.toLowerCase().includes(query) ||
        rental.location?.toLowerCase().includes(query) ||
        rental.type?.toLowerCase().includes(query) ||
        rental.caretakerNumber?.includes(query)
      );
    }
    
    // Apply additional filters
    if (filters.location) {
      filtered = filtered.filter(rental =>
        rental.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    if (filters.type) {
      filtered = filtered.filter(rental =>
        rental.type?.toLowerCase().includes(filters.type.toLowerCase())
      );
    }
    
    if (filters.vacancyStatus) {
      filtered = filtered.filter(rental =>
        rental.vacancyStatus === filters.vacancyStatus
      );
    }
    
    return filtered;
  }, [allRentals, activeTab, searchQuery, filters]);

  // API call to fetch rentals
  const fetchRentals = useCallback(async (page = 1, shouldReset = false) => {
    try {
      // Set appropriate loading state
      if (page === 1) {
        shouldReset ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20', // Fetch more items per page
      });

      const response = await axios.get(`/api/admin/rentals/all?${params}`);
      
      if (response.data?.success) {
        const newRentals = response.data.data || [];
        const paginationData = response.data.pagination || {};
        
        // Update rentals state
        if (page === 1) {
          setAllRentals(newRentals);
        } else {
          setAllRentals(prev => [...prev, ...newRentals]);
        }
        
        // Update pagination
        setPagination({
          current: paginationData.current || page,
          pages: paginationData.pages || 1,
          total: paginationData.total || 0,
          hasMore: page < (paginationData.pages || 1)
        });
      } else {
        throw new Error(response.data?.message || 'Failed to fetch rentals');
      }
    } catch (error) {
      console.error('Error fetching rentals:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to fetch rentals. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchRentals(1);
  }, [fetchRentals]);

  // Handle tab change
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchRentals(1, true);
  }, [fetchRentals]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (pagination.hasMore && !loadingMore) {
      fetchRentals(pagination.current + 1);
    }
  }, [fetchRentals, pagination, loadingMore]);

  // Handle rental approval
  const handleApproveRental = useCallback(async (rentalId, hasVacant) => {
    try {
      setProcessingIds(prev => new Set(prev).add(rentalId));
      
      const response = await axios.put(`/api/admin/rentals/${rentalId}/approve`, {
        hasVacant,
        notes: 'Approved by admin'
      });

      if (response.data?.success) {
        // Update local state immediately
        setAllRentals(prev => prev.map(rental => 
          rental._id === rentalId 
            ? { 
                ...rental, 
                isApproved: true,
                vacancyStatus: hasVacant ? VACANCY_STATUS.VERIFIED_VACANT : VACANCY_STATUS.VERIFIED_OCCUPIED,
                updatedAt: new Date().toISOString()
              }
            : rental
        ));
        
        Alert.alert('Success', 'Rental approved successfully');
      } else {
        throw new Error(response.data?.message || 'Failed to approve rental');
      }
    } catch (error) {
      console.error('Error approving rental:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to approve rental. Please try again.'
      );
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(rentalId);
        return newSet;
      });
    }
  }, []);

  // Handle rental rejection
  const handleRejectRental = useCallback(async (rentalId) => {
    Alert.alert(
      'Confirm Rejection',
      'Are you sure you want to reject this rental? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingIds(prev => new Set(prev).add(rentalId));
              
              const response = await axios.put(`/api/admin/rentals/${rentalId}/reject`, {
                reason: 'Rejected by admin - incomplete or invalid information'
              });

              if (response.data?.success) {
                // Remove from local state immediately
                setAllRentals(prev => prev.filter(rental => rental._id !== rentalId));
                
                Alert.alert('Success', 'Rental rejected successfully');
              } else {
                throw new Error(response.data?.message || 'Failed to reject rental');
              }
            } catch (error) {
              console.error('Error rejecting rental:', error);
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to reject rental. Please try again.'
              );
            } finally {
              setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(rentalId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  }, []);

  // Handle vacancy status confirmation
  const handleVacancyConfirmation = useCallback((rental) => {
    Alert.alert(
      'Confirm Vacancy Status',
      `What is the current vacancy status of "${rental.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Has Vacancies',
          onPress: () => handleApproveRental(rental._id, true),
        },
        {
          text: 'Fully Occupied',
          onPress: () => handleApproveRental(rental._id, false),
        },
      ]
    );
  }, [handleApproveRental]);

  // Apply filters
  const applyFilters = useCallback(() => {
    setFilterModalVisible(false);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      location: '',
      type: '',
      vacancyStatus: '',
    });
    setSearchQuery('');
    setFilterModalVisible(false);
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Get vacancy status color
  const getVacancyColor = useCallback((status) => {
    switch (status) {
      case VACANCY_STATUS.VERIFIED_VACANT:
        return '#10b981';
      case VACANCY_STATUS.VERIFIED_OCCUPIED:
        return '#ef4444';
      case VACANCY_STATUS.UNVERIFIED:
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  }, []);

  // Render rental item
  const renderRentalItem = useCallback(({ item }) => {
    const isApproved = item.isApproved === true;
    const isProcessing = processingIds.has(item._id);
    
    return (
      <View style={styles.rentalCard}>
        {/* Image */}
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.rentalImage} />
        )}
        
        {/* Content */}
        <View style={styles.rentalContent}>
          {/* Header */}
          <View style={styles.rentalHeader}>
            <Text style={styles.rentalName} numberOfLines={2}>
              {item.name || 'Unnamed Property'}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: isApproved ? '#10b981' : '#f59e0b' }
            ]}>
              <Text style={styles.statusText}>
                {isApproved ? 'Approved' : 'Pending'}
              </Text>
            </View>
          </View>
          
          {/* Details */}
          <View style={styles.rentalDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.location || 'Location not specified'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="home-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.type || 'Type not specified'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText}>
                {item.caretakerNumber || 'N/A'}
              </Text>
            </View>
          </View>
          
          {/* Vacancy Status */}
          <View style={styles.vacancyRow}>
            <Text style={styles.vacancyLabel}>Vacancy Status:</Text>
            <View style={[
              styles.vacancyBadge,
              { backgroundColor: getVacancyColor(item.vacancyStatus) }
            ]}>
              <Text style={styles.vacancyText}>
                {item.vacancyStatus?.replace('_', ' ') || 'Unknown'}
              </Text>
            </View>
          </View>
          
          {/* Creator Info */}
          <View style={styles.creatorRow}>
            <Text style={styles.creatorLabel}>Created by:</Text>
            <Text style={styles.creatorText} numberOfLines={1}>
              {item.createdBy?.name || 'Unknown'} ({item.createdBy?.email || 'No email'})
            </Text>
          </View>
          
          {/* Actions - Only show for pending rentals */}
          {!isApproved && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleVacancyConfirmation(item)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleRejectRental(item._id)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }, [processingIds, formatCurrency, getVacancyColor, handleVacancyConfirmation, handleRejectRental]);

  // Render filter modal
  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Rentals</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.filterContent}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Location</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Enter location..."
                value={filters.location}
                onChangeText={(text) => setFilters(prev => ({ ...prev, location: text }))}
              />
            </View>
            
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Type</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Enter type..."
                value={filters.type}
                onChangeText={(text) => setFilters(prev => ({ ...prev, type: text }))}
              />
            </View>
            
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Vacancy Status</Text>
              <View style={styles.filterOptions}>
                {Object.values(VACANCY_STATUS).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterOption,
                      filters.vacancyStatus === status && styles.filterOptionActive
                    ]}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      vacancyStatus: prev.vacancyStatus === status ? '' : status 
                    }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      filters.vacancyStatus === status && styles.filterOptionTextActive
                    ]}>
                      {status.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.filterActions}>
            <TouchableOpacity
              style={[styles.filterButton, styles.clearButton]}
              onPress={clearFilters}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.filterButton, styles.applyButton]}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rentals Management</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={20} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search rentals..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {Object.entries(TABS).map(([key, tab]) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => handleTabChange(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Showing: {filteredRentals.length} of {pagination.total} rentals
        </Text>
        <Text style={styles.statsText}>
          Page {pagination.current} of {pagination.pages}
        </Text>
      </View>

      {/* Rentals List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading rentals...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRentals}
          renderItem={renderRentalItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="home-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No rentals found</Text>
              <Text style={styles.emptySubtext}>
                {activeTab === TABS.ALL && 'No rentals available'}
                {activeTab === TABS.PENDING && 'No pending rentals'}
                {activeTab === TABS.APPROVED && 'No approved rentals'}
              </Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      {renderFilterModal()}
    </View>
  );
};

// Styles would remain the same as your original component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'green',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 12,
    color: '#6b7280',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  rentalCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rentalImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  rentalContent: {
    padding: 16,
  },
  rentalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rentalName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  rentalDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  vacancyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vacancyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 8,
  },
  vacancyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  vacancyText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
    textTransform: 'capitalize',
  },
  creatorRow: {
    marginBottom: 12,
  },
  creatorLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 2,
  },
  creatorText: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'white',
  },
  filterOptionActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  filterOptionTextActive: {
    color: 'white',
  },
  filterActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f3f4f6',
  },
  clearButtonText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  clearButton: {
    backgroundColor: '#f3f4f6',
  },
  applyButton: {
    backgroundColor: '#6366f1',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
});

export default RentalsManagement;  