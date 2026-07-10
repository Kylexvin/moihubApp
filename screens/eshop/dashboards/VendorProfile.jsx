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
  Modal,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Theme from '../../theme/Theme';

const { width, height } = Dimensions.get('window');

// Constants using Theme
const COLORS = {
  primary: Theme.Colors.primary,
  primaryDark: Theme.Colors.primaryDark,
  secondary: Theme.Colors.warning,
  success: Theme.Colors.success,
  danger: Theme.Colors.danger,
  warning: Theme.Colors.warning,
  light: 'rgba(0, 60, 50, 0.1)',
  dark: Theme.Colors.background,
  gray: Theme.Colors.textTertiary,
  lightGray: 'rgba(0, 100, 80, 0.2)',
  white: Theme.Colors.white,
  shadow: 'rgba(0, 0, 0, 0.3)',
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
        <ActivityIndicator size="small" color={Theme.Colors.black} />
      ) : (
        <>
          {icon && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={variant === 'primary' ? Theme.Colors.black : COLORS.gray} 
              style={styles.buttonIcon}
            />
          )}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
});

// Shop Status Toggle Component
const ShopStatusToggle = React.memo(({ isActive, onToggle, loading }) => {
  const [isEnabled, setIsEnabled] = useState(isActive);

  useEffect(() => {
    setIsEnabled(isActive);
  }, [isActive]);

  const handleToggle = useCallback(async () => {
    try {
      await onToggle(!isEnabled);
      setIsEnabled(!isEnabled);
    } catch (error) {
      setIsEnabled(isEnabled);
    }
  }, [isEnabled, onToggle]);

  return (
    <LinearGradient
      colors={['rgba(0, 100, 80, 0.15)', 'rgba(0, 60, 50, 0.2)']}
      style={styles.statusToggleContainer}
    >
      <View style={styles.statusToggleHeader}>
        <Ionicons 
          name={isEnabled ? "checkmark-circle" : "close-circle"} 
          size={24} 
          color={isEnabled ? COLORS.success : COLORS.danger} 
        />
        <Text style={styles.statusToggleTitle}>Shop Status</Text>
      </View>
      
      <View style={styles.statusToggleContent}>
        <View style={styles.statusTextContainer}>
          <Text style={styles.statusLabel}>
            {isEnabled ? 'Shop is OPEN' : 'Shop is CLOSED'}
          </Text>
          <Text style={styles.statusDescription}>
            {isEnabled 
              ? 'Accepting new orders from customers' 
              : 'Not accepting new orders - customers cannot place orders'
            }
          </Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isEnabled ? styles.toggleButtonActive : styles.toggleButtonInactive,
            loading && styles.toggleButtonDisabled
          ]}
          onPress={handleToggle}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator 
              size="small" 
              color={isEnabled ? COLORS.success : COLORS.danger} 
            />
          ) : (
            <Text style={[
              styles.toggleButtonText,
              isEnabled ? styles.toggleButtonTextActive : styles.toggleButtonTextInactive
            ]}>
              {isEnabled ? 'OPEN' : 'CLOSED'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
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
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [originalProfile, setOriginalProfile] = useState({});
  
  // Category States
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  
  const { errors, validateField, validateForm, setErrors } = useFormValidation(profile);

  // Memoized handlers
  const handleFieldChange = useCallback((field) => (text) => {
    setProfile(prev => ({ ...prev, [field]: text }));
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
      const response = await axios.get('/api/eshop/vendor/dashboard');
      
      if (response.data.success && response.data.data.shop) {
        const shop = response.data.data.shop;
        const profileData = {
          shopName: shop.shopName || '',
          description: shop.description || '',
          address: shop.address || '',
          phoneNumber: shop.phoneNumber || '',
          category: shop.category?.name || '',
          isActive: shop.isActive || false,
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

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const response = await axios.get('/api/eshop/vendor/my-categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const handleToggleShopStatus = useCallback(async (newStatus) => {
    try {
      setTogglingStatus(true);
      const response = await axios.patch('/api/eshop/vendor/toggle-shop-status');
      
      if (response.data.success) {
        setProfile(prev => ({ ...prev, isActive: response.data.data.isActive }));
        Alert.alert('Success', response.data.message);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update shop status.');
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error toggling shop status:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update shop status. Please try again.'
      );
      throw error;
    } finally {
      setTogglingStatus(false);
    }
  }, []);

  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      setAddingCategory(true);
      const response = await axios.post(
        '/api/eshop/vendor/my-categories',
        { name: newCategoryName.trim() }
      );

      if (response.data.success) {
        setCategories(prev => [...prev, response.data.data]);
        setNewCategoryName('');
        setShowCategoryModal(false);
        Alert.alert('Success', 'Category added successfully!');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add category');
    } finally {
      setAddingCategory(false);
    }
  }, [newCategoryName]);

  const handleDeleteCategory = useCallback(async (categoryId, categoryName) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"? This will remove it from all products.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingCategory(categoryId);
              await axios.delete(
                `/api/eshop/vendor/my-categories/${categoryId}`
              );
              setCategories(prev => prev.filter(c => c._id !== categoryId));
              Alert.alert('Success', 'Category deleted successfully');
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete category');
            } finally {
              setDeletingCategory(null);
            }
          }
        }
      ]
    );
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchCategories();
  }, [fetchProfile, fetchCategories]);

  const handleUpdateProfile = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.put('/api/eshop/vendor/profile', {
        shopName: profile.shopName.trim(),
        description: profile.description.trim(),
        address: profile.address.trim(),
        phoneNumber: profile.phoneNumber.trim(),
      });

      if (response.data.success) {
        setOriginalProfile(profile);
        setErrors({});
        Alert.alert('Success', 'Profile updated successfully!');
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
      <LinearGradient colors={Theme.Gradients.dark} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Theme.Gradients.dark} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Theme.Colors.background} />
      
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
          <LinearGradient
            colors={['rgba(0, 200, 150, 0.2)', 'rgba(0, 100, 80, 0.1)']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Ionicons name="storefront" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.headerTitle}>Shop Profile</Text>
              <Text style={styles.headerSubtitle}>
                Manage your shop information and settings
              </Text>
            </View>
          </LinearGradient>

          {/* Shop Status Toggle Card */}
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={['rgba(0, 100, 80, 0.2)', 'rgba(0, 60, 50, 0.3)']}
              style={styles.card}
            >
              <ShopStatusToggle 
                isActive={profile.isActive}
                onToggle={handleToggleShopStatus}
                loading={togglingStatus}
              />
            </LinearGradient>
          </View>

          {/* Form Card */}
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={['rgba(0, 100, 80, 0.2)', 'rgba(0, 60, 50, 0.3)']}
              style={styles.card}
            >
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
            </LinearGradient>
          </View>

          {/* Category Management Card */}
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={['rgba(0, 100, 80, 0.2)', 'rgba(0, 60, 50, 0.3)']}
              style={styles.card}
            >
              <View style={styles.categoryManagementHeader}>
                <Text style={styles.cardTitle}>Category Management</Text>
                <TouchableOpacity 
                  style={styles.addCategoryButton}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                  <Text style={styles.addCategoryText}>Add New</Text>
                </TouchableOpacity>
              </View>

              {loadingCategories ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : categories.length === 0 ? (
                <View style={styles.emptyCategories}>
                  <Ionicons name="pricetag-outline" size={40} color={COLORS.gray} />
                  <Text style={styles.emptyCategoriesText}>No categories yet</Text>
                  <Text style={styles.emptyCategoriesSubtext}>
                    Create categories to organize your products
                  </Text>
                </View>
              ) : (
                <View style={styles.categoriesList}>
                  {categories.map((category) => (
                    <View key={category._id} style={styles.categoryItem}>
                      <View style={styles.categoryItemContent}>
                        <Ionicons name="pricetag" size={20} color={COLORS.secondary} />
                        <Text style={styles.categoryItemName}>{category.name}</Text>
                        <Text style={styles.categoryItemCount}>
                          {category.productCount || 0} products
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteCategoryButton}
                        onPress={() => handleDeleteCategory(category._id, category.name)}
                        disabled={deletingCategory === category._id}
                      >
                        {deletingCategory === category._id ? (
                          <ActivityIndicator size="small" color={COLORS.danger} />
                        ) : (
                          <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </LinearGradient>
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
            <LinearGradient
              colors={['rgba(0, 100, 80, 0.15)', 'rgba(0, 60, 50, 0.2)']}
              style={styles.infoCard}
            >
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
                <Ionicons name="pause-circle" size={20} color={COLORS.danger} />
                <Text style={styles.infoText}>
                  When shop is closed, customers cannot place orders
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
                <Text style={styles.infoText}>
                  Your information is secure and encrypted
                </Text>
              </View>
            </LinearGradient>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['rgba(0, 60, 50, 0.95)', 'rgba(13, 31, 26, 0.98)']}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={Theme.Colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter category name (e.g., Hair, Wigs, Nails)"
              placeholderTextColor={COLORS.gray}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
              maxLength={30}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setNewCategoryName('');
                  setShowCategoryModal(false);
                }}
                disabled={addingCategory}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalAddButton]}
                onPress={handleAddCategory}
                disabled={addingCategory || !newCategoryName.trim()}
              >
                <LinearGradient
                  colors={[Theme.Colors.primary, Theme.Colors.primaryDark]}
                  style={styles.modalAddGradient}
                >
                  {addingCategory ? (
                    <ActivityIndicator color={Theme.Colors.black} size="small" />
                  ) : (
                    <Text style={styles.modalAddButtonText}>Add Category</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.body,
    color: Theme.Colors.textSecondary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: SPACING.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 100, 80, 0.2)',
  },
  headerContent: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 200, 150, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.h1,
    fontWeight: 'bold',
    color: Theme.Colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.body,
    color: Theme.Colors.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  
  // Toggle Styles
  statusToggleContainer: {
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.2)',
  },
  statusToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusToggleTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: 'bold',
    color: Theme.Colors.text,
    marginLeft: SPACING.sm,
  },
  statusToggleContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTextContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '600',
    color: Theme.Colors.text,
  },
  statusDescription: {
    fontSize: TYPOGRAPHY.small,
    color: Theme.Colors.textSecondary,
    marginTop: SPACING.xs,
  },
  toggleButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderColor: COLORS.success,
  },
  toggleButtonInactive: {
    backgroundColor: 'rgba(239, 83, 80, 0.15)',
    borderColor: COLORS.danger,
  },
  toggleButtonDisabled: {
    opacity: 0.6,
  },
  toggleButtonText: {
    fontSize: TYPOGRAPHY.caption,
    fontWeight: 'bold',
  },
  toggleButtonTextActive: {
    color: COLORS.success,
  },
  toggleButtonTextInactive: {
    color: COLORS.danger,
  },
  
  // Card Styles
  cardContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  card: {
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.2)',
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.h3,
    fontWeight: 'bold',
    color: Theme.Colors.text,
    marginBottom: SPACING.lg,
  },
  
  // Input Styles
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '600',
    color: Theme.Colors.text,
    marginBottom: SPACING.sm,
  },
  inputLabelError: {
    color: COLORS.danger,
  },
  required: {
    color: COLORS.danger,
  },
  inputWrapper: {
    backgroundColor: 'rgba(0, 60, 50, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(0, 100, 80, 0.3)',
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
    color: Theme.Colors.text,
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
    color: Theme.Colors.textTertiary,
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
    backgroundColor: 'rgba(0, 60, 50, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(0, 100, 80, 0.3)',
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
    color: Theme.Colors.textSecondary,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  categoryHelp: {
    padding: SPACING.xs,
  },
  
  // Category Management Styles
  categoryManagementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 200, 150, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  addCategoryText: {
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  emptyCategories: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyCategoriesText: {
    fontSize: TYPOGRAPHY.body,
    fontWeight: '600',
    color: Theme.Colors.text,
    marginTop: SPACING.md,
  },
  emptyCategoriesSubtext: {
    fontSize: TYPOGRAPHY.caption,
    color: Theme.Colors.textSecondary,
    marginTop: SPACING.xs,
  },
  categoriesList: {
    marginTop: SPACING.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 100, 80, 0.15)',
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryItemName: {
    fontSize: TYPOGRAPHY.body,
    color: Theme.Colors.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  categoryItemCount: {
    fontSize: TYPOGRAPHY.small,
    color: Theme.Colors.textSecondary,
    marginLeft: SPACING.md,
  },
  deleteCategoryButton: {
    padding: SPACING.sm,
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
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: 'rgba(0, 60, 50, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(0, 100, 80, 0.3)',
  },
  disabledButton: {
    backgroundColor: 'rgba(0, 60, 50, 0.2)',
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
    color: Theme.Colors.black,
  },
  secondaryButtonText: {
    color: Theme.Colors.textSecondary,
  },
  disabledButtonText: {
    color: Theme.Colors.textTertiary,
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
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.2)',
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: 'bold',
    color: Theme.Colors.text,
    marginBottom: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.caption,
    color: Theme.Colors.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
    lineHeight: 20,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: SPACING.lg,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.h4,
    fontWeight: 'bold',
    color: Theme.Colors.text,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: 'rgba(0, 100, 80, 0.3)',
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.body,
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(0, 60, 50, 0.2)',
    color: Theme.Colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalCancelButton: {
    backgroundColor: 'rgba(0, 60, 50, 0.3)',
    padding: SPACING.md,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: Theme.Colors.textSecondary,
    fontWeight: '600',
  },
  modalAddButton: {
    flex: 1,
    overflow: 'hidden',
  },
  modalAddGradient: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  modalAddButtonText: {
    color: Theme.Colors.black,
    fontWeight: '600',
  },
});

export default VendorProfile;