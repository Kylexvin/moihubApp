// screens/localservices/dashboard/ProductManagement.js
import React, { useState, useEffect } from 'react';
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

// ─── Design tokens ─────────────────────────────────────────────────
const MODAL_BG       = '#161616';
const MODAL_BORDER   = 'rgba(80,200,120,0.25)';
const INPUT_BG       = 'rgba(255,255,255,0.07)';
const INPUT_BORDER   = 'rgba(255,255,255,0.15)';
const SECTION_BG     = 'rgba(255,255,255,0.05)';
const SECTION_BORDER = 'rgba(255,255,255,0.1)';
const OVERLAY        = 'rgba(0,0,0,0.78)';

const BOTTOM_NAV_HEIGHT = 70;

// ─── Shared modal shell (outside component to prevent remounts) ────
const ModalShell = ({ visible, onClose, title, children, onSave, saveLabel = 'Save', saving }) => (
  <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: OVERLAY, justifyContent: 'flex-end' }}
    >
      <View style={shellStyles.card}>
        <View style={shellStyles.handle} />
        <View style={shellStyles.header}>
          <Text style={shellStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={shellStyles.closeBtn}>
            <Ionicons name="close" size={22} color="#888888" />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
          <View style={shellStyles.actions}>
            <TouchableOpacity style={shellStyles.cancelBtn} onPress={onClose} disabled={saving}>
              <Text style={shellStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={shellStyles.saveBtn} onPress={onSave} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#000" />
                : <Text style={shellStyles.saveText}>{saveLabel}</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const shellStyles = StyleSheet.create({
  card: {
    backgroundColor: MODAL_BG,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0, borderColor: MODAL_BORDER,
    paddingHorizontal: 24, paddingBottom: 40, maxHeight: '92%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginTop: 16, marginBottom: 8,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
    marginBottom: 24,
  },
  title:    { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  actions:  { flexDirection: 'row', gap: 16, marginTop: 24, marginBottom: 8 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#888888' },
  saveBtn:   { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#50c878', alignItems: 'center' },
  saveText:  { fontSize: 16, fontWeight: '700', color: '#000000' },
});

// ─── Field component ───────────────────────────────────────────────
const Field = ({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }) => (
  <View style={{ marginBottom: 20 }}>
    <Text style={{ fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    <TextInput
      style={{
        backgroundColor: INPUT_BG, borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: INPUT_BORDER, color: '#fff', fontSize: 15,
        ...(multiline && { minHeight: 90, textAlignVertical: 'top' })
      }}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#555"
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      textAlignVertical={multiline ? 'top' : 'center'}
      keyboardType={keyboardType}
    />
  </View>
);

// ─── Main component ────────────────────────────────────────────────
const ProductManagement = () => {
  const navigation = useNavigation();
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [uploadingImage, setUploadingImage]   = useState(false);
  const [submitting, setSubmitting]           = useState(false);
  const [deleting, setDeleting]               = useState(false);

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', stock: '',
    currency: 'KES', image: null, imageAsset: null, isActive: true,
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/services/dashboard/products');
      setProducts(res.data.products || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load products.');
    } finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchProducts();
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', stock: '', currency: 'KES', image: null, imageAsset: null, isActive: true });
    setSelectedProduct(null);
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
      name: product.name || '', description: product.description || '',
      price: product.price?.toString() || '', stock: product.stock?.toString() || '0',
      currency: product.currency || 'KES', image: product.image || null,
      imageAsset: null, isActive: product.isActive ?? true,
    });
    setShowEditModal(true);
  };

  const handleDeleteProduct = (product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Camera roll permissions needed.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [4, 3], quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, image: result.assets[0].uri, imageAsset: result.assets[0] }));
        setShowImagePicker(false);
      }
    } catch (e) { Alert.alert('Error', 'Failed to pick image.'); }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Camera permissions needed.'); return; }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, aspect: [4, 3], quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, image: result.assets[0].uri, imageAsset: result.assets[0] }));
        setShowImagePicker(false);
      }
    } catch (e) { Alert.alert('Error', 'Failed to take photo.'); }
  };

  const buildFormData = (data, imageAsset) => {
    const fd = new FormData();
    Object.keys(data).forEach(key => {
      if (key !== 'image' && key !== 'imageAsset') fd.append(key, data[key]);
    });
    if (imageAsset) {
      const filename = imageAsset.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      fd.append('image', { uri: imageAsset.uri, name: filename, type: match ? `image/${match[1]}` : 'image/jpeg' });
    }
    return fd;
  };

  const validateForm = () => {
    if (!formData.name.trim()) { Alert.alert('Required', 'Product name is required'); return false; }
    if (!formData.price || parseFloat(formData.price) <= 0) { Alert.alert('Required', 'Valid price is required'); return false; }
    if (formData.stock === '' || parseInt(formData.stock) < 0) { Alert.alert('Required', 'Valid stock quantity is required'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const productData = {
        name: formData.name.trim(), description: formData.description.trim(),
        price: parseFloat(formData.price), stock: parseInt(formData.stock),
        currency: formData.currency, isActive: formData.isActive,
      };

      if (showEditModal && selectedProduct) {
        const res = await axios.put(`/api/services/dashboard/products/${selectedProduct._id}`, productData);
        if (formData.imageAsset) {
          setUploadingImage(true);
          await axios.put(
            `/api/services/dashboard/products/${selectedProduct._id}/image`,
            buildFormData({}, formData.imageAsset),
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
        }
        if (res.data.message) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Saved', 'Product updated', [{ text: 'OK', onPress: () => { setShowEditModal(false); resetForm(); fetchProducts(); } }]);
        }
      } else {
        const res = await axios.post('/api/services/dashboard/products', buildFormData(productData, formData.imageAsset), {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Added', 'Product created', [{ text: 'OK', onPress: () => { setShowAddModal(false); resetForm(); fetchProducts(); } }]);
        }
      }
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e.response?.data?.message || 'Failed to save product');
    } finally { setSubmitting(false); setUploadingImage(false); }
  };

  const removeProductImage = async () => {
    if (!selectedProduct) return;
    try {
      setUploadingImage(true);
      const res = await axios.delete(`/api/services/dashboard/products/${selectedProduct._id}/image`);
      if (res.data.message) {
        setFormData(prev => ({ ...prev, image: null, imageAsset: null }));
        setProducts(prev => prev.map(p => p._id === selectedProduct._id ? { ...p, image: null } : p));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to remove image');
    } finally { setUploadingImage(false); }
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    try {
      setDeleting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const res = await axios.delete(`/api/services/dashboard/products/${selectedProduct._id}`);
      if (res.data.message) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setProducts(prev => prev.filter(p => p._id !== selectedProduct._id));
        setShowDeleteModal(false);
        setSelectedProduct(null);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to delete product');
    } finally { setDeleting(false); }
  };

  const formatCurrency = (amount) => `KES ${amount?.toLocaleString() || '0'}`;

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: Colors.danger };
    if (stock <= 5)  return { label: 'Low Stock',    color: Colors.warning };
    return { label: 'In Stock', color: Colors.success };
  };

  // ─── Product card ──────────────────────────────────────────────
  const renderProductItem = ({ item }) => {
    const ss = getStockStatus(item.stock);
    return (
      <View style={styles.productCard}>
        <View style={styles.productImageBox}>
          {item.image
            ? <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
            : <View style={styles.noImage}><Ionicons name="cube-outline" size={32} color={Colors.textSecondary} /></View>
          }
          <View style={[styles.stockBadge, { backgroundColor: ss.color + '22' }]}>
            <View style={[styles.stockDot, { backgroundColor: ss.color }]} />
            <Text style={[styles.stockText, { color: ss.color }]}>{item.stock} in stock</Text>
          </View>
        </View>

        <View style={styles.productBody}>
          <View style={styles.productRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
            </View>
            <View style={[styles.activePill, { backgroundColor: item.isActive ? Colors.success + '20' : Colors.danger + '20' }]}>
              <Text style={[styles.activePillText, { color: item.isActive ? Colors.success : Colors.danger }]}>
                {item.isActive ? 'Active' : 'Off'}
              </Text>
            </View>
          </View>

          {item.description ? (
            <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
          ) : null}

          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => handleEditProduct(item)}>
              <Ionicons name="create-outline" size={16} color={Colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(item)}>
              <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ─── Add/Edit modal ────────────────────────────────────────────
  const renderAddEditModal = () => {
    const isEdit = showEditModal;
    return (
      <ModalShell
        visible={showAddModal || showEditModal}
        onClose={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}
        title={isEdit ? 'Edit Product' : 'Add Product'}
        onSave={handleSubmit}
        saveLabel={isEdit ? 'Update' : 'Add Product'}
        saving={submitting}
      >
        {/* Image */}
        <Text style={styles.fieldLabel}>Product Image</Text>
        {formData.image ? (
          <View style={{ marginBottom: 20 }}>
            <Image source={{ uri: formData.image }} style={styles.imagePreview} resizeMode="cover" />
            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.imgActionBtn} onPress={() => setShowImagePicker(true)} disabled={uploadingImage}>
                <Ionicons name="camera" size={16} color={Colors.primary} />
                <Text style={[styles.imgActionText, { color: Colors.primary }]}>Change</Text>
              </TouchableOpacity>
              {isEdit && (
                <TouchableOpacity style={[styles.imgActionBtn, { borderColor: Colors.danger + '60' }]} onPress={removeProductImage} disabled={uploadingImage}>
                  {uploadingImage
                    ? <ActivityIndicator size="small" color={Colors.danger} />
                    : <>
                        <Ionicons name="trash" size={16} color={Colors.danger} />
                        <Text style={[styles.imgActionText, { color: Colors.danger }]}>Remove</Text>
                      </>
                  }
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.imageUploadBtn} onPress={() => setShowImagePicker(true)} disabled={uploadingImage}>
            <Ionicons name="camera-outline" size={28} color={Colors.primary} />
            <Text style={styles.imageUploadText}>Upload Image</Text>
            <Text style={styles.imageUploadHint}>Recommended: 4:3 ratio</Text>
          </TouchableOpacity>
        )}

        <Field label="Product Name *" value={formData.name} onChangeText={(t) => setFormData(p => ({ ...p, name: t }))} placeholder="product name" />
        <Field label="Description" value={formData.description} onChangeText={(t) => setFormData(p => ({ ...p, description: t }))} placeholder="Describe your product..." multiline />

        {/* Price + Stock row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Price (KES) *</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.price}
              onChangeText={(t) => setFormData(p => ({ ...p, price: t.replace(/[^0-9.]/g, '') }))}
              placeholder="1800"
              placeholderTextColor="#555"
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Stock *</Text>
            <TextInput
              style={styles.fieldInput}
              value={formData.stock}
              onChangeText={(t) => setFormData(p => ({ ...p, stock: t.replace(/[^0-9]/g, '') }))}
              placeholder="15"
              placeholderTextColor="#555"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Active toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Active Product</Text>
          <Switch
            value={formData.isActive}
            onValueChange={(v) => setFormData(p => ({ ...p, isActive: v }))}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.primary }}
            thumbColor={Colors.background}
          />
        </View>
      </ModalShell>
    );
  };

  // ─── Image picker modal ────────────────────────────────────────
  const renderImagePickerModal = () => (
    <Modal animationType="slide" transparent visible={showImagePicker} onRequestClose={() => setShowImagePicker(false)}>
      <View style={{ flex: 1, backgroundColor: OVERLAY, justifyContent: 'flex-end' }}>
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHandle} />
          <Text style={styles.pickerTitle}>Choose Image</Text>
          <View style={styles.pickerOptions}>
            <TouchableOpacity style={styles.pickerOption} onPress={takePhoto}>
              <View style={[styles.pickerIcon, { backgroundColor: Colors.primary + '20' }]}>
                <Ionicons name="camera" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.pickerOptionText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerOption} onPress={pickImage}>
              <View style={[styles.pickerIcon, { backgroundColor: Colors.info + '20' }]}>
                <Ionicons name="image" size={28} color={Colors.info} />
              </View>
              <Text style={styles.pickerOptionText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.pickerCancel} onPress={() => setShowImagePicker(false)}>
            <Text style={styles.pickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ─── Delete confirm modal ──────────────────────────────────────
  const renderDeleteModal = () => (
    <Modal animationType="fade" transparent visible={showDeleteModal} onRequestClose={() => setShowDeleteModal(false)}>
      <View style={{ flex: 1, backgroundColor: OVERLAY, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={styles.deleteCard}>
          <View style={styles.deleteIconCircle}>
            <Ionicons name="warning" size={40} color={Colors.danger} />
          </View>
          <Text style={styles.deleteTitle}>Delete Product</Text>
          <Text style={styles.deleteMessage}>
            Are you sure you want to delete "{selectedProduct?.name}"? This cannot be undone.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
            <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => setShowDeleteModal(false)} disabled={deleting}>
              <Text style={styles.deleteCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteConfirmBtn} onPress={confirmDelete} disabled={deleting}>
              {deleting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.deleteConfirmText}>Delete</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ─── Empty state ───────────────────────────────────────────────
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="cube-outline" size={52} color={Colors.textSecondary} />
      <Text style={styles.emptyTitle}>No products yet</Text>
      <Text style={styles.emptySubtitle}>Add your first product to showcase in your store</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={handleAddProduct}>
        <Ionicons name="add" size={20} color="#000" />
        <Text style={styles.emptyBtnText}>Add First Product</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── List header ───────────────────────────────────────────────
  const ListHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.pageTitle}>Products</Text>
      <Text style={styles.pageSubtitle}>Manage your store inventory</Text>
      <View style={styles.statsRow}>
        {[
          { value: products.length,                                  label: 'Total'  },
          { value: products.filter(p => p.isActive).length,         label: 'Active' },
          { value: products.reduce((s, p) => s + (p.stock || 0), 0), label: 'Stock'  },
        ].map(({ value, label }) => (
          <View key={label} style={styles.statCard}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = products.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={!isEmpty ? <ListHeader /> : null}
        ListFooterComponent={<View style={{ height: BOTTOM_NAV_HEIGHT + 40 }} />}
        contentContainerStyle={[styles.listContent, isEmpty && styles.emptyContent]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddProduct} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      {renderAddEditModal()}
      {renderImagePickerModal()}
      {renderDeleteModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  loadingBox:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md },
  listContent: { paddingBottom: Spacing.lg },
  emptyContent: { flex: 1, justifyContent: 'center' },

  // ── List header ──
  listHeader:   { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  pageTitle:    { fontSize: 26, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.md },
  statsRow:     { flexDirection: 'row', gap: Spacing.sm },
  statCard:     { flex: 1, backgroundColor: SECTION_BG, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: SECTION_BORDER },
  statValue:    { fontSize: 22, fontWeight: '700', color: Colors.primary },
  statLabel:    { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  // ── FAB ──
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },

  // ── Product card ──
  productCard: {
    backgroundColor: SECTION_BG, marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: SECTION_BORDER, overflow: 'hidden',
  },
  productImageBox: { height: 170, position: 'relative' },
  productImage:    { width: '100%', height: '100%' },
  noImage:         { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  stockBadge:      { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.round },
  stockDot:        { width: 6, height: 6, borderRadius: 3 },
  stockText:       { fontSize: 12, fontWeight: '700' },
  productBody:     { padding: Spacing.md },
  productRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.xs },
  productName:     { fontSize: 16, fontWeight: '700', color: Colors.text },
  productPrice:    { fontSize: 17, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  activePill:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.round, marginLeft: 8 },
  activePillText:  { fontSize: 11, fontWeight: '700' },
  productDesc:     { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: Spacing.md },
  cardActions:     { flexDirection: 'row', gap: Spacing.sm },
  editBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary + '60', backgroundColor: Colors.primary + '10' },
  editBtnText:     { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  deleteBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.danger + '60', backgroundColor: Colors.danger + '10' },
  deleteBtnText:   { fontSize: 13, color: Colors.danger, fontWeight: '600' },

  // ── Empty state ──
  emptyState:    { alignItems: 'center', paddingVertical: 60, paddingHorizontal: Spacing.lg },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: Colors.textSecondary, marginTop: Spacing.md },
  emptySubtitle: { fontSize: 14, color: Colors.textTertiary, textAlign: 'center', marginTop: 6, marginBottom: Spacing.lg },
  emptyBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg },
  emptyBtnText:  { fontSize: 15, color: '#000', fontWeight: '700' },

  // ── Add/Edit modal form ──
  fieldLabel:     { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput:     { backgroundColor: INPUT_BG, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: INPUT_BORDER, color: '#fff', fontSize: 15, marginBottom: 0 },
  imagePreview:   { width: '100%', height: 180, borderRadius: 12, marginBottom: 12 },
  imageActions:   { flexDirection: 'row', gap: 12 },
  imgActionBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.primary + '60', backgroundColor: Colors.primary + '10' },
  imgActionText:  { fontSize: 13, fontWeight: '600' },
  imageUploadBtn: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: INPUT_BORDER, borderStyle: 'dashed', borderRadius: 12, padding: 32, marginBottom: 20 },
  imageUploadText: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginTop: 8 },
  imageUploadHint: { fontSize: 12, color: '#555', marginTop: 4 },
  toggleRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', marginBottom: 4 },
  toggleLabel:    { fontSize: 15, fontWeight: '600', color: Colors.text },

  // ── Image picker sheet ──
  pickerSheet:      { backgroundColor: MODAL_BG, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: MODAL_BORDER, padding: 24, paddingBottom: 50, alignItems: 'center' },
  pickerHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 16 },
  pickerTitle:      { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 24 },
  pickerOptions:    { flexDirection: 'row', gap: 32, marginBottom: 24 },
  pickerOption:     { alignItems: 'center' },
  pickerIcon:       { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  pickerOptionText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  pickerCancel:     { width: '100%', padding: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  pickerCancelText: { fontSize: 15, fontWeight: '600', color: '#888' },

  // ── Delete modal ──
  deleteCard:       { backgroundColor: MODAL_BG, borderRadius: 20, padding: 28, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: Colors.danger + '30' },
  deleteIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.danger + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  deleteTitle:      { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  deleteMessage:    { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  deleteCancelBtn:  { flex: 1, padding: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  deleteCancelText: { fontSize: 15, fontWeight: '600', color: '#888' },
  deleteConfirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.danger, alignItems: 'center' },
  deleteConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default ProductManagement;