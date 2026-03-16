import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  StyleSheet, 
  StatusBar,
  ActivityIndicator,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// Dark Warm Amber Theme
const MarketplaceColors = {
  primary: '#03604d',      
  primaryDark: '#0e582a',   // Dark Amber
  primaryLight: '#FBBF24',  // Light Amber
  secondary: '#10B981',     // Teal (for success/balance)
  accent: '#8B5CF6',        // Purple (for highlights)
  background: '#0F0F0F',    // Near Black
  surface: '#1A1A1A',       // Dark Surface
  card: '#242424',          // Card Background
  text: '#FFFFFF',          // White
  textSecondary: '#9CA3AF', // Gray
  textMuted: '#6B7280',     // Dark Gray
  border: '#2D2D2D',        // Border
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

const categoryOptions = [
  'Electronics',
  'Furniture',
  'Clothing & Accessories',
  'Books & Education',
  'Sports & Recreation',
  'Home & Garden',
  'Vehicles',
  'Health & Beauty',
  'Baby & Kids',
  'Food & Beverages',
  'Services',
  'Other',
].map(c => ({ label: c, value: c }));

const conditionOptions = [
  'New', 
  'Like New', 
  'Good', 
  'Fair', 
  'Poor', 
  'Any'
].map(c => ({ label: c, value: c }));

const urgencyOptions = [
  { label: 'Not Urgent', value: 'Not Urgent', color: MarketplaceColors.success, icon: 'time-outline' },
  { label: 'Needed Soon', value: 'Needed Soon', color: MarketplaceColors.warning, icon: 'alert-circle-outline' },
  { label: 'Urgent', value: 'Urgent', color: MarketplaceColors.error, icon: 'warning-outline' },
  { label: 'Very Urgent', value: 'Very Urgent', color: '#D32F2F', icon: 'flash-outline' }
];

const CreateWantedPostScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    maxBudget: '',
    preferredCondition: 'Any',
    location: '',
    urgency: 'Not Urgent',
    buyerWhatsApp: '',
    tags: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 15) {
      newErrors.description = 'Description must be at least 15 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (formData.maxBudget && (isNaN(formData.maxBudget) || parseFloat(formData.maxBudget) <= 0)) {
      newErrors.maxBudget = 'Please enter a valid budget amount';
    }

    if (formData.buyerWhatsApp && !/^\+?[\d\s-()]+$/.test(formData.buyerWhatsApp)) {
      newErrors.buyerWhatsApp = 'Please enter a valid WhatsApp number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getUrgencyColor = (urgency) => {
    const option = urgencyOptions.find(opt => opt.value === urgency);
    return option?.color || MarketplaceColors.success;
  };

  const getUrgencyIcon = (urgency) => {
    const option = urgencyOptions.find(opt => opt.value === urgency);
    return option?.icon || 'time-outline';
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below before submitting.');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        preferredCondition: formData.preferredCondition,
        urgency: formData.urgency,
      };

      if (formData.maxBudget) {
        submitData.maxBudget = Number(formData.maxBudget);
      }
      
      if (formData.location.trim()) {
        submitData.location = formData.location.trim();
      }
      
      if (formData.buyerWhatsApp.trim()) {
        submitData.buyerWhatsApp = formData.buyerWhatsApp.trim();
      }

      if (formData.tags.trim()) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag);
        submitData.tags = tagsArray;
      }

      await axios.post('api/wanted/create', submitData);

      Alert.alert(
        'Success!', 
        'Your wanted post has been created successfully.',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (err) {
      console.error('Create error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to create wanted post. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const showTipsAlert = () => {
    Alert.alert(
      'Tips for Better Results',
      '• Be specific in your title and description\n• Set a realistic budget range\n• Include your preferred condition\n• Use relevant tags to help sellers find your post\n• Add your location for local deals\n• Choose appropriate urgency level',
      [{ text: 'Got it!' }]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[MarketplaceColors.background, MarketplaceColors.surface]}
        style={StyleSheet.absoluteFill}
      />
      
      <StatusBar barStyle="light-content" backgroundColor={MarketplaceColors.primaryDark} />

      {/* Header */}
      <LinearGradient
        colors={[MarketplaceColors.primary, MarketplaceColors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Wanted Post</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={showTipsAlert}
        >
          <Ionicons name="help-circle-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <LinearGradient
          colors={[MarketplaceColors.card, MarketplaceColors.surface]}
          style={styles.infoCard}
        >
          <View style={styles.infoIconContainer}>
            <Ionicons name="search" size={24} color={MarketplaceColors.primary} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Looking for Something?</Text>
            <Text style={styles.infoText}>
              Create a wanted post and let sellers come to you! Posts expire after 30 days.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.form}>
          {/* Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              <Ionicons name="pricetag-outline" size={14} color={MarketplaceColors.primary} /> What are you looking for? *
            </Text>
            <View style={[styles.inputWrapper, errors.title && styles.inputError]}>
              <TextInput
                placeholder="e.g., iPhone 13 Pro Max, Study Table, Textbooks"
                placeholderTextColor={MarketplaceColors.textMuted}
                value={formData.title}
                onChangeText={(text) => handleInputChange('title', text)}
                style={styles.input}
                maxLength={100}
              />
            </View>
            <View style={styles.inputFooter}>
              <Text style={styles.charCount}>{formData.title.length}/100</Text>
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              <Ionicons name="document-text-outline" size={14} color={MarketplaceColors.primary} /> Detailed Description *
            </Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper, errors.description && styles.inputError]}>
              <TextInput
                placeholder="Describe exactly what you need, including specifications, size, color, etc."
                placeholderTextColor={MarketplaceColors.textMuted}
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.inputFooter}>
              <Text style={styles.charCount}>{formData.description.length}/500</Text>
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>
          </View>

          {/* Category */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              <Ionicons name="apps-outline" size={14} color={MarketplaceColors.primary} /> Category *
            </Text>
            <View style={[styles.pickerWrapper, errors.category && styles.inputError]}>
              <RNPickerSelect
                onValueChange={(value) => handleInputChange('category', value)}
                items={categoryOptions}
                placeholder={{ label: 'Select Category', value: null }}
                value={formData.category}
                style={pickerSelectStyles}
                Icon={() => <Ionicons name="chevron-down" size={20} color={MarketplaceColors.primary} />}
              />
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          {/* Budget & Condition Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>
                <Ionicons name="cash-outline" size={14} color={MarketplaceColors.primary} /> Max Budget (KES)
              </Text>
              <View style={[styles.inputWrapper, errors.maxBudget && styles.inputError]}>
                <TextInput
                  placeholder="Optional"
                  placeholderTextColor={MarketplaceColors.textMuted}
                  value={formData.maxBudget}
                  onChangeText={(text) => handleInputChange('maxBudget', text)}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              {errors.maxBudget && <Text style={styles.errorText}>{errors.maxBudget}</Text>}
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>
                <Ionicons name="ribbon-outline" size={14} color={MarketplaceColors.primary} /> Condition
              </Text>
              <View style={styles.pickerWrapper}>
                <RNPickerSelect
                  onValueChange={(value) => handleInputChange('preferredCondition', value)}
                  items={conditionOptions}
                  value={formData.preferredCondition}
                  style={pickerSelectStyles}
                  Icon={() => <Ionicons name="chevron-down" size={20} color={MarketplaceColors.primary} />}
                />
              </View>
            </View>
          </View>

          {/* Location & WhatsApp Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>
                <Ionicons name="location-outline" size={14} color={MarketplaceColors.primary} /> Location
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="e.g., Mabs"
                  placeholderTextColor={MarketplaceColors.textMuted}
                  value={formData.location}
                  onChangeText={(text) => handleInputChange('location', text)}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>
                <Ionicons name="logo-whatsapp" size={14} color={MarketplaceColors.primary} /> WhatsApp
              </Text>
              <View style={[styles.inputWrapper, errors.buyerWhatsApp && styles.inputError]}>
                <TextInput
                  placeholder="+254..."
                  placeholderTextColor={MarketplaceColors.textMuted}
                  value={formData.buyerWhatsApp}
                  onChangeText={(text) => handleInputChange('buyerWhatsApp', text)}
                  style={styles.input}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.buyerWhatsApp && <Text style={styles.errorText}>{errors.buyerWhatsApp}</Text>}
            </View>
          </View>

          {/* Tags */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              <Ionicons name="pricetags-outline" size={14} color={MarketplaceColors.primary} /> Tags
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Keywords separated by commas (e.g., smartphone, android)"
                placeholderTextColor={MarketplaceColors.textMuted}
                value={formData.tags}
                onChangeText={(text) => handleInputChange('tags', text)}
                style={styles.input}
              />
            </View>
            <Text style={styles.helperText}>Helps sellers find your post easier</Text>
          </View>

          {/* Urgency */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              <Ionicons name="alert-circle-outline" size={14} color={MarketplaceColors.primary} /> How urgently do you need this?
            </Text>
            <View style={styles.urgencyContainer}>
              {urgencyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.urgencyOption,
                    formData.urgency === option.value && styles.urgencyOptionSelected,
                    { borderColor: option.color }
                  ]}
                  onPress={() => handleInputChange('urgency', option.value)}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={18} 
                    color={formData.urgency === option.value ? '#FFFFFF' : option.color} 
                  />
                  <Text style={[
                    styles.urgencyText,
                    formData.urgency === option.value && styles.urgencyTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration Info */}
          <LinearGradient
            colors={[MarketplaceColors.card, MarketplaceColors.surface]}
            style={styles.durationCard}
          >
            <Ionicons name="time-outline" size={20} color={MarketplaceColors.primary} />
            <Text style={styles.durationText}>
              Your post will be active for 30 days and automatically expire
            </Text>
          </LinearGradient>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={[MarketplaceColors.primary, MarketplaceColors.primaryDark]}
              style={styles.submitButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Create Wanted Post</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: MarketplaceColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: MarketplaceColors.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: MarketplaceColors.textSecondary,
    lineHeight: 18,
  },
  form: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: MarketplaceColors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
    borderRadius: 12,
    backgroundColor: MarketplaceColors.surface,
  },
  textAreaWrapper: {
    minHeight: 100,
  },
  input: {
    padding: 14,
    fontSize: 14,
    color: MarketplaceColors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: MarketplaceColors.error,
    backgroundColor: MarketplaceColors.error + '10',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  errorText: {
    color: MarketplaceColors.error,
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  charCount: {
    fontSize: 11,
    color: MarketplaceColors.textMuted,
  },
  helperText: {
    fontSize: 11,
    color: MarketplaceColors.textMuted,
    marginTop: 4,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
    borderRadius: 12,
    backgroundColor: MarketplaceColors.surface,
  },
  urgencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: MarketplaceColors.surface,
    borderWidth: 1,
    minWidth: '47%',
    justifyContent: 'center',
    gap: 6,
  },
  urgencyOptionSelected: {
    backgroundColor: MarketplaceColors.primary,
    borderColor: MarketplaceColors.primary,
  },
  urgencyText: {
    fontSize: 12,
    color: MarketplaceColors.textSecondary,
    fontWeight: '500',
  },
  urgencyTextSelected: {
    color: '#FFFFFF',
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: MarketplaceColors.border,
    gap: 10,
  },
  durationText: {
    fontSize: 13,
    color: MarketplaceColors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  submitButton: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 10,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  cancelButtonText: {
    color: MarketplaceColors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: MarketplaceColors.text,
    paddingRight: 40,
  },
  inputAndroid: {
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: MarketplaceColors.text,
    paddingRight: 40,
  },
  iconContainer: {
    top: 16,
    right: 15,
  },
  placeholder: {
    color: MarketplaceColors.textMuted,
  },
});

export default CreateWantedPostScreen;