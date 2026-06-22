import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const WriterDashboardScreen = () => {
  const { currentUser } = useAuth();
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const response = await axios.get('/api/posts/user/posts?limit=50');
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const deletePost = (postId) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`/api/posts/${postId}`);
            fetchPosts();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete post');
          }
        },
      },
    ]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const StatCard = ({ label, value, color }) => (
    <View style={[styles.statCard, { borderColor: color + '40' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={styles.postCard}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />
      )}

      <View style={styles.postBody}>
        <View style={styles.postHeader}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>

        <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>

        <Text style={styles.postExcerpt} numberOfLines={2}>
          {item.excerpt || item.content?.[0]?.text?.substring(0, 100) || 'No description'}
        </Text>

        <View style={styles.postFooter}>
          <View style={styles.postStats}>
            <View style={styles.stat}>
              <Ionicons name="calendar-outline" size={12} color="#666" />
              <Text style={styles.statText}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="heart-outline" size={12} color="#666" />
              <Text style={styles.statText}>{item.likes?.length || 0}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="chatbubble-outline" size={12} color="#666" />
              <Text style={styles.statText}>{item.comments?.length || 0}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() =>
              Alert.alert('Post Options', '', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Edit',
                  onPress: () => navigation.navigate('CreatePost', { postId: item._id }),
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deletePost(item._id),
                },
              ])
            }
          >
            <Ionicons name="ellipsis-vertical" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c7ce7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Posts" value={posts.length} color="#6c7ce7" />
        <StatCard
          label="Likes"
          value={posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0)}
          color="#ff3366"
        />
        <StatCard
          label="Comments"
          value={posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0)}
          color="#4CAF50"
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPost}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c7ce7" />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>No posts yet</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('CreatePost')}
            >
              <Text style={styles.emptyButtonText}>Create your first post</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  postImage: {
    width: '100%',
    height: 160,
  },
  postBody: {
    padding: 14,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: '#6c7ce720',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6c7ce740',
  },
  categoryText: {
    fontSize: 11,
    color: '#6c7ce7',
    fontWeight: '600',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
    lineHeight: 22,
  },
  postExcerpt: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  menuButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    color: '#444',
    fontWeight: '600',
  },
  emptyButton: {
    marginTop: 8,
    backgroundColor: '#6c7ce7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6c7ce7',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#6c7ce7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

export default WriterDashboardScreen;