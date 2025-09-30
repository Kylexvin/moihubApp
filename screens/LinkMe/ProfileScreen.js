import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Dimensions,
  LinearGradient,
} from 'react-native';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ baseUrl }) => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [editingInterests, setEditingInterests] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  
  const availableInterests = [
    'music', 'cooking', 'photography', 'sports', 'hiking', 'reading',
    'travel', 'movies', 'gaming', 'art', 'dancing', 'fitness',
    'technology', 'fashion', 'food', 'nature', 'pets', 'writing'
  ];

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProfile(),
        loadStats(),
        loadActivity()
      ]);
    } catch (error) {
      console.error('Error loading profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await axios.get(`api/linkme/profile/`);
      if (response.data.success) {
        setProfile(response.data.profile);
        setBioText(response.data.profile.bio || '');
        setSelectedInterests(response.data.profile.interests || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(`api/linkme/my/profile/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadActivity = async () => {
    try {
      const response = await axios.get(`api/linkme/my/profile/activity?timeframe=7d&limit=10`);
      if (response.data.success) {
        setActivities(response.data.data.activities);
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const updateBio = async () => {
    try {
      const response = await axios.patch(`api/linkme/my/profile/bio`, {
        bio: bioText
      });
      
      if (response.data.success || response.status === 200) {
        setProfile(prev => ({ ...prev, bio: bioText }));
        setEditingBio(false);
        Alert.alert('Success', 'Bio updated successfully');
      }
    } catch (error) {
      console.error('Error updating bio:', error);
      Alert.alert('Error', 'Failed to update bio');
    }
  };

  const updateInterests = async () => {
    try {
      const response = await axios.patch(`api/linkme/profile/interests`, {
        interests: selectedInterests
      });
      
      if (response.data.success || response.status === 200) {
        setProfile(prev => ({ ...prev, interests: selectedInterests }));
        setEditingInterests(false);
        Alert.alert('Success', 'Interests updated successfully');
      }
    } catch (error) {
      console.error('Error updating interests:', error);
      Alert.alert('Error', 'Failed to update interests');
    }
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      } else if (prev.length < 10) {
        return [...prev, interest];
      }
      return prev;
    });
  };

  const deleteProfile = () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete your profile? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`/api/linkme/my/profile`);
              Alert.alert('Success', 'Profile deleted successfully');
              // Navigate back or to login screen
            } catch (error) {
              console.error('Error deleting profile:', error);
              Alert.alert('Error', 'Failed to delete profile');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getGradientColors = (status) => {
    switch (status) {
      case 'approved': return ['#10B981', '#059669'];
      case 'pending': return ['#F59E0B', '#D97706'];
      case 'rejected': return ['#EF4444', '#DC2626'];
      default: return ['#6B7280', '#4B5563'];
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
      }
    >
      {/* Hero Section with Profile Image */}
      {profile && (
        <View style={styles.heroSection}>
          <Image 
            source={{ uri: profile.profilePhotoUrl || profile.selfieUrl }} 
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{profile.displayName}</Text>
              <Text style={styles.username}>@{profile.userId.username}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(profile.status) }]}>
                <Text style={styles.statusText}>{profile.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Bio Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📝</Text>
            </View>
            <Text style={styles.cardTitle}>About Me</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditingBio(true)}>
            <Text style={styles.editBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bioText}>{profile?.bio || 'Tell the world about yourself! ✨'}</Text>
      </View>

      {/* Interests Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>💫</Text>
            </View>
            <Text style={styles.cardTitle}>My Interests</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditingInterests(true)}>
            <Text style={styles.editBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.interestsContainer}>
          {profile?.interests?.length > 0 ? (
            profile.interests.map((interest, index) => (
              <View key={index} style={styles.interestChip}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No interests selected yet 🤔</Text>
          )}
        </View>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.card}>
          <View style={styles.cardTitleContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📊</Text>
            </View>
            <Text style={styles.cardTitle}>Profile Analytics</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
              <Text style={[styles.statValue, { color: '#6366F1' }]}>{stats.profile.completionRate}%</Text>
              <Text style={styles.statLabel}>Profile Complete</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.engagement.totalProfileViews}</Text>
              <Text style={styles.statLabel}>Profile Views</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FEF3F2' }]}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.engagement.totalLikes}</Text>
              <Text style={styles.statLabel}>Total Likes</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FFFBEB' }]}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.matching.totalMatches}</Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
          </View>

          <View style={styles.additionalStatsContainer}>
            <View style={styles.additionalStat}>
              <Text style={styles.additionalStatLabel}>Popularity Rank</Text>
              <Text style={styles.additionalStatValue}>{stats.popularity.rank}</Text>
            </View>
            <View style={styles.additionalStat}>
              <Text style={styles.additionalStatLabel}>Match Rate</Text>
              <Text style={styles.additionalStatValue}>{stats.matching.matchRate}%</Text>
            </View>
            <View style={styles.additionalStat}>
              <Text style={styles.additionalStatLabel}>Popularity Score</Text>
              <Text style={styles.additionalStatValue}>{stats.popularity.scoreOutOf100}/100</Text>
            </View>
          </View>
        </View>
      )}

      {/* Activity Card */}
      <View style={styles.card}>
        <View style={styles.cardTitleContainer}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>⚡</Text>
          </View>
          <Text style={styles.cardTitle}>Recent Activity</Text>
        </View>
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityDot} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{activity.description}</Text>
                <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent activity 😴</Text>
        )}
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerCard}>
        <View style={styles.cardTitleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.iconText}>⚠️</Text>
          </View>
          <Text style={[styles.cardTitle, { color: '#DC2626' }]}>Danger Zone</Text>
        </View>
        <Text style={styles.dangerDescription}>
          Permanently delete your profile and all associated data. This action cannot be undone.
        </Text>
        <TouchableOpacity style={styles.deleteButton} onPress={deleteProfile}>
          <Text style={styles.deleteButtonText}>🗑️ Delete Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Bio Edit Modal */}
      <Modal visible={editingBio} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✍️ Edit Your Bio</Text>
            <TextInput
              style={styles.bioInput}
              value={bioText}
              onChangeText={setBioText}
              multiline
              placeholder="Tell others about yourself..."
              placeholderTextColor="#9CA3AF"
              maxLength={500}
            />
            <Text style={styles.characterCount}>{bioText.length}/500 characters</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setBioText(profile?.bio || '');
                  setEditingBio(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={updateBio}>
                <Text style={styles.saveButtonText}>💾 Save Bio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Interests Edit Modal */}
      <Modal visible={editingInterests} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💫 Choose Your Interests</Text>
            <Text style={styles.modalSubtitle}>Select up to 10 interests that represent you</Text>
            <ScrollView style={styles.interestsModal} showsVerticalScrollIndicator={false}>
              <View style={styles.interestsGrid}>
                {availableInterests.map((interest, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.interestOption,
                      selectedInterests.includes(interest) && styles.interestSelected
                    ]}
                    onPress={() => toggleInterest(interest)}
                    disabled={!selectedInterests.includes(interest) && selectedInterests.length >= 10}
                  >
                    <Text style={[
                      styles.interestOptionText,
                      selectedInterests.includes(interest) && styles.interestSelectedText
                    ]}>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={styles.selectedCount}>{selectedInterests.length}/10 interests selected</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setSelectedInterests(profile?.interests || []);
                  setEditingInterests(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={updateInterests}>
                <Text style={styles.saveButtonText}>💫 Save Interests</Text>
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
    backgroundColor: '#2b1038ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2b1038ff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  heroSection: {
    height: height * 0.4,
    position: 'relative',
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    justifyContent: 'flex-end',
    padding: 24,
  },
  profileInfo: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  username: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#c6bccaff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  editBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editBtnText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  interestText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  additionalStatsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  additionalStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  additionalStatLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  additionalStatValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  dangerCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 100,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2', 
  },
  dangerDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
    color: '#111827',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
    marginBottom: 20,
  },
  interestsModal: {
    maxHeight: 300,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestOption: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  interestSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  interestOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  interestSelectedText: {
    color: 'white',
  },
  selectedCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 16,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#6366F1',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 