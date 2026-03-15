import React, { useState, useEffect } from 'react';
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
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const API_URL = 'https://moihub.onrender.com/api';

// Midnight Bloom Theme Colors (matching Browse screen)
const theme = {
  primary: '#4A2C3D',     // Deep mauve
  secondary: '#6B4E5E',   // Dusty rose
  accent: '#C45A8A',      // Bright rose
  background: '#241A20',  // Dark purple-gray
  card: '#3A2A32',        // Dark mauve
  text: '#F7E6F0',        // Soft pink-white
  textSecondary: '#B39AA5', // Muted pink
  border: '#5A3E4E',      // Medium mauve
  error: '#D45D5D',       // Rose red
  success: '#7A9E7A',     // Sage green
  gradient: ['#4A2C3D', '#6B4E5E', '#C45A8A'],
};

const RoommateCreate = () => {
  const navigation = useNavigation();
  const { token, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingListing, setCheckingListing] = useState(true);
  const [formData, setFormData] = useState({
    type: '',  // No default - user must choose
    name: '',
    gender: '', // No default
    preferredGender: '', // No default
    hasRoomBudget: '',        // For those with room
    lookingForBudgetMin: '',  // For those looking
    lookingForBudgetMax: '',  // For those looking
    location: '',
    description: '',
    whatsappNumber: '',
  });

  // Auto-check for existing listings when screen loads
  useEffect(() => {
    checkExistingListing();
  }, []);

  const checkExistingListing = async () => {
    try {
      const response = await axios.get(`${API_URL}/roommates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userListings = response.data.posts?.filter(
        listing => listing.userId === currentUser?.id || listing.userId === currentUser?._id
      );
      
      if (userListings?.length > 0) {
        // User has an existing listing
        Alert.alert(
          '📋 Active Listing Found',
          'You already have an active listing. Each user can only have one listing at a time.',
          [
            {
              text: 'View My Listing',
              onPress: () => navigation.navigate('RoommateBrowse'),
            },
            {
              text: 'Delete & Create New',
              style: 'destructive',
              onPress: () => handleDeleteExisting(userListings[0]._id),
            },
          ]
        );
      }
    } catch (error) {
      console.log('Error checking existing listings:', error);
    } finally {
      setCheckingListing(false);
    }
  };

  const handleDeleteExisting = async (listingId) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/roommates/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Success', 'Existing listing deleted. You can now create a new one.');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete existing listing');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const errors = [];

    // Check if type is selected
    if (!formData.type) {
      errors.push('Please select whether you have a room or need one');
    }

    // Check if gender is selected
    if (!formData.gender) {
      errors.push('Please select your gender');
    }

    // Basic required fields
    if (!formData.name.trim()) {
      errors.push('Name is required');
    }

    if (!formData.location.trim()) {
      errors.push('Location is required');
    }

    if (!formData.description.trim()) {
      errors.push('Description is required');
    }

    if (!formData.whatsappNumber.trim()) {
      errors.push('WhatsApp number is required');
    } else {
      const cleanNumber = formData.whatsappNumber.replace(/\s/g, '');
      if (!/^\+254\d{9}$/.test(cleanNumber) && !/^0\d{9}$/.test(cleanNumber)) {
        errors.push('Please enter a valid Kenyan phone number (e.g., +254712345678 or 0712345678)');
      }
    }

    // Budget validation based on type
    if (formData.type === 'has_room') {
      // For those with room - budget is required
      if (!formData.hasRoomBudget.trim()) {
        errors.push('Please enter your current rent amount');
      } else if (isNaN(formData.hasRoomBudget) || parseInt(formData.hasRoomBudget) <= 0) {
        errors.push('Please enter a valid rent amount');
      }
    } else if (formData.type === 'looking_for_room') {
      // For those looking for room - budget range is optional
      if (formData.lookingForBudgetMin && (isNaN(formData.lookingForBudgetMin) || parseInt(formData.lookingForBudgetMin) < 0)) {
        errors.push('Please enter a valid minimum budget');
      }
      if (formData.lookingForBudgetMax && (isNaN(formData.lookingForBudgetMax) || parseInt(formData.lookingForBudgetMax) < 0)) {
        errors.push('Please enter a valid maximum budget');
      }
      if (formData.lookingForBudgetMin && formData.lookingForBudgetMax && 
          parseInt(formData.lookingForBudgetMin) > parseInt(formData.lookingForBudgetMax)) {
        errors.push('Minimum budget cannot be greater than maximum budget');
      }
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
      // Prepare submission data based on type
      let submitData = {
        type: formData.type,
        name: formData.name.trim(),
        gender: formData.gender,
        preferredGender: formData.preferredGender || 'any',
        location: formData.location.trim(),
        description: formData.description.trim(),
        whatsappNumber: formData.whatsappNumber.replace(/\s/g, ''),
      };

      // Add budget fields based on type
      if (formData.type === 'has_room') {
        submitData.budget = parseInt(formData.hasRoomBudget);
      } else {
        // For those looking
        if (!formData.lookingForBudgetMin && !formData.lookingForBudgetMax) {
          submitData.budgetFlexible = true;
        } else {
          if (formData.lookingForBudgetMin) {
            submitData.budgetMin = parseInt(formData.lookingForBudgetMin);
          }
          if (formData.lookingForBudgetMax) {
            submitData.budgetMax = parseInt(formData.lookingForBudgetMax);
          }
        }
      }

      console.log('Submitting data:', submitData);

      const response = await axios.post(`${API_URL}/roommates`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        Alert.alert(
          '✨ Success!',
          'Your roommate listing has been created successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      
      // Handle duplicate listing error from backend
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes('already have an active listing')) {
        
        Alert.alert(
          '⚠️ Active Listing Found',
          'You already have an active listing. Please delete it first.',
          [
            {
              text: 'Go Back',
              style: 'cancel',
            },
            {
              text: 'View My Listings',
              onPress: () => navigation.navigate('RoommateBrowse'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to create listing. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const SelectButton = ({ title, value, currentValue, onPress, icon }) => {
    const isSelected = currentValue === value;
    
    // Map icon strings to actual components
    const getIcon = () => {
      switch(icon) {
        case 'home':
          return <MaterialIcons name="home" size={16} color={isSelected ? 'white' : theme.textSecondary} />;
        case 'search':
          return <MaterialIcons name="search" size={16} color={isSelected ? 'white' : theme.textSecondary} />;
        case 'male':
          return <Ionicons name="male" size={16} color={isSelected ? 'white' : theme.textSecondary} />;
        case 'female':
          return <Ionicons name="female" size={16} color={isSelected ? 'white' : theme.textSecondary} />;
        case 'other':
          return <Ionicons name="person" size={16} color={isSelected ? 'white' : theme.textSecondary} />;
        case 'any':
          return <Ionicons name="people" size={16} color={isSelected ? 'white' : theme.textSecondary} />;
        default:
          return null;
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.selectButton,
          isSelected && styles.selectedButton
        ]}
        onPress={() => onPress(value)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={isSelected 
            ? [theme.accent, theme.secondary] 
            : ['transparent', 'transparent']}
          style={styles.selectGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {getIcon()}
          <Text style={[
            styles.selectButtonText,
            isSelected && styles.selectedButtonText
          ]}>
            {title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Show loading while checking for existing listings
  if (checkingListing) {
    return (
      <LinearGradient colors={[theme.background, '#1A1218']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>Checking your listings...</Text>
      </LinearGradient>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <LinearGradient colors={[theme.background, '#1A1218']} style={styles.gradient}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="home-work" size={32} color={theme.accent} />
            <Text style={styles.headerTitle}>Create Listing</Text>
            <Text style={styles.headerSubtitle}>Find your perfect roommate match</Text>
          </View>

          <View style={styles.form}>
            {/* Type Selection - Required */}
            <View style={styles.section}>
              <Text style={styles.label}>
                I am looking for roommate: <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.buttonRow}>
                <SelectButton
                  title="With a room"
                  value="has_room"
                  icon="home"
                  currentValue={formData.type}
                  onPress={(value) => handleInputChange('type', value)}
                />
                <SelectButton
                  title="Need a room"
                  value="looking_for_room"
                  icon="search"
                  currentValue={formData.type}
                  onPress={(value) => handleInputChange('type', value)}
                />
              </View>
              {!formData.type && (
                <View style={styles.warningContainer}>
                  <MaterialIcons name="error-outline" size={14} color={theme.error} />
                  <Text style={styles.warningText}>Please select an option</Text>
                </View>
              )}
            </View>

            {/* Name Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Your Name <Text style={styles.required}>*</Text></Text>
              <BlurView intensity={30} tint="dark" style={styles.inputBlur}>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(value) => handleInputChange('name', value)}
                    placeholder="Enter your name"
                    placeholderTextColor={theme.textSecondary}
                    selectionColor={theme.accent}
                  />
                </View>
              </BlurView>
            </View>

            {/* Gender Selection - Required */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Your Gender <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.buttonRow}>
                <SelectButton
                  title="Male"
                  value="male"
                  icon="male"
                  currentValue={formData.gender}
                  onPress={(value) => handleInputChange('gender', value)}
                />
                <SelectButton
                  title="Female"
                  value="female"
                  icon="female"
                  currentValue={formData.gender}
                  onPress={(value) => handleInputChange('gender', value)}
                />
                <SelectButton
                  title="Other"
                  value="other"
                  icon="other"
                  currentValue={formData.gender}
                  onPress={(value) => handleInputChange('gender', value)}
                />
              </View>
              {!formData.gender && (
                <View style={styles.warningContainer}>
                  <MaterialIcons name="error-outline" size={14} color={theme.error} />
                  <Text style={styles.warningText}>Please select your gender</Text>
                </View>
              )}
            </View>

            {/* Preferred Gender */}
            <View style={styles.section}>
              <Text style={styles.label}>Preferred Roommate Gender</Text>
              <View style={styles.buttonRow}>
                <SelectButton
                  title="Any"
                  value="any"
                  icon="any"
                  currentValue={formData.preferredGender}
                  onPress={(value) => handleInputChange('preferredGender', value)}
                />
                <SelectButton
                  title="Male"
                  value="male"
                  icon="male"
                  currentValue={formData.preferredGender}
                  onPress={(value) => handleInputChange('preferredGender', value)}
                />
                <SelectButton
                  title="Female"
                  value="female"
                  icon="female"
                  currentValue={formData.preferredGender}
                  onPress={(value) => handleInputChange('preferredGender', value)}
                />
              </View>
            </View>

            {/* Budget Section - Conditional based on type */}
            {formData.type && (
              <View style={styles.section}>
                <Text style={styles.label}>
                  {formData.type === 'has_room' 
                    ? 'Monthly Rent (KSh) *' 
                    : 'Budget Range (KSh/month)'}
                </Text>
                
                {formData.type === 'has_room' ? (
                  // For those with room - single amount (required)
                  <BlurView intensity={30} tint="dark" style={styles.inputBlur}>
                    <View style={styles.inputContainer}>
                      <FontAwesome5 name="money-bill-wave" size={16} color={theme.accent} />
                      <TextInput
                        style={styles.input}
                        value={formData.hasRoomBudget}
                        onChangeText={(value) => handleInputChange('hasRoomBudget', value)}
                        placeholder="e.g., 6000"
                        placeholderTextColor={theme.textSecondary}
                        keyboardType="numeric"
                      />
                    </View>
                  </BlurView>
                ) : (
                  // For those looking - range (optional)
                  <View>
                    <View style={styles.budgetRangeContainer}>
                      <BlurView intensity={30} tint="dark" style={[styles.inputBlur, styles.budgetInput]}>
                        <TextInput
                          style={styles.input}
                          value={formData.lookingForBudgetMin}
                          onChangeText={(value) => handleInputChange('lookingForBudgetMin', value)}
                          placeholder="Min"
                          placeholderTextColor={theme.textSecondary}
                          keyboardType="numeric"
                        />
                      </BlurView>
                      
                      <Text style={styles.budgetSeparator}>-</Text>
                      
                      <BlurView intensity={30} tint="dark" style={[styles.inputBlur, styles.budgetInput]}>
                        <TextInput
                          style={styles.input}
                          value={formData.lookingForBudgetMax}
                          onChangeText={(value) => handleInputChange('lookingForBudgetMax', value)}
                          placeholder="Max"
                          placeholderTextColor={theme.textSecondary}
                          keyboardType="numeric"
                        />
                      </BlurView>
                    </View>
                    <View style={styles.helperContainer}>
                      <MaterialIcons name="info-outline" size={12} color={theme.textSecondary} />
                      <Text style={styles.helperText}>
                        Leave blank if you're flexible on budget
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Location Input */}
            <View style={styles.section}>
              <Text style={styles.label}>Location <Text style={styles.required}>*</Text></Text>
              <BlurView intensity={30} tint="dark" style={styles.inputBlur}>
                <View style={styles.inputContainer}>
                  <Ionicons name="location-outline" size={18} color={theme.textSecondary} />
                  <TextInput
                    style={styles.input}
                    value={formData.location}
                    onChangeText={(value) => handleInputChange('location', value)}
                    placeholder="e.g., Rebo, Stage"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </BlurView>
            </View>

            {/* WhatsApp Number */}
            <View style={styles.section}>
              <Text style={styles.label}>WhatsApp Number <Text style={styles.required}>*</Text></Text>
              <BlurView intensity={30} tint="dark" style={styles.inputBlur}>
                <View style={styles.inputContainer}>
                  <FontAwesome5 name="whatsapp" size={16} color="#25D366" />
                  <TextInput
                    style={styles.input}
                    value={formData.whatsappNumber}
                    onChangeText={(value) => handleInputChange('whatsappNumber', value)}
                    placeholder="+254712345678"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
              </BlurView>
              <View style={styles.helperContainer}>
                <MaterialIcons name="info-outline" size={12} color={theme.textSecondary} />
                <Text style={styles.helperText}>
                  Include country code (e.g., +254 for Kenya)
                </Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
              <BlurView intensity={30} tint="dark" style={[styles.inputBlur, styles.textAreaBlur]}>
                <View style={styles.inputContainer}>
                  <Ionicons name="document-text-outline" size={18} color={theme.textSecondary} style={styles.textAreaIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(value) => handleInputChange('description', value)}
                    placeholder="Tell us about yourself, your preferences, lifestyle, etc."
                    placeholderTextColor={theme.textSecondary}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </BlurView>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={theme.gradient}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <MaterialIcons name="check-circle" size={20} color="white" />
                    <Text style={styles.submitButtonText}>Create Listing</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    letterSpacing: 0.3,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  required: {
    color: theme.accent,
    fontSize: 14,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginLeft: 4,
  },
  warningText: {
    color: theme.error,
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  selectButton: {
    flex: 1,
    minWidth: 100,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectGradient: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  selectedButton: {
    borderColor: theme.accent,
  },
  selectButtonText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  selectedButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  inputBlur: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(58, 42, 50, 0.3)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.text,
  },
  textAreaBlur: {
    minHeight: 100,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  textAreaIcon: {
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  budgetRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetInput: {
    flex: 1,
  },
  budgetSeparator: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: 'bold',
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitGradient: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default RoommateCreate;