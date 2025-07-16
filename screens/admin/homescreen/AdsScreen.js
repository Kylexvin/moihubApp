import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

const AdsScreen = () => {
  const [ads, setAds] = useState([]);
  const [editingAdId, setEditingAdId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    caption: '',
    ctaText: '',
    ctaLink: '',
    order: '',
    phone: ''
  });

  const fetchAds = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/homescreen/my-ads');
      setAds(res.data);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      caption: '',
      ctaText: '',
      ctaLink: '',
      order: '',
      phone: ''
    });
    setSelectedImage(null);
    setEditingAdId(null);
  };

  const selectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (selectedImage) {
      formData.append('image', {
        uri: selectedImage.uri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      });
    }

    try {
      setLoading(true);
      if (editingAdId) {
        await axios.put(`/api/homescreen/my-ads/${editingAdId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Alert.alert('Updated', 'Ad updated successfully');
      } else {
        await axios.post('/api/homescreen/my-ads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Alert.alert('Created', 'Ad created successfully');
      }
      resetForm();
      fetchAds();
    } catch (err) {
      console.error(err.message);
      Alert.alert('Error', 'Failed to save ad');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ad) => {
    setForm({
      title: ad.title,
      caption: ad.caption,
      ctaText: ad.ctaText,
      ctaLink: ad.ctaLink,
      order: String(ad.order),
      phone: '',
    });
    setEditingAdId(ad._id);
    setSelectedImage(null);
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await axios.delete(`/api/homescreen/my-ads/${id}`);
            Alert.alert('Deleted', 'Ad removed');
            fetchAds();
          } catch (err) {
            console.error(err.message);
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  useEffect(() => {
    fetchAds();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Manage Ads</Text>

      {loading && <ActivityIndicator size="large" color="#10B981" />}

      {ads.map((ad) => (
        <View key={ad._id} style={styles.adCard}>
          <Image source={{ uri: ad.imageUrl }} style={styles.image} />
          <Text style={styles.title}>{ad.title}</Text>
          <Text>{ad.caption}</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleEdit(ad)}>
              <Text style={styles.edit}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(ad._id)}>
              <Text style={styles.delete}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Text style={styles.header}>{editingAdId ? 'Edit Ad' : 'Create Ad'}</Text>

      <TextInput style={styles.input} placeholder="Title" value={form.title} onChangeText={(val) => setForm({ ...form, title: val })} />
      <TextInput style={styles.input} placeholder="Caption" value={form.caption} onChangeText={(val) => setForm({ ...form, caption: val })} />
      <TextInput style={styles.input} placeholder="CTA Text" value={form.ctaText} onChangeText={(val) => setForm({ ...form, ctaText: val })} />
      <TextInput style={styles.input} placeholder="CTA Link" value={form.ctaLink} onChangeText={(val) => setForm({ ...form, ctaLink: val })} />
      <TextInput style={styles.input} placeholder="Order" keyboardType="numeric" value={form.order} onChangeText={(val) => setForm({ ...form, order: val })} />
      <TextInput style={styles.input} placeholder="Phone (optional)" value={form.phone} onChangeText={(val) => setForm({ ...form, phone: val })} />

      <TouchableOpacity onPress={selectImage} style={styles.imagePicker}>
        <Text style={styles.imagePickerText}>{selectedImage ? 'Image Selected' : 'Pick Image'}</Text>
      </TouchableOpacity>

      <Button title={editingAdId ? 'Update Ad' : 'Create Ad'} onPress={handleSubmit} disabled={loading} />
    </ScrollView>
  );
};

export default AdsScreen;

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  adCard: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 12 },
  image: { width: '100%', height: 160, borderRadius: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginVertical: 8, padding: 10 },
  imagePicker: { backgroundColor: '#10B981', padding: 12, borderRadius: 8, marginBottom: 10 },
  imagePickerText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  edit: { color: '#3B82F6', fontWeight: 'bold' },
  delete: { color: '#EF4444', fontWeight: 'bold' },
  title: { fontWeight: 'bold', fontSize: 16 },
});
