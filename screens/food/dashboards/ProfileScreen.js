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
  Platform
} from 'react-native';
import axios from 'axios';

const baseURL = Platform.OS === 'ios'
  ? 'http://localhost:5000'
  : 'https://moihub.onrender.com';

const VendorProfileScreen = () => {
  const [vendor, setVendor] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const res = await axios.get(`${baseURL}/api/food/vendors/profile`);
      const data = res.data.vendor;
      setVendor(data);
      setForm({
        shopName: data.shopName || '',
        phone: data.phone || '',
        location: data.location || '',
        description: data.description || ''
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
      Alert.alert('Success', 'Profile updated');
    } catch (err) {
      console.error('Save profile error:', err);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Vendor Profile</Text>

      <Text style={styles.label}>Shop Name</Text>
      <TextInput
        style={styles.input}
        editable={editing}
        value={form.shopName}
        onChangeText={(text) => handleChange('shopName', text)}
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        editable={editing}
        keyboardType="phone-pad"
        value={form.phone}
        onChangeText={(text) => handleChange('phone', text)}
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        editable={editing}
        value={form.location}
        onChangeText={(text) => handleChange('location', text)}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        multiline
        editable={editing}
        value={form.description}
        onChangeText={(text) => handleChange('description', text)}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: editing ? '#4caf50' : '#2196f3' }]}
        onPress={editing ? handleSave : () => setEditing(true)}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? 'Saving...' : editing ? 'Save Profile' : 'Edit Profile'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  label: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 5
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    fontSize: 16
  },
  button: {
    marginTop: 30,
    padding: 15,
    borderRadius: 8
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default VendorProfileScreen;
