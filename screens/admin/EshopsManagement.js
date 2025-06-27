import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { API_CONFIG } from '../../constants/constants';
import { useAuth } from '../../context/AuthContext';

const EshopsManagement = () => {
  const { currentUser, token, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('shops');
  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendorApplications, setVendorApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: ''
  });

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(new Date());

  // Check admin access on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert('Access Denied', 'Please login to access this feature');
      return;
    }

    if (!currentUser || currentUser.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have permission to access this feature');
      return;
    }

    loadData();
  }, [activeTab, isAuthenticated, currentUser]);

  // Configure axios interceptor
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          Alert.alert('Session Expired', 'Your session has expired. Please login again.', [
            { text: 'OK', onPress: () => logout() }
          ]);
        } else if (error.response?.status === 403) {
          Alert.alert('Access Denied', 'You do not have permission to perform this action');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token, logout]);

  const loadData = async () => {
    if (!isAuthenticated || !currentUser || currentUser.role !== 'admin') return;

    setLoading(true);
    try {
      if (activeTab === 'shops') await fetchShops();
      else if (activeTab === 'categories') await fetchCategories();
      else if (activeTab === 'applications') await fetchVendorApplications();
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        Alert.alert('Error', 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/eshop/admin/shops`);
      if (response.data.success) {
        setShops(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      throw error;
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/eshop/categories/admin/all`);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  };

  const fetchVendorApplications = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/eshop/admin/vendor-applications`);
      if (response.data.success) {
        setVendorApplications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching vendor applications:', error);
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Shop subscription management
  const openSubscriptionModal = (shop) => {
    setSelectedShop(shop);
    setSubscriptionEndDate(shop.subscriptionEndDate ? new Date(shop.subscriptionEndDate) : new Date());
    setSubscriptionModalVisible(true);
  };

  const updateShopSubscription = async () => {
    if (!selectedShop) return;

    try {
      await axios.put(`${API_CONFIG.BASE_URL}/eshop/admin/shop/${selectedShop._id}/status`, {
  subscriptionEndDate: subscriptionEndDate.toISOString(),
  isActive: selectedShop.isActive
});

      Alert.alert('Success', 'Shop subscription updated successfully');
      setSubscriptionModalVisible(false);
      await fetchShops();
    } catch (error) {
      console.error('Error updating subscription:', error);
      Alert.alert('Error', 'Failed to update subscription');
    }
  };

  // Category Management Functions
  const openCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description,
        icon: category.icon || ''
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', icon: '' });
    }
    setCategoryModalVisible(true);
  };

  const saveCategoryForm = async () => {
    if (!categoryForm.name.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }

    try {
      if (editingCategory) {
        await axios.put(`${API_CONFIG.BASE_URL}/eshop/categories/${editingCategory._id}`, categoryForm);
        Alert.alert('Success', 'Category updated successfully');
      } else {
        await axios.post(`${API_CONFIG.BASE_URL}/eshop/categories`, categoryForm);
        Alert.alert('Success', 'Category created successfully');
      }
      setCategoryModalVisible(false);
      await fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', 'Failed to save category');
    }
  };

  const deleteCategory = async (categoryId) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this category?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_CONFIG.BASE_URL}/eshop/categories/${categoryId}`);
            Alert.alert('Success', 'Category deleted successfully');
            await fetchCategories();
          } catch (error) {
            console.error('Error deleting category:', error);
            Alert.alert('Error', 'Failed to delete category');
          }
        }
      }
    ]);
  };

  const toggleCategoryStatus = async (categoryId) => {
    try {
      await axios.patch(`${API_CONFIG.BASE_URL}/eshop/categories/${categoryId}/toggle`);
      await fetchCategories();
      Alert.alert('Success', 'Category status updated successfully');
    } catch (error) {
      console.error('Error toggling category status:', error);
      Alert.alert('Error', 'Failed to update category status');
    }
  };

  // Vendor Application Functions
  const openApprovalModal = (application) => {
    setSelectedApplication(application);
    const defaultEndDate = new Date();
    defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
    setSubscriptionEndDate(defaultEndDate);
    setApprovalModalVisible(true);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSubscriptionEndDate(selectedDate);
    }
  };

  const approveVendorApplication = async () => {
    if (!selectedApplication) return;

    try {
      await axios.put(`${API_CONFIG.BASE_URL}/eshop/admin/vendor/${selectedApplication._id}/approve`, {
        subscriptionEndDate: subscriptionEndDate.toISOString()
      });
      Alert.alert('Success', 'Vendor application approved successfully');
      setApprovalModalVisible(false);
      setSelectedApplication(null);
      await fetchVendorApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      Alert.alert('Error', 'Failed to approve application');
    }
  };

  const rejectVendorApplication = async (applicationId) => {
    Alert.alert('Reject Application', 'Are you sure you want to reject this vendor application?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_CONFIG.BASE_URL}/eshop/admin/vendor/${applicationId}/reject`);
            Alert.alert('Success', 'Vendor application rejected successfully');
            await fetchVendorApplications();
          } catch (error) {
            console.error('Error rejecting application:', error);
            Alert.alert('Error', 'Failed to reject application');
          }
        }
      }
    ]);
  };

  // Early return if user is not authenticated or not admin
  if (!isAuthenticated || !currentUser) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Ionicons name="lock-closed-outline" size={64} color="#666" />
        <Text style={styles.accessDeniedTitle}>Authentication Required</Text>
        <Text style={styles.accessDeniedText}>Please login to access this feature</Text>
      </View>
    );
  }

  if (currentUser.role !== 'admin') {
    return (
      <View style={styles.accessDeniedContainer}>
        <Ionicons name="shield-outline" size={64} color="#666" />
        <Text style={styles.accessDeniedTitle}>Access Denied</Text>
        <Text style={styles.accessDeniedText}>
          You do not have administrator privileges to access this feature
        </Text>
      </View>
    );
  }

  // Render Functions
  const renderTabButton = (tabName, title, icon) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabName && styles.activeTabButton]}
      onPress={() => setActiveTab(tabName)}
    >
      <Ionicons name={icon} size={20} color={activeTab === tabName ? '#fff' : '#666'} />
      <Text style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderShopItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.shopName}</Text>
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, item.isApproved && styles.approvedText]}>
            {item.isApproved ? 'Approved' : 'Pending'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.cardSubtitle}>{item.user.email}</Text>
      <Text style={styles.cardInfo}>Category: {item.category.name}</Text>
      <Text style={styles.cardInfo}>Phone: {item.phoneNumber}</Text>
      <Text style={styles.cardInfo}>Address: {item.address}</Text>
      
      {item.subscriptionEndDate && (
        <Text style={styles.cardInfo}>
          Subscription Expires: {new Date(item.subscriptionEndDate).toLocaleDateString()}
        </Text>
      )}
      
      {item.isApproved && (
        <View style={styles.shopActions}>
          <TouchableOpacity
            style={styles.subscriptionButton}
            onPress={() => openSubscriptionModal(item)}
          >
            <Ionicons name="calendar-outline" size={16} color="#007AFF" />
            <Text style={styles.subscriptionButtonText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderCategoryItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => openCategoryModal(item)}>
            <Ionicons name="create-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => toggleCategoryStatus(item._id)}>
            <Ionicons 
              name={item.isActive ? "toggle" : "toggle-outline"} 
              size={20} 
              color={item.isActive ? "#4CAF50" : "#999"} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => deleteCategory(item._id)}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.cardInfo}>Description: {item.description}</Text>
      {item.icon && <Text style={styles.cardInfo}>Icon: {item.icon}</Text>}
      <Text style={styles.cardInfo}>Status: {item.isActive ? 'Active' : 'Inactive'}</Text>
    </View>
  );

  const renderApplicationItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.shopName}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      </View>
      
      <Text style={styles.cardSubtitle}>{item.user.email}</Text>
      <Text style={styles.cardInfo}>Category: {item.category.name}</Text>
      <Text style={styles.cardInfo}>Phone: {item.phoneNumber}</Text>
      <Text style={styles.cardInfo}>Address: {item.address}</Text>
      <Text style={styles.cardInfo}>Description: {item.description}</Text>
      
      <View style={styles.applicationActions}>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => openApprovalModal(item)}
        >
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => rejectVendorApplication(item._id)}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    let data = [];
    let renderItem = null;

    switch (activeTab) {
      case 'shops':
        data = shops;
        renderItem = renderShopItem;
        break;
      case 'categories':
        data = categories;
        renderItem = renderCategoryItem;
        break;
      case 'applications':
        data = vendorApplications;
        renderItem = renderApplicationItem;
        break;
    }

    return (
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data available</Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>E-shop Management</Text>
        <Text style={styles.headerSubtitle}>Welcome, {currentUser.username || currentUser.email}</Text>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('shops', 'Shops', 'storefront-outline')}
        {renderTabButton('categories', 'Categories', 'grid-outline')}
        {renderTabButton('applications', 'Applications', 'document-text-outline')}
      </View>

      {activeTab === 'categories' && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.addButton} onPress={() => openCategoryModal()}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Category</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderContent()}

      {/* Category Modal */}
      <Modal visible={categoryModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </Text>
            <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={categoryForm.name}
                onChangeText={(text) => setCategoryForm({...categoryForm, name: text})}
                placeholder="Enter category name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={categoryForm.description}
                onChangeText={(text) => setCategoryForm({...categoryForm, description: text})}
                placeholder="Enter category description"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Icon</Text>
              <TextInput
                style={styles.input}
                value={categoryForm.icon}
                onChangeText={(text) => setCategoryForm({...categoryForm, icon: text})}
                placeholder="Enter icon name (e.g., capsules)"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={saveCategoryForm}>
              <Text style={styles.saveButtonText}>
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Subscription Management Modal */}
      <Modal visible={subscriptionModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Subscription</Text>
            <TouchableOpacity onPress={() => setSubscriptionModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedShop && (
              <>
                <Text style={styles.modalSubtitle}>{selectedShop.shopName}</Text>
                <Text style={styles.modalInfo}>Owner: {selectedShop.user.email}</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Subscription End Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                    <Text style={styles.datePickerText}>
                      {subscriptionEndDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={subscriptionEndDate}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={handleDateChange}
                  />
                )}

                <TouchableOpacity style={styles.saveButton} onPress={updateShopSubscription}>
                  <Text style={styles.saveButtonText}>Update Subscription</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Approval Modal */}
      <Modal visible={approvalModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Approve Vendor Application</Text>
            <TouchableOpacity onPress={() => setApprovalModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedApplication && (
              <>
                <Text style={styles.modalSubtitle}>{selectedApplication.shopName}</Text>
                <Text style={styles.modalInfo}>Owner: {selectedApplication.user.email}</Text>
                <Text style={styles.modalInfo}>Category: {selectedApplication.category.name}</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Subscription End Date *</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                    <Text style={styles.datePickerText}>
                      {subscriptionEndDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={subscriptionEndDate}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={handleDateChange}
                  />
                )}

                <TouchableOpacity style={styles.approveButton} onPress={approveVendorApplication}>
                  <Text style={styles.buttonText}>Approve Application</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  activeTabButton: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  actionBar: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
  },
  listContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  cardInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  approvedText: {
    color: '#4CAF50',
  },
  pendingText: {
    color: '#FF9500',
  },
  shopActions: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  subscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  subscriptionButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 5,
  },
  applicationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EshopsManagement;