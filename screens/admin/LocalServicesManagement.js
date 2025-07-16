import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const LocalServicesManagement = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('services');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Services State
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Organizations State
  const [organizations, setOrganizations] = useState([]);
  const [orgCategories] = useState([
    'Health', 'Religious', 'Tech', 'Academic', 'Leadership', 'Technology', 'Community'
  ]);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); // 'category', 'provider', 'organization'
  const [editingItem, setEditingItem] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCategories(),
        loadOrganizations(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  // Services Functions
  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/services/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  const loadProvidersByCategory = async (categoryId) => {
    try {
      const response = await axios.get(`/api/services/providers/${categoryId}`);
      setProviders(response.data.providers);
      setSelectedCategory(response.data.category);
    } catch (error) {
      console.error('Error loading providers:', error);
      Alert.alert('Error', 'Failed to load providers');
    }
  };

  const createCategory = async () => {
    try {
      await axios.post('/api/services/category', {
        name: formData.name,
        description: formData.description,
      });
      Alert.alert('Success', 'Category created successfully');
      loadCategories();
      closeModal();
    } catch (error) {
      console.error('Error creating category:', error);
      Alert.alert('Error', 'Failed to create category');
    }
  };

  const createProvider = async () => {
    try {
      await axios.post('/api/services/provider', {
        providerName: formData.providerName,
        phoneNumber: formData.phoneNumber,
        category: formData.category,
        areasOfOperation: formData.areasOfOperation?.split(',').map(area => area.trim()) || [],
      });
      Alert.alert('Success', 'Provider created successfully');
      if (selectedCategory) {
        loadProvidersByCategory(formData.category);
      }
      closeModal();
    } catch (error) {
      console.error('Error creating provider:', error);
      Alert.alert('Error', 'Failed to create provider');
    }
  };

  const approveProvider = async (providerId) => {
    try {
      await axios.patch(`/api/services/provider/${providerId}/approve`);
      Alert.alert('Success', 'Provider approved successfully');
      if (selectedCategory) {
        loadProvidersByCategory(selectedCategory);
      }
    } catch (error) {
      console.error('Error approving provider:', error);
      Alert.alert('Error', 'Failed to approve provider');
    }
  };

  const rejectProvider = async (providerId) => {
    Alert.alert(
      'Confirm Rejection',
      'Are you sure you want to reject and delete this provider?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`/api/services/provider/${providerId}/reject`);
              Alert.alert('Success', 'Provider rejected and deleted');
              if (selectedCategory) {
                loadProvidersByCategory(selectedCategory);
              }
            } catch (error) {
              console.error('Error rejecting provider:', error);
              Alert.alert('Error', 'Failed to reject provider');
            }
          },
        },
      ]
    );
  };

  const updateProvider = async () => {
    try {
      await axios.put(`/api/services/provider/${editingItem._id}`, {
        providerName: formData.providerName,
        phoneNumber: formData.phoneNumber,
        category: formData.category,
        areasOfOperation: formData.areasOfOperation?.split(',').map(area => area.trim()) || [],
      });
      Alert.alert('Success', 'Provider updated successfully');
      if (selectedCategory) {
        loadProvidersByCategory(formData.category);
      }
      closeModal();
    } catch (error) {
      console.error('Error updating provider:', error);
      Alert.alert('Error', 'Failed to update provider');
    }
  };

  // Organizations Functions
  const loadOrganizations = async () => {
    try {
      const response = await axios.get('/api/organizations');
      setOrganizations(response.data.data);
    } catch (error) {
      console.error('Error loading organizations:', error);
      Alert.alert('Error', 'Failed to load organizations');
    }
  };

  const createOrganization = async () => {
    try {
      await axios.post('/api/organizations', {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        icon: formData.icon || '🏢',
        color: formData.color || '#F0F9FF',
        services: formData.services?.split(',').map(service => service.trim()) || [],
        whatsappMessage: formData.whatsappMessage,
        phoneNumber: formData.phoneNumber,
        weeklyMeetingDay: formData.weeklyMeetingDay,
        meetingTime: formData.meetingTime,
        meetingLocation: formData.meetingLocation,
      });
      Alert.alert('Success', 'Organization created successfully');
      loadOrganizations();
      closeModal();
    } catch (error) {
      console.error('Error creating organization:', error);
      Alert.alert('Error', 'Failed to create organization');
    }
  };

  const updateOrganization = async () => {
    try {
      await axios.put(`/api/organizations/${editingItem._id}`, {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        services: formData.services?.split(',').map(service => service.trim()) || [],
        whatsappMessage: formData.whatsappMessage,
        phoneNumber: formData.phoneNumber,
        weeklyMeetingDay: formData.weeklyMeetingDay,
        meetingTime: formData.meetingTime,
        meetingLocation: formData.meetingLocation,
      });
      Alert.alert('Success', 'Organization updated successfully');
      loadOrganizations();
      closeModal();
    } catch (error) {
      console.error('Error updating organization:', error);
      Alert.alert('Error', 'Failed to update organization');
    }
  };

  const deleteOrganization = async (orgId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this organization?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`/api/organizations/${orgId}`);
              Alert.alert('Success', 'Organization deleted successfully');
              loadOrganizations();
            } catch (error) {
              console.error('Error deleting organization:', error);
              Alert.alert('Error', 'Failed to delete organization');
            }
          },
        },
      ]
    );
  };

  // Modal Functions
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    
    if (item) {
      // Editing existing item
      if (type === 'provider') {
        setFormData({
          providerName: item.providerName,
          phoneNumber: item.phoneNumber,
          category: item.category._id,
          areasOfOperation: item.areasOfOperation.join(', '),
        });
      } else if (type === 'organization') {
        setFormData({
          name: item.name,
          category: item.category,
          description: item.description,
          icon: item.icon,
          color: item.color,
          services: item.services.join(', '),
          whatsappMessage: item.whatsappMessage,
          phoneNumber: item.phoneNumber,
          weeklyMeetingDay: item.weeklyMeetingDay,
          meetingTime: item.meetingTime,
          meetingLocation: item.meetingLocation,
        });
      }
    } else {
      // Creating new item
      setFormData({});
    }
    
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType('');
    setEditingItem(null);
    setFormData({});
  };

  const handleSubmit = () => {
    if (modalType === 'category') {
      createCategory();
    } else if (modalType === 'provider') {
      editingItem ? updateProvider() : createProvider();
    } else if (modalType === 'organization') {
      editingItem ? updateOrganization() : createOrganization();
    }
  };

  // Render Functions
  const renderServiceCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => loadProvidersByCategory(item._id)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666" />
    </TouchableOpacity>
  );

  const renderProvider = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.providerName}</Text>
        <Text style={styles.cardDescription}>{item.phoneNumber}</Text>
        <Text style={styles.cardDescription}>
          Areas: {item.areasOfOperation.join(', ')}
        </Text>
        <Text style={[styles.status, { color: item.isApproved ? '#4CAF50' : '#FF9800' }]}>
          {item.isApproved ? 'Approved' : 'Pending'}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openModal('provider', item)}
        >
          <Ionicons name="create-outline" size={20} color="#2196F3" />
        </TouchableOpacity>
        {!item.isApproved && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => approveProvider(item._id)}
          >
            <Ionicons name="checkmark-outline" size={20} color="#4CAF50" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => rejectProvider(item._id)}
        >
          <Ionicons name="close-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrganization = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDescription}>{item.category}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
        <Text style={styles.cardDescription}>📞 {item.phoneNumber}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openModal('organization', item)}
        >
          <Ionicons name="create-outline" size={20} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => deleteOrganization(item._id)}
        >
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderModalContent = () => {
    switch (modalType) {
      case 'category':
        return (
          <View>
            <Text style={styles.modalTitle}>Create Category</Text>
            <TextInput
              style={styles.input}
              placeholder="Category Name"
              value={formData.name || ''}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={formData.description || ''}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
            />
          </View>
        );

      case 'provider':
        return (
          <View>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Provider' : 'Create Provider'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Provider Name"
              value={formData.providerName || ''}
              onChangeText={(text) => setFormData({ ...formData, providerName: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={formData.phoneNumber || ''}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
            />
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Category:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    style={[
                      styles.pickerItem,
                      formData.category === category._id && styles.pickerItemSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, category: category._id })}
                  >
                    <Text style={styles.pickerText}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Areas of Operation (comma-separated)"
              value={formData.areasOfOperation || ''}
              onChangeText={(text) => setFormData({ ...formData, areasOfOperation: text })}
              multiline
            />
          </View>
        );

      case 'organization':
        return (
          <ScrollView style={styles.modalScroll}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit Organization' : 'Create Organization'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Organization Name"
              value={formData.name || ''}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Category:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {orgCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.pickerItem,
                      formData.category === category && styles.pickerItemSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, category })}
                  >
                    <Text style={styles.pickerText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={formData.description || ''}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Icon (emoji)"
              value={formData.icon || ''}
              onChangeText={(text) => setFormData({ ...formData, icon: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Color (hex code)"
              value={formData.color || ''}
              onChangeText={(text) => setFormData({ ...formData, color: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Services (comma-separated)"
              value={formData.services || ''}
              onChangeText={(text) => setFormData({ ...formData, services: text })}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="WhatsApp Message"
              value={formData.whatsappMessage || ''}
              onChangeText={(text) => setFormData({ ...formData, whatsappMessage: text })}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={formData.phoneNumber || ''}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Weekly Meeting Day"
              value={formData.weeklyMeetingDay || ''}
              onChangeText={(text) => setFormData({ ...formData, weeklyMeetingDay: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Meeting Time"
              value={formData.meetingTime || ''}
              onChangeText={(text) => setFormData({ ...formData, meetingTime: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Meeting Location"
              value={formData.meetingLocation || ''}
              onChangeText={(text) => setFormData({ ...formData, meetingLocation: text })}
              multiline
            />
          </ScrollView>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'services' && styles.activeTab]}
          onPress={() => setActiveTab('services')}
        >
          <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
            Services
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'organizations' && styles.activeTab]}
          onPress={() => setActiveTab('organizations')}
        >
          <Text style={[styles.tabText, activeTab === 'organizations' && styles.activeTabText]}>
            Organizations
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'services' && (
          <View>
            {selectedCategory ? (
              <View>
                <View style={styles.sectionHeader}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                      setSelectedCategory(null);
                      setProviders([]);
                    }}
                  >
                    <Ionicons name="arrow-back" size={20} color="#2196F3" />
                    <Text style={styles.backButtonText}>Back to Categories</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => openModal('provider')}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Add Provider</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sectionTitle}>Providers in {selectedCategory}</Text>
                <FlatList
                  data={providers}
                  renderItem={renderProvider}
                  keyExtractor={(item) => item._id}
                  scrollEnabled={false}
                />
              </View>
            ) : (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Service Categories</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => openModal('category')}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Add Category</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={categories}
                  renderItem={renderServiceCategory}
                  keyExtractor={(item) => item._id}
                  scrollEnabled={false}
                />
              </View>
            )}
          </View>
        )}

        {activeTab === 'organizations' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Organizations</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => openModal('organization')}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Organization</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={organizations}
              renderItem={renderOrganization}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {editingItem ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
            {renderModalContent()}
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#2196F3',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 400,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  pickerItemSelected: {
    backgroundColor: '#2196F3',
  },
  pickerText: {
    fontSize: 14,
    color: '#666',
  },
});
 
export default LocalServicesManagement;