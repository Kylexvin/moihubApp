// screens/localservices/dashboard/BusinessProfile.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import Theme from '../../theme/Theme';

const { Colors, Typography, Spacing, BorderRadius, Shadows } = Theme;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────
const MODAL_BG       = '#161616';
const MODAL_BORDER   = 'rgba(80,200,120,0.25)';
const INPUT_BG       = 'rgba(255,255,255,0.07)';
const INPUT_BORDER   = 'rgba(255,255,255,0.15)';
const SECTION_BG     = 'rgba(255,255,255,0.05)';
const SECTION_BORDER = 'rgba(255,255,255,0.1)';
const OVERLAY        = 'rgba(0,0,0,0.78)';

const ModalShell = ({ visible, onClose, title, children, onSave, saveLabel = 'Save', saving }) => (
  <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: OVERLAY, justifyContent: 'flex-end' }}
    >
      <View style={{ backgroundColor: MODAL_BG, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: MODAL_BORDER, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '90%' }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginTop: 16, marginBottom: 8 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#ffffff' }}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="close" size={22} color="#888888" />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 24 }}>
            <TouchableOpacity style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' }} onPress={onClose} disabled={saving}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#888888' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#50c878', alignItems: 'center' }} onPress={onSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={{ fontSize: 16, fontWeight: '700', color: '#000000' }}>{saveLabel}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

const InputField = ({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }) => (
  <View style={{ marginBottom: 24 }}>
    <Text style={{ fontSize: 13, fontWeight: '600', color: '#888888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    <TextInput
      style={{ backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', color: '#ffffff', fontSize: 15, ...(multiline && { minHeight: 100, textAlignVertical: 'top' }) }}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#777777"
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      textAlignVertical={multiline ? 'top' : 'center'}
      keyboardType={keyboardType}
    />
  </View>
);

const BusinessProfile = ({ navigation: navProp }) => {
  const navHook = useNavigation();
  const navigation = navProp || navHook;

  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileData, setProfileData]       = useState(null);

  const [showEditModal, setShowEditModal]         = useState(false);
  const [showHoursModal, setShowHoursModal]       = useState(false);
  const [showSocialModal, setShowSocialModal]     = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showImagePicker, setShowImagePicker]     = useState(false);
  const [imageType, setImageType]                 = useState('');
  const [currentLocation, setCurrentLocation]     = useState(null);

  const [formData, setFormData] = useState({ description: '', });

  const [hoursData, setHoursData] = useState({
    monday:    { open: '08:00', close: '17:00' },
    tuesday:   { open: '08:00', close: '17:00' },
    wednesday: { open: '08:00', close: '17:00' },
    thursday:  { open: '08:00', close: '17:00' },
    friday:    { open: '08:00', close: '17:00' },
    saturday:  { open: '09:00', close: '14:00' },
    sunday:    { open: '',      close: ''       },
  });

  const [socialData, setSocialData] = useState({
    website: '', facebook: '', instagram: '', twitter: '', tiktok: '',
  });

  const [locationData, setLocationData] = useState({
    latitude: 0, longitude: 0, address: '',
  });

  const daysOfWeek = [
    { key: 'monday',    label: 'Mon' },
    { key: 'tuesday',   label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday',  label: 'Thu' },
    { key: 'friday',    label: 'Fri' },
    { key: 'saturday',  label: 'Sat' },
    { key: 'sunday',    label: 'Sun' },
  ];

  const socialPlatforms = [
    { key: 'website',   label: 'Website',   icon: 'globe',          color: Colors.primary },
    { key: 'facebook',  label: 'Facebook',  icon: 'logo-facebook',  color: '#1877F2'      },
    { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E4405F'      },
    { key: 'twitter',   label: 'Twitter',   icon: 'logo-twitter',   color: '#1DA1F2'      },
    { key: 'tiktok',    label: 'TikTok',    icon: 'logo-tiktok',    color: '#aaaaaa'      },
  ];

  useEffect(() => { fetchProfile(); getCurrentLocation(); }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (e) { console.error('Location error:', e); }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/services/dashboard/profile');
      setProfileData(response.data);
      if (response.data) {
        setFormData({ description: response.data.description || '' });
        if (response.data.operatingHours) setHoursData(response.data.operatingHours);
        if (response.data.socialLinks)    setSocialData(response.data.socialLinks);
        if (response.data.coordinates) {
          setLocationData({
            latitude:  response.data.coordinates.latitude  || 0,
            longitude: response.data.coordinates.longitude || 0,
            address:   response.data.coordinates.address   || '',
          });
        }
      }
    } catch (e) {
      console.error('Fetch profile error:', e);
      Alert.alert('Error', 'Failed to load business profile');
    } finally { setLoading(false); }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Camera roll permissions needed.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: imageType === 'cover' ? [16, 9] : [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const ok = await uploadImage(result.assets[0]);
        if (ok) setShowImagePicker(false);
      }
    } catch (e) { Alert.alert('Error', 'Failed to pick image'); }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Required', 'Camera permissions needed.'); return; }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: imageType === 'cover' ? [16, 9] : [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const ok = await uploadImage(result.assets[0]);
        if (ok) setShowImagePicker(false);
      }
    } catch (e) { Alert.alert('Error', 'Failed to take photo'); }
  };

  const uploadImage = async (imageAsset) => {
    try {
      setUploadingImage(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const fd = new FormData();
      const filename = imageAsset.uri.split('/').pop();
      const match    = /\.(\w+)$/.exec(filename);
      const type     = match ? `image/${match[1]}` : 'image/jpeg';
      fd.append('image', {
        uri:  Platform.OS === 'ios' ? imageAsset.uri.replace('file://', '') : imageAsset.uri,
        name: filename || `${imageType}-image.jpg`,
        type,
      });
      const endpoint = imageType === 'profile'
        ? '/api/services/dashboard/profile/profile-image'
        : '/api/services/dashboard/profile/cover-image';
      const response = await axios.put(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', response.data.message || 'Image updated');
        if (imageType === 'profile') setProfileData(prev => ({ ...prev, profileImage: response.data.profileImage }));
        else                         setProfileData(prev => ({ ...prev, coverImage:   response.data.coverImage   }));
        return true;
      }
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e.response?.data?.message || 'Failed to upload image');
      return false;
    } finally { setUploadingImage(false); }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const response = await axios.put('/api/services/dashboard/profile', {
        description: formData.description.trim(),
      });
      if (response.data.message) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Saved', 'Profile updated successfully', [{ text: 'OK', onPress: () => setShowEditModal(false) }]);
        fetchProfile();
      }
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e.response?.data?.message || 'Failed to save profile');
    } finally { setSaving(false); }
  };

  const handleSaveHours = async () => {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const response = await axios.put('/api/services/dashboard/profile', { operatingHours: hoursData });
      if (response.data.message) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Saved', 'Hours updated', [{ text: 'OK', onPress: () => setShowHoursModal(false) }]);
        fetchProfile();
      }
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e.response?.data?.message || 'Failed to save hours');
    } finally { setSaving(false); }
  };

  const handleSaveSocial = async () => {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const response = await axios.put('/api/services/dashboard/profile', { socialLinks: socialData });
      if (response.data.message) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Saved', 'Social links updated', [{ text: 'OK', onPress: () => setShowSocialModal(false) }]);
        fetchProfile();
      }
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e.response?.data?.message || 'Failed to save social links');
    } finally { setSaving(false); }
  };

