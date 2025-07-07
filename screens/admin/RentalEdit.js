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

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRentals(rentals);
    } else {
      const filtered = rentals.filter(rental =>
        rental.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rental.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rental.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rental.createdBy?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRentals(filtered);
    }
  }, [searchQuery, rentals]);

  // Fetch rentals
  const fetchRentals = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      
      const response = await axios.get('/api/admin/rentals/all');
      
      if (response.data.success) {
        setRentals(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching rentals:', error);
      Alert.alert('Error', 'Failed to fetch rentals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRentals(false);
    setRefreshing(false);
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
        fetchRentals(false);
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
        fetchRentals(false);
      }
    } catch (error) {
      console.error('Error overriding vacancy:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to override vacancy status');
    } finally {
      setActionLoading(false);
    }
  };
// Add this function after handleSubmitOverride (around line 186)
const handleRemoveOverride = async (rental) => {
  try {
    setActionLoading(true);
    const response = await axios.delete(`/api/admin/rentals/${rental._id}/override`);
    
    if (response.data.success) {
      Alert.alert('Success', 'Override removed successfully');
      fetchRentals(false);
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
        fetchRentals(false);
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
        fetchRentals(false);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to approve rental');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (rental) => {
    Alert.prompt(
      'Reject Rental',
      'Provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async (reason) => {
            if (!reason?.trim()) return;
            try {
              setActionLoading(true);
              const response = await axios.put(`/api/admin/rentals/${rental._id}/reject`, {
                reason: reason.trim(),
              });
              
              if (response.data.success) {
                Alert.alert('Success', 'Rental rejected successfully');
                fetchRentals(false);
              }
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject rental');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ],
      'plain-text'
    );
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

  // Render rental item (minimal, no images)
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
      <View style={styles.header}>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rentals..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results count */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {filteredRentals.length} rental{filteredRentals.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity onPress={() => fetchRentals()}>
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
      />

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
  },
  header: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsText: {
    color: '#666',
    fontSize: 14,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  cardInfo: {
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  caretaker: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  owner: {
    fontSize: 12,
    color: '#999',
  },
  override: {
    backgroundColor: '#f3e5f5',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  overrideText: {
    fontSize: 12,
    color: '#9C27B0',
    fontWeight: '500',
  },
  removeOverrideBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 12,
  paddingVertical: 6,
  backgroundColor: '#FFF3E0',
  borderRadius: 6,
  marginRight: 8,
},
removeOverrideBtnText: {
  color: '#FF5722',
  fontSize: 12,
  fontWeight: '500',
  marginLeft: 4,
},
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
  },
  editBtnText: {
    color: '#2196F3',
    fontSize: 12,
    marginLeft: 4,
  },
  overrideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3e5f5',
    borderRadius: 4,
  },
  overrideBtnText: {
    color: '#9C27B0',
    fontSize: 12,
    marginLeft: 4,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e8f5e8',
    borderRadius: 4,
  },
  approveBtnText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 4,
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  form: {
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageSection: {
    marginTop: 8,
  },
  imagePreview: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelBtn: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
  saveBtn: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteActionBtn: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F44336',
    alignItems: 'center',
  },
  deleteActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  warningText: {
    color: '#F44336',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default RentalEdit;