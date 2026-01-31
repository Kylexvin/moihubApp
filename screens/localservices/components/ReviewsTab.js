// screens/localservices/components/ReviewsTab.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import Theme from '../../theme/Theme';

const { width } = Dimensions.get('window');
const { Colors, Typography, Spacing, BorderRadius } = Theme;

const  ReviewsTab = ({ 
  providerId,
  providerName,
  token,
  renderStars,
  formatTimeAgo,
  navigation
}) => {
  // State for reviews data
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [distribution, setDistribution] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  // Write review state
  const [writeReviewModal, setWriteReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch reviews data
  const fetchReviews = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch reviews for this provider
      const response = await axios.get(
        `/api/services/reviews/providers/${providerId}/reviews?page=${page}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      const data = response.data.data;
      
      if (isRefreshing || page === 1) {
        setReviews(data.reviews || []);
      } else {
        setReviews(prev => [...prev, ...(data.reviews || [])]);
      }

      // Update stats
      if (data.summary) {
        setStats({
          averageRating: data.summary.average || 0,
          totalReviews: data.summary.total || 0,
          ratingBreakdown: calculateRatingBreakdown(data.summary.distribution)
        });
        setDistribution(data.summary.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
      }

      setHasMore(data.reviews?.length === 10);

    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [providerId, token, page]);

  // Check if user has already reviewed
  const checkUserReviewStatus = useCallback(async () => {
    try {
      const response = await axios.get(
        `/api/services/reviews/check/${providerId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      const data = response.data.data;
      setHasUserReviewed(data.hasReviewed);
      if (data.review) {
        setUserReview(data.review);
      }
    } catch (error) {
      console.error('Error checking review status:', error);
    }
  }, [providerId, token]);

  // Calculate rating breakdown from distribution
  const calculateRatingBreakdown = (distribution) => {
    if (!distribution) return Array(5).fill().map((_, i) => ({
      rating: 5 - i,
      count: 0,
      percentage: 0
    }));

    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    return [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: distribution[rating] || 0,
      percentage: total > 0 ? Math.round((distribution[rating] || 0) / total * 100) : 0
    }));
  };

  useEffect(() => {
    fetchReviews();
    checkUserReviewStatus();
  }, [fetchReviews, checkUserReviewStatus]);

  const onRefresh = () => {
    setPage(1);
    fetchReviews(true);
    checkUserReviewStatus();
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const handleWriteReview = () => {
    if (hasUserReviewed) {
      Alert.alert(
        'Already Reviewed',
        'You have already reviewed this provider. Would you like to edit your review?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Edit Review', 
            onPress: () => {
              // Pre-fill with existing review
              setNewReview({
                rating: userReview?.rating || 0,
                comment: userReview?.comment || '',
              });
              setWriteReviewModal(true);
            }
          }
        ]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWriteReviewModal(true);
  };

  const handleStarSelect = (rating) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNewReview({ ...newReview, rating });
  };

  const submitReview = async () => {
    if (newReview.rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    if (!newReview.comment.trim()) {
      Alert.alert('Comment Required', 'Please write a comment');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);

    try {
      let response;

      if (hasUserReviewed && userReview) {
        // Update existing review
        response = await axios.put(
          `/api/services/reviews/reviews/${userReview.id}`,
          {
            rating: newReview.rating,
            comment: newReview.comment
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }
        );
      } else {
        // Create new review
        response = await axios.post(
          `/api/services/reviews/providers/${providerId}/reviews`,
          {
            rating: newReview.rating,
            comment: newReview.comment
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }
        );
      }

      // Success
      Alert.alert(
        'Success!', 
        hasUserReviewed ? 'Your review has been updated.' : 'Thank you for your review!'
      );

      // Reset form and refresh data
      setNewReview({ rating: 0, comment: '' });
      setWriteReviewModal(false);
      
      // Refresh reviews and status
      setPage(1);
      await Promise.all([
        fetchReviews(),
        checkUserReviewStatus()
      ]);

    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to submit review'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = () => {
    if (!userReview) return;

    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete your review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(
                `/api/services/reviews/reviews/${userReview.id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  }
                }
              );

              Alert.alert('Deleted', 'Your review has been deleted.');
              
              // Refresh data
              setPage(1);
              await Promise.all([
                fetchReviews(),
                checkUserReviewStatus()
              ]);

            } catch (error) {
              console.error('Error deleting review:', error);
              Alert.alert('Error', 'Failed to delete review');
            }
          }
        }
      ]
    );
  };

  // ========== SKELETON LOADER ==========
  const renderSkeletonLoader = () => {
    return (
      <View style={styles.skeletonContainer}>
        {/* Skeleton for Write Review Button */}
        <View style={[styles.skeletonButton, { marginHorizontal: Spacing.lg, marginTop: Spacing.lg }]} />
        
        {/* Skeleton for Stats Section */}
        <View style={[styles.skeletonCard, { margin: Spacing.lg, marginTop: Spacing.md }]}>
          <View style={styles.skeletonRatingOverview}>
            <View style={styles.skeletonLargeText} />
            <View style={styles.skeletonStars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={styles.skeletonStar} />
              ))}
            </View>
            <View style={styles.skeletonSmallText} />
          </View>
          <View style={styles.skeletonBreakdown}>
            {[1, 2, 3, 4, 5].map((item) => (
              <View key={item} style={styles.skeletonRatingRow}>
                <View style={styles.skeletonLabel} />
                <View style={styles.skeletonBar} />
                <View style={styles.skeletonCount} />
              </View>
            ))}
          </View>
        </View>
        
        {/* Skeleton for Reviews Title */}
        <View style={[styles.skeletonTitle, { marginHorizontal: Spacing.lg, marginBottom: Spacing.md }]} />
        
        {/* Skeleton for Review Cards */}
        {[1, 2, 3].map((item) => (
          <View key={item} style={[styles.skeletonReviewCard, { marginHorizontal: Spacing.lg, marginBottom: Spacing.md }]}>
            <View style={styles.skeletonReviewHeader}>
              <View style={styles.skeletonAvatar} />
              <View style={styles.skeletonReviewInfo}>
                <View style={styles.skeletonAuthor} />
                <View style={styles.skeletonDate} />
              </View>
            </View>
            <View style={styles.skeletonStars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={styles.skeletonStar} />
              ))}
            </View>
            <View style={styles.skeletonComment} />
            <View style={[styles.skeletonComment, { width: '60%' }]} />
          </View>
        ))}
      </View>
    );
  };

  // ========== MODAL ==========
  const renderWriteReviewModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={writeReviewModal}
      onRequestClose={() => setWriteReviewModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {hasUserReviewed ? 'Edit Your Review' : 'Write a Review'}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setWriteReviewModal(false)}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Your Rating</Text>
              <View style={styles.starSelector}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleStarSelect(star)}
                  >
                    <Ionicons
                      name={star <= newReview.rating ? "star" : "star-outline"}
                      size={32}
                      color={Colors.secondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingText}>
                {newReview.rating === 0 ? 'Select stars' : `${newReview.rating} out of 5`}
              </Text>
            </View>

            {/* Comment */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Your Review</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your experience..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={4}
                value={newReview.comment}
                onChangeText={(text) => setNewReview({ ...newReview, comment: text })}
              />
            </View>

            {/* Tips */}
            <View style={styles.tipsSection}>
              <Ionicons name="bulb-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.tipsText}>
                Be specific about what you liked or suggest improvements. Your feedback helps others!
              </Text>
            </View>

            {/* Delete option for existing review */}
            {hasUserReviewed && (
              <TouchableOpacity 
                style={styles.deleteReviewButton}
                onPress={deleteReview}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                <Text style={styles.deleteReviewText}>Delete Review</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[
                styles.submitButton,
                (newReview.rating === 0 || !newReview.comment.trim()) && styles.submitButtonDisabled
              ]}
              onPress={submitReview}
              disabled={newReview.rating === 0 || !newReview.comment.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.text} />
              ) : (
                <>
                  <Ionicons name="send" size={20} color={Colors.text} />
                  <Text style={styles.submitButtonText}>
                    {hasUserReviewed ? 'Update Review' : 'Submit Review'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ========== MAIN RENDER ==========
  if (loading && !refreshing && reviews.length === 0) {
    return renderSkeletonLoader();
  }

  return (
    <View style={styles.container}>
      {/* Write Review Button */}
      <TouchableOpacity 
        style={styles.writeReviewButton}
        onPress={handleWriteReview}
      >
        <Ionicons name="create-outline" size={20} color={Colors.text} />
        <Text style={styles.writeReviewText}>
          {hasUserReviewed ? 'Edit Your Review' : 'Write a Review'}
        </Text>
      </TouchableOpacity>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
          
          if (isCloseToBottom && hasMore && !loading) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.ratingOverview}>
            <Text style={styles.averageRating}>
              {stats.averageRating.toFixed(1)}
            </Text>
            <View style={styles.starsContainer}>
              {renderStars(stats.averageRating)}
            </View>
            <Text style={styles.totalReviews}>
              {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
            </Text>
          </View>
          
         
        </View>
        
        {/* Reviews List */}
        <View style={styles.reviewsContainer}>
          <Text style={styles.reviewsTitle}>Customer Reviews</Text>
          
          {reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>No reviews yet</Text>
              <Text style={styles.emptyStateSubtext}>Be the first to leave a review</Text>
            </View>
          ) : (
            <>
              {reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAuthor}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View style={styles.reviewInfo}>
                        <Text style={styles.authorName}>
                          {review.user?.name || 'Anonymous'}
                        </Text>
                        <Text style={styles.reviewDate}>
                          {review.timeAgo || formatTimeAgo(review.date)}
                        </Text>
                      </View>
                    </View>
                    
                    {review.verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.reviewStars}>
                    {renderStars(review.rating)}
                  </View>
                  
                  {review.comment && (
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  )}
                  
                  {/* Provider Reply */}
                  {review.providerReply?.text && (
                    <View style={styles.providerReplyContainer}>
                      <View style={styles.providerReplyHeader}>
                        <Ionicons name="business" size={14} color={Colors.textSecondary} />
                        <Text style={styles.providerReplyTitle}>
                          {providerName} replied:
                        </Text>
                        <Text style={styles.providerReplyDate}>
                          {formatTimeAgo(review.providerReply.repliedAt)}
                        </Text>
                      </View>
                      <Text style={styles.providerReplyText}>
                        {review.providerReply.text}
                      </Text>
                    </View>
                  )}
                  
                  {/* User's own review indicator */}
                  {review.id === userReview?.id && (
                    <View style={styles.yourReviewBadge}>
                      <Ionicons name="person-circle" size={14} color={Colors.primary} />
                      <Text style={styles.yourReviewText}>Your review</Text>
                    </View>
                  )}
                </View>
              ))}
              
              {/* Load More Indicator */}
              {hasMore && (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadMoreText}>Loading more reviews...</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Write Review Modal */}
      {renderWriteReviewModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  writeReviewText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 16,
  },
  statsContainer: {
    backgroundColor: Colors.card,
    margin: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  ratingOverview: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  averageRating: {
    ...Typography.h1,
    color: Colors.text,
    fontSize: 48,
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: Spacing.sm,
  },
  totalReviews: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  ratingBreakdown: {
    gap: Spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ratingLabel: {
    ...Typography.bodySmall,
    color: Colors.text,
    width: 60,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBar: {
    height: '100%',
    backgroundColor: Colors.secondary,
  },
  ratingCount: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    width: 30,
    textAlign: 'right',
  },
  reviewsContainer: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  reviewsTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyStateSubtext: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  reviewCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    ...Typography.button,
    color: Colors.text,
  },
  reviewInfo: {
    flex: 1,
  },
  authorName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  reviewDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.success,
  },
  reviewStars: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  reviewComment: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  providerReplyContainer: {
    backgroundColor: Colors.card + '80',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  providerReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  providerReplyTitle: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    flex: 1,
  },
  providerReplyDate: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
  },
  providerReplyText: {
    ...Typography.body,
    color: Colors.text,
    fontSize: 14,
    lineHeight: 18,
  },
  yourReviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  yourReviewText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  loadMoreText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  
  // ========== SKELETON STYLES ==========
  skeletonContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skeletonButton: {
    height: 50,
    backgroundColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
  },
  skeletonCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  skeletonRatingOverview: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  skeletonLargeText: {
    width: 80,
    height: 48,
    backgroundColor: Colors.cardBorder,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  skeletonStars: {
    flexDirection: 'row',
    marginVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  skeletonStar: {
    width: 20,
    height: 20,
    backgroundColor: Colors.cardBorder,
    borderRadius: 4,
  },
  skeletonSmallText: {
    width: 120,
    height: 16,
    backgroundColor: Colors.cardBorder,
    borderRadius: BorderRadius.sm,
  },
  skeletonBreakdown: {
    gap: Spacing.sm,
  },
  skeletonRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  skeletonLabel: {
    width: 60,
    height: 16,
    backgroundColor: Colors.cardBorder,
    borderRadius: BorderRadius.sm,
  },
  skeletonBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.cardBorder,
    borderRadius: 4,
  },
  skeletonCount: {
    width: 30,
    height: 16,
    backgroundColor: Colors.cardBorder,
    borderRadius: BorderRadius.sm,
  },
  skeletonTitle: {
    height: 24,
    backgroundColor: Colors.cardBorder,
    borderRadius: BorderRadius.sm,
  },
  skeletonReviewCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  skeletonReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBorder,
    marginRight: Spacing.md,
  },
  skeletonReviewInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  skeletonAuthor: {
    width: 120,
    height: 16,
    backgroundColor: Colors.cardBorder,
    borderRadius: BorderRadius.sm,
  },
  skeletonDate: {
    width: 80,
    height: 14,
    backgroundColor: Colors.cardBorder,
    borderRadius: BorderRadius.sm,
  },
  skeletonComment: {
    width: '100%',
    height: 16,
    backgroundColor: Colors.cardBorder,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  
  // ========== MODAL STYLES ==========
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    padding: Spacing.lg,
    maxHeight: 500,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  ratingLabel: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  starSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ratingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  commentInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tipsSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  deleteReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.danger + '20',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  deleteReviewText: {
    ...Typography.button,
    color: Colors.danger,
    fontSize: 14,
  },
  modalFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ReviewsTab;