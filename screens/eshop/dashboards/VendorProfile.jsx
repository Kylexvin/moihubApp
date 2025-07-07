import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

// Constants
const COLORS = {
  primary: '#4A90E2',
  primaryDark: '#357ABD',
  secondary: '#F39C12',
  success: '#27AE60',
  danger: '#E74C3C',
  warning: '#F39C12',
  light: '#F8F9FA',
  dark: '#2C3E50',
  gray: '#6C7B7F',
  lightGray: '#E8E8E8',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  gradient: ['#4A90E2', '#357ABD'],
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const TYPOGRAPHY = {
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  caption: 14,
  small: 12,
};

// Custom Hook for form validation
const useFormValidation = (profile) => {
  const [errors, setErrors] = useState({});

  const validateField = useCallback((field, value) => {
    let error = '';
    
    switch (field) {
      case 'shopName':
        if (!value.trim()) {
          error = 'Shop name is required';
        } else if (value.trim().length < 2) {
          error = 'Shop name must be at least 2 characters';
        }
        break;
      case 'phoneNumber':
        if (!value.trim()) {
          error = 'Phone number is required';
        } else if (!/^\+?[\d\s-()]+$/.test(value.trim())) {
          error = 'Please enter a valid phone number';
        }
        break;
      case 'description':
        if (value.trim().length > 500) {
          error = 'Description must be less than 500 characters';
        }
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    // Validate required fields
    if (!profile.shopName.trim()) {
      newErrors.shopName = 'Shop name is required';
      isValid = false;
    } else if (profile.shopName.trim().length < 2) {
      newErrors.shopName = 'Shop name must be at least 2 characters';
      isValid = false;
    }

    if (!profile.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
      isValid = false;
    } else if (!/^\+?[\d\s-()]+$/.test(profile.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
      isValid = false;
    }

    if (profile.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [profile]);

  return { errors, validateField, validateForm, setErrors };
};

// Memoized Input Component
const InputField = React.memo(({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  multiline = false, 
  keyboardType = 'default',
  error,
  onBlur,
  maxLength,
  icon
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useMemo(() => new Animated.Value(0), []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [animatedValue]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onBlur?.();
  }, [animatedValue, onBlur]);

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? COLORS.danger : COLORS.lightGray, error ? COLORS.danger : COLORS.primary],
  });

  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, error && styles.inputLabelError]}>
        {label}
        {label.includes('*') && <Text style={styles.required}> *</Text>}
      </Text>
      
      <Animated.View style={[styles.inputWrapper, { borderColor }]}>
        {icon && (
          <View style={styles.inputIcon}>
            <Ionicons name={icon} size={20} color={isFocused ? COLORS.primary : COLORS.gray} />
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            icon && styles.inputWithIcon,
            error && styles.inputError
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          keyboardType={keyboardType}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        
        {maxLength && (
          <Text style={styles.characterCount}>
            {value.length}/{maxLength}
          </Text>
        )}
      </Animated.View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
});

// Memoized Button Component
const Button = React.memo(({ 
  title, 
  onPress, 
  disabled, 
  loading, 
  variant = 'primary',
  icon,
  style 
}) => {
  const [pressed, setPressed] = useState(false);

  const buttonStyle = useMemo(() => [
    styles.button,
    styles[`${variant}Button`],
    disabled && styles.disabledButton,
    pressed && styles.buttonPressed,
    style
  ], [variant, disabled, pressed, style]);

  const textStyle = useMemo(() => [
    styles.buttonText,
    styles[`${variant}ButtonText`],
    disabled && styles.disabledButtonText
  ], [variant, disabled]);

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.white} />
      ) : (
        <>
          {icon && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={variant === 'primary' ? COLORS.white : COLORS.gray} 
              style={styles.buttonIcon}
            />
          )}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
});

