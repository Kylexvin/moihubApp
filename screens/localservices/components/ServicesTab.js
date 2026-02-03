import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import Theme from '../../theme/Theme';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');
const { Colors, Typography, Spacing, BorderRadius, Shadows } = Theme;

const ServicesTab = ({ 
  providerId, 
  providerName, 
  token, 
  navigation,
  onInitiateChat 
}) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Booking Modal State - ADDED phoneNumber
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date());
  const [bookingTime, setBookingTime] = useState('14:30');
  const [bookingNotes, setBookingNotes] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [phoneNumber, setPhoneNumber] = useState(''); // NEW FIELD
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  
  // Inquiry Modal State
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryType, setInquiryType] = useState(''); // 'service' or 'product'
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setError(null);
      
      const response = await axios.get(
        `/api/services/providers/${providerId}/dashboard/services`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: 10000
        }
      );
      
      const transformedServices = response.data.services?.map(service => ({
        id: service._id || service.id,
        name: service.name,
        duration: `${service.duration} mins`,
        price: `KES ${service.price?.toLocaleString?.() || service.price}`,
        rawPrice: service.price,
        description: service.description,
        category: service.category || 'Service',
      })) || [];
      
      setServices(transformedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services. Please try again.');
      
      if (error.response?.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [providerId, token]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchServices();
  };

  const handleBookService = (service) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedService(service);
    setBookingNotes('');
    setNumberOfPeople('1');
    setPhoneNumber(''); // RESET PHONE NUMBER
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedService) return;
    
    // Validate phone number
    if (!phoneNumber.trim()) {
      Alert.alert('Phone Required', 'Please enter your phone number for booking confirmation');
      return;
    }

    // Basic phone validation
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number (at least 10 digits)');
      return;
    }

    try {
      setIsBooking(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const formattedDate = bookingDate.toISOString().split('T')[0];
      
      const response = await axios.post('/api/services/bookings', {
        providerId,
        serviceId: selectedService.id,
        date: formattedDate,
        time: bookingTime,
        notes: bookingNotes,
        numberOfPeople: parseInt(numberOfPeople) || 1,
        phoneNumber: phoneNumber // ADD PHONE NUMBER TO REQUEST
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Booking Successful!',
          `Your booking for ${selectedService.name} has been created. Booking ID: ${response.data.data.bookingReference}`,
          [{ 
            text: 'OK', 
            onPress: () => {
              setShowBookingModal(false);
              // Navigate to bookings screen or refresh
            }
          }]
        );
      }
    } catch (error) {
      console.error('Booking error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMessage = 'Failed to create booking. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      Alert.alert(
        'Booking Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsBooking(false);
    }
  };

  const handleInquiry = (service, type = 'service') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedService(service);
    setInquiryType(type);
    setInquiryMessage('');
    setContactPhone('');
    setShowInquiryModal(true);
  };

  const handleSubmitInquiry = async () => {
    if (!inquiryMessage.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }
    
    if (!contactPhone.trim()) {
      Alert.alert('Error', 'Please enter your contact phone number');
      return;
    }

    try {
      setIsSubmittingInquiry(true);
      
      const endpoint = inquiryType === 'service' 
        ? '/api/services/questions/service'
        : '/api/services/questions/product';
      
      const payload = {
        providerId,
        message: inquiryMessage,
        customerPhone: contactPhone,
        contactMethod: 'whatsapp'
      };
      
      if (inquiryType === 'service') {
        payload.serviceId = selectedService.id;
      } else {
        // For product inquiries, you'd need productId
        Alert.alert('Info', 'Product inquiry requires product ID');
        return;
      }
      
      const response = await axios.post(endpoint, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Message Sent!',
          'Your inquiry has been sent to the provider.',
          [{ 
            text: 'OK', 
            onPress: () => setShowInquiryModal(false)
          }]
        );
      }
    } catch (error) {
      console.error('Inquiry error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Failed to Send',
        error.response?.data?.message || 'Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Skeleton Loading Component
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonDescription} />
            <View style={styles.skeletonFooter}>
              <View style={styles.skeletonPrice} />
              <View style={styles.skeletonButton} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  // Booking Modal - UPDATED WITH PHONE FIELD
  const renderBookingModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showBookingModal}
      onRequestClose={() => setShowBookingModal(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Book Service</Text>
                <TouchableOpacity 
                  onPress={() => setShowBookingModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
              
              {selectedService && (
                <View style={styles.serviceSummary}>
                  <Text style={styles.serviceName}>{selectedService.name}</Text>
                  <Text style={styles.servicePrice}>KES {selectedService.rawPrice?.toLocaleString()}</Text>
                  <Text style={styles.serviceDuration}>{selectedService.duration}</Text>
                </View>
              )}
              
              <ScrollView style={styles.bookingForm}>
                {/* Contact Phone - REQUIRED FIELD */}
                <View style={styles.inputField}>
                  <Ionicons name="call" size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.textInput}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Your phone number (required)*"
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType="phone-pad"
                    autoFocus={true}
                    returnKeyType="next"
                  />
                </View>
                
                {/* Date Picker */}
                <TouchableOpacity 
                  style={styles.inputField}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color={Colors.textSecondary} />
                  <Text style={styles.inputText}>
                    {formatDate(bookingDate)}
                  </Text>
                </TouchableOpacity>
                
                {/* Time Picker */}
                <TouchableOpacity 
                  style={styles.inputField}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time" size={20} color={Colors.textSecondary} />
                  <Text style={styles.inputText}>{bookingTime}</Text>
                </TouchableOpacity>
                
                {/* Number of People */}
                <View style={styles.inputField}>
                  <Ionicons name="people" size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.textInput}
                    value={numberOfPeople}
                    onChangeText={setNumberOfPeople}
                    placeholder="Number of people"
                    keyboardType="number-pad"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
                
                {/* Notes */}
                <View style={[styles.inputField, { minHeight: 80 }]}>
                  <Ionicons name="document-text" size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { flex: 1, textAlignVertical: 'top' }]}
                    value={bookingNotes}
                    onChangeText={setBookingNotes}
                    placeholder="Any special requests or notes..."
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>

                {/* Phone Note */}
                <View style={styles.phoneNote}>
                  <Ionicons name="information-circle" size={14} color={Colors.textSecondary} />
                  <Text style={styles.phoneNoteText}>
                    Your phone number is required for booking confirmation and updates
                  </Text>
                </View>
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.cancelButton, { marginRight: Spacing.sm }]}
                  onPress={() => setShowBookingModal(false)}
                  disabled={isBooking}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.confirmButton, (isBooking || !phoneNumber.trim()) && styles.disabledButton]}
                  onPress={handleConfirmBooking}
                  disabled={isBooking || !phoneNumber.trim()}
                >
                  {isBooking ? (
                    <ActivityIndicator size="small" color={Colors.text} />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color={Colors.text} />
                      <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
        
        {showDatePicker && (
          <DateTimePicker
            value={bookingDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setBookingDate(selectedDate);
              }
            }}
          />
        )}
        
        {showTimePicker && (
          <DateTimePicker
            value={new Date(`2000-01-01T${bookingTime}`)}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) {
                const hours = selectedTime.getHours().toString().padStart(2, '0');
                const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
                setBookingTime(`${hours}:${minutes}`);
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );

  // Inquiry Modal (unchanged)
  const renderInquiryModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showInquiryModal}
      onRequestClose={() => setShowInquiryModal(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {inquiryType === 'service' ? 'Ask About Service' : 'Ask About Product'}
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowInquiryModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
              
              {selectedService && (
                <View style={styles.serviceSummary}>
                  <Text style={styles.serviceName}>{selectedService.name}</Text>
                </View>
              )}
              
              <ScrollView style={styles.bookingForm}>
                {/* Contact Phone */}
                <View style={styles.inputField}>
                  <Ionicons name="call" size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.textInput}
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    placeholder="Your WhatsApp number (e.g., +254712345678)"
                    keyboardType="phone-pad"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
                
                {/* Message */}
                <View style={[styles.inputField, { minHeight: 120 }]}>
                  <Ionicons name="chatbubble" size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { flex: 1, textAlignVertical: 'top' }]}
                    value={inquiryMessage}
                    onChangeText={setInquiryMessage}
                    placeholder={`What would you like to ask about ${selectedService?.name}?`}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
                
                <View style={styles.infoNote}>
                  <Ionicons name="information-circle" size={16} color={Colors.textSecondary} />
                  <Text style={styles.infoNoteText}>
                    Provider will contact you on WhatsApp with answers
                  </Text>
                </View>
              </ScrollView>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.cancelButton, { marginRight: Spacing.sm }]}
                  onPress={() => setShowInquiryModal(false)}
                  disabled={isSubmittingInquiry}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.confirmButton, isSubmittingInquiry && styles.disabledButton]}
                  onPress={handleSubmitInquiry}
                  disabled={isSubmittingInquiry}
                >
                  {isSubmittingInquiry ? (
                    <ActivityIndicator size="small" color={Colors.text} />
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color={Colors.text} />
                      <Text style={styles.confirmButtonText}>Send Message</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading) {
    return renderSkeleton();
  }

  if (error && !loading) {
    return (
      <View style={styles.errorContainer}>
        <ScrollView
          contentContainerStyle={styles.errorScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          <Ionicons name="alert-circle" size={48} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchServices}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.tabContent}>
          <View style={styles.servicesHeader}>
            <View>
              <Text style={styles.tabTitle}>Services</Text>
              <Text style={styles.tabSubtitle}>
                {services.length} service{services.length !== 1 ? 's' : ''} available
              </Text>
            </View>
          </View>
          
          {services.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>No services available</Text>
              <Text style={styles.emptyStateSubtext}>Check back later for updates</Text>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {services.map((service) => (
                <View key={service.id} style={styles.serviceCard}>
                  <View style={styles.serviceInfo}>
                    <View style={styles.serviceHeader}>
                      <Text style={styles.serviceName} numberOfLines={1}>
                        {service.name}
                      </Text>
                      <Text style={styles.servicePrice}>{service.price}</Text>
                    </View>
                    
                    {service.description ? (
                      <Text style={styles.serviceDescription} numberOfLines={2}>
                        {service.description}
                      </Text>
                    ) : null}
                    
                    <View style={styles.serviceMeta}>
                      <View style={styles.serviceDuration}>
                        <Ionicons name="time" size={14} color={Colors.textSecondary} />
                        <Text style={styles.serviceDurationText}>{service.duration}</Text>
                      </View>
                      
                      {service.category && (
                        <View style={styles.serviceCategory}>
                          <Ionicons name="pricetag" size={14} color={Colors.textSecondary} />
                          <Text style={styles.serviceCategoryText}>{service.category}</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.serviceActions}>
                      <TouchableOpacity 
                        style={styles.inquiryButton}
                        onPress={() => handleInquiry(service, 'service')}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="chatbubble" size={16} color={Colors.text} />
                        <Text style={styles.inquiryButtonText}>Ask</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.bookButton}
                        onPress={() => handleBookService(service)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="calendar" size={16} color={Colors.text} />
                        <Text style={styles.bookButtonText}>Book Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {services.length > 0 && (
            <View style={styles.bookingNote}>
              <Ionicons name="information-circle" size={16} color={Colors.textSecondary} />
              <Text style={styles.bookingNoteText}>
                Tap "Ask" to inquire about a service or "Book Now" to make an appointment
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {renderBookingModal()}
      {renderInquiryModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    minHeight: 400,
  },
  scrollView: {
    flex: 1,
  },
  // Skeleton Styles
  skeletonContainer: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  skeletonCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  skeletonContent: {
    gap: Spacing.sm,
  },
  skeletonTitle: {
    width: '70%',
    height: 20,
    backgroundColor: Colors.card + '80',
    borderRadius: BorderRadius.sm,
  },
  skeletonDescription: {
    width: '90%',
    height: 16,
    backgroundColor: Colors.card + '80',
    borderRadius: BorderRadius.sm,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  skeletonPrice: {
    width: 80,
    height: 20,
    backgroundColor: Colors.card + '80',
    borderRadius: BorderRadius.sm,
  },
  skeletonButton: {
    width: 100,
    height: 36,
    backgroundColor: Colors.card + '80',
    borderRadius: BorderRadius.md,
  },
  // Error Styles
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorScrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    minHeight: 300,
  },
  errorText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: Colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
  // Service List Styles
  tabContent: {
    padding: Spacing.lg,
  },
  servicesHeader: {
    marginBottom: Spacing.lg,
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
  servicesList: {
    gap: Spacing.md,
  },
  serviceCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.small,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  serviceName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
    marginRight: Spacing.sm,
  },
  servicePrice: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  serviceMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  serviceDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  serviceDurationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  serviceCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  serviceCategoryText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  inquiryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flex: 1,
    justifyContent: 'center',
  },
  inquiryButtonText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flex: 1,
    justifyContent: 'center',
  },
  bookButtonText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  bookingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  bookingNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  // Modal Styles - ADDED phoneNote
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
    ...Typography.h3,
    color: Colors.text,
    flex: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  serviceSummary: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  bookingForm: {
    maxHeight: 400,
    padding: Spacing.lg,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  inputText: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  textInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    padding: 0,
    margin: 0,
  },
  phoneNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.info + '20',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  phoneNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.info,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card + '40',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  confirmButtonText: {
    ...Typography.button,
    color: Colors.text,
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default ServicesTab;  