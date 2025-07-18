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
  Modal,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const { width } = Dimensions.get('window');

const BlogManagement = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    featuredImage: null,
    contentBlocks: [{ type: 'paragraph', text: '', id: Date.now() }],
  });
  const [submitting, setSubmitting] = useState(false);

  // Categories for dropdown
  const categories = [
    'Technology', 'Health', 'Travel', 'Food', 'Fashion', 
    'Sports', 'Education', 'Business', 'Entertainment', 'Other'
  ];

  // Content block types
  const blockTypes = [
    { type: 'paragraph', icon: 'document-text', label: 'Paragraph' },
    { type: 'header', icon: 'text', label: 'Header' },
    { type: 'image', icon: 'image', label: 'Image' },
    { type: 'list', icon: 'list', label: 'List' },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchPosts(1, true), fetchStats()]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (page = 1, reset = false) => {
    try {
      if (page > 1) setLoadingMore(true);
      
      const response = await axios.get(`/api/posts/user/posts?page=${page}&limit=10`);
      
      if (response.data.success) {
        const newPosts = response.data.posts;
        setPosts(prevPosts => reset ? newPosts : [...prevPosts, ...newPosts]);
        setHasNextPage(response.data.pagination.hasNextPage);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to fetch posts');
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/posts/user/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  }, []);

  const loadMorePosts = () => {
    if (hasNextPage && !loadingMore) {
      fetchPosts(currentPage + 1);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      category: '',
      featuredImage: null,
      contentBlocks: [{ type: 'paragraph', text: '', id: Date.now() }],
    });
    setEditingPost(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (post) => {
    setEditingPost(post);
    // Convert post content back to editable format
    const contentBlocks = post.content.map((block, index) => ({
      ...block,
      id: index,
      items: block.items || [],
    }));
    
    setFormData({
      title: post.title,
      category: post.category,
      featuredImage: post.image ? { uri: post.image } : null,
      contentBlocks: contentBlocks.length > 0 ? contentBlocks : [{ type: 'paragraph', text: '', id: Date.now() }],
    });
    setModalVisible(true);
  };

  const addContentBlock = (type) => {
    const newBlock = {
      type,
      text: '',
      src: '',
      caption: '',
      items: [],
      id: Date.now(),
    };
    setFormData(prev => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, newBlock],
    }));
  };

  const updateContentBlock = (blockId, field, value) => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map(block =>
        block.id === blockId ? { ...block, [field]: value } : block
      ),
    }));
  };

  const deleteContentBlock = (blockId) => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter(block => block.id !== blockId),
    }));
  };

  const moveContentBlock = (blockId, direction) => {
    setFormData(prev => {
      const blocks = [...prev.contentBlocks];
      const index = blocks.findIndex(block => block.id === blockId);
      
      if (direction === 'up' && index > 0) {
        [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
      } else if (direction === 'down' && index < blocks.length - 1) {
        [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
      }
      
      return { ...prev, contentBlocks: blocks };
    });
  };

  const pickImageForBlock = async (blockId) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to select images.');
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
    }
  };

  const pickFeaturedImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData(prev => ({ ...prev, featuredImage: result.assets[0] }));
    }
  };

  const addListItem = (blockId) => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map(block =>
        block.id === blockId 
          ? { ...block, items: [...(block.items || []), ''] }
          : block
      ),
    }));
  };

  const updateListItem = (blockId, itemIndex, value) => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map(block =>
        block.id === blockId 
          ? { 
              ...block, 
              items: block.items.map((item, index) => 
                index === itemIndex ? value : item
              )
            }
          : block
      ),
    }));
  };

  const removeListItem = (blockId, itemIndex) => {
    setFormData(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map(block =>
        block.id === blockId 
          ? { 
              ...block, 
              items: block.items.filter((_, index) => index !== itemIndex)
            }
          : block
      ),
    }));
  };

