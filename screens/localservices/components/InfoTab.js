// screens/localservices/components/InfoTab.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  RefreshControl,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import Theme from '../../theme/Theme';

const { Colors, Typography, Spacing, BorderRadius } = Theme;

// Skeleton Loading Component
const SkeletonLoader = ({ style }) => (
  <View style={[styles.skeleton, style]}>
    <View style={styles.skeletonShimmer} />
  </View>
);

// Section Skeleton Components (updated without map)
const SectionSkeleton = () => (
  <View style={styles.section}>
    <SkeletonLoader style={styles.sectionTitleSkeleton} />
    <SkeletonLoader style={styles.sectionContentSkeleton} />
    <SkeletonLoader style={styles.sectionContentSkeleton} />
    <SkeletonLoader style={styles.sectionContentSkeletonShort} />
  </View>
);

const StatsSkeleton = () => (
  <View style={styles.section}>
    <SkeletonLoader style={styles.sectionTitleSkeleton} />
    <View style={styles.statsGrid}>
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.statItem}>
          <SkeletonLoader style={styles.statValueSkeleton} />
          <SkeletonLoader style={styles.statLabelSkeleton} />
        </View>
      ))}
    </View>
    <View style={styles.ratingSkeleton}>
      <SkeletonLoader style={styles.ratingTextSkeleton} />
    </View>
  </View>
);

const HoursSkeleton = () => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <SkeletonLoader style={styles.iconSkeleton} />
      <SkeletonLoader style={styles.sectionTitleSkeletonShort} />
    </View>
    {[1, 2, 3, 4, 5, 6, 7].map((item) => (
      <View key={item} style={styles.hourRow}>
        <SkeletonLoader style={styles.hourDaySkeleton} />
        <SkeletonLoader style={styles.hourTimeSkeleton} />
      </View>
    ))}
  </View>
);

// Updated: No MapSkeleton needed
const LocationSkeleton = () => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <SkeletonLoader style={styles.iconSkeleton} />
      <SkeletonLoader style={styles.sectionTitleSkeletonShort} />
    </View>
    <SkeletonLoader style={styles.addressSkeleton} />
    <SkeletonLoader style={styles.locationPreviewSkeleton} />
    <SkeletonLoader style={styles.directionsButtonSkeleton} />
  </View>
);

const ContactSkeleton = () => (
  <View style={styles.section}>
    <SkeletonLoader style={styles.sectionTitleSkeleton} />
    {[1, 2, 3].map((item) => (
      <View key={item} style={styles.contactItem}>
        <SkeletonLoader style={styles.contactIconSkeleton} />
        <SkeletonLoader style={styles.contactTextSkeleton} />
      </View>
    ))}
  </View>
);

const SocialSkeleton = () => (
  <View style={styles.section}>
    <SkeletonLoader style={styles.sectionTitleSkeleton} />
    <View style={styles.socialGrid}>
      {[1, 2, 3, 4].map((item) => (
        <SkeletonLoader key={item} style={styles.socialButtonSkeleton} />
      ))}
    </View>
  </View>
);

const DetailsSkeleton = () => (
  <View style={styles.section}>
    <SkeletonLoader style={styles.sectionTitleSkeleton} />
    {[1, 2, 3].map((item) => (
      <View key={item} style={styles.detailRow}>
        <SkeletonLoader style={styles.detailIconSkeleton} />
        <SkeletonLoader style={styles.detailLabelSkeleton} />
        <SkeletonLoader style={styles.detailValueSkeleton} />
      </View>
    ))}
    <SkeletonLoader style={styles.verifiedBadgeSkeleton} />
  </View>
);

const ActionButtonsSkeleton = () => (
  <View style={styles.actionButtons}>
    {[1, 2].map((item) => (
      <SkeletonLoader key={item} style={styles.actionButtonSkeleton} />
    ))}
  </View>
);

