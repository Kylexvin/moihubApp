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
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

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
  { label: 'Not Urgent', value: 'Not Urgent', color: '#4CAF50', icon: 'time-outline' },
  { label: 'Needed Soon', value: 'Needed Soon', color: '#FF9800', icon: 'alert-circle-outline' },
  { label: 'Urgent', value: 'Urgent', color: '#F44336', icon: 'warning-outline' },
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
  const [showTips, setShowTips] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
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

    // Budget validation (optional but if provided, should be valid)
    if (formData.maxBudget && (isNaN(formData.maxBudget) || parseFloat(formData.maxBudget) <= 0)) {
      newErrors.maxBudget = 'Please enter a valid budget amount';
    }

    // WhatsApp validation (optional but if provided, should be valid)
    if (formData.buyerWhatsApp && !/^\+?[\d\s-()]+$/.test(formData.buyerWhatsApp)) {
      newErrors.buyerWhatsApp = 'Please enter a valid WhatsApp number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getUrgencyColor = (urgency) => {
    const option = urgencyOptions.find(opt => opt.value === urgency);
    return option?.color || '#4CAF50';
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

      // Add optional fields only if they have values
      if (formData.maxBudget) {
        submitData.maxBudget = Number(formData.maxBudget);
      }
      
      if (formData.location.trim()) {
        submitData.location = formData.location.trim();
      }
      
      if (formData.buyerWhatsApp.trim()) {
        submitData.buyerWhatsApp = formData.buyerWhatsApp.trim();
      }

      // Process tags
      if (formData.tags.trim()) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag);
        submitData.tags = tagsArray;
      }

      await axios.post('api/wanted/create', submitData);

      Alert.alert(
        'Success!', 
        'Your wanted post has been created successfully. Other users can now see what you\'re looking for and contact you.',
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
      <StatusBar backgroundColor="#047857" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Wanted Post</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={showTipsAlert}
        >
          <Ionicons name="help-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="search" size={20} color="#047857" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Looking for Something?</Text>
            <Text style={styles.infoText}>
              Create a wanted post and let sellers come to you! Posts expire after 30 days.
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          {/* Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>What are you looking for? *</Text>
            <TextInput
              placeholder="e.g., iPhone 13 Pro Max, Study Table, Textbooks"
              placeholderTextColor="#999"
              value={formData.title}
              onChangeText={(text) => handleInputChange('title', text)}
              style={[styles.input, errors.title && styles.inputError]}
              maxLength={100}
            />
            <Text style={styles.charCount}>{formData.title.length}/100</Text>
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Detailed Description *</Text>
            <TextInput
              placeholder="Describe exactly what you need, including specifications, size, color, etc."
              placeholderTextColor="#999"
              value={formData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              style={[styles.textArea, errors.description && styles.inputError]}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{formData.description.length}/500</Text>
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* Category */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category *</Text>
            <View style={[styles.pickerContainer, errors.category && styles.inputError]}>
              <RNPickerSelect
                onValueChange={(value) => handleInputChange('category', value)}
                items={categoryOptions}
                placeholder={{ label: 'Select Category', value: null }}
                value={formData.category}
                style={pickerSelectStyles}
                Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
              />
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          {/* Budget */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Maximum Budget (KES)</Text>
            <TextInput
              placeholder="Enter your maximum budget"
              placeholderTextColor="#999"
              value={formData.maxBudget}
              onChangeText={(text) => handleInputChange('maxBudget', text)}
              keyboardType="numeric"
              style={[styles.input, errors.maxBudget && styles.inputError]}
            />
            <Text style={styles.helperText}>Optional - helps sellers know your price range</Text>
            {errors.maxBudget && <Text style={styles.errorText}>{errors.maxBudget}</Text>}
          </View>

          {/* Preferred Condition */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preferred Condition</Text>
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                onValueChange={(value) => handleInputChange('preferredCondition', value)}
                items={conditionOptions}
                value={formData.preferredCondition}
                style={pickerSelectStyles}
                Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Preferred Location</Text>
            <TextInput
              placeholder="Enter your area, eg Mabs"
              placeholderTextColor="#999"
              value={formData.location}
              onChangeText={(text) => handleInputChange('location', text)}
              style={styles.input}
            />
            <Text style={styles.helperText}>Helps find nearby sellers</Text>
          </View>

          {/* WhatsApp */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>WhatsApp Number (Optional)</Text>
            <TextInput
              placeholder="Enter WhatsApp number (e.g., +254700000000)"
              placeholderTextColor="#999"
              value={formData.buyerWhatsApp}
              onChangeText={(text) => handleInputChange('buyerWhatsApp', text)}
              style={[styles.input, errors.buyerWhatsApp && styles.inputError]}
              keyboardType="phone-pad"
            />
            <Text style={styles.helperText}>Sellers can contact you directly</Text>
            {errors.buyerWhatsApp && <Text style={styles.errorText}>{errors.buyerWhatsApp}</Text>}
          </View>

          {/* Tags */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tags (Optional)</Text>
            <TextInput
              placeholder="Add keywords separated by commas (e.g., smartphone, android, gaming)"
              placeholderTextColor="#999"
              value={formData.tags}
              onChangeText={(text) => handleInputChange('tags', text)}
              style={styles.input}
            />
            <Text style={styles.helperText}>Helps sellers find your post easier</Text>
          </View>

          {/* Urgency */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>How urgently do you need this?</Text>
            <View style={styles.urgencyContainer}>
              {urgencyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.urgencyOption,
                    formData.urgency === option.value && styles.urgencyOptionSelected
                  ]}
                  onPress={() => handleInputChange('urgency', option.value)}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={20} 
                    color={formData.urgency === option.value ? '#fff' : option.color} 
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

          {/* Post Duration Info */}
          <View style={styles.durationCard}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.durationText}>
              Your post will be active for 30 days and automatically expire
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating Post...' : 'Create Wanted Post'}
            </Text>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#047857',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#047857',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#065f46',
    lineHeight: 20,
  },
  form: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#f44336',
    backgroundColor: '#fff5f5',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  urgencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: '45%',
    justifyContent: 'center',
  },
  urgencyOptionSelected: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  urgencyText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  urgencyTextSelected: {
    color: '#fff',
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  durationText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#047857',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    color: '#333',
    paddingRight: 40,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#333',
    paddingRight: 40,
  },
  iconContainer: {
    top: 20,
    right: 15,
  },
});

export default CreateWantedPostScreen;
