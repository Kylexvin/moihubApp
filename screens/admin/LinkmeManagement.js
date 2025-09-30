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
  TextInput,
  FlatList,
} from 'react-native';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const LinkmeManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profiles, setProfiles] = useState([]);
  const [stats, setStats] = useState({});
  const [draftStats, setDraftStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const API_BASE = axios.defaults.baseURL || 'https://moihub.onrender.com/api';

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage, searchQuery, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        await Promise.all([fetchStats(), fetchDraftStats()]);
      } else if (activeTab === 'drafts') {
        await fetchDraftStats();
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
      const response = await axios.get('api/linkme/admin/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDraftStats = async () => {
    try {
      const response = await axios.get('api/linkme/admin/draft-stats');
      setDraftStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching draft stats:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter && { status: statusFilter }),
      });

      let endpoint = 'api/linkme/admin/all';
      if (activeTab === 'pending') {
        endpoint = 'api/linkme/admin/pending';
      }

      const response = await axios.get(`${endpoint}?${params}`);
      setProfiles(response.data.profiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchProfileDetails = async (profileId) => {
    try {
      const response = await axios.get(`api/linkme/admin/profile/${profileId}`);
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
          onPress: async () => {
            setActionLoading(true);
            try {
              await axios.post(`api/linkme/admin/approve/${profileId}`);
              Alert.alert('Success', 'Profile approved successfully');
              setShowProfileModal(false);
              fetchData();
            } catch (error) {
              console.error('Error approving profile:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to approve profile');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleReject = async (profileId) => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(`api/linkme/admin/reject/${profileId}`, {
        reason: rejectReason.trim()
      });
      Alert.alert('Success', 'Profile rejected successfully');
      setShowRejectModal(false);
      setShowProfileModal(false);
      setRejectReason('');
      fetchData();
    } catch (error) {
      console.error('Error rejecting profile:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject profile');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAllDrafts = () => {
    Alert.alert(
      'Clear All Drafts',
      `This will permanently delete all ${draftStats.totalDrafts} draft profiles. Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const response = await axios.delete('api/linkme/admin/clear-drafts');
              Alert.alert('Success', response.data.message);
              fetchDraftStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear drafts');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleClearOldDrafts = (days = 30) => {
    Alert.alert(
      'Clear Old Drafts',
      `This will delete all draft profiles older than ${days} days. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const response = await axios.delete('api/linkme/admin/clear-old-drafts', {
                data: { days }
              });
              Alert.alert('Success', response.data.message);
              fetchDraftStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear old drafts');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleClearUserDraft = (userId, username) => {
    Alert.alert(
      'Clear User Draft',
      `Delete draft profile for ${username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await axios.delete(`api/linkme/admin/clear-user-draft/${userId}`);
              Alert.alert('Success', response.data.message);
              fetchDraftStats();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to clear user draft');
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

  const getCompletionPercentage = (completedSteps) => {
    if (!completedSteps) return 0;
    const total = Object.keys(completedSteps).length;
    const completed = Object.values(completedSteps).filter(Boolean).length;
    return Math.round((completed / total) * 100);
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

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Draft Statistics</Text>
      <View style={styles.draftStatsContainer}>
        <View style={styles.draftStatRow}>
          <Text style={styles.draftStatLabel}>Total Drafts:</Text>
          <Text style={styles.draftStatValue}>{draftStats.totalDrafts || 0}</Text>
        </View>
        
        {draftStats.ageBreakdown && (
          <>
            <View style={styles.draftStatRow}>
              <Text style={styles.draftStatLabel}>Last 24h:</Text>
              <Text style={styles.draftStatValue}>{draftStats.ageBreakdown.lastDay}</Text>
            </View>
            <View style={styles.draftStatRow}>
              <Text style={styles.draftStatLabel}>Last Week:</Text>
              <Text style={styles.draftStatValue}>{draftStats.ageBreakdown.lastWeek}</Text>
            </View>
            <View style={styles.draftStatRow}>
              <Text style={styles.draftStatLabel}>Last Month:</Text>
              <Text style={styles.draftStatValue}>{draftStats.ageBreakdown.lastMonth}</Text>
            </View>
            <View style={styles.draftStatRow}>
              <Text style={styles.draftStatLabel}>Older than Month:</Text>
              <Text style={styles.draftStatValue}>{draftStats.ageBreakdown.olderThanMonth}</Text>
            </View>
          </>
        )}
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
        
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: '#FEF3C7' }]}
          onPress={() => setActiveTab('drafts')}
        >
          <Text style={styles.quickActionText}>Manage Drafts</Text>
          <View style={[styles.pendingBadge, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.pendingBadgeText}>{draftStats.totalDrafts || 0}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDrafts = () => (
    <View style={styles.draftsContainer}>
      <View style={styles.draftActions}>
        <TouchableOpacity
          style={[styles.draftActionButton, { backgroundColor: '#EF4444' }]}
          onPress={handleClearAllDrafts}
          disabled={actionLoading || !draftStats.totalDrafts}
        >
          <Text style={styles.draftActionText}>Clear All Drafts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.draftActionButton, { backgroundColor: '#F59E0B' }]}   
          onPress={() => handleClearOldDrafts(30)}
          disabled={actionLoading}
        >
          <Text style={styles.draftActionText}>Clear Old (30d+)</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Oldest Drafts</Text>
      {draftStats.oldestDrafts && draftStats.oldestDrafts.map((draft) => (
        <View key={draft.id} style={styles.draftCard}>
          <View style={styles.draftHeader}>
            <Text style={styles.draftUser}>{draft.user.username}</Text>
            <Text style={styles.draftAge}>{draft.ageInDays} days old</Text>
          </View>
          
          <Text style={styles.draftEmail}>{draft.user.email}</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getCompletionPercentage(draft.completedSteps)}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {getCompletionPercentage(draft.completedSteps)}% complete
            </Text>
          </View>

          <View style={styles.stepsContainer}>
            {Object.entries(draft.completedSteps).map(([step, completed]) => (
              <View key={step} style={styles.stepIndicator}>
                <View style={[
                  styles.stepDot, 
                  { backgroundColor: completed ? '#10B981' : '#E5E7EB' }
                ]} />
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.clearUserButton}
            onPress={() => handleClearUserDraft(draft.user._id, draft.user.username)}
          >
            <Text style={styles.clearUserText}>Clear Draft</Text>
          </TouchableOpacity>
        </View>
      ))}
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
          defaultSource={{ uri: 'https://via.placeholder.com/50' }}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile.displayName}</Text>
          <Text style={styles.profileAge}>{profile.age} years old</Text>
          <Text style={styles.profileGender}>{profile.gender} • {profile.sexualPreference}</Text>
          <Text style={styles.profileUser}>@{profile.userId?.username}</Text>
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
        <Text style={styles.metaText}>Reports: {profile.reportCount || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name, username, or email..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.filterButton, !statusFilter && styles.activeFilter]}
          onPress={() => setStatusFilter('')}
        >
          <Text style={[styles.filterText, !statusFilter && styles.activeFilterText]}>All</Text>
        </TouchableOpacity>
        
        {['pending', 'approved', 'rejected', 'draft'].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterButton, statusFilter === status && styles.activeFilter]}
            onPress={() => setStatusFilter(status)}
          >
            <Text style={[styles.filterText, statusFilter === status && styles.activeFilterText]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
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
              <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedProfile.status) }]}>
                <Text style={styles.modalStatusText}>{selectedProfile.status.toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Bio</Text>
              <Text style={styles.detailText}>{selectedProfile.bio}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Interests</Text>
              <View style={styles.interestsContainer}>
                {selectedProfile.interests?.map((interest, index) => (
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

            {selectedProfile.rejectionReason && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Rejection Reason</Text>
                <Text style={styles.rejectionText}>{selectedProfile.rejectionReason}</Text>
              </View>
            )}

            {selectedProfile.status === 'pending' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleApprove(selectedProfile._id)}
                  disabled={actionLoading}
                >
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                >
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const renderRejectModal = () => (
    <Modal
      visible={showRejectModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.rejectModalOverlay}>
        <View style={styles.rejectModalContent}>
          <Text style={styles.rejectModalTitle}>Reject Profile</Text>
          <Text style={styles.rejectModalSubtitle}>Please provide a reason for rejection:</Text>
          
          <TextInput
            style={styles.rejectReasonInput}
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChangeText={setRejectReason}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          
          <Text style={styles.characterCount}>{rejectReason.length}/500</Text>
          
          <View style={styles.rejectModalButtons}>
            <TouchableOpacity
              style={styles.rejectModalCancelButton}
              onPress={() => {
                setShowRejectModal(false);
                setRejectReason('');
              }}
            >
              <Text style={styles.rejectModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.rejectModalSubmitButton}
              onPress={() => handleReject(selectedProfile._id)}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.rejectModalSubmitText}>Reject</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {renderTabButton('overview', 'Overview')}
        {renderTabButton('pending', 'Pending', stats.pending)}
        {renderTabButton('drafts', 'Drafts', draftStats.totalDrafts)}
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
        ) : activeTab === 'drafts' ? (
          renderDrafts()
        ) : (
          <View style={styles.profilesContainer}>
            {(activeTab === 'all' || activeTab === 'pending') && renderFilters()}
            <Text style={styles.sectionTitle}>
              {activeTab === 'pending' ? 'Pending Profiles' : 'All Profiles'} ({profiles.length})
            </Text>
            {profiles.map(renderProfileCard)}
          </View>
        )}
      </ScrollView>

      {renderProfileModal()}
      {renderRejectModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeTab: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
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
    fontSize: 16,
    color: '#6B7280',
  },
  overviewContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 5,
  },
  draftStatsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  draftStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  draftStatLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  draftStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  quickActions: {
    marginTop: 10,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E0E7FF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  pendingBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  draftsContainer: {
    padding: 20,
  },
  draftActions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  draftActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  draftActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  draftCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  draftUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  draftAge: {
    fontSize: 12,
    color: '#6B7280',
  },
  draftEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  stepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  stepText: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  clearUserButton: {
    backgroundColor: '#EF4444',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  clearUserText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  filtersContainer: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 14,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },
  activeFilter: {
    backgroundColor: '#8B5CF6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  profilesContainer: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  profileAge: {
    fontSize: 14,
    color: '#6B7280',
  },
  profileGender: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  profileUser: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  profileBio: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 10,
  },
  profileMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  profileDetailHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  modalProfileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  modalProfileInfo: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 10,
  },
  modalStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    lineHeight: 20,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 12,
    color: '#5B21B6',
    fontWeight: '500',
  },
  selfieImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectModalContent: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    width: width - 40,
  },
  rejectModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  rejectModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  rejectReasonInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginBottom: 15,
  },
  rejectModalButtons: {
    flexDirection: 'row',
  },
  rejectModalCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    marginRight: 10,
  },
  rejectModalCancelText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  rejectModalSubmitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  rejectModalSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LinkmeManagement;