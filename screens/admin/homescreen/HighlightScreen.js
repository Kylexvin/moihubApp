import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

const HighlightScreen = () => {
  const [highlight, setHighlight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [form, setForm] = useState({
    type: 'promo',
    title: '',
    content: '',
    ctaText: '',
    ctaLink: '',
    phone: ''
  });

  const fetchHighlight = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/homescreen/highlight');
      setHighlight(res.data);
    } catch (err) {
      console.error('Error fetching highlight:', err.message);
      Alert.alert('Error', 'Failed to fetch highlight data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      type: 'promo',
      title: '',
      content: '',
      ctaText: '',
      ctaLink: '',
      phone: ''
    });
    setSelectedImage(null);
    setIsEditing(false);
  };

  const handleEdit = () => {
    if (highlight) {
      setForm({
        type: highlight.type || 'promo',
        title: highlight.title || '',
        content: highlight.content || '',
        ctaText: highlight.ctaText || '',
        ctaLink: highlight.ctaLink || '',
        phone: ''
      });
      setIsEditing(true);
      setModalVisible(true);
    }
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      
      // Add form fields
      formData.append('type', form.type);
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('ctaText', form.ctaText);
      formData.append('ctaLink', form.ctaLink);
      formData.append('phone', form.phone);

      // Add image if selected
      if (selectedImage) {
        formData.append('image', {
          uri: selectedImage.uri,
          type: 'image/jpeg',
          name: selectedImage.fileName || 'image.jpg',
        });
      }

      await axios.post('/api/homescreen/highlight', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Highlight created successfully');
      resetForm();
      setModalVisible(false);
      fetchHighlight();
    } catch (err) {
      console.error('Create error:', err.message);
      Alert.alert('Error', 'Failed to create highlight');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!highlight || !form.title.trim() || !form.content.trim()) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      
      formData.append('type', form.type);
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('ctaText', form.ctaText);
      formData.append('ctaLink', form.ctaLink);
      formData.append('phone', form.phone);

      if (selectedImage) {
        formData.append('image', {
          uri: selectedImage.uri,
          type: 'image/jpeg',
          name: selectedImage.fileName || 'image.jpg',
        });
      }

      await axios.put(`/api/homescreen/highlight/${highlight._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Highlight updated successfully');
      resetForm();
      setModalVisible(false);
      fetchHighlight();
    } catch (err) {
      console.error('Update error:', err.message);
      Alert.alert('Error', 'Failed to update highlight');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!highlight) return;

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this highlight?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await axios.delete(`/api/homescreen/highlight/${highlight._id}`);
              Alert.alert('Success', 'Highlight deleted successfully');
              setHighlight(null);
            } catch (err) {
              console.error('Delete error:', err.message);
              Alert.alert('Error', 'Failed to delete highlight');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const selectImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setSelectedImage(result.assets[0]);
    }
  };

  useEffect(() => {
    fetchHighlight();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Highlight Management</Text>
          <Text style={styles.headerSubtitle}>Manage your featured content</Text>
        </View>

        {/* Current Highlight Display */}
        <View style={styles.currentSection}>
          <Text style={styles.sectionTitle}>Current Highlight</Text>
          {loading && !highlight ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : highlight ? (
            <View style={styles.highlightCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{highlight.title}</Text>
                <View style={styles.typeTag}>
                  <Text style={styles.typeText}>{highlight.type}</Text>
                </View>
              </View>
              
              <Text style={styles.cardContent}>{highlight.content}</Text>
              
              {highlight.graphicUrl && (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: highlight.graphicUrl }} style={styles.previewImage} />
                </View>
              )}
              
              {highlight.ctaText && (
                <View style={styles.ctaContainer}>
                  <Text style={styles.ctaLabel}>Call to Action:</Text>
                  <Text style={styles.ctaText}>{highlight.ctaText}</Text>
                </View>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No active highlight found</Text>
              <Text style={styles.emptyStateSubtext}>Create your first highlight to get started</Text>
            </View>
          )}
        </View>

        {/* Create New Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Text style={styles.createButtonText}>+ Create New Highlight</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditing ? 'Edit Highlight' : 'Create New Highlight'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeSelector}>
                  {['promo', 'event', 'news'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeOption,
                        form.type === type && styles.typeOptionActive
                      ]}
                      onPress={() => setForm({ ...form, type })}
                    >
                      <Text style={[
                        styles.typeOptionText,
                        form.type === type && styles.typeOptionTextActive
                      ]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter highlight title"
                  value={form.title}
                  onChangeText={(val) => setForm({ ...form, title: val })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Content *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter highlight content"
                  value={form.content}
                  onChangeText={(val) => setForm({ ...form, content: val })}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Image</Text>
                <TouchableOpacity style={styles.imageSelector} onPress={selectImage}>
                  {selectedImage ? (
                    <Image source={{ uri: selectedImage.uri }} style={styles.selectedImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>CTA Text</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Learn More, Contact Us"
                  value={form.ctaText}
                  onChangeText={(val) => setForm({ ...form, ctaText: val })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>CTA Link</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://example.com"
                  value={form.ctaLink}
                  onChangeText={(val) => setForm({ ...form, ctaLink: val })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone (for WhatsApp)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., +1234567890"
                  value={form.phone}
                  onChangeText={(val) => setForm({ ...form, phone: val })}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                  onPress={isEditing ? handleUpdate : handleCreate}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {isEditing ? 'Update' : 'Create'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HighlightScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  currentSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  highlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  typeTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardContent: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  ctaContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  ctaLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  ctaText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  editButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#10B981',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalContent: {
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
  },
  formGroup: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  typeOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },
  imageSelector: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});