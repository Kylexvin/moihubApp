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
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '../../theme/Theme';

const { Colors, Typography, Spacing, BorderRadius, Shadows } = Theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ReviewsManagement = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingReply, setEditingReply] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter options
  const filterOptions = [
    { id: 'all', label: 'All Reviews', icon: 'star-outline' },
    { id: 'pending', label: 'Pending', icon: 'time-outline' },
    { id: 'approved', label: 'Approved', icon: 'checkmark-circle-outline' }
  ];

  useEffect(() => {
    fetchBusinessReviews();
    fetchReviewStats();
  }, []);

  useEffect(() => {
    if (page === 1) {
      fetchBusinessReviews(1, true);
    }
  }, [filter]);

  const fetchBusinessReviews = async (pageNum = 1, reset = false) => {
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
        setTotalCount(response.data.data.total || 0);
        
        if (reset || pageNum === 1) {
          setReviews(newReviews);
        } else {
          setReviews(prev => [...prev, ...newReviews]);
        }
        
        setHasMore(newReviews.length === 10);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Fetch business reviews error:', error);
      if (!reset) {
        Alert.alert('Error', 'Failed to load reviews');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchReviewStats = async () => {
    try {
      // You'll need to add this endpoint or use providerId from context
      const providerId = 'current'; // This should come from auth context
      const response = await axios.get(`/api/services/reviews/stats/${providerId}`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchBusinessReviews(1, true);
    fetchReviewStats();
  }, []);

  const handleReplyToReview = async () => {
    if (!replyText.trim() || replyText.trim().length < 2) {
      Alert.alert('Error', 'Reply must be at least 2 characters');
      return;
    }

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const endpoint = `/api/services/business/reviews/${replyingTo}/reply`;
      
      let response;
      if (editingReply) {
        response = await axios.put(endpoint, { reply: replyText.trim() });
      } else {
        response = await axios.post(endpoint, { reply: replyText.trim() });
      }

      if (response.data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Update the review in local state
        setReviews(prev => prev.map(review => 
          review.id === replyingTo 
            ? { 
                ...review, 
                providerReply: {
                  text: replyText.trim(),
                  repliedAt: new Date().toISOString()
                }
              }
            : review
        ));
        
        setShowReplyModal(false);
        setReplyText('');
        setReplyingTo(null);
        setEditingReply(false);
        
        Alert.alert('Success', editingReply ? 'Reply updated' : 'Reply added');
      }
    } catch (error) {
      console.error('Reply error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save reply');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReply = async (reviewId) => {
    Alert.alert(
      'Delete Reply',
      'Are you sure you want to delete this reply?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await axios.delete(`/api/services/business/reviews/${reviewId}/reply`);
              
              if (response.data.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                
                // Update local state
                setReviews(prev => prev.map(review => 
                  review.id === reviewId 
                    ? { ...review, providerReply: null }
                    : review
                ));
                
                Alert.alert('Success', 'Reply deleted');
              }
            } catch (error) {
              console.error('Delete reply error:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete reply');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleModerateReview = async (reviewId, action) => {
    try {
      setLoading(true);
      const response = await axios.put(`/api/services/business/reviews/${reviewId}/moderate`, {
        action
      });

      if (response.data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (action === 'reject') {
          // Remove from list
          setReviews(prev => prev.filter(r => r.id !== reviewId));
          setTotalCount(prev => prev - 1);
        } else {
          // Update status
          setReviews(prev => prev.map(review => 
            review.id === reviewId 
              ? { ...review, isApproved: true }
              : review
          ));
        }
        
        Alert.alert('Success', action === 'approve' ? 'Review approved' : 'Review rejected');
        fetchReviewStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Moderate review error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to moderate review');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading && !refreshing) {
      fetchBusinessReviews(page + 1);
    }
  };

  const openReplyModal = (review, edit = false) => {
    setReplyingTo(review.id);
    if (edit && review.providerReply) {
      setReplyText(review.providerReply.text);
      setEditingReply(true);
    } else {
      setReplyText('');
      setEditingReply(false);
    }
    setShowReplyModal(true);
  };

  const renderStars = (rating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={14}
            color={Colors.warning}
          />
        ))}
      </View>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderHeader = () => (
    <LinearGradient
      colors={[Colors.primary, Colors.primaryDark]}
      style={styles.header}
    >
      <View style={styles.headerTop}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews Management</Text>
        <View style={styles.placeholder} />
      </View>

      {stats && (
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{stats.summary.average.toFixed(1)}</Text>
            <View style={styles.headerStars}>
              {renderStars(Math.round(stats.summary.average))}
            </View>
            <Text style={styles.headerStatLabel}>Average Rating</Text>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatValue}>{stats.summary.total}</Text>
            <Text style={styles.headerStatLabel}>Total Reviews</Text>
            <Text style={styles.headerStatSubtext}>{stats.recentReviews} this month</Text>
          </View>
        </View>
      )}
    </LinearGradient>
  );

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      {filterOptions.map((option) => {
        const isActive = filter === option.id;
        const count = option.id === 'all' 
          ? totalCount 
          : option.id === 'pending'
          ? reviews.filter(r => !r.isApproved).length
          : reviews.filter(r => r.isApproved).length;

        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.filterTab,
              isActive && styles.filterTabActive
            ]}
            onPress={() => {
              setFilter(option.id);
              setPage(1);
            }}
          >
            <Ionicons 
              name={option.icon} 
              size={18} 
              color={isActive ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.filterTabText,
              isActive && styles.filterTabTextActive
            ]}>
              {option.label}
            </Text>
            {count > 0 && (
              <View style={[
                styles.filterBadge,
                isActive && styles.filterBadgeActive
              ]}>
                <Text style={[
                  styles.filterBadgeText,
                  isActive && styles.filterBadgeTextActive
                ]}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderReviewCard = (review) => (
    <View key={review.id} style={styles.reviewCard}>
      {/* Review Header */}
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUser}>
          {review.user.avatar ? (
            <Image source={{ uri: review.user.avatar }} style={styles.reviewAvatar} />
          ) : (
            <View style={styles.reviewAvatarPlaceholder}>
              <Text style={styles.reviewAvatarText}>
                {review.user.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.reviewUserInfo}>
            <Text style={styles.reviewUserName}>{review.user.name}</Text>
            <View style={styles.reviewMeta}>
              {renderStars(review.rating)}
              <Text style={styles.reviewTime}>{formatDate(review.date)}</Text>
            </View>
          </View>
        </View>
        
        {!review.isApproved && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Pending</Text>
          </View>
        )}
      </View>

      {/* Review Comment */}
      <Text style={styles.reviewComment}>{review.comment}</Text>

      {/* Provider Reply Section */}
      {review.providerReply ? (
        <View style={styles.replyContainer}>
          <LinearGradient
            colors={[Colors.primary + '10', Colors.primary + '05']}
            style={styles.replyGradient}
          >
            <View style={styles.replyHeader}>
              <View style={styles.replyUser}>
                <Ionicons name="business" size={14} color={Colors.primary} />
                <Text style={styles.replyTitle}>Your Reply</Text>
              </View>
              <View style={styles.replyActions}>
                <TouchableOpacity 
                  onPress={() => openReplyModal(review, true)}
                  style={styles.replyActionButton}
                >
                  <Ionicons name="create-outline" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDeleteReply(review.id)}
                  style={styles.replyActionButton}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.replyText}>{review.providerReply.text}</Text>
            <Text style={styles.replyDate}>
              {formatDate(review.providerReply.repliedAt)}
            </Text>
          </LinearGradient>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.replyButton}
          onPress={() => openReplyModal(review)}
        >
          <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
          <Text style={styles.replyButtonText}>Reply to Review</Text>
        </TouchableOpacity>
      )}

      {/* Moderation Actions for Pending Reviews */}
      {!review.isApproved && (
        <View style={styles.moderationContainer}>
          <TouchableOpacity 
            style={[styles.moderationButton, styles.approveButton]}
            onPress={() => handleModerateReview(review.id, 'approve')}
          >
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.moderationButton, styles.rejectButton]}
            onPress={() => handleModerateReview(review.id, 'reject')}
          >
            <Ionicons name="close-circle" size={18} color={Colors.error} />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderReplyModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showReplyModal}
      onRequestClose={() => {
        setShowReplyModal(false);
        setReplyText('');
        setReplyingTo(null);
        setEditingReply(false);
      }}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingReply ? 'Edit Reply' : 'Reply to Review'}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setShowReplyModal(false);
                setReplyText('');
                setReplyingTo(null);
                setEditingReply(false);
              }}
            >
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.replyInput}
            value={replyText}
            onChangeText={setReplyText}
            placeholder="Write your reply..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoFocus
          />

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => {
                setShowReplyModal(false);
                setReplyText('');
                setReplyingTo(null);
                setEditingReply(false);
              }}
              disabled={saving}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.modalSubmitButton,
                (!replyText.trim() || replyText.trim().length < 2) && styles.modalSubmitDisabled
              ]}
              onPress={handleReplyToReview}
              disabled={saving || !replyText.trim() || replyText.trim().length < 2}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.modalSubmitText}>
                  {editingReply ? 'Update Reply' : 'Post Reply'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading && reviews.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {renderHeader()}
      {renderFilterTabs()}
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        onScroll={({ nativeEvent }) => {
          const isCloseToBottom = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= 
            nativeEvent.contentSize.height - 100;
          if (isCloseToBottom) loadMore();
        }}
        scrollEventThrottle={400}
      >
        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="star-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptyText}>
              {filter === 'pending' 
                ? 'No pending reviews to moderate'
                : 'When customers review your business, they\'ll appear here'}
            </Text>
          </View>
        ) : (
          <>
            {reviews.map(renderReviewCard)}
            {hasMore && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            )}
          </>
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderReplyModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  headerStats: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  headerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  headerStatDivider: {
    width: 1,
    backgroundColor: Colors.white + '30',
    marginHorizontal: Spacing.md,
  },
  headerStatValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  headerStars: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  headerStatLabel: {
    fontSize: 12,
    color: Colors.white + '80',
  },
  headerStatSubtext: {
    fontSize: 10,
    color: Colors.white + '60',
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    marginHorizontal: 4,
    borderRadius: BorderRadius.round,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: Colors.primary + '10',
  },
  filterTabText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: Colors.cardBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: Colors.primary,
  },
  filterBadgeText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterBadgeTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadingMore: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.small,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  reviewAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewTime: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  pendingBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  pendingBadgeText: {
    color: Colors.warning,
    fontSize: 11,
    fontWeight: '600',
  },
  reviewComment: {
    ...Typography.body,
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  replyContainer: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  replyGradient: {
    padding: Spacing.md,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  replyUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyTitle: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  replyActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  replyActionButton: {
    padding: 4,
  },
  replyText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  replyDate: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  replyButtonText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  moderationContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  moderationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  approveButton: {
    backgroundColor: Colors.success + '10',
  },
  approveButtonText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: Colors.error + '10',
  },
  rejectButtonText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  replyInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    color: Colors.text,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: Spacing.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalSubmitDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});

export default ReviewsManagement;