// Main Component
const VendorProfile = () => {
  const [profile, setProfile] = useState({
    shopName: '',
    description: '',
    address: '',
    phoneNumber: '',
    category: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalProfile, setOriginalProfile] = useState({});
  
  const { errors, validateField, validateForm, setErrors } = useFormValidation(profile);

  // Memoized handlers to prevent unnecessary re-renders
  const handleFieldChange = useCallback((field) => (text) => {
    setProfile(prev => ({ ...prev, [field]: text }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors, setErrors]);

  const handleFieldBlur = useCallback((field) => () => {
    validateField(field, profile[field]);
  }, [validateField, profile]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://moihub.onrender.com/api/eshop/vendor/dashboard');
      
      if (response.data.success && response.data.data.shop) {
        const shop = response.data.data.shop;
        const profileData = {
          shopName: shop.shopName || '',
          description: shop.description || '',
          address: shop.address || '',
          phoneNumber: shop.phoneNumber || '',
          category: shop.category?.name || '',
        };
        setProfile(profileData);
        setOriginalProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert(
        'Error',
        'Failed to load profile data. Please check your connection and try again.',
        [{ text: 'Retry', onPress: fetchProfile }, { text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.put('https://moihub.onrender.com/api/eshop/vendor/profile', {
        shopName: profile.shopName.trim(),
        description: profile.description.trim(),
        address: profile.address.trim(),
        phoneNumber: profile.phoneNumber.trim(),
      });

      if (response.data.success) {
        setOriginalProfile(profile);
        setErrors({});
        Alert.alert(
          'Success',
          'Profile updated successfully!',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile. Please try again.',
        [{ text: 'Retry', onPress: handleUpdateProfile }, { text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  }, [profile, validateForm, setErrors]);

  const handleResetForm = useCallback(() => {
    Alert.alert(
      'Reset Changes',
      'Are you sure you want to discard all changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            setProfile(originalProfile);
            setErrors({});
          }
        }
      ]
    );
  }, [originalProfile, setErrors]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(profile) !== JSON.stringify(originalProfile);
  }, [profile, originalProfile]);

  const isFormValid = useMemo(() => {
    return Object.keys(errors).length === 0 && 
           profile.shopName.trim() && 
           profile.phoneNumber.trim();
  }, [errors, profile.shopName, profile.phoneNumber]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Ionicons name="storefront" size={32} color={COLORS.white} />
              </View>
              <Text style={styles.headerTitle}>Shop Profile</Text>
              <Text style={styles.headerSubtitle}>
                Manage your shop information and settings
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Shop Information</Text>
              
              <InputField
                label="Shop Name *"
                value={profile.shopName}
                onChangeText={handleFieldChange('shopName')}
                onBlur={handleFieldBlur('shopName')}
                placeholder="Enter your shop name"
                error={errors.shopName}
                icon="storefront-outline"
                maxLength={50}
              />

              <InputField
                label="Description"
                value={profile.description}
                onChangeText={handleFieldChange('description')}
                onBlur={handleFieldBlur('description')}
                placeholder="Tell customers about your shop and what you sell"
                multiline={true}
                error={errors.description}
                icon="document-text-outline"
                maxLength={500}
              />

              <InputField
                label="Address"
                value={profile.address}
                onChangeText={handleFieldChange('address')}
                placeholder="Enter your shop address"
                icon="location-outline"
                maxLength={200}
              />

              <InputField
                label="Phone Number *"
                value={profile.phoneNumber}
                onChangeText={handleFieldChange('phoneNumber')}
                onBlur={handleFieldBlur('phoneNumber')}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                error={errors.phoneNumber}
                icon="call-outline"
                maxLength={20}
              />

              {/* Category Display */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryContainer}>
                  <View style={styles.categoryContent}>
                    <Ionicons name="pricetag" size={20} color={COLORS.secondary} />
                    <Text style={styles.categoryText}>
                      {profile.category || 'Not specified'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.categoryHelp}>
                    <Ionicons name="help-circle-outline" size={18} color={COLORS.gray} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <View style={styles.buttonRow}>
              {hasChanges && (
                <Button
                  title="Reset"
                  onPress={handleResetForm}
                  variant="secondary"
                  icon="refresh-outline"
                  disabled={saving}
                  style={styles.resetButton}
                />
              )}

              <Button
                title={saving ? 'Saving...' : 'Save Changes'}
                onPress={handleUpdateProfile}
                variant="primary"
                icon="save-outline"
                disabled={!hasChanges || !isFormValid || saving}
                loading={saving}
                style={styles.saveButton}
              />
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Important Information</Text>
              
              <View style={styles.infoItem}>
                <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  Fields marked with * are required
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="lock-closed" size={20} color={COLORS.warning} />
                <Text style={styles.infoText}>
                  Category changes require admin approval
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
                <Text style={styles.infoText}>
                  Your information is secure and encrypted
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.light,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.body,
    color: COLORS.gray,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.h1,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  
  // Card Styles
  cardContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: SPACING.lg,
  },
  
  // Input Styles
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SPACING.sm,
  },
  inputLabelError: {
    color: COLORS.danger,
  },
  required: {
    color: COLORS.danger,
  },
  inputWrapper: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    position: 'relative',
  },
  inputIcon: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.body,
    color: COLORS.dark,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  multilineInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  characterCount: {
    position: 'absolute',
    bottom: SPACING.xs,
    right: SPACING.sm,
    fontSize: TYPOGRAPHY.small,
    color: COLORS.gray,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  errorText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginLeft: SPACING.xs,
  },
  
  // Category Styles
  categoryContainer: {
    backgroundColor: COLORS.light,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.body,
    color: COLORS.gray,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  categoryHelp: {
    padding: SPACING.xs,
  },
  
  // Button Styles
  actionContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    minHeight: 52,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  disabledButton: {
    backgroundColor: COLORS.lightGray,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonIcon: {
    marginRight: SPACING.sm,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.gray,
  },
  disabledButtonText: {
    color: COLORS.gray,
  },
  resetButton: {
    flex: 0.4,
  },
  saveButton: {
    flex: 0.6,
  },
  
  // Info Section Styles
  infoSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 20,
  },
});

export default VendorProfile;