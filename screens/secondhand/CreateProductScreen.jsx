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
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

// Dark Warm Amber Theme
const MarketplaceColors = {
  primary: '#03604d',      
  primaryDark: '#0e582a',   // Dark Amber
  primaryLight: '#0b7a0b',  // Light Amber
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

      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          submitFormData.append(key, formData[key]);
        }
      });

      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        submitFormData.append('tags', JSON.stringify(tagsArray));
      }

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
        'Your product has been submitted for review.',
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
    <View style={styles.container}>
      <LinearGradient
        colors={[MarketplaceColors.background, MarketplaceColors.surface]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[MarketplaceColors.primary, MarketplaceColors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Product</Text>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => setShowApprovalInfo(!showApprovalInfo)}
          >
            <Ionicons name="help-circle-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Approval Info Card */}
        {showApprovalInfo && (
          <LinearGradient
            colors={[MarketplaceColors.card, MarketplaceColors.surface]}
            style={styles.infoCard}
          >
            <View style={styles.infoIconContainer}>
              <Ionicons name="information-circle" size={24} color={MarketplaceColors.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Product Approval Process</Text>
              <Text style={styles.infoText}>
                All products are reviewed by our admin team before being published. This usually takes 24-48 hours.
              </Text>
              <TouchableOpacity onPress={contactAdmin}>
                <Text style={styles.contactAdminText}>Need Help? Contact Admin →</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}

        <View style={styles.form}>
          {/* Product Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              <Ionicons name="pricetag-outline" size={14} color={MarketplaceColors.primary} /> Product Name *
            </Text>
            <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
              <TextInput
                placeholder="Enter product name"
                placeholderTextColor={MarketplaceColors.textMuted}
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                maxLength={100}
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Price & Negotiable Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>
                <Ionicons name="cash-outline" size={14} color={MarketplaceColors.primary} /> Price (KES) *
              </Text>
              <View style={[styles.inputWrapper, errors.price && styles.inputError]}>
                <TextInput
                  placeholder="Enter price"
                  placeholderTextColor={MarketplaceColors.textMuted}
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) => handleInputChange('price', text)}
                  keyboardType="numeric"
                />
              </View>
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            </View>

            <TouchableOpacity style={styles.negotiableContainer} onPress={toggleNegotiable}>
              <Ionicons 
                name={formData.isNegotiable ? "checkbox" : "square-outline"} 
                size={24} 
                color={MarketplaceColors.primary} 
              />
              <Text style={styles.negotiableText}>Negotiable</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              <Ionicons name="document-text-outline" size={14} color={MarketplaceColors.primary} /> Description *
            </Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper, errors.description && styles.inputError]}>
              <TextInput
                placeholder="Describe your product in detail"
                placeholderTextColor={MarketplaceColors.textMuted}
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
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

          {/* Category & Condition Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>
                <Ionicons name="apps-outline" size={14} color={MarketplaceColors.primary} /> Category *
              </Text>
              <View style={[styles.pickerWrapper, errors.category && styles.inputError]}>
                <RNPickerSelect
                  onValueChange={(value) => handleInputChange('category', value)}
                  value={formData.category}
                  items={CATEGORY_OPTIONS}
                  placeholder={{ label: 'Select category', value: null }}
                  style={pickerSelectStyles}
                  Icon={() => <Ionicons name="chevron-down" size={20} color={MarketplaceColors.primary} />}
                />
              </View>
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>
                <Ionicons name="ribbon-outline" size={14} color={MarketplaceColors.primary} /> Condition
              </Text>
              <View style={styles.pickerWrapper}>
                <RNPickerSelect
                  onValueChange={(value) => handleInputChange('condition', value)}
                  value={formData.condition}
                  items={CONDITION_OPTIONS}
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
                  placeholder="Enter your location"
                  placeholderTextColor={MarketplaceColors.textMuted}
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => handleInputChange('location', text)}
                />
              </View>
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>
                <Ionicons name="logo-whatsapp" size={14} color={MarketplaceColors.primary} /> WhatsApp
              </Text>
              <View style={[styles.inputWrapper, errors.sellerWhatsApp && styles.inputError]}>
                <TextInput
                  placeholder="+254..."
                  placeholderTextColor={MarketplaceColors.textMuted}
                  style={styles.input}
                  value={formData.sellerWhatsApp}
                  onChangeText={(text) => handleInputChange('sellerWhatsApp', text)}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.sellerWhatsApp && <Text style={styles.errorText}>{errors.sellerWhatsApp}</Text>}
            </View>
          </View>

          {/* Tags */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              <Ionicons name="pricetags-outline" size={14} color={MarketplaceColors.primary} /> Tags
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Enter tags separated by commas"
                placeholderTextColor={MarketplaceColors.textMuted}
                style={styles.input}
                value={formData.tags}
                onChangeText={(text) => handleInputChange('tags', text)}
              />
            </View>
            <Text style={styles.helperText}>Tags help buyers find your product easier</Text>
          </View>

          {/* Image Upload */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              <Ionicons name="image-outline" size={14} color={MarketplaceColors.primary} /> Product Image *
            </Text>
            <TouchableOpacity 
              style={[styles.imagePicker, errors.image && styles.inputError]} 
              onPress={showImageOptions}
            >
              {image ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                    style={styles.imageOverlay}
                  >
                    <TouchableOpacity style={styles.changeImageButton} onPress={showImageOptions}>
                      <Ionicons name="camera" size={16} color="#FFFFFF" />
                      <Text style={styles.changeImageText}>Change</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <View style={styles.placeholderIconContainer}>
                    <Ionicons name="camera" size={40} color={MarketplaceColors.primary} />
                  </View>
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
            <LinearGradient
              colors={[MarketplaceColors.primary, MarketplaceColors.primaryDark]}
              style={styles.submitButtonGradient}
            >
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>
                    Submit Product
                  </Text>
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
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  helpButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
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
    marginBottom: 8,
  },
  contactAdminText: {
    fontSize: 13,
    color: MarketplaceColors.primary,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
  negotiableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
    width: '40%',
  },
  negotiableText: {
    fontSize: 14,
    color: MarketplaceColors.text,
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: MarketplaceColors.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: MarketplaceColors.surface,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  placeholderIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: MarketplaceColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePickerText: {
    fontSize: 15,
    color: MarketplaceColors.text,
    marginTop: 8,
    fontWeight: '500',
  },
  imagePickerSubtext: {
    fontSize: 12,
    color: MarketplaceColors.textMuted,
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
    borderRadius: 14,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 6,
  },
  changeImageText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 20,
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

export default CreateProductScreen; 