// Safe haptic feedback wrapper
const safeHapticFeedback = async (type = 'light') => {
  try {
    if (Haptics && Haptics.impactAsync) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle[type]);
    }
  } catch (error) {
    console.log('Haptics not available:', error);
  }
};

// Main InfoTab Component
const InfoTab = ({ 
  providerId,
  providerName,
  token,
  handleGetDirections,
  handleCall,
  handleChat
}) => {
  const [infoData, setInfoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchInfoData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/services/providers/${providerId}/dashboard/info`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );
      
      if (response.data.success) {
        setInfoData(response.data.data);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to load data');
      }
    } catch (error) {
      console.error('Error fetching info:', error);
      setError(error.response?.data?.message || 'Failed to load business information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInfoData();
  }, [providerId, token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInfoData();
  };

  const handleOpenMap = () => {
    safeHapticFeedback('light');
    
    // Improved map URL generation
    let mapUrl = '';
    
    if (infoData?.location?.mapUrl) {
      mapUrl = infoData.location.mapUrl;
    } else if (infoData?.location?.address) {
      // Clean address for URL
      const cleanAddress = encodeURIComponent(infoData.location.address);
      
      // Use platform-specific map links for better UX
      if (Platform.OS === 'ios') {
        // Apple Maps for iOS
        mapUrl = `http://maps.apple.com/?q=${cleanAddress}`;
      } else {
        // Google Maps for Android (and fallback)
        mapUrl = `https://maps.google.com/?q=${cleanAddress}`;
      }
    } else if (infoData?.location?.coordinates) {
      // Use coordinates if available
      const { latitude, longitude } = infoData.location.coordinates;
      
      if (Platform.OS === 'ios') {
        mapUrl = `http://maps.apple.com/?ll=${latitude},${longitude}`;
      } else {
        mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      }
    }
    
    if (mapUrl) {
      Linking.openURL(mapUrl).catch((err) => {
        console.log('Failed to open maps:', err);
        // Fallback to Google Maps
        const fallbackUrl = `https://maps.google.com`;
        Linking.openURL(fallbackUrl);
      });
    }
  };

  const handleOpenSocial = (url) => {
    safeHapticFeedback('light');
    if (url) {
      Linking.openURL(url).catch(err => 
        console.log('Failed to open URL:', err)
      );
    }
  };

  const handleOpenEmail = () => {
    safeHapticFeedback('light');
    if (infoData?.contact?.email) {
      Linking.openURL(`mailto:${infoData.contact.email}`).catch(err =>
        console.log('Failed to open email:', err)
      );
    }
  };

  const handleOpenWhatsApp = () => {
    safeHapticFeedback('light');
    if (infoData?.contact?.whatsapp) {
      const phone = infoData.contact.whatsapp.replace('+', '').replace(/\D/g, '');
      const url = `https://wa.me/${phone}`;
      Linking.openURL(url).catch(err =>
        console.log('Failed to open WhatsApp:', err)
      );
    }
  };

  // Skeleton Loading View
  if (loading && !refreshing) {
    return (
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <SectionSkeleton />
        <StatsSkeleton />
        <HoursSkeleton />
        <LocationSkeleton />
        <ContactSkeleton />
        <SocialSkeleton />
        <DetailsSkeleton />
        <ActionButtonsSkeleton />
      </ScrollView>
    );
  }

  if (error || !infoData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="information-circle-outline" size={48} color={Colors.textSecondary} />
        <Text style={styles.errorText}>{error || 'No information available'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            safeHapticFeedback('light');
            fetchInfoData();
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasLocation = infoData.location?.address || infoData.location?.coordinates;
  const hasSocialLinks = infoData.social && Object.values(infoData.social).some(val => val);

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
          tintColor={Colors.primary}
        />
      }
      contentContainerStyle={styles.contentContainer}
    >
      {/* About Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <Text style={styles.sectionTitle}>About {infoData.business?.name || providerName}</Text>
        </View>
        <Text style={styles.sectionContent}>
          {infoData.about || 'No description available.'}
        </Text>
      </View>

      {/* Stats Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{infoData.stats?.yearsInBusiness || 0}+</Text>
            <Text style={styles.statLabel}>Years</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{infoData.stats?.servicesCount || 0}</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{infoData.stats?.productsCount || 0}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{infoData.stats?.reviewsCount || 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>
        
        {/* Rating */}
        {infoData.stats?.rating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={Colors.secondary} />
            <Text style={styles.ratingText}>
              {infoData.stats.rating.toFixed(1)} Rating
            </Text>
          </View>
        )}
      </View>

      {/* Operating Hours */}
      {infoData.hours?.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Operating Hours</Text>
          </View>
          {infoData.hours.map((hour, index) => (
            <View key={index} style={styles.hourRow}>
              <Text style={styles.hourDay}>{hour.day}</Text>
              <Text style={[
                styles.hourTime,
                hour.time === 'Closed' && styles.closedText
              ]}>
                {hour.time}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Location (No Map) */}
      {hasLocation && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          
          {infoData.location?.address && (
            <Text style={styles.addressText}>
              {infoData.location.address}
            </Text>
          )}
          
          {/* Location Preview (No Map) */}
          <View style={styles.locationPreview}>
            <Ionicons name="location-sharp" size={48} color={Colors.primary} />
            <Text style={styles.locationPreviewText}>
              {infoData.business?.name || 'Business Location'}
            </Text>
            {infoData.location?.coordinates && (
              <Text style={styles.coordinatesText}>
                {infoData.location.coordinates.latitude.toFixed(6)}, {infoData.location.coordinates.longitude.toFixed(6)}
              </Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.directionsButton}
            onPress={handleOpenMap}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate" size={20} color={Colors.text} />
            <Text style={styles.directionsText}>
              {Platform.OS === 'ios' ? 'Open in Apple Maps' : 'Open in Google Maps'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contact Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        
        {infoData.contact?.phone && (
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => {
              safeHapticFeedback('light');
              handleCall(infoData.contact.phone);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={20} color={Colors.info} />
            <Text style={styles.contactText}>{infoData.contact.phone}</Text>
          </TouchableOpacity>
        )}
        
        {infoData.contact?.email && (
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={handleOpenEmail}
            activeOpacity={0.7}
          >
            <Ionicons name="mail" size={20} color={Colors.textSecondary} />
            <Text style={styles.contactText}>{infoData.contact.email}</Text>
          </TouchableOpacity>
        )}
        
        {infoData.contact?.whatsapp && (
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={handleOpenWhatsApp}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.contactText}>Message on WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Social Media */}
      {hasSocialLinks && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Follow Us</Text>
          <View style={styles.socialGrid}>
            {infoData.social.facebook && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleOpenSocial(infoData.social.facebook)}
              >
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
            )}
            
            {infoData.social.instagram && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleOpenSocial(infoData.social.instagram)}
              >
                <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                <Text style={styles.socialText}>Instagram</Text>
              </TouchableOpacity>
            )}
            
            {infoData.social.tiktok && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleOpenSocial(infoData.social.tiktok)}
              >
                <Ionicons name="logo-tiktok" size={24} color="#000000" />
                <Text style={styles.socialText}>TikTok</Text>
              </TouchableOpacity>
            )}
            
            {infoData.social.website && (
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => handleOpenSocial(infoData.social.website)}
              >
                <Ionicons name="globe" size={24} color={Colors.primary} />
                <Text style={styles.socialText}>Website</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Business Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Details</Text>
        
        {infoData.business?.category && (
          <View style={styles.detailRow}>
            <Ionicons name="pricetag" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{infoData.business.category}</Text>
          </View>
        )}
        
        {infoData.business?.establishmentYear && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Established:</Text>
            <Text style={styles.detailValue}>{infoData.business.establishmentYear}</Text>
          </View>
        )}
        
        {infoData.business?.areasOfOperation?.length > 0 && (
          <View style={styles.detailRow}>
            <Ionicons name="pin" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailLabel}>Areas:</Text>
            <Text style={styles.detailValue}>
              {infoData.business.areasOfOperation.join(', ')}
            </Text>
          </View>
        )}
        
        {infoData.verification?.isApproved && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.verifiedText}>Verified Business</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {infoData.contact?.phone && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.callButton]}
            onPress={() => {
              safeHapticFeedback('medium');
              handleCall(infoData.contact.phone);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={20} color={Colors.text} />
            <Text style={styles.actionButtonText}>Call Now</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.chatButton]}
          onPress={() => {
            safeHapticFeedback('medium');
            handleChat();
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble" size={20} color={Colors.text} />
          <Text style={styles.actionButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  
  // Loading Container
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: Colors.text,
    fontWeight: '600',
  },
  
  // Skeleton Styles
  skeleton: {
    backgroundColor: Colors.cardBorder,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ translateX: -100 }],
  },
  
  // Section Skeleton Styles
  sectionTitleSkeleton: {
    width: '60%',
    height: 24,
    marginBottom: Spacing.md,
  },
  sectionTitleSkeletonShort: {
    width: '40%',
    height: 24,
  },
  sectionContentSkeleton: {
    width: '100%',
    height: 16,
    marginBottom: Spacing.xs,
  },
  sectionContentSkeletonShort: {
    width: '80%',
    height: 16,
    marginBottom: Spacing.xs,
  },
  
  // Stats Skeleton
  statValueSkeleton: {
    width: 40,
    height: 32,
    marginBottom: Spacing.xs,
  },
  statLabelSkeleton: {
    width: 50,
    height: 14,
  },
  ratingSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  ratingTextSkeleton: {
    width: 80,
    height: 18,
  },
  
  // Hours Skeleton
  iconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  hourDaySkeleton: {
    width: 80,
    height: 18,
  },
  hourTimeSkeleton: {
    width: 60,
    height: 18,
  },
  
  // Location Skeleton (replaces MapSkeleton)
  addressSkeleton: {
    width: '100%',
    height: 20,
    marginBottom: Spacing.md,
  },
  locationPreviewSkeleton: {
    width: '100%',
    height: 150,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  directionsButtonSkeleton: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.md,
  },
  
  // Contact Skeleton
  contactIconSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  contactTextSkeleton: {
    flex: 1,
    height: 20,
  },
  
  // Social Skeleton
  socialButtonSkeleton: {
    width: 100,
    height: 40,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  
  // Details Skeleton
  detailIconSkeleton: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  detailLabelSkeleton: {
    width: 80,
    height: 18,
  },
  detailValueSkeleton: {
    flex: 1,
    height: 18,
  },
  verifiedBadgeSkeleton: {
    width: 120,
    height: 28,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  
  // Action Buttons Skeleton
  actionButtonSkeleton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
  },
  
  // Original Styles
  section: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  sectionContent: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  ratingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  hourDay: {
    ...Typography.body,
    color: Colors.text,
  },
  hourTime: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  closedText: {
    color: Colors.danger,
    fontStyle: 'italic',
  },
  
  // Location Styles (No Map)
  addressText: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  locationPreview: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cardBorder + '40',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
  },
  locationPreviewText: {
    marginTop: Spacing.sm,
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  coordinatesText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  directionsText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 14,
  },
  
  // Contact Styles
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: Spacing.sm,
  },
  contactText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  
  // Social Styles
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  socialText: {
    fontSize: 12,
    color: Colors.text,
  },
  
  // Detail Styles
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  detailLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  
  // Action Button Styles
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  callButton: {
    backgroundColor: Colors.info,
  },
  chatButton: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 14,
  },
});

export default InfoTab;