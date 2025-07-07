import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://moihub.onrender.com/api';

const PhotosStep = ({ navigation, route }) => {
  const { step = 'selfie' } = route.params || {};
  const [selfieImage, setSelfieImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const isSelfieStep = step === 'selfie';
  const currentImage = isSelfieStep ? selfieImage : profileImage;
  const setCurrentImage = isSelfieStep ? setSelfieImage : setProfileImage;

  const getStepInfo = () => {
    if (isSelfieStep) {
      return {
        title: 'Upload your selfie',
        subtitle: 'Take a clear selfie for verification purposes',
        step: '3A of 4',
        buttonText: selfieImage ? 'Continue to Profile Photo' : 'Take Selfie',
      };
    } else {
      return {
        title: 'Upload profile photo',
        subtitle: 'Add a great photo that shows your personality',
        step: '3B of 4',
        buttonText: profileImage ? 'Continue' : 'Add Photo',
      };
    }
  };

  const stepInfo = getStepInfo();


  const showImagePicker = () => {
  Alert.alert(
    'Select Photo',
    'Choose how you want to add your photo',
    [
      { text: 'Camera', onPress: openCamera },
      { text: 'Photo Library', onPress: openGallery },
      { text: 'Cancel', style: 'cancel' },
    ]
  );
};

const openCamera = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required', 'Camera access is needed to take a photo.');
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ FIXED
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  handleImageResponse(result);
};

const openGallery = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required', 'Access to photo library is needed.');
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ FIXED
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  handleImageResponse(result);
};

const handleImageResponse = (result) => {
  if (result.canceled || !result.assets || result.assets.length === 0) return;

  const asset = result.assets[0];
  const uri = asset.uri.startsWith('file://') ? asset.uri : `file://${asset.uri}`;

  const image = {
    uri,
    type: asset.type || 'image/jpeg',
    name: `${isSelfieStep ? 'selfie' : 'profile'}.jpg`,
  };

  setCurrentImage(image);
};


  const uploadPhotos = async () => {
    try {
      setLoading(true);
      const formData = new FormData();

      if (isSelfieStep && selfieImage) {
        formData.append('selfie', selfieImage);
      }

      if (!isSelfieStep && profileImage) {
        formData.append('profilePhoto', profileImage);
      }

      const response = await axios.post(
        `${API_URL}/linkme/upload-selfie`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        if (isSelfieStep) {
          navigation.navigate('PhotosStep', { step: 'profile' });
        } else {
          navigation.navigate('ReviewSubmit');
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert(
        'Upload Failed',
        error.response?.data?.message || 'Failed to upload photo. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!currentImage) {
      showImagePicker();
      return;
    }
    uploadPhotos();
  };

  const handleBack = () => {
    if (!isSelfieStep) {
      navigation.navigate('PhotosStep', { step: 'selfie' });
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.step}>{stepInfo.step}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{stepInfo.title}</Text>
        <Text style={styles.subtitle}>{stepInfo.subtitle}</Text>

        <View style={styles.photoContainer}>
          {currentImage ? (
            <TouchableOpacity onPress={showImagePicker} style={styles.imageWrapper}>
              <Image source={{ uri: currentImage.uri }} style={styles.previewImage} />
              <View style={styles.changePhotoOverlay}>
                <Text style={styles.changePhotoText}>Tap to change</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={showImagePicker} style={styles.placeholderContainer}>
              <View style={styles.placeholderIcon}>
                <Text style={styles.placeholderIconText}>📸</Text>
              </View>
              <Text style={styles.placeholderText}>
                {isSelfieStep ? 'Add Selfie' : 'Add Photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>Photo Guidelines:</Text>
          <View style={styles.guidelinesList}>
            {isSelfieStep ? (
              <>
                <Text style={styles.guideline}>• You should be within Moi university premises.</Text>
                <Text style={styles.guideline}>• Good lighting</Text>               
                <Text style={styles.guideline}>• Solo photo (just you)</Text>
              </>
            ) : (
              <>
                <Text style={styles.guideline}>• High quality and well-lit</Text>
                <Text style={styles.guideline}>• Shows your personality</Text>
                <Text style={styles.guideline}>• Recent photo of yourself</Text>
                <Text style={styles.guideline}>• Appropriate for all audiences</Text>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !currentImage && styles.continueButtonSecondary
          ]}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[
              styles.continueButtonText,
              !currentImage && styles.continueButtonTextSecondary
            ]}>
              {stepInfo.buttonText}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  step: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#222',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 36,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageWrapper: {
    position: 'relative',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#eaeaea',
  },
  changePhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingVertical: 6,
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  placeholderContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#fafafa',
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    marginBottom: 10,
  },
  placeholderIconText: {
    fontSize: 38,
  },
  placeholderText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  guidelines: {
    backgroundColor: '#f4f4f4',
    padding: 18,
    borderRadius: 10,
    marginBottom: 20,
  },
  guidelinesTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  guidelinesList: {
    gap: 6,
  },
  guideline: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueButtonSecondary: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  continueButtonTextSecondary: {
    color: '#007AFF',
  },
});


export default PhotosStep;