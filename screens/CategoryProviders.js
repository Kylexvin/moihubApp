import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import axios from 'axios';

const { width } = Dimensions.get('window');

const CategoryProviders = ({ route, navigation }) => {
  const { categoryId, categoryName } = route.params;
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('All Areas');

  // Get unique areas from all providers
  const [allAreas, setAllAreas] = useState(['All Areas']);

  useEffect(() => {
    navigation.setOptions({
      title: categoryName,
      headerStyle: {
        backgroundColor: '#007AFF',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
    fetchProviders();
  }, [categoryId, categoryName]);

  useEffect(() => {
    filterProviders();
  }, [searchQuery, selectedArea, providers]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`api/services/providers/${categoryId}`);
      setProviders(response.data.providers);
      
      // Extract unique areas
      const areas = ['All Areas'];
      response.data.providers.forEach(provider => {
        provider.areasOfOperation.forEach(area => {
          if (!areas.includes(area)) {
            areas.push(area);
          }
        });
      });
      setAllAreas(areas);
    } catch (err) {
      setError('Failed to fetch providers');
      Alert.alert('Error', 'Failed to load service providers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterProviders = () => {
    let filtered = providers;

    // Filter by search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(provider =>
        provider.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.areasOfOperation.some(area => 
          area.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Filter by selected area
    if (selectedArea !== 'All Areas') {
      filtered = filtered.filter(provider =>
        provider.areasOfOperation.includes(selectedArea)
      );
    }

    setFilteredProviders(filtered);
  };

  const copyToClipboard = async (text, label) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied!', `${label} copied to clipboard`);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handlePhoneAction = (phoneNumber, providerName) => {
    Alert.alert(
      'Contact Provider',
      `Choose how to contact ${providerName}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Copy Number',
          onPress: () => copyToClipboard(phoneNumber, 'Phone number'),
        },
        {
          text: 'Call Now',
          onPress: () => attemptCall(phoneNumber, providerName),
        },
      ]
    );
  };

  const attemptCall = async (phoneNumber, providerName) => {
    try {
      const url = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback: copy to clipboard if calling is not supported
        Alert.alert(
          'Call Not Supported',
          'Phone calling is not supported on this device. The number will be copied to your clipboard instead.',
          [
            {
              text: 'OK',
              onPress: () => copyToClipboard(phoneNumber, 'Phone number'),
            },
          ]
        );
      }
    } catch (error) {
      // Fallback: copy to clipboard if there's an error
      Alert.alert(
        'Call Failed',
        'Unable to make the call. The number will be copied to your clipboard instead.',
        [
          {
            text: 'OK',
            onPress: () => copyToClipboard(phoneNumber, 'Phone number'),
          },
        ]
      );
    }
  };

  const getProviderInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRandomGradient = () => {
    const gradients = [
      ['#FF6B6B', '#FF8E8E'],
      ['#4ECDC4', '#44A08D'],
      ['#45B7D1', '#96C5F7'],
      ['#96CEB4', '#FFEAA7'],
      ['#FECA57', '#FF9FF3'],
      ['#54A0FF', '#5F27CD'],
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  const renderAreaFilter = (area) => (
    <TouchableOpacity
      key={area}
      style={[
        styles.areaFilterItem,
        selectedArea === area && styles.areaFilterItemActive
      ]}
      onPress={() => setSelectedArea(area)}
    >
      <Text style={[
        styles.areaFilterText,
        selectedArea === area && styles.areaFilterTextActive
      ]}>
        {area}
      </Text>
    </TouchableOpacity>
  );

  const renderProviderItem = ({ item, index }) => {
    const gradient = getRandomGradient();
    return (
      <View style={styles.providerCard}>
        <View style={styles.providerHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: gradient[0] }]}>
            <Text style={styles.avatarText}>{getProviderInitials(item.providerName)}</Text>
          </View>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{item.providerName}</Text>
            <View style={styles.ratingContainer}>
              
            </View>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handlePhoneAction(item.phoneNumber, item.providerName)}
          >
            <Text style={styles.callIcon}>📞</Text>
            <Text style={styles.callButtonText}>Contact</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.providerDetails}>
          <TouchableOpacity 
            style={styles.detailRow}
            onPress={() => handlePhoneAction(item.phoneNumber, item.providerName)}
          >
            <Text style={styles.detailIcon}>📞</Text>
            <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
            <Text style={styles.tapHint}>Tap to call or copy</Text>
          </TouchableOpacity>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <View style={styles.areasContainer}>
              <Text style={styles.areasLabel}>Areas: </Text>
              <Text style={styles.areas}>{item.areasOfOperation.join(', ')}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>⏰</Text>
            <Text style={styles.availabilityText}>Available 24/7</Text>
          </View>
        </View>

        <View style={styles.providerFooter}>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✓ Verified</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🛡️ Insured</Text>
            </View>
          </View>
          <Text style={styles.responseTime}>Responds in ~15 min</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading providers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProviders}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search providers or areas..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Area Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Filter by Area:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.areaFiltersRow}>
            {allAreas.map(renderAreaFilter)}
          </View>
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {filteredProviders.length} Provider{filteredProviders.length !== 1 ? 's' : ''} Found
        </Text>
        <Text style={styles.resultsSubtitle}>
          {selectedArea !== 'All Areas' ? `in ${selectedArea}` : 'in all areas'}
        </Text>
      </View>

      {/* Providers List */}
      {filteredProviders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>😔</Text>
          <Text style={styles.emptyText}>No providers found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || selectedArea !== 'All Areas' 
              ? 'Try adjusting your search or filters' 
              : 'Check back later for new providers'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProviders}
          renderItem={renderProviderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999',
  },
  filtersContainer: {
    paddingVertical: 15,
    paddingLeft: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  areaFiltersRow: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  areaFilterItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  areaFilterItemActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  areaFilterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  areaFilterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  providerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStars: {
    fontSize: 14,
    marginRight: 5,
  },
  ratingText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginRight: 5,
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
  },
  callButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  callIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  providerDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 16,
    width: 25,
    marginRight: 5,
  },
  phoneNumber: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
    flex: 1,
  },
  tapHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 10,
  },
  areasContainer: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
  },
  areasLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  areas: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  availabilityText: {
    fontSize: 15,
    color: '#28a745',
    fontWeight: '500',
  },
  providerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
  },
  responseTime: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategoryProviders;

