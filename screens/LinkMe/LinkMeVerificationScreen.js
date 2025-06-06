import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext'; 
import api from '../../services/api'; // Import the API service instead of axios directly

const LinkMeVerificationScreen = () => {
  const navigation = useNavigation();
  const { currentUser: user } = useAuth();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('none'); // 'none', 'pending', 'approved'

  useEffect(() => {
    // Check status immediately when component mounts
    checkVerificationStatus();
    
    // Also check when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App came to foreground, checking verification status');
        checkVerificationStatus();
      }
    });
    
    // Set up a periodic check for pending status
    let intervalId;
    if (verificationStatus === 'pending') {
      // Check every 30 seconds if the status has changed to approved while in pending state
      intervalId = setInterval(checkVerificationStatus, 30000);
    }
    
    // Clean up interval and subscription on unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
      subscription.remove();
    };
  }, [verificationStatus]);

  const checkVerificationStatus = async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      console.log('Checking verification status...');
      // Fix the API endpoint path to match the one in your example
      const response = await api.get('/api/linkme/verification-status');
      console.log('Verification response:', response.data);
      
      // Update the state with the fetched status
      setVerificationStatus(response.data.verificationStatus);

      // If user is approved, check if profile is complete and navigate accordingly
      if (response.data.verificationStatus === 'approved') {
        console.log('User is approved, checking profile...');
        try {
          const profileResponse = await api.get(`/api/linkme/profile/${user._id}`);
          console.log('Profile response:', profileResponse.data);
          
          // Navigate based on profile completeness
          if (profileResponse.data.isProfileComplete) {
            console.log('Profile is complete, navigating to SwipeScreen');
            navigation.replace('LinkMeSwipe');
          } else {
            console.log('Profile is incomplete, navigating to OnboardingScreen');
            navigation.replace('LinkMeOnboarding');
          }
        } catch (profileError) {
          // If profile check fails, default to onboarding
          console.error('Error checking profile completeness:', profileError);
          Alert.alert('Profile Error', 'Unable to check profile status. Moving to profile setup.');
          navigation.replace('LinkMeOnboarding');
        }
      } else {
        console.log('User not approved yet. Current status:', response.data.verificationStatus);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      Alert.alert('Error', 'Failed to check verification status. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to upload your selfie');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera permissions to take your selfie');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const submitSelfie = async () => {
    if (!image) {
      Alert.alert('No Image', 'Please take or select a selfie first');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('selfie', {
        uri: image,
        type: 'image/jpeg',
        name: 'selfie.jpg',
      });

      console.log('Submitting selfie...');
      // Corrected API endpoint path
      await api.post('/api/linkme/upgrade', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // No need to set Authorization header as the API interceptor will handle it
        },
      });
      console.log('Selfie submitted successfully');

      setVerificationStatus('pending');
      Alert.alert(
        'Success',
        'Your verification request has been submitted! We will review it shortly.',
        [{ 
          text: 'OK',
          onPress: () => checkVerificationStatus() // Check again after submission
        }]
      );
    } catch (error) {
      console.error('Error submitting selfie:', error);
      Alert.alert('Error', 'Failed to submit verification selfie. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Different screens based on verification status
  const renderContent = () => {
    switch (verificationStatus) {
      case 'pending':
        return (
          <View style={styles.centerContainer}>
            <Ionicons name="hourglass" size={80} color="#ff7f50" />
            <Text style={styles.title}>Verification Pending</Text>
            <Text style={styles.subtitle}>
              We're reviewing your profile. This usually takes 24-48 hours.
              {'\n\n'}The app will automatically check and update when you're approved.
            </Text>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => {
                console.log('Manual status check initiated');
                checkVerificationStatus();
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Check Status Now</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      
      case 'approved':
        // This should not typically show as useEffect should navigate away,
        // but keeping as fallback with a message
        return (
          <View style={styles.centerContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#50c878" />
            <Text style={styles.title}>Verification Approved!</Text>
            <Text style={styles.subtitle}>Redirecting to complete your profile...</Text>
            <ActivityIndicator size="large" color="#50c878" style={styles.loader} />
            <TouchableOpacity 
              style={styles.button}
              onPress={() => navigation.replace('LinkMeOnboarding')}
            >
              <Text style={styles.buttonText}>Go to Profile Setup</Text>
            </TouchableOpacity>
          </View>
        );
      
      default: // 'none' or any other state
        return (
          <View style={styles.container}>
            <Text style={styles.title}>Join LinkMe</Text>
            <Text style={styles.subtitle}>
              Submit a selfie to verify your identity and join our dating community
            </Text>
            
            <View style={styles.imageContainer}>
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={80} color="#cccccc" />
                </View>
              )}
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.iconButton} onPress={takeSelfie}>
                <Ionicons name="camera" size={28} color="#ffffff" />
                <Text style={styles.iconButtonText}>Take Selfie</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
                <Ionicons name="images" size={28} color="#ffffff" />
                <Text style={styles.iconButtonText}>Pick Image</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.submitButton, 
                !image && styles.disabledButton
              ]} 
              onPress={submitSelfie}
              disabled={!image || loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Submit for Verification</Text>
              )}
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>LinkMe Verification</Text>
        <View style={{ width: 28 }} />
      </View>
      
      {/* Content */}
      {loading && verificationStatus === 'none' ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#50c878" />
          <Text style={styles.subtitle}>Checking verification status...</Text>
        </View>
      ) : (
        renderContent()
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
  },
  imageContainer: {
    marginBottom: 24,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#e1e1e1',
  },
  placeholderImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 32,
  },
  iconButton: {
    backgroundColor: '#ff7f50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '45%',
  },
  iconButtonText: {
    color: '#ffffff',
    marginTop: 8,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: 'red',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    width: '80%',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#ff7f50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LinkMeVerificationScreen;