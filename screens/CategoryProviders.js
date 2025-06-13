// screens/CategoryProviders.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Linking,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://192.168.100.51:5000/api';

const CategoryProviders = ({ route, navigation }) => {
  const { category } = route.params;
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await axios.get(`${API_URL}/services/providers/${category._id}`);
      setProviders(response.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
      Alert.alert('Error', 'Failed to load providers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProviders();
    setRefreshing(false);
  }, []);

  const handleCall = (phoneNumber, serviceTitle) => {
    Alert.alert(
      'Call Service Provider',
      `Call ${phoneNumber} for "${serviceTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL(`tel:${phoneNumber}`)
        }
      ]
    );
  };

  const openRatingModal = (service) => {
    setSelectedService(service);
    setShowRatingModal(true);
  };

  const renderProvider = ({ item }) => (
    <View style={styles.providerCard}>
      <View style={styles.providerHeader}>
        <View style={styles.providerInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={48} color="#2E8B57" />
          </View>
          <View style={styles.providerDetails}>
            <Text style={styles.providerUsername}>{item.provider.username}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>
                {item.provider.averageRating ? 
                  `${item.provider.averageRating.toFixed(1)} (${item.totalRatings || 0} reviews)` : 
                  'No ratings yet'
                }
              </Text>
            </View>
            <View style={styles.verificationBadge}>
              <Ionicons 
                name={item.provider.verificationStatus === 'verified' ? "checkmark-circle" : "time"} 
                size={14} 
                color={item.provider.verificationStatus === 'verified' ? "#2E8B57" : "#FFA500"} 
              />
              <Text style={[
                styles.verificationText,
                { color: item.provider.verificationStatus === 'verified' ? "#2E8B57" : "#FFA500" }
              ]}>
                {item.provider.verificationStatus === 'verified' ? 'Verified Provider' : 'Pending Verification'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.servicesContainer}>
        <Text style={styles.servicesTitle}>Available Services</Text>
        {item.services.map((service, index) => (
          <View key={service._id} style={[styles.serviceItem, { marginBottom: index === item.services.length - 1 ? 0 : 12 }]}>
            <View style={styles.serviceHeader}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <View style={styles.contactInfo}>
                  <Ionicons name="call" size={14} color="#666" />
                  <Text style={styles.phoneNumber}>{service.phoneNumber}</Text>
                </View>
                {service.ratings && service.ratings.length > 0 && (
                  <View style={styles.serviceRating}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.serviceRatingText}>
                      {service.ratings.length} rating{service.ratings.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.serviceActions}>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => handleCall(service.phoneNumber, service.title)}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={16} color="white" />
                <Text style={styles.buttonText}>Call Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.rateButton}
                onPress={() => openRatingModal(service)}
                activeOpacity={0.7}
              >
                <Ionicons name="star-outline" size={16} color="#2E8B57" />
                <Text style={styles.rateButtonText}>Rate Service</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="business" size={64} color="#C0C0C0" />
      <Text style={styles.emptyStateTitle}>No Providers Found</Text>
      <Text style={styles.emptyStateText}>
        No service providers are available in this category yet.
      </Text>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={fetchProviders}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E8B57" />
        <Text style={styles.loadingText}>Loading providers...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{category.name}</Text>
          <Text style={styles.subtitle}>
            {providers.length} provider{providers.length !== 1 ? 's' : ''} available
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={providers}
        renderItem={renderProvider}
        keyExtractor={(item, index) => `${item.provider._id}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          providers.length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2E8B57']}
            tintColor="#2E8B57"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      <RatingModal
        visible={showRatingModal}
        service={selectedService}
        onClose={() => {
          setShowRatingModal(false);
          setSelectedService(null);
        }}
        onRatingSubmitted={() => {
          fetchProviders();
          setShowRatingModal(false);
          setSelectedService(null);
        }}
      />
    </SafeAreaView>
  );
};

// Enhanced Rating Modal Component
// Enhanced Rating Modal Component with User-Friendly Error Messages
const RatingModal = ({ visible, service, onClose, onRatingSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, currentUser, token } = useAuth();

  useEffect(() => {
    if (!visible) {
      setRating(0);
    }
  }, [visible]);

  const getUserFriendlyErrorMessage = (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || '';
      
      switch (status) {
        case 400:
          if (message.toLowerCase().includes('already rated')) {
            return {
              title: 'Already Rated',
              message: 'You have already rated this service. You can only rate each service once.',
              type: 'info'
            };
          }
          if (message.toLowerCase().includes('invalid rating')) {
            return {
              title: 'Invalid Rating',
              message: 'Please select a rating between 1 and 5 stars.',
              type: 'warning'
            };
          }
          return {
            title: 'Invalid Request',
            message: message || 'Please check your rating and try again.',
            type: 'warning'
          };
          
        case 401:
          return {
            title: 'Session Expired',
            message: 'Your login session has expired. Please log in again to rate services.',
            type: 'auth'
          };
          
        case 403:
          return {
            title: 'Permission Denied',
            message: 'You do not have permission to rate this service.',
            type: 'warning'
          };
          
        case 404:
          return {
            title: 'Service Not Found',
            message: 'This service is no longer available. Please refresh and try again.',
            type: 'error'
          };
          
        case 409:
          return {
            title: 'Already Rated',
            message: 'You have already submitted a rating for this service. Each user can only rate a service once.',
            type: 'info'
          };
          
        case 429:
          return {
            title: 'Too Many Attempts',
            message: 'You are submitting ratings too quickly. Please wait a moment and try again.',
            type: 'warning'
          };
          
        case 500:
          return {
            title: 'Server Error',
            message: 'Our servers are experiencing issues. Please try again in a few minutes.',
            type: 'error'
          };
          
        default:
          return {
            title: 'Rating Failed',
            message: message || `An unexpected error occurred (Error ${status}). Please try again.`,
            type: 'error'
          };
      }
    } else if (error.request) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to our servers. Please check your internet connection and try again.',
        type: 'network'
      };
    } else if (error.code === 'ECONNABORTED') {
      return {
        title: 'Request Timeout',
        message: 'The request took too long to complete. Please try again.',
        type: 'timeout'
      };
    } else {
      return {
        title: 'Unexpected Error',
        message: error.message || 'Something went wrong. Please try again.',
        type: 'error'
      };
    }
  };

  const submitRating = async () => {
    // Check authentication first
    if (!isAuthenticated || !token || !currentUser) {
      Alert.alert(
        'Login Required', 
        'Please log in to your account to rate services. This helps us maintain quality and prevent spam.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => {
            onClose();
            // Navigate to login screen if available
            // navigation.navigate('Login');
          }}
        ]
      );
      return;
    }

    // Validate rating
    if (rating === 0 || rating < 1 || rating > 5) {
      Alert.alert(
        'Please Select a Rating', 
        'Choose between 1 and 5 stars to rate this service based on your experience.'
      );
      return;
    }

    // Validate service
    if (!service || !service._id) {
      Alert.alert('Service Error', 'Service information is missing. Please try again.');
      return;
    }

    setSubmitting(true);
    
    try {
      console.log('Submitting rating:', {
        serviceId: service._id,
        rating: rating,
        userId: currentUser.id,
        token: token ? 'Token present' : 'No token'
      });

      const axiosConfig = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      };

      const requestData = {
        rating: parseInt(rating),
        userId: currentUser.id
      };

      const response = await axios.post(
        `${API_URL}/services/${service._id}/rate`, 
        requestData,
        axiosConfig
      );

      console.log('Rating submission successful:', response.data);

      // Success message with personalized feedback
      const ratingText = rating === 1 ? 'star' : 'stars';
      const appreciationText = rating >= 4 ? 
        'Thank you for the positive feedback!' : 
        'Thank you for your honest feedback!';

      Alert.alert(
        'Rating Submitted!', 
        `Your ${rating}-${ratingText} rating has been recorded. ${appreciationText}`,
        [{ text: 'OK', onPress: onRatingSubmitted }]
      );
      
    } catch (error) {
      console.error('Rating submission error:', error);
      
      const errorInfo = getUserFriendlyErrorMessage(error);
      
      // Show different alert styles based on error type
      if (errorInfo.type === 'info') {
        Alert.alert(errorInfo.title, errorInfo.message, [
          { text: 'OK', style: 'default' }
        ]);
      } else if (errorInfo.type === 'auth') {
        Alert.alert(errorInfo.title, errorInfo.message, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => {
            onClose();
            // Navigate to login screen
          }}
        ]);
      } else {
        Alert.alert(errorInfo.title, errorInfo.message, [
          { text: 'OK', style: 'default' }
        ]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return [...Array(5)].map((_, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => setRating(index + 1)}
        style={styles.starButton}
        activeOpacity={0.7}
        disabled={submitting}
      >
        <Ionicons
          name={index < rating ? "star" : "star-outline"}
          size={36}
          color={index < rating ? "#FFD700" : "#DDD"}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rate This Service</Text>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton}
              disabled={submitting}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {service && (
            <View style={styles.serviceDetails}>
              <Text style={styles.modalServiceTitle}>{service.title}</Text>
              <Text style={styles.serviceSubtitle}>How was your experience with this service?</Text>
            </View>
          )}

          <View style={styles.starsContainer}>
            {renderStars()}
          </View>

          {rating > 0 && (
            <View style={styles.ratingDescription}>
              <Text style={styles.ratingDescriptionText}>
                {rating === 1 && "⭐ Poor - Service didn't meet expectations"}
                {rating === 2 && "⭐⭐ Fair - Service was below average"}
                {rating === 3 && "⭐⭐⭐ Good - Service met expectations"}
                {rating === 4 && "⭐⭐⭐⭐ Very Good - Service exceeded expectations"}
                {rating === 5 && "⭐⭐⭐⭐⭐ Excellent - Outstanding service!"}
              </Text>
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.cancelButton, submitting && styles.disabledButton]}
              onPress={onClose}
              activeOpacity={0.7}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.submitButton, 
                (submitting || rating === 0) && styles.disabledButton
              ]}
              onPress={submitRating}
              disabled={submitting || rating === 0}
              activeOpacity={0.7}
            >
              {submitting ? (
                <View style={styles.submittingContainer}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.submittingText}>Submitting...</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {rating > 0 ? `Submit ${rating} Star Rating` : 'Select Rating First'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F8F0',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2E8B57',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#E6F3E6',
    opacity: 0.9,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  providerCard: {
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  providerHeader: {
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  providerDetails: {
    flex: 1,
  },
  providerUsername: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E8B57',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  servicesContainer: {
    padding: 20,
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8B57',
    marginBottom: 16,
  },
  serviceItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
  },
  serviceHeader: {
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceRatingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  callButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  rateButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#2E8B57',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  rateButtonText: {
    color: '#2E8B57',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E8B57',
  },
  closeButton: {
    padding: 4,
  },
  serviceDetails: {
    alignItems: 'center',
    marginBottom: 32,
  },
  modalServiceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  serviceSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  starButton: {
    marginHorizontal: 8,
    padding: 8,
  },
  ratingDescription: {
    alignItems: 'center',
    marginBottom: 32,
  },
  ratingDescriptionText: {
    fontSize: 16,
    color: '#2E8B57',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2E8B57',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default CategoryProviders;