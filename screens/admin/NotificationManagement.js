import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Switch,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import axios from 'axios';

const { width, height } = Dimensions.get('window');



const NotificationManagement = () => {
  // State Management
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal States
  const [showPushModal, setShowPushModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Push Notification States
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushData, setPushData] = useState('');
  const [pushTarget, setPushTarget] = useState('all');
  const [pushRole, setPushRole] = useState('user');
  const [pushUserIds, setPushUserIds] = useState('');
  const [pushHoursAgo, setPushHoursAgo] = useState('24');


 
useEffect(() => {
  loadUsers();
  loadStats();
}, [currentPage, selectedRole, searchQuery]);

const loadUsers = async () => {
  setLoading(true);
  try {
    const params = {
      page: currentPage,
      limit: 20,
      ...(selectedRole && { role: selectedRole }),
      ...(searchQuery && { search: searchQuery }),
    };

    const { data } = await axios.get('/api/admin/users', { params });

    setUsers(data.users);
    setTotalPages(data.pagination.totalPages);
  } catch (error) {
    console.error('Failed to load users:', error);
    Alert.alert('Error', error?.response?.data?.message || 'Failed to load users');
  } finally {
    setLoading(false);
  }
};

const loadStats = async () => {
  try {
    const { data } = await axios.get('/api/admin/stats');
    setStats(data);
  } catch (error) {
    console.error('Failed to load stats:', error);
    Alert.alert('Error', error?.response?.data?.message || 'Failed to load stats');
  }
};

const loadUserDetails = async (userId) => {
  try {
    const { data } = await axios.get(`/api/admin/users/${userId}`);
    setSelectedUser(data);
    setShowUserModal(true);
  } catch (error) {
    console.error('Failed to load user details:', error);
    Alert.alert('Error', error?.response?.data?.message || 'Failed to load user details');
  }
};

const deactivateUser = async (userId) => {
  Alert.alert(
    'Confirm Deactivation',
    'Are you sure you want to deactivate this user?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.patch(`/api/admin/users/${userId}/deactivate`, {
              reason: 'Admin action',
            });
            Alert.alert('Success', 'User deactivated successfully');
            loadUsers();
          } catch (error) {
            console.error('Failed to deactivate user:', error);
            Alert.alert('Error', error?.response?.data?.message || 'Failed to deactivate user');
          }
        },
      },
    ]
  );
};

const deleteUser = async (userId) => {
  Alert.alert(
    'Confirm Deletion',
    'This action cannot be undone. Are you sure?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`/api/admin/users/${userId}`, {
              data: { confirmDelete: true },
            });
            Alert.alert('Success', 'User deleted successfully');
            loadUsers();
          } catch (error) {
            console.error('Failed to delete user:', error);
            Alert.alert('Error', error?.response?.data?.message || 'Failed to delete user');
          }
        },
      },
    ]
  );
};

const resetPushToken = async (userId) => {
  try {
    await axios.patch(`/api/admin/users/${userId}/reset-push-token`);
    Alert.alert('Success', 'Push token reset successfully');
    loadUsers();
  } catch (error) {
    console.error('Failed to reset push token:', error);
    Alert.alert('Error', error?.response?.data?.message || 'Failed to reset push token');
  }
};


const forcePasswordReset = async (userId) => {
  try {
    await axios.post(`/api/admin/users/${userId}/force-password-reset`, {
      reason: 'Admin forced reset',
    });
    Alert.alert('Success', 'Password reset forced successfully');
  } catch (error) {
    console.error('Failed to force password reset:', error);
    Alert.alert('Error', error?.response?.data?.message || 'Failed to force password reset');
  }
};

