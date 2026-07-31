import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Image,
  Share,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import axios from 'axios';
import theme from '../../theme/Theme';

const baseURL = Platform.OS === 'ios'
  ? 'http://localhost:5000'
  : 'https://moihub.onrender.com';

const VendorProfileScreen = () => {
  const [vendor, setVendor] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageType, setImageType] = useState(null);
  const [form, setForm] = useState({
    shopName: '',
    phone: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      const profileRes = await axios.get(`${baseURL}/api/food/vendors/profile`);
      const vendorData = profileRes.data.vendor;

      const storefrontRes = await axios.get(`${baseURL}/api/food/vendors/storefront`);
      const storefrontData = storefrontRes.data.vendor;

      const mergedData = {
        ...vendorData,
        storefrontUrl: storefrontData.storefrontUrl
      };

      setVendor(mergedData);
      setForm({
        shopName: mergedData.shopName || '',
        phone: mergedData.phone || '',
        location: mergedData.location || '',
        description: mergedData.description || ''
      });
    } catch (error) {
      console.error('Fetch profile error:', error);
      Alert.alert('Error', 'Could not load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.shopName.trim() || !form.phone.trim()) {
      return Alert.alert('Validation', 'Shop name and phone are required');
    }

    setSaving(true);
    try {
      const res = await axios.put(`${baseURL}/api/food/vendors/profile`, form);
      setVendor(res.data.vendor);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      console.error('Save profile error:', err);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      shopName: vendor?.shopName || '',
      phone: vendor?.phone || '',
      location: vendor?.location || '',
      description: vendor?.description || ''
    });
    setEditing(false);
  };

  const pickImage = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageType(type);
      await uploadImage(result.assets[0].uri, type);
    }
  };

  const uploadImage = async (uri, type) => {
    setUploadingImage(true);

    try {
      const formData = new FormData();

      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : 'image/jpeg';

      const fieldName = type === 'logo' ? 'logo' : 'coverImage';

      formData.append(fieldName, {
        uri: uri,
        type: fileType,
        name: filename || `${type}.jpg`,
      });

      const endpoint = type === 'logo'
        ? `${baseURL}/api/food/vendors/storefront/logo`
        : `${baseURL}/api/food/vendors/storefront/cover`;

      const res = await axios.patch(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setVendor(prev => ({
          ...prev,
          [type]: res.data[type],
          storefrontUrl: res.data.storefrontUrl
        }));
        Alert.alert('Success', `${type === 'logo' ? 'Logo' : 'Cover image'} updated successfully`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
      setImageType(null);
    }
  };

  const shareStorefront = async () => {
    if (!vendor?.storefrontUrl) {
      Alert.alert('Error', 'Storefront URL not available');
      return;
    }

    try {
      await Share.share({
        message: `Check out my shop: ${vendor.shopName}\n${vendor.storefrontUrl}`,
        title: 'Share my shop',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const copyToClipboard = async () => {
    if (!vendor?.storefrontUrl) return;

    try {
      await Clipboard.setStringAsync(vendor.storefrontUrl);
      Alert.alert('Success', 'Storefront URL copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy URL');
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={theme.Gradients.dark} style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.Gradients.dark} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ====== COVER + AVATAR (single hero block) ====== */}
          <View style={styles.heroContainer}>
            <View style={styles.coverContainer}>
              {vendor?.coverImage ? (
                <Image source={{ uri: vendor.coverImage }} style={styles.coverImage} />
              ) : (
                <LinearGradient
                  colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)']}
                  style={styles.coverPlaceholder}
                >
                  <Ionicons name="image" size={40} color={theme.Colors.textTertiary} />
                  <Text style={styles.coverPlaceholderText}>No Cover Image</Text>
                </LinearGradient>
              )}

              <TouchableOpacity
                style={styles.coverUploadButton}
                onPress={() => pickImage('cover')}
                disabled={uploadingImage}
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)']}
                  style={styles.coverUploadGradient}
                >
                  {uploadingImage && imageType === 'cover' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="camera" size={18} color="#fff" />
                      <Text style={styles.coverUploadText}>Change Cover</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={() => pickImage('logo')}
              disabled={uploadingImage}
            >
              {vendor?.logo ? (
                <Image source={{ uri: vendor.logo }} style={styles.avatarImage} />
              ) : (
                <LinearGradient
                  colors={[theme.Colors.primary, theme.Colors.primaryDark]}
                  style={styles.avatarContainer}
                >
                  <Text style={styles.avatarText}>
                    {form.shopName ? form.shopName.charAt(0).toUpperCase() : 'S'}
                  </Text>
                </LinearGradient>
              )}

              <View style={styles.avatarBadge}>
                {uploadingImage && imageType === 'logo' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={12} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* ====== IDENTITY (title + status, under avatar) ====== */}
          <View style={styles.identityContainer}>
            <Text style={styles.headerTitle}>{form.shopName || 'Vendor Profile'}</Text>
            {!editing && (
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: vendor?.isActive ? theme.Colors.success : theme.Colors.danger }]} />
                <Text style={styles.statusText}>
                  {vendor?.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            )}
          </View>

          {/* ====== STOREFRONT URL SECTION ====== */}
          {vendor?.storefrontUrl && (
            <View style={styles.storefrontCard}>
              <View style={styles.storefrontHeader}>
                <Ionicons name="link" size={18} color={theme.Colors.primary} />
                <Text style={styles.storefrontTitle}>Your Storefront URL</Text>
                <View style={styles.storefrontBadge}>
                  <Text style={styles.storefrontBadgeText}>LIVE</Text>
                </View>
              </View>

              <View style={styles.urlContainer}>
                <Text style={styles.urlText} numberOfLines={1}>
                  {vendor.storefrontUrl}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyToClipboard}
                >
                  <Ionicons name="copy-outline" size={20} color={theme.Colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.storefrontActions}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={shareStorefront}
                >
                  <LinearGradient
                    colors={[theme.Colors.primary, theme.Colors.primaryDark]}
                    style={styles.shareButtonGradient}
                  >
                    <Ionicons name="share-social" size={18} color={theme.Colors.black} />
                    <Text style={styles.shareButtonText}>Share Shop</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={() => {
                    if (vendor?.storefrontUrl) {
                      Linking.openURL(vendor.storefrontUrl);
                    }
                  }}
                >
                  <Ionicons name="eye-outline" size={20} color={theme.Colors.primary} />
                  <Text style={styles.previewButtonText}>Preview</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.storefrontNote}>
                Share this link with customers to view your menu and place orders
              </Text>
            </View>
          )}

          {/* ====== PROFILE FIELDS CARD ====== */}
          <LinearGradient
            colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
            style={styles.profileCard}
          >
            {/* Shop Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="storefront" size={16} color={theme.Colors.primary} />
                <Text style={styles.label}>Shop Name</Text>
              </View>
              <View style={[styles.inputWrapper, !editing && styles.disabledInput]}>
                <TextInput
                  style={[styles.input, !editing && styles.disabledInputText]}
                  editable={editing}
                  value={form.shopName}
                  onChangeText={(text) => handleChange('shopName', text)}
                  placeholder="Enter shop name"
                  placeholderTextColor={theme.Colors.textTertiary}
                />
                {!editing && (
                  <Ionicons name="lock-closed" size={16} color={theme.Colors.textTertiary} />
                )}
              </View>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="call" size={16} color={theme.Colors.primary} />
                <Text style={styles.label}>Phone Number</Text>
              </View>
              <View style={[styles.inputWrapper, !editing && styles.disabledInput]}>
                <TextInput
                  style={[styles.input, !editing && styles.disabledInputText]}
                  editable={editing}
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={(text) => handleChange('phone', text)}
                  placeholder="Enter phone number"
                  placeholderTextColor={theme.Colors.textTertiary}
                />
                {!editing && (
                  <Ionicons name="lock-closed" size={16} color={theme.Colors.textTertiary} />
                )}
              </View>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="location" size={16} color={theme.Colors.primary} />
                <Text style={styles.label}>Location</Text>
              </View>
              <View style={[styles.inputWrapper, !editing && styles.disabledInput]}>
                <TextInput
                  style={[styles.input, !editing && styles.disabledInputText]}
                  editable={editing}
                  value={form.location}
                  onChangeText={(text) => handleChange('location', text)}
                  placeholder="Enter location"
                  placeholderTextColor={theme.Colors.textTertiary}
                />
                {!editing && (
                  <Ionicons name="lock-closed" size={16} color={theme.Colors.textTertiary} />
                )}
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Ionicons name="information-circle" size={16} color={theme.Colors.primary} />
                <Text style={styles.label}>Description</Text>
              </View>
              <View style={[styles.inputWrapper, styles.textAreaWrapper, !editing && styles.disabledInput]}>
                <TextInput
                  style={[styles.input, styles.textArea, !editing && styles.disabledInputText]}
                  multiline
                  numberOfLines={4}
                  editable={editing}
                  value={form.description}
                  onChangeText={(text) => handleChange('description', text)}
                  placeholder="Tell customers about your business"
                  placeholderTextColor={theme.Colors.textTertiary}
                  textAlignVertical="top"
                />
                {!editing && (
                  <Ionicons name="lock-closed" size={16} color={theme.Colors.textTertiary} style={styles.textAreaLock} />
                )}
              </View>
            </View>
          </LinearGradient>

          {/* ====== STATS CARD (separated from fields) ====== */}
          {!editing && vendor && (
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Ionicons name="calendar" size={16} color={theme.Colors.primary} />
                <Text style={styles.statLabel}>Member since</Text>
                <Text style={styles.statValue}>
                  {new Date(vendor.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color={theme.Colors.primary} />
                <Text style={styles.statLabel}>Last updated</Text>
                <Text style={styles.statValue}>
                  {vendor.updatedAt ? new Date(vendor.updatedAt).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>
          )}

          {/* ====== ACTION BUTTONS ====== */}
          <View style={styles.buttonContainer}>
            {editing ? (
              <>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <LinearGradient
                    colors={[theme.Colors.primary, theme.Colors.primaryDark]}
                    style={styles.saveButtonGradient}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={theme.Colors.black} />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={18} color={theme.Colors.black} />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
                <LinearGradient
                  colors={[theme.Colors.primary, theme.Colors.primaryDark]}
                  style={styles.editButtonGradient}
                >
                  <Ionicons name="create" size={18} color={theme.Colors.black} />
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* ====== INFO NOTE ====== */}
          {!editing && (
            <View style={styles.infoNote}>
              <Ionicons name="information-circle" size={14} color={theme.Colors.textSecondary} />
              <Text style={styles.infoNoteText}>
                Tap Edit Profile to update your information
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    ...theme.Typography.body,
    marginTop: theme.Spacing.md,
  },
  scrollContent: {
    paddingBottom: theme.Spacing.lg,
  },
  // ====== HERO (cover + overlapping avatar) ======
  heroContainer: {
    marginBottom: theme.Spacing.xxl ?? 48,
  },
  coverContainer: {
    width: '100%',
    height: 150,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.Colors.cardBorder,
    borderStyle: 'dashed',
  },
  coverPlaceholderText: {
    ...theme.Typography.caption,
    color: theme.Colors.textTertiary,
    marginTop: theme.Spacing.xs,
  },
  coverUploadButton: {
    position: 'absolute',
    bottom: theme.Spacing.md,
    right: theme.Spacing.md,
    borderRadius: theme.BorderRadius.sm,
    overflow: 'hidden',
  },
  coverUploadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.xs,
  },
  coverUploadText: {
    ...theme.Typography.caption,
    color: '#fff',
    fontWeight: '600',
  },
  avatarWrapper: {
    position: 'absolute',
    left: theme.Spacing.lg,
    top: 150 - 40, // overlaps bottom edge of 150px cover, avatar is 80px
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.Colors.black,
    ...theme.Shadows.medium,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: theme.Colors.black,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.Colors.black,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.Colors.black,
  },
  // ====== IDENTITY ======
  identityContainer: {
    paddingHorizontal: theme.Spacing.lg,
    marginTop: theme.Spacing.sm,
    marginBottom: theme.Spacing.lg,
  },
  headerTitle: {
    ...theme.Typography.h2,
    marginBottom: theme.Spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
  },
  // ====== STOREFRONT URL ======
  storefrontCard: {
    ...theme.Components.card,
    padding: theme.Spacing.md,
    marginHorizontal: theme.Spacing.lg,
    marginBottom: theme.Spacing.lg,
    backgroundColor: 'rgba(1,96,76,0.08)',
    borderColor: 'rgba(1,96,76,0.2)',
    borderWidth: 1,
  },
  storefrontHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
    marginBottom: theme.Spacing.sm,
  },
  storefrontTitle: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.primary,
    fontWeight: '600',
  },
  storefrontBadge: {
    backgroundColor: theme.Colors.success,
    paddingHorizontal: theme.Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  storefrontBadgeText: {
    ...theme.Typography.caption,
    color: theme.Colors.black,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: theme.BorderRadius.sm,
    paddingHorizontal: theme.Spacing.sm,
    paddingVertical: theme.Spacing.xs,
    marginBottom: theme.Spacing.sm,
  },
  urlText: {
    flex: 1,
    ...theme.Typography.caption,
    color: theme.Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    padding: theme.Spacing.xs,
  },
  storefrontActions: {
    flexDirection: 'row',
    gap: theme.Spacing.sm,
  },
  shareButton: {
    flex: 1,
    borderRadius: theme.BorderRadius.sm,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.sm,
    gap: theme.Spacing.xs,
  },
  shareButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.black,
    fontSize: 13,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.Spacing.md,
    paddingVertical: theme.Spacing.sm,
    borderRadius: theme.BorderRadius.sm,
    borderWidth: 1,
    borderColor: theme.Colors.primary,
    gap: theme.Spacing.xs,
  },
  previewButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.primary,
    fontSize: 13,
  },
  storefrontNote: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
    marginTop: theme.Spacing.xs,
    textAlign: 'center',
  },
  // ====== PROFILE FIELDS ======
  profileCard: {
    ...theme.Components.card,
    padding: theme.Spacing.lg,
    marginHorizontal: theme.Spacing.lg,
    marginBottom: theme.Spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.Spacing.lg,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.Spacing.xs,
    marginBottom: theme.Spacing.xs,
  },
  label: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.BorderRadius.md,
    borderWidth: 1,
    borderColor: theme.Colors.cardBorder,
    paddingHorizontal: theme.Spacing.md,
  },
  disabledInput: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    flex: 1,
    ...theme.Typography.body,
    paddingVertical: theme.Spacing.md,
    color: theme.Colors.text,
  },
  disabledInputText: {
    color: theme.Colors.textSecondary,
  },
  textAreaWrapper: {
    alignItems: 'flex-start',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textAreaLock: {
    position: 'absolute',
    top: theme.Spacing.md,
    right: theme.Spacing.md,
  },
  // ====== STATS (own card) ======
  statsCard: {
    ...theme.Components.card,
    flexDirection: 'row',
    marginHorizontal: theme.Spacing.lg,
    marginBottom: theme.Spacing.lg,
    padding: theme.Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.Colors.cardBorder,
  },
  statLabel: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
  },
  statValue: {
    ...theme.Typography.bodySmall,
    color: theme.Colors.text,
    fontWeight: '600',
  },
  // ====== ACTIONS ======
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.Spacing.md,
    marginHorizontal: theme.Spacing.lg,
    marginBottom: theme.Spacing.lg,
  },
  editButton: {
    flex: 1,
    borderRadius: theme.BorderRadius.md,
    overflow: 'hidden',
  },
  editButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.md,
    gap: theme.Spacing.sm,
  },
  editButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.black,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.Spacing.md,
    borderRadius: theme.BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.Colors.cardBorder,
  },
  cancelButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    borderRadius: theme.BorderRadius.md,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.Spacing.md,
    gap: theme.Spacing.sm,
  },
  saveButtonText: {
    ...theme.Typography.button,
    color: theme.Colors.black,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.Spacing.xs,
  },
  infoNoteText: {
    ...theme.Typography.caption,
    color: theme.Colors.textSecondary,
  },
});

export default VendorProfileScreen;