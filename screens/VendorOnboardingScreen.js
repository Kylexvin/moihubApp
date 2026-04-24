import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from './theme/Theme';

const { width } = Dimensions.get('window');
const { Colors, Typography, Spacing, BorderRadius, Components, Shadows, Gradients } = Theme;

const VendorOnboardingScreen = () => {
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // State for different categories
  const [categories, setCategories] = useState([]);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingServiceCategories, setLoadingServiceCategories] = useState(false);
  
  // Food Vendor Form State
  const [vendorForm, setVendorForm] = useState({
    shopName: '',
    phone: '',
    location: '',
  });
  
  // Shop Owner Form State
  const [shopOwnerForm, setShopOwnerForm] = useState({
    shopName: '',
    category: '',
    description: '',
    address: '',
    phoneNumber: '',
  });

  // Local Service Provider Form State
  const [serviceProviderForm, setServiceProviderForm] = useState({
    providerName: '',
    category: '',
    phoneNumber: '',
    areasOfOperation: '',
  });

  // 🔥 NEW: Dashboard choice state (moved to top level)
  const [wantsDashboard, setWantsDashboard] = useState(false);

  // Fetch categories based on selected role
  useEffect(() => {
    if (selectedRole === 'shop_owner') {
      fetchCategories();
    } else if (selectedRole === 'service_provider') {
      fetchServiceCategories();
    }
  }, [selectedRole]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await axios.get('/api/eshop/vendor/dropdown');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchServiceCategories = async () => {
    setLoadingServiceCategories(true);
    try {
      const response = await axios.get('/api/services/categories');
      if (response.data.categories) {
        setServiceCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching service categories:', error);
      Alert.alert('Error', 'Failed to load service categories');
    } finally {
      setLoadingServiceCategories(false);
    }
  };

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    // Reset dashboard choice when changing roles
    setWantsDashboard(false);
  };

  const handleVendorRegistration = async () => {
    if (!vendorForm.shopName || !vendorForm.phone || !vendorForm.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/food/vendors/register', {
        shopName: vendorForm.shopName,
        phone: vendorForm.phone,
        location: vendorForm.location,
      });

      Alert.alert(
        'Success!',
        'Vendor registration submitted for approval',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('EshopNavigator'),
          },
        ]
      );
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleShopOwnerApplication = async () => {
    if (!shopOwnerForm.shopName || !shopOwnerForm.category || !shopOwnerForm.address || !shopOwnerForm.phoneNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/eshop/vendor/apply', {
        shopName: shopOwnerForm.shopName,
        category: shopOwnerForm.category,
        description: shopOwnerForm.description,
        address: shopOwnerForm.address,
        phoneNumber: shopOwnerForm.phoneNumber,
      });

      Alert.alert(
        'Success!',
        'Shop owner application submitted successfully. Please wait for admin approval.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('FoodHome'),
          },
        ]
      );
    } catch (error) {
      const message = error.response?.data?.message || 'Application failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 UPDATED: Accept wantsDashboard parameter
  const handleServiceProviderApplication = async (dashboardChoice) => {
    if (!serviceProviderForm.providerName || !serviceProviderForm.category || !serviceProviderForm.phoneNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/services/application/apply', {
        providerName: serviceProviderForm.providerName,
        category: serviceProviderForm.category,
        phoneNumber: serviceProviderForm.phoneNumber,
        areasOfOperation: serviceProviderForm.areasOfOperation 
          ? serviceProviderForm.areasOfOperation.split(',').map(area => area.trim()).filter(area => area)
          : [],
        wantsDashboard: dashboardChoice // Send user's choice
      });

      const message = dashboardChoice 
        ? 'Application submitted! Awaiting admin approval for dashboard access.'
        : 'Service created successfully! Awaiting admin approval.';

      Alert.alert(
        'Success!',
        message,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Main');
            },
          },
        ]
      );
    } catch (error) {
      let errorMessage = 'Application failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg).join('\n');
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedRole(null);
    setWantsDashboard(false); // Reset dashboard choice
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const renderRoleSelection = () => (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="business" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Start Your Journey</Text>
          <Text style={styles.subtitle}>Choose how you want to grow your business with MoiHub</Text>
        </View>

        <View style={styles.roleContainer}>
          {/* Food Vendor Card */}
          <TouchableOpacity
            style={[
              Components.card,
              styles.roleCard,
              selectedRole === 'food_vendor' && styles.selectedCard,
            ]}
            onPress={() => handleRoleSelection('food_vendor')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={selectedRole === 'food_vendor' ? ['#ff7f5020', 'transparent'] : ['transparent', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={[styles.roleIconContainer, { backgroundColor: '#ff7f5020' }]}>
              <Text style={styles.roleIcon}>🍔</Text>
            </View>
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>Food Vendor</Text>
              <Text style={styles.roleDescription}>
                Sell food items, manage your menu, and accept orders online
              </Text>
              <View style={styles.roleFeatures}>
                <View style={styles.featurePill}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                  <Text style={styles.featurePillText}>Menu Management</Text>
                </View>
                <View style={styles.featurePill}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                  <Text style={styles.featurePillText}>Order Tracking</Text>
                </View>
              </View>
            </View>
            {selectedRole === 'food_vendor' && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              </View>
            )}
          </TouchableOpacity>

          {/* Shop Owner Card */}
          <TouchableOpacity
            style={[
              Components.card,
              styles.roleCard,
              selectedRole === 'shop_owner' && styles.selectedCard,
            ]}
            onPress={() => handleRoleSelection('shop_owner')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={selectedRole === 'shop_owner' ? ['#50c87820', 'transparent'] : ['transparent', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={[styles.roleIconContainer, { backgroundColor: '#50c87820' }]}>
              <Text style={styles.roleIcon}>🏪</Text>
            </View>
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>Shop Owner</Text>
              <Text style={styles.roleDescription}>
                List your products, manage inventory, and reach more customers
              </Text>
              <View style={styles.roleFeatures}>
                <View style={styles.featurePill}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                  <Text style={styles.featurePillText}>Product Listings</Text>
                </View>
                <View style={styles.featurePill}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                  <Text style={styles.featurePillText}>Inventory</Text>
                </View>
              </View>
            </View>
            {selectedRole === 'shop_owner' && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              </View>
            )}
          </TouchableOpacity>

          {/* Service Provider Card */}
          <TouchableOpacity
            style={[
              Components.card,
              styles.roleCard,
              selectedRole === 'service_provider' && styles.selectedCard,
            ]}
            onPress={() => handleRoleSelection('service_provider')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={selectedRole === 'service_provider' ? ['#9370db20', 'transparent'] : ['transparent', 'transparent']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={[styles.roleIconContainer, { backgroundColor: '#9370db20' }]}>
              <Text style={styles.roleIcon}>💈</Text>
            </View>
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>Service Provider</Text>
              <Text style={styles.roleDescription}>
                Offer services on MoiHub
              </Text>
              <View style={styles.roleFeatures}>
                <View style={styles.featurePill}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                  <Text style={styles.featurePillText}>Basic Listing</Text>
                </View>
                <View style={styles.featurePill}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                  <Text style={styles.featurePillText}>Dashboard Option</Text>
                </View>
              </View>
            </View>
            {selectedRole === 'service_provider' && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {selectedRole && (
          <TouchableOpacity
            style={[Components.buttonPrimary, styles.continueButton]}
            onPress={() => setSelectedRole(selectedRole)}
            activeOpacity={0.8}
          >
            <Text style={Components.buttonTextPrimary}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.black} style={styles.buttonIcon} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  const renderFoodVendorForm = () => (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formScrollContent}
        >
          <View style={styles.formTitleContainer}>
            <View style={[styles.formIconCircle, { backgroundColor: '#ff7f5020' }]}>
              <Text style={styles.formIcon}>🍔</Text>
            </View>
            <Text style={styles.formTitle}>Food Vendor Registration</Text>
            <Text style={styles.formSubtitle}>Set up your food business on MoiHub</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Shop Name <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="restaurant-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Campus Bites, Student Café"
                  placeholderTextColor={Colors.textTertiary}
                  value={vendorForm.shopName}
                  onChangeText={(text) => setVendorForm({ ...vendorForm, shopName: text })}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 0712345678"
                  placeholderTextColor={Colors.textTertiary}
                  value={vendorForm.phone}
                  onChangeText={(text) => setVendorForm({ ...vendorForm, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Location <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="location-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Main Campus, West Side"
                  placeholderTextColor={Colors.textTertiary}
                  value={vendorForm.location}
                  onChangeText={(text) => setVendorForm({ ...vendorForm, location: text })}
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                Your application will be reviewed by our team. You'll receive a notification once approved.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.formFooter}>
          <TouchableOpacity
            style={[Components.buttonPrimary, styles.submitButton, loading && styles.disabledButton]}
            onPress={handleVendorRegistration}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.black} />
            ) : (
              <>
                <Text style={Components.buttonTextPrimary}>Register Business</Text>
                <Ionicons name="checkmark-circle" size={20} color={Colors.black} style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  const renderShopOwnerForm = () => (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formScrollContent}
        >
          <View style={styles.formTitleContainer}>
            <View style={[styles.formIconCircle, { backgroundColor: '#50c87820' }]}>
              <Text style={styles.formIcon}>🏪</Text>
            </View>
            <Text style={styles.formTitle}>Shop Owner Application</Text>
            <Text style={styles.formSubtitle}>List your retail business on MoiHub</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Shop Name <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="storefront-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Campus Mart, Student Store"
                  placeholderTextColor={Colors.textTertiary}
                  value={shopOwnerForm.shopName}
                  onChangeText={(text) => setShopOwnerForm({ ...shopOwnerForm, shopName: text })}
                />
              </View>
            </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Business Category <Text style={styles.requiredStar}>*</Text></Text>
            <Text style={styles.inputHint}>Select the category that best describes your business</Text>
            
            {loadingCategories ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading categories...</Text>
              </View>
            ) : (
              <View style={styles.categoriesContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat._id}
                    style={[
                      styles.categoryChip,
                      shopOwnerForm.category === cat.name && styles.categoryChipSelected
                    ]}
                    onPress={() => setShopOwnerForm({ ...shopOwnerForm, category: cat.name })}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      shopOwnerForm.category === cat.name && styles.categoryChipTextSelected
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {shopOwnerForm.category ? (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={styles.selectedText}>Selected: {shopOwnerForm.category}</Text>
              </View>
            ) : (
              <Text style={styles.selectHint}>Tap a category above to select it</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number <Text style={styles.requiredStar}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., 0712345678"
                placeholderTextColor={Colors.textTertiary}
                value={shopOwnerForm.phoneNumber}
                onChangeText={(text) => setShopOwnerForm({ ...shopOwnerForm, phoneNumber: text })}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address <Text style={styles.requiredStar}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Room 12, KDB House"
                placeholderTextColor={Colors.textTertiary}
                value={shopOwnerForm.address}
                onChangeText={(text) => setShopOwnerForm({ ...shopOwnerForm, address: text })}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief description of your business (optional)"
                placeholderTextColor={Colors.textTertiary}
                value={shopOwnerForm.description}
                onChangeText={(text) => setShopOwnerForm({ ...shopOwnerForm, description: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Your application will be reviewed by our team. Once approved, you can start listing products.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.formFooter}>
        <TouchableOpacity
          style={[Components.buttonPrimary, styles.submitButton, loading && styles.disabledButton]}
          onPress={handleShopOwnerApplication}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={Colors.black} />
          ) : (
            <>
              <Text style={Components.buttonTextPrimary}>Submit Application</Text>
              <Ionicons name="checkmark-circle" size={20} color={Colors.black} style={styles.buttonIcon} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

  const renderServiceProviderForm = () => (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formScrollContent}
        >
          <View style={styles.formTitleContainer}>
            <View style={[styles.formIconCircle, { backgroundColor: '#9370db20' }]}>
              <Text style={styles.formIcon}>💈</Text>
            </View>
            <Text style={styles.formTitle}>Service Provider Application</Text>
            <Text style={styles.formSubtitle}>Offer local services on MoiHub</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Business Name <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="business-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Campus Cuts, Student Spa"
                  placeholderTextColor={Colors.textTertiary}
                  value={serviceProviderForm.providerName}
                  onChangeText={(text) => setServiceProviderForm({ ...serviceProviderForm, providerName: text })}
                />
              </View>
            </View>

            {/* Service Type Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Service Type <Text style={styles.requiredStar}>*</Text></Text>
              <Text style={styles.inputHint}>Choose the type of service you provide</Text>
              
              {loadingServiceCategories ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading service categories...</Text>
                </View>
              ) : (
                <View style={styles.categoriesContainer}>
                  {serviceCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat._id}
                      style={[
                        styles.categoryChip,
                        serviceProviderForm.category === cat._id && styles.categoryChipSelected
                      ]}
                      onPress={() => setServiceProviderForm({ 
                        ...serviceProviderForm, 
                        category: cat._id 
                      })}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        serviceProviderForm.category === cat._id && styles.categoryChipTextSelected
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {serviceProviderForm.category && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                  <Text style={styles.selectedText}>
                    Selected: {serviceCategories.find(c => c._id === serviceProviderForm.category)?.name}
                  </Text>
                </View>
              )}
            </View>

            {/* Dashboard Choice Checkbox - using top-level state */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[styles.checkbox, wantsDashboard && styles.checkboxChecked]}
                onPress={() => setWantsDashboard(!wantsDashboard)}
                activeOpacity={0.7}
              >
                {wantsDashboard && (
                  <Ionicons name="checkmark" size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
              <View style={styles.checkboxTextContainer}>
                <Text style={styles.checkboxLabel}>Enable business dashboard</Text>
                <Text style={styles.checkboxSubLabel}>
                  Manage bookings, track customers, and grow your business
                </Text>
                <View style={styles.checkboxPill}>
                  <Ionicons name="speedometer" size={14} color={Colors.primary} />
                  <Text style={styles.checkboxPillText}>Paid feature • Admin approval required</Text>
                </View>
              </View>
            </View>

            {/* Dashboard Info Box - Shows when dashboard is selected */}
            {wantsDashboard && (
              <View style={styles.dashboardInfoBox}>
                <Ionicons name="information-circle" size={20} color={Colors.primary} />
                <Text style={styles.dashboardInfoText}>
                  Your application will be reviewed by admin. Once approved, you'll get access to:
                </Text>
                <View style={styles.dashboardFeatures}>
                  <View style={styles.dashboardFeature}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                    <Text style={styles.dashboardFeatureText}>Booking management</Text>
                  </View>
                  <View style={styles.dashboardFeature}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                    <Text style={styles.dashboardFeatureText}>Customer tracking</Text>
                  </View>
                  <View style={styles.dashboardFeature}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                    <Text style={styles.dashboardFeatureText}>Analytics dashboard</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number <Text style={styles.requiredStar}>*</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 0712345678"
                  placeholderTextColor={Colors.textTertiary}
                  value={serviceProviderForm.phoneNumber}
                  onChangeText={(text) => setServiceProviderForm({ ...serviceProviderForm, phoneNumber: text })}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Areas of Operation</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="map-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g., Main Campus, West Side, Town (comma separated)"
                  placeholderTextColor={Colors.textTertiary}
                  value={serviceProviderForm.areasOfOperation}
                  onChangeText={(text) => setServiceProviderForm({ ...serviceProviderForm, areasOfOperation: text })}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
              <Text style={styles.helperText}>Leave empty if you serve anywhere</Text>
            </View>

            {/* Info Box - Changes based on dashboard choice */}
            <View style={[styles.infoBox, wantsDashboard && styles.infoBoxDashboard]}>
              <Ionicons 
                name={wantsDashboard ? "bulb-outline" : "information-circle"} 
                size={20} 
                color={wantsDashboard ? Colors.warning : Colors.primary} 
              />
              <Text style={styles.infoText}>
                {wantsDashboard 
                  ? 'Dashboard applications require admin approval. You\'ll be notified once approved.'
                  : 'Your basic listing will be live immediately after submission.'}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.formFooter}>
          <TouchableOpacity
            style={[Components.buttonPrimary, styles.submitButton, loading && styles.disabledButton]}
            onPress={() => handleServiceProviderApplication(wantsDashboard)}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.black} />
            ) : (
              <>
                <Text style={Components.buttonTextPrimary}>
                  {wantsDashboard ? 'Submit for Approval' : 'Create Basic Listing'}
                </Text>
                <Ionicons name="checkmark-circle" size={20} color={Colors.black} style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // Main render logic
  if (!selectedRole) {
    return renderRoleSelection();
  } else if (selectedRole === 'food_vendor') {
    return renderFoodVendorForm();
  } else if (selectedRole === 'shop_owner') {
    return renderShopOwnerForm();
  } else {
    return renderServiceProviderForm();
  }
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  backButton: {
    padding: Spacing.xs,
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 0,
    paddingBottom: Spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  title: {
    ...Typography.h1,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  roleContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  roleCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  roleIcon: {
    fontSize: 30,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    ...Typography.h3,
    fontSize: 18,
    marginBottom: 4,
  },
  roleDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  roleFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 4,
  },
  featurePillText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  selectedBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  continueButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginLeft: Spacing.sm,
  },
  
  // Form Styles
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  formScrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
  },
  formTitleContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  formIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  formIcon: {
    fontSize: 35,
  },
  formTitle: {
    ...Typography.h2,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    ...Components.card,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    color: Colors.text,
  },
  requiredStar: {
    color: Colors.danger,
  },
  inputHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.sm,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.sm,
  },
  pickerIcon: {
    marginRight: Spacing.sm,
  },
  loadingContainer: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  categoryChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.small,
  },
  categoryChipSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  categoryChipText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  selectedText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  selectHint: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  helperText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 4,
    marginLeft: Spacing.xs,
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  infoBoxDashboard: {
    borderLeftColor: Colors.warning,
    backgroundColor: Colors.warning + '10',
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  categoryInfoBox: {
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  categoryInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryInfoTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.primary,
  },
  categoryInfoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  featureTagText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  formFooter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  
  // New styles for dashboard checkbox
  checkboxContainer: {
    flexDirection: 'row',
    marginVertical: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary + '20',
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  checkboxSubLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  checkboxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.round,
    alignSelf: 'flex-start',
    gap: 4,
  },
  checkboxPillText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  dashboardInfoBox: {
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  dashboardInfoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  dashboardFeatures: {
    gap: Spacing.xs,
  },
  dashboardFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dashboardFeatureText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});

// Picker select styles
const pickerSelectStyles = {
  inputIOS: {
    ...Typography.body,
    color: Colors.text,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 0,
    paddingHorizontal: 0,
    minHeight: 50,
    backgroundColor: 'transparent',
  },
  inputAndroid: {
    ...Typography.body,
    color: Colors.text,
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 50,
    backgroundColor: 'transparent',
  },
  placeholder: {
    color: Colors.textTertiary,
    ...Typography.body,
  },
  iconContainer: {
    top: 15,
    right: 15,
  },
};

export default VendorOnboardingScreen;  
