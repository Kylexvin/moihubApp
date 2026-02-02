// screens/localservices/dashboard/ProductManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Theme from '../../theme/Theme';

const { Colors, Typography, Spacing, BorderRadius, Shadows } = Theme;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ProductManagement = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    currency: 'KES',
    image: null, // This will hold the image URI
    imageAsset: null, // This will hold the full image asset object
    isActive: true
  });

  // Bottom navigation height
  const BOTTOM_NAV_HEIGHT = 70;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/services/dashboard/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Fetch products error:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchProducts();
  };

  const handleAddProduct = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetForm();
    setShowAddModal(true);
  };

  const handleEditProduct = (product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '0',
      currency: product.currency || 'KES',
      image: product.image || null,
      imageAsset: null,
      isActive: product.isActive ?? true
    });
    setShowEditModal(true);
  };

  const handleDeleteProduct = (product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      currency: 'KES',
      image: null,
      imageAsset: null,
      isActive: true
    });
    setSelectedProduct(null);
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ 
          ...prev, 
          image: result.assets[0].uri,
          imageAsset: result.assets[0]
        }));
        setShowImagePicker(false);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ 
          ...prev, 
          image: result.assets[0].uri,
          imageAsset: result.assets[0]
        }));
        setShowImagePicker(false);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const createFormData = (data, imageAsset) => {
    const formData = new FormData();
    
    // Add text fields
    Object.keys(data).forEach(key => {
      if (key !== 'image' && key !== 'imageAsset') {
        formData.append(key, data[key]);
      }
    });
    
    // Add image if exists
    if (imageAsset) {
      const filename = imageAsset.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: imageAsset.uri,
        name: filename,
        type: type,
      });
    }
    
    return formData;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        currency: formData.currency,
        isActive: formData.isActive
      };

      let response;
      
      if (showEditModal && selectedProduct) {
        // Update existing product
        // First update product details
        response = await axios.put(
          `/api/services/dashboard/products/${selectedProduct._id}`,
          productData
        );
        
        // Then update image if new image was selected
        if (formData.imageAsset) {
          setUploadingImage(true);
          const imageFormData = createFormData({}, formData.imageAsset);
          await axios.put(
            `/api/services/dashboard/products/${selectedProduct._id}/image`,
            imageFormData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
        }
        
        if (response.data.message) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', 'Product updated successfully');
          
          // Update local state - refetch to get updated image URL
          fetchProducts();
          
          setShowEditModal(false);
          resetForm();
        }
      } else {
        // Create new product with image
        const formDataToSend = createFormData(productData, formData.imageAsset);
        
        response = await axios.post(
          '/api/services/dashboard/products',
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        if (response.data.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', 'Product created successfully');
          
          // Add to local state
          const newProduct = response.data.data;
          setProducts(prev => [newProduct, ...prev]);
          
          setShowAddModal(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  const removeProductImage = async () => {
    if (!selectedProduct) return;

    try {
      setUploadingImage(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await axios.delete(
        `/api/services/dashboard/products/${selectedProduct._id}/image`
      );
      
      if (response.data.message) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Product image removed successfully');
        
        // Update local state
        setFormData(prev => ({ ...prev, image: null, imageAsset: null }));
        setProducts(prev => prev.map(product => 
          product._id === selectedProduct._id 
            ? { ...product, image: null }
            : product
        ));
      }
    } catch (error) {
      console.error('Remove image error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove image');
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Product name is required');
      return false;
    }
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      Alert.alert('Validation Error', 'Valid price is required');
      return false;
    }
    if (!formData.stock || isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      Alert.alert('Validation Error', 'Valid stock quantity is required');
      return false;
    }
    return true;
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      setDeleting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const response = await axios.delete(
        `/api/services/dashboard/products/${selectedProduct._id}`
      );
      
      if (response.data.message) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Product deleted successfully');
        
        // Remove from local state
        setProducts(prev => prev.filter(product => product._id !== selectedProduct._id));
        
        setShowDeleteModal(false);
        setSelectedProduct(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount) => {
    return `KES ${amount?.toLocaleString() || '0'}`;
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: Colors.danger };
    if (stock <= 5) return { label: 'Low Stock', color: Colors.warning };
    return { label: 'In Stock', color: Colors.success };
  };

  const renderProductItem = ({ item }) => {
    const stockStatus = getStockStatus(item.stock);
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => handleEditProduct(item)}
        activeOpacity={0.7}
      >
        {/* Product Image */}
        <View style={styles.productImageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImage, styles.noImage]}>
              <Ionicons name="cube-outline" size={32} color={Colors.textSecondary} />
            </View>
          )}
          
          {/* Stock Status Badge */}
          <View style={[styles.stockBadge, { backgroundColor: stockStatus.color + '20' }]}>
            <Text style={[styles.stockText, { color: stockStatus.color }]}>
              {item.stock} in stock
            </Text>
          </View>
        </View>
        
        <View style={styles.productContent}>
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
            </View>
            <View style={styles.activeStatus}>
              <View style={[
                styles.activeDot, 
                { backgroundColor: item.isActive ? Colors.success : Colors.danger }
              ]} />
              <Text style={styles.activeText}>
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description || 'No description'}
          </Text>
          
          <View style={styles.productActions}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleEditProduct(item)}
            >
              <Ionicons name="create-outline" size={18} color={Colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteProduct(item)}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderImagePickerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showImagePicker}
      onRequestClose={() => setShowImagePicker(false)}
    >
      <View style={styles.imagePickerOverlay}>
        <View style={styles.imagePickerContainer}>
          <Text style={styles.imagePickerTitle}>Choose Image Source</Text>
          
          <View style={styles.imagePickerOptions}>
            <TouchableOpacity 
              style={styles.imagePickerOption}
              onPress={takePhoto}
            >
              <View style={[styles.imagePickerIcon, { backgroundColor: Colors.primary + '20' }]}>
                <Ionicons name="camera" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.imagePickerOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.imagePickerOption}
              onPress={pickImage}
            >
              <View style={[styles.imagePickerIcon, { backgroundColor: Colors.success + '20' }]}>
                <Ionicons name="image" size={32} color={Colors.success} />
              </View>
              <Text style={styles.imagePickerOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.imagePickerCancel}
            onPress={() => setShowImagePicker(false)}
          >
            <Text style={styles.imagePickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderAddEditModal = () => {
    const isEdit = showEditModal;
    const title = isEdit ? 'Edit Product' : 'Add New Product';
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddModal || showEditModal}
        onRequestClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView 
            style={styles.modalContainer}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.modalTitle}>{title}</Text>
            
            {/* Image Upload */}
            <View style={styles.imageUploadContainer}>
              <Text style={styles.inputLabel}>Product Image</Text>
              
              {formData.image ? (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: formData.image }} 
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <View style={styles.imageActions}>
                    <TouchableOpacity 
                      style={styles.imageActionButton}
                      onPress={() => setShowImagePicker(true)}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <>
                          <Ionicons name="camera" size={20} color={Colors.primary} />
                          <Text style={styles.imageActionText}>Change</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    {isEdit && (
                      <TouchableOpacity 
                        style={[styles.imageActionButton, styles.removeImageButton]}
                        onPress={removeProductImage}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <ActivityIndicator size="small" color={Colors.danger} />
                        ) : (
                          <>
                            <Ionicons name="trash" size={20} color={Colors.danger} />
                            <Text style={[styles.imageActionText, { color: Colors.danger }]}>
                              Remove
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.imageUploadButton}
                  onPress={() => setShowImagePicker(true)}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="camera" size={32} color={Colors.primary} />
                      <Text style={styles.imageUploadText}>Upload Image</Text>
                      <Text style={styles.imageUploadSubtext}>Recommended: 4:3 ratio</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            
            {/* Product Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Product Name *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Premium Massage Oil"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            
            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Describe your product..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            
            {/* Price and Stock Row */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.inputLabel}>Price (KES) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.price}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, price: text.replace(/[^0-9.]/g, '') }))}
                  placeholder="1800"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.inputLabel}>Stock Quantity *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.stock}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, stock: text.replace(/[^0-9]/g, '') }))}
                  placeholder="15"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            {/* Active Status */}
            <View style={styles.switchGroup}>
              <Text style={styles.switchLabel}>Active Product</Text>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                trackColor={{ false: Colors.cardBorder, true: Colors.primary }}
                thumbColor={Colors.background}
                ios_backgroundColor={Colors.cardBorder}
              />
            </View>
            
            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                disabled={submitting || uploadingImage}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmit}
                disabled={submitting || uploadingImage}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={Colors.text} />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEdit ? 'Update Product' : 'Add Product'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderDeleteModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showDeleteModal}
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModal}>
          <View style={styles.deleteIcon}>
            <Ionicons name="warning" size={48} color={Colors.danger} />
          </View>
          
          <Text style={styles.confirmTitle}>Delete Product</Text>
          <Text style={styles.confirmMessage}>
            Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
          </Text>
          
          <View style={styles.confirmActions}>
            <TouchableOpacity 
              style={[styles.confirmButton, styles.cancelConfirmButton]}
              onPress={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              <Text style={styles.cancelConfirmText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.confirmButton, styles.deleteConfirmButton]}
              onPress={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <Text style={styles.deleteConfirmText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={48} color={Colors.textSecondary} />
      <Text style={styles.emptyStateText}>No products found</Text>
      <Text style={styles.emptyStateSubtext}>
        Add your first product to showcase in your store
      </Text>
      <TouchableOpacity 
        style={styles.addFirstProductButton}
        onPress={handleAddProduct}
      >
        <Ionicons name="add" size={20} color={Colors.text} />
        <Text style={styles.addFirstProductText}>Add Your First Product</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      );
    }

    const isEmpty = products.length === 0;

    return (
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          isEmpty && styles.emptyListContent
        ]}
        ListHeaderComponent={() => !isEmpty && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{products.length}</Text>
              <Text style={styles.statLabel}>Total Products</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {products.filter(p => p.isActive).length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {products.reduce((sum, p) => sum + p.stock, 0)}
              </Text>
              <Text style={styles.statLabel}>Total Stock</Text>
            </View>
          </View>
        )}
        ListFooterComponent={<View style={{ height: BOTTOM_NAV_HEIGHT + Spacing.lg }} />}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddProduct}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      {/* Add/Edit Modal */}
      {renderAddEditModal()}

      {/* Image Picker Modal */}
      {renderImagePickerModal()}

      {/* Delete Confirmation Modal */}
      {renderDeleteModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '700',
  },
  addButton: {
    padding: Spacing.xs,
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: Colors.textSecondary,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statNumber: {
    ...Typography.h3,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 24,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  // Product Card
  productCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.small,
  },
  productImageContainer: {
    position: 'relative',
    height: 180,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    backgroundColor: Colors.card + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '700',
  },
  productContent: {
    padding: Spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  productInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  productName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  productPrice: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 18,
    marginTop: 2,
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  productDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  productActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    flex: 1,
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
    flex: 1,
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    color: Colors.danger,
    fontWeight: '600',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  addFirstProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  addFirstProductText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalScrollContent: {
    padding: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  // Image Upload
  imageUploadContainer: {
    marginBottom: Spacing.lg,
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  imageActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  imageActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  removeImageButton: {
    borderColor: Colors.danger,
  },
  imageActionText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  imageUploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card + '80',
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
  },
  imageUploadText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  imageUploadSubtext: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  // Image Picker Modal
  imagePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  imagePickerContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  imagePickerTitle: {
    ...Typography.h3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  imagePickerOptions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  imagePickerOption: {
    flex: 1,
    alignItems: 'center',
  },
  imagePickerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  imagePickerOptionText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  imagePickerCancel: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  imagePickerCancelText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  // Form Inputs
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    color: Colors.text,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  halfInput: {
    flex: 1,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    marginBottom: Spacing.lg,
  },
  switchLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.card,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  submitButtonText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  // Delete Modal
  confirmModal: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  deleteIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.danger + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  confirmTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  confirmMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelConfirmButton: {
    backgroundColor: Colors.card,
  },
  cancelConfirmText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  deleteConfirmButton: {
    backgroundColor: Colors.danger,
  },
  deleteConfirmText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
});

export default ProductManagement;