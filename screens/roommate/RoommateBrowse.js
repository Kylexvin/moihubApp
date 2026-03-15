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
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const API_URL = 'https://moihub.onrender.com/api';

// Midnight Bloom Theme Colors
const theme = {
  primary: '#4A2C3D',     // Deep mauve
  secondary: '#6B4E5E',   // Dusty rose
  accent: '#C45A8A',      // Bright rose
  background: '#241A20',  // Dark purple-gray
  card: '#3A2A32',        // Dark mauve
  text: '#F7E6F0',        // Soft pink-white
  textSecondary: '#B39AA5', // Muted pink
  border: '#5A3E4E',      // Medium mauve
  error: '#D45D5D',       // Rose red
  success: '#7A9E7A',     // Sage green
  gradient: ['#4A2C3D', '#6B4E5E', '#C45A8A'],
};

const RoommateBrowse = () => {
  const navigation = useNavigation();
  const { currentUser, token, isAuthenticated } = useAuth();
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
    const message = 'Hi! I found you on MoiHub roommate finder. I\'m interested in your listing.';
    Linking.openURL(`whatsapp://send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`);
  };

  const isOwnerOfListing = (listing) => {
    if (!currentUser || !isAuthenticated) return false;
    const currentUserId = currentUser.id || currentUser._id || currentUser.userId;
    const listingUserId = listing.userId || listing.user_id || listing.user;
    return String(currentUserId) === String(listingUserId);
  };

  const renderBudget = (item) => {
    if (item.type === 'has_room') {
      return (
        <View style={styles.detailRow}>
          <FontAwesome5 name="money-bill-wave" size={14} color={theme.accent} />
          <Text style={styles.detailText}>
            KSh {item.budget?.toLocaleString()}/month
          </Text>
        </View>
      );
    } else {
      let budgetText = '';
      if (item.budgetFlexible) {
        budgetText = 'Flexible / Negotiable';
      } else if (item.budgetMin && item.budgetMax) {
        budgetText = `KSh ${item.budgetMin.toLocaleString()} - ${item.budgetMax.toLocaleString()}/month`;
      } else if (item.budgetMin) {
        budgetText = `From KSh ${item.budgetMin.toLocaleString()}/month`;
      } else if (item.budgetMax) {
        budgetText = `Up to KSh ${item.budgetMax.toLocaleString()}/month`;
      } else {
        budgetText = 'Flexible / Negotiable';
      }
      
      return (
        <View style={styles.detailRow}>
          <FontAwesome5 name="money-bill-wave" size={14} color={theme.accent} />
          <Text style={styles.detailText}>{budgetText}</Text>
        </View>
      );
    }
  };

  const renderGenderIcon = (gender) => {
    switch(gender) {
      case 'male':
        return <Ionicons name="male" size={16} color="#7A9E7A" />;
      case 'female':
        return <Ionicons name="female" size={16} color="#C45A8A" />;
      default:
        return <Ionicons name="person" size={16} color={theme.textSecondary} />;
    }
  };

  const renderRoommateCard = ({ item }) => {
    const isOwner = isOwnerOfListing(item);
    
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => {
          // Optional: Navigate to detail view
          // navigation.navigate('RoommateDetail', { id: item._id });
        }}
      >
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={['rgba(58, 42, 50, 0.95)', 'rgba(42, 26, 34, 0.98)']}
            style={styles.card}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.nameSection}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.genderChip}>
                  {renderGenderIcon(item.gender)}
                  <Text style={styles.genderText}>
                    {item.gender.charAt(0).toUpperCase() + item.gender.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.badgeContainer}>
                <View style={[
                  styles.typeBadge,
                  item.type === 'has_room' ? styles.hasRoomBadge : styles.needsRoomBadge
                ]}>
                  <MaterialIcons 
                    name={item.type === 'has_room' ? 'home' : 'search'} 
                    size={12} 
                    color="white" 
                  />
                  <Text style={styles.typeBadgeText}>
                    {item.type === 'has_room' ? 'Has Room' : 'Needs Room'}
                  </Text>
                </View>
                
                {isOwner && (
                  <View style={styles.ownerBadge}>
                    <MaterialIcons name="verified" size={12} color="#E6B89C" />
                    <Text style={styles.ownerBadgeText}>Your Listing</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Card Content */}
            <View style={styles.cardContent}>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                <Text style={styles.detailText}>{item.location}</Text>
              </View>
              
              {renderBudget(item)}
              
              <View style={styles.detailRow}>
                <Ionicons name="people-outline" size={16} color={theme.textSecondary} />
                <Text style={styles.detailText}>
                  Prefers: {item.preferredGender === 'any' ? 'Anyone' : item.preferredGender}
                </Text>
              </View>
              
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>About</Text>
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </View>

            {/* Card Actions */}
            <View style={styles.cardActions}>
              {isOwner ? (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item._id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#D45D5D', '#B04A4A']}
                    style={styles.actionGradient}
                  >
                    <MaterialIcons name="delete-outline" size={18} color="white" />
                    <Text style={styles.actionButtonText}>Delete Listing</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.contactButtons}>
                  <TouchableOpacity 
                    style={styles.callButton}
                    onPress={() => handleCall(item.whatsappNumber)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#4A90E2', '#357ABD']}
                      style={styles.actionGradient}
                    >
                      <MaterialIcons name="call" size={16} color="white" />
                      <Text style={styles.actionButtonText}>Call</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.whatsappButton}
                    onPress={() => handleWhatsApp(item.whatsappNumber)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#25D366', '#128C7E']}
                      style={styles.actionGradient}
                    >
                      <FontAwesome5 name="whatsapp" size={16} color="white" />
                      <Text style={styles.actionButtonText}>WhatsApp</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ title, value, currentFilter, onPress, icon }) => {
    const isActive = currentFilter === value;
    const IconComponent = icon === 'male' ? Ionicons : 
                         icon === 'female' ? Ionicons :
                         icon === 'home' ? MaterialIcons : Ionicons;
    const iconName = icon === 'male' ? 'male' :
                    icon === 'female' ? 'female' :
                    icon === 'home' ? 'home' : 'search';
    
    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          isActive && styles.activeFilterButton
        ]}
        onPress={() => onPress(currentFilter === value ? '' : value)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isActive ? [theme.accent, theme.secondary] : ['transparent', 'transparent']}
          style={styles.filterGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <IconComponent 
            name={iconName} 
            size={14} 
            color={isActive ? 'white' : theme.textSecondary} 
          />
          <Text style={[
            styles.filterButtonText,
            isActive && styles.activeFilterButtonText
          ]}>
            {title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={[theme.background, '#1A1218']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>Finding roommates for you...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[theme.background, '#1A1218']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Roommate Finder</Text>
          <View style={styles.headerBadge}>
            <BlurView intensity={60} tint="dark" style={styles.headerBadgeBlur}>
              <MaterialIcons name="people" size={14} color={theme.accent} />
              <Text style={styles.headerBadgeText}>{roommates.length} listings</Text>
            </BlurView>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <BlurView intensity={40} tint="dark" style={styles.filtersBlur}>
            <Text style={styles.filtersTitle}>Filter by</Text>
            <View style={styles.filtersRow}>
              <FilterButton
                title="Male"
                value="male"
                icon="male"
                currentFilter={filterGender}
                onPress={setFilterGender}
              />
              <FilterButton
                title="Female"
                value="female"
                icon="female"
                currentFilter={filterGender}
                onPress={setFilterGender}
              />
              <FilterButton
                title="Has Room"
                value="has_room"
                icon="home"
                currentFilter={filterType}
                onPress={setFilterType}
              />
              <FilterButton
                title="Needs Room"
                value="looking_for_room"
                icon="search"
                currentFilter={filterType}
                onPress={setFilterType}
              />
            </View>
            {(filterGender || filterType) && (
              <TouchableOpacity 
                style={styles.clearFilters}
                onPress={() => {
                  setFilterGender('');
                  setFilterType('');
                }}
              >
                <MaterialIcons name="close" size={14} color={theme.accent} />
                <Text style={styles.clearFiltersText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </BlurView>
        </View>

        {/* Roommate List */}
        <FlatList
          data={roommates}
          keyExtractor={(item) => item._id}
          renderItem={renderRoommateCard}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="people-outline" size={64} color={theme.textSecondary} />
              <Text style={styles.emptyText}>No roommate listings found</Text>
              <Text style={styles.emptySubtext}>Be the first to create one!</Text>
            </View>
          }
          contentContainerStyle={roommates.length === 0 ? styles.emptyList : styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Create Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('RoommateCreate')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={theme.gradient}
            style={styles.createButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="add" size={20} color="white" />
            <Text style={styles.createButtonText}>Create Listing</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    letterSpacing: 0.5,
  },
  headerBadge: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerBadgeBlur: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBadgeText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 15,
  },
  filtersBlur: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(58, 42, 50, 0.3)',
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
    minWidth: 90,
  },
  filterGradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  activeFilterButton: {
    borderColor: theme.accent,
  },
  filterButtonText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  clearFilters: {
    marginTop: 12,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFiltersText: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    letterSpacing: 0.3,
  },
  genderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  genderText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  hasRoomBadge: {
    backgroundColor: 'rgba(74, 44, 61, 0.8)',
    borderWidth: 1,
    borderColor: theme.accent,
  },
  needsRoomBadge: {
    backgroundColor: 'rgba(107, 78, 94, 0.8)',
    borderWidth: 1,
    borderColor: theme.secondary,
  },
  typeBadgeText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 184, 156, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E6B89C',
  },
  ownerBadgeText: {
    fontSize: 11,
    color: '#E6B89C',
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: theme.textSecondary,
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
  },
  descriptionLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  cardActions: {
    marginTop: 4,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  whatsappButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  createButton: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  createButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default RoommateBrowse;