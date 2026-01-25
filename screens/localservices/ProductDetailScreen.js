// screens/localservices/BookingSuccess.js
import React, { useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import Theme from '../theme/Theme';

const { width, height } = Dimensions.get('window');
const { Colors, Gradients, Typography, Spacing, BorderRadius, Components, Shadows } = Theme;

const BookingSuccess = ({ route, navigation }) => {
  const { providerName, serviceName, date, time, price } = route.params;
  
  const scaleAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
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
    navigation.reset({
      index: 0,
      routes: [{ name: 'MyBookings' }], // You'll need to create this screen
    });
  };

  const handleHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      
      <View style={styles.container}>
        {/* Success Animation */}
        <Animated.View style={[styles.animationContainer, { transform: [{ scale: scaleAnim }] }]}>
          <LottieView
            source={require('../../assets/animations/success.json')} // You'll need to add this animation file
            autoPlay
            loop={false}
            style={styles.animation}
          />
        </Animated.View>
        
        {/* Success Message */}
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
            Your appointment at {providerName} has been successfully booked.
          </Text>
          
          {/* Booking Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
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
              <Ionicons name="business" size={20} color={Colors.primary} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Provider</Text>
                <Text style={styles.detailValue}>{providerName}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name="cash" size={20} color={Colors.primary} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Amount Paid</Text>
                <Text style={styles.detailValue}>{price}</Text>
              </View>
            </View>
          </View>
          
          {/* Confirmation Text */}
          <Text style={styles.confirmationText}>
            A confirmation has been sent to your email. Please arrive 10 minutes before your appointment.
          </Text>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social" size={20} color={Colors.primary} />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.bookingsButton}
              onPress={handleViewBookings}
              activeOpacity={0.8}
            >
              <Ionicons name="list" size={20} color="#FFFFFF" />
              <Text style={styles.bookingsButtonText}>My Bookings</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleHome}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={20} color={Colors.primary} />
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  animationContainer: {
    width: 200,
    height: 200,
    marginBottom: Spacing.xl,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
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
  confirmationText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  shareButton: {
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
  shareButtonText: {
    ...Typography.button,
    color: Colors.primary,
  },
  bookingsButton: {
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
  bookingsButtonText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  homeButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.sm,
  },
  homeButtonText: {
    ...Typography.button,
    color: Colors.primary,
  },
});

export default BookingSuccess;