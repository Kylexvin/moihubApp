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

// ─── Design tokens ───────────────────────────────────────────────
const MODAL_BG     = '#161616';
const MODAL_BORDER = 'rgba(80,200,120,0.25)';
const INPUT_BG     = 'rgba(255,255,255,0.07)';
const INPUT_BORDER = 'rgba(255,255,255,0.15)';
const OVERLAY      = 'rgba(0,0,0,0.82)';

// ─── Helpers ─────────────────────────────────────────────────────
const getActionConfig = (pricingType) => {
  switch (pricingType) {
    case 'fixed':
      return {
        primaryLabel: 'Book Now',
        primaryIcon: 'calendar',
        modalTitle: 'Book Service',
        showDateTime: true,
        showHours: false,
        showMessage: false,
        ctaLabel: 'Confirm Booking',
        ctaIcon: 'checkmark-circle',
        color: Colors.primary,
      };
    case 'range':
      return {
        primaryLabel: 'Book Now',
        primaryIcon: 'calendar',
        modalTitle: 'Book Service',
        showDateTime: true,
        showHours: false,
        showMessage: false,
        ctaLabel: 'Confirm Booking',
        ctaIcon: 'checkmark-circle',
        color: Colors.primary,
      };
    case 'hourly':
      return {
        primaryLabel: 'Request Quote',
        primaryIcon: 'time',
        modalTitle: 'Request a Quote',
        showDateTime: true,
        showHours: true,
        showMessage: true,
        ctaLabel: 'Send Request',
        ctaIcon: 'send',
        color: '#3B82F6',
      };
    case 'varies':
    default:
      return {
        primaryLabel: 'Inquire',
        primaryIcon: 'chatbubble-ellipses',
        modalTitle: 'Send Inquiry',
        showDateTime: false,
        showHours: false,
        showMessage: true,
        ctaLabel: 'Send Message',
        ctaIcon: 'send',
        color: '#F59E0B',
      };
  }
};

const formatDate = (date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

// ─── Input Field ─────────────────────────────────────────────────
const InputRow = ({ icon, children }) => (
  <View style={inputStyles.row}>
    <Ionicons name={icon} size={18} color="#888" style={inputStyles.icon} />
    {children}
  </View>
);

const inputStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    gap: 10,
  },
  icon: { width: 20 },
});

