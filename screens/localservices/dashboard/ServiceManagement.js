// screens/localservices/dashboard/ServiceManagement.js - Updated with flexible duration
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

// ─── Design tokens ───────────────────────────────────────────────
const MODAL_BG       = '#161616';
const MODAL_BORDER   = 'rgba(80,200,120,0.25)';
const INPUT_BG       = 'rgba(255,255,255,0.07)';
const INPUT_BORDER   = 'rgba(255,255,255,0.15)';
const SECTION_BG     = 'rgba(255,255,255,0.05)';
const SECTION_BORDER = 'rgba(255,255,255,0.1)';
const OVERLAY        = 'rgba(0,0,0,0.78)';

const BOTTOM_NAV_HEIGHT = 70;

// ─── Shared modal shell ──────────────────────────────────────────
const ModalShell = ({ visible, onClose, title, children, onSave, saveLabel = 'Save', saving }) => (
  <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: OVERLAY, justifyContent: 'flex-end' }}
    >
      <View style={shellStyles.card}>
        <View style={shellStyles.handle} />
        <View style={shellStyles.header}>
          <Text style={shellStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={shellStyles.closeBtn}>
            <Ionicons name="close" size={22} color="#888888" />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
          <View style={shellStyles.actions}>
            <TouchableOpacity style={shellStyles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={shellStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={shellStyles.saveBtn} onPress={onSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#000" />
                : <Text style={shellStyles.saveText}>{saveLabel}</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const shellStyles = StyleSheet.create({
  card: {
    backgroundColor: MODAL_BG,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0, borderColor: MODAL_BORDER,
    paddingHorizontal: 24, paddingBottom: 40, maxHeight: '92%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginTop: 16, marginBottom: 8,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
    marginBottom: 24,
  },
  title:    { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  actions:  { flexDirection: 'row', gap: 16, marginTop: 24, marginBottom: 8 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#888888' },
  saveBtn:   { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#50c878', alignItems: 'center' },
  saveText:  { fontSize: 16, fontWeight: '700', color: '#000000' },
});

// ─── Field component ─────────────────────────────────────────────
const Field = ({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default', required = false }) => (
  <View style={{ marginBottom: 20 }}>
    <Text style={{ fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {label}{required && ' *'}
    </Text>
    <TextInput
      style={{
        backgroundColor: INPUT_BG, borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: INPUT_BORDER, color: '#fff', fontSize: 15,
        ...(multiline && { minHeight: 90, textAlignVertical: 'top' })
      }}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#555"
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      textAlignVertical={multiline ? 'top' : 'center'}
      keyboardType={keyboardType}
    />
  </View>
);

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
  const [togglingId, setTogglingId] = useState(null);

  // Pricing options
  const pricingOptions = [
    { value: 'fixed', label: 'Fixed Price', icon: 'pricetag-outline' },
    { value: 'range', label: 'Price Range', icon: 'swap-horizontal-outline' },
    { value: 'hourly', label: 'Hourly Rate', icon: 'time-outline' },
    { value: 'varies', label: 'Varies / Negotiable', icon: 'chatbubble-outline' }
  ];

  // Duration options
  const durationOptions = [
    { value: '15', label: '15 mins' },
    { value: '30', label: '30 mins' },
    { value: '45', label: '45 mins' },
    { value: '60', label: '1 hr' },
    { value: '90', label: '1.5 hrs' },
    { value: '120', label: '2 hrs' },
    { value: '180', label: '3 hrs' },
    { value: '240', label: '4 hrs' },
    { value: '480', label: 'Full Day' },
    { value: 'custom', label: 'Custom / Varies' }
  ];

  // Form state with flexible pricing and duration
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricingType: 'fixed',
    price: '',
    minPrice: '',
    maxPrice: '',
    hourlyRate: '',
    pricingNote: '',
    durationType: 'fixed', // 'fixed', 'custom'
    duration: '60',
    customDurationNote: '',
    category: '',
    isActive: true,
    currency: 'KES'
  });

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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      pricingType: 'fixed',
      price: '',
      minPrice: '',
      maxPrice: '',
      hourlyRate: '',
      pricingNote: '',
      durationType: 'fixed',
      duration: '60',
      customDurationNote: '',
      category: '',
      isActive: true,
      currency: 'KES'
    });
    setSelectedService(null);
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
      pricingType: service.pricingType || 'fixed',
      price: service.price?.toString() || '',
      minPrice: service.minPrice?.toString() || '',
      maxPrice: service.maxPrice?.toString() || '',
      hourlyRate: service.hourlyRate?.toString() || '',
      pricingNote: service.customPriceNote || '',
      durationType: service.durationType || 'fixed',
      duration: service.duration?.toString() || '60',
      customDurationNote: service.customDurationNote || '',
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

  const handleToggleActive = async (service) => {
    try {
      setTogglingId(service._id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const newStatus = !service.isActive;

      await axios.patch(
        `/api/services/dashboard/services/${service._id}/toggle`,
        { isActive: newStatus }
      );

      setServices(prev =>
        prev.map(s =>
          s._id === service._id ? { ...s, isActive: newStatus } : s
        )
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Toggle error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update service status');
    } finally {
      setTogglingId(null);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Required', 'Service name is required');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Required', 'Description is required');
      return false;
    }
    if (!formData.category.trim()) {
      Alert.alert('Required', 'Category is required');
      return false;
    }

    // Validate duration
    if (formData.durationType === 'fixed') {
      if (!formData.duration || parseInt(formData.duration) <= 0) {
        Alert.alert('Required', 'Valid duration is required');
        return false;
      }
    } else if (formData.durationType === 'custom') {
      if (!formData.customDurationNote.trim()) {
        Alert.alert('Required', 'Please add a note about duration (e.g., "Varies by project", "Full day")');
        return false;
      }
    }

    // Validate based on pricing type
    switch(formData.pricingType) {
      case 'fixed':
        if (!formData.price || parseFloat(formData.price) <= 0) {
          Alert.alert('Required', 'Valid price is required for fixed pricing');
          return false;
        }
        break;
      case 'range':
        if (!formData.minPrice || !formData.maxPrice || 
            parseFloat(formData.minPrice) <= 0 || 
            parseFloat(formData.maxPrice) <= 0 ||
            parseFloat(formData.minPrice) >= parseFloat(formData.maxPrice)) {
          Alert.alert('Required', 'Valid price range (min < max) is required');
          return false;
        }
        break;
      case 'hourly':
        if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
          Alert.alert('Required', 'Valid hourly rate is required');
          return false;
        }
        break;
      case 'varies':
        if (!formData.pricingNote.trim()) {
          Alert.alert('Required', 'Please add a note about pricing (e.g., "Price varies", "Call for quote")');
          return false;
        }
        break;
    }
    
    return true;
  };

const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Build service data with ALL new fields
    const serviceData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      isActive: formData.isActive,
      currency: formData.currency,
      // Pricing fields
      pricingType: formData.pricingType,
      isPriceNegotiable: formData.pricingType === 'varies' || formData.isPriceNegotiable,
      // Duration fields
      durationType: formData.durationType
    };

    // Handle pricing based on type
    switch(formData.pricingType) {
      case 'fixed':
        serviceData.price = parseFloat(formData.price);
        break;
      case 'range':
        serviceData.minPrice = parseFloat(formData.minPrice);
        serviceData.maxPrice = parseFloat(formData.maxPrice);
        serviceData.price = parseFloat(formData.minPrice); // fallback
        break;
      case 'hourly':
        serviceData.hourlyRate = parseFloat(formData.hourlyRate);
        serviceData.price = parseFloat(formData.hourlyRate); // fallback
        break;
      case 'varies':
        serviceData.customPriceNote = formData.pricingNote;
        serviceData.price = 0;
        break;
    }

    // Handle duration
    if (formData.durationType === 'fixed') {
      serviceData.duration = parseInt(formData.duration);
    } else {
      serviceData.customDurationNote = formData.customDurationNote;
      serviceData.duration = 0; // fallback
    }

    let response;
    if (showEditModal && selectedService) {
      response = await axios.put(
        `/api/services/dashboard/services/${selectedService._id}`,
        serviceData
      );
    } else {
      response = await axios.post('/api/services/dashboard/services', serviceData);
    }

    if (response.data.message || response.data.service) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', showEditModal ? 'Service updated' : 'Service created', [
        { text: 'OK', onPress: () => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
          fetchServices();
        }}
      ]);
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

  const formatCurrency = (amount) => `KES ${amount?.toLocaleString() || '0'}`;

  const formatDurationDisplay = (service) => {
    if (service.customDurationNote) return service.customDurationNote;
    if (service.duration) {
      const minutes = service.duration;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours === 0) return `${mins} mins`;
      if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
      return `${hours}h ${mins}m`;
    }
    return 'Duration varies';
  };

  // Format price display for service card
  const getPriceDisplay = (service) => {
    // Check if price info is in description (for backward compatibility)
    if (service.description && service.description.includes('💰')) {
      const priceMatch = service.description.match(/💰[^\n]+/);
      if (priceMatch) return priceMatch[0].replace('💰 ', '');
    }
    
    switch(service.pricingType) {
      case 'fixed':
        return formatCurrency(service.price);
      case 'range':
        return `${formatCurrency(service.minPrice)} - ${formatCurrency(service.maxPrice)}`;
      case 'hourly':
        return `${formatCurrency(service.hourlyRate)}/hour`;
      case 'varies':
        return service.customPriceNote || 'Price varies';
      default:
        return service.price ? formatCurrency(service.price) : 'Price on request';
    }
  };

  // ─── Service card ──────────────────────────────────────────────
  const renderServiceItem = ({ item }) => {
    const isToggling = togglingId === item._id;
    const isVariesPrice = item.pricingType === 'varies' || (!item.price && item.customPriceNote);

    return (
      <View style={styles.serviceCard}>
        <View style={styles.serviceHeader}>
          <View style={styles.serviceTitleRow}>
            <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.activeIndicator}>
              {isToggling ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Switch
                  value={item.isActive}
                  onValueChange={() => handleToggleActive(item)}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.primary }}
                  thumbColor={Colors.background}
                />
              )}
            </View>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>

        <Text style={styles.serviceDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.serviceDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color={Colors.textSecondary} />
            <Text style={[styles.detailText, isVariesPrice && styles.variesPriceText]}>
              {getPriceDisplay(item)}
            </Text>
            {item.isPriceNegotiable && (
              <View style={styles.negotiableBadge}>
                <Text style={styles.negotiableText}>Negotiable</Text>
              </View>
            )}
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{formatDurationDisplay(item)}</Text>
          </View>
        </View>

        <View style={styles.serviceActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => handleEditService(item)}>
            <Ionicons name="create-outline" size={16} color={Colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteService(item)}>
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Pricing section based on selected type ────────────────────
  const renderPricingFields = () => {
    switch(formData.pricingType) {
      case 'fixed':
        return (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.fieldLabel}>Price (KES) *</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.price}
              onChangeText={(t) => setFormData(p => ({ ...p, price: t.replace(/[^0-9.]/g, '') }))}
              placeholder="e.g., 2500"
              placeholderTextColor="#555"
              keyboardType="numeric"
            />
          </View>
        );
      
      case 'range':
        return (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.fieldLabel}>Price Range (KES) *</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.minPrice}
                  onChangeText={(t) => setFormData(p => ({ ...p, minPrice: t.replace(/[^0-9.]/g, '') }))}
                  placeholder="Min"
                  placeholderTextColor="#555"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.fieldInput}
                  value={formData.maxPrice}
                  onChangeText={(t) => setFormData(p => ({ ...p, maxPrice: t.replace(/[^0-9.]/g, '') }))}
                  placeholder="Max"
                  placeholderTextColor="#555"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        );
      
      case 'hourly':
        return (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.fieldLabel}>Hourly Rate (KES) *</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.hourlyRate}
              onChangeText={(t) => setFormData(p => ({ ...p, hourlyRate: t.replace(/[^0-9.]/g, '') }))}
              placeholder="e.g., 1500"
              placeholderTextColor="#555"
              keyboardType="numeric"
            />
          </View>
        );
      
      case 'varies':
        return (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.fieldLabel}>Pricing Note *</Text>
            <TextInput
              style={[styles.fieldInput, styles.textArea]}
              value={formData.pricingNote}
              onChangeText={(t) => setFormData(p => ({ ...p, pricingNote: t }))}
              placeholder="e.g., Price depends on scope, Contact for quote, Negotiable"
              placeholderTextColor="#555"
              multiline
              numberOfLines={3}
            />
          </View>
        );
      
      default:
        return null;
    }
  };

  // ─── Duration section ──────────────────────────────────────────
  const renderDurationFields = () => {
    if (formData.pricingType === 'hourly') return null;
    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={styles.fieldLabel}>Duration *</Text>
        
        {/* Duration Type Selection */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <TouchableOpacity
            style={[
              styles.durationTypeChip,
              formData.durationType === 'fixed' && styles.durationTypeChipSelected
            ]}
            onPress={() => setFormData(p => ({ ...p, durationType: 'fixed' }))}
          >
            <Text style={[
              styles.durationTypeChipText,
              formData.durationType === 'fixed' && styles.durationTypeChipTextSelected
            ]}>
              Fixed Duration
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.durationTypeChip,
              formData.durationType === 'custom' && styles.durationTypeChipSelected
            ]}
            onPress={() => setFormData(p => ({ ...p, durationType: 'custom' }))}
          >
            <Text style={[
              styles.durationTypeChipText,
              formData.durationType === 'custom' && styles.durationTypeChipTextSelected
            ]}>
              Custom / Varies
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fixed Duration Options */}
        {formData.durationType === 'fixed' && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {durationOptions.filter(opt => opt.value !== 'custom').map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.durationChip,
                  formData.duration === option.value && styles.durationChipSelected
                ]}
                onPress={() => setFormData(p => ({ ...p, duration: option.value }))}
              >
                <Text style={[
                  styles.durationChipText,
                  formData.duration === option.value && styles.durationChipTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Custom Duration Note */}
        {formData.durationType === 'custom' && (
          <TextInput
            style={[styles.fieldInput, styles.textArea]}
            value={formData.customDurationNote}
            onChangeText={(t) => setFormData(p => ({ ...p, customDurationNote: t }))}
            placeholder="e.g., Varies by project, Full day, Depends on scope, Call for availability"
            placeholderTextColor="#555"
            multiline
            numberOfLines={3}
          />
        )}
      </View>
    );
  };

  // ─── Add/Edit modal ────────────────────────────────────────────
  const renderAddEditModal = () => {
    const isEdit = showEditModal;
    
    return (
      <ModalShell
        visible={showAddModal || showEditModal}
        onClose={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
        title={isEdit ? 'Edit Service' : 'Add Service'}
        onSave={handleSubmit}
        saveLabel={isEdit ? 'Update' : 'Add Service'}
        saving={submitting}
      >
        <Field 
          label="Service Name" 
          value={formData.name} 
          onChangeText={(t) => setFormData(p => ({ ...p, name: t }))} 
          placeholder="e.g., House Cleaning"
          required
        />
        
        <Field 
          label="Description" 
          value={formData.description} 
          onChangeText={(t) => setFormData(p => ({ ...p, description: t }))} 
          placeholder="Describe your service..."
          multiline
          required
        />

        {/* Pricing Type Selection */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.fieldLabel}>Pricing Type *</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ gap: 12 }}
          >
            {pricingOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pricingChip,
                  formData.pricingType === option.value && styles.pricingChipSelected
                ]}
                onPress={() => {
                  setFormData(p => ({ ...p, pricingType: option.value }));
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons 
                  name={option.icon} 
                  size={18} 
                  color={formData.pricingType === option.value ? Colors.primary : '#888'} 
                />
                <Text style={[
                  styles.pricingChipText,
                  formData.pricingType === option.value && styles.pricingChipTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Dynamic Pricing Fields */}
        {renderPricingFields()}

        {/* Duration Section */}
        {renderDurationFields()}

        {/* Category */}
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.fieldLabel}>Category *</Text>
          <TextInput
            style={styles.fieldInput}
            value={formData.category}
            onChangeText={(t) => setFormData(p => ({ ...p, category: t }))}
            placeholder="e.g., Cleaning"
            placeholderTextColor="#555"
          />
        </View>

        {/* Active toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Active Service</Text>
          <Switch
            value={formData.isActive}
            onValueChange={(v) => setFormData(p => ({ ...p, isActive: v }))}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.primary }}
            thumbColor={Colors.background}
          />
        </View>
      </ModalShell>
    );
  };

  // ─── Delete confirm modal ──────────────────────────────────────
  const renderDeleteModal = () => (
    <Modal animationType="fade" transparent visible={showDeleteModal} onRequestClose={() => setShowDeleteModal(false)}>
      <View style={{ flex: 1, backgroundColor: OVERLAY, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={styles.deleteCard}>
          <View style={styles.deleteIconCircle}>
            <Ionicons name="warning" size={40} color={Colors.danger} />
          </View>
          <Text style={styles.deleteTitle}>Delete Service</Text>
          <Text style={styles.deleteMessage}>
            Are you sure you want to delete "{selectedService?.name}"? This cannot be undone.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
            <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => setShowDeleteModal(false)} disabled={deleting}>
              <Text style={styles.deleteCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteConfirmBtn} onPress={confirmDelete} disabled={deleting}>
              {deleting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.deleteConfirmText}>Delete</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ─── Empty state ───────────────────────────────────────────────
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="construct-outline" size={52} color={Colors.textSecondary} />
      <Text style={styles.emptyTitle}>No services yet</Text>
      <Text style={styles.emptySubtitle}>Add your first service to start receiving bookings</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={handleAddService}>
        <Ionicons name="add" size={20} color="#000" />
        <Text style={styles.emptyBtnText}>Add First Service</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── List header with stats ────────────────────────────────────
  const ListHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.pageTitle}>Services</Text>
      <Text style={styles.pageSubtitle}>Manage your service offerings</Text>
      <View style={styles.statsRow}>
        {[
          { value: services.length, label: 'Total' },
          { value: services.filter(s => s.isActive).length, label: 'Active' },
          { value: services.filter(s => !s.isActive).length, label: 'Inactive' },
        ].map(({ value, label }) => (
          <View key={label} style={styles.statCard}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = services.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={!isEmpty ? <ListHeader /> : null}
        ListFooterComponent={<View style={{ height: BOTTOM_NAV_HEIGHT + 40 }} />}
        contentContainerStyle={[styles.listContent, isEmpty && styles.emptyContent]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddService} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      {renderAddEditModal()}
      {renderDeleteModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  loadingBox:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.md },
  listContent: { paddingBottom: Spacing.lg },
  emptyContent: { flex: 1, justifyContent: 'center' },

  // ── List header ──
  listHeader:   { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  pageTitle:    { fontSize: 26, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.md },
  statsRow:     { flexDirection: 'row', gap: Spacing.sm },
  statCard:     { flex: 1, backgroundColor: SECTION_BG, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: SECTION_BORDER },
  statValue:    { fontSize: 22, fontWeight: '700', color: Colors.primary },
  statLabel:    { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  // ── FAB ──
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },

  // ── Service card ──
  serviceCard: {
    backgroundColor: SECTION_BG, marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: SECTION_BORDER, overflow: 'hidden',
  },
  serviceHeader: { padding: Spacing.md, paddingBottom: 0 },
  serviceTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  serviceName: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1, marginRight: Spacing.sm },
  activeIndicator: { minWidth: 40, alignItems: 'center' },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.round, backgroundColor: Colors.primary + '20', marginTop: 4 },
  categoryText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  serviceDescription: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  serviceDetails: { flexDirection: 'row', gap: Spacing.lg, marginHorizontal: Spacing.md, marginBottom: Spacing.md, flexWrap: 'wrap' },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  detailText: { fontSize: 13, color: Colors.textSecondary },
  variesPriceText: { color: Colors.warning, fontStyle: 'italic' },
  negotiableBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  negotiableText: {
    fontSize: 10,
    color: Colors.warning,
    fontWeight: '600',
  },
  serviceActions: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, paddingTop: 0 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary + '60', backgroundColor: Colors.primary + '10' },
  editBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.danger + '60', backgroundColor: Colors.danger + '10' },
  deleteBtnText: { fontSize: 13, color: Colors.danger, fontWeight: '600' },

  // ── Empty state ──
  emptyState:    { alignItems: 'center', paddingVertical: 60, paddingHorizontal: Spacing.lg },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: Colors.textSecondary, marginTop: Spacing.md },
  emptySubtitle: { fontSize: 14, color: Colors.textTertiary, textAlign: 'center', marginTop: 6, marginBottom: Spacing.lg },
  emptyBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg },
  emptyBtnText:  { fontSize: 15, color: '#000', fontWeight: '700' },

  // ── Modal form fields ──
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: { backgroundColor: INPUT_BG, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: INPUT_BORDER, color: '#fff', fontSize: 15, marginBottom: 0 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  
  // Pricing chips
  pricingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
  },
  pricingChipSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  pricingChipText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  pricingChipTextSelected: {
    color: Colors.primary,
  },
  
  // Duration type chips
  durationTypeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: INPUT_BG,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
  },
  durationTypeChipSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  durationTypeChipText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  durationTypeChipTextSelected: {
    color: Colors.primary,
  },
  
  // Duration chips
  durationChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: INPUT_BG, borderWidth: 1, borderColor: INPUT_BORDER },
  durationChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  durationChipText: { fontSize: 13, color: '#888' },
  durationChipTextSelected: { color: '#000', fontWeight: '600' },
  
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', marginBottom: 4 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },

  // ── Delete modal ──
  deleteCard:       { backgroundColor: MODAL_BG, borderRadius: 20, padding: 28, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: Colors.danger + '30' },
  deleteIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.danger + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  deleteTitle:      { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  deleteMessage:    { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  deleteCancelBtn:  { flex: 1, padding: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  deleteCancelText: { fontSize: 15, fontWeight: '600', color: '#888' },
  deleteConfirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.danger, alignItems: 'center' },
  deleteConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default ServiceManagement;