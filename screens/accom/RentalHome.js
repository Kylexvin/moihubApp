import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const { width } = Dimensions.get('window');
const API_URL = 'http://192.168.100.51:5000/api';

const RentalHome = ({ navigation }) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

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

  const searchRentals = async (query) => {
    if (!query.trim()) {
      fetchRentals();
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(`${API_URL}/rentals/search`, {
        params: { q: query, page: 1, limit: 10 }
      });
      
      if (response.data.success) {
        setRentals(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRentals();
    setRefreshing(false);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.length > 2) {
      searchRentals(text);
    } else if (text.length === 0) {
      fetchRentals();
    }
  };

  const getVacancyStatusColor = (status) => {
    switch (status) {
      case 'verified_vacant':
        return '#4CAF50';
      case 'verified_occupied':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const getVacancyStatusText = (status) => {
    switch (status) {
      case 'verified_vacant':
        return 'Available';
      case 'verified_occupied':
        return 'Occupied';
      default:
        return 'Unknown';
    }
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
          { backgroundColor: getVacancyStatusColor(item.vacancyStatus) }
        ]}>
          <Text style={styles.statusText}>
            {getVacancyStatusText(item.vacancyStatus)}
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

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.caretakerNumber}</Text>
        </View>

        {item.voteStats && (
          <View style={styles.voteStats}>
            <Text style={styles.voteText}>
              Votes: {item.voteStats.totalVotes} | 
              Vacant: {item.voteStats.vacantVotes} | 
              Occupied: {item.voteStats.occupiedVotes}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
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
            placeholder="Search by location or type..."
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#2196F3" />
          )}
        </View>
      </View>

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
              {searchQuery ? 'Try adjusting your search' : 'Pull to refresh'}
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
  listContainer: {
    padding: 16,
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
});

export default RentalHome;