import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const baseURL = Platform.OS === 'ios' 
  ? 'http://localhost:5000' 
  : 'https://moihub.onrender.com';

const EditListingScreen = ({ route, navigation }) => {
  const { listing } = route.params;

  const [formData, setFormData] = useState({
    name: listing?.name || '',
    description: listing?.description || '',
    price: listing?.price?.toString() || '',
    imageURL: listing?.imageURL || '',
    isActive: listing?.isActive ?? true
  });

  const [imageUri, setImageUri] = useState(listing?.imageURL || null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    const formData = new FormData();
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri,
      name: filename,
      type,
    });

    try {
      const response = await axios.post(`${baseURL}/api/upload/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.imageUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error('Failed to upload image');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a listing name');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }
    return true;
  };

  const handleUpdateListing = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      let imageUrl = formData.imageURL;

      // Upload new image if changed
      if (imageUri && imageUri !== listing?.imageURL) {
        imageUrl = await uploadImage(imageUri);
      }

      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        imageURL: imageUrl,
        isActive: formData.isActive
      };

      // Changed from PUT to PATCH to match your backend route
      await axios.patch(`${baseURL}/api/food/listings/${listing._id}`, updateData);

      Alert.alert('Success', 'Listing updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      console.error('Error updating listing:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Listing</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        {/* Image Upload */}
        <View style={styles.imageSection}>
          <Text style={styles.label}>Listing Image</Text>
          <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="camera" size={40} color="#999" />
                <Text style={styles.uploadText}>Tap to change image</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter listing name"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter description"
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price (KES) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter price"
            value={formData.price}
            onChangeText={(text) => handleInputChange('price', text)}
            keyboardType="numeric"
          />
        </View>

        {/* Active Status */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[
                styles.statusButton,
                formData.isActive && styles.statusButtonActive
              ]}
              onPress={() => handleInputChange('isActive', true)}
            >
              <Text style={[
                styles.statusButtonText,
                formData.isActive && styles.statusButtonTextActive
              ]}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusButton,
                !formData.isActive && styles.statusButtonInactive
              ]}
              onPress={() => handleInputChange('isActive', false)}
            >
              <Text style={[
                styles.statusButtonText,
                !formData.isActive && styles.statusButtonTextInactive
              ]}>Inactive</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          style={[styles.updateButton, loading && styles.updateButtonDisabled]}
          onPress={handleUpdateListing}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.updateButtonText}>Update Listing</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 16,
  },
  imageSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  imageUpload: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  uploadText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  statusButtonActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
  },
  statusButtonInactive: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  statusButtonTextActive: {
    color: '#4caf50',
  },
  statusButtonTextInactive: {
    color: '#f44336',
  },
  updateButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditListingScreen;