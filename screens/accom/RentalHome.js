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
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const API_URL = 'https://moihub.onrender.com/api';

// Luxury Emerald Green color palette
const RentalColors = {
  primary: '#0A4D3C',      // Deep Emerald
  secondary: '#1E7A5C',     // Medium Emerald
  accent: '#C6A43F',        // Gold
  highlight: '#E8C66A',     // Light Gold
  success: '#2E8B57',       // Sea Green
  warning: '#D4A017',       // Gold
  error: '#B22222',         // Ruby Red
  background: '#0C1F1A',    // Dark Forest
  surface: '#1A332B',       // Deep Jungle
  card: '#234D3C',          // Rich Emerald
  text: '#FFFFFF',          // White
  textSecondary: '#D4E6D0', // Mint Cream
  textMuted: '#8BA89B',     // Sage
  border: '#2C5E4A',        // Forest Border
  gold: '#D4AF37',          // Pure Gold
  goldLight: '#F1E6B0',     // Champagne
};

const RentalHome = ({ navigation }) => {
  const { token, isAuthenticated } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    location: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    vacancyStatus: '',
  });
  
  // Filter states - actual applied filters
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
    { label: 'All', value: '', icon: 'help-circle', color: RentalColors.textMuted },
    { label: 'Vacant (Voted)', value: 'verified_vacant', icon: 'checkmark-circle', color: RentalColors.success },
    { label: 'Occupied (Voted)', value: 'verified_occupied', icon: 'close-circle', color: RentalColors.error },
    { label: 'Vacant (Admin)', value: 'admin_verified_vacant', icon: 'shield-checkmark', color: RentalColors.success },
    { label: 'Occupied (Admin)', value: 'admin_verified_occupied', icon: 'shield-checkmark', color: RentalColors.error },
    { label: 'Unverified', value: 'unverified', icon: 'help-circle-outline', color: RentalColors.textMuted }
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

  const getActiveFilters = () => {
    const activeFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key].toString().trim() !== '') {
        activeFilters[key] = filters[key];
      }
    });
    return activeFilters;
  };

  const searchRentals = async (query = '', appliedFilters = {}, page = 1) => {
    // If no search query and no filters, fetch regular rentals
    if (!query.trim() && Object.keys(appliedFilters).length === 0) {
      fetchRentals(page);
      return;
    }

    try {
      setIsSearching(true);

      const params = {
        page,
        limit: 10,
      };

      if (query && query.trim()) {
        params.q = query.trim();
      }

      // Add filters directly - they should already match backend expectations
      Object.keys(appliedFilters).forEach(key => {
        const value = appliedFilters[key];
        if (value !== undefined && value.toString().trim() !== '') {
          params[key] = value;
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

  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    
    try {
      setLoading(true);
      
      const activeFilters = getActiveFilters();
      const hasSearchOrFilters = searchQuery.trim() || Object.keys(activeFilters).length > 0;
      
      if (hasSearchOrFilters) {
        await searchRentals(searchQuery, activeFilters, newPage);
      } else {
        await fetchRentals(newPage);
      }
    } catch (error) {
      console.error('Error changing page:', error);
      Alert.alert('Error', 'Failed to load page');
    } finally {
      setLoading(false);
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
    setTempFilters({
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
    // Don't search immediately - user can press search button or we can debounce
  };

  const handleSearchSubmit = () => {
    const activeFilters = getActiveFilters();
    searchRentals(searchQuery, activeFilters);
  };

  const openFilterModal = () => {
    // Initialize temp filters with current filters
    setTempFilters({ ...filters });
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    // Apply the temp filters to actual filters
    setFilters({ ...tempFilters });
    setShowFilterModal(false);
    
    // Perform search with new filters
    const activeFilters = {};
    Object.keys(tempFilters).forEach(key => {
      if (tempFilters[key] && tempFilters[key].toString().trim() !== '') {
        activeFilters[key] = tempFilters[key];
      }
    });
    
    searchRentals(searchQuery, activeFilters);
  };

  const resetFilters = () => {
    setTempFilters({
      location: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      vacancyStatus: '',
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({
      location: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      vacancyStatus: '',
    });
    setTempFilters({
      location: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      vacancyStatus: '',
    });
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

  const getVacancyStatusColor = (rental) => {
    if (rental.adminOverride?.isActive) {
      return rental.hasVacant ? RentalColors.success : RentalColors.error;
    }
    
    if (rental.voteStats?.totalVotes > 0) {
      const vacantRatio = rental.voteStats.vacantVotes / rental.voteStats.totalVotes;
      if (vacantRatio > 0.6) return RentalColors.success;
      if (vacantRatio < 0.4) return RentalColors.error;
      return RentalColors.warning;
    }
    
    return RentalColors.textMuted;
  };

  const getVacancyStatusText = (rental) => {
    if (rental.adminOverride?.isActive) {
      return rental.hasVacant ? 'Available' : 'Occupied';
    }
    
    if (rental.voteStats?.totalVotes > 0) {
      const vacantRatio = rental.voteStats.vacantVotes / rental.voteStats.totalVotes;
      if (vacantRatio > 0.6) return 'Likely Available';
      if (vacantRatio < 0.4) return 'Likely Occupied';
      return 'Disputed';
    }
    
    return 'Unverified';
  };

  const getStatusIcon = (rental) => {
    if (rental.adminOverride?.isActive) {
      return rental.hasVacant ? 'checkmark-circle' : 'close-circle';
    }
    
    if (rental.voteStats?.totalVotes > 0) {
      const vacantRatio = rental.voteStats.vacantVotes / rental.voteStats.totalVotes;
      if (vacantRatio > 0.6) return 'checkmark-circle-outline';
      if (vacantRatio < 0.4) return 'close-circle-outline';
      return 'help-circle-outline';
    }
    
    return 'help-circle-outline';
  };

  const renderStatusInfo = (rental) => {
    if (rental.adminOverride?.isActive) {
      return (
        <View style={styles.statusInfo}>
          <View style={styles.statusHeader}>
            <Ionicons name="shield-checkmark" size={14} color={RentalColors.gold} />
            <Text style={[styles.statusInfoText, { color: RentalColors.gold }]}>Admin Verified</Text>
          </View>
          <Text style={styles.statusInfoDetail}>
            {new Date(rental.adminOverride.timestamp).toLocaleDateString()}
          </Text>
          {rental.adminOverride.reason && (
            <Text style={styles.statusInfoDetail}>
              {rental.adminOverride.reason}
            </Text>
          )}
        </View>
      );
    }
    
    if (rental.voteStats?.totalVotes > 0) {
      const vacantRatio = rental.voteStats.vacantVotes / rental.voteStats.totalVotes;
      return (
        <View style={styles.statusInfo}>
          <View style={styles.statusHeader}>
            <Ionicons name="people" size={14} color={RentalColors.accent} />
            <Text style={[styles.statusInfoText, { color: RentalColors.accent }]}>Community Votes</Text>
          </View>
          <Text style={styles.statusInfoDetail}>
            {rental.voteStats.vacantVotes} vacant • {rental.voteStats.occupiedVotes} occupied
          </Text>
          <Text style={styles.statusInfoDetail}>
            {Math.round(Math.max(vacantRatio, 1 - vacantRatio) * 100)}% confidence
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.statusInfo}>
        <View style={styles.statusHeader}>
          <Ionicons name="help-circle" size={14} color={RentalColors.textMuted} />
          <Text style={[styles.statusInfoText, { color: RentalColors.textMuted }]}>Unverified</Text>
        </View>
        <Text style={styles.statusInfoDetail}>
          Be the first to vote
        </Text>
      </View>
    );
  };

  const renderRentalItem = ({ item, index }) => (
    <Animatable.View 
      animation="fadeInUp" 
      delay={index * 100}
      duration={600}
    >
      <TouchableOpacity
        style={styles.rentalCard}
        onPress={() => navigation.navigate('RentalDetail', { rentalId: item._id })}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[RentalColors.card, RentalColors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Gold Accent Line */}
          <View style={styles.goldAccent} />
          
          {/* Decorative Pattern */}
          <View style={styles.cardPattern}>
            <Text style={styles.patternIcon}>👑</Text>
            <Text style={styles.patternIcon}>✨</Text>
          </View>

          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Ionicons name="home" size={20} color={RentalColors.gold} />
              <Text style={styles.rentalName}>{item.name}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getVacancyStatusColor(item) + '20' }
            ]}>
              <Ionicons 
                name={getStatusIcon(item)} 
                size={12} 
                color={getVacancyStatusColor(item)} 
              />
              <Text style={[styles.statusText, { color: getVacancyStatusColor(item) }]}>
                {getVacancyStatusText(item)}
              </Text>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={RentalColors.gold} />
              <Text style={styles.infoText}>{item.location}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="home-outline" size={16} color={RentalColors.gold} />
              <Text style={styles.infoText}>
                {item.type === 'bedsitter' ? 'Bedsitter' : 
                 item.type === 'one-bedroom' ? '1 Bedroom' : '2 Bedroom'}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Ionicons name="cash-outline" size={20} color={RentalColors.gold} />
              <Text style={styles.priceText}>KSh {item.amount.toLocaleString()}</Text>
              <Text style={styles.perMonthText}>/month</Text>
            </View>

            {renderStatusInfo(item)}
          </View>

          {/* Gold Glow Effect */}
          <View style={styles.goldGlow} />
        </LinearGradient>
      </TouchableOpacity>
    </Animatable.View>
  );

  const renderPaginationControls = () => {
    if (pagination.total === 0) return null;

    const canGoPrev = pagination.current > 1;
    const canGoNext = pagination.current < pagination.pages;
    const startItem = ((pagination.current - 1) * 10) + 1;
    const endItem = Math.min(pagination.current * 10, pagination.total);

    return (
      <Animatable.View animation="fadeInUp" duration={500} style={styles.paginationContainer}>
        <LinearGradient
          colors={[RentalColors.surface, RentalColors.card]}
          style={styles.paginationGradient}
        >
          <View style={styles.paginationInfo}>
            <Text style={styles.paginationText}>
              {startItem}-{endItem} of {pagination.total} listings
            </Text>
            <Text style={styles.paginationPageText}>
              Page {pagination.current} of {pagination.pages}
            </Text>
          </View>
          
          {pagination.pages > 1 && (
            <View style={styles.paginationControls}>
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  !canGoPrev && styles.paginationButtonDisabled
                ]}
                onPress={() => handlePageChange(pagination.current - 1)}
                disabled={!canGoPrev || loading}
              >
                <LinearGradient
                  colors={canGoPrev ? [RentalColors.primary, RentalColors.secondary] : [RentalColors.border, RentalColors.surface]}
                  style={styles.paginationButtonGradient}
                >
                  <Ionicons 
                    name="chevron-back" 
                    size={16} 
                    color={canGoPrev ? RentalColors.gold : RentalColors.textMuted} 
                  />
                  <Text style={[
                    styles.paginationButtonText,
                    !canGoPrev && styles.paginationButtonTextDisabled
                  ]}>
                    Prev
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  !canGoNext && styles.paginationButtonDisabled
                ]}
                onPress={() => handlePageChange(pagination.current + 1)}
                disabled={!canGoNext || loading}
              >
                <LinearGradient
                  colors={canGoNext ? [RentalColors.primary, RentalColors.secondary] : [RentalColors.border, RentalColors.surface]}
                  style={styles.paginationButtonGradient}
                >
                  <Text style={[
                    styles.paginationButtonText,
                    !canGoNext && styles.paginationButtonTextDisabled
                  ]}>
                    Next
                  </Text>
                  <Ionicons 
                    name="chevron-forward" 
                    size={16} 
                    color={canGoNext ? RentalColors.gold : RentalColors.textMuted} 
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </Animatable.View>
    );
  };

const renderFilterModal = () => (
  <Modal
    visible={showFilterModal}
    animationType="slide"
    transparent={true}
    onRequestClose={() => setShowFilterModal(false)}
  >
    <View style={styles.modalOverlay}>
      <Animatable.View animation="slideInUp" duration={300} style={styles.modalContent}>
        <LinearGradient
          colors={[RentalColors.surface, RentalColors.card]}
          style={styles.modalGradient}
        >
          {/* Header - Fixed at top */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Ionicons name="options-outline" size={24} color={RentalColors.gold} />
              <Text style={styles.modalTitle}>Filter Rentals</Text>
            </View>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Ionicons name="close" size={24} color={RentalColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content - Takes remaining space */}
          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {/* Location Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Location</Text>
              <View style={styles.filterInputContainer}>
                <Ionicons name="location-outline" size={18} color={RentalColors.gold} />
                <TextInput
                  style={styles.filterInput}
                  placeholder="e.g., Stage, Chebarus"
                  placeholderTextColor={RentalColors.textMuted}
                  value={tempFilters.location}
                  onChangeText={(text) => setTempFilters({ ...tempFilters, location: text })}
                />
              </View>
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
                      tempFilters.type === type && styles.selectedTypeOption
                    ]}
                    onPress={() => setTempFilters({ ...tempFilters, type: tempFilters.type === type ? '' : type })}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      tempFilters.type === type && styles.selectedTypeOptionText
                    ]}>
                      {type === 'bedsitter' ? 'Bedsitter' : 
                       type === 'one-bedroom' ? '1 Bedroom' : '2 Bedroom'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Price Range (KSh)</Text>
              <View style={styles.priceRange}>
                <View style={styles.priceInputContainer}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    placeholderTextColor={RentalColors.textMuted}
                    value={tempFilters.minPrice}
                    onChangeText={(text) => setTempFilters({ ...tempFilters, minPrice: text })}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.priceSeparator}>-</Text>
                <View style={styles.priceInputContainer}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    placeholderTextColor={RentalColors.textMuted}
                    value={tempFilters.maxPrice}
                    onChangeText={(text) => setTempFilters({ ...tempFilters, maxPrice: text })}
                    keyboardType="numeric"
                  />
                </View>
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
                      tempFilters.vacancyStatus === status.value && styles.selectedStatusOption
                    ]}
                    onPress={() => setTempFilters({ 
                      ...tempFilters, 
                      vacancyStatus: tempFilters.vacancyStatus === status.value ? '' : status.value 
                    })}
                  >
                    <Ionicons 
                      name={status.icon} 
                      size={16} 
                      color={status.color} 
                    />
                    <Text style={[
                      styles.statusOptionText,
                      tempFilters.vacancyStatus === status.value && styles.selectedStatusOptionText
                    ]}>
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Selected Filters Display */}
            {Object.keys(tempFilters).filter(key => tempFilters[key] && tempFilters[key].toString().trim() !== '').length > 0 && (
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Selected Filters</Text>
                <View style={styles.activeFilters}>
                  {Object.entries(tempFilters).map(([key, value]) => {
                    if (!value || value.toString().trim() === '') return null;
                    return (
                      <View key={key} style={styles.activeFilter}>
                        <Text style={styles.activeFilterText}>
                          {key === 'vacancyStatus' 
                            ? vacancyStatuses.find(s => s.value === value)?.label || value
                            : key === 'type'
                            ? value === 'bedsitter' ? 'Bedsitter' : 
                              value === 'one-bedroom' ? '1 Bedroom' : '2 Bedroom'
                            : key === 'minPrice' || key === 'maxPrice'
                            ? `${key === 'minPrice' ? 'Min' : 'Max'}: KSh ${value}`
                            : `${key}: ${value}`
                          }
                        </Text>
                        <TouchableOpacity
                          onPress={() => setTempFilters({ ...tempFilters, [key]: '' })}
                          style={styles.removeFilter}
                        >
                          <Ionicons name="close-circle" size={16} color={RentalColors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer with buttons - Fixed at bottom */}
          <View style={styles.modalFooter}>
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
              <LinearGradient
                colors={[RentalColors.primary, RentalColors.secondary]}
                style={styles.applyButtonGradient}
              >
                <Ionicons name="checkmark" size={18} color={RentalColors.gold} />
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animatable.View>
    </View>
  </Modal>
);

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[RentalColors.background, RentalColors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <Animatable.View animation="pulse" iterationCount="infinite">
            <View style={styles.loadingIcon}>
              <Ionicons name="home" size={60} color={RentalColors.gold} />
            </View>
          </Animatable.View>
          <ActivityIndicator size="large" color={RentalColors.gold} />
          <Text style={styles.loadingText}>Finding rentals...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={RentalColors.primary} />
      
      <LinearGradient
        colors={[RentalColors.background, RentalColors.surface]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Gold Icons */}
      <View style={styles.floatingIcons}>
        <Text style={[styles.floatingIcon, styles.icon1]}>👑</Text>
        <Text style={[styles.floatingIcon, styles.icon2]}>✨</Text>
        <Text style={[styles.floatingIcon, styles.icon3]}>🏰</Text>
        <Text style={[styles.floatingIcon, styles.icon4]}>💎</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <LinearGradient
          colors={[RentalColors.card, RentalColors.surface]}
          style={styles.searchBar}
        >
          <Ionicons name="search-outline" size={20} color={RentalColors.gold} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location or name..."
            placeholderTextColor={RentalColors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={RentalColors.textMuted} />
            </TouchableOpacity>
          )}
          {isSearching && (
            <ActivityIndicator size="small" color={RentalColors.gold} />
          )}
          <TouchableOpacity
            style={[
              styles.filterButton,
              Object.keys(getActiveFilters()).length > 0 && styles.filterButtonActive
            ]}
            onPress={openFilterModal}
          >
            <Ionicons name="options-outline" size={20} color={RentalColors.gold} />
            {Object.keys(getActiveFilters()).length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {Object.keys(getActiveFilters()).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Search Results Info */}
      {(searchQuery || Object.keys(getActiveFilters()).length > 0) && (
        <Animatable.View animation="fadeIn" duration={300} style={styles.searchInfo}>
          <Text style={styles.searchInfoText}>
            {searchQuery && `"${searchQuery}"`}
            {searchQuery && Object.keys(getActiveFilters()).length > 0 && ' • '}
            {Object.keys(getActiveFilters()).length > 0 && 
              `${Object.keys(getActiveFilters()).length} filter(s)`
            }
          </Text>
          <TouchableOpacity
            onPress={clearAllFilters}
            style={styles.clearAllButton}
          >
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </Animatable.View>
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
            colors={[RentalColors.gold]}
            tintColor={RentalColors.gold}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Animatable.View animation="fadeIn" duration={500} style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="home-outline" size={64} color={RentalColors.gold} />
            </View>
            <Text style={styles.emptyText}>No luxury rentals found</Text>
            <Text style={styles.emptySubText}>
              {searchQuery || Object.keys(getActiveFilters()).length > 0 
                ? 'Try adjusting your search or filters' 
                : 'Pull to refresh'
              }
            </Text>
          </Animatable.View>
        }
      />

      {/* Pagination Controls */}
      {renderPaginationControls()}

      {/* Filter Modal */}
      {renderFilterModal()}

      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateRental}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[RentalColors.primary, RentalColors.secondary]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={24} color={RentalColors.gold} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}; 
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RentalColors.background,
  },
  floatingIcons: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  floatingIcon: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.1,
    color: RentalColors.gold,
  },
  icon1: {
    top: '10%',
    right: '5%',
    transform: [{ rotate: '15deg' }],
  },
  icon2: {
    top: '30%',
    left: '5%',
    transform: [{ rotate: '-10deg' }],
  },
  icon3: {
    bottom: '20%',
    right: '10%',
    transform: [{ rotate: '25deg' }],
  },
  icon4: {
    bottom: '40%',
    left: '8%',
    transform: [{ rotate: '-15deg' }],
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: RentalColors.gold,
    marginBottom: 2,
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: RentalColors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: RentalColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: RentalColors.gold + '40',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: RentalColors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: RentalColors.gold + '40',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: RentalColors.text,
    padding: 4,
  },
  clearButton: {
    padding: 4,
    marginRight: 4,
  },
  filterButton: {
    marginLeft: 8,
    padding: 6,
    position: 'relative',
    borderRadius: 18,
  },
  filterButtonActive: {
    backgroundColor: RentalColors.primary + '40',
    borderWidth: 1,
    borderColor: RentalColors.gold,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: RentalColors.gold,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: RentalColors.primary,
    fontSize: 8,
    fontWeight: 'bold',
  },
  searchInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginBottom: 6,
    backgroundColor: RentalColors.primary + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: RentalColors.gold + '40',
  },
  searchInfoText: {
    fontSize: 12,
    color: RentalColors.gold,
    flex: 1,
  },
  clearAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: RentalColors.card,
    borderWidth: 1,
    borderColor: RentalColors.gold,
  },
  clearAllText: {
    fontSize: 10,
    color: RentalColors.gold,
    fontWeight: '600',
  },
  listContainer: {
    padding: 12,
    paddingBottom: 80,
  },
  rentalCard: {
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
    shadowColor: RentalColors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardGradient: {
    padding: 12,
    position: 'relative',
  },
  goldAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: RentalColors.gold,
  },
  cardPattern: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    opacity: 0.1,
  },
  patternIcon: {
    fontSize: 16,
    marginHorizontal: 1,
  },
  goldGlow: {
    position: 'absolute',
    bottom: -15,
    right: -15,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: RentalColors.gold + '10',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  rentalName: {
    fontSize: 16,
    fontWeight: '700',
    color: RentalColors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  cardContent: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: RentalColors.textSecondary,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: RentalColors.gold,
  },
  perMonthText: {
    fontSize: 11,
    color: RentalColors.textMuted,
  },
  statusInfo: {
    backgroundColor: RentalColors.background + '80',
    padding: 8,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: RentalColors.gold + '20',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  statusInfoText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusInfoDetail: {
    fontSize: 10,
    color: RentalColors.textMuted,
    marginTop: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: RentalColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: RentalColors.gold,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: RentalColors.gold,
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 13,
    color: RentalColors.textMuted,
    textAlign: 'center',
  },
  // COMPRESSED PAGINATION
  paginationContainer: {
    marginHorizontal: 12,
    marginBottom: 12,
    marginTop: 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
  },
  paginationGradient: {
    padding: 10,
  },
  paginationInfo: {
    marginBottom: 6,
  },
  paginationText: {
    fontSize: 12,
    color: RentalColors.textSecondary,
    textAlign: 'center',
  },
  paginationPageText: {
    fontSize: 10,
    color: RentalColors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  paginationButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  paginationButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  paginationButtonText: {
    fontSize: 12,
    color: RentalColors.gold,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: RentalColors.textMuted,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 50,
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: RentalColors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // MODAL STYLES - COMPRESSED
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    height: '75%',
    width: '100%',
  },
  modalGradient: {
    flex: 1,
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: RentalColors.gold + '30',
    backgroundColor: RentalColors.surface,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: RentalColors.gold,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    flex: 1,
    padding: 16,
  },
  modalScrollContent: {
    paddingBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: RentalColors.gold,
    marginBottom: 6,
  },
  filterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: RentalColors.background,
  },
  filterInput: {
    flex: 1,
    padding: 10,
    fontSize: 14,
    color: RentalColors.text,
    marginLeft: 6,
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
    backgroundColor: RentalColors.background,
  },
  selectedTypeOption: {
    backgroundColor: RentalColors.primary,
    borderColor: RentalColors.gold,
  },
  typeOptionText: {
    fontSize: 13,
    color: RentalColors.textSecondary,
  },
  selectedTypeOptionText: {
    color: RentalColors.gold,
    fontWeight: '600',
  },
  priceRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceInputContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
    borderRadius: 10,
    backgroundColor: RentalColors.background,
  },
  priceInput: {
    padding: 10,
    fontSize: 14,
    color: RentalColors.text,
  },
  priceSeparator: {
    fontSize: 14,
    color: RentalColors.gold,
  },
  statusOptions: {
    gap: 6,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
    backgroundColor: RentalColors.background,
    gap: 6,
  },
  selectedStatusOption: {
    backgroundColor: RentalColors.primary + '40',
    borderColor: RentalColors.gold,
  },
  statusOptionText: {
    fontSize: 13,
    color: RentalColors.textSecondary,
  },
  selectedStatusOptionText: {
    color: RentalColors.gold,
    fontWeight: '600',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: RentalColors.primary + '40',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
  },
  activeFilterText: {
    fontSize: 11,
    color: RentalColors.gold,
  },
  removeFilter: {
    padding: 1,
  },
  // MODAL FOOTER - COMPRESSED
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: RentalColors.gold + '30',
    backgroundColor: RentalColors.surface,
    gap: 8,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: RentalColors.gold,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  resetButtonText: {
    fontSize: 14,
    color: RentalColors.gold,
  },
  applyButton: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  applyButtonText: {
    fontSize: 14,
    color: RentalColors.gold,
    fontWeight: 'bold',
  },
});
export default RentalHome;