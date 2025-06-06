import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Linking,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://192.168.100.51:5000/api';

const RoommateBrowse = () => {
  const navigation = useNavigation();
  const { currentUser, token } = useAuth();
  const [roommates, setRoommates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterGender, setFilterGender] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchRoommates = async () => {
    try {
      const params = {};
      if (filterGender) params.gender = filterGender;
      if (filterType) params.type = filterType;

      const response = await axios.get(`${API_URL}/roommates`, { params });
      setRoommates(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching roommates:', error);
      Alert.alert('Error', 'Failed to load roommate listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRoommates();
  }, [filterGender, filterType]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoommates();
  };

  const handleDelete = async (id) => {
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
              await axios.delete(`${API_URL}/roommates/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              fetchRoommates();
              Alert.alert('Success', 'Listing deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete listing');
            }
          },
        },
      ]
    );
  };

  const handleCall = (phoneNumber) => {
    const cleanNumber = phoneNumber.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
  };

  const handleWhatsApp = (phoneNumber) => {
    const cleanNumber = phoneNumber.replace(/\s+/g, '').replace('+', '');
    const message = 'Hi! I found you on the roommate finder app and would like to discuss room sharing.';
    Linking.openURL(`whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`);
  };

  const renderRoommateCard = ({ item }) => {
    const isOwner = currentUser && item.userId === currentUser.id;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.badges}>
            <Text style={[styles.badge, styles.typeBadge]}>
              {item.type === 'has_room' ? 'Has Room' : 'Needs Room'}
            </Text>
            <Text style={[styles.badge, styles.genderBadge]}>
              {item.gender}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.location}>📍 {item.location}</Text>
          <Text style={styles.budget}>💰 KSh {item.budget.toLocaleString()}/month</Text>
          <Text style={styles.preference}>👥 Prefers: {item.preferredGender}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        <View style={styles.cardActions}>
          {isOwner ? (
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(item._id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.contactButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.callButton]}
                onPress={() => handleCall(item.whatsappNumber)}
              >
                <Text style={styles.buttonText}>📞 Call</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.whatsappButton]}
                onPress={() => handleWhatsApp(item.whatsappNumber)}
              >
                <Text style={styles.buttonText}>💬 WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const FilterButton = ({ title, value, currentFilter, onPress }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        currentFilter === value && styles.activeFilterButton
      ]}
      onPress={() => onPress(currentFilter === value ? '' : value)}
    >
      <Text style={[
        styles.filterButtonText,
        currentFilter === value && styles.activeFilterButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#50c878" />
        <Text style={styles.loadingText}>Loading roommate listings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filters:</Text>
        <View style={styles.filtersRow}>
          <FilterButton
            title="Male"
            value="male"
            currentFilter={filterGender}
            onPress={setFilterGender}
          />
          <FilterButton
            title="Female"
            value="female"
            currentFilter={filterGender}
            onPress={setFilterGender}
          />
          <FilterButton
            title="Has Room"
            value="has_room"
            currentFilter={filterType}
            onPress={setFilterType}
          />
          <FilterButton
            title="Needs Room"
            value="needs_room"
            currentFilter={filterType}
            onPress={setFilterType}
          />
        </View>
      </View>

      {/* Roommate List */}
      <FlatList
        data={roommates}
        keyExtractor={(item) => item._id}
        renderItem={renderRoommateCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No roommate listings found</Text>
            <Text style={styles.emptySubtext}>Be the first to create one!</Text>
          </View>
        }
        contentContainerStyle={roommates.length === 0 ? styles.emptyList : null}
      />

      {/* Create Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('RoommateCreate')}
      >
        <Text style={styles.createButtonText}>+ Create Listing</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  activeFilterButton: {
    backgroundColor: '#50c878',
    borderColor: '#50c878',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  typeBadge: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
  },
  genderBadge: {
    backgroundColor: '#fce4ec',
    color: '#c2185b',
  },
  cardContent: {
    marginBottom: 15,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  budget: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#50c878',
    marginBottom: 5,
  },
  preference: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButton: {
    backgroundColor: '#2196f3',
  },
  whatsappButton: {
    backgroundColor: '#25d366',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  createButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#50c878',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RoommateBrowse;