const sendPushNotification = async () => {
  if (!pushTitle || !pushBody) {
    Alert.alert('Error', 'Title and body are required');
    return;
  }

  let endpoint = '';
  const pushDataObj = pushData ? JSON.parse(pushData) : {};
  const body = { title: pushTitle, body: pushBody, data: pushDataObj };

  switch (pushTarget) {
    case 'all':
      endpoint = '/api/admin/push/all';
      break;
    case 'role':
      if (!pushRole) {
        Alert.alert('Error', 'Role is required');
        return;
      }
      endpoint = '/api/admin/push/role';
      body.role = pushRole;
      break;
    case 'users':
      if (!pushUserIds) {
        Alert.alert('Error', 'User IDs are required');
        return;
      }
      endpoint = '/api/admin/push/users';
      body.userIds = pushUserIds.split(',').map(id => id.trim());
      break;
    case 'active':
      if (!pushHoursAgo || isNaN(pushHoursAgo)) {
        Alert.alert('Error', 'Valid hoursAgo is required');
        return;
      }
      endpoint = '/api/admin/push/active';
      body.hoursAgo = parseInt(pushHoursAgo);
      break;
    default:
      Alert.alert('Error', 'Invalid push target selected');
      return;
  }

  try {
    const { data } = await axios.post(endpoint, body);
    Alert.alert('Success', `Push notification sent: ${data.message}`);
    setShowPushModal(false);
    setPushTitle('');
    setPushBody('');
    setPushData('');
    setPushUserIds('');
    setPushHoursAgo('');
    setPushRole('');
  } catch (error) {
    console.error('Failed to send push notification:', error);
    Alert.alert('Error', error?.response?.data?.message || 'Failed to send push notification');
  }
};



  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    await loadStats();
    setRefreshing(false);
  };

  // Render Functions
  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          <Text style={[styles.userRole, { color: getRoleColor(item.role) }]}>
            {item.role.toUpperCase()}
          </Text>
          <Text style={styles.userStatus}>
            {item.isOnline ? '🟢 Online' : '🔴 Offline'}
          </Text>
          <Text style={styles.userVerified}>
            {item.emailVerified ? '✅ Verified' : '❌ Unverified'}
          </Text>
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => loadUserDetails(item._id)}
        >
          <Ionicons name="eye" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => deactivateUser(item._id)}
        >
          <Ionicons name="pause" size={20} color="#FF9500" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => deleteUser(item._id)}
        >
          <Ionicons name="trash" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStatsCard = (title, value, icon, color) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsContent}>
        <Text style={styles.statsTitle}>{title}</Text>
        <Text style={[styles.statsValue, { color }]}>{value}</Text>
      </View>
      <Ionicons name={icon} size={24} color={color} />
    </View>
  );

  const getRoleColor = (role) => {
    const colors = {
      admin: '#FF3B30',
      writer: '#007AFF',
      vendor: '#34C759',
      shopowner: '#FF9500',
      user: '#8E8E93',
    };
    return colors[role] || '#8E8E93';
  };

  const renderPushModal = () => (
    <Modal visible={showPushModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Push Notification</Text>
            <TouchableOpacity onPress={() => setShowPushModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <Text style={styles.inputLabel}>Target</Text>
            <Picker
              selectedValue={pushTarget}
              onValueChange={setPushTarget}
              style={styles.picker}
            >
              <Picker.Item label="All Users" value="all" />
              <Picker.Item label="By Role" value="role" />
              <Picker.Item label="Specific Users" value="users" />
              <Picker.Item label="Active Users" value="active" />
            </Picker>

            {pushTarget === 'role' && (
              <>
                <Text style={styles.inputLabel}>Role</Text>
                <Picker
                  selectedValue={pushRole}
                  onValueChange={setPushRole}
                  style={styles.picker}
                >
                  <Picker.Item label="User" value="user" />
                  <Picker.Item label="Admin" value="admin" />
                  <Picker.Item label="Writer" value="writer" />
                  <Picker.Item label="Vendor" value="vendor" />
                  <Picker.Item label="Shop Owner" value="shopowner" />
                </Picker>
              </>
            )}

            {pushTarget === 'users' && (
              <>
                <Text style={styles.inputLabel}>User IDs (comma-separated)</Text>
                <TextInput
                  style={styles.input}
                  value={pushUserIds}
                  onChangeText={setPushUserIds}
                  placeholder="user1,user2,user3"
                />
              </>
            )}

            {pushTarget === 'active' && (
              <>
                <Text style={styles.inputLabel}>Hours Ago</Text>
                <TextInput
                  style={styles.input}
                  value={pushHoursAgo}
                  onChangeText={setPushHoursAgo}
                  placeholder="24"
                  keyboardType="numeric"
                />
              </>
            )}

            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              value={pushTitle}
              onChangeText={setPushTitle}
              placeholder="Notification title"
            />

            <Text style={styles.inputLabel}>Body *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={pushBody}
              onChangeText={setPushBody}
              placeholder="Notification body"
              multiline
            />

            <Text style={styles.inputLabel}>Data (JSON)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={pushData}
              onChangeText={setPushData}
              placeholder='{"key": "value"}'
              multiline
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowPushModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.sendButton]}
              onPress={sendPushNotification}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderUserModal = () => (
    <Modal visible={showUserModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Details</Text>
            <TouchableOpacity onPress={() => setShowUserModal(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          {selectedUser && (
            <ScrollView style={styles.modalBody}>
              <View style={styles.userDetailRow}>
                <Text style={styles.detailLabel}>Username:</Text>
                <Text style={styles.detailValue}>{selectedUser.username}</Text>
              </View>
              <View style={styles.userDetailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{selectedUser.email}</Text>
              </View>
              <View style={styles.userDetailRow}>
                <Text style={styles.detailLabel}>Role:</Text>
                <Text style={[styles.detailValue, { color: getRoleColor(selectedUser.role) }]}>
                  {selectedUser.role.toUpperCase()}
                </Text>
              </View>
              <View style={styles.userDetailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>
                  {selectedUser.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
              <View style={styles.userDetailRow}>
                <Text style={styles.detailLabel}>Verified:</Text>
                <Text style={styles.detailValue}>
                  {selectedUser.emailVerified ? 'Yes' : 'No'}
                </Text>
              </View>
              <View style={styles.userDetailRow}>
                <Text style={styles.detailLabel}>Push Token:</Text>
                <Text style={styles.detailValue}>
                  {selectedUser.expoPushToken ? 'Available' : 'Not Available'}
                </Text>
              </View>
              <View style={styles.userDetailRow}>
                <Text style={styles.detailLabel}>Created:</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedUser.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.userDetailRow}>
                <Text style={styles.detailLabel}>Last Active:</Text>
                <Text style={styles.detailValue}>
                  {selectedUser.lastActiveAt ? 
                    new Date(selectedUser.lastActiveAt).toLocaleDateString() : 
                    'Never'
                  }
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.warningButton]}
                  onPress={() => resetPushToken(selectedUser._id)}
                >
                  <Text style={styles.buttonText}>Reset Push Token</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.warningButton]}
                  onPress={() => forcePasswordReset(selectedUser._id)}
                >
                  <Text style={styles.buttonText}>Force Password Reset</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity onPress={() => setShowPushModal(true)}>
          <Ionicons name="notifications" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Statistics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'users' ? (
        <View style={styles.content}>
          {/* Search and Filter */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Picker
              selectedValue={selectedRole}
              onValueChange={setSelectedRole}
              style={styles.roleFilter}
            >
              <Picker.Item label="All Roles" value="" />
              <Picker.Item label="Users" value="user" />
              <Picker.Item label="Admins" value="admin" />
              <Picker.Item label="Writers" value="writer" />
              <Picker.Item label="Vendors" value="vendor" />
              <Picker.Item label="Shop Owners" value="shopowner" />
            </Picker>
          </View>

          {/* Users List */}
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No users found</Text>
            }
          />

          {/* Pagination */}
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
              onPress={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Text style={styles.paginationButtonText}>Previous</Text>
            </TouchableOpacity>
            <Text style={styles.paginationText}>{currentPage} of {totalPages}</Text>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
              onPress={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Text style={styles.paginationButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
<ScrollView 
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
>
  <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
    <View style={styles.statsContainer}>
      {renderStatsCard('Total Users', stats.totalUsers, 'people', '#007AFF')}
      {renderStatsCard('Verified Users', stats.verifiedUsers, 'checkmark-circle', '#34C759')}
      {renderStatsCard('Online Users', stats.onlineUsers, 'radio-button-on', '#30D158')}
      {renderStatsCard('Push Enabled', stats.usersWithPushTokens, 'notifications', '#FF9500')}
      {renderStatsCard('New This Week', stats.recentRegistrations, 'trending-up', '#FF3B30')}
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Users by Role</Text>
      {stats.usersByRole?.map((role, index) => (
        <View key={index} style={styles.roleRow}>
          <Text style={styles.roleLabel}>{role._id.toUpperCase()}</Text>
          <Text style={[styles.roleCount, { color: getRoleColor(role._id) }]}>
            {role.count}
          </Text>
        </View>
      ))}
    </View>
  </View>
</ScrollView>

      )}

      {/* Modals */}
      {renderPushModal()}
      {renderUserModal()}

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 2,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  roleFilter: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
  },
  userStatus: {
    fontSize: 12,
  },
  userVerified: {
    fontSize: 12,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
  },
statsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginBottom: 24,
  marginHorizontal: -6,  // compensate for horizontal margins on cards
},
statsCard: {
  backgroundColor: '#fff',
  padding: 16,
  borderRadius: 8,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: (width - 40 - 12) / 2,  // 40 = parent horizontal padding, 12 = total margin between 2 cards
  marginHorizontal: 6,  // half of the 12 gap divided per side
  marginBottom: 12,
  borderLeftWidth: 4,
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
},

  statsContent: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roleLabel: {
    fontSize: 14,
  },
  roleCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  paginationButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  paginationText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#007AFF',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  warningButton: {
    backgroundColor: '#FF9500',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  userDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  actionButtons: {
    marginTop: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationManagement;