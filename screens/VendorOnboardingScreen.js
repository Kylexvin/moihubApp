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
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import RNPickerSelect from 'react-native-picker-select';

const VendorOnboardingScreen = () => {
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
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

  // Fetch categories when shop owner is selected
  useEffect(() => {
    if (selectedRole === 'shop_owner') {
      fetchCategories();
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

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
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

  const renderRoleSelection = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Business Type</Text>
      <Text style={styles.subtitle}>Select how you want to start your business journey</Text>

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'food_vendor' && styles.selectedCard,
          ]}
          onPress={() => handleRoleSelection('food_vendor')}
        >
          <Text style={styles.roleIcon}>🍔</Text>
          <Text style={styles.roleTitle}>Food Vendor</Text>
          <Text style={styles.roleDescription}>
            Sell food items and manage your food business
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleCard,
            selectedRole === 'shop_owner' && styles.selectedCard,
          ]}
          onPress={() => handleRoleSelection('shop_owner')}
        >
          <Text style={styles.roleIcon}>🏪</Text>
          <Text style={styles.roleTitle}>Shop Owner</Text>
          <Text style={styles.roleDescription}>
            Own and manage your retail shop or store
          </Text>
        </TouchableOpacity>
      </View>

      {selectedRole && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => setSelectedRole(selectedRole)}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFoodVendorForm = () => (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.formTitle}>🍔 Food Vendor Registration</Text>
        <Text style={styles.formSubtitle}>Let's set up your food business</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Shop Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your shop name"  placeholderTextColor="#d8861aff"
            value={vendorForm.shopName}
            onChangeText={(text) => setVendorForm({ ...vendorForm, shopName: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number" placeholderTextColor="#d8861aff"
            value={vendorForm.phone}
            onChangeText={(text) => setVendorForm({ ...vendorForm, phone: text })}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Location *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your business location"  placeholderTextColor="#d8861aff"
            value={vendorForm.location}
            onChangeText={(text) => setVendorForm({ ...vendorForm, location: text })}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedRole(null)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleVendorRegistration}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Register</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderShopOwnerForm = () => (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.formTitle}>🏪 Shop Owner Application</Text>
        <Text style={styles.formSubtitle}>Tell us about your retail business</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Shop Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your shop name"  placeholderTextColor="#d8861aff"
            value={shopOwnerForm.shopName}
            onChangeText={(text) => setShopOwnerForm({ ...shopOwnerForm, shopName: text })}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Category *</Text>
          {loadingCategories ? (
            <View style={[styles.input, styles.loadingContainer]}>
              <ActivityIndicator size="small" color="#db820eff" />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : (
                <View style={styles.dropdownContainer}>
      <RNPickerSelect
        onValueChange={(value) => setShopOwnerForm({ ...shopOwnerForm, category: value })}
        items={categories.map(cat => ({
          label: cat.name,
          value: cat.name, // CHANGED: from cat._id to cat.name
          key: cat._id,
        }))}
        value={shopOwnerForm.category}
        placeholder={{
          label: 'Select a category...',
          value: null,
          color: '#d8b20bff',
        }}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={false}
      />
    </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"  placeholderTextColor="#d8861aff"
            value={shopOwnerForm.phoneNumber}
            onChangeText={(text) => setShopOwnerForm({ ...shopOwnerForm, phoneNumber: text })}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your shop address"  placeholderTextColor="#d8861aff"
            value={shopOwnerForm.address}
            onChangeText={(text) => setShopOwnerForm({ ...shopOwnerForm, address: text })}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Brief description of your business"  placeholderTextColor="#d8861aff"
            value={shopOwnerForm.description}
            onChangeText={(text) => setShopOwnerForm({ ...shopOwnerForm, description: text })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedRole(null)}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleShopOwnerApplication}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Apply</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // Main render logic
  if (!selectedRole) {
    return renderRoleSelection();
  } else if (selectedRole === 'food_vendor') {
    return renderFoodVendorForm();
  } else {
    return renderShopOwnerForm();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: 40,
  },
  roleContainer: {
    gap: 20,
    marginBottom: 40,
  },
  roleCard: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#3498db',
    backgroundColor: '#ebf3fd',
  },
  roleIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
    marginBottom: 40,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  // Dropdown specific styles
  dropdownContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 16,
  },
});

// Picker select styles
const pickerSelectStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 0,
    borderRadius: 10,
    color: '#2c3e50',
    paddingRight: 30,
    backgroundColor: 'transparent',
    minHeight: 50,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 0,
    borderRadius: 10,
    color: '#2c3e50',
    paddingRight: 30,
    backgroundColor: 'transparent',
    minHeight: 50,
  },
  placeholder: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  iconContainer: {
    top: 15,
    right: 15,
  },
};

export default VendorOnboardingScreen;