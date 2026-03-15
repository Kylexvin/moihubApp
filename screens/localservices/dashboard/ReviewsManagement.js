// screens/localservices/dashboard/ReviewsManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  FlatList
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// Dark Green Theme
const DarkGreenTheme = {
  primary: '#2E7D5E',      // Emerald Green
  primaryDark: '#1A4D3A',   // Deep Forest
  primaryLight: '#A7F0D0',  // Mint
  accent: '#D4AF37',        // Warm Gold
  background: '#0A1A12',    // Very Dark Green
  surface: '#142B1F',       // Dark Green Surface
  card: '#1E3A2A',          // Card Background
  text: '#FFFFFF',          // White
  textSecondary: '#8FBFA0', // Sage Green
  textMuted: '#5A7A6A',     // Muted Green
  border: '#2C4A38',        // Border Green
  success: '#2E7D5E',
  warning: '#D4A017',
  error: '#B22222',
};

const ReviewsManagement = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingReply, setEditingReply] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const filterOptions = [
    { id: 'all', label: 'All', icon: 'star-outline' },
    { id: 'pending', label: 'Pending', icon: 'time-outline' },
    { id: 'approved', label: 'Approved', icon: 'checkmark-circle-outline' }
  ];

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    if (page === 1) {
      fetchReviews(1, true);
    }
  }, [filter]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / 86400000);
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const fetchReviews = async (pageNum = 1, reset = false) => {
    try {
      if (reset) setLoading(true);
      
      const response = await axios.get('/api/services/business/reviews', {
        params: { 
          page: pageNum, 
          limit: 10,
          status: filter !== 'all' ? filter : undefined
        }
      });
      
      if (response.data.success) {
        const newReviews = response.data.data.reviews || [];
        
        if (reset || pageNum === 1) {
          setReviews(newReviews);
        } else {
          setReviews(prev => [...prev, ...newReviews]);
        }
        
        setHasMore(newReviews.length === 10);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Fetch reviews error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchReviews(1, true);
  }, []);

const handleReplyToReview = async () => {
  const trimmedReply = replyText?.trim() || '';
  
  if (!trimmedReply || trimmedReply.length < 2) {
    Alert.alert('Error', 'Reply must be at least 2 characters');
    return;
  }

  try {
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // CORRECT endpoint from your routes
    const endpoint = `/api/services/business/reviews/${replyingTo}/reply`;
    
    // IMPORTANT: Check if a reply actually exists
    // If there's no providerReply, it's a NEW reply (POST)
    // If there is a providerReply, it's an EDIT (PUT)
    const hasExistingReply = selectedReview?.providerReply?.text ? true : false;
    
    console.log('Debug:', {
      hasExistingReply,
      editingReply: editingReply,
      method: hasExistingReply ? 'put' : 'post'
    });
    
    const response = await axios({
      method: hasExistingReply ? 'put' : 'post',
      url: endpoint,
      data: { reply: trimmedReply }
    });

    if (response.data.success) {
      // Update the review in state
      setReviews(prev => prev.map(review => 
        review.id === replyingTo 
          ? { 
              ...review, 
              providerReply: {
                text: trimmedReply,
                repliedAt: new Date().toISOString(),
                ...(hasExistingReply ? { updatedAt: new Date().toISOString() } : {})
              }
            }
          : review
      ));
      
      // Reset modal state
      setShowReplyModal(false);
      setReplyText('');
      setReplyingTo(null);
      setEditingReply(false);
      setSelectedReview(null);
      
      Alert.alert('Success', hasExistingReply ? 'Reply updated' : 'Reply posted');
    }
  } catch (error) {
    console.error('Reply error:', error);
    
    if (error.response) {
      console.log('Error response:', error.response.data);
      Alert.alert('Error', error.response.data?.message || 'Failed to save reply');
    } else if (error.request) {
      Alert.alert('Error', 'Network error. Please check your connection.');
    } else {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  } finally {
    setSaving(false);
  }
};

// Fix the handleReplyPress function
const handleReplyPress = (review) => {
  // Safely set selected review with fallbacks
  const hasExistingReply = review?.providerReply?.text ? true : false;
  
  setSelectedReview({
    id: review?.id || '',
    rating: review?.rating || 0,
    comment: review?.comment || '',
    user: review?.user || { name: 'Anonymous' },
    providerReply: review?.providerReply || null
  });
  setReplyingTo(review?.id || null);
  setReplyText(review?.providerReply?.text || '');
  
  // Set editingReply based on whether a reply exists
  setEditingReply(hasExistingReply);
  setShowReplyModal(true);
  
  console.log('Reply press:', {
    hasExistingReply,
    replyText: review?.providerReply?.text
  });
};

  const handleDeleteReply = async (reviewId) => {
    Alert.alert(
      'Delete Reply',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`/api/services/business/reviews/${reviewId}/reply`);
              setReviews(prev => prev.map(review => 
                review.id === reviewId 
                  ? { ...review, providerReply: null }
                  : review
              ));
            } catch (error) {
              console.error('Delete reply error:', error);
              Alert.alert('Error', 'Failed to delete reply');
            }
          }
        }
      ]
    );
  };

  const handleModerateReview = async (reviewId, action) => {
    try {
      await axios.put(`/api/services/business/reviews/${reviewId}/moderate`, { action });
      
      if (action === 'reject') {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      } else {
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, isApproved: true }
            : review
        ));
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Moderate review error:', error);
      Alert.alert('Error', 'Failed to moderate review');
    }
  };

  const loadMore = () => {
    if (hasMore && !loading && !refreshing) {
      fetchReviews(page + 1);
    }
  };

  const renderStars = (rating, size = 14) => {
    const safeRating = rating || 0;
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= safeRating ? 'star' : 'star-outline'}
            size={size}
            color={star <= safeRating ? DarkGreenTheme.accent : DarkGreenTheme.textMuted}
          />
        ))}
      </View>
    );
  };

  const renderReviewCard = ({ item }) => (
    <View style={styles.reviewCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          {item.user?.avatar ? (
            <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={[DarkGreenTheme.primary, DarkGreenTheme.primaryDark]}
              style={styles.avatarPlaceholder}
            >
              <Text style={styles.avatarText}>
                {item.user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
          )}
          
          <View>
            <Text style={styles.userName}>{item.user?.name || 'Anonymous'}</Text>
            <View style={styles.ratingRow}>
              {renderStars(item.rating)}
              <Text style={styles.reviewTime}>{formatDate(item.date)}</Text>
            </View>
          </View>
        </View>

        {!item.isApproved && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        )}
      </View>

      {/* Comment */}
      <Text style={styles.comment}>{item.comment || ''}</Text>

      {/* Reply Section */}
      {item.providerReply ? (
        <View style={styles.replyContainer}>
          <View style={styles.replyHeader}>
            <View style={styles.replyTitleContainer}>
              <MaterialCommunityIcons name="reply" size={14} color={DarkGreenTheme.primaryLight} />
              <Text style={styles.replyTitle}>Your reply</Text>
              <Text style={styles.replyTime}>{formatDate(item.providerReply.repliedAt)}</Text>
            </View>
            <View style={styles.replyActions}>
              <TouchableOpacity 
                onPress={() => handleReplyPress(item)}
                style={styles.replyAction}
              >
                <Ionicons name="create-outline" size={16} color={DarkGreenTheme.primaryLight} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleDeleteReply(item.id)}
                style={styles.replyAction}
              >
                <Ionicons name="trash-outline" size={16} color={DarkGreenTheme.error} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.replyText}>{item.providerReply.text || ''}</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.replyButton}
          onPress={() => handleReplyPress(item)}
        >
          <MaterialCommunityIcons name="reply" size={16} color={DarkGreenTheme.primaryLight} />
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      )}

      {/* Moderation for pending */}
      {!item.isApproved && (
        <View style={styles.moderationRow}>
          <TouchableOpacity 
            style={styles.approveButton}
            onPress={() => handleModerateReview(item.id, 'approve')}
          >
            <Ionicons name="checkmark-circle" size={18} color={DarkGreenTheme.primaryLight} />
            <Text style={styles.approveText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={() => handleModerateReview(item.id, 'reject')}
          >
            <Ionicons name="close-circle" size={18} color={DarkGreenTheme.error} />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderReplyModal = () => (
    <Modal
      visible={showReplyModal}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setShowReplyModal(false);
        setReplyText('');
        setReplyingTo(null);
        setEditingReply(false);
        setSelectedReview(null);
      }}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingReply ? 'Edit Reply' : 'Reply to Review'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowReplyModal(false);
                setReplyText('');
                setReplyingTo(null);
                setEditingReply(false);
                setSelectedReview(null);
              }}>
                <Ionicons name="close" size={24} color={DarkGreenTheme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Review Preview - FIXED: Added fallbacks for undefined values */}
            {selectedReview && (
              <View style={styles.previewContainer}>
                <View style={styles.previewRating}>
                  {renderStars(selectedReview?.rating || 0, 12)}
                </View>
                <Text style={styles.previewComment}>
                  "{selectedReview?.comment || 'No comment provided'}"
                </Text>
              </View>
            )}

            {/* Reply Input */}
            <TextInput
              style={styles.replyInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Write your reply..."
              placeholderTextColor={DarkGreenTheme.textMuted}
              multiline
              numberOfLines={4}
              autoFocus
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowReplyModal(false);
                  setReplyText('');
                  setReplyingTo(null);
                  setEditingReply(false);
                  setSelectedReview(null);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (!replyText?.trim() || replyText.length < 2) && styles.submitDisabled
                ]}
                onPress={handleReplyToReview}
                disabled={!replyText?.trim() || replyText.length < 2 || saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={DarkGreenTheme.background} />
                ) : (
                  <Text style={styles.submitText}>
                    {editingReply ? 'Update' : 'Post'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="chatbubble-outline" size={48} color={DarkGreenTheme.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No Reviews Yet</Text>
      <Text style={styles.emptyText}>
        {filter === 'pending' 
          ? 'No pending reviews to moderate'
          : 'Customer reviews will appear here'}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DarkGreenTheme.primaryLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        <View style={styles.filterContainer}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.filterChip,
                filter === option.id && styles.filterChipActive
              ]}
              onPress={() => {
                setFilter(option.id);
                setPage(1);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons 
                name={option.icon} 
                size={16} 
                color={filter === option.id ? DarkGreenTheme.background : DarkGreenTheme.textSecondary} 
              />
              <Text style={[
                styles.filterText,
                filter === option.id && styles.filterTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  if (loading && reviews.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={DarkGreenTheme.background} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={DarkGreenTheme.primaryLight} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DarkGreenTheme.background} />
      
      {renderHeader()}

      <FlatList
        data={reviews}
        renderItem={renderReviewCard}
        keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={DarkGreenTheme.primaryLight}
            colors={[DarkGreenTheme.primaryLight]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={hasMore && reviews.length > 0 ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={DarkGreenTheme.primaryLight} />
          </View>
        ) : null}
      />

      {renderReplyModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkGreenTheme.background,
  },
  header: {
    backgroundColor: DarkGreenTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: DarkGreenTheme.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DarkGreenTheme.card,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkGreenTheme.primaryLight,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: DarkGreenTheme.card,
    borderWidth: 1,
    borderColor: DarkGreenTheme.border,
  },
  filterChipActive: {
    backgroundColor: DarkGreenTheme.primaryLight,
    borderColor: DarkGreenTheme.primaryLight,
  },
  filterText: {
    fontSize: 13,
    color: DarkGreenTheme.textSecondary,
  },
  filterTextActive: {
    color: DarkGreenTheme.background,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  reviewCard: {
    backgroundColor: DarkGreenTheme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: DarkGreenTheme.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: DarkGreenTheme.primaryLight,
    fontSize: 18,
    fontWeight: '700',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: DarkGreenTheme.primaryLight,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewTime: {
    fontSize: 11,
    color: DarkGreenTheme.textMuted,
  },
  pendingBadge: {
    backgroundColor: DarkGreenTheme.warning + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    color: DarkGreenTheme.warning,
    fontSize: 11,
    fontWeight: '600',
  },
  comment: {
    fontSize: 14,
    color: DarkGreenTheme.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  replyContainer: {
    backgroundColor: DarkGreenTheme.background,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  replyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyTitle: {
    fontSize: 12,
    color: DarkGreenTheme.primaryLight,
    fontWeight: '500',
  },
  replyTime: {
    fontSize: 10,
    color: DarkGreenTheme.textMuted,
  },
  replyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  replyAction: {
    padding: 2,
  },
  replyText: {
    fontSize: 13,
    color: DarkGreenTheme.textSecondary,
    lineHeight: 18,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  replyButtonText: {
    fontSize: 13,
    color: DarkGreenTheme.primaryLight,
    fontWeight: '500',
  },
  moderationRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DarkGreenTheme.border,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: DarkGreenTheme.success + '20',
  },
  approveText: {
    color: DarkGreenTheme.primaryLight,
    fontSize: 13,
    fontWeight: '500',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: DarkGreenTheme.error + '20',
  },
  rejectText: {
    color: DarkGreenTheme.error,
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: DarkGreenTheme.textSecondary,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DarkGreenTheme.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkGreenTheme.primaryLight,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: DarkGreenTheme.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DarkGreenTheme.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DarkGreenTheme.primaryLight,
  },
  previewContainer: {
    backgroundColor: DarkGreenTheme.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewRating: {
    marginBottom: 8,
  },
  previewComment: {
    fontSize: 13,
    color: DarkGreenTheme.textSecondary,
    fontStyle: 'italic',
  },
  replyInput: {
    backgroundColor: DarkGreenTheme.card,
    borderRadius: 12,
    padding: 16,
    color: DarkGreenTheme.text,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: DarkGreenTheme.card,
    alignItems: 'center',
  },
  cancelText: {
    color: DarkGreenTheme.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: DarkGreenTheme.primaryLight,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: DarkGreenTheme.background,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ReviewsManagement;