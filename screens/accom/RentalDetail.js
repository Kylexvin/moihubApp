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
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://moihub.onrender.com/api';
const { width: screenWidth } = Dimensions.get('window');

// Luxury Emerald Green color palette matching RentalHome
const RentalColors = {
  primary: '#0A4D3C',      // Deep Emerald
  secondary: '#1E7A5C',     // Medium Emerald
  accent: '#C6A43F',        // Gold
  highlight: '#E8C66A',     // Light Gold
  success: '#2E8B57',       // Sea Green
  warning: '#D4A017',       // Gold
  error: '#B22222',         // Ruby Red
  background: '#0C1F1A',    // Dark Forest
  surface: '#1A332B',       // Deep Jungle
  card: '#234D3C',          // Rich Emerald
  text: '#FFFFFF',          // White
  textSecondary: '#D4E6D0', // Mint Cream
  textMuted: '#8BA89B',     // Sage
  border: '#2C5E4A',        // Forest Border
  gold: '#D4AF37',          // Pure Gold
  goldLight: '#F1E6B0',     // Champagne
};

const RentalDetail = ({ route, navigation }) => {
  const { rentalId } = route.params;
  const { isAuthenticated, currentUser } = useAuth();
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [votingLoading, setVotingLoading] = useState(false);
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
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

  const getVacancyStatusColor = (rental) => {
    if (rental.adminOverride?.isActive) {
      return rental.hasVacant ? RentalColors.success : RentalColors.error;
    }
    
    switch (rental.vacancyStatus) {
      case 'verified_vacant':
        return RentalColors.success;
      case 'verified_occupied':
        return RentalColors.error;
      default:
        return RentalColors.warning;
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
    });
  };

  const renderImage = () => {
    if (!rental.imageUrl) {
      return (
        <View style={styles.placeholderImage}>
          <Ionicons name="home-outline" size={60} color={RentalColors.gold} />
          <Text style={styles.placeholderText}>No Image Available</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={styles.imageLoadingContainer}>
            <ActivityIndicator size="large" color={RentalColors.gold} />
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
            <Ionicons name="image-outline" size={40} color={RentalColors.textMuted} />
            <Text style={styles.imageErrorText}>Failed to load image</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[RentalColors.background, RentalColors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <Animatable.View animation="pulse" iterationCount="infinite">
            <View style={styles.loadingIcon}>
              <Ionicons name="home" size={60} color={RentalColors.gold} />
            </View>
          </Animatable.View>
          <ActivityIndicator size="large" color={RentalColors.gold} />
          <Text style={styles.loadingText}>Loading luxury details...</Text>
        </View>
      </View>
    );
  }

  if (!rental) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[RentalColors.background, RentalColors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={RentalColors.gold} />
          <Text style={styles.errorTitle}>Rental Not Found</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={[RentalColors.primary, RentalColors.secondary]}
              style={styles.errorButtonGradient}
            >
              <Text style={styles.errorButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={RentalColors.primary} />
      
      <LinearGradient
        colors={[RentalColors.background, RentalColors.surface]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating Gold Icons */}
      <View style={styles.floatingIcons}>
        <Text style={[styles.floatingIcon, styles.icon1]}>👑</Text>
        <Text style={[styles.floatingIcon, styles.icon2]}>✨</Text>
        <Text style={[styles.floatingIcon, styles.icon3]}>🏰</Text>
        <Text style={[styles.floatingIcon, styles.icon4]}>💎</Text>
      </View>

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={RentalColors.gold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Property Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Section with Gold Accent - Original dimensions preserved */}
        <View style={styles.imageWrapper}>
          {renderImage()}
          <View style={styles.imageGoldAccent} />
        </View>

        {/* Title and Status */}
        <View style={styles.titleSection}>
          <Text style={styles.rentalName}>{rental.name}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getVacancyStatusColor(rental) + '20' }
          ]}>
            <Ionicons 
              name={getStatusBadgeIcon(rental)} 
              size={16} 
              color={getVacancyStatusColor(rental)} 
            />
            <Text style={[styles.statusText, { color: getVacancyStatusColor(rental) }]}>
              {getVacancyStatusText(rental)}
            </Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'contact' && styles.activeTab]}
            onPress={() => setActiveTab('contact')}
          >
            <Text style={[styles.tabText, activeTab === 'contact' && styles.activeTabText]}>
              Contact
            </Text>
          </TouchableOpacity>
        </View>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <Animatable.View animation="fadeIn" duration={300}>
            {/* Main Info Card */}
            <LinearGradient
              colors={[RentalColors.card, RentalColors.surface]}
              style={styles.infoCard}
            >
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="location" size={22} color={RentalColors.gold} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{rental.location}</Text>
                </View>
                {rental.locationUrl && (
                  <TouchableOpacity onPress={openLocation} style={styles.iconButton}>
                    <Ionicons name="map-outline" size={20} color={RentalColors.gold} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="home" size={22} color={RentalColors.gold} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Property Type</Text>
                  <Text style={styles.infoValue}>
                    {rental.type === 'bedsitter' ? 'Bedsitter' : 
                     rental.type === 'one-bedroom' ? '1 Bedroom' : '2 Bedroom'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="cash" size={22} color={RentalColors.gold} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Monthly Rent</Text>
                  <Text style={styles.priceValue}>KSh {rental.amount.toLocaleString()}</Text>
                </View>
              </View>

              {rental.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Description</Text>
                  <Text style={styles.descriptionText}>{rental.description}</Text>
                </View>
              )}
            </LinearGradient>

            {/* Community Stats */}
            {!rental.adminOverride?.isActive && rental.voteStats && (
              <LinearGradient
                colors={[RentalColors.card, RentalColors.surface]}
                style={styles.statsCard}
              >
                <View style={styles.statsHeader}>
                  <Ionicons name="people" size={20} color={RentalColors.gold} />
                  <Text style={styles.statsTitle}>Community Insights</Text>
                </View>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{rental.voteStats.totalVotes || 0}</Text>
                    <Text style={styles.statLabel}>Total Votes</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: RentalColors.success }]}>
                      {rental.voteStats.vacantVotes || 0}
                    </Text>
                    <Text style={styles.statLabel}>Say Available</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: RentalColors.error }]}>
                      {rental.voteStats.occupiedVotes || 0}
                    </Text>
                    <Text style={styles.statLabel}>Say Occupied</Text>
                  </View>
                </View>
              </LinearGradient>
            )}

            {/* Voting Section */}
            {!rental.adminOverride?.isActive && (
              <LinearGradient
                colors={[RentalColors.card, RentalColors.surface]}
                style={styles.votingCard}
              >
                <Text style={styles.votingTitle}>Help the Community</Text>
                <Text style={styles.votingSubtitle}>Do you know if this property is available?</Text>
                
                <View style={styles.votingButtons}>
                  <TouchableOpacity
                    style={[styles.voteButton, styles.vacantButton]}
                    onPress={() => handleVote(true)}
                    disabled={votingLoading}
                  >
                    <LinearGradient
                      colors={[RentalColors.success, RentalColors.success + 'cc']}
                      style={styles.voteButtonGradient}
                    >
                      {votingLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#fff" />
                          <Text style={styles.voteButtonText}>Available</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.voteButton, styles.occupiedButton]}
                    onPress={() => handleVote(false)}
                    disabled={votingLoading}
                  >
                    <LinearGradient
                      colors={[RentalColors.error, RentalColors.error + 'cc']}
                      style={styles.voteButtonGradient}
                    >
                      {votingLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="close-circle" size={20} color="#fff" />
                          <Text style={styles.voteButtonText}>Occupied</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            )}

            {/* Admin Override Notice */}
            {rental.adminOverride?.isActive && (
              <LinearGradient
                colors={[RentalColors.card, RentalColors.surface]}
                style={styles.adminNotice}
              >
                <Ionicons name="shield-checkmark" size={24} color={RentalColors.gold} />
                <Text style={styles.adminNoticeTitle}>Admin Verified</Text>
                <Text style={styles.adminNoticeText}>
                  This property's status has been verified by an administrator
                </Text>
                <Text style={styles.adminNoticeDate}>
                  Verified on {formatDate(rental.adminOverride.timestamp)}
                </Text>
              </LinearGradient>
            )}
          </Animatable.View>
        )}

        {/* Contact Tab - No direct calling, only inquiry */}
        {activeTab === 'contact' && (
          <Animatable.View animation="fadeIn" duration={300}>


            {/* Inquiry Button */}
            <TouchableOpacity
              style={styles.inquiryButton}
              onPress={() => setInquiryModalVisible(true)}
            >
              <LinearGradient
                colors={[RentalColors.primary, RentalColors.secondary]}
                style={styles.inquiryButtonGradient}
              >
                <Ionicons name="mail" size={20} color={RentalColors.gold} />
                <Text style={styles.inquiryButtonText}>Send Inquiry</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>
        )}
      </ScrollView>

      {/* Inquiry Modal */}
      <Modal
        visible={inquiryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInquiryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="slideInUp" duration={300} style={styles.modalContent}>
            <LinearGradient
              colors={[RentalColors.surface, RentalColors.card]}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Ionicons name="mail" size={24} color={RentalColors.gold} />
                  <Text style={styles.modalTitle}>Send Inquiry</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setInquiryModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={RentalColors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Your Name *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={18} color={RentalColors.gold} />
                    <TextInput
                      style={styles.textInput}
                      value={inquiryForm.userName}
                      onChangeText={(text) => setInquiryForm({ ...inquiryForm, userName: text })}
                      placeholder="Enter your full name"
                      placeholderTextColor={RentalColors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>WhatsApp Number *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="logo-whatsapp" size={18} color={RentalColors.gold} />
                    <TextInput
                      style={styles.textInput}
                      value={inquiryForm.userWhatsApp}
                      onChangeText={(text) => setInquiryForm({ ...inquiryForm, userWhatsApp: text })}
                      placeholder="+254712345678"
                      placeholderTextColor={RentalColors.textMuted}
                      keyboardType="phone-pad"
                    />
                  </View>
                  <Text style={styles.inputHelper}>
                    The caretaker will contact you on this number
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Message (Optional)</Text>
                  <View style={[styles.inputContainer, styles.messageContainer]}>
                    <TextInput
                      style={[styles.textInput, styles.messageInput]}
                      value={inquiryForm.message}
                      onChangeText={(text) => setInquiryForm({ ...inquiryForm, message: text })}
                      placeholder="I'm interested in this rental. Please provide more details."
                      placeholderTextColor={RentalColors.textMuted}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleInquiry}
                  disabled={inquiryLoading}
                >
                  <LinearGradient
                    colors={[RentalColors.primary, RentalColors.secondary]}
                    style={styles.submitButtonGradient}
                  >
                    {inquiryLoading ? (
                      <ActivityIndicator size="small" color={RentalColors.gold} />
                    ) : (
                      <Text style={styles.submitButtonText}>Send Inquiry</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </LinearGradient>
          </Animatable.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RentalColors.background,
  },
  floatingIcons: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  floatingIcon: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.1,
    color: RentalColors.gold,
  },
  icon1: {
    top: '10%',
    right: '5%',
    transform: [{ rotate: '15deg' }],
  },
  icon2: {
    top: '30%',
    left: '5%',
    transform: [{ rotate: '-10deg' }],
  },
  icon3: {
    bottom: '20%',
    right: '10%',
    transform: [{ rotate: '25deg' }],
  },
  icon4: {
    bottom: '40%',
    left: '8%',
    transform: [{ rotate: '-15deg' }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: RentalColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RentalColors.gold + '40',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: RentalColors.gold,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: RentalColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: RentalColors.gold + '40',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: RentalColors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: RentalColors.gold,
    marginTop: 16,
    marginBottom: 20,
  },
  errorButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  errorButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  errorButtonText: {
    color: RentalColors.gold,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  // Original image dimensions preserved
  imageWrapper: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
  },
  imageGoldAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: RentalColors.gold,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3.75, // Your original aspect ratio (750:200)
    backgroundColor: RentalColors.surface,
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
    backgroundColor: RentalColors.surface,
    zIndex: 1,
  },
  imageErrorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: RentalColors.surface,
  },
  imageErrorText: {
    fontSize: 14,
    color: RentalColors.textMuted,
    marginTop: 8,
  },
  placeholderImage: {
    width: '100%',
    aspectRatio: 3.75, // Match your original aspect ratio
    backgroundColor: RentalColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: RentalColors.textMuted,
    marginTop: 8,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  rentalName: {
    fontSize: 24,
    fontWeight: '700',
    color: RentalColors.gold,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
  },
  activeTab: {
    backgroundColor: RentalColors.primary,
    borderColor: RentalColors.gold,
  },
  tabText: {
    fontSize: 14,
    color: RentalColors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: RentalColors.gold,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: RentalColors.gold + '20',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: RentalColors.gold + '20',
  },
  infoIconContainer: {
    width: 32,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: RentalColors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: RentalColors.textSecondary,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 18,
    color: RentalColors.gold,
    fontWeight: '700',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: RentalColors.primary + '20',
  },
  descriptionContainer: {
    marginTop: 12,
  },
  descriptionLabel: {
    fontSize: 14,
    color: RentalColors.gold,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: RentalColors.textSecondary,
    lineHeight: 20,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: RentalColors.gold + '20',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: RentalColors.gold,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: RentalColors.textSecondary,
  },
  statLabel: {
    fontSize: 12,
    color: RentalColors.textMuted,
    marginTop: 4,
  },
  votingCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: RentalColors.gold + '20',
  },
  votingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: RentalColors.gold,
    textAlign: 'center',
  },
  votingSubtitle: {
    fontSize: 13,
    color: RentalColors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  votingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  voteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  adminNotice: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RentalColors.gold + '40',
  },
  adminNoticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: RentalColors.gold,
    marginTop: 8,
    marginBottom: 4,
  },
  adminNoticeText: {
    fontSize: 13,
    color: RentalColors.textMuted,
    textAlign: 'center',
  },
  adminNoticeDate: {
    fontSize: 11,
    color: RentalColors.textMuted,
    marginTop: 8,
  },
  contactCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: RentalColors.gold + '20',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: RentalColors.gold,
    marginBottom: 16,
  },
  contactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  contactInfoLabel: {
    fontSize: 14,
    color: RentalColors.textMuted,
  },
  contactInfoValue: {
    fontSize: 14,
    color: RentalColors.textSecondary,
    fontWeight: '500',
  },
  contactNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: RentalColors.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RentalColors.gold + '20',
  },
  contactNumberText: {
    fontSize: 14,
    color: RentalColors.textSecondary,
  },
  inquiryNote: {
    flexDirection: 'row',
    backgroundColor: RentalColors.primary + '20',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
  },
  inquiryNoteText: {
    flex: 1,
    fontSize: 12,
    color: RentalColors.textMuted,
    lineHeight: 18,
  },
  inquiryButton: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 30,
    overflow: 'hidden',
  },
  inquiryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  inquiryButtonText: {
    color: RentalColors.gold,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalGradient: {
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: RentalColors.gold + '30',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: RentalColors.gold,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalForm: {
    padding: 20,
    maxHeight: 500,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: RentalColors.gold,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: RentalColors.gold + '30',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: RentalColors.background,
  },
  textInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: RentalColors.text,
    marginLeft: 8,
  },
  inputHelper: {
    fontSize: 11,
    color: RentalColors.textMuted,
    marginTop: 4,
    marginLeft: 4,
  },
  messageContainer: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 16,
  },
  submitButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: RentalColors.gold,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RentalDetail;
