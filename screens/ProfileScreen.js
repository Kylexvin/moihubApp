import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Dimensions,
  TextInput,
  Modal,
  ActivityIndicator,
  Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const BASE_URL = 'https://moihub.onrender.com';

const ProfileScreen = () => {
  const { currentUser, logout, setCurrentUser, token, refreshUser } = useAuth();
  const navigation = useNavigation();

  const [editUsernameModal, setEditUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshUser();
  }, []);

  const rolesWithDashboard = ['vendor', 'shopowner', 'SERVICE_PROVIDER', 'writer', "admin"];
  const showDashboardCard = currentUser && rolesWithDashboard.includes(currentUser.role);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // ─── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try { await logout(); }
            catch (e) { Alert.alert('Error', 'Failed to logout.'); }
          }
        }
      ],
      { cancelable: true }
    );
  };

  // ─── Username Update ──────────────────────────────────────────────────────
  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) return Alert.alert('Error', 'Username cannot be empty');
    if (newUsername.length < 3) return Alert.alert('Error', 'Username must be at least 3 characters');

    setIsLoading(true);
    try {
      const response = await axios.patch(
        `${BASE_URL}/api/auth/profile`,
        { username: newUsername.trim() },
        { headers: authHeaders, timeout: 15000 }
      );

      if (response.data.success) {
        const updatedUser = { ...currentUser, ...response.data.user };
        setCurrentUser(updatedUser);
        try {
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (storageError) {
          console.error('Error updating storage:', storageError);
        }
        setEditUsernameModal(false);
        setNewUsername('');
        Alert.alert('Success', 'Username updated successfully!');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update username');
      }
    } catch (error) {
      console.error('Username update error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update username');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Avatar ───────────────────────────────────────────────────────────────
  const handleAvatarUpdate = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => pickImage('camera') },
        { text: 'Choose from Gallery', onPress: () => pickImage('gallery') },
        { text: 'Remove Current Photo', onPress: handleRemoveAvatar, style: 'destructive' }
      ]
    );
  };

  const pickImage = async (source) => {
    try {
      const permissionResult = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', `Please allow access to your ${source === 'camera' ? 'camera' : 'photo library'}`);
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          });

      if (!result.canceled) {
        setIsLoading(true);

        const formData = new FormData();
        formData.append('avatar', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        });

        const response = await axios.post(
          `${BASE_URL}/api/auth/profile/avatar`,
          formData,
          {
            headers: {
              ...authHeaders,
              'Content-Type': 'multipart/form-data',
            },
            timeout: 30000,
          }
        );

        if (response.data.success) {
          const updatedUser = { ...currentUser, avatar: response.data.user.avatar };
          setCurrentUser(updatedUser);
          try {
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          } catch (storageError) {
            console.error('Error updating storage:', storageError);
          }
          Alert.alert('Success', 'Profile picture updated!');
        } else {
          Alert.alert('Error', response.data.message || 'Failed to update picture');
        }
      }
    } catch (error) {
      console.error('Image picker error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile picture');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAvatar = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const response = await axios.patch(
                `${BASE_URL}/api/auth/profile`,
                { removeAvatar: true },
                { headers: authHeaders, timeout: 15000 }
              );
              if (response.data.success) {
                const updatedUser = { ...currentUser, avatar: null };
                setCurrentUser(updatedUser);
                try {
                  await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (storageError) {
                  console.error('Error updating storage:', storageError);
                }
                Alert.alert('Success', 'Profile picture removed');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove profile picture');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
const getDashboardInfo = (role) => {
  switch (role) {
    case 'vendor':
      return { title: 'VENDOR PORTAL', subtitle: 'Access Vendor Dashboard', icon: 'cube', route: 'VendorDashboard' };
    case 'shopowner':
      return { title: 'SHOP MANAGER', subtitle: 'Access Shop Dashboard', icon: 'storefront', route: 'Eshop' };
    case 'SERVICE_PROVIDER':
      return { title: 'SERVICE PROVIDER', subtitle: 'Manage Shop & Services', icon: 'construct', route: 'ServiceProviderDashboard' };
    case 'writer':
      return { title: 'WRITER PORTAL', subtitle: 'Manage your blog posts', icon: 'create', route: 'WriterNavigator' };
    case 'admin':  // ← ADD THIS
      return { title: 'WRITER PORTAL', subtitle: 'Manage blog posts as admin', icon: 'create', route: 'WriterNavigator' };
    default:
      return null;
  }
};

  const getRoleColor = (role) => {
    switch (role) {
      case 'vendor':           return '#9c27b0';
      case 'shopowner':        return '#4caf50';
      case 'SERVICE_PROVIDER': return '#2196f3';
      case 'writer':           return '#FF9800';
      default:                 return '#6c7ce7';
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#083028" />

      <LinearGradient
        colors={['#083028', '#0a0a0a', '#0a0a0a']}
        style={styles.background}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header / Avatar ── */}
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <TouchableOpacity onPress={handleAvatarUpdate} disabled={isLoading}>
              <LinearGradient
                colors={['#6c7ce7', '#a055ff', '#ff3366']}
                style={styles.profileImageGradient}
              >
                <View style={styles.profileImage}>
                  {currentUser?.avatar ? (
                    <Image source={{ uri: currentUser.avatar }} style={styles.profileImageActual} />
                  ) : (
                    <Text style={styles.profileImageText}>
                      {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cameraIconButton} onPress={handleAvatarUpdate}>
              <LinearGradient colors={['#6c7ce7', '#a055ff']} style={styles.cameraIconGradient}>
                <Ionicons name="camera" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </View>

          <Text style={styles.username}>{currentUser?.username}</Text>
          <Text style={styles.email}>{currentUser?.email}</Text>

          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(currentUser?.role) }]}>
            <Text style={styles.roleText}>{currentUser?.role?.toUpperCase() || 'USER'}</Text>
          </View>
        </View>

        {/* ── Account Info ── */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>ACCOUNT INFORMATION</Text>

          {/* Username — editable */}
          <TouchableOpacity
            onPress={() => {
              setNewUsername(currentUser?.username || '');
              setEditUsernameModal(true);
            }}
          >
            <View style={styles.infoRow}>
              <LinearGradient
                colors={['rgba(108, 124, 231, 0.1)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.infoRowGradient}
              >
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>USERNAME</Text>
                  <Text style={styles.infoValue}>{currentUser?.username}</Text>
                </View>
                <Ionicons name="pencil" size={18} color="#6c7ce7" style={styles.rowEditIcon} />
              </LinearGradient>
            </View>
          </TouchableOpacity>

          {/* Email */}
          <View style={styles.infoRow}>
            <LinearGradient
              colors={['rgba(108, 124, 231, 0.1)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.infoRowGradient}
            >
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>EMAIL</Text>
                <Text style={styles.infoValue}>{currentUser?.email}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Role */}
          <View style={styles.infoRow}>
            <LinearGradient
              colors={['rgba(108, 124, 231, 0.1)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.infoRowGradient}
            >
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>ACCESS LEVEL</Text>
                <Text style={styles.infoValue}>{currentUser?.role?.toUpperCase() || 'USER'}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* OAuth provider */}
          {currentUser?.provider && (
            <View style={styles.infoRow}>
              <LinearGradient
                colors={['rgba(108, 124, 231, 0.1)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.infoRowGradient}
              >
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>SIGN IN METHOD</Text>
                  <Text style={styles.infoValue}>
                    {currentUser.provider.toUpperCase()}
                    {!currentUser.password && ' (No Password)'}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* ── Dashboard Card ── */}
        {showDashboardCard && (() => {
          const info = getDashboardInfo(currentUser.role);
          if (!info) return null;
          return (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate(info.route)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(89, 173, 110, 0.2)', 'rgba(160, 85, 255, 0.2)']}
                style={styles.actionGradient}
              >
                <View style={styles.actionContent}>
                  <View style={styles.actionIcon}>
                    <Ionicons name={info.icon} size={24} color="#6c7ce7" />
                  </View>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>{info.title}</Text>
                    <Text style={styles.actionSubtitle}>{info.subtitle}</Text>
                  </View>
                  <View style={styles.actionArrow}>
                    <Ionicons name="chevron-forward" size={20} color="#6c7ce7" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })()}

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <LinearGradient colors={['#ff3366', '#ff1744']} style={styles.logoutGradient}>
            <Text style={styles.logoutText}>LOG OUT</Text>
            <View style={styles.logoutIndicator} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Edit Username Modal ── */}
      <Modal
        visible={editUsernameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEditUsernameModal(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#1a1a1a', '#0a0a0a']} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Username</Text>

            <TextInput
              style={styles.modalInput}
              value={newUsername}
              onChangeText={setNewUsername}
              placeholder="Enter new username"
              placeholderTextColor="#666"
              autoCapitalize="none"
              maxLength={30}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => { setEditUsernameModal(false); setNewUsername(''); }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateUsername}
                disabled={isLoading}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveButtonText}>Save</Text>
                }
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profileContainer: {
    position: 'relative',
    marginBottom: 10,
    alignItems: 'center',
  },
  profileImageGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 3,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 57,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    overflow: 'hidden',
  },
  profileImageActual: {
    width: '100%',
    height: '100%',
  },
  profileImageText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cameraIconButton: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    zIndex: 10,
  },
  cameraIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0a0a0a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#999',
    marginBottom: 16,
    textAlign: 'center',
  },
  roleBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  roleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  infoSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6c7ce7',
    marginBottom: 20,
    letterSpacing: 2,
    textAlign: 'center',
  },
  infoRow: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  infoRowGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  rowEditIcon: {
    marginLeft: 10,
  },
  actionCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  actionGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(108, 124, 231, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  actionArrow: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#ff3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoutGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
    marginRight: 12,
  },
  logoutIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    width: width * 0.8,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  saveButton: {
    backgroundColor: '#6c7ce7',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;