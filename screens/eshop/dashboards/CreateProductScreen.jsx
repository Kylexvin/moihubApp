import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Modal,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import Theme from '../../theme/Theme';

const CreateProductScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Category states - DYNAMIC ONLY
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
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
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        if (errors.image) {
          setErrors(prev => ({ ...prev, image: '' }));
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      setAddingCategory(true);
      const response = await axios.post('/api/eshop/vendor/my-categories', {
        name: newCategoryName.trim()
      });

      if (response.data.success) {
        setCategories(prev => [...prev, response.data.data]);
        handleInputChange('category', response.data.data._id);
        setNewCategoryName('');
        setShowAddCategory(false);
        Alert.alert('Success', 'Category added successfully');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to add category'
      );
    } finally {
      setAddingCategory(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Please enter a valid price';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!image) {
      newErrors.image = 'Product image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('price', parseFloat(formData.price).toString());
      formDataToSend.append('category', formData.category);
      
      formDataToSend.append('image', {
        uri: image.uri,
        type: image.mimeType || 'image/jpeg',
        name: image.fileName || `product-${Date.now()}.jpg`
      });

      const response = await axios.post('/api/eshop/vendor/product/create', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Product created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setFormData({
                  name: '',
                  description: '',
                  price: '',
                  category: '',
                });
                setImage(null);
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        throw new Error(response.data.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      
      let errorMessage = 'Failed to create product';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 400:
            errorMessage = data.message || 'Invalid product data';
            break;
          case 401:
            errorMessage = 'Session expired. Please log in again.';
            break;
          case 403:
            errorMessage = 'You are not authorized to create products';
            break;
          case 413:
            errorMessage = 'Image file is too large';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = data.message || 'An unexpected error occurred';
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={Theme.Gradients.dark} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Theme.Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Product</Text>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.form}>
            {/* Image Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Image *</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={40} color={Theme.Colors.textTertiary} />
                    <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
                  </View>
                )}
              </TouchableOpacity>
              {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
            </View>

            {/* Product Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                placeholder="Enter product name"
                placeholderTextColor={Theme.Colors.textTertiary}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.textArea, errors.description && styles.inputError]}
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Enter product description"
                placeholderTextColor={Theme.Colors.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>

            {/* Price */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price (KSh) *</Text>
              <TextInput
                style={[styles.input, errors.price && styles.inputError]}
                value={formData.price}
                onChangeText={(text) => handleInputChange('price', text)}
                placeholder="0.00"
                placeholderTextColor={Theme.Colors.textTertiary}
                keyboardType="numeric"
              />
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            </View>

            {/* Category - DYNAMIC ONLY */}
            <View style={styles.inputGroup}>
              <View style={styles.categoryHeader}>
                <Text style={styles.label}>Category *</Text>
                <TouchableOpacity 
                  style={styles.addCategoryButton}
                  onPress={() => setShowAddCategory(true)}
                >
                  <Ionicons name="add-circle" size={24} color={Theme.Colors.primary} />
                  <Text style={styles.addCategoryText}>New</Text>
                </TouchableOpacity>
              </View>

              {loadingCategories ? (
                <ActivityIndicator size="small" color={Theme.Colors.primary} />
              ) : categories.length === 0 ? (
                <TouchableOpacity 
                  style={styles.emptyCategories}
                  onPress={() => setShowAddCategory(true)}
                >
                  <Ionicons name="folder-open" size={40} color={Theme.Colors.textTertiary} />
                  <Text style={styles.emptyCategoriesText}>No categories yet</Text>
                  <Text style={styles.emptyCategoriesSubText}>Tap "New" to create one</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.categoryContainer}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category._id}
                      style={[
                        styles.categoryChip,
                        formData.category === category._id && styles.categoryChipSelected
                      ]}
                      onPress={() => handleInputChange('category', category._id)}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        formData.category === category._id && styles.categoryChipTextSelected
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>
            
            {/* Add extra bottom padding to ensure content scrolls above tab bar */}
            <View style={styles.bottomSpacer} />
          </View>
        </ScrollView>

        {/* Submit Button - Fixed at bottom with tab bar height accounted for */}
        <SafeAreaView style={styles.footerContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Theme.Colors.primary, Theme.Colors.primaryDark]}
              style={styles.submitGradient}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={Theme.Colors.black} size="small" />
                  <Text style={[styles.submitButtonText, { marginLeft: 10 }]}>
                    Creating...
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Create Product</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      {/* Add Category Modal */}
      <Modal
        visible={showAddCategory}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddCategory(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['rgba(0, 60, 50, 0.95)', 'rgba(13, 31, 26, 0.98)']}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Category</Text>
              <TouchableOpacity onPress={() => setShowAddCategory(false)}>
                <Ionicons name="close" size={24} color={Theme.Colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter category name"
              placeholderTextColor={Theme.Colors.textTertiary}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setNewCategoryName('');
                  setShowAddCategory(false);
                }}
                disabled={addingCategory}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalAddButton]}
                onPress={handleAddCategory}
                disabled={addingCategory}
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 100, 80, 0.2)',
    backgroundColor: 'rgba(0, 60, 50, 0.3)',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  form: {
    padding: 20,
  },
  bottomSpacer: {
    height: 80, // Extra space at bottom to ensure content scrolls above tab bar
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.Colors.text,
    marginBottom: 8,
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: 'rgba(0, 100, 80, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 60, 50, 0.3)',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: Theme.Colors.textTertiary,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.3)',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'rgba(0, 60, 50, 0.2)',
    color: Theme.Colors.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.3)',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'rgba(0, 60, 50, 0.2)',
    color: Theme.Colors.text,
    height: 100,
  },
  inputError: {
    borderColor: Theme.Colors.danger,
  },
  errorText: {
    color: Theme.Colors.danger,
    fontSize: 14,
    marginTop: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addCategoryText: {
    color: Theme.Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 60, 50, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.3)',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChipSelected: {
    backgroundColor: Theme.Colors.primary,
    borderColor: Theme.Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: Theme.Colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: Theme.Colors.black,
    fontWeight: '600',
  },
  emptyCategories: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 60, 50, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.3)',
    borderStyle: 'dashed',
  },
  emptyCategoriesText: {
    fontSize: 16,
    color: Theme.Colors.textSecondary,
    marginTop: 8,
  },
  emptyCategoriesSubText: {
    fontSize: 14,
    color: Theme.Colors.textTertiary,
    marginTop: 4,
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 80 : 70, // Extra padding to account for tab bar
    paddingTop: 10,
    backgroundColor: 'rgba(0, 60, 50, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 100, 80, 0.2)',
  },
  submitButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  submitGradient: {
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Theme.Colors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.Colors.text,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 100, 80, 0.3)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(0, 60, 50, 0.2)',
    color: Theme.Colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalCancelButton: {
    backgroundColor: 'rgba(0, 60, 50, 0.3)',
    padding: 12,
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
    padding: 12,
    alignItems: 'center',
  },
  modalAddButtonText: {
    color: Theme.Colors.black,
    fontWeight: '600',
  },
});

export default CreateProductScreen;