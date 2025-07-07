import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch current vendor profile to get isOpen status
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get('/api/food/vendors/profile');
        setIsOpen(data.vendor.isOpen);
      } catch (error) {
        console.error('Failed to load vendor profile:', error);
        Alert.alert('Error', 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Toggle availability (PATCH /availability/toggle)
const handleToggleAvailability = async () => {
  setToggling(true);
  try {
    await axios.patch('/api/food/vendors/availability/toggle', {
      isOpen: !isOpen
    });

    setIsOpen(prev => !prev);
    Alert.alert('Success', `Shop is now ${!isOpen ? 'open' : 'closed'}`);
  } catch (error) {
    console.error('Toggle failed:', error);
    Alert.alert('Error', 'Failed to toggle availability');
  } finally {
    setToggling(false);
  }
};

  // Delete vendor account
  const confirmDelete = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteVendor },
      ]
    );
  };

  const deleteVendor = async () => {
    setDeleting(true);
    try {
      await axios.delete('/api/food/vendors/profile');
      Alert.alert('Account Deleted', 'Your vendor account has been removed.');
      // TODO: Redirect or logout
    } catch (error) {
      console.error('Deletion failed:', error);
      Alert.alert('Error', 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#4caf50" />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Shop Availability</Text>
        <Switch
          value={isOpen}
          onValueChange={handleToggleAvailability}
          disabled={toggling}
        />
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={confirmDelete}
        disabled={deleting}
      >
        <Ionicons name="trash" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.deleteText}>Delete Vendor Account</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  label: { fontSize: 16 },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 16,
  },
});
