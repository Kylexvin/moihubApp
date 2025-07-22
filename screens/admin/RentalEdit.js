import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch,
  Button,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const RentalEdit = ({ navigation }) => {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [filteredRentals, setFilteredRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [overrideForm, setOverrideForm] = useState({
    hasVacancy: false,
    reason: '',
  });
  const [deleteReason, setDeleteReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editImages, setEditImages] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRentals, setTotalRentals] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const ITEMS_PER_PAGE = 20;

// Set up axios defaults
useEffect(() => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}, [token]);

useEffect(() => {
  const delayedSearch = setTimeout(() => {
    setCurrentPage(1);
    fetchRentals(true, 1, searchQuery.trim());
  }, 500);

  return () => clearTimeout(delayedSearch);
}, [searchQuery]);



  // Fetch rentals with pagination
// Fetch rentals with pagination
const fetchRentals = useCallback(async (showLoader = true, page = 1, search = '') => {
  try {
    if (showLoader) setLoading(true);
    if (page > 1) setLoadingMore(true);

    const params = {
      page,
      limit: ITEMS_PER_PAGE,
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    const response = await axios.get('/api/admin/rentals/all', { params });

    if (response.data.success) {
      const { data, pagination } = response.data;

      const mergeUniqueById = (prev, next) => {
        const combined = [...prev, ...next];
        return combined.filter(
          (item, index, self) => index === self.findIndex(r => r._id === item._id)
        );
      };

      if (page === 1) {
        setRentals(data);
        setFilteredRentals(data);
      } else {
        setRentals(prev => mergeUniqueById(prev, data));
        setFilteredRentals(prev => mergeUniqueById(prev, data));
      }

      if (pagination) {
        const currentPage = pagination.currentPage || pagination.page || page;
        const totalPages = pagination.totalPages || pagination.pages || Math.ceil((pagination.total || 0) / ITEMS_PER_PAGE);
        const total = pagination.total || pagination.totalCount || 0;
        const hasNext = pagination.hasNext || pagination.hasNextPage || currentPage < totalPages;

        setCurrentPage(currentPage);
        setTotalPages(totalPages);
        setTotalRentals(total);
        setHasNextPage(hasNext);
      } else {
        const total = response.data.total || data.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        const hasNext = page < totalPages;

        setCurrentPage(page);
        setTotalPages(totalPages);
        setTotalRentals(total);
        setHasNextPage(hasNext);
      }
    } else {
      Alert.alert('Error', 'Failed to fetch rentals');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to fetch rentals');
  } finally {
    setLoading(false);
    setLoadingMore(false);
  }
}, []);

useEffect(() => {
  fetchRentals();
}, [fetchRentals]);

const onRefresh = async () => {
  setRefreshing(true);
  setCurrentPage(1);
  setRentals([]);
  setFilteredRentals([]);
  await fetchRentals(false, 1, searchQuery);
  setRefreshing(false);
};


  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);



  // Load more rentals (pagination)
const loadMoreRentals = () => {
  console.log('loadMoreRentals called:', {
    loadingMore,
    hasNextPage,
    currentPage,
    totalPages
  });
  
  if (!loadingMore && hasNextPage && currentPage < totalPages) {
    const nextPage = currentPage + 1;
    console.log('Loading page:', nextPage);
    fetchRentals(false, nextPage, searchQuery);
  }
};

  // Edit rental
  const handleEdit = (rental) => {
    setSelectedRental(rental);
    setEditForm({
      name: rental.name || '',
      location: rental.location || '',
      amount: rental.amount?.toString() || '',
      type: rental.type || '',
      caretakerNumber: rental.caretakerNumber || '',
      hasVacant: rental.hasVacant === true,
    });
    setEditImages([]);
    setShowEditModal(true);
  };

  // Update rental
  const handleUpdate = async () => {
    if (!selectedRental) return;

    try {
      setActionLoading(true);

      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('location', editForm.location.toLowerCase());
      formData.append('amount', editForm.amount);
      formData.append('type', editForm.type.toLowerCase());
      formData.append('caretakerNumber', editForm.caretakerNumber);
      formData.append('hasVacant', editForm.hasVacant ? 'true' : 'false');

      if (editImages.length > 0) {
        editImages.forEach((image, index) => {
          formData.append('images', {
            uri: image.uri,
            type: 'image/jpeg',
            name: `edit_image_${index}.jpg`,
          });
        });
      }

      const response = await axios.put(
        `/api/admin/rentals/${selectedRental._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Rental updated successfully');
        setShowEditModal(false);
        // Refresh current page
        fetchRentals(false, 1, searchQuery);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error updating rental:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update rental');
    } finally {
      setActionLoading(false);
    }
  };

  // Override vacancy status
  const handleOverride = (rental) => {
    setSelectedRental(rental);
    setOverrideForm({
      hasVacancy: rental.adminOverride?.hasVacancy || false,
      reason: rental.adminOverride?.reason || '',
    });
    setShowOverrideModal(true);
  };

  const handleSubmitOverride = async () => {
    if (!selectedRental || !overrideForm.reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the override');
      return;
    }

    try {
      setActionLoading(true);
      
      const response = await axios.put(`/api/admin/rentals/${selectedRental._id}/override`, {
        hasVacancy: overrideForm.hasVacancy,
        reason: overrideForm.reason,
      });
      
      if (response.data.success) {
        Alert.alert('Success', 'Vacancy status overridden successfully');
        setShowOverrideModal(false);
        // Refresh current page
        fetchRentals(false, 1, searchQuery);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error overriding vacancy:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to override vacancy status');
    } finally {
      setActionLoading(false);
    }
  };

  // Remove override
  const handleRemoveOverride = async (rental) => {
    try {
      setActionLoading(true);
      const response = await axios.delete(`/api/admin/rentals/${rental._id}/override`);
      
      if (response.data.success) {
        Alert.alert('Success', 'Override removed successfully');
        // Refresh current page
        fetchRentals(false, 1, searchQuery);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error removing override:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove override');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete rental
  const handleDelete = (rental) => {
    setSelectedRental(rental);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRental) return;

    try {
      setActionLoading(true);
      
      const response = await axios.delete(`/api/admin/rentals/${selectedRental._id}`, {
        data: { reason: deleteReason },
      });
      
      if (response.data.success) {
        Alert.alert('Success', 'Rental deleted successfully');
        setShowDeleteModal(false);
        // Refresh current page
        fetchRentals(false, 1, searchQuery);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error deleting rental:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete rental');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve/Reject rentals
  const handleApprove = async (rental) => {
    try {
      setActionLoading(true);
      const response = await axios.put(`/api/admin/rentals/${rental._id}/approve`);
      
      if (response.data.success) {
        Alert.alert('Success', 'Rental approved successfully');
        // Refresh current page
        fetchRentals(false, 1, searchQuery);
        setCurrentPage(1);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to approve rental');
    } finally {
      setActionLoading(false);
    }
  };



  // Image picker
  const handlePickEditImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 3,
      });

      if (!result.canceled) {
        const selected = result.assets.map((asset) => ({
          uri: asset.uri,
        }));
        setEditImages(selected);
      }
    } catch (err) {
      console.error('Image picker error:', err);
    }
  };

  // Render rental item
  const renderRentalItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={[styles.status, { color: item.isApproved ? '#4CAF50' : '#FF9800' }]}>
            {item.isApproved ? 'Approved' : 'Pending'}
          </Text>
        </View>
        <Text style={styles.amount}>KSh {item.amount?.toLocaleString()}</Text>
      </View>
      
      <View style={styles.cardInfo}>
        <Text style={styles.location}>{item.location} • {item.type}</Text>
        <Text style={styles.caretaker}>{item.caretakerNumber}</Text>
        <Text style={styles.owner}>{item.createdBy?.email}</Text>
      </View>

      {item.adminOverride?.isActive && (
        <View style={styles.override}>
          <Text style={styles.overrideText}>
            Override: {item.adminOverride.hasVacancy ? 'Vacant' : 'Occupied'}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
          <Ionicons name="create-outline" size={16} color="#2196F3" />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        
        {item.adminOverride?.isActive ? (
          <TouchableOpacity style={styles.removeOverrideBtn} onPress={() => handleRemoveOverride(item)}>
            <Ionicons name="close-circle-outline" size={16} color="#FF5722" />
            <Text style={styles.removeOverrideBtnText}>Remove Override</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.overrideBtn} onPress={() => handleOverride(item)}>
            <Ionicons name="shield-outline" size={16} color="#9C27B0" />
            <Text style={styles.overrideBtnText}>Override</Text>
          </TouchableOpacity>
        )}
        
        {!item.isApproved && (
          <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
            <Ionicons name="checkmark-outline" size={16} color="#4CAF50" />
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={16} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render footer for pagination
const renderFooter = () => {
  if (loadingMore) {
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={styles.loadingText}>Loading more rentals...</Text>
      </View>
    );
  }
  
  // Only show "all loaded" message if we have valid pagination data
  if (hasNextPage === false && filteredRentals.length > 0 && totalRentals > 0) {
    return (
      <View style={styles.footerLoader}>
        <Text style={styles.loadingText}>
          All {totalRentals} rentals loaded
        </Text>
      </View>
    );
  }
  
  // Show debug info if pagination is undefined
  if (filteredRentals.length > 0 && (hasNextPage === undefined || totalPages === undefined)) {
    return (
      <View style={styles.footerLoader}>
        <Text style={styles.loadingText}>
          Debug: {filteredRentals.length} rentals loaded (pagination data missing)
        </Text>
      </View>
    );
  }
  
  return null;
};

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text>Loading rentals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with search */}


      {/* Results count and pagination info */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {totalRentals} total rental{totalRentals !== 1 ? 's' : ''} 
          {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
        </Text>
        <TouchableOpacity onPress={() => {
  setCurrentPage(1);
  setRentals([]);
  setFilteredRentals([]);
  fetchRentals(true, 1, searchQuery);
}}>
          <Ionicons name="refresh-outline" size={20} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Rentals list */}
      <FlatList
  data={filteredRentals}
  renderItem={renderRentalItem}
  keyExtractor={(item) => item._id}
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={styles.list}
  onEndReached={loadMoreRentals}
  onEndReachedThreshold={0.1} // Reduced threshold for better triggering
  ListFooterComponent={renderFooter}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={20}
  windowSize={21}
  // Add empty state
  ListEmptyComponent={
    !loading && (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No rentals found</Text>
      </View>
    )
  }
/>
{hasNextPage && !loadingMore && (
  <TouchableOpacity 
    style={styles.loadMoreButton}
    onPress={() => loadMoreRentals()}
  >
    <Text style={styles.loadMoreButtonText}>
      Load More ({filteredRentals.length} of {totalRentals})
    </Text>
  </TouchableOpacity>
)}
{totalPages > 1 && (
  <View style={styles.paginationContainer}>
    <Text style={styles.paginationInfo}>
      Page {currentPage} of {totalPages} ({totalRentals} total rentals)
    </Text>
    <View style={styles.paginationControls}>
      <TouchableOpacity
        style={[
          styles.pageButton,
          currentPage === 1 && styles.pageButtonDisabled
        ]}
        onPress={() => {
          if (currentPage > 1) {
            const prevPage = currentPage - 1;
            setCurrentPage(prevPage);
            setRentals([]);
            setFilteredRentals([]);
            fetchRentals(true, prevPage, searchQuery);
          }
        }}
        disabled={currentPage === 1}
      >
        <Ionicons 
          name="chevron-back" 
          size={16} 
          color={currentPage === 1 ? "#999" : "#fff"} 
        />
        <Text style={[
          styles.pageButtonText,
          currentPage === 1 && styles.pageButtonTextDisabled
        ]}>
          Previous
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.pageButton,
          currentPage === totalPages && styles.pageButtonDisabled
        ]}
        onPress={() => {
          if (currentPage < totalPages) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            setRentals([]);
            setFilteredRentals([]);
            fetchRentals(true, nextPage, searchQuery);
          }
        }}
        disabled={currentPage === totalPages}
      >
        <Text style={[
          styles.pageButtonText,
          currentPage === totalPages && styles.pageButtonTextDisabled
        ]}>
          Next
        </Text>
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={currentPage === totalPages ? "#999" : "#fff"} 
        />
      </TouchableOpacity>
    </View>
  </View>
)}
      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Rental</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
              />
              
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Location"
                  value={editForm.location}
                  onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Type"
                  value={editForm.type}
                  onChangeText={(text) => setEditForm({ ...editForm, type: text })}
                />
              </View>

              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Amount"
                  value={editForm.amount}
                  onChangeText={(text) => setEditForm({ ...editForm, amount: text })}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Caretaker Number"
                  value={editForm.caretakerNumber}
                  onChangeText={(text) => setEditForm({ ...editForm, caretakerNumber: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.switchRow}>
                <Text>Has Vacant Rooms</Text>
                <Switch
                  value={editForm.hasVacant}
                  onValueChange={(value) => setEditForm({ ...editForm, hasVacant: value })}
                />
              </View>

              <View style={styles.imageSection}>
                <Button title="Update Images" onPress={handlePickEditImages} />
                {editImages.length > 0 && (
                  <View style={styles.imagePreview}>
                    {editImages.map((img, idx) => (
                      <Image key={idx} source={{ uri: img.uri }} style={styles.previewImage} />
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Override Modal */}
      <Modal visible={showOverrideModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Override Vacancy</Text>
              <TouchableOpacity onPress={() => setShowOverrideModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.switchRow}>
                <Text>Has Vacancy</Text>
                <Switch
                  value={overrideForm.hasVacancy}
                  onValueChange={(value) => setOverrideForm({ ...overrideForm, hasVacancy: value })}
                />
              </View>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Reason for override"
                value={overrideForm.reason}
                onChangeText={(text) => setOverrideForm({ ...overrideForm, reason: text })}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowOverrideModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmitOverride} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveText}>Override</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Rental</Text>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.warningText}>Are you sure you want to delete this rental?</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Reason for deletion (optional)"
                value={deleteReason}
                onChangeText={setDeleteReason}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteActionBtn} onPress={handleConfirmDelete} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.deleteActionText}>Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingBottom: 100, // Extra space for load more button
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  cardInfo: {
    marginBottom: 12,
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  caretaker: {
    fontSize: 14,
    color: '#666',
  },
  owner: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  override: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderRadius: 4,
  },
  overrideText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  editBtnText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '500',
  },
  overrideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  overrideBtnText: {
    color: '#9C27B0',
    fontSize: 12,
    fontWeight: '500',
  },
  removeOverrideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  removeOverrideBtnText: {
    color: '#FF5722',
    fontSize: 12,
    fontWeight: '500',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  approveBtnText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteBtn: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 16,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  // Pagination Controls Styles
  paginationContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paginationInfo: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  pageButtonDisabled: {
    backgroundColor: '#ccc',
  },
  pageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pageButtonTextDisabled: {
    color: '#999',
  },
  loadMoreButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  loadMoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    gap: 15,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  warningText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  imageSection: {
    gap: 10,
  },
  imagePreview: {
    flexDirection: 'row',
    gap: 10,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    minWidth: 80,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteActionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F44336',
    minWidth: 80,
    alignItems: 'center',
  },
  deleteActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RentalEdit;