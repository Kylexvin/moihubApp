import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = 'https://moihub.onrender.com/api';

const RoommateCreate = () => {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'has_room',
    name: '',
    gender: 'male',
    preferredGender: 'any',
    budget: '',
    location: '',
    description: '',
    whatsappNumber: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) {
      errors.push('Name is required');
    }

    if (!formData.budget.trim() || isNaN(formData.budget) || parseInt(formData.budget) <= 0) {
      errors.push('Please enter a valid budget amount');
    }

    if (!formData.location.trim()) {
      errors.push('Location is required');
    }

    if (!formData.description.trim()) {
      errors.push('Description is required');
    }

    if (!formData.whatsappNumber.trim()) {
      errors.push('WhatsApp number is required');
    } else if (!/^\+254\d{9}$/.test(formData.whatsappNumber.replace(/\s/g, ''))) {
      errors.push('Please enter a valid Kenyan phone number (e.g., +254712345678)');
    }

    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        budget: parseInt(formData.budget),
        whatsappNumber: formData.whatsappNumber.replace(/\s/g, ''),
      };

      await axios.post(`${API_URL}/roommates`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert(
        'Success!',
        'Your roommate listing has been created successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create listing. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const SelectButton = ({ title, value, currentValue, onPress }) => (
    <TouchableOpacity
      style={[
        styles.selectButton,
        currentValue === value && styles.selectedButton
      ]}
      onPress={() => onPress(value)}
    >
      <Text style={[
        styles.selectButtonText,
        currentValue === value && styles.selectedButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Type Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>I am looking for roommate:</Text>
            <View style={styles.buttonRow}>
              <SelectButton
                title="With a room"
                value="has_room"
                currentValue={formData.type}
                onPress={(value) => handleInputChange('type', value)}
              />
              <SelectButton
                title="Without a room"
                value="looking_for_room"
                currentValue={formData.type}
                onPress={(value) => handleInputChange('type', value)}
              />
            </View>
          </View>

          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Your Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter your name"
            />
          </View>

          {/* Gender Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Your Gender *</Text>
            <View style={styles.buttonRow}>
              <SelectButton
                title="Male"
                value="male"
                currentValue={formData.gender}
                onPress={(value) => handleInputChange('gender', value)}
              />
              <SelectButton
                title="Female"
                value="female"
                currentValue={formData.gender}
                onPress={(value) => handleInputChange('gender', value)}
              />
            </View>
          </View>

          {/* Preferred Gender */}
          <View style={styles.section}>
            <Text style={styles.label}>Preferred Roommate Gender</Text>
            <View style={styles.buttonRow}>
              <SelectButton
                title="Any"
                value="any"
                currentValue={formData.preferredGender}
                onPress={(value) => handleInputChange('preferredGender', value)}
              />
              <SelectButton
                title="Male"
                value="male"
                currentValue={formData.preferredGender}
                onPress={(value) => handleInputChange('preferredGender', value)}
              />
              <SelectButton
                title="Female"
                value="female"
                currentValue={formData.preferredGender}
                onPress={(value) => handleInputChange('preferredGender', value)}
              />
            </View>
          </View>

          {/* Budget Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Monthly Rent (KSh) *</Text>
            <TextInput
              style={styles.input}
              value={formData.budget}
              onChangeText={(value) => handleInputChange('budget', value)}
              placeholder="e.g., 6000"
              keyboardType="numeric"
            />
          </View>

          {/* Location Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="e.g., Rebo, Stage"
            />
          </View>

          {/* WhatsApp Number */}
          <View style={styles.section}>
            <Text style={styles.label}>WhatsApp Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.whatsappNumber}
              onChangeText={(value) => handleInputChange('whatsappNumber', value)}
              placeholder="+254712345678"
              keyboardType="phone-pad"
            />
            <Text style={styles.helperText}>
              Please include country code (e.g., +254 for Kenya)
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Tell us about yourself, your preferences, lifestyle, etc."
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Create Listing</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  selectButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#50c878',
    borderColor: '#50c878',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#50c878',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RoommateCreate;