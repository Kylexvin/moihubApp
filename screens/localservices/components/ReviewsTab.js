// screens/localservices/components/ReviewsTab.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Theme from '../../theme/Theme';

const { Colors, Typography, Spacing, BorderRadius } = Theme;

const ReviewsTab = ({ reviewsData, overviewData, renderStars, formatTimeAgo }) => {
  return (
    <View style={styles.tabContent}>
      <View style={styles.reviewsHeader}>
        <View>
          <Text style={styles.tabTitle}>Customer Reviews</Text>
          <Text style={styles.tabSubtitle}>
            ⭐ {overviewData?.header?.rating || 0} • {overviewData?.tabs?.reviews?.count || 0} reviews
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <Text style={styles.sortButtonText}>Recent</Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      
      {reviewsData.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyStateText}>No reviews yet</Text>
          <Text style={styles.emptyStateSubtext}>Be the first to review this provider</Text>
        </View>
      ) : (
        reviewsData.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewRating}>
                {renderStars(review.rating)}
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              
              {review.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={styles.verifiedText}>Verified Booking</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.reviewComment}>"{review.comment}"</Text>
            
            <View style={styles.reviewFooter}>
              <Text style={styles.reviewAuthor}>— {review.author}</Text>
              {review.service && (
                <Text style={styles.reviewService}>{review.service}</Text>
              )}
            </View>
          </View>
        ))
      )}
      
      <TouchableOpacity 
        style={styles.writeReviewButton}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <Ionicons name="create-outline" size={20} color={Colors.primary} />
        <Text style={styles.writeReviewText}>Write a Review</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    padding: Spacing.lg,
  },
  tabTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  tabSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.sm,
  },
  sortButtonText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
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
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  reviewRating: {
    flex: 1,
  },
  reviewDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
  },
  verifiedText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '600',
  },
  reviewComment: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  reviewService: {
    fontSize: 11,
    color: Colors.textSecondary,
    backgroundColor: Colors.cardBorder,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  writeReviewText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
});

export default ReviewsTab;