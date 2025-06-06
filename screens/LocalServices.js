import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  TextInput,
  Animated,
  Easing,
  Linking,
  Dimensions,
  StatusBar,
  Modal,
  FlatList,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const windowWidth = Dimensions.get('window').width;
const EMERALD_GREEN = '#005f4b'; 
const API_URL = process.env.REACT_APP_API_URL || '';

// Services API functions
const searchServices = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/api/services/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching services:', error);
    throw error;
  }
};

const exploreServices = async (page = 1) => {
  try {
    const response = await axios.get(`${API_URL}/api/services/explore?page=${page}`);
    return response.data;
  } catch (error) {
    console.error('Error exploring services:', error);
    throw error;
  }
};

const rateService = async (serviceId, rating, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/services/${serviceId}/rate`,
      { value: rating },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error rating service:', error);
    throw error;
  }
};

const getServiceProvider = async (providerId) => {
  try {
    const response = await axios.get(`${API_URL}/api/providers/${providerId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting provider details:', error);
    throw error;
  }
};

const getServiceDetails = async (serviceId) => {
  try {
    const response = await axios.get(`${API_URL}/api/services/${serviceId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting service details:', error);
    throw error;
  }
};

const LocalServices = () => {
  const navigation = useNavigation();
  const [searchMode, setSearchMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [error, setError] = useState(null);
  const [userToken, setUserToken] = useState(null); // In a real app, get this from auth context or storage
  
  // Animation values
  const searchWaveAnim = useRef(new Animated.Value(0)).current;
  const searchInputAnim = useRef(new Animated.Value(0)).current;
  const searchResultsAnim = useRef(new Animated.Value(0)).current;
  
  // Fetch services on mount
  useEffect(() => {
    if (!searchMode) {
      fetchExploreServices(1, true);
    }
    
    // Mock token for testing - in real app you would get from auth context
    setUserToken("mock_token_for_testing");
  }, [searchMode]);

  // Fetch explore services
  const fetchExploreServices = async (page, reset = false) => {
    try {
      setLoadingMore(true);
      setError(null);
      
      const data = await exploreServices(page);
      
      if (data.length < 10) {
        setHasMorePages(false);
      }
      
      if (reset) {
        setServices(data);
        setFilteredServices(data);
      } else {
        setServices(prevServices => [...prevServices, ...data]);
        setFilteredServices(prevServices => [...prevServices, ...data]);
      }
      
      setCurrentPage(page);
    } catch (err) {
      setError("Failed to load services. Please try again.");
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Load more services when reaching end of list
  const handleLoadMore = () => {
    if (!loadingMore && hasMorePages) {
      fetchExploreServices(currentPage + 1);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchCompleted(false);
    setError(null);
    
    // Hide the search panel during wave animation
    const searchPanel = document.querySelector('.searchPanel');
    if (searchPanel) {
      searchPanel.style.opacity = '0';
    }
    
    // Start wave animation
    Animated.timing(searchWaveAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
    
    try {
      // Simulate network delay for animation
      setTimeout(async () => {
        try {
          const results = await searchServices(searchQuery);
          
          setFilteredServices(results);
          setIsSearching(false);
          setSearchCompleted(true);
          
          // Animate search results
          Animated.timing(searchResultsAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
          
          // Show search panel again
          if (searchPanel) {
            searchPanel.style.opacity = '1';
          }
        } catch (err) {
          setError("Search failed. Please try again.");
          setIsSearching(false);
          
          // Show search panel again
          if (searchPanel) {
            searchPanel.style.opacity = '1';
          }
        }
      }, 2000);
    } catch (err) {
      setError("Search failed. Please try again.");
      setIsSearching(false);
      setSearchCompleted(true);
      
      // Show search panel again
      if (searchPanel) {
        searchPanel.style.opacity = '1';
      }
    }
  };

  // Reset search
  const resetSearch = () => {
    setSearchQuery('');
    setSearchCompleted(false);
    setIsSearching(false);
    setFilteredServices([]);
    setError(null);
    searchWaveAnim.setValue(0);
    searchResultsAnim.setValue(0);
  };

  // Show all services
  const showAllServices = () => {
    setSearchMode(false);
    
    // Animate transition
    Animated.timing(searchInputAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Handle service selection to show providers
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setModalVisible(true);
  };

  // Handle phone call
  const handlePhoneCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  // Handle rating service
  const handleRatingSelection = (rating) => {
    setCurrentRating(rating);
  };

  // Submit rating
  const submitRating = async () => {
    if (!selectedService || !currentRating || !userToken) return;
    
    try {
      const result = await rateService(selectedService.id, currentRating, userToken);
      
      // Update the selected service with new rating
      setSelectedService(prev => ({
        ...prev,
        averageRating: result.averageRating,
        ratingBreakdown: result.breakdown
      }));
      
      // Close rating modal
      setRatingModalVisible(false);
    } catch (err) {
      // Show error message
      setError(err.response?.data?.error || "Failed to submit rating. Please try again.");
    }
  };

  // Generate wave circles for animation
  const renderWaveCircles = () => {
    const circles = [];
    for (let i = 0; i < 3; i++) {
      const scaleValue = searchWaveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.1, i + 2]
      });
      
      const opacityValue = searchWaveAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.6, 0.3, 0]
      });
      
      circles.push(
        <Animated.View 
          key={i}
          style={[
            styles.waveCircle,
            {
              transform: [{ scale: scaleValue }],
              opacity: opacityValue,
              backgroundColor: EMERALD_GREEN
            }
          ]}
        />
      );
    }
    return circles;
  };

  // Render star rating
  const renderStarRating = (rating, size = 16, touchable = false) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      let iconName = 'star-outline';
      
      if (i <= fullStars) {
        iconName = 'star';
      } else if (i === fullStars + 1 && halfStar) {
        iconName = 'star-half';
      }
      
      if (touchable) {
        stars.push(
          <TouchableOpacity 
            key={i} 
            onPress={() => handleRatingSelection(i)}
            style={{ padding: 5 }}
          >
            <Ionicons 
              name={iconName} 
              size={size} 
              color={i <= currentRating ? '#FFD700' : '#C0C0C0'}
            />
          </TouchableOpacity>
        );
      } else {
        stars.push(
          <Ionicons 
            key={i}
            name={iconName} 
            size={size} 
            color={iconName !== 'star-outline' ? '#FFD700' : '#C0C0C0'}
            style={{ marginRight: 2 }}
          />
        );
      }
    }
    
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {stars}
      </View>
    );
  };

  // Render provider item for the FlatList
  const renderProviderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.providerItem}
      onPress={() => handlePhoneCall(item.phone)}
    >
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>{item.name}</Text>
        <Text style={styles.providerPhone}>{item.phone}</Text>
        
        {item.averageRating > 0 && (
          <View style={styles.ratingContainer}>
            {renderStarRating(item.averageRating)}
            <Text style={styles.ratingText}>
              {item.averageRating.toFixed(1)} ({item.ratingCount})
            </Text>
          </View>
        )}
      </View>
      <View style={styles.callButtonWrapper}>
        <TouchableOpacity
          style={styles.providerCallButton}
          onPress={() => handlePhoneCall(item.phone)}
        >
          <Ionicons name="call" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render service item for the FlatList
  const renderServiceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.serviceCardGrid}
      onPress={() => handleServiceSelect(item)}
    >
      <View style={[styles.serviceHeaderGrid, { backgroundColor: EMERALD_GREEN }]}>
        <Ionicons name={item.icon || "apps"} size={32} color="#fff" />
        <Text style={styles.serviceTitleGrid}>{item.title || item.name}</Text>
        
        {item.averageRating > 0 && (
          <View style={styles.headerRating}>
            {renderStarRating(item.averageRating, 14)}
          </View>
        )}
      </View>
      <View style={styles.serviceContentGrid}>
        <Text style={styles.serviceDescriptionGrid}>{item.description}</Text>
        <View style={styles.providersInfo}>
          <Text style={styles.providersCountGrid}>
            {item.providers ? 
              `${item.providers.length} provider${item.providers.length !== 1 ? 's' : ''} available` :
              item.provider ? 'Contact provider' : 'View details'
            }
          </Text>
          <TouchableOpacity
            style={[styles.viewProvidersButton, { backgroundColor: EMERALD_GREEN }]}
            onPress={() => handleServiceSelect(item)}
          >
            <Text style={styles.viewProvidersText}>
              {item.providers ? 'View Providers' : 'View Details'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Mock data for offline development
  const mockLocalServices = [
    { 
      id: 'bodaboda',
      title: "Boda Boda", 
      icon: "bicycle", 
      description: "Quick motorcycle taxi services around campus and nearby areas.",
      averageRating: 4.5,
      ratingCount: 120,
      providers: [
        { id: 'b1', name: "John's Riders", phone: "+254-712-345-678", averageRating: 4.7, ratingCount: 56 },
        { id: 'b2', name: "Fast Campus Rides", phone: "+254-712-111-222", averageRating: 4.3, ratingCount: 34 },
        { id: 'b3', name: "Safe Boda Express", phone: "+254-712-333-444", averageRating: 4.8, ratingCount: 41 },
        { id: 'b4', name: "University Bikes", phone: "+254-712-555-666", averageRating: 4.1, ratingCount: 22 },
        { id: 'b5', name: "Quick Town Movers", phone: "+254-712-777-888", averageRating: 4.6, ratingCount: 31 }
      ]
    },
    // More mock services...
  ];

  // Use mock data if no real data is available
  useEffect(() => {
    if (filteredServices.length === 0 && !isSearching && searchCompleted) {
      setFilteredServices(mockLocalServices);
    }
    
    if (services.length === 0 && !searchMode) {
      setServices(mockLocalServices);
      setFilteredServices(mockLocalServices);
    }
  }, [isSearching, searchCompleted, services.length, searchMode]);

  // Handle empty services or errors
  const renderEmptyOrError = () => {
    if (error) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={EMERALD_GREEN} />
          <Text style={styles.emptyStateTitle}>Something went wrong</Text>
          <Text style={styles.emptyStateDescription}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: EMERALD_GREEN }]}
            onPress={() => searchMode ? handleSearch() : fetchExploreServices(1, true)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (!isSearching && searchCompleted && filteredServices.length === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Ionicons name="sad-outline" size={64} color={EMERALD_GREEN} />
          <Text style={styles.noResultsText}>No services found</Text>
          <TouchableOpacity 
            style={[styles.exploreButton, { backgroundColor: EMERALD_GREEN }]}
            onPress={showAllServices}
          >
            <Text style={styles.exploreButtonText}>Explore All Services</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Header with extra padding for safety */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Local Services</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetSearch}>
            <Ionicons name="refresh" size={24} color={EMERALD_GREEN} />
          </TouchableOpacity>
        </View>

        {searchMode ? (
          <View style={styles.searchCenteredContainer}>
            {/* Search Input - hidden during wave animation */}
            <View style={[styles.searchContainer, { opacity: isSearching ? 0 : 1 }]} className="searchPanel">
              <Ionicons name="search" size={20} color={EMERALD_GREEN} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="What service do you need?"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={resetSearch}>
                  <Ionicons name="close-circle" size={20} color={EMERALD_GREEN} />
                </TouchableOpacity>
              ) : null}
            </View>
            
            <TouchableOpacity 
              style={[
                styles.searchButton, 
                { backgroundColor: EMERALD_GREEN, opacity: isSearching ? 0 : 1 }
              ]} 
              onPress={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="searchPanel"
            >
              <Text style={styles.searchButtonText}>Find Services</Text>
            </TouchableOpacity>
            
            {/* Animated Search Waves */}
            {isSearching && (
              <View style={styles.waveContainer}>
                {renderWaveCircles()}
                <Ionicons name="search" size={32} color="#fff" style={styles.searchingIcon} />
                <Text style={styles.searchingText}>Searching local services...</Text>
              </View>
            )}
            
            {/* Search Results */}
            {searchCompleted && (
              <Animated.View 
                style={[
                  styles.resultsContainer,
                  { opacity: searchResultsAnim }
                ]}
              >
                {filteredServices.length > 0 ? (
                  <FlatList
                    data={filteredServices}
                    renderItem={renderServiceItem}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.resultsScroll}
                    ListEmptyComponent={renderEmptyOrError}
                  />
                ) : renderEmptyOrError()}
              </Animated.View>
            )}
            
            {/* Show All Services Option */}
            {!isSearching && !searchCompleted && (
              <TouchableOpacity 
                style={styles.exploreAllButton}
                onPress={showAllServices}
              >
                <Text style={[styles.exploreAllText, { color: EMERALD_GREEN }]}>Explore All Services</Text>
                <Ionicons name="grid" size={20} color={EMERALD_GREEN} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          // All Services Display
          <Animated.View 
            style={[
              styles.allServicesContainer,
              {
                opacity: searchInputAnim
              }
            ]}
          >
            {/* Mini Search Bar */}
            <View style={styles.miniSearchContainer}>
              <Ionicons name="search" size={20} color={EMERALD_GREEN} />
              <TextInput
                style={styles.miniSearchInput}
                placeholder="Filter services..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (!text) {
                    setFilteredServices(services);
                    return;
                  }
                  
                  const filtered = services.filter(service => {
                    const title = service.title || service.name || '';
                    const description = service.description || '';
                    return title.toLowerCase().includes(text.toLowerCase()) ||
                           description.toLowerCase().includes(text.toLowerCase());
                  });
                  setFilteredServices(filtered);
                }}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => {
                  setSearchQuery('');
                  setFilteredServices(services);
                }}>
                  <Ionicons name="close-circle" size={20} color={EMERALD_GREEN} />
                </TouchableOpacity>
              ) : null}
            </View>
            
            {/* Services Grid with infinite scrolling */}
            <FlatList
              data={filteredServices}
              renderItem={renderServiceItem}
              keyExtractor={item => item.id || item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.servicesGrid}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              ListEmptyComponent={renderEmptyOrError}
              ListFooterComponent={() => (
                loadingMore ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="small" color={EMERALD_GREEN} />
                    <Text style={styles.loaderText}>Loading more services...</Text>
                  </View>
                ) : (
                  <View style={styles.bottomPadding} />
                )
              )}
            />
          </Animated.View>
        )}

        {/* Providers Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedService?.title || selectedService?.name} {selectedService?.averageRating ? `(${selectedService.averageRating.toFixed(1)}★)` : ''}
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.serviceDetailsContainer}>
                <Text style={styles.serviceDetailsDesc}>{selectedService?.description}</Text>
                
                {selectedService?.averageRating > 0 && (
                  <View style={styles.serviceRatingContainer}>
                    {renderStarRating(selectedService.averageRating)}
                    <Text style={styles.serviceRatingText}>
                      {selectedService.averageRating.toFixed(1)} from {selectedService.ratingCount || 0} ratings
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={[styles.rateServiceButton, { backgroundColor: EMERALD_GREEN }]}
                  onPress={() => {
                    setRatingModalVisible(true);
                    setModalVisible(false);
                  }}
                >
                  <Ionicons name="star" size={18} color="#fff" />
                  <Text style={styles.rateServiceText}>Rate this service</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.providersListHeader}>
                <Text style={styles.providersListTitle}>
                  {selectedService?.providers ? 'Available Providers' : 'Provider Details'}
                </Text>
              </View>
              
              {selectedService?.providers ? (
                <FlatList
                  data={selectedService?.providers}
                  renderItem={renderProviderItem}
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.providersList}
                />
              ) : (
                <View style={styles.singleProviderContainer}>
                  {selectedService?.provider && (
                    <TouchableOpacity 
                      style={styles.providerItem}
                      onPress={() => handlePhoneCall(selectedService.provider.phone)}
                    >
                      <View style={styles.providerInfo}>
                        <Text style={styles.providerName}>{selectedService.provider.name}</Text>
                        <Text style={styles.providerPhone}>{selectedService.provider.phone}</Text>
                        
                        {selectedService.provider.averageRating > 0 && (
                          <View style={styles.ratingContainer}>
                            {renderStarRating(selectedService.provider.averageRating)}
                            <Text style={styles.ratingText}>
                              {selectedService.provider.averageRating.toFixed(1)} ({selectedService.provider.ratingCount})
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.callButtonWrapper}>
                        <TouchableOpacity
                          style={styles.providerCallButton}
                          onPress={() => handlePhoneCall(selectedService.provider.phone)}
                        >
                          <Ionicons name="call" size={22} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>
        
        {/* Rating Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={ratingModalVisible}
          onRequestClose={() => setRatingModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.ratingModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Rate this Service</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setRatingModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.ratingModalBody}>
                <Text style={styles.ratingServiceName}>{selectedService?.title || selectedService?.name}</Text>
                <Text style={styles.ratingInstructions}>Tap to select your rating:</Text>
                
                <View style={styles.starRatingContainer}>
                  {renderStarRating(0, 36, true)}
                </View>
                
                <Text style={styles.ratingSelectedText}>
                  {currentRating > 0 ? 
                    `You selected ${currentRating} star${currentRating !== 1 ? 's' : ''}` : 
                    'Select a rating to continue'}
                </Text>
                
                <View style={styles.ratingButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.cancelRatingButton]}
                    onPress={() => {
                      setRatingModalVisible(false);
                      setModalVisible(true);
                      setCurrentRating(0);
                    }}
                  >
                    <Text style={styles.cancelRatingText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[
                      styles.submitRatingButton, 
                      { 
                        backgroundColor: currentRating > 0 ? EMERALD_GREEN : '#ccc',
                        opacity: currentRating > 0 ? 1 : 0.7
                      }
                    ]}
                    onPress={submitRating}
                    disabled={currentRating === 0}
                  >
                    <Text style={styles.submitRatingText}>Submit Rating</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212', // Dark background for futuristic feel
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 95, 75, 0.1)', // Subtle emerald background
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 95, 75, 0.3)',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0, 95, 75, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  resetButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 95, 75, 0.2)',
  },
  
  // Search Section - Futuristic
  searchCenteredContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    height: 60,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 95, 75, 0.5)',
    shadowColor: '#005f4b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  searchIcon: {
    marginRight: 10,
    opacity: 0.9,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 12,
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: '#005f4b',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    marginBottom: 30,
    shadowColor: '#005f4b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  // Wave animation elements - Shazam-like
  waveContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  waveCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#005f4b',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchingIcon: {
    color: '#fff',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  searchingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 15,
    zIndex: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  
  // Results section
  resultsContainer: {
    flex: 1,
    width: '100%',
  },
  resultsScroll: {
    paddingVertical: 10,
  },
  
  // Explore button
  exploreAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 95, 75, 0.15)',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 95, 75, 0.4)',
  },
  exploreAllText: {
    color: '#fff',
    fontSize: 16,
    marginRight: 8,
    fontWeight: '500',
  },
  
  // All services grid
  allServicesContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
    backgroundColor: '#121212',
  },
  miniSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(0, 95, 75, 0.4)',
  },
  miniSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 10,
    marginLeft: 8,
  },
  servicesGrid: {
    paddingBottom: 20,
  },
  
  // Service cards - Grid style with futuristic design
  serviceCardGrid: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
    shadowColor: '#005f4b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 95, 75, 0.3)',
  },
  serviceHeaderGrid: {
    backgroundColor: '#005f4b',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  serviceTitleGrid: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerRating: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceContentGrid: {
    padding: 20,
  },
  serviceDescriptionGrid: {
    color: '#e0e0e0',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  providersInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providersCountGrid: {
    color: '#aaa',
    fontSize: 14,
  },
  viewProvidersButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#005f4b',
    shadowColor: '#005f4b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  viewProvidersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Empty states
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    backgroundColor: '#005f4b',
    shadowColor: '#005f4b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff',
    marginTop: 20,
    marginBottom: 30,
  },
  exploreButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: '#005f4b',
    shadowColor: '#005f4b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },

  // Loader
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loaderText: {
    color: '#aaa',
    marginTop: 10,
    fontSize: 14,
  },
  bottomPadding: {
    height: 30,
  },
  
  // Modal styles - Futuristic
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingVertical: 20,
    maxHeight: '90%',
    shadowColor: '#005f4b',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 95, 75, 0.4)',
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  serviceDetailsContainer: {
    padding: 20,
  },
  serviceDetailsDesc: {
    color: '#e0e0e0',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  serviceRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
  },
  serviceRatingText: {
    color: '#bbb',
    fontSize: 16,
    marginLeft: 15,
  },
  rateServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#005f4b',
    marginBottom: 10,
    shadowColor: '#005f4b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  rateServiceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  providersListHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: 'rgba(0, 95, 75, 0.1)',
  },
  providersListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  providersList: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  singleProviderContainer: {
    padding: 15,
  },
  
  // Provider items
  providerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 95, 75, 0.2)',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  providerPhone: {
    fontSize: 15,
    color: '#aaa',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#bbb',
    marginLeft: 5,
  },
  callButtonWrapper: {
    marginLeft: 15,
  },
  providerCallButton: {
    backgroundColor: '#005f4b',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#005f4b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  
  // Rating modal styles
  ratingModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingVertical: 20,
    shadowColor: '#005f4b',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 25,
    borderWidth: 1,
    borderColor: 'rgba(0, 95, 75, 0.4)',
    borderBottomWidth: 0,
  },
  ratingModalBody: {
    padding: 20,
    alignItems: 'center',
  },
  ratingServiceName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 95, 75, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ratingInstructions: {
    fontSize: 16,
    color: '#bbb',
    marginBottom: 20,
  },
  starRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 20,
    borderRadius: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0, 95, 75, 0.3)',
  },
  ratingSelectedText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
  },
  ratingButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelRatingButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelRatingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  submitRatingButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#005f4b',
    flex: 2,
    alignItems: 'center',
    shadowColor: '#005f4b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  submitRatingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


export default LocalServices;