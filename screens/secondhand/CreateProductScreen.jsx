import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import axios from 'axios'; // Your authorized axios instance
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';

const CATEGORY_OPTIONS = [
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Furniture', value: 'Furniture' },
  { label: 'Clothing & Accessories', value: 'Clothing & Accessories' },
  { label: 'Books & Education', value: 'Books & Education' },
  { label: 'Sports & Recreation', value: 'Sports & Recreation' },
  { label: 'Home & Garden', value: 'Home & Garden' },  
  { label: 'Health & Beauty', value: 'Health & Beauty' },  
  { label: 'Food & Beverages', value: 'Food & Beverages' },
  { label: 'Services', value: 'Services' },
  { label: 'Other', value: 'Other' },
];

const CreateProductScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('Good');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!name || !price || !description || !category || !image) {
      Alert.alert('Validation Error', 'Please fill all required fields and select an image.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();

      formData.append('name', name);
      formData.append('price', price);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('condition', condition);
      formData.append('location', location);
      formData.append('tags', tags);
      formData.append('isNegotiable', isNegotiable);
      formData.append('image', {
        uri: image.uri,
        name: 'product.jpg',
        type: 'image/jpeg',
      });

      await axios.post('api/marketplace/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Product created successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload product.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create New Product</Text>

      <TextInput placeholder="Product Name *" style={styles.input} value={name} onChangeText={setName} />
      <TextInput placeholder="Price (KES) *" style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />
      <TextInput placeholder="Description *" style={styles.input} value={description} onChangeText={setDescription} multiline />

      <RNPickerSelect
        onValueChange={setCategory}
        value={category}
        items={CATEGORY_OPTIONS}
        placeholder={{ label: 'Select Category *', value: null }}
        style={{
          inputIOS: styles.input,
          inputAndroid: styles.input,
        }}
      />

      <TextInput placeholder="Condition" style={styles.input} value={condition} onChangeText={setCondition} />
      <TextInput placeholder="Location" style={styles.input} value={location} onChangeText={setLocation} />
      <TextInput placeholder="Tags (comma separated)" style={styles.input} value={tags} onChangeText={setTags} />

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {image ? <Image source={{ uri: image.uri }} style={styles.image} /> : <Text>Select Product Image *</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={uploading}>
        <Text style={styles.submitButtonText}>{uploading ? 'Uploading...' : 'Submit Product'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CreateProductScreen;

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginVertical: 8 },
  imagePicker: { height: 150, borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginVertical: 10, borderRadius: 8 },
  image: { width: '100%', height: '100%', borderRadius: 8 },
  submitButton: { backgroundColor: '#4b0082', padding: 14, borderRadius: 8, marginVertical: 10 },
  submitButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  backButton: { backgroundColor: '#888', padding: 12, borderRadius: 8, marginVertical: 5 },
  backButtonText: { color: '#fff', textAlign: 'center' },
});
