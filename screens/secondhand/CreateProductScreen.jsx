import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  Image,
  ActivityIndicator,
  Linking,
  Platform
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';


const CATEGORY_OPTIONS = [
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Furniture', value: 'Furniture' },
  { label: 'Clothing & Accessories', value: 'Clothing & Accessories' },
  { label: 'Books & Education', value: 'Books & Education' },
  { label: 'Sports & Recreation', value: 'Sports & Recreation' },
  { label: 'Home & Garden', value: 'Home & Garden' },
  { label: 'Vehicles', value: 'Vehicles' },
  { label: 'Health & Beauty', value: 'Health & Beauty' },
  { label: 'Baby & Kids', value: 'Baby & Kids' },
  { label: 'Food & Beverages', value: 'Food & Beverages' },
  { label: 'Services', value: 'Services' },
  { label: 'Other', value: 'Other' },
];

const CONDITION_OPTIONS = [
  { label: 'New', value: 'New' },
  { label: 'Like New', value: 'Like New' },
  { label: 'Good', value: 'Good' },
  { label: 'Fair', value: 'Fair' },
  { label: 'Poor', value: 'Poor' },
];

const CreateProductScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    condition: 'Good',
    location: '',
    tags: '',
    sellerWhatsApp: '',
    isNegotiable: true,
  });
  
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showApprovalInfo, setShowApprovalInfo] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload product images.'
      );
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!image) {
      newErrors.image = 'Product image is required';
    }

    // WhatsApp validation (optional but if provided, should be valid)
    if (formData.sellerWhatsApp && !/^\+?[\d\s-()]+$/.test(formData.sellerWhatsApp)) {
      newErrors.sellerWhatsApp = 'Please enter a valid WhatsApp number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        if (errors.image) {
          setErrors(prev => ({ ...prev, image: null }));
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        if (errors.image) {
          setErrors(prev => ({ ...prev, image: null }));
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add a product image',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

const contactAdmin = async () => {
  Alert.alert(
    'Contact Admin',
    'If your product is pending approval for too long or has been rejected, you can contact our admin team.',
    [
      {
        text: 'WhatsApp Admin',
        onPress: async () => {
          const adminWhatsApp = '+254768610613';
          const message = 'Hello, I need help with my marketplace product approval.';

          const cleanNumber = adminWhatsApp.replace(/\D/g, '');
          const formattedNumber = cleanNumber.startsWith('254')
            ? cleanNumber
            : `254${cleanNumber.replace(/^0/, '')}`;
          const encodedMessage = encodeURIComponent(message);

          try {
            const isInstalled = await Linking.canOpenURL('whatsapp://');

            if (isInstalled) {
              try {
                await Linking.openURL(`whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`);
                return;
              } catch (err) {
                console.warn('Native WhatsApp link failed:', err);
              }
            }

            try {
              await Linking.openURL(`https://wa.me/${formattedNumber}?text=${encodedMessage}`);
              return;
            } catch (err) {
              console.warn('Fallback web WhatsApp link failed:', err);
            }

            // Final fallback
            Alert.alert(
              'WhatsApp Not Available',
              'WhatsApp is not available on this device. Choose an option:',
              [
                {
                  text: 'Copy Number',
                  onPress: async () => {
                    try {
                      await Clipboard.setStringAsync(formattedNumber);
                      Alert.alert('Copied!', `${formattedNumber} copied to clipboard`);
                    } catch (copyErr) {
                      console.error('Copy failed:', copyErr);
                      Alert.alert('Error', 'Failed to copy number.');
                    }
                  }
                },
                {
                  text: 'Open in Browser',
                  onPress: async () => {
                    try {
                      await Linking.openURL(`https://wa.me/${formattedNumber}?text=${encodedMessage}`);
                    } catch (browserErr) {
                      console.error('Browser fallback failed:', browserErr);
                      Alert.alert('Error', 'Failed to open in browser.');
                    }
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );

          } catch (error) {
            console.error('WhatsApp contact error:', error);
            Alert.alert('Error', 'Could not initiate WhatsApp contact.');
          }
        }
      },
      {
        text: 'Email Admin',
        onPress: () => {
          const email = 'info.moihub@gmail.com';
          const subject = 'Product Approval Issue';
          const body = 'Hello,\n\nI need assistance with my marketplace product approval.\n\nThank you.';
          const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

          Linking.openURL(url).catch(err => {
            console.error('Failed to open email link:', err);
            Alert.alert('Error', 'Could not open email client.');
          });
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]
  );
};

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below before submitting.');
      return;
    }

    try {
      setUploading(true);
      const submitFormData = new FormData();

      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          submitFormData.append(key, formData[key]);
        }
      });

      // Process tags
      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        submitFormData.append('tags', JSON.stringify(tagsArray));
      }

      // Add image
      submitFormData.append('image', {
        uri: image.uri,
        name: `product_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      await axios.post('api/marketplace/upload', submitFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert(
        'Success!', 
        'Your product has been submitted for review. It will be visible in the marketplace once approved by our admin team.',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } catch (error) {
      console.error('Upload Error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload product. Please try again.';
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const toggleNegotiable = () => {
    setFormData(prev => ({ ...prev, isNegotiable: !prev.isNegotiable }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Create New Product</Text>
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={() => setShowApprovalInfo(!showApprovalInfo)}
        >
          <Ionicons name="help-circle-outline" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {showApprovalInfo && (
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Product Approval Process</Text>
            <Text style={styles.infoText}>
              All products are reviewed by our admin team before being published. This usually takes 24-48 hours.
            </Text>
            <TouchableOpacity style={styles.contactAdminButton} onPress={contactAdmin}>
              <Text style={styles.contactAdminText}>Need Help? Contact Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.form}>
        {/* Product Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            placeholder="Enter product name"
            placeholderTextColor="#999"
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            maxLength={100}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Price */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Price (KES) *</Text>
          <TextInput
            placeholder="Enter price"
            placeholderTextColor="#999"
            style={[styles.input, errors.price && styles.inputError]}
            value={formData.price}
            onChangeText={(text) => handleInputChange('price', text)}
            keyboardType="numeric"
          />
          {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
        </View>

        {/* Negotiable Toggle */}
        <TouchableOpacity style={styles.toggleContainer} onPress={toggleNegotiable}>
          <Ionicons 
            name={formData.isNegotiable ? "checkbox" : "square-outline"} 
            size={24} 
            color="#2196F3" 
          />
          <Text style={styles.toggleText}>Price is negotiable</Text>
        </TouchableOpacity>

        {/* Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            placeholder="Describe your product in detail"
            placeholderTextColor="#999"
            style={[styles.textArea, errors.description && styles.inputError]}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
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
              value={formData.category}
              items={CATEGORY_OPTIONS}
              placeholder={{ label: 'Select a category', value: null }}
              style={pickerSelectStyles}
              Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
            />
          </View>
          {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
        </View>

        {/* Condition */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Condition</Text>
          <View style={styles.pickerContainer}>
            <RNPickerSelect
              onValueChange={(value) => handleInputChange('condition', value)}
              value={formData.condition}
              items={CONDITION_OPTIONS}
              style={pickerSelectStyles}
              Icon={() => <Ionicons name="chevron-down" size={20} color="#666" />}
            />
          </View>
        </View>

        {/* Location */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            placeholder="Enter your location"
            placeholderTextColor="#999"
            style={styles.input}
            value={formData.location}
            onChangeText={(text) => handleInputChange('location', text)}
          />
        </View>

        {/* WhatsApp */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>WhatsApp Number (Optional)</Text>
          <TextInput
            placeholder="Enter WhatsApp number for faster approval"
            placeholderTextColor="#999"
            style={[styles.input, errors.sellerWhatsApp && styles.inputError]}
            value={formData.sellerWhatsApp}
            onChangeText={(text) => handleInputChange('sellerWhatsApp', text)}
            keyboardType="phone-pad"
          />
          {errors.sellerWhatsApp && <Text style={styles.errorText}>{errors.sellerWhatsApp}</Text>}
        </View>

        {/* Tags */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tags</Text>
          <TextInput
            placeholder="Enter tags separated by commas (e.g., smartphone, android, used)"
            placeholderTextColor="#999"
            style={styles.input}
            value={formData.tags}
            onChangeText={(text) => handleInputChange('tags', text)}
          />
          <Text style={styles.helperText}>Tags help buyers find your product easier</Text>
        </View>

        {/* Image Upload */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Product Image *</Text>
          <TouchableOpacity 
            style={[styles.imagePicker, errors.image && styles.inputError]} 
            onPress={showImageOptions}
          >
            {image ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                <TouchableOpacity style={styles.changeImageButton} onPress={showImageOptions}>
                  <Ionicons name="camera" size={16} color="#fff" />
                  <Text style={styles.changeImageText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={40} color="#999" />
                <Text style={styles.imagePickerText}>Tap to add product image</Text>
                <Text style={styles.imagePickerSubtext}>Take photo or choose from gallery</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[styles.submitButton, uploading && styles.submitButtonDisabled]} 
          onPress={handleSubmit} 
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="checkmark" size={20} color="#fff" />
          )}
          <Text style={styles.submitButtonText}>
            {uploading ? 'Uploading...' : 'Submit Product'}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  helpButton: {
    padding: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 20,
    marginBottom: 8,
  },
  contactAdminButton: {
    alignSelf: 'flex-start',
  },
  contactAdminText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  form: {
    padding: 20,
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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#fff',
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  imagePickerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  changeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
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

export default CreateProductScreen;