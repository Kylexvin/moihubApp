import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';

const MissionScreen = () => {
  const [mission, setMission] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);

  const fetchMission = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/homescreen/todays-mission');
      setMission(res.data);

      if (res.data) {
        setForm({
          title: res.data.title || '',
          content: res.data.content || '',
        });
      }
    } catch (err) {
      console.error(err.message);
      Alert.alert('Error', 'Failed to fetch mission');
    } finally {
      setLoading(false);
    }
  };

  const saveMission = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('Validation Error', 'Title and Content are required.');
      return;
    }

    try {
      setLoading(true);
      if (mission && mission._id) {
        await axios.put(`/api/homescreen/todays-mission/${mission._id}`, form);
        Alert.alert('Success', 'Mission updated successfully');
      } else {
        await axios.post('/api/homescreen/todays-mission', form);
        Alert.alert('Success', 'Mission created successfully');
      }
      fetchMission();
    } catch (err) {
      console.error(err.message);
      Alert.alert('Error', 'Failed to save mission');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMission();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Today's Mission</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#10B981" />
      ) : (
        <>
          {mission && (
            <View style={styles.preview}>
              <Text style={styles.previewTitle}>{mission.title}</Text>
              <Text style={styles.previewContent}>{mission.content}</Text>
            </View>
          )}

          <TextInput
            placeholder="Title"
            style={styles.input}
            value={form.title}
            onChangeText={(val) => setForm({ ...form, title: val })}
          />
          <TextInput
            placeholder="Content"
            style={[styles.input, { height: 100 }]}
            multiline
            value={form.content}
            onChangeText={(val) => setForm({ ...form, content: val })}
          />
          <Button title="Save Mission" onPress={saveMission} />
        </>
      )}
    </View>
  );
};

export default MissionScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  preview: {
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewContent: {
    fontSize: 14,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
});