// ─── Service Action Modal ─────────────────────────────────────────
const ServiceActionModal = ({ visible, service, onClose, onSubmit, submitting }) => {
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('14:00');
  const [hours, setHours] = useState('1');
  const [people, setPeople] = useState('1');
  const [message, setMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setPhone(''); setDate(new Date()); setTime('14:00');
      setHours('1'); setPeople('1'); setMessage('');
    }
  }, [visible]);

  if (!service) return null;

  const config = getActionConfig(service.pricingType);

  const handleSubmit = () => {
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter your phone number');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Invalid', 'Enter a valid phone number');
      return;
    }
    if (config.showMessage && !message.trim()) {
      Alert.alert('Required', 'Please enter a message');
      return;
    }

    onSubmit({
      phone,
      date: config.showDateTime ? date.toISOString().split('T')[0] : null,
      time: config.showDateTime ? time : null,
      hours: config.showHours ? parseInt(hours) || 1 : null,
      people: config.showDateTime ? parseInt(people) || 1 : null,
      message: message || null,
    });
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: OVERLAY, justifyContent: 'flex-end' }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={modalStyles.card}>
            {/* Handle */}
            <View style={modalStyles.handle} />

            {/* Header */}
            <View style={modalStyles.header}>
              <View style={[modalStyles.iconCircle, { backgroundColor: config.color + '20' }]}>
                <Ionicons name={config.primaryIcon} size={20} color={config.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.title}>{config.modalTitle}</Text>
                <Text style={modalStyles.subtitle} numberOfLines={1}>{service.name}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
                <Ionicons name="close" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Price pill */}
            <View style={modalStyles.pricePill}>
              <Text style={[modalStyles.priceText, { color: config.color }]}>
                {service.priceDisplay}
              </Text>
              {service.isPriceNegotiable && (
                <View style={modalStyles.negotiableTag}>
                  <Text style={modalStyles.negotiableText}>Negotiable</Text>
                </View>
              )}
              <View style={modalStyles.durationTag}>
                <Ionicons name="time-outline" size={12} color="#888" />
                <Text style={modalStyles.durationText}>{service.duration}</Text>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{ paddingHorizontal: 24 }}
            >
              {/* Phone — always required */}
              <InputRow icon="call-outline">
                <TextInput
                  style={modalStyles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Your phone number *"
                  placeholderTextColor="#555"
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />
              </InputRow>

              {/* Date & Time */}
              {config.showDateTime && (
                <>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <InputRow icon="calendar-outline">
                      <Text style={modalStyles.inputText}>{formatDate(date)}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#555" />
                    </InputRow>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                    <InputRow icon="time-outline">
                      <Text style={modalStyles.inputText}>{time}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#555" />
                    </InputRow>
                  </TouchableOpacity>

                  <InputRow icon="people-outline">
                    <TextInput
                      style={modalStyles.input}
                      value={people}
                      onChangeText={setPeople}
                      placeholder="Number of people"
                      placeholderTextColor="#555"
                      keyboardType="number-pad"
                    />
                  </InputRow>
                </>
              )}

              {/* Hours needed (hourly only) */}
              {config.showHours && (
                <InputRow icon="hourglass-outline">
                  <TextInput
                    style={modalStyles.input}
                    value={hours}
                    onChangeText={setHours}
                    placeholder="Hours needed (e.g., 2)"
                    placeholderTextColor="#555"
                    keyboardType="number-pad"
                  />
                </InputRow>
              )}

              {/* Message */}
              {config.showMessage && (
                <View style={[inputStyles.row, { alignItems: 'flex-start', minHeight: 100 }]}>
                  <Ionicons name="chatbubble-outline" size={18} color="#888" style={[inputStyles.icon, { marginTop: 2 }]} />
                  <TextInput
                    style={[modalStyles.input, { flex: 1, textAlignVertical: 'top' }]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder={
                      service.pricingType === 'hourly'
                        ? 'Describe what you need...'
                        : 'Your message or question...'
                    }
                    placeholderTextColor="#555"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}

              {/* Optional notes for bookable */}
              {(service.pricingType === 'fixed' || service.pricingType === 'range') && (
                <View style={[inputStyles.row, { alignItems: 'flex-start', minHeight: 80 }]}>
                  <Ionicons name="document-text-outline" size={18} color="#888" style={[inputStyles.icon, { marginTop: 2 }]} />
                  <TextInput
                    style={[modalStyles.input, { flex: 1, textAlignVertical: 'top' }]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Special requests or notes (optional)"
                    placeholderTextColor="#555"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}

              {/* Info note */}
              <View style={modalStyles.infoNote}>
                <Ionicons name="information-circle-outline" size={14} color="#555" />
                <Text style={modalStyles.infoText}>
                  {service.pricingType === 'fixed' || service.pricingType === 'range'
                    ? 'Provider will confirm your booking via phone'
                    : 'Provider will contact you to discuss details'}
                </Text>
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={[modalStyles.cta, { backgroundColor: config.color }, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Ionicons name={config.ctaIcon} size={18} color="#000" />
                    <Text style={modalStyles.ctaText}>{config.ctaLabel}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose} disabled={submitting}>
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <View style={{ height: 24 }} />
            </ScrollView>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={new Date(`2000-01-01T${time}`)}
                mode="time"
                display="default"
                onChange={(e, t) => {
                  setShowTimePicker(false);
                  if (t) {
                    const h = t.getHours().toString().padStart(2, '0');
                    const m = t.getMinutes().toString().padStart(2, '0');
                    setTime(`${h}:${m}`);
                  }
                }}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  card: {
    backgroundColor: MODAL_BG,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0, borderColor: MODAL_BORDER,
    paddingBottom: 16, maxHeight: '92%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginTop: 14, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
    gap: 12,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center', alignItems: 'center',
  },
  pricePill: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    gap: 8, paddingHorizontal: 24, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
    marginBottom: 16,
  },
  priceText: { fontSize: 16, fontWeight: '700' },
  negotiableTag: {
    backgroundColor: '#F59E0B20', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, borderColor: '#F59E0B40',
  },
  negotiableText: { fontSize: 11, color: '#F59E0B', fontWeight: '600' },
  durationTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 20,
  },
  durationText: { fontSize: 11, color: '#888' },
  input: { flex: 1, color: '#fff', fontSize: 15 },
  inputText: { flex: 1, color: '#fff', fontSize: 15 },
  infoNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 12, borderRadius: 10, marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 12, color: '#666', lineHeight: 17 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16, borderRadius: 14, marginBottom: 10,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#000' },
  cancelBtn: { alignItems: 'center', padding: 14 },
  cancelText: { fontSize: 15, color: '#555', fontWeight: '500' },
});

// ─── Main ServicesTab ─────────────────────────────────────────────
const ServicesTab = ({ providerId, providerName, token, navigation }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // service object
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get(
        `/api/services/providers/${providerId}/dashboard/services`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      setServices(response.data.services || []);
    } catch (err) {
      console.error('Fetch services error:', err);
      setError('Failed to load services.');
      if (err.response?.status === 401) {
        Alert.alert('Session Expired', 'Please login again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [providerId, token]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const onRefresh = () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchServices();
  };

  const handleSubmit = async ({ phone, date, time, hours, people, message }) => {
    if (!activeModal) return;
    const config = getActionConfig(activeModal.pricingType);

    try {
      setSubmitting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (activeModal.pricingType === 'fixed' || activeModal.pricingType === 'range') {
        await axios.post('/api/services/bookings', {
          providerId,
          serviceId: activeModal.id,
          date, time,
          notes: message || '',
          numberOfPeople: people,
          phoneNumber: phone,
        }, { headers: { Authorization: `Bearer ${token}` } });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Booking Confirmed!', `Your booking for ${activeModal.name} has been submitted.`, [
          { text: 'OK', onPress: () => setActiveModal(null) }
        ]);
      } else {
        await axios.post('/api/services/questions/service', {
          providerId,
          serviceId: activeModal.id,
          message: activeModal.pricingType === 'hourly'
            ? `Hours needed: ${hours}\n\n${message}`
            : message,
          customerPhone: phone,
          contactMethod: 'whatsapp',
        }, { headers: { Authorization: `Bearer ${token}` } });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Message Sent!', 'The provider will contact you shortly.', [
          { text: 'OK', onPress: () => setActiveModal(null) }
        ]);
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Failed', err.response?.data?.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Skeleton ──────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.skeletonContainer}>
        {[1, 2, 3].map(i => (
          <View key={i} style={styles.skeletonCard}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonFooter}>
              <View style={styles.skeletonPrice} />
              <View style={styles.skeletonBtn} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView
        contentContainerStyle={styles.errorBox}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      >
        <Ionicons name="alert-circle" size={48} color={Colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchServices}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Services</Text>
          <Text style={styles.sectionSubtitle}>
            {services.length} service{services.length !== 1 ? 's' : ''} available
          </Text>

          {services.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="construct-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>No services yet</Text>
              <Text style={styles.emptySub}>Check back later</Text>
            </View>
          ) : (
            services.map(service => {
              const config = getActionConfig(service.pricingType);
              return (
                <View key={service.id} style={styles.card}>
                  {/* Top row */}
                  <View style={styles.cardTop}>
                    <Text style={styles.cardName} numberOfLines={1}>{service.name}</Text>
                    <Text style={[styles.cardPrice, { color: config.color }]}>
                      {service.priceDisplay}
                    </Text>
                  </View>

                  {/* Description */}
                  {service.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>{service.description}</Text>
                  ) : null}

                  {/* Meta row */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={13} color="#888" />
                      <Text style={styles.metaText}>{service.duration}</Text>
                    </View>
                    {service.category && service.category !== 'General' && (
                      <View style={styles.metaItem}>
                        <Ionicons name="pricetag-outline" size={13} color="#888" />
                        <Text style={styles.metaText}>{service.category}</Text>
                      </View>
                    )}
                    {service.isPriceNegotiable && (
                      <View style={styles.negotiableChip}>
                        <Text style={styles.negotiableChipText}>Negotiable</Text>
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: config.color }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setActiveModal(service);
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name={config.primaryIcon} size={15} color="#000" />
                      <Text style={styles.primaryBtnText}>{config.primaryLabel}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <ServiceActionModal
        visible={!!activeModal}
        service={activeModal}
        onClose={() => setActiveModal(null)}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: 4 },
  sectionSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.lg },

  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.small,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 6,
  },
  cardName: {
    ...Typography.body, color: Colors.text,
    fontWeight: '700', fontSize: 16, flex: 1, marginRight: 8,
  },
  cardPrice: { fontSize: 15, fontWeight: '700' },
  cardDesc: {
    fontSize: 13, color: Colors.textSecondary,
    lineHeight: 18, marginBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, marginBottom: Spacing.md,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  negotiableChip: {
    backgroundColor: '#F59E0B20', paddingHorizontal: 8,
    paddingVertical: 2, borderRadius: 20,
  },
  negotiableChipText: { fontSize: 11, color: '#F59E0B', fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: Spacing.sm },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: BorderRadius.md,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },

  // Skeleton
  skeletonContainer: { padding: Spacing.lg, gap: Spacing.md },
  skeletonCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.cardBorder, gap: Spacing.sm,
  },
  skeletonTitle: { width: '65%', height: 18, backgroundColor: Colors.cardBorder, borderRadius: 6 },
  skeletonLine: { width: '85%', height: 14, backgroundColor: Colors.cardBorder, borderRadius: 6 },
  skeletonFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  skeletonPrice: { width: 80, height: 18, backgroundColor: Colors.cardBorder, borderRadius: 6 },
  skeletonBtn: { width: 100, height: 34, backgroundColor: Colors.cardBorder, borderRadius: 10 },

  // Error
  errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg, minHeight: 300 },
  errorText: { ...Typography.body, color: Colors.danger, textAlign: 'center', marginTop: Spacing.md },
  retryBtn: { marginTop: Spacing.md, backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
  retryText: { ...Typography.button, color: Colors.text },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md, fontWeight: '600' },
  emptySub: { ...Typography.caption, color: Colors.textTertiary, marginTop: 4 },
});

export default ServicesTab;