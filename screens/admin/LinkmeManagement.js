import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

const LinkmeManagement = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = 'https://moihub.onrender.com/api';

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        await fetchStats();
      } else {
        await fetchProfiles();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/linkme/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      let endpoint = `${API_URL}/linkme/admin/all`;
      if (activeTab === 'pending') {
        endpoint = `${API_URL}/linkme/admin/pending`;
      }
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfiles(response.data.profiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchProfileDetails = async (profileId) => {
    try {
      const response = await axios.get(`${API_URL}/linkme/admin/profile/${profileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedProfile(response.data.profile);
      setShowProfileModal(true);
    } catch (error) {
      console.error('Error fetching profile details:', error);
      Alert.alert('Error', 'Failed to fetch profile details');
    }
  };

  const handleApprove = async (profileId) => {
    Alert.alert(
      'Approve Profile',
      'Are you sure you want to approve this profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              await axios.post(`${API_URL}/linkme/admin/approve/${profileId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Success', 'Profile approved successfully');
              setShowProfileModal(false);
              fetchData();
            } catch (error) {
              console.error('Error approving profile:', error);
              Alert.alert('Error', 'Failed to approve profile');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleReject = async (profileId) => {
    Alert.alert(
      'Reject Profile',
      'Are you sure you want to reject this profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await axios.post(`${API_URL}/linkme/admin/reject/${profileId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Success', 'Profile rejected successfully');
              setShowProfileModal(false);
              fetchData();
            } catch (error) {
              console.error('Error rejecting profile:', error);
              Alert.alert('Error', 'Failed to reject profile');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'pending': return '#F59E0B';
      case 'draft': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const renderTabButton = (tabKey, title, count = null) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabKey && styles.activeTab]}
      onPress={() => setActiveTab(tabKey)}
    >
      <Text style={[styles.tabText, activeTab === tabKey && styles.activeTabText]}>
        {title}
      </Text>
      {count !== null && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      <Text style={styles.sectionTitle}>LinkMe Overview</Text>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#F3E8FF' }]}>
          <Text style={styles.statNumber}>{stats.total || 0}</Text>
          <Text style={styles.statLabel}>Total Profiles</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={styles.statNumber}>{stats.pending || 0}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={styles.statNumber}>{stats.approved || 0}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
          <Text style={styles.statNumber}>{stats.rejected || 0}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={styles.quickActionText}>Review Pending Profiles</Text>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{stats.pending || 0}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProfileCard = (profile) => (
    <TouchableOpacity
      key={profile._id}
      style={styles.profileCard}
      onPress={() => fetchProfileDetails(profile._id)}
    >
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: profile.profilePhotoUrl || profile.selfieUrl }}
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile.displayName}</Text>
          <Text style={styles.profileAge}>{profile.age} years old</Text>
          <Text style={styles.profileGender}>{profile.gender} • {profile.sexualPreference}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(profile.status) }]}>
          <Text style={styles.statusText}>{profile.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.profileBio} numberOfLines={2}>{profile.bio}</Text>
      
      <View style={styles.profileMeta}>
        <Text style={styles.metaText}>
          Submitted: {new Date(profile.submittedAt || profile.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.metaText}>Reports: {profile.reportCount}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderProfileModal = () => (
    <Modal
      visible={showProfileModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowProfileModal(false)}>
            <Text style={styles.modalCloseButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Profile Details</Text>
          <View style={{ width: 30 }} />
        </View>

        {selectedProfile && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.profileDetailHeader}>
              <Image
                source={{ uri: selectedProfile.profilePhotoUrl }}
                style={styles.modalProfileImage}
              />
              <Text style={styles.modalProfileName}>{selectedProfile.displayName}</Text>
              <Text style={styles.modalProfileInfo}>
                {selectedProfile.age} • {selectedProfile.gender} • {selectedProfile.sexualPreference}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Bio</Text>
              <Text style={styles.detailText}>{selectedProfile.bio}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Interests</Text>
              <View style={styles.interestsContainer}>
                {selectedProfile.interests.map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Selfie</Text>
              <Image
                source={{ uri: selectedProfile.selfieUrl }}
                style={styles.selfieImage}
              />
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>User Information</Text>
              <Text style={styles.detailText}>Username: {selectedProfile.userId.username}</Text>
              <Text style={styles.detailText}>Email: {selectedProfile.userId.email}</Text>
              <Text style={styles.detailText}>
                Joined: {new Date(selectedProfile.userId.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {selectedProfile.status === 'pending' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(selectedProfile._id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>Approve</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleReject(selectedProfile._id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>Reject</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      

      <View style={styles.tabContainer}>
        {renderTabButton('overview', 'Overview')}
        {renderTabButton('pending', 'Pending', stats.pending)}
        {renderTabButton('all', 'All Profiles')}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : activeTab === 'overview' ? (
          renderOverview()
        ) : (
          <View style={styles.profilesContainer}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'pending' ? 'Pending Profiles' : 'All Profiles'} ({profiles.length})
            </Text>
            {profiles.map(renderProfileCard)}
          </View>
        )}
      </ScrollView>

      {renderProfileModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#8B5CF6',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 5,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 16,
  },
  overviewContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  statCard: {
    width: (width - 60) / 2,
    margin: 5,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#374151',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
  quickActions: {
    marginTop: 20,
  },
  quickActionButton: {
    backgroundColor: '#8B5CF6',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pendingBadgeText: {
    color: '#8B5CF6',
    fontWeight: 'bold',
  },
  profilesContainer: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  profileAge: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  profileGender: {
    fontSize: 14,
    color: '#8B5CF6',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileBio: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 20,
  },
  profileMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
   // Modal Container
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header Styles
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
   
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  modalCloseButton: {
    fontSize: 24,
    color: '#666666',
    fontWeight: '300',
    width: 30,
    textAlign: 'center',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },

  // Content Styles
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Profile Header
  profileDetailHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    marginBottom: 24,
  },

  modalProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  modalProfileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },

  modalProfileInfo: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },

  // Detail Sections
  detailSection: {
    marginBottom: 28,
  },

  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  detailText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444444',
    fontWeight: '400',
  },

  // Interests Styling
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  interestTag: {
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EAFF',
    marginBottom: 8,
  },

  interestText: {
    fontSize: 14,
    color: '#5B67CA',
    fontWeight: '500',
  },

  // Selfie Image
  selfieImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 24,
    paddingBottom: 40,
  },

  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  approveButton: {
    backgroundColor: '#4CAF50',
  },

  rejectButton: {
    backgroundColor: '#FF5252',
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});



export default LinkmeManagement;