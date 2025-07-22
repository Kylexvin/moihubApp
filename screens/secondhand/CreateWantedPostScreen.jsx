import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet, StatusBar } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const categoryOptions = [
  'Electronics',
  'Furniture',
  'Clothing & Accessories',
  'Books & Education',
  'Sports & Recreation',
  'Home & Garden',
  'Vehicles',
  'Health & Beauty',
  'Baby & Kids',
  'Food & Beverages',
  'Services',
  'Other',
].map(c => ({ label: c, value: c }));

const conditionOptions = ['New', 'Like New', 'Good', 'Fair', 'Poor', 'Any'].map(c => ({ label: c, value: c }));

const urgencyOptions = ['Not Urgent', 'Needed Soon', 'Urgent', 'Very Urgent'].map(u => ({ label: u, value: u }));

const CreateWantedPostScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [preferredCondition, setPreferredCondition] = useState('Any');
  const [location, setLocation] = useState('');
  const [urgency, setUrgency] = useState('Not Urgent');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description || !category) {
      Alert.alert('Error', 'Title, description, and category are required');
      return;
    }

    try {
      setLoading(true);
      await axios.post('api/wanted/create', {
        title,
        description,
        category,
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
        preferredCondition,
        location,
        urgency,
      });

      Alert.alert('Success', 'Wanted post created');
      navigation.goBack();
    } catch (err) {
      console.error('Create error:', err);
      Alert.alert('Error', 'Failed to create wanted post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#047857" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Wanted Post</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <TextInput placeholder="Title*" value={title} onChangeText={setTitle} style={styles.input} />

        <TextInput
          placeholder="Description*"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, { height: 100 }]}
          multiline
        />

        <RNPickerSelect
          onValueChange={setCategory}
          items={categoryOptions}
          placeholder={{ label: 'Select Category*', value: null }}
          style={pickerSelectStyles}
          value={category}
        />

        <TextInput
          placeholder="Max Budget (Optional)"
          value={maxBudget}
          onChangeText={setMaxBudget}
          keyboardType="numeric"
          style={styles.input}
        />

        <RNPickerSelect
          onValueChange={setPreferredCondition}
          items={conditionOptions}
          value={preferredCondition}
          placeholder={{}}
          style={pickerSelectStyles}
        />

        <TextInput placeholder="Location (Optional)" value={location} onChangeText={setLocation} style={styles.input} />

        <RNPickerSelect
          onValueChange={setUrgency}
          items={urgencyOptions}
          value={urgency}
          placeholder={{}}
          style={pickerSelectStyles}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.submitButtonText}>{loading ? 'Submitting...' : 'Submit'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CreateWantedPostScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ecfdf5' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#047857', padding: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 16 },
  form: { padding: 16 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  submitButton: { backgroundColor: '#047857', padding: 16, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

const pickerSelectStyles = {
  inputIOS: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
  inputAndroid: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 16 },
};