const submitPost = async () => {
  if (!formData.title.trim() || !formData.category.trim()) {
    Alert.alert('Error', 'Please fill in title and category');
    return;
  }

  if (!formData.featuredImage) {
    Alert.alert('Error', 'Please select a featured image');
    return;
  }

  const hasContent = formData.contentBlocks.some(block => {
    if (block.type === 'list') {
      return block.items && block.items.length > 0 && block.items.some(item => item.trim());
    }
    return block.text && block.text.trim();
  });

  if (!hasContent) {
    Alert.alert('Error', 'Please add some content to your post');
    return;
  }

  try {
    setSubmitting(true);
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title.trim());
    formDataToSend.append('category', formData.category.trim());

    // Add featured image
    formDataToSend.append('image', {
      uri: formData.featuredImage.uri,
      type: 'image/jpeg',
      name: 'featured-image.jpg',
    });

    // Process content blocks and convert to the required format
    const processedContent = [];
    let imageCounter = 0;

    for (const block of formData.contentBlocks) {
      if (block.type === 'image' && block.imageUri) {
        // Add image to FormData
        formDataToSend.append(`content-image-${imageCounter}`, {
          uri: block.imageUri,
          type: 'image/jpeg',
          name: `content-image-${imageCounter}.jpg`,
        });
        
        processedContent.push({
          type: 'image',
          src: `content-image-${imageCounter}`, // This will be replaced with actual URL on server
          caption: block.caption || '',
        });
        imageCounter++;
      } else if (block.type === 'list' && block.items && block.items.length > 0) {
        const filteredItems = block.items.filter(item => item.trim());
        if (filteredItems.length > 0) {
          processedContent.push({
            type: 'list',
            items: filteredItems,
          });
        }
      } else if ((block.type === 'paragraph' || block.type === 'header') && block.text && block.text.trim()) {
        processedContent.push({
          type: block.type,
          text: block.text.trim(),
        });
      }
    }

    // FIXED: Send the array directly as a JSON string, don't double-stringify
    formDataToSend.append('content', JSON.stringify(processedContent));

    console.log('Sending content:', processedContent); // Debug log

    let response;
    if (editingPost) {
      response = await axios.patch(`/api/posts/${editingPost._id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      response = await axios.post('/api/posts', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    if (response.data.success) {
      Alert.alert('Success', editingPost ? 'Post updated successfully' : 'Post created successfully');
      setModalVisible(false);
      resetForm();
      await fetchInitialData();
    }
  } catch (error) {
    console.error('Error submitting post:', error);
    console.error('Error response:', error.response?.data); // More detailed error logging
    Alert.alert('Error', error.response?.data?.message || 'Failed to submit post');
  } finally {
    setSubmitting(false);
  }
};

  const deletePost = (postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(postId) }
      ]
    );
  };

  const confirmDelete = async (postId) => {
    try {
      const response = await axios.delete(`/api/posts/${postId}`);
      if (response.data.success) {
        Alert.alert('Success', 'Post deleted successfully');
        await fetchInitialData();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post');
    }
  };

  const renderContentBlock = (block, index) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <View key={block.id} style={styles.contentBlock}>
            <View style={styles.blockHeader}>
              <Ionicons name="document-text" size={20} color="#666" />
              <Text style={styles.blockTitle}>Paragraph</Text>
              <View style={styles.blockActions}>
                <TouchableOpacity
                  onPress={() => moveContentBlock(block.id, 'up')}
                  disabled={index === 0}
                  style={[styles.blockAction, index === 0 && styles.disabledAction]}
                >
                  <Ionicons name="chevron-up" size={16} color={index === 0 ? '#ccc' : '#666'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => moveContentBlock(block.id, 'down')}
                  disabled={index === formData.contentBlocks.length - 1}
                  style={[styles.blockAction, index === formData.contentBlocks.length - 1 && styles.disabledAction]}
                >
                  <Ionicons name="chevron-down" size={16} color={index === formData.contentBlocks.length - 1 ? '#ccc' : '#666'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteContentBlock(block.id)}
                  style={styles.blockAction}
                >
                  <Ionicons name="trash" size={16} color="#DC3545" />
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={[styles.textInput, styles.paragraphInput]}
              value={block.text}
              onChangeText={(text) => updateContentBlock(block.id, 'text', text)}
              placeholder="Write your paragraph here..."
              placeholderTextColor="#999"
              multiline
              textAlignVertical="top"
            />
          </View>
        );

      case 'header':
        return (
          <View key={block.id} style={styles.contentBlock}>
            <View style={styles.blockHeader}>
              <Ionicons name="text" size={20} color="#666" />
              <Text style={styles.blockTitle}>Header</Text>
              <View style={styles.blockActions}>
                <TouchableOpacity
                  onPress={() => moveContentBlock(block.id, 'up')}
                  disabled={index === 0}
                  style={[styles.blockAction, index === 0 && styles.disabledAction]}
                >
                  <Ionicons name="chevron-up" size={16} color={index === 0 ? '#ccc' : '#666'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => moveContentBlock(block.id, 'down')}
                  disabled={index === formData.contentBlocks.length - 1}
                  style={[styles.blockAction, index === formData.contentBlocks.length - 1 && styles.disabledAction]}
                >
                  <Ionicons name="chevron-down" size={16} color={index === formData.contentBlocks.length - 1 ? '#ccc' : '#666'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteContentBlock(block.id)}
                  style={styles.blockAction}
                >
                  <Ionicons name="trash" size={16} color="#DC3545" />
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={[styles.textInput, styles.headerInput]}
              value={block.text}
              onChangeText={(text) => updateContentBlock(block.id, 'text', text)}
              placeholder="Enter header text..."
              placeholderTextColor="#999"
            />
          </View>
        );

      case 'image':
        return (
          <View key={block.id} style={styles.contentBlock}>
            <View style={styles.blockHeader}>
              <Ionicons name="image" size={20} color="#666" />
              <Text style={styles.blockTitle}>Image</Text>
              <View style={styles.blockActions}>
                <TouchableOpacity
                  onPress={() => moveContentBlock(block.id, 'up')}
                  disabled={index === 0}
                  style={[styles.blockAction, index === 0 && styles.disabledAction]}
                >
                  <Ionicons name="chevron-up" size={16} color={index === 0 ? '#ccc' : '#666'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => moveContentBlock(block.id, 'down')}
                  disabled={index === formData.contentBlocks.length - 1}
                  style={[styles.blockAction, index === formData.contentBlocks.length - 1 && styles.disabledAction]}
                >
                  <Ionicons name="chevron-down" size={16} color={index === formData.contentBlocks.length - 1 ? '#ccc' : '#666'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteContentBlock(block.id)}
                  style={styles.blockAction}
                >
                  <Ionicons name="trash" size={16} color="#DC3545" />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={() => pickImageForBlock(block.id)}
            >
              {block.imageUri ? (
                <Image source={{ uri: block.imageUri }} style={styles.selectedBlockImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image" size={48} color="#ccc" />
                  <Text style={styles.imagePlaceholderText}>Tap to select image</Text>
                </View>
              )}
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              value={block.caption}
              onChangeText={(text) => updateContentBlock(block.id, 'caption', text)}
              placeholder="Image caption (optional)"
              placeholderTextColor="#999"
            />
          </View>
        );

      case 'list':
        return (
          <View key={block.id} style={styles.contentBlock}>
            <View style={styles.blockHeader}>
              <Ionicons name="list" size={20} color="#666" />
              <Text style={styles.blockTitle}>List</Text>
              <View style={styles.blockActions}>
                <TouchableOpacity
                  onPress={() => moveContentBlock(block.id, 'up')}
                  disabled={index === 0}
                  style={[styles.blockAction, index === 0 && styles.disabledAction]}
                >
                  <Ionicons name="chevron-up" size={16} color={index === 0 ? '#ccc' : '#666'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => moveContentBlock(block.id, 'down')}
                  disabled={index === formData.contentBlocks.length - 1}
                  style={[styles.blockAction, index === formData.contentBlocks.length - 1 && styles.disabledAction]}
                >
                  <Ionicons name="chevron-down" size={16} color={index === formData.contentBlocks.length - 1 ? '#ccc' : '#666'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteContentBlock(block.id)}
                  style={styles.blockAction}
                >
                  <Ionicons name="trash" size={16} color="#DC3545" />
                </TouchableOpacity>
              </View>
            </View>
            {(block.items || []).map((item, itemIndex) => (
              <View key={itemIndex} style={styles.listItem}>
                <TextInput
                  style={[styles.textInput, styles.listItemInput]}
                  value={item}
                  onChangeText={(text) => updateListItem(block.id, itemIndex, text)}
                  placeholder={`List item ${itemIndex + 1}...`}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={() => removeListItem(block.id, itemIndex)}
                  style={styles.removeListItem}
                >
                  <Ionicons name="close" size={16} color="#DC3545" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addListItem}
              onPress={() => addListItem(block.id)}
            >
              <Ionicons name="add" size={16} color="#007AFF" />
              <Text style={styles.addListItemText}>Add item</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )}
      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postCategory}>{item.category}</Text>
        <View style={styles.postStats}>
          <Text style={styles.statText}>
            <Ionicons name="eye" size={14} color="#666" /> {item.viewCount}
          </Text>
          <Text style={styles.statText}>
            <Ionicons name="heart" size={14} color="#666" /> {item.likes?.length || 0}
          </Text>
          <Text style={styles.statText}>
            <Ionicons name="chatbubble" size={14} color="#666" /> {item.comments?.length || 0}
          </Text>
        </View>
        <View style={styles.postActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deletePost(item._id)}
          >
            <Ionicons name="trash" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderCategoryPicker = () => (
    <View style={styles.categoryContainer}>
      <Text style={styles.inputLabel}>Category *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              formData.category === category && styles.selectedCategory
            ]}
            onPress={() => setFormData(prev => ({ ...prev, category }))}
          >
            <Text style={[
              styles.categoryText,
              formData.category === category && styles.selectedCategoryText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  ); 

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Blog Management</Text>
          <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {renderStatCard('Posts', stats.totalPosts, 'document-text', '#007AFF')}
          {renderStatCard('Views', stats.totalViews, 'eye', '#28A745')}
          {renderStatCard('Likes', stats.totalLikes, 'heart', '#DC3545')}
          {renderStatCard('Comments', stats.totalComments, 'chatbubble', '#FFC107')}
        </View>

        {/* Posts List */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Your Posts</Text>
          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>No posts yet</Text>
              <TouchableOpacity style={styles.createFirstButton} onPress={openCreateModal}>
                <Text style={styles.createFirstButtonText}>Create your first post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={posts}
              renderItem={renderPost}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              onEndReached={loadMorePosts}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator size="small" color="#007AFF" style={styles.loadingMore} />
                ) : null
              }
            />
          )}
        </View>
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </Text>
            <TouchableOpacity onPress={submitPost} disabled={submitting}>
              <Text style={[styles.saveButton, submitting && styles.disabledButton]}>
                {submitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.title}
                onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                placeholder="Enter post title"
                placeholderTextColor="#999"
              />
            </View>

            {/* Category Picker */}
            {renderCategoryPicker()}

            {/* Featured Image */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Featured Image *</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickFeaturedImage}>
                {formData.featuredImage ? (
                  <Image source={{ uri: formData.featuredImage.uri }} style={styles.selectedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="image" size={48} color="#ccc" />
                    <Text style={styles.imagePlaceholderText}>Tap to select featured image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Content Blocks */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Content</Text>
              {formData.contentBlocks.map((block, index) => 
                renderContentBlock(block, index)
              )}
            </View>

           {/* Add Content Block Buttons */}
            <View style={styles.addBlockContainer}>
              <Text style={styles.inputLabel}>Add Content Block</Text>
              <View style={styles.addBlockButtons}>
                {blockTypes.map((blockType) => (
                  <TouchableOpacity
                    key={blockType.type}
                    style={styles.addBlockButton}
                    onPress={() => addContentBlock(blockType.type)}
                  >
                    <Ionicons name={blockType.icon} size={20} color="#007AFF" />
                    <Text style={styles.addBlockButtonText}>{blockType.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    width: (width - 55) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  postsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  postContent: {
    padding: 15,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  postCategory: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 10,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    flexDirection: 'row',
    alignItems: 'center',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 0.48,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#DC3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  loadingMore: {
    marginVertical: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    color: '#ccc',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  paragraphInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  headerInput: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  imagePickerButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  selectedBlockImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  contentBlock: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  blockActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockAction: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 5,
  },
  disabledAction: {
    opacity: 0.5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  listItemInput: {
    flex: 1,
    marginRight: 10,
  },
  removeListItem: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  addListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  addListItemText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
  addBlockContainer: {
    marginBottom: 20,
  },
  addBlockButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  addBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    flex: 0.48,
    justifyContent: 'center',
  },
  addBlockButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default BlogManagement;