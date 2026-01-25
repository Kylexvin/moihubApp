// screens/localservices/BookingSuccess.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Share,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Theme from '../theme/Theme';

const { width, height } = Dimensions.get('window');
const { Colors, Gradients, Typography, Spacing, BorderRadius, Components, Shadows } = Theme;

const BookingSuccess = ({ route, navigation }) => {
  const { providerName, serviceName, date, time, price, bookingId } = route.params;
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Success haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Animation sequence
    Animated.sequence([
      // Scale up checkmark
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      // Show confetti
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade in content
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleShare = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const message = `I just booked "${serviceName}" at ${providerName} for ${date} at ${time} via MoiHub Services! 🎉`;
      await Share.share({
        message,
        title: 'Check out MoiHub Services',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleViewBookings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to bookings screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'MyBookings' } }],
    });
  };

  const handleHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleAddToCalendar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In a real app, this would open calendar app
    Alert.alert(
      'Add to Calendar',
      'This feature will add your appointment to your device calendar.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: () => {
          // Implement calendar integration here
        }}
      ]
    );
  };

  const renderConfetti = () => {
    const confettiCount = 20;
    const confettiItems = [];
    
    for (let i = 0; i < confettiCount; i++) {
      const left = Math.random() * width;
      const rotation = Math.random() * 360;
      const delay = Math.random() * 300;
      const duration = 1000 + Math.random() * 1000;
      
      confettiItems.push(
        <Animated.View
          key={i}
          style={[
            styles.confettiPiece,
            {
              left,
              backgroundColor: [
                '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'
              ][Math.floor(Math.random() * 7)],
              transform: [
                { translateY: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, height]
                })},
                { rotate: `${rotation}deg` }
              ],
              opacity: confettiAnim,
            }
          ]}
        />
      );
    }
    
    return confettiItems;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      
      {/* Confetti Animation */}
      <View style={styles.confettiContainer}>
        {renderConfetti()}
      </View>
      
      <View style={styles.container}>
        {/* Success Icon */}
        <Animated.View 
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={60} color="#FFFFFF" />
          </View>
        </Animated.View>
        
        {/* Success Content */}
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.successTitle}>Booking Confirmed! 🎉</Text>
          <Text style={styles.successMessage}>
            Your appointment has been successfully booked. A confirmation email has been sent to you.
          </Text>
          
          {/* Booking Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailHeaderTitle}>Booking Details</Text>
              {bookingId && (
                <Text style={styles.bookingId}>ID: {bookingId}</Text>
              )}
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="business" size={20} color={Colors.primary} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Provider</Text>
                <Text style={styles.detailValue}>{providerName}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Service</Text>
                <Text style={styles.detailValue}>{serviceName}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>{date} at {time}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="cash" size={20} color={Colors.primary} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Amount Paid</Text>
                <Text style={styles.detailValue}>{price}</Text>
              </View>
            </View>
            
            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Confirmed</Text>
            </View>
          </View>
          
          {/* Next Steps */}
          <View style={styles.nextSteps}>
            <Text style={styles.nextStepsTitle}>Next Steps</Text>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                You'll receive a reminder 1 hour before your appointment
              </Text>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Arrive 10 minutes early to complete any paperwork
              </Text>
            </View>
            
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Bring any necessary identification or documents
              </Text>
            </View>
          </View>
          
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleAddToCalendar}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar" size={20} color={Colors.primary} />
              <Text style={styles.quickActionText}>Add to Calendar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social" size={20} color={Colors.primary} />
              <Text style={styles.quickActionText}>Share</Text>
            </TouchableOpacity>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleViewBookings}
              activeOpacity={0.8}
            >
              <Ionicons name="list" size={20} color={Colors.primary} />
              <Text style={styles.secondaryButtonText}>My Bookings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleHome}
              activeOpacity={0.8}
            >
              <Ionicons name="home" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
          
          {/* Support Info */}
          <View style={styles.supportInfo}>
            <Ionicons name="help-circle" size={16} color={Colors.textSecondary} />
            <Text style={styles.supportText}>
              Need help? Contact support: support@moihub.com
            </Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  
  // Confetti
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  
  // Success Icon
  iconContainer: {
    marginTop: Spacing.xxxl,
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
  },
  
  // Content
  content: {
    width: '100%',
    alignItems: 'center',
  },
  successTitle: {
    ...Typography.h1,
    color: Colors.text,
    fontSize: 32,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  
  // Details Card
  detailsCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  detailHeaderTitle: {
    ...Typography.h4,
    color: Colors.text,
  },
  bookingId: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  detailInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: Spacing.xs,
  },
  statusText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
  
  // Next Steps
  nextSteps: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.xl,
  },
  nextStepsTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    gap: Spacing.sm,
  },
  quickActionText: {
    ...Typography.button,
    color: Colors.primary,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    gap: Spacing.sm,
  },
  secondaryButtonText: {
    ...Typography.button,
    color: Colors.primary,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Support Info
  supportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    width: '100%',
    justifyContent: 'center',
  },
  supportText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default BookingSuccess; 