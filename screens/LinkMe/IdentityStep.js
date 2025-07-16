import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://moihub.onrender.com/api';

const IdentityStep = ({ navigation }) => {
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [sexualPreference, setSexualPreference] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  const preferenceOptions = [
    { value: 'male', label: 'Men' },
    { value: 'female', label: 'Women' },

  ];

  const isFormValid = () => {
    const ageNum = parseInt(age);
    return (
      displayName.trim().length >= 2 &&
      ageNum >= 18 && ageNum <= 100 &&
      gender &&
      sexualPreference
    );
  };

  const handleContinue = async () => {
    if (!isFormValid()) {
      Alert.alert(
        'Incomplete Information',
        'Please fill in all fields. You must be at least 18 years old.'
      );
      return;
    }

    try {
      setLoading(true);

      const response = await axios.patch(
        `${API_URL}/linkme/profile`,
        {
          displayName: displayName.trim(),
          gender,
          sexualPreference,
          age: parseInt(age),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Navigate to personality step
        navigation.navigate('PersonalityStep');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert(
        'Profile Creation Failed',
        error.response?.data?.message || 'Failed to create your profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderOptionGroup = (title, options, selectedValue, onSelect) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionsGrid}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionChip,
              selectedValue === option.value && styles.optionChipSelected
            ]}
            onPress={() => onSelect(option.value)}
          >
            <LinearGradient
              colors={
                selectedValue === option.value 
                  ? ['#7b20a1', '#9d4edd', '#c77dff']
                  : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.optionGradient}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedValue === option.value && styles.optionTextSelected
                ]}
              >
                {option.label}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Matching explanation */}
      {title === '💕 Interested in' && (
        <View style={styles.matchingNote}>
          <Text style={styles.matchingNoteText}>
            💡 You'll be matched with people who share mutual interest
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0a0a0f', '#1a0a2e', '#16213e']}
        style={styles.gradient}
      >
        {/* Floating Hearts Animation Background */}
        <View style={styles.heartsContainer}>
          <Text style={[styles.floatingHeart, styles.heart1]}>💜</Text>
          <Text style={[styles.floatingHeart, styles.heart2]}>💙</Text>
          <Text style={[styles.floatingHeart, styles.heart3]}>💜</Text>
          <Text style={[styles.floatingHeart, styles.heart4]}>💙</Text>
        </View>

        {/* Glowing Orbs */}
        <View style={[styles.glowOrb, styles.orb1]} />
        <View style={[styles.glowOrb, styles.orb2]} />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.stepContainer}>
              <Text style={styles.step}>Step 1 of 4</Text>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>
              Let's get to know{' '}
              <Text style={styles.highlightText}>you</Text>
            </Text>
            <Text style={styles.subtitle}>
              Tell us a bit about yourself to create your{' '}
              <Text style={styles.brandText}>cosmic profile</Text>
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✨ Display Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="What should we call you?"
                  placeholderTextColor="#888"
                  value={displayName}
                  onChangeText={setDisplayName}
                  maxLength={50}
                />
                <View style={styles.inputGlow} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎂 Age</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="How old are you?"
                  placeholderTextColor="#888"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <View style={styles.inputGlow} />
              </View>
            </View>

            {renderOptionGroup(
              '👤 Gender',
              genderOptions,
              gender,
              setGender
            )}

            {renderOptionGroup(
              '💕 Interested in',
              preferenceOptions,
              sexualPreference,
              setSexualPreference
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isFormValid() && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={loading || !isFormValid()}
          >
            <LinearGradient
              colors={
                isFormValid() 
                  ? ['#7b20a1', '#9d4edd', '#c77dff']
                  : ['#333', '#555', '#666']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.continueButtonText}>
                  Continue Journey →
                </Text>
              )}
              {isFormValid() && <View style={styles.buttonGlow} />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  gradient: {
    flex: 1,
  },
  heartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  floatingHeart: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.3,
  },
  heart1: {
    top: '15%',
    left: '10%',
  },
  heart2: {
    top: '35%',
    right: '15%',
  },
  heart3: {
    top: '55%',
    left: '20%',
  },
  heart4: {
    top: '75%',
    right: '25%',
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
  },
  orb1: {
    width: 200,
    height: 200,
    backgroundColor: '#7b20a1',
    top: '10%',
    right: '-50%',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 50,
  },
  orb2: {
    width: 150,
    height: 150,
    backgroundColor: '#9d4edd',
    bottom: '20%',
    left: '-30%',
    shadowColor: '#9d4edd',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: '#c77dff',
    fontSize: 16,
    fontWeight: '600',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  step: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '25%',
    height: '100%',
    backgroundColor: '#c77dff',
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
  },
  highlightText: {
    color: '#c77dff',
  },
  subtitle: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  brandText: {
    color: '#7b20a1',
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 15,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(199, 125, 255, 0.3)',
    opacity: 0,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionChip: {
    borderRadius: 25,
    overflow: 'hidden',
    minWidth: 100,
  },
  optionGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  matchingNote: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(123, 32, 161, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(123, 32, 161, 0.3)',
  },
  matchingNoteText: {
    color: '#c77dff',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    zIndex: 2,
  },
  continueButton: {
    borderRadius: 25,
    overflow: 'hidden',
    position: 'relative',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
  },
});

export default IdentityStep;