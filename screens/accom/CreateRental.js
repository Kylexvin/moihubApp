import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; // Adjust path as needed

const API_URL = 'https://moihub.onrender.com/api';

const CreateRental = ({ navigation }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    amount: '',
    type: '',
    caretakerNumber: '',
    locationUrl: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const rentalTypes = [
   
    { label: 'Bedsitter', value: 'bedsitter' },
    { label: 'One Bedroom', value: '1bedroom' },
    { label: 'Two Bedroom', value: '2bedroom' },
    { label: 'Single', value: 'single' },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      const selectedImages = result.assets.slice(0, 3); // Limit to 3 images
      setImages(prev => [...prev, ...selectedImages].slice(0, 3));
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const { name, location, amount, type, caretakerNumber } = formData;
    
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a rental name');
      return false;
    }
    
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return false;
    }
    
    if (!amount.trim() || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }
    
    if (!type) {
      Alert.alert('Error', 'Please select a rental type');
      return false;
    }
    
    if (!caretakerNumber.trim()) {
      Alert.alert('Error', 'Please enter a caretaker number');
      return false;
    }
    
    if (images.length < 2) {
      Alert.alert('Error', 'Please upload at least 2 images');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Create FormData
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('caretakerNumber', formData.caretakerNumber);
      if (formData.locationUrl) {
        formDataToSend.append('locationUrl', formData.locationUrl);
      }

      // Add images
      images.forEach((image, index) => {
        formDataToSend.append('images', {
          uri: image.uri,
          type: 'image/jpeg',
          name: `image_${index}.jpg`,
        });
      }); 

      const response = await axios.post(`${API_URL}/rentals`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Rental listing created successfully! It will be reviewed by admin before going live.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Create rental error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create rental listing';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        

        <View style={styles.form}>
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rental Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="e.g., Rebo"
              placeholderTextColor="#999"
            />
          </View>

          {/* Location Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder="e.g., Mabs,stage,chebarus"
              placeholderTextColor="#999"
            />
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monthly Rent (KSh) *</Text>
            <TextInput
              style={styles.input}
              value={formData.amount}
              onChangeText={(value) => handleInputChange('amount', value)}
              placeholder="e.g., 25000"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          {/* Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rental Type *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeContainer}>
                {rentalTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeChip,
                      formData.type === type.value && styles.selectedTypeChip
                    ]}
                    onPress={() => handleInputChange('type', type.value)}
                  >
                    <Text style={[
                      styles.typeText,
                      formData.type === type.value && styles.selectedTypeText
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Caretaker Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Caretaker Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.caretakerNumber}
              onChangeText={(value) => handleInputChange('caretakerNumber', value)}
              placeholder="e.g., +254712345678"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          {/* Location URL (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location URL (Optional)</Text>
            <TextInput
              style={styles.input}
              value={formData.locationUrl}
              onChangeText={(value) => handleInputChange('locationUrl', value)}
              placeholder="Google Maps link or similar"
              placeholderTextColor="#999"
            />
          </View>

          {/* Images Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Images * (2-3 required)</Text>
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImages}>
              <Ionicons name="camera" size={24} color="#059669" />
              <Text style={styles.imagePickerText}>
                {images.length === 0 ? 'Add Images' : `${images.length}/3 Images Selected`}
              </Text>
            </TouchableOpacity>

            {images.length > 0 && (
              <View style={styles.imagePreview}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: image.uri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Listing</Text>
            )}
          </TouchableOpacity>

          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.noteText}>
              Your listing will be reviewed by admin before going live. This may take up to 24 hours.
            </Text>
          </View>
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
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputGroup: {
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
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  typeContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedTypeChip: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  typeText: {
    color: '#666',
    fontSize: 14,
  },
  selectedTypeText: {
    color: '#fff',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#059669',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 20,
    backgroundColor: '#f8fffe',
  },
  imagePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#059669',
    fontWeight: '500',
  },
  imagePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f44336',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
});

export default CreateRental;