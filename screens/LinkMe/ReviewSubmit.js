import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'https://moihub.onrender.com/api';

const ReviewSubmit = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/linkme/review-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setProfile(res.data.profile);
      } else {
        throw new Error();
      }
    } catch (err) {
      console.error('Error fetching review data:', err);
      Alert.alert('Error', 'Failed to load your profile.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    Alert.alert(
      'Submit Profile',
      'Are you ready to submit? You won’t be able to make changes during review.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: submitProfile }
      ]
    );
  };

  const submitProfile = async () => {
    try {
      setSubmitting(true);
      const res = await axios.post(`${API_URL}/linkme/submit`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        Alert.alert('Success', 'Profile submitted for review.', [
          { text: 'OK', onPress: () => navigation.navigate('AwaitingApproval') }
        ]);
      } else {
        throw new Error();
      }
    } catch (err) {
      console.error('Submit error:', err);
      Alert.alert('Error', 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0a0a0f', '#1a0a2e', '#16213e']}
          style={styles.gradient}
        >
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0a0a0f', '#1a0a2e', '#16213e']}
          style={styles.gradient}
        >
          <View style={styles.center}>
            <Text style={styles.errorText}>Profile not found.</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0a0a0f', '#1a0a2e', '#16213e']}
        style={styles.gradient}
      >
        {/* Floating Hearts */}
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
            <View style={styles.stepContainer}>
              <Text style={styles.step}>Step 4 of 4</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '100%' }]} />
              </View>
            </View>
            <Text style={styles.title}>Review Your Profile</Text>
            <Text style={styles.subtitle}>
              Confirm your details before submitting for review.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{profile.displayName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Age:</Text>
              <Text style={styles.value}>{profile.age}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Gender:</Text>
              <Text style={styles.value}>{profile.gender}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Looking for:</Text>
              <Text style={styles.value}>
                {profile.sexualPreference === 'both'
                  ? 'Men & Women'
                  : profile.sexualPreference === 'male'
                  ? 'Men'
                  : 'Women'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About You</Text>
            <Text style={styles.label}>Bio</Text>
            <Text style={styles.bio}>{profile.bio}</Text>

            <Text style={styles.label}>Interests</Text>
            <View style={styles.chipContainer}>
              {profile.interests.map((item, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.photoRow}>
              {profile.selfieUrl && (
                <Image source={{ uri: profile.selfieUrl }} style={styles.photo} />
              )}
              {profile.profilePhotoUrl && (
                <Image source={{ uri: profile.profilePhotoUrl }} style={styles.photo} />
              )}
            </View>
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              By submitting, you agree to our review policy. Approval takes 24–48 hours.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <LinearGradient
              colors={['#7b20a1', '#9d4edd', '#c77dff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              {submitting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.loadingText}>Submitting...</Text>
                </View>
              ) : (
                <Text style={styles.submitText}>Submit for Approval</Text>
              )}
              <View style={styles.buttonGlow} />
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
    fontSize: 16,
    opacity: 0.2,
  },
  heart1: {
    top: '15%',
    left: '15%',
    transform: [{ rotate: '15deg' }],
  },
  heart2: {
    top: '30%',
    right: '10%',
    transform: [{ rotate: '-10deg' }],
  },
  heart3: {
    top: '70%',
    left: '10%',
    transform: [{ rotate: '25deg' }],
  },
  heart4: {
    top: '85%',
    right: '20%',
    transform: [{ rotate: '-15deg' }],
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.08,
  },
  orb1: {
    width: 100,
    height: 100,
    backgroundColor: '#7b20a1',
    top: '10%',
    right: '-15%',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  orb2: {
    width: 80,
    height: 80,
    backgroundColor: '#c77dff',
    bottom: '20%',
    left: '-10%',
    shadowColor: '#c77dff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#c77dff',
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  stepContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  step: {
    color: '#b19cd9',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    width: 80,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7b20a1',
    borderRadius: 2,
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(123, 32, 161, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  section: {
    backgroundColor: 'rgba(123, 32, 161, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(123, 32, 161, 0.3)',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textShadowColor: 'rgba(123, 32, 161, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b19cd9',
    width: 80,
  },
  value: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
  },
  bio: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 12,
    lineHeight: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: 'rgba(123, 32, 161, 0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: '#c77dff',
    fontSize: 12,
    fontWeight: '600',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(123, 32, 161, 0.5)',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  disclaimer: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#b19cd9',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    zIndex: 2,
  },
  submitButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#7b20a1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: 'center',
    position: 'relative',
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    zIndex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReviewSubmit;
