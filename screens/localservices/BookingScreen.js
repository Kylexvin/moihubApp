// screens/localservices/BookingScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Theme from '../theme/Theme';

const { width } = Dimensions.get('window');
const { Colors, Gradients, Typography, Spacing, BorderRadius, Components, Shadows } = Theme;

const BookingScreen = ({ route, navigation }) => {
  const { providerId, providerName, categoryName, serviceId } = route.params;
  const [step, setStep] = useState(1); // 1: Date, 2: Time, 3: Confirm
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [service, setService] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    navigation.setOptions({
      title: 'Book Appointment',
      headerStyle: {
        backgroundColor: Colors.primary,
      },
      headerTintColor: Colors.text,
      headerTitleStyle: {
        ...Typography.h3,
      },
    });
    
    fetchServiceDetails();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchServiceDetails = async () => {
    // In a real app, fetch service details from API
    setService({
      id: serviceId || '1',
      name: 'Deep Tissue Massage',
      duration: '60 mins',
      price: 'KES 2,500',
      description: 'Professional massage therapy for relaxation and pain relief',
    });
    
    // Generate available times
    const times = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];
    setAvailableTimes(times);
  };

//   const handleDateChange = (event, date) => {
//     setShowDatePicker(false);
//     if (date) {
//       setSelectedDate(date);
//       await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
//     }
//   };

  const handleTimeSelect = async (time) => {
    setSelectedTime(time);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Auto-advance to next step after delay
    setTimeout(() => {
      if (step === 2) setStep(3);
    }, 300);
  };

  const handleNextStep = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleConfirmBooking();
    }
  };

  const handlePreviousStep = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      const bookingData = {
        providerId,
        serviceId: service?.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        notes,
      };

      // In real app: await axios.post('/api/bookings', bookingData, { headers })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      navigation.replace('BookingSuccess', {
        providerName,
        serviceName: service?.name,
        date: selectedDate.toLocaleDateString(),
        time: selectedTime,
        price: service?.price,
      });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((stepNumber) => (
        <View key={stepNumber} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            stepNumber <= step && styles.stepCircleActive,
            stepNumber < step && styles.stepCircleCompleted,
          ]}>
            {stepNumber < step ? (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.stepNumber,
                stepNumber <= step && styles.stepNumberActive
              ]}>
                {stepNumber}
              </Text>
            )}
          </View>
          <Text style={[
            styles.stepLabel,
            stepNumber <= step && styles.stepLabelActive
          ]}>
            {stepNumber === 1 ? 'Date' : stepNumber === 2 ? 'Time' : 'Confirm'}
          </Text>
          {stepNumber < 3 && (
            <View style={[
              styles.stepLine,
              stepNumber < step && styles.stepLineActive
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderDateStep = () => (
    <Animated.View 
      style={[
        styles.stepContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.stepTitle}>Select Date</Text>
      <Text style={styles.stepDescription}>
        Choose a date for your appointment
      </Text>
      
      <TouchableOpacity
        style={styles.dateCard}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="calendar" size={32} color={Colors.primary} />
        <View style={styles.dateInfo}>
          <Text style={styles.dateTitle}>Selected Date</Text>
          <Text style={styles.dateValue}>{formatDate(selectedDate)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
      </TouchableOpacity>
      
      <Text style={styles.availableText}>Available dates for booking</Text>
      
      <View style={styles.dateGrid}>
        {[0, 1, 2, 3, 4, 5].map((daysToAdd) => {
          const date = new Date();
          date.setDate(date.getDate() + daysToAdd);
          const isSelected = date.toDateString() === selectedDate.toDateString();
          
          return (
            <TouchableOpacity
              key={daysToAdd}
              style={[
                styles.dateCell,
                isSelected && styles.dateCellSelected
              ]}
              onPress={() => {
                setSelectedDate(date);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dateDay,
                isSelected && styles.dateDaySelected
              ]}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[
                styles.dateNumber,
                isSelected && styles.dateNumberSelected
              ]}>
                {date.getDate()}
              </Text>
              <Text style={[
                styles.dateMonth,
                isSelected && styles.dateMonthSelected
              ]}>
                {date.toLocaleDateString('en-US', { month: 'short' })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  const renderTimeStep = () => (
    <Animated.View 
      style={[
        styles.stepContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.stepTitle}>Select Time</Text>
      <Text style={styles.stepDescription}>
        Choose your preferred time slot
      </Text>
      
      <View style={styles.timeGrid}>
        {availableTimes.map((time) => (
          <TouchableOpacity
            key={time}
            style={[
              styles.timeSlot,
              selectedTime === time && styles.timeSlotSelected
            ]}
            onPress={() => handleTimeSelect(time)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.timeText,
              selectedTime === time && styles.timeTextSelected
            ]}>
              {time}
            </Text>
            {selectedTime === time && (
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.timeNote}>
        📍 Sessions are {service?.duration || '60 mins'} long
      </Text>
    </Animated.View>
  );

  const renderConfirmStep = () => (
    <Animated.View 
      style={[
        styles.stepContent,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <Text style={styles.stepTitle}>Confirm Booking</Text>
      <Text style={styles.stepDescription}>
        Review your appointment details
      </Text>
      
      <View style={styles.bookingSummary}>
        <View style={styles.summaryItem}>
          <Ionicons name="business" size={20} color={Colors.primary} />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Provider</Text>
            <Text style={styles.summaryValue}>{providerName}</Text>
          </View>
        </View>
        
        <View style={styles.summaryItem}>
          <Ionicons name="sparkles" size={20} color={Colors.primary} />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Service</Text>
            <Text style={styles.summaryValue}>{service?.name}</Text>
            <Text style={styles.summarySubvalue}>{service?.description}</Text>
          </View>
        </View>
        
        <View style={styles.summaryItem}>
          <Ionicons name="calendar" size={20} color={Colors.primary} />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Date & Time</Text>
            <Text style={styles.summaryValue}>
              {formatDate(selectedDate)} at {selectedTime}
            </Text>
          </View>
        </View>
        
        <View style={styles.summaryItem}>
          <Ionicons name="time" size={20} color={Colors.primary} />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{service?.duration}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.notesTitle}>Additional Notes (Optional)</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="Any special requests or requirements..."
        placeholderTextColor={Colors.textSecondary}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
      
      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>Total Amount</Text>
        <Text style={styles.priceValue}>{service?.price}</Text>
      </View>
    </Animated.View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderDateStep();
      case 2: return renderTimeStep();
      case 3: return renderConfirmStep();
      default: return renderDateStep();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={Gradients.primary} style={StyleSheet.absoluteFill} />
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Service Info Card */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <Text style={styles.serviceName}>{service?.name}</Text>
            <Text style={styles.servicePrice}>{service?.price}</Text>
          </View>
          <Text style={styles.serviceDescription}>
            {service?.description}
          </Text>
          <View style={styles.serviceMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{service?.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="person" size={16} color={Colors.textSecondary} />
              <Text style={styles.metaText}>1 person</Text>
            </View>
          </View>
        </View>
        
        {/* Step Indicator */}
        {renderStepIndicator()}
        
        {/* Current Step Content */}
        {renderCurrentStep()}
        
        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handlePreviousStep}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              (step === 2 && !selectedTime) && styles.nextButtonDisabled,
              loading && styles.nextButtonDisabled,
            ]}
            onPress={handleNextStep}
            disabled={(step === 2 && !selectedTime) || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {step === 3 ? 'Confirm Booking' : 'Continue'}
                </Text>
                <Ionicons 
                  name={step === 3 ? "checkmark-circle" : "arrow-forward"} 
                  size={20} 
                  color="#FFFFFF" 
                />
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.footerSpace} />
      </ScrollView>
      
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
          maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days
        />
      )}
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
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  
  // Service Card
  serviceCard: {
    backgroundColor: Colors.card,
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.small,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  serviceName: {
    ...Typography.h4,
    color: Colors.text,
  },
  servicePrice: {
    ...Typography.h4,
    color: Colors.primary,
  },
  serviceDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  serviceMeta: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  
  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  stepContainer: {
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepCircleActive: {
    borderColor: Colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  stepNumberActive: {
    color: Colors.primary,
  },
  stepLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  stepLine: {
    position: 'absolute',
    top: 18,
    left: '60%',
    right: '-60%',
    height: 2,
    backgroundColor: Colors.cardBorder,
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  
  // Step Content
  stepContent: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  stepTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  
  // Date Step
  dateCard: {
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.lg,
  },
  dateInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  dateTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  dateValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  availableText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  dateGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateCell: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    minWidth: (width - Spacing.lg * 2) / 6 - Spacing.xs,
  },
  dateCellSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateDay: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  dateDaySelected: {
    color: Colors.text,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  dateNumberSelected: {
    color: Colors.text,
  },
  dateMonth: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  dateMonthSelected: {
    color: Colors.text,
  },
  
  // Time Step
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeSlot: {
    flex: 1,
    minWidth: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  timeText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  timeTextSelected: {
    color: Colors.primary,
  },
  timeNote: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  
  // Confirm Step
  bookingSummary: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: Spacing.lg,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  summaryInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  summarySubvalue: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notesTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.lg,
    minHeight: 100,
  },
  priceContainer: {
    backgroundColor: Colors.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  priceLabel: {
    ...Typography.h4,
    color: Colors.text,
  },
  priceValue: {
    ...Typography.h1,
    color: Colors.primary,
    fontSize: 28,
  },
  
  // Navigation Buttons
  navigationButtons: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  backButton: {
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
  backButtonText: {
    ...Typography.button,
    color: Colors.primary,
  },
  nextButton: {
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
  nextButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    opacity: 0.7,
  },
  nextButtonText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Footer Space
  footerSpace: {
    height: Spacing.xxxl,
  },
});

export default BookingScreen;