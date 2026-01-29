// screens/localservices/components/ServicesTab.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Theme from '../../theme/Theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../../context/AuthContext';

const { Colors, Typography, Spacing, BorderRadius } = Theme;

const ServicesTab = ({ 
  servicesData, 
  loading = false,
  providerId,
  providerName,
  onInitiateChat
}) => {
  const { user } = useAuth();
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const availableTimes = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM'
  ];

  const handleServicePress = (service) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedService(service);
    setBookingModalVisible(true);
  };

  const handleBookService = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Close modal first
    setBookingModalVisible(false);
    
    // Navigate to chat to discuss booking
    if (onInitiateChat) {
      onInitiateChat({
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.duration,
        selectedDate: selectedDate.toISOString(),
        selectedTime: selectedTime,
        notes: notes,
        isBookingInquiry: true
      });
    }
    
    // Reset form
    setTimeout(() => {
      setSelectedService(null);
      setSelectedDate(new Date());
      setSelectedTime('');
      setNotes('');
    }, 500);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  if (servicesData.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="construct" size={48} color={Colors.textSecondary} />
        <Text style={styles.emptyStateText}>No services available</Text>
        <Text style={styles.emptyStateSubtext}>Check back later for updates</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Available Services</Text>
      <Text style={styles.tabSubtitle}>Choose from our professional treatments</Text>
      
      {servicesData.map((service) => (
        <TouchableOpacity 
          key={service.id} 
          style={styles.serviceCard}
          onPress={() => handleServicePress(service)}
          activeOpacity={0.7}
        >
          <View style={styles.serviceHeader}>
            <View style={styles.serviceEmojiContainer}>
              <Ionicons name="sparkles" size={24} color={Colors.primary} />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
              <View style={styles.serviceMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{service.duration}</Text>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome5 name="money-bill-wave" size={12} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{service.price}</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.serviceActionContainer}>
            <Text style={styles.inquireText}>Tap to inquire about booking</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </View>
        </TouchableOpacity>
      ))}

      {/* Booking Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={bookingModalVisible}
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Book {selectedService?.name}</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setBookingModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.serviceSummary}>
                <Text style={styles.serviceSummaryTitle}>Service Details:</Text>
                <View style={styles.serviceSummaryItem}>
                  <Text style={styles.serviceSummaryLabel}>Name:</Text>
                  <Text style={styles.serviceSummaryValue}>{selectedService?.name}</Text>
                </View>
                <View style={styles.serviceSummaryItem}>
                  <Text style={styles.serviceSummaryLabel}>Duration:</Text>
                  <Text style={styles.serviceSummaryValue}>{selectedService?.duration}</Text>
                </View>
                <View style={styles.serviceSummaryItem}>
                  <Text style={styles.serviceSummaryLabel}>Price:</Text>
                  <Text style={styles.serviceSummaryValue}>{selectedService?.price}</Text>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Select Date</Text>
                <TouchableOpacity 
                  style={styles.dateTimeInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color={Colors.primary} />
                  <Text style={styles.dateTimeText}>
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) setSelectedDate(date);
                    }}
                  />
                )}
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Select Time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.timeSlotsContainer}>
                    {availableTimes.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeSlot,
                          selectedTime === time && styles.timeSlotSelected
                        ]}
                        onPress={() => setSelectedTime(time)}
                      >
                        <Text style={[
                          styles.timeSlotText,
                          selectedTime === time && styles.timeSlotTextSelected
                        ]}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Additional Notes (Optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Any special requirements or notes..."
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setBookingModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleBookService}
                  disabled={!selectedTime}
                >
                  <Ionicons name="chatbubble" size={20} color={Colors.text} />
                  <Text style={styles.confirmButtonText}>Chat to Book</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: Spacing.lg,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyStateText: {
    marginTop: Spacing.md,
    color: Colors.text,
    ...Typography.body,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  serviceHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  serviceEmojiContainer: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: 4,
  },
  serviceDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
  serviceActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  inquireText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  serviceSummary: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  serviceSummaryTitle: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  serviceSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  serviceSummaryLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  serviceSummaryValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  dateTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  dateTimeText: {
    color: Colors.text,
    fontSize: 14,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  timeSlot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeSlotText: {
    color: Colors.text,
    fontSize: 14,
  },
  timeSlotTextSelected: {
    color: Colors.text,
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.card,
  },
  cancelButtonText: {
    color: Colors.text,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  confirmButtonText: {
    color: Colors.text,
    fontWeight: '600',
  },
});

export default ServicesTab;