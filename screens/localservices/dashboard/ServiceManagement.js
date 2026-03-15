// screens/localservices/dashboard/ServiceManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import Theme from '../../theme/Theme';

const { Colors, Typography, Spacing, BorderRadius, Shadows } = Theme;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ServiceManagement = () => {
  const navigation = useNavigation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '60',
    category: '',
    isActive: true,
    currency: 'KES'
  });

  // Categories
  const categories = [
    'Massage',
    'Skincare',
    'Haircare',
    'Spa',
    'Wellness',
    'Therapy',
    'Beauty',
    'Fitness',
    'Other'
  ];

  // Duration options (in minutes)
  const durationOptions = [
    { value: '30', label: '30 mins' },
    { value: '45', label: '45 mins' },
    { value: '60', label: '1 hour' },
    { value: '75', label: '1 hour 15 mins' },
    { value: '90', label: '1 hour 30 mins' },
    { value: '120', label: '2 hours' },
  ];

  // Bottom navigation height (adjust based on your actual bottom nav height)
  const BOTTOM_NAV_HEIGHT = 70;

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/services/dashboard/services');
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Fetch services error:', error);
      Alert.alert('Error', 'Failed to load services. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchServices();
  };

  const handleAddService = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetForm();
    setShowAddModal(true);
  };

  const handleEditService = (service) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      price: service.price?.toString() || '',
      duration: service.duration?.toString() || '60',
      category: service.category || '',
      isActive: service.isActive ?? true,
      currency: service.currency || 'KES'
    });
    setShowEditModal(true);
  };

  const handleDeleteService = (service) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '60',
      category: '',
      isActive: true,
      currency: 'KES'
    });
    setSelectedService(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Service name is required');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Description is required');
      return false;
    }
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      Alert.alert('Validation Error', 'Valid price is required');
      return false;
    }
    if (!formData.category.trim()) {
      Alert.alert('Validation Error', 'Category is required');
      return false;
    }
    if (!formData.duration || isNaN(parseInt(formData.duration)) || parseInt(formData.duration) <= 0) {
      Alert.alert('Validation Error', 'Valid duration is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const serviceData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        category: formData.category.trim(),
        isActive: formData.isActive,
        currency: formData.currency
      };

      let response;
      if (showEditModal && selectedService) {
        // Update existing service
        response = await axios.put(
          `/api/services/dashboard/services/${selectedService._id}`,
          serviceData
        );
        
        if (response.data.message) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', 'Service updated successfully');
          
          // Update local state
          setServices(prev => prev.map(service => 
            service._id === selectedService._id 
              ? { ...service, ...serviceData }
              : service
          ));
          
          setShowEditModal(false);
          resetForm();
        }
      } else {
        // Create new service
        response = await axios.post(
          '/api/services/dashboard/services',
          serviceData
        );
        
        if (response.data.service) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', 'Service created successfully');
          
          // Add to local state
          setServices(prev => [response.data.service, ...prev]);
          
          setShowAddModal(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save service');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedService) return;

    try {
      setDeleting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const response = await axios.delete(
        `/api/services/dashboard/services/${selectedService._id}`
      );
      
      if (response.data.message) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Service deleted successfully');
        
        // Remove from local state
        setServices(prev => prev.filter(service => service._id !== selectedService._id));
        
        setShowDeleteModal(false);
        setSelectedService(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete service');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount) => {
    return `KES ${amount?.toLocaleString() || '0'}`;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} mins`;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}m`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Massage': Colors.primary,
      'Skincare': Colors.success,
      'Haircare': Colors.secondary,
      'Spa': Colors.info,
      'Wellness': Colors.warning,
      'Therapy': Colors.danger,
      'Beauty': Colors.purple || '#8B5CF6',
      'Fitness': Colors.orange || '#F97316',
      'Other': Colors.textSecondary
    };
    return colors[category] || Colors.textSecondary;
  };

  const renderServiceItem = ({ item }) => {
    const categoryColor = getCategoryColor(item.category);
    
    return (
      <View style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceTitleRow}>
            <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.activeIndicator}>
              <Switch
                value={item.isActive}
                onValueChange={() => handleEditService(item)}
                trackColor={{ false: Colors.cardBorder, true: Colors.primary }}
                thumbColor={Colors.background}
                ios_backgroundColor={Colors.cardBorder}
              />
            </View>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {item.category}
            </Text>
          </View>
        </View>
        
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.serviceDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="cash" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{formatCurrency(item.price)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{formatDuration(item.duration)}</Text>
          </View>
        </View>
        
        <View style={styles.serviceActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEditService(item)}
          >
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteService(item)}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAddEditModal = () => {
    const isEdit = showEditModal;
    const title = isEdit ? 'Edit Service' : 'Add New Service';
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal || showEditModal}
        onRequestClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView 
            style={styles.modalContainer}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalTitle}>{title}</Text>
            
            {/* Service Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service Name *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Deep Tissue Massage"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            
            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Describe your service..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            
            {/* Price and Duration Row */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.inputLabel}>Price (KES) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.price}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, price: text.replace(/[^0-9]/g, '') }))}
                  placeholder="2500"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.inputLabel}>Duration *</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.durationOptions}
                >
                  {durationOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.durationButton,
                        formData.duration === option.value && styles.durationButtonSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, duration: option.value }))}
                    >
                      <Text style={[
                        styles.durationButtonText,
                        formData.duration === option.value && styles.durationButtonTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category *</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryOptions}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      formData.category === category && styles.categoryButtonSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, category }))}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      formData.category === category && styles.categoryButtonTextSelected
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Active Status */}
            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>Active Service</Text>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                trackColor={{ false: Colors.cardBorder, true: Colors.primary }}
                thumbColor={Colors.background}
                ios_backgroundColor={Colors.cardBorder}
              />
            </View>
            
            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={Colors.text} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEdit ? 'Update Service' : 'Add Service'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderDeleteModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showDeleteModal}
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModal}>
          <View style={styles.deleteIcon}>
            <Ionicons name="warning" size={48} color={Colors.danger} />
          </View>
          
          <Text style={styles.confirmTitle}>Delete Service</Text>
          <Text style={styles.confirmMessage}>
            Are you sure you want to delete "{selectedService?.name}"? This action cannot be undone.
          </Text>
          
          <View style={styles.confirmActions}>
            <TouchableOpacity 
              style={[styles.confirmButton, styles.cancelConfirmButton]}
              onPress={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              <Text style={styles.cancelConfirmText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmButton, styles.deleteConfirmButton]}
              onPress={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <Text style={styles.deleteConfirmText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="construct-outline" size={48} color={Colors.textSecondary} />
      <Text style={styles.emptyStateText}>No services found</Text>
      <Text style={styles.emptyStateSubtext}>
        Add your first service to start receiving bookings
      </Text>
      <TouchableOpacity 
        style={styles.addFirstServiceButton}
        onPress={handleAddService}
      >
        <Ionicons name="add" size={20} color={Colors.text} />
        <Text style={styles.addFirstServiceText}>Add Your First Service</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      );
    }

    const isEmpty = services.length === 0;

    return (
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          isEmpty && styles.emptyListContent
        ]}
        ListHeaderComponent={() => !isEmpty && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{services.length}</Text>
              <Text style={styles.statLabel}>Total Services</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {services.filter(s => s.isActive).length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {services.filter(s => !s.isActive).length}
              </Text>
              <Text style={styles.statLabel}>Inactive</Text>
            </View>
          </View>
        )}
        // Add bottom padding for the bottom navigation
        ListFooterComponent={<View style={{ height: BOTTOM_NAV_HEIGHT + Spacing.lg }} />}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      


      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Add/Edit Modal */}
      {renderAddEditModal()}

      {/* Delete Confirmation Modal */}
      {renderDeleteModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  addButton: {
    padding: Spacing.xs,
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.lg, // Add some bottom padding
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: Colors.textSecondary,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statNumber: {
    ...Typography.h3,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 24,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Service Card
  serviceCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.small,
  },
  serviceHeader: {
    marginBottom: Spacing.sm,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  serviceName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
    marginRight: Spacing.sm,
  },
  activeIndicator: {
    transform: Platform.OS === 'ios' ? [{ scale: 0.8 }] : [{ scale: 1 }],
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    flex: 1,
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    flex: 1,
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    color: Colors.danger,
    fontWeight: '600',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  addFirstServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  addFirstServiceText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalScrollContent: {
    padding: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    color: Colors.text,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  halfInput: {
    flex: 1,
  },
  durationOptions: {
    gap: Spacing.sm,
  },
  durationButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginRight: Spacing.sm,
  },
  durationButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  durationButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  durationButtonTextSelected: {
    color: Colors.text,
  },
  categoryOptions: {
    gap: Spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginRight: Spacing.sm,
  },
  categoryButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  categoryButtonTextSelected: {
    color: Colors.text,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    marginBottom: Spacing.lg,
  },
  switchLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.card,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  // Delete Modal
  confirmModal: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  deleteIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.danger + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  confirmTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  confirmMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelConfirmButton: {
    backgroundColor: Colors.card,
  },
  cancelConfirmText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  deleteConfirmButton: {
    backgroundColor: Colors.danger,
  },
  deleteConfirmText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
});

export default ServiceManagement;
