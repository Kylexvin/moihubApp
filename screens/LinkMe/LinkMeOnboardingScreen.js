import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

const LinkMeOnboardingScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    display_name: currentUser?.name || '',
    bio: '',
    gender: '',
    interested_in: '',
    dob: null,
    avatar: null,
    preferences: {
      interests: [],
      radius: 50, // default radius in km
      min_age: 18,
      max_age: 99,
    },
    location: null,
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [avatarImage, setAvatarImage] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  
  // List of gender options and interest options
  const genderOptions = ['Male', 'Female', 'Non-binary', 'Other'];
  const interestOptions = ['Men', 'Women', 'Everyone'];
  
  // Interest tags that users can select
  const interestTags = [
    'Music', 'Movies', 'Reading', 'Travel', 'Cooking', 'Sports', 
    'Art', 'Photography', 'Gaming', 'Tech', 'Dancing', 'Hiking', 
    'Fitness', 'Fashion', 'Coffee', 'Wine', 'Animals', 'Yoga'
  ];

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/linkme/profile-status');
      
      if (response.data.profile) {
        const fetchedProfile = response.data.profile;
        
        // Format the date to fit DateTimePicker
        const dob = fetchedProfile.dob ? new Date(fetchedProfile.dob) : null;
        
        setProfile({
          display_name: fetchedProfile.display_name || currentUser?.name || '',
          bio: fetchedProfile.bio || '',
          gender: fetchedProfile.gender || '',
          interested_in: fetchedProfile.interested_in || '',
          dob: dob,
          preferences: fetchedProfile.preferences || {
            interests: [],
            radius: 50,
            min_age: 18,
            max_age: 99,
          },
          location: fetchedProfile.location || null,
        });
        
        // Set avatar image if available
        if (fetchedProfile.avatar_url) {
          setAvatarImage(fetchedProfile.avatar_url);
        }
        
        setProfileComplete(response.data.isProfileComplete);
        
        // If profile is complete, we can go to the main LinkMe screen
        if (response.data.isProfileComplete) {
          navigation.replace('LinkMeSwipe');
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      setProfile({
        ...profile,
        dob: selectedDate,
      });
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to upload your photo');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarImage(result.assets[0].uri);
    }
  };

  const toggleInterest = (interest) => {
    const currentInterests = [...profile.preferences.interests];
    const index = currentInterests.indexOf(interest);
    
    if (index > -1) {
      currentInterests.splice(index, 1);
    } else {
      currentInterests.push(interest);
    }
    
    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        interests: currentInterests,
      },
    });
  };

  const handleNextStep = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!profile.display_name.trim()) {
        Alert.alert('Required Field', 'Please enter your display name');
        return;
      }
    } else if (currentStep === 2) {
      if (!profile.bio.trim()) {
        Alert.alert('Required Field', 'Please enter a short bio');
        return;
      }
    } else if (currentStep === 3) {
      if (!profile.gender) {
        Alert.alert('Required Field', 'Please select your gender');
        return;
      }
    } else if (currentStep === 4) {
      if (!profile.interested_in) {
        Alert.alert('Required Field', 'Please select who you are interested in');
        return;
      }
    } else if (currentStep === 5) {
      if (!profile.dob) {
        Alert.alert('Required Field', 'Please select your date of birth');
        return;
      }
      
      // Check if user is at least 18 years old
      const today = new Date();
      const birthDate = new Date(profile.dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        Alert.alert('Age Restriction', 'You must be at least 18 years old to use LinkMe');
        return;
      }
    }
    
    // If last step, save profile
    if (currentStep === 6) {
      saveProfile();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveProfile = async () => {
    if (!profile.display_name || !profile.bio || !profile.gender || 
        !profile.interested_in || !profile.dob) {
      Alert.alert('Incomplete Profile', 'Please complete all required fields');
      return;
    }
    
    setSaving(true);
    
    try {
      // Format date to ISO string for API
      const formattedProfile = {
        ...profile,
        dob: profile.dob.toISOString(),
      };
      
      // Create form data for multipart upload (for the avatar)
      const formData = new FormData();
      
      // Add profile data as JSON
      Object.keys(formattedProfile).forEach(key => {
        if (key !== 'avatar') {
          if (typeof formattedProfile[key] === 'object' && formattedProfile[key] !== null) {
            formData.append(key, JSON.stringify(formattedProfile[key]));
          } else {
            formData.append(key, formattedProfile[key]);
          }
        }
      });
      
      // Add avatar if available
      if (avatarImage && !avatarImage.startsWith('http')) {
        formData.append('avatar', {
          uri: avatarImage,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        });
      }
      
      // Send request to update profile
      const response = await api.post('/linkme/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.isProfileComplete) {
        Alert.alert(
          'Profile Complete',
          'Your LinkMe profile is now complete! You can start swiping.',
          [
            {
              text: 'Let\'s Go!',
              onPress: () => navigation.replace('LinkMeSwipe'),
            },
          ]
        );
      } else {
        Alert.alert('Profile Updated', 'Your profile has been updated successfully');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff7f50" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  // Render different components based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Display Name
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepDescription}>
              This is the name that will be shown to others on LinkMe
            </Text>
            <TextInput
              style={styles.input}
              value={profile.display_name}
              onChangeText={(text) => setProfile({ ...profile, display_name: text })}
              placeholder="Enter your display name"
              maxLength={50}
            />
          </View>
        );
      
      case 2: // Bio
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Write a short bio</Text>
            <Text style={styles.stepDescription}>
              Tell others about yourself in a few sentences
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={profile.bio}
              onChangeText={(text) => setProfile({ ...profile, bio: text })}
              placeholder="I love hiking, reading, and trying new restaurants..."
              multiline={true}
              maxLength={500}
              numberOfLines={5}
            />
            <Text style={styles.charCount}>{profile.bio.length}/500</Text>
          </View>
        );
      
      case 3: // Gender
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your gender?</Text>
            <View style={styles.optionsContainer}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    profile.gender === option && styles.selectedOption,
                  ]}
                  onPress={() => setProfile({ ...profile, gender: option })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      profile.gender === option && styles.selectedOptionText,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      case 4: // Interested In
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Who are you interested in?</Text>
            <View style={styles.optionsContainer}>
              {interestOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    profile.interested_in === option && styles.selectedOption,
                  ]}
                  onPress={() => setProfile({ ...profile, interested_in: option })}
                >
                  <Text
                    style={[
                      styles.optionText,
                      profile.interested_in === option && styles.selectedOptionText,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      case 5: // Date of Birth
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>When were you born?</Text>
            <Text style={styles.stepDescription}>
              You must be at least 18 years old to use LinkMe
            </Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {profile.dob ? profile.dob.toLocaleDateString() : 'Select Date of Birth'}
              </Text>
              <Feather name="calendar" size={24} color="#666" />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={profile.dob || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
        );
      
      case 6: // Avatar and Interests
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Add a profile photo</Text>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
              {avatarImage ? (
                <Image source={{ uri: avatarImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={80} color="#aaa" />
                </View>
              )}
              <View style={styles.editAvatarButton}>
                <Feather name="edit-2" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <Text style={styles.stepTitle2}>Select your interests</Text>
            <Text style={styles.stepDescription}>
              Choose interests that help others get to know you better
            </Text>
            
            <View style={styles.tagsContainer}>
              {interestTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagButton,
                    profile.preferences.interests.includes(tag) && styles.selectedTag,
                  ]}
                  onPress={() => toggleInterest(tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      profile.preferences.interests.includes(tag) && styles.selectedTagText,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
        <View style={{ width: 28 }} />
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentStep / 6) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of 6</Text>
      </View>
      
      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderStepContent()}
      </ScrollView>
      
      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handlePreviousStep}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextStep}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentStep === 6 ? 'Complete' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555555',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  bioInput: {
    height: 120,
    paddingTop: 12,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 4,
    color: '#888888',
    fontSize: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedOption: {
    backgroundColor: '#50c878',
    borderColor: '#50c878',
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
  },
  selectedOptionText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#ff7f50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LinkMeOnboardingScreen;