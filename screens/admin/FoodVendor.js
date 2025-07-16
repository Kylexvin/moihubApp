import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth } = Dimensions.get('window');

// Global axios configuration
const setupAxiosInterceptors = () => {
  axios.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['Content-Type'] = 'application/json';
      return config;
    },
    (error) => Promise.reject(error)
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        AsyncStorage.removeItem('token');
        // Navigate to login - you can add navigation logic here
      }
      return Promise.reject(error);
    }
  );
};

const FoodVendor = ({ navigation }) => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [subscriptionDate, setSubscriptionDate] = useState('');
  const [approvalMode, setApprovalMode] = useState(false);

  const API_BASE_URL = 'https://moihub.onrender.com/api/food';

  // Setup axios interceptors on component mount
  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  // Fetch vendors from API
  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/vendors`);
      setVendors(response.data.vendors);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch vendors';
      Alert.alert('Error', errorMessage);
      setLoading(false);
    }
  };

  // Filter vendors based on search term and active tab
  const filterVendors = () => {
    let filtered = vendors;

    // Filter by tab
    if (activeTab === 'pending') {
      filtered = filtered.filter(vendor => !vendor.isApproved);
    } else if (activeTab === 'active') {
      filtered = filtered.filter(vendor => vendor.isApproved && vendor.isActive);
    } else if (activeTab === 'suspended') {
      filtered = filtered.filter(vendor => vendor.isApproved && !vendor.isActive);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(vendor =>
        vendor.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredVendors(filtered);
  };

  // Approve vendor
  const approveVendor = async (vendorId, subscriptionEndDate) => {
    try {
      await axios.patch(`${API_BASE_URL}/admin/vendors/${vendorId}/approve`, {
        subscriptionEndDate
      });
      fetchVendors();
      setModalVisible(false);
      Alert.alert('Success', 'Vendor approved successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to approve vendor';
      Alert.alert('Error', errorMessage);
    }
  };

  // Update vendor status
  const updateVendorStatus = async (vendorId, isApproved, isActive, subscriptionEndDate) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/vendors/${vendorId}/status`, {
        isApproved,
        isActive,
        subscriptionEndDate
      });
      fetchVendors();
      setModalVisible(false);
      Alert.alert('Success', 'Vendor status updated successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update vendor status';
      Alert.alert('Error', errorMessage);
    }
  };

  // Delete vendor
  const deleteVendor = (vendorId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this vendor? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/admin/vendors/${vendorId}`);
              setVendors(vendors.filter(vendor => vendor._id !== vendorId));
              Alert.alert('Success', 'Vendor deleted successfully!');
            } catch (error) {
              const errorMessage = error.response?.data?.message || error.message || 'Failed to delete vendor';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status info
  const getStatusInfo = (vendor) => {
    if (vendor.isApproved && vendor.isActive) {
      return { text: 'Active', color: '#28a745', bgColor: '#d4edda' };
    } else if (vendor.isApproved && !vendor.isActive) {
      return { text: 'Suspended', color: '#ffc107', bgColor: '#fff3cd' };
    } else {
      return { text: 'Pending', color: '#6c757d', bgColor: '#e9ecef' };
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVendors();
    setRefreshing(false);
  };

  // Open modal for vendor details or approval
  const openModal = (vendor, isApprovalMode = false) => {
    setSelectedVendor(vendor);
    setApprovalMode(isApprovalMode);
    if (isApprovalMode) {
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear() + 1);
      setSubscriptionDate(defaultDate.toISOString().split('T')[0]);
    } else {
      setSubscriptionDate(vendor.subscriptionEndDate?.split('T')[0] || '');
    }
    setModalVisible(true);
  };

  // Initialize component
  useEffect(() => {
    fetchVendors();
  }, []);

  // Filter vendors when dependencies change
  useEffect(() => {
    filterVendors();
  }, [vendors, searchTerm, activeTab]);

  // Tab configuration
  const tabs = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'pending', label: 'Pending', icon: 'hourglass-empty' },
    { key: 'active', label: 'Active', icon: 'check-circle' },
    { key: 'suspended', label: 'Suspended', icon: 'pause-circle-outline' }
  ];

  // Render vendor card
  const renderVendorCard = ({ item: vendor }) => {
    const statusInfo = getStatusInfo(vendor);
    
    return (
      <View style={styles.vendorCard}>
        <View style={styles.cardHeader}>
          <View style={styles.vendorInfo}>
            <View style={styles.avatar}>
              <Icon name="person" size={24} color="white" />
            </View>
            <View style={styles.vendorDetails}>
              <Text style={styles.vendorName}>
                {vendor.user?.username || 'Unnamed Vendor'}
              </Text>
              <Text style={styles.vendorEmail}>{vendor.user?.email}</Text>
              {vendor.phone && (
                <Text style={styles.vendorPhone}>{vendor.phone}</Text>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Icon name="event" size={16} color="#007bff" />
            <Text style={styles.infoLabel}>Subscription</Text>
            <Text style={styles.infoValue}>
              {formatDate(vendor.subscriptionEndDate)}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Icon name="access-time" size={16} color="#28a745" />
            <Text style={styles.infoLabel}>Joined</Text>
            <Text style={styles.infoValue}>
              {formatDate(vendor.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => openModal(vendor, false)}
          >
            <Icon name="visibility" size={16} color="white" />
            <Text style={styles.buttonText}>View</Text>
          </TouchableOpacity>

          <View style={styles.rightButtons}>
            {!vendor.isApproved ? (
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => openModal(vendor, true)}
              >
                <Icon name="check-circle" size={16} color="white" />
                <Text style={styles.buttonText}>Approve</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={vendor.isActive ? styles.suspendButton : styles.activateButton}
                onPress={() => updateVendorStatus(
                  vendor._id,
                  true,
                  !vendor.isActive,
                  vendor.subscriptionEndDate
                )}
              >
                <Icon name={vendor.isActive ? "pause" : "play-arrow"} size={16} color="white" />
                <Text style={styles.buttonText}>
                  {vendor.isActive ? 'Suspend' : 'Activate'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteVendor(vendor._id)}
            >
              <Icon name="delete" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
  <StatusBar barStyle="dark-content" backgroundColor="white" />

  {/* Header */}
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Food Vendor Management</Text>
    <TouchableOpacity onPress={fetchVendors} style={styles.refreshButton}>
      <Icon name="refresh" size={24} color="#007bff" />
    </TouchableOpacity>
  </View>

  {/* Search Bar */}
  <View style={styles.searchContainer}>
    <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
    <TextInput
      style={styles.searchInput}
      placeholder="Search vendors..."
      value={searchTerm}
      onChangeText={setSearchTerm}
    />
  </View>

  {/* Tabs */}
  <View style={styles.tabContainer}>
    {tabs.map(tab => (
      <TouchableOpacity
        key={tab.key}
        style={[styles.tab, activeTab === tab.key && styles.activeTab]}
        onPress={() => setActiveTab(tab.key)}
      >
        <Icon
          name={tab.icon}
          size={20}
          color={activeTab === tab.key ? '#007bff' : '#666'}
        />
        <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>

  {/* Vendor List */}
  {loading ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007bff" />
      <Text style={styles.loadingText}>Loading vendors...</Text>
    </View>
  ) : (
    <FlatList
      data={filteredVendors}
      renderItem={renderVendorCard}
      keyExtractor={item => item._id}
      contentContainerStyle={styles.listContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Icon name="search" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No vendors found</Text>
          <Text style={styles.emptySubText}>Try adjusting your search criteria</Text>
        </View>
      }
    />
  )}

  {/* Modal */}
  <Modal
    visible={modalVisible}
    animationType="slide"
    transparent={true}
    onRequestClose={() => setModalVisible(false)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {approvalMode ? 'Approve Vendor' : 'Vendor Details'}
          </Text>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
            <Icon name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalBody}>
          {selectedVendor ? (
            <>
              <View style={styles.vendorModalInfo}>
                <View style={styles.avatar}>
                  <Icon name="person" size={24} color="white" />
                </View>
                <View style={styles.vendorModalDetails}>
                  <Text style={styles.modalVendorName}>
                    {selectedVendor.user?.username || 'Unnamed Vendor'}
                  </Text>
                  <Text style={styles.modalVendorEmail}>{selectedVendor.user?.email}</Text>
                  {selectedVendor.phone && (
                    <Text style={styles.modalVendorPhone}>{selectedVendor.phone}</Text>
                  )}
                </View>
              </View>

              <View style={styles.statusSection}>
                <Text style={styles.sectionLabel}>Current Status</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusInfo(selectedVendor).bgColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusInfo(selectedVendor).color },
                    ]}
                  >
                    {getStatusInfo(selectedVendor).text}
                  </Text>
                </View>
              </View>

              <View style={styles.dateSection}>
                <Text style={styles.sectionLabel}>Subscription End Date</Text>
                <TextInput
                  style={styles.dateInput}
                  value={subscriptionDate}
                  onChangeText={setSubscriptionDate}
                  placeholder="YYYY-MM-DD"
                />
                <Text style={styles.dateHelper}>
                  Set the date when this vendor's subscription will expire
                </Text>
              </View>

              {!approvalMode && (
                <View style={styles.additionalInfo}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>Joined On</Text>
                      <Text style={styles.infoValue}>
                        {formatDate(selectedVendor.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoLabel}>Last Updated</Text>
                      <Text style={styles.infoValue}>
                        {formatDate(selectedVendor.updatedAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          ) : (
            <Text style={{ textAlign: 'center' }}>Loading vendor details...</Text>
          )}
        </View>

        {selectedVendor && (
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <View style={styles.actionButtonsModal}>
              {approvalMode ? (
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => approveVendor(selectedVendor._id, subscriptionDate)}
                >
                  <Icon name="check-circle" size={16} color="white" />
                  <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.updateButton}
                    onPress={() =>
                      updateVendorStatus(
                        selectedVendor._id,
                        selectedVendor.isApproved,
                        selectedVendor.isActive,
                        subscriptionDate
                      )
                    }
                  >
                    <Text style={styles.buttonText}>Update</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={
                      selectedVendor.isApproved && selectedVendor.isActive
                        ? styles.suspendButton
                        : styles.activateButton
                    }
                    onPress={() => {
                      if (!selectedVendor) return;
                      if (!selectedVendor.isApproved) {
                        updateVendorStatus(selectedVendor._id, true, true, subscriptionDate);
                      } else {
                        updateVendorStatus(
                          selectedVendor._id,
                          true,
                          !selectedVendor.isActive,
                          subscriptionDate
                        );
                      }
                    }}
                  >
                    <Text style={styles.buttonText}>
                      {!selectedVendor.isApproved
                        ? 'Approve'
                        : selectedVendor.isActive
                        ? 'Suspend'
                        : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  </Modal>
</SafeAreaView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  refreshButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  vendorCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vendorDetails: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  vendorEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  vendorPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  suspendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffc107',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: screenWidth * 0.9,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007bff',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  vendorModalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vendorModalDetails: {
    flex: 1,
  },
  modalVendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalVendorEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  modalVendorPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateSection: {
    marginBottom: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 4,
  },
  dateHelper: {
    fontSize: 12,
    color: '#666',
  },
  additionalInfo: {
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#666',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
  actionButtonsModal: {
    flexDirection: 'row',
  },
});

export default FoodVendor;