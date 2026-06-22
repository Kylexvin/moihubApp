import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const categories = [
  'Technology',
  'Education',
  'Business',
  'Health',
  'Food',
  'Travel',
  'Fashion',
  'Sports',
  'Entertainment',
  'Campus Life',
  'Accommodation',
  'Career',
  'Events',
  'Finance',
  'Relationships',
  'Opinion',
  'Lifestyle',
  'Announcements',
  'Other'
];

const blockTypes = [
  { type: 'paragraph', icon: 'document-text', label: 'Paragraph' },
  { type: 'header', icon: 'text', label: 'Header' },
  { type: 'image', icon: 'image', label: 'Image' },
  { type: 'list', icon: 'list', label: 'List' },
];

const CreatePostScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const postId = route.params?.postId;

  const [submitting, setSubmitting] = useState(false);
  const [loadingPost, setLoadingPost] = useState(!!postId);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    featuredImage: null,
    contentBlocks: [{ type: 'paragraph', text: '', id: Date.now() }],
  });

  useEffect(() => {
    if (postId) fetchPostForEdit();
  }, [postId]);

  const fetchPostForEdit = async () => {
    try {
      const response = await axios.get(`/api/posts/${postId}`);
      if (response.data.success) {
        const post = response.data.post;
        
        const contentBlocks = post.content.map((block, index) => {
          const baseBlock = {
            ...block,
            id: index,
            items: block.items || [],
          };
          
          if (block.type === 'image' && block.src) {
            baseBlock.imageUri = block.src;
            baseBlock.originalSrc = block.src;
          }
          
          return baseBlock;
        });

        setFormData({
          title: post.title,
          category: post.category,
          featuredImage: post.image ? { uri: post.image, isUrl: true } : null,
          contentBlocks: contentBlocks.length > 0
            ? contentBlocks
            : [{ type: 'paragraph', text: '', id: Date.now() }],
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load post');
      navigation.goBack();
    } finally {
      setLoadingPost(false);
    }
  };

  const pickFeaturedImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setFormData((prev) => ({ 
        ...prev, 
        featuredImage: { 
          uri: result.assets[0].uri,
          isUrl: false
        } 
      }));
    }
  };

  const addContentBlock = (type) => {
    setFormData((prev) => ({
      ...prev,
      contentBlocks: [
        ...prev.contentBlocks,
        { type, text: '', src: '', caption: '', items: [], id: Date.now() },
      ],
    }));
  };

  const updateContentBlock = (blockId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map((block) =>
        block.id === blockId ? { ...block, [field]: value } : block
      ),
    }));
  };

  const deleteContentBlock = (blockId) => {
    setFormData((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter((block) => block.id !== blockId),
    }));
  };

  // NEW: Move block up
  const moveBlockUp = (blockId) => {
    setFormData((prev) => {
      const blocks = [...prev.contentBlocks];
      const index = blocks.findIndex((block) => block.id === blockId);
      if (index > 0) {
        // Swap with the block above
        [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
        return { ...prev, contentBlocks: blocks };
      }
      return prev;
    });
  };

  // NEW: Move block down
  const moveBlockDown = (blockId) => {
    setFormData((prev) => {
      const blocks = [...prev.contentBlocks];
      const index = blocks.findIndex((block) => block.id === blockId);
      if (index < blocks.length - 1) {
        // Swap with the block below
        [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
        return { ...prev, contentBlocks: blocks };
      }
      return prev;
    });
  };

  const pickImageForBlock = async (blockId) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      updateContentBlock(blockId, 'imageUri', result.assets[0].uri);
      updateContentBlock(blockId, 'isNewImage', true);
      updateContentBlock(blockId, 'originalSrc', null);
    }
  };

  const addListItem = (blockId) => {
    setFormData((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map((block) =>
        block.id === blockId
          ? { ...block, items: [...(block.items || []), ''] }
          : block
      ),
    }));
  };

  const updateListItem = (blockId, itemIndex, value) => {
    setFormData((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map((block) =>
        block.id === blockId
          ? { ...block, items: block.items.map((item, i) => (i === itemIndex ? value : item)) }
          : block
      ),
    }));
  };

  const removeListItem = (blockId, itemIndex) => {
    setFormData((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map((block) =>
        block.id === blockId
          ? { ...block, items: block.items.filter((_, i) => i !== itemIndex) }
          : block
      ),
    }));
  };

  const submitPost = async () => {
    if (!formData.title.trim() || !formData.category.trim()) {
      return Alert.alert('Error', 'Please fill in title and category');
    }
    if (!formData.featuredImage) {
      return Alert.alert('Error', 'Please select a featured image');
    }
    const hasContent = formData.contentBlocks.some((block) => {
      if (block.type === 'list') return block.items?.some((i) => i.trim());
      if (block.type === 'image') return block.imageUri || block.originalSrc;
      return block.text?.trim();
    });
    if (!hasContent) {
      return Alert.alert('Error', 'Please add some content');
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('category', formData.category.trim());
      
      if (formData.featuredImage) {
        if (formData.featuredImage.isUrl) {
          data.append('featuredImageUrl', formData.featuredImage.uri);
        } else {
          data.append('image', {
            uri: formData.featuredImage.uri,
            type: 'image/jpeg',
            name: 'featured.jpg',
          });
        }
      }

      const processedContent = [];
      let imgCounter = 0;

      for (const block of formData.contentBlocks) {
        if (block.type === 'image') {
          if (block.imageUri && !block.isNewImage && block.originalSrc) {
            processedContent.push({ 
              type: 'image', 
              src: block.originalSrc, 
              caption: block.caption || '' 
            });
          } else if (block.imageUri && (block.isNewImage || !block.originalSrc)) {
            data.append(`content-image-${imgCounter}`, {
              uri: block.imageUri,
              type: 'image/jpeg',
              name: `content-image-${imgCounter}.jpg`,
            });
            processedContent.push({ 
              type: 'image', 
              src: `content-image-${imgCounter}`, 
              caption: block.caption || '' 
            });
            imgCounter++;
          }
        } else if (block.type === 'list') {
          const items = block.items?.filter((i) => i.trim());
          if (items?.length) processedContent.push({ type: 'list', items });
        } else if ((block.type === 'paragraph' || block.type === 'header') && block.text?.trim()) {
          processedContent.push({ type: block.type, text: block.text.trim() });
        }
      }

      data.append('content', JSON.stringify(processedContent));

      const response = postId
        ? await axios.patch(`/api/posts/${postId}`, data, { 
            headers: { 'Content-Type': 'multipart/form-data' } 
          })
        : await axios.post('/api/posts', data, { 
            headers: { 'Content-Type': 'multipart/form-data' } 
          });

      if (response.data.success) {
        Alert.alert('Success', postId ? 'Post updated!' : 'Post created!');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit post');
    } finally {
      setSubmitting(false);
    }
  };

  const renderContentBlock = (block, index, totalBlocks) => {
    const isFirst = index === 0;
    const isLast = index === totalBlocks - 1;

    const blockContent = (() => {
      switch (block.type) {
        case 'paragraph':
          return (
            <>
              <TextInput
                style={[styles.textInput, { minHeight: 100 }]}
                value={block.text}
                onChangeText={(text) => updateContentBlock(block.id, 'text', text)}
                placeholder="Write your paragraph..."
                placeholderTextColor="#444"
                multiline
              />
            </>
          );
        case 'header':
          return (
            <>
              <TextInput
                style={[styles.textInput, styles.headerInput]}
                value={block.text}
                onChangeText={(text) => updateContentBlock(block.id, 'text', text)}
                placeholder="Enter header text..."
                placeholderTextColor="#444"
              />
            </>
          );
        case 'image':
          return (
            <>
              <TouchableOpacity style={styles.imagePicker} onPress={() => pickImageForBlock(block.id)}>
                {(block.imageUri || block.originalSrc) ? (
                  <Image 
                    source={{ uri: block.imageUri || block.originalSrc }} 
                    style={styles.pickedImage} 
                    resizeMode="cover" 
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={40} color="#444" />
                    <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                value={block.caption}
                onChangeText={(text) => updateContentBlock(block.id, 'caption', text)}
                placeholder="Caption (optional)"
                placeholderTextColor="#444"
              />
              {block.originalSrc && !block.isNewImage && (
                <View style={styles.existingImageBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                  <Text style={styles.existingImageText}>Existing image</Text>
                </View>
              )}
            </>
          );
        case 'list':
          return (
            <>
              {(block.items || []).map((item, idx) => (
                <View key={idx} style={styles.listItemRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={item}
                    onChangeText={(text) => updateListItem(block.id, idx, text)}
                    placeholder={`Item ${idx + 1}...`}
                    placeholderTextColor="#444"
                  />
                  <TouchableOpacity style={styles.removeItem} onPress={() => removeListItem(block.id, idx)}>
                    <Ionicons name="close" size={16} color="#ff3366" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addItem} onPress={() => addListItem(block.id)}>
                <Ionicons name="add" size={16} color="#6c7ce7" />
                <Text style={styles.addItemText}>Add item</Text>
              </TouchableOpacity>
            </>
          );
        default:
          return null;
      }
    })();

    // Get block icon and label
    const blockInfo = blockTypes.find(bt => bt.type === block.type);
    const iconName = blockInfo?.icon || 'document-text';
    const label = blockInfo?.label || block.type;

    return (
      <View key={block.id} style={styles.contentBlock}>
        <View style={styles.blockHeader}>
          <View style={styles.blockHeaderLeft}>
            <Ionicons name={iconName} size={18} color="#6c7ce7" />
            <Text style={styles.blockTitle}>{label}</Text>
          </View>
          <View style={styles.blockHeaderRight}>
            {/* Up Arrow */}
            <TouchableOpacity 
              style={[styles.moveButton, isFirst && styles.moveButtonDisabled]}
              onPress={() => moveBlockUp(block.id)}
              disabled={isFirst}
            >
              <Ionicons 
                name="chevron-up" 
                size={20} 
                color={isFirst ? '#333' : '#6c7ce7'} 
              />
            </TouchableOpacity>
            
            {/* Down Arrow */}
            <TouchableOpacity 
              style={[styles.moveButton, isLast && styles.moveButtonDisabled]}
              onPress={() => moveBlockDown(block.id)}
              disabled={isLast}
            >
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color={isLast ? '#333' : '#6c7ce7'} 
              />
            </TouchableOpacity>
            
            {/* Delete */}
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => deleteContentBlock(block.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#ff3366" />
            </TouchableOpacity>
          </View>
        </View>
        {blockContent}
      </View>
    );
  };

  if (loadingPost) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c7ce7" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
            placeholder="Enter post title"
            placeholderTextColor="#444"
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, formData.category === cat && styles.categoryChipActive]}
                  onPress={() => setFormData((prev) => ({ ...prev, category: cat }))}
                >
                  <Text style={[styles.chipText, formData.category === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Featured Image */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Featured Image *</Text>
          <TouchableOpacity style={styles.featuredImagePicker} onPress={pickFeaturedImage}>
            {formData.featuredImage ? (
              <Image source={{ uri: formData.featuredImage.uri }} style={styles.featuredImage} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={48} color="#444" />
                <Text style={styles.imagePlaceholderText}>Tap to select featured image</Text>
              </View>
            )}
          </TouchableOpacity>
          {formData.featuredImage?.isUrl && (
            <View style={styles.existingImageBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
              <Text style={styles.existingImageText}>Existing image</Text>
            </View>
          )}
        </View>

        {/* Content Blocks */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Content</Text>
          {formData.contentBlocks.map((block, index) => 
            renderContentBlock(block, index, formData.contentBlocks.length)
          )}
        </View>

        {/* Add Block */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Add Block</Text>
          <View style={styles.blockButtonsRow}>
            {blockTypes.map((bt) => (
              <TouchableOpacity
                key={bt.type}
                style={styles.blockButton}
                onPress={() => addContentBlock(bt.type)}
              >
                <Ionicons name={bt.icon} size={20} color="#6c7ce7" />
                <Text style={styles.blockButtonText}>{bt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitButton} onPress={submitPost} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{postId ? 'Update Post' : 'Publish Post'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 13, color: '#6c7ce7', fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  categoryRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  categoryChipActive: { backgroundColor: '#6c7ce720', borderColor: '#6c7ce7' },
  chipText: { fontSize: 13, color: '#666' },
  chipTextActive: { color: '#6c7ce7', fontWeight: '600' },
  featuredImagePicker: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
  },
  featuredImage: { width: '100%', height: 180 },
  imagePlaceholder: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderText: { fontSize: 13, color: '#444' },
  contentBlock: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  blockHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  blockTitle: { fontSize: 13, color: '#888', fontWeight: '600' },
  moveButton: {
    padding: 4,
    borderRadius: 4,
  },
  moveButtonDisabled: {
    opacity: 0.3,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 4,
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  headerInput: { fontSize: 18, fontWeight: 'bold' },
  imagePicker: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
  },
  pickedImage: { width: '100%', height: 140 },
  listItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  removeItem: { padding: 4 },
  addItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  addItemText: { fontSize: 13, color: '#6c7ce7', fontWeight: '600' },
  blockButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#6c7ce740',
  },
  blockButtonText: { fontSize: 13, color: '#6c7ce7', fontWeight: '600' },
  submitButton: {
    backgroundColor: '#6c7ce7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  existingImageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  existingImageText: { fontSize: 12, color: '#4CAF50' },
});

export default CreatePostScreen;