import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://192.168.100.51:5000/api';
const { width: screenWidth } = Dimensions.get('window');

const RentalDetail = ({ route, navigation }) => {
  const { rentalId } = route.params;
  const { isAuthenticated, currentUser } = useAuth();
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [votingLoading, setVotingLoading] = useState(false);
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    userName: '',
    userWhatsApp: '',
    message: ''
  });
  const [inquiryLoading, setInquiryLoading] = useState(false);

  useEffect(() => {
    fetchRentalDetail();
  }, [rentalId]);

  const fetchRentalDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/rentals/${rentalId}`);
      if (response.data.success) {
        setRental(response.data.data);
        setImageLoading(true);
        setImageError(false);
      }
    } catch (error) {
      console.error('Error fetching rental detail:', error);
      Alert.alert('Error', 'Failed to load rental details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (hasVacancy) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Authentication Required',
        'Please login to vote on rental availability',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    try {
      setVotingLoading(true);
      const response = await axios.post(`${API_URL}/rentals/${rentalId}/vote`, {
        hasVacancy
      });

      if (response.data.success) {
        Alert.alert(
          'Vote Submitted',
          `Thank you for voting that this rental is ${hasVacancy ? 'vacant' : 'occupied'}`
        );
        // Refresh rental data
        fetchRentalDetail();
      }
    } catch (error) {
      console.error('Voting error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit vote'
      );
    } finally {
      setVotingLoading(false);
    }
  };

  const handleInquiry = async () => {
    if (!inquiryForm.userName.trim() || !inquiryForm.userWhatsApp.trim()) {
      Alert.alert('Error', 'Please fill in your name and WhatsApp number');
      return;
    }

    try {
      setInquiryLoading(true);
      const response = await axios.post(`${API_URL}/rentals/${rentalId}/inquire`, {
        userName: inquiryForm.userName.trim(),
        userWhatsApp: inquiryForm.userWhatsApp.trim(),
        message: inquiryForm.message.trim() || "I'm interested in this rental. Please provide more details."
      });

      if (response.data.success) {
        Alert.alert(
          'Inquiry Sent',
          'Your inquiry has been sent successfully. The caretaker will contact you soon.',
          [{ text: 'OK', onPress: () => setInquiryModalVisible(false) }]
        );
        setInquiryForm({ userName: '', userWhatsApp: '', message: '' });
      }
    } catch (error) {
      console.error('Inquiry error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send inquiry'
      );
    } finally {
      setInquiryLoading(false);
    }
  };

  const openLocation = () => {
    if (rental.locationUrl) {
      Linking.openURL(rental.locationUrl).catch(() => {
        Alert.alert('Error', 'Unable to open location');
      });
    }
  };

  const callCaretaker = () => {
    const phoneNumber = rental.caretakerNumber.replace(/\s+/g, '');
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to make call');
    });
  };

  const whatsappCaretaker = () => {
    const phoneNumber = rental.caretakerNumber.replace(/\s+/g, '').replace('+', '');
    const message = `Hi, I'm interested in the ${rental.name} rental in ${rental.location}. Is it still available?`;
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp');
    });
  };

  const getVacancyStatusColor = (status) => {
    switch (status) {
      case 'verified_vacant':
        return '#059669'; // Deep emerald green
      case 'verified_occupied':
        return '#DC2626'; // Deep red
      default:
        return '#D97706'; // Deep orange
    }
  };

  const getVacancyStatusText = (status) => {
    switch (status) {
      case 'verified_vacant':
        return 'Available';
      case 'verified_occupied':
        return 'Occupied';
      default:
        return 'Status Unknown';
    }
  };

  const renderImage = () => {
    if (!rental.imageUrl) {
      return (
        <View style={styles.placeholderImage}>
          <Ionicons name="home-outline" size={60} color="#6B7280" />
          <Text style={styles.placeholderText}>No Image Available</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={styles.imageLoadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
          </View>
        )}
        <Image
          source={{ uri: rental.imageUrl }}
          style={styles.rentalImage}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
        {imageError && (
          <View style={styles.imageErrorContainer}>
            <Ionicons name="image-outline" size={40} color="#6B7280" />
            <Text style={styles.imageErrorText}>Failed to load image</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading rental details...</Text>
      </View>
    );
  }

  if (!rental) {
    return (
      <View style={styles.centerContainer}>
        <Text>Rental not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Image Section */}
      {renderImage()}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.rentalName}>{rental.name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getVacancyStatusColor(rental.vacancyStatus) }
        ]}>
          <Text style={styles.statusText}>
            {getVacancyStatusText(rental.vacancyStatus)}
          </Text>
        </View>
      </View>

      {/* Main Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={24} color="#059669" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{rental.location}</Text>
          </View>
          {rental.locationUrl && (
            <TouchableOpacity onPress={openLocation} style={styles.actionButton}>
              <Ionicons name="map" size={20} color="#059669" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="home" size={24} color="#059669" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{rental.type}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="cash" size={24} color="#059669" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Monthly Rent</Text>
            <Text style={styles.priceValue}>KSh {rental.amount.toLocaleString()}</Text>
          </View>
        </View>

        {/* <View style={styles.infoRow}>
          <Ionicons name="call" size={24} color="#D97706" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Caretaker</Text>
            <Text style={styles.infoValue}>{rental.caretakerNumber}</Text>
          </View>
          <View style={styles.contactButtons}>
            <TouchableOpacity onPress={callCaretaker} style={[styles.actionButton, styles.callButton]}>
              <Ionicons name="call" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={whatsappCaretaker} style={[styles.actionButton, styles.whatsappButton]}>
              <Ionicons name="logo-whatsapp" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View> */}
      </View>

      {/* Community Votes - Subtle */}
      {rental.voteStats && rental.voteStats.totalVotes > 0 && (
        <View style={styles.subtleVoteSection}>
          <Text style={styles.subtleVoteText}>
            {rental.voteStats.totalVotes} community vote{rental.voteStats.totalVotes !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Voting Buttons - Prominent */}
      <View style={styles.votingSection}>
        <Text style={styles.votingSectionTitle}>Help Others - Vote on Availability</Text>
        <Text style={styles.votingSubtitle}>Share what you know about this rental</Text>
        <View style={styles.votingButtons}>
          <TouchableOpacity
            style={[styles.voteButton, styles.vacantButton]}
            onPress={() => handleVote(true)}
            disabled={votingLoading}
          >
            {votingLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.voteButtonText}>It's Available</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.voteButton, styles.occupiedButton]}
            onPress={() => handleVote(false)}
            disabled={votingLoading}
          >
            {votingLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="close-circle" size={24} color="#fff" />
                <Text style={styles.voteButtonText}>It's Occupied</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Inquiry Button */}
      <TouchableOpacity
        style={styles.inquiryButton}
        onPress={() => setInquiryModalVisible(true)}
      >
        <Ionicons name="mail" size={20} color="#fff" />
        <Text style={styles.inquiryButtonText}>Send Inquiry</Text>
      </TouchableOpacity>

      {/* Inquiry Modal */}
      <Modal
        visible={inquiryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInquiryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Inquiry</Text>
              <TouchableOpacity
                onPress={() => setInquiryModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Your Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={inquiryForm.userName}
                  onChangeText={(text) => setInquiryForm({ ...inquiryForm, userName: text })}
                  placeholder="Enter your full name"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>WhatsApp Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={inquiryForm.userWhatsApp}
                  onChangeText={(text) => setInquiryForm({ ...inquiryForm, userWhatsApp: text })}
                  placeholder="+254712345678"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Message (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.messageInput]}
                  value={inquiryForm.message}
                  onChangeText={(text) => setInquiryForm({ ...inquiryForm, message: text })}
                  placeholder="I'm interested in this rental. Please provide more details."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleInquiry}
                disabled={inquiryLoading}
              >
                {inquiryLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Send Inquiry</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 16,
  },
  // Image Styles
  imageContainer: {
    width: screenWidth,
    aspectRatio: 3.6,
    position: 'relative',
  },
 rentalImage: {
  width: '100%',
  height: '100%',
  resizeMode: 'contain',
},
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    zIndex: 1,
  },
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  imageErrorText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  placeholderImage: {
    width: screenWidth,
    height: 250,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  // Header Styles
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rentalName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Info Section Styles
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 22,
    color: '#059669',
    fontWeight: 'bold',
  },
  actionButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  callButton: {
    backgroundColor: '#059669',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  // Subtle Vote Section
  subtleVoteSection: {
    backgroundColor: '#f9fafb',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#d1d5db',
  },
  subtleVoteText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  // Voting Section Styles
  votingSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  votingSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  votingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  votingButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  vacantButton: {
    backgroundColor: '#059669',
  },
  occupiedButton: {
    backgroundColor: '#DC2626',
  },
  voteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Inquiry Button
  inquiryButton: {
    backgroundColor: '#059669',
    margin: 20,
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  inquiryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 6,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default RentalDetail;