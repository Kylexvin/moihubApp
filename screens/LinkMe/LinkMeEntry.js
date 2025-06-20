import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://192.168.100.51:5000/api';

const LinkMeEntry = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, isAuthenticated } = useAuth();
  const hasNavigated = useRef(false);

  const checkLinkMeStatus = async () => {
    // Prevent multiple simultaneous API calls
    if (hasNavigated.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!isAuthenticated || !token) {
        // If not authenticated, navigate back to auth flow
        hasNavigated.current = true;
        navigation.replace('Auth');
        return;
      }

      console.log('Checking LinkMe status...');
      const response = await axios.get(`${API_URL}/linkme/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000, // 10 second timeout
      });

      const { status, profile } = response.data;
      console.log('LinkMe status response:', { status, profile: profile?.completedSteps });

      // Prevent multiple navigation calls
      if (hasNavigated.current) {
        return;
      }

      hasNavigated.current = true;

      // Navigate based on status
      switch (status) {
        case null:
          navigation.replace('OnboardingStart');
          break;
          
        case 'draft':
          navigateToAppropriateStep(profile.completedSteps);
          break;
          
        case 'pending':
          navigation.replace('AwaitingApproval');
          break;
          
        case 'rejected':
          navigation.replace('RejectionScreen');
          break;
          
        case 'approved':
          navigation.replace('SwipeFeed');
          break;
          
        default:
          hasNavigated.current = false;
          setError('Unknown status received from server');
      }
    } catch (err) {
      console.error('Error checking LinkMe status:', err);
      
      // Reset navigation flag on error
      hasNavigated.current = false;
      
      if (err.response?.status === 401) {
        // Token expired or invalid
        hasNavigated.current = true;
        navigation.replace('Auth');
      } else if (err.response?.status === 404) {
        // No profile found, start onboarding
        hasNavigated.current = true;
        navigation.replace('OnboardingStart');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to check profile status');
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToAppropriateStep = (completedSteps) => {
    console.log('Navigating based on completed steps:', completedSteps);
    
    const { identity, personality, selfie, photos } = completedSteps;

    if (!identity) {
      navigation.replace('IdentityStep');
    } else if (!personality) {
      navigation.replace('PersonalityStep');
    } else if (!selfie) {
      navigation.replace('SelfieStep');
    } else if (!photos) {
      navigation.replace('ProfilePhotoStep');
    } else {
      navigation.replace('ReviewSubmit');
    }
  };

  const handleRetry = () => {
    hasNavigated.current = false;
    setError(null);
    checkLinkMeStatus();
  };

  // Check status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset navigation flag when screen comes into focus
      hasNavigated.current = false;
      checkLinkMeStatus();
      
      // Cleanup function to prevent navigation when screen loses focus
      return () => {
        hasNavigated.current = true;
      };
    }, [token, isAuthenticated])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.retryButton} onPress={handleRetry}>
          Tap to retry
        </Text>
      </View>
    );
  }

  // This should rarely be seen as navigation should happen quickly
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Setting up your experience...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default LinkMeEntry;