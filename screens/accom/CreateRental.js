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
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://moihub.onrender.com/api';

// Luxury Emerald Green color palette matching other screens
const RentalColors = {
  primary: '#0A4D3C',      // Deep Emerald
  secondary: '#1E7A5C',     // Medium Emerald
  accent: '#C6A43F',        // Gold
  highlight: '#E8C66A',     // Light Gold
  success: '#2E8B57',       // Sea Green
  warning: '#D4A017',       // Gold
  error: '#B22222',         // Ruby Red
  background: '#0C1F1A',    // Dark Forest
  surface: '#1A332B',       // Deep Jungle
  card: '#234D3C',          // Rich Emerald
  text: '#FFFFFF',          // White
  textSecondary: '#D4E6D0', // Mint Cream
  textMuted: '#8BA89B',     // Sage
  border: '#2C5E4A',        // Forest Border
  gold: '#D4AF37',          // Pure Gold
  goldLight: '#F1E6B0',     // Champagne
};

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
    { label: 'Bedsitter', value: 'bedsitter', icon: 'bed-outline' },
   { label: 'Single', value: 'single', icon: 'person-outline' },
    { label: 'Two Bedroom', value: '2bedroom', icon: 'home-outline' },
     { label: 'One Bedroom', value: '1bedroom', icon: 'home-outline' },
    
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
          'Your luxury rental listing has been created! It will be reviewed by admin before going live.',
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
      <StatusBar barStyle="light-content" backgroundColor={RentalColors.primary} />
      
      <LinearGradient
        colors={[RentalColors.background, RentalColors.surface]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Gold Icons */}
      <View style={styles.floatingIcons}>
        <Text style={[styles.floatingIcon, styles.icon1]}>👑</Text>
        <Text style={[styles.floatingIcon, styles.icon2]}>✨</Text>
        <Text style={[styles.floatingIcon, styles.icon3]}>🏰</Text>
        <Text style={[styles.floatingIcon, styles.icon4]}>💎</Text>
      </View>

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={RentalColors.gold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>List Your Property</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animatable.View animation="fadeInUp" duration={500} style={styles.form}>
          <LinearGradient
            colors={[RentalColors.card, RentalColors.surface]}
            style={styles.formGradient}
          >
            {/* Decorative Pattern */}
            <View style={styles.formPattern}>
              <Text style={styles.patternIcon}>👑</Text>
              <Text style={styles.patternIcon}>✨</Text>
            </View>

            <Text style={styles.formTitle}>Property Details</Text>
            <Text style={styles.formSubtitle}>Fill in the information below</Text>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="home-outline" size={16} color={RentalColors.gold} /> Rental Name *
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="home-outline" size={18} color={RentalColors.gold} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  placeholder="e.g., Rebo"
                  placeholderTextColor={RentalColors.textMuted}
                />
              </View>
            </View>

            {/* Location Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="location-outline" size={16} color={RentalColors.gold} /> Location *
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={18} color={RentalColors.gold} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(value) => handleInputChange('location', value)}
                  placeholder="e.g., Mabs, stage, chebarus"
                  placeholderTextColor={RentalColors.textMuted}
                />
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="cash-outline" size={16} color={RentalColors.gold} /> Monthly Rent (KSh) *
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="cash-outline" size={18} color={RentalColors.gold} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.amount}
                  onChangeText={(value) => handleInputChange('amount', value)}
                  placeholder="e.g., 25000"
                  placeholderTextColor={RentalColors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="apps-outline" size={16} color={RentalColors.gold} /> Rental Type *
              </Text>
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
                      <LinearGradient
                        colors={formData.type === type.value 
                          ? [RentalColors.primary, RentalColors.secondary]
                          : ['transparent', 'transparent']}
                        style={styles.typeChipGradient}
                      >
                        <Ionicons 
                          name={type.icon} 
                          size={16} 
                          color={formData.type === type.value ? RentalColors.gold : RentalColors.textMuted} 
                        />
                        <Text style={[
                          styles.typeText,
                          formData.type === type.value && styles.selectedTypeText
                        ]}>
                          {type.label}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Caretaker Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="call-outline" size={16} color={RentalColors.gold} /> Caretaker Number *
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={18} color={RentalColors.gold} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.caretakerNumber}
                  onChangeText={(value) => handleInputChange('caretakerNumber', value)}
                  placeholder="e.g., +254712345678"
                  placeholderTextColor={RentalColors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Location URL (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="map-outline" size={16} color={RentalColors.gold} /> Location URL (Optional)
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="map-outline" size={18} color={RentalColors.gold} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={formData.locationUrl}
                  onChangeText={(value) => handleInputChange('locationUrl', value)}
                  placeholder="Google Maps link or similar"
                  placeholderTextColor={RentalColors.textMuted}
                />
              </View>
            </View>

            {/* Images Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                <Ionicons name="images-outline" size={16} color={RentalColors.gold} /> Images * (2-3 required)
              </Text>
              <TouchableOpacity 
                style={styles.imagePickerButton} 
                onPress={pickImages}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[RentalColors.primary + '20', RentalColors.secondary + '10']}
                  style={styles.imagePickerGradient}
                >
                  <Ionicons name="camera" size={32} color={RentalColors.gold} />
                  <Text style={styles.imagePickerText}>
                    {images.length === 0 ? 'Tap to Add Images' : `${images.length}/3 Images Selected`}
                  </Text>
                  <Text style={styles.imagePickerSubtext}>
                    Upload photos of your property
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {images.length > 0 && (
                <View style={styles.imagePreview}>
                  {images.map((image, index) => (
                    <Animatable.View 
                      key={index} 
                      animation="fadeIn" 
                      delay={index * 100}
                      style={styles.imageContainer}
                    >
                      <Image source={{ uri: image.uri }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <LinearGradient
                          colors={[RentalColors.error, RentalColors.error + 'dd']}
                          style={styles.removeImageGradient}
                        >
                          <Ionicons name="close" size={12} color="#fff" />
                        </LinearGradient>
                      </TouchableOpacity>
                      <View style={styles.imageGoldAccent} />
                    </Animatable.View>
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
              <LinearGradient
                colors={[RentalColors.primary, RentalColors.secondary]}
                style={styles.submitButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={RentalColors.gold} />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color={RentalColors.gold} />
                    <Text style={styles.submitButtonText}>Create Listing</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Info Note */}
            <View style={styles.note}>
              <Ionicons name="information-circle" size={20} color={RentalColors.gold} />
              <Text style={styles.noteText}>
                Your listing will be reviewed by admin before going live. This may take up to 24 hours.
              </Text>
            </View>
          </LinearGradient>
        </Animatable.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RentalColors.background,
  },
  floatingIcons: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  floatingIcon: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.1,
    color: RentalColors.gold,
  },
  icon1: {
    top: '10%',
    right: '5%',
    transform: [{ rotate: '15deg' }],
  },
  icon2: {
    top: '30%',
    left: '5%',
    transform: [{ rotate: '-10deg' }],
  },
  icon3: {
    bottom: '20%',
    right: '10%',
    transform: [{ rotate: '25deg' }],
  },
  icon4: {
    bottom: '40%',
    left: '8%',
    transform: [{ rotate: '-15deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: RentalColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RentalColors.gold + '40',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: RentalColors.gold,
  },
  headerRight: {
    width: 40,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 30,
  },
  form: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: RentalColors.gold + '20',
  },
  formGradient: {
    padding: 20,
    position: 'relative',
  },
  formPattern: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    opacity: 0.1,
  },
  patternIcon: {
    fontSize: 20,
    marginHorizontal: 2,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: RentalColors.gold,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: RentalColors.textMuted,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: RentalColors.gold,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
    borderRadius: 12,
    backgroundColor: RentalColors.background,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: RentalColors.text,
  },
  typeContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  typeChip: {
    marginRight: 10,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
  },
  typeChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  typeText: {
    fontSize: 14,
    color: RentalColors.textMuted,
  },
  selectedTypeChip: {
    borderColor: RentalColors.gold,
  },
  selectedTypeText: {
    color: RentalColors.gold,
    fontWeight: '600',
  },
  imagePickerButton: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
  },
  imagePickerGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  imagePickerText: {
    fontSize: 16,
    color: RentalColors.gold,
    fontWeight: '600',
  },
  imagePickerSubtext: {
    fontSize: 12,
    color: RentalColors.textMuted,
  },
  imagePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
  },
  image: {
    width: 100,
    height: 100,
  },
  imageGoldAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: RentalColors.gold,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  removeImageGradient: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  submitButtonText: {
    color: RentalColors.gold,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 16,
    padding: 12,
    backgroundColor: RentalColors.primary + '20',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RentalColors.gold + '20',
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: RentalColors.textSecondary,
    lineHeight: 18,
  },
});

export default CreateRental;
