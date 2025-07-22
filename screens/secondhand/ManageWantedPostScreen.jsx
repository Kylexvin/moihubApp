import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ManageWantedPostScreen = () => {
  const [wantedPosts, setWantedPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const fetchMyWantedPosts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('api/wanted/buyer/my-posts');
      setWantedPosts(data.posts || []);
    } catch (err) {
      console.error('Fetch error:', err);
      Alert.alert('Error', 'Failed to load your wanted posts');
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id) => {
    try {
      await axios.delete(`api/wanted/delete/${id}`);
      setWantedPosts(prev => prev.filter(p => p._id !== id));
      Alert.alert('Success', 'Post deleted');
    } catch (err) {
      console.error('Delete error:', err);
      Alert.alert('Error', 'Failed to delete post');
    }
  };

  const markFulfilled = async (id) => {
    try {
      await axios.put(`api/wanted/fulfilled/${id}`);
      setWantedPosts(prev => prev.map(p => p._id === id ? { ...p, status: 'fulfilled' } : p));
      Alert.alert('Success', 'Marked as fulfilled');
    } catch (err) {
      console.error('Fulfill error:', err);
      Alert.alert('Error', 'Failed to mark as fulfilled');
    }
  };

  useEffect(() => {
    fetchMyWantedPosts();
  }, []);

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postMeta}>Budget: Ksh {item.maxBudget?.toLocaleString() || 'N/A'} | {item.urgency}</Text>
      <Text style={styles.postMeta}>Status: {item.status}</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={() => markFulfilled(item._id)} style={styles.actionButton}>
          <Ionicons name="checkmark-done" size={18} color="#fff" />
          <Text style={styles.actionText}>Fulfilled</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => deletePost(item._id)} style={[styles.actionButton, { backgroundColor: '#dc2626' }]}>
          <Ionicons name="trash" size={18} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#047857" barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage My Wanted Posts</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateWantedPost')} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#047857" style={{ marginTop: 30 }} />
      ) : wantedPosts.length ? (
        <FlatList
          data={wantedPosts}
          keyExtractor={(item) => item._id}
          renderItem={renderPost}
          contentContainerStyle={{ padding: 16 }}
        />
      ) : (
        <Text style={styles.emptyText}>You have no active wanted posts.</Text>
      )}
    </View>
  );
};

export default ManageWantedPostScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ecfdf5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#047857' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  addButton: { backgroundColor: '#059669', padding: 8, borderRadius: 6 },

  postCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  postTitle: { fontSize: 18, fontWeight: 'bold', color: '#047857' },
  postMeta: { color: '#475569', marginTop: 4 },

  actionsRow: { flexDirection: 'row', marginTop: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#047857', padding: 8, borderRadius: 6, marginRight: 8 },
  actionText: { color: '#fff', marginLeft: 6 },

  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#475569' },
});