const handleSaveLocation = async () => {
  try {
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const locationString = locationData.address ||
      `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`;

    const response = await axios.put('/api/services/dashboard/profile', {
      location: locationString
    });

    if (response.data.message) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Location updated successfully', [
        { text: 'OK', onPress: () => setShowLocationModal(false) }
      ]);
      fetchProfile();
    }
  } catch (error) {
    console.error('Save location error:', error);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert('Error', error.response?.data?.message || 'Failed to save location');
  } finally {
    setSaving(false);
  }
};
  const useCurrentLocation = () => {
    if (currentLocation) {
      setLocationData(prev => ({ ...prev, latitude: currentLocation.latitude, longitude: currentLocation.longitude }));
    }
  };

  const toggleDayClosed = (day) => {
    setHoursData(prev => ({
      ...prev,
      [day]: {
        open:  prev[day].open  ? '' : '08:00',
        close: prev[day].close ? '' : '17:00',
      },
    }));
  };

  const isDayClosed = (day) => !hoursData[day].open && !hoursData[day].close;

  const openLocationInMaps = () => {
    const addr = locationData.address;
    let url = '';
    if (addr) {
      const enc = encodeURIComponent(addr);
      url = Platform.OS === 'ios' ? `http://maps.apple.com/?q=${enc}` : `https://maps.google.com/?q=${enc}`;
    } else if (locationData.latitude !== 0) {
      url = Platform.OS === 'ios'
        ? `http://maps.apple.com/?ll=${locationData.latitude},${locationData.longitude}`
        : `https://maps.google.com/?q=${locationData.latitude},${locationData.longitude}`;
    }
    if (url) Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open maps'));
  };

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Renders ──────────────────────────────────────────────────────
  const renderCoverImage = () => (
    <View style={styles.coverImageContainer}>
      {profileData?.coverImage
        ? <Image source={{ uri: profileData.coverImage }} style={styles.coverImage} resizeMode="cover" />
        : (
          <View style={styles.noCoverImage}>
            <Ionicons name="image-outline" size={40} color={Colors.textSecondary} />
            <Text style={styles.noImageText}>Add Cover Photo</Text>
          </View>
        )
      }
      <TouchableOpacity
        style={styles.editCoverButton}
        onPress={() => { setImageType('cover'); setShowImagePicker(true); }}
        disabled={uploadingImage}
      >
        {uploadingImage && imageType === 'cover'
          ? <ActivityIndicator size="small" color="#fff" />
          : <Ionicons name="camera" size={18} color="#fff" />
        }
      </TouchableOpacity>
    </View>
  );

  const renderProfileImage = () => (
    <View style={styles.profileImageOuter}>
      <View style={styles.profileImageWrapper}>
        {profileData?.profileImage
          ? <Image source={{ uri: profileData.profileImage }} style={styles.profileImage} resizeMode="cover" />
          : (
            <View style={styles.noProfileImage}>
              <Ionicons name="business" size={40} color={Colors.textSecondary} />
            </View>
          )
        }
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => { setImageType('profile'); setShowImagePicker(true); }}
          disabled={uploadingImage}
        >
          {uploadingImage && imageType === 'profile'
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="camera" size={14} color="#fff" />
          }
        </TouchableOpacity>
      </View>

      <View style={styles.profileNameBlock}>
        <Text style={styles.businessName} numberOfLines={1}>
          {profileData?.businessName || 'Your Business'}
        </Text>
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.editInfoButton}
        onPress={() => setShowEditModal(true)}
      >
        <Ionicons name="create-outline" size={18} color={Colors.primary} />
        <Text style={styles.editInfoText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDescription = () => (
    <View style={styles.descriptionCard}>
      <Text style={styles.descText}>
        {profileData?.description || 'No description yet. Tap Edit to add one.'}
      </Text>
    </View>
  );

  const renderSectionCard = ({ icon, title, onPress, children }) => (
    <TouchableOpacity style={styles.sectionCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.sectionCardHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={18} color={Colors.primary} />
        </View>
        <Text style={styles.sectionCardTitle}>{title}</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </View>
      <View style={styles.sectionCardBody}>{children}</View>
    </TouchableOpacity>
  );

  const renderInfoCard = () => (
    <View style={styles.infoArea}>

      {/* Reviews */}
      <TouchableOpacity
        style={styles.reviewsCard}
        onPress={() => navigation.navigate('ReviewsManagement')}
        activeOpacity={0.8}
      >
        <View style={styles.reviewsLeft}>
          <Ionicons name="star" size={22} color={Colors.warning} />
          <Text style={styles.reviewsTitle}>Manage Reviews</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
      </TouchableOpacity>

      {/* Location */}
      {renderSectionCard({
        icon: 'location',
        title: 'Location',
        onPress: () => setShowLocationModal(true),
        children: (
          <Text style={styles.sectionValueText} numberOfLines={2}>
            {profileData?.location || 'Tap to add your business location'}
          </Text>
        ),
      })}

      {/* Hours */}
      {renderSectionCard({
        icon: 'time',
        title: 'Operating Hours',
        onPress: () => setShowHoursModal(true),
        children: (
          <View>
            {Object.entries(profileData?.operatingHours || {}).slice(0, 3).map(([day, hrs]) => (
              <Text key={day} style={styles.hoursPreviewText}>
                <Text style={{ color: Colors.textSecondary }}>
                  {day.charAt(0).toUpperCase() + day.slice(1, 3)}{'  '}
                </Text>
                {hrs.open && hrs.close ? `${hrs.open} – ${hrs.close}` : 'Closed'}
              </Text>
            ))}
          </View>
        ),
      })}

      {/* Social */}
      {renderSectionCard({
        icon: 'share-social',
        title: 'Social Links',
        onPress: () => setShowSocialModal(true),
        children: (
          <View style={styles.socialIconsRow}>
            {socialPlatforms.map(p =>
              profileData?.socialLinks?.[p.key]
                ? (
                  <View key={p.key} style={[styles.socialChip, { borderColor: p.color + '50' }]}>
                    <Ionicons name={p.icon} size={16} color={p.color} />
                  </View>
                ) : null
            )}
            {Object.values(profileData?.socialLinks || {}).filter(Boolean).length === 0 && (
              <Text style={styles.sectionValueText}>Tap to add links</Text>
            )}
          </View>
        ),
      })}

      {/* Gallery */}
      {renderSectionCard({
        icon: 'images',
        title: 'Gallery',
        onPress: () => {},
        children: (
          profileData?.gallery?.length > 0
            ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                {profileData.gallery.slice(0, 5).map((img, i) => (
                  <Image key={i} source={{ uri: img }} style={styles.galleryThumb} resizeMode="cover" />
                ))}
                {profileData.gallery.length > 5 && (
                  <View style={styles.moreGallery}>
                    <Text style={styles.moreGalleryText}>+{profileData.gallery.length - 5}</Text>
                  </View>
                )}
              </ScrollView>
            )
            : <Text style={styles.sectionValueText}>No gallery images yet</Text>
        ),
      })}
    </View>
  );



  // ─── Edit modal ───────────────────────────────────────────────────
  const renderEditModal = () => (
    <ModalShell
      visible={showEditModal}
      onClose={() => setShowEditModal(false)}
      title="Edit Profile"
      onSave={handleSaveProfile}
      saveLabel="Save Changes"
    >
      {/* Read-only name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Business Name</Text>
        <View style={styles.readonlyField}>
          <Text style={styles.readonlyText}>{profileData?.businessName || '—'}</Text>
          <View style={styles.readonlyTag}>
            <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
            <Text style={styles.readonlyTagText}>Admin set</Text>
          </View>
        </View>
      </View>

      <InputField
        label="Description"
        value={formData.description}
        onChangeText={(t) => setFormData(prev => ({ ...prev, description: t }))}
        placeholder="Describe your business..."
        multiline
      />
    </ModalShell>
  );

  // ─── Hours modal ──────────────────────────────────────────────────
  const renderHoursModal = () => (
    <ModalShell
      visible={showHoursModal}
      onClose={() => setShowHoursModal(false)}
      title="Operating Hours"
      onSave={handleSaveHours}
      saveLabel="Save Hours"
    >
      {daysOfWeek.map((day) => (
        <View key={day.key} style={styles.hoursRow}>
          <View style={styles.hoursRowTop}>
            <Text style={styles.dayLabel}>{day.label}</Text>
            <TouchableOpacity
              style={[styles.closedToggle, isDayClosed(day.key) && styles.closedToggleActive]}
              onPress={() => toggleDayClosed(day.key)}
            >
              <Text style={[styles.closedToggleText, isDayClosed(day.key) && styles.closedToggleTextActive]}>
                {isDayClosed(day.key) ? 'Closed' : 'Open'}
              </Text>
            </TouchableOpacity>
          </View>

          {!isDayClosed(day.key) && (
            <View style={styles.timeRow}>
              <View style={styles.timeGroup}>
                <Text style={styles.timeLabel}>Opens</Text>
                <TextInput
                  style={styles.timeInput}
                  value={hoursData[day.key].open}
                  onChangeText={(t) => setHoursData(prev => ({ ...prev, [day.key]: { ...prev[day.key], open: t } }))}
                  placeholder="09:00"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <Text style={styles.timeDash}>–</Text>
              <View style={styles.timeGroup}>
                <Text style={styles.timeLabel}>Closes</Text>
                <TextInput
                  style={styles.timeInput}
                  value={hoursData[day.key].close}
                  onChangeText={(t) => setHoursData(prev => ({ ...prev, [day.key]: { ...prev[day.key], close: t } }))}
                  placeholder="17:00"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>
          )}
        </View>
      ))}
    </ModalShell>
  );

  // ─── Social modal ─────────────────────────────────────────────────
  const renderSocialModal = () => (
    <ModalShell
      visible={showSocialModal}
      onClose={() => setShowSocialModal(false)}
      title="Social Media"
      onSave={handleSaveSocial}
      saveLabel="Save Links"
    >
      {socialPlatforms.map((p) => (
        <View key={p.key} style={styles.fieldGroup}>
          <View style={styles.socialFieldHeader}>
            <Ionicons name={p.icon} size={18} color={p.color} />
            <Text style={styles.fieldLabel}>{p.label}</Text>
          </View>
          <TextInput
            style={styles.fieldInput}
            value={socialData[p.key]}
            onChangeText={(t) => setSocialData(prev => ({ ...prev, [p.key]: t }))}
            placeholder={`Your ${p.label} URL`}
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      ))}
    </ModalShell>
  );

  // ─── Location modal ───────────────────────────────────────────────
  const renderLocationModal = () => (
    <ModalShell
      visible={showLocationModal}
      onClose={() => setShowLocationModal(false)}
      title="Business Location"
      onSave={handleSaveLocation}
      saveLabel="Save Location"
    >
      <InputField
        label="Address"
        value={locationData.address}
        onChangeText={(t) => setLocationData(prev => ({ ...prev, address: t }))}
        placeholder="e.g. Eldoret Town, Uasin Gishu"
        multiline
      />

      <Text style={styles.fieldLabel}>Coordinates (optional)</Text>
      <View style={styles.coordRow}>
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.coordLabel}>Latitude</Text>
          <TextInput
            style={styles.fieldInput}
            value={locationData.latitude.toString()}
            onChangeText={(t) => setLocationData(prev => ({ ...prev, latitude: parseFloat(t) || 0 }))}
            placeholder="0.0"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="numeric"
          />
        </View>
        <View style={{ width: Spacing.sm }} />
        <View style={[styles.fieldGroup, { flex: 1 }]}>
          <Text style={styles.coordLabel}>Longitude</Text>
          <TextInput
            style={styles.fieldInput}
            value={locationData.longitude.toString()}
            onChangeText={(t) => setLocationData(prev => ({ ...prev, longitude: parseFloat(t) || 0 }))}
            placeholder="0.0"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="numeric"
          />
        </View>
      </View>

      {currentLocation && (
        <TouchableOpacity style={styles.useLocationBtn} onPress={useCurrentLocation}>
          <Ionicons name="locate" size={16} color={Colors.primary} />
          <Text style={styles.useLocationText}>Use My Current Location</Text>
        </TouchableOpacity>
      )}

      {(locationData.latitude !== 0 || locationData.address) && (
        <TouchableOpacity style={styles.viewMapBtn} onPress={openLocationInMaps}>
          <Ionicons name="map" size={16} color={Colors.black} />
          <Text style={styles.viewMapText}>Preview on Maps</Text>
        </TouchableOpacity>
      )}
    </ModalShell>
  );

  // ─── Image picker modal ───────────────────────────────────────────
  const renderImagePickerModal = () => (
    <Modal animationType="slide" transparent visible={showImagePicker} onRequestClose={() => setShowImagePicker(false)}>
      <View style={styles.imagePickerOverlay}>
        <View style={styles.imagePickerCard}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { marginBottom: Spacing.lg }]}>
  {imageType === 'profile' ? 'Profile Photo' : 'Cover Photo'}
</Text>

          <View style={styles.imagePickerOptions}>
            <TouchableOpacity style={styles.imagePickerOption} onPress={takePhoto} disabled={uploadingImage}>
              <View style={[styles.imagePickerIcon, { backgroundColor: Colors.primary + '20' }]}>
                <Ionicons name="camera" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.imagePickerOptionText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.imagePickerOption} onPress={pickImage} disabled={uploadingImage}>
              <View style={[styles.imagePickerIcon, { backgroundColor: Colors.info + '20' }]}>
                <Ionicons name="image" size={28} color={Colors.info} />
              </View>
              <Text style={styles.imagePickerOptionText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.imagePickerCancelBtn} onPress={() => setShowImagePicker(false)} disabled={uploadingImage}>
            <Text style={styles.imagePickerCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ─── Main render ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderCoverImage()}
        {renderProfileImage()}
        {renderDescription()}
        {renderInfoCard()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {renderEditModal()}
      {renderHoursModal()}
      {renderSocialModal()}
      {renderLocationModal()}
      {renderImagePickerModal()}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  scrollView:     { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:    { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md },

  // ── Cover ──
  coverImageContainer: { height: 200, backgroundColor: Colors.card, position: 'relative' },
  coverImage:     { width: '100%', height: '100%' },
  noCoverImage:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderBottomWidth: 1, borderBottomColor: SECTION_BORDER },
  noImageText:    { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },
  editCoverButton: {
    position: 'absolute', bottom: Spacing.md, right: Spacing.md,
    backgroundColor: Colors.primary, width: 38, height: 38,
    borderRadius: 19, justifyContent: 'center', alignItems: 'center',
    ...Shadows.small,
  },

  // ── Profile row ──
  profileImageOuter: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    marginTop: -30,
  },
  profileImageWrapper: { position: 'relative', marginRight: Spacing.md },
  profileImage:   { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.background },
  noProfileImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Colors.background, backgroundColor: SECTION_BG, justifyContent: 'center', alignItems: 'center' },
  editProfileButton: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: Colors.primary, width: 26, height: 26,
    borderRadius: 13, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.background,
  },
  profileNameBlock: { flex: 1 },
  businessName:   { ...Typography.h3, color: Colors.text, fontWeight: '700', fontSize: 18 },
  verifiedBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  verifiedText:   { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  editInfoButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.primary + '60',
    paddingHorizontal: Spacing.sm, paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  editInfoText:   { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  // ── Description ──
  descriptionCard: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: SECTION_BG, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: SECTION_BORDER,
    padding: Spacing.md,
  },
  descText: { ...Typography.body, color: Colors.textSecondary, lineHeight: 22, fontSize: 14 },

  // ── Info area ──
  infoArea: { paddingHorizontal: Spacing.lg },

  reviewsCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: SECTION_BG, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.warning + '40',
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  reviewsLeft:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reviewsTitle: { ...Typography.body, color: Colors.text, fontWeight: '700' },

  sectionCard: {
    backgroundColor: SECTION_BG, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: SECTION_BORDER,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  sectionCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  sectionIconWrap:   {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.sm,
  },
  sectionCardTitle:  { ...Typography.body, color: Colors.text, fontWeight: '600', flex: 1 },
  sectionCardBody:   { paddingLeft: 38 },
  sectionValueText:  { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  hoursPreviewText:  { fontSize: 13, color: Colors.text, marginBottom: 3 },

  socialIconsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  socialChip: {
    width: 34, height: 34, borderRadius: 8,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  galleryThumb: { width: 64, height: 64, borderRadius: BorderRadius.sm, marginRight: Spacing.sm },
  moreGallery:  { width: 64, height: 64, borderRadius: BorderRadius.sm, backgroundColor: SECTION_BG, justifyContent: 'center', alignItems: 'center' },
  moreGalleryText: { ...Typography.body, color: Colors.text, fontWeight: '700' },

  // ── Modal shell ──
  modalOverlay: {
    flex: 1, backgroundColor: OVERLAY,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: MODAL_BG,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0, borderColor: MODAL_BORDER,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginTop: Spacing.md, marginBottom: Spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
    marginBottom: Spacing.lg,
  },
  modalTitle:   { fontSize: 18, fontWeight: '700', color: Colors.text },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },

  modalActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  cancelBtn: {
    flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  cancelBtnText: { ...Typography.body, color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  saveBtnText: { ...Typography.body, color: Colors.black, fontWeight: '700' },

  // ── Form fields ──
  fieldGroup:   { marginBottom: Spacing.lg },
  fieldLabel:   { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput:   { backgroundColor: INPUT_BG, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: INPUT_BORDER, color: Colors.text, fontSize: 15 },
  fieldInputMulti: { minHeight: 100, textAlignVertical: 'top' },

  readonlyField: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  readonlyText:    { ...Typography.body, color: Colors.textSecondary, flex: 1 },
  readonlyTag:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.sm },
  readonlyTagText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },

  // ── Hours ──
  hoursRow: { marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  hoursRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  dayLabel:    { ...Typography.body, color: Colors.text, fontWeight: '600', width: 40 },
  closedToggle: { paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: BorderRadius.round, borderWidth: 1, borderColor: Colors.primary + '50' },
  closedToggleActive: { backgroundColor: 'rgba(231,76,60,0.15)', borderColor: Colors.danger + '60' },
  closedToggleText:   { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  closedToggleTextActive: { color: Colors.danger },
  timeRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  timeGroup: { flex: 1 },
  timeLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  timeInput: { backgroundColor: INPUT_BG, borderRadius: BorderRadius.sm, padding: Spacing.sm, borderWidth: 1, borderColor: INPUT_BORDER, color: Colors.text, fontSize: 15, textAlign: 'center' },
  timeDash:  { fontSize: 18, color: Colors.textSecondary, paddingBottom: 8 },

  // ── Social ──
  socialFieldHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },

  // ── Location ──
  coordRow:     { flexDirection: 'row', marginBottom: Spacing.md },
  coordLabel:   { fontSize: 11, color: Colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  useLocationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primary + '15', borderWidth: 1, borderColor: Colors.primary + '50',
    padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md,
  },
  useLocationText: { ...Typography.body, color: Colors.primary, fontWeight: '600', fontSize: 14 },
  viewMapBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: Spacing.md,
  },
  viewMapText: { ...Typography.body, color: Colors.black, fontWeight: '700', fontSize: 14 },

  // ── Image picker ──
  imagePickerOverlay: { flex: 1, backgroundColor: OVERLAY, justifyContent: 'flex-end' },
  imagePickerCard: {
    backgroundColor: MODAL_BG,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0, borderColor: MODAL_BORDER,
    padding: Spacing.lg, paddingBottom: 50, alignItems: 'center',
  },
  imagePickerOptions: { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.lg },
  imagePickerOption:  { alignItems: 'center' },
  imagePickerIcon:    { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  imagePickerOptionText: { ...Typography.body, color: Colors.text, fontWeight: '600', fontSize: 14 },
  imagePickerCancelBtn: {
    width: '100%', padding: Spacing.md, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  imagePickerCancelText: { ...Typography.body, color: Colors.textSecondary, fontWeight: '600' },
});

export default BusinessProfile;