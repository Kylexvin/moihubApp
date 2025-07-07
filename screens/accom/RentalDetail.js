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

const API_URL = 'https://moihub.onrender.com/api';
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

    // Check if voting is disabled due to admin override
    if (rental.adminOverride?.isActive) {
      Alert.alert(
        'Voting Disabled',
        'An admin has verified the status of this rental. Voting is currently disabled.',
        [{ text: 'OK', style: 'default' }]
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

  // Improved functions to handle admin override status
  const getVacancyStatusColor = (rental) => {
    if (rental.adminOverride?.isActive) {
      return rental.hasVacant ? '#059669' : '#DC2626';
    }
    
    switch (rental.vacancyStatus) {
      case 'verified_vacant':
        return '#059669';
      case 'verified_occupied':
        return '#DC2626';
      default:
        return '#D97706';
    }
  };

  const getVacancyStatusText = (rental) => {
    if (rental.adminOverride?.isActive) {
      return rental.hasVacant ? 'Available' : 'Occupied';
    }
    
    switch (rental.vacancyStatus) {
      case 'verified_vacant':
        return 'Available';
      case 'verified_occupied':
        return 'Occupied';
      default:
        return 'Status Unknown';
    }
  };

  const getStatusBadgeIcon = (rental) => {
    if (rental.adminOverride?.isActive) {
      return 'shield-checkmark';
    }
    
    switch (rental.vacancyStatus) {
      case 'verified_vacant':
      case 'verified_occupied':
        return 'checkmark-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.rentalName}>{rental.name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getVacancyStatusColor(rental) }
        ]}>
          <Ionicons 
            name={getStatusBadgeIcon(rental)} 
            size={16} 
            color="#fff" 
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            {getVacancyStatusText(rental)}
          </Text>
        </View>
      </View>



      {/* Image Section */}
      {renderImage()}

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
      </View>

      {/* Community Votes - Only show if not admin overridden */}
      {!rental.adminOverride?.isActive && rental.voteStats && rental.voteStats.totalVotes > 0 && (
        <View style={styles.subtleVoteSection}>
          <Text style={styles.subtleVoteText}>
            {rental.voteStats.totalVotes} community vote{rental.voteStats.totalVotes !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Voting Buttons - Hide if admin override is active */}
      {!rental.adminOverride?.isActive && (
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
      )}

      {/* Voting disabled notice for admin override */}
      {rental.adminOverride?.isActive && (
        <View style={styles.votingDisabledSection}>
          <View style={styles.votingDisabledContent}>
            <Ionicons name="lock-closed" size={20} color="#6B7280" />
            <Text style={styles.votingDisabledText}>
              Community voting is disabled for admin-verified rentals
            </Text>
          </View>
        </View>
      )}

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
    backgroundColor: 'ivory',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    marginBottom: 12,
    borderBottomColor: '#e5e7eb',
  },
  rentalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 15,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 100,
    justifyContent: 'center',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
 imageContainer: {
  width: '100%',
  aspectRatio: 3.75, // match exact 750:200 ratio
  backgroundColor: '#f3f4f6',
  borderRadius: 12,
  overflow: 'hidden',
  marginBottom: 12,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
},


rentalImage: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},

imageLoadingContainer: {
  ...StyleSheet.absoluteFillObject,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f3f4f6',
  zIndex: 1,
},

imageErrorContainer: {
  ...StyleSheet.absoluteFillObject,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f3f4f6',
},

imageErrorText: {
  fontSize: 14,
  color: '#6B7280',
  marginTop: 8,
},

placeholderImage: {
  width: '100%',
  aspectRatio: 3.75, // match full image shape to avoid size jump
  backgroundColor: '#f3f4f6',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 12,
  marginBottom: 12,
},


placeholderText: {
  fontSize: 14,
  color: '#6B7280',
  marginTop: 8,
},

  infoSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 18,
    color: '#059669',
    fontWeight: 'bold',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
  },
  subtleVoteSection: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  subtleVoteText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  votingSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  votingSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  votingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  votingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  vacantButton: {
    backgroundColor: '#059669',
  },
  occupiedButton: {
    backgroundColor: '#DC2626',
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  votingDisabledSection: {
    backgroundColor: '#f9fafb',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  votingDisabledContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  votingDisabledText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  inquiryButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  inquiryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
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
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RentalDetail;