import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const PostDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params;
  const { currentUser, token } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/posts/${postId}`);
      if (response.data.success) {
        const data = response.data.post;
        
        // Fix: Process image URLs in content
        if (data.content) {
          data.content = data.content.map(block => {
            if (block.type === 'image' && block.src) {
              // If it's a relative path (starts with 'uploads/' or doesn't start with 'http')
              if (!block.src.startsWith('http') && !block.src.startsWith('data:')) {
                // Get the base URL from your backend
                // If your images are served from the same domain, just use the path directly
                // For local development with expo, you might need the full URL
                block.src = block.src.startsWith('/') ? block.src : `/${block.src}`;
              }
            }
            return block;
          });
        }
        
        setPost(data);
        setLikeCount(data.likes?.length || 0);
        setLiked(data.likes?.includes(currentUser?._id));
        setComments(data.comments || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load post');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [postId, currentUser?._id, navigation]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  useLayoutEffect(() => {
    // Fix: Handle both object and string author
    const authorId = post?.author?._id?.toString() || post?.author?.toString();
    const userId = currentUser?._id?.toString();
    
    if (authorId && userId && authorId === userId) {
      navigation.setOptions({
        headerRight: () => (
          <View style={{ flexDirection: 'row', gap: 16, marginRight: 16 }}>
            <TouchableOpacity onPress={() => navigation.navigate('CreatePost', { postId })}>
              <Ionicons name="pencil-outline" size={22} color="#6c7ce7" />
            </TouchableOpacity>
            <TouchableOpacity onPress={deletePost}>
              <Ionicons name="trash-outline" size={22} color="#ff3366" />
            </TouchableOpacity>
          </View>
        ),
      });
    }
  }, [post, currentUser, navigation, postId]);

  const handleLike = useCallback(async () => {
    try {
      const response = await axios.post(`/api/posts/${postId}/like`, { liked: !liked });
      if (response.data.success) {
        setLiked(!liked);
        setLikeCount(response.data.likeCount);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to like post');
    }
  }, [postId, liked]);

  const handleComment = useCallback(async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const response = await axios.post(`/api/posts/${postId}/comment`, {
        text: commentText.trim(),
      });
      if (response.data.success) {
        setComments(response.data.comments);
        setCommentText('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }, [postId, commentText]);

  const deletePost = useCallback(() => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`/api/posts/${postId}`);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete post');
          }
        },
      },
    ]);
  }, [postId, navigation]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return ''; }
  }, []);

  const formatTimeAgo = useCallback((dateString) => {
    if (!dateString) return 'Just now';
    try {
      const diffMs = new Date() - new Date(dateString);
      const mins = Math.floor(diffMs / 60000);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    } catch { return 'Just now'; }
  }, []);

  const renderContentBlock = useCallback((block, index) => {
    switch (block.type) {
      case 'paragraph':
        return <Text key={index} style={styles.paragraph}>{block.text}</Text>;
      case 'header':
        return <Text key={index} style={styles.contentHeader}>{block.text}</Text>;
      case 'image':
        // Fix: Use the processed image URL
        const imageUrl = block.src;
        if (!imageUrl) return null;
        
        return (
          <View key={index} style={styles.contentImageContainer}>
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.contentImage} 
              resizeMode="cover"
            />
            {block.caption ? <Text style={styles.imageCaption}>{block.caption}</Text> : null}
          </View>
        );
      case 'list':
        return (
          <View key={index} style={styles.listContainer}>
            {block.items?.map((item, i) => (
              <View key={i} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c7ce7" />
      </View>
    );
  }

  if (!post) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Featured Image */}
        {post.image && (
          <Image source={{ uri: post.image }} style={styles.featuredImage} resizeMode="cover" />
        )}

        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{post.category}</Text>
          </View>

          <Text style={styles.title}>{post.title}</Text>

          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Ionicons name="person-circle-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{post.author?.username || 'Unknown'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{formatDate(post.date || post.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentSection}>
          {post.content?.map((block, index) => renderContentBlock(block, index))}
        </View>

        {/* Like */}
        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? '#ff3366' : '#666'} />
          <Text style={[styles.likeText, liked && { color: '#ff3366' }]}>
            {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
          </Text>
        </TouchableOpacity>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor="#444"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleComment} disabled={submitting}>
              {submitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="send" size={18} color="#fff" />
              }
            </TouchableOpacity>
          </View>

          {comments.length === 0 ? (
            <View style={styles.noComments}>
              <Ionicons name="chatbubble-outline" size={32} color="#333" />
              <Text style={styles.noCommentsText}>No comments yet</Text>
            </View>
          ) : (
            comments.map((comment, index) => (
              <View key={comment._id || index} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Ionicons name="person-circle" size={30} color="#333" />
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentAuthor}>{comment.user?.username || 'Anonymous'}</Text>
                    <Text style={styles.commentDate}>{formatTimeAgo(comment.date || comment.createdAt)}</Text>
                  </View>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  scrollContent: { paddingBottom: 40 },
  featuredImage: { width: '100%', height: 220 },
  postHeader: { padding: 20 },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#6c7ce720',
    borderWidth: 1,
    borderColor: '#6c7ce740',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryText: { fontSize: 12, color: '#6c7ce7', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', lineHeight: 32, marginBottom: 16 },
  meta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: '#666' },
  contentSection: { paddingHorizontal: 20 },
  paragraph: { fontSize: 15, color: '#ccc', lineHeight: 26, marginBottom: 16 },
  contentHeader: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 12, marginTop: 8 },
  contentImageContainer: { marginBottom: 16, borderRadius: 12, overflow: 'hidden' },
  contentImage: { width: '100%', height: 200 },
  imageCaption: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 6 },
  listContainer: { marginBottom: 16 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6c7ce7', marginTop: 8 },
  listText: { flex: 1, fontSize: 15, color: '#ccc', lineHeight: 22 },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  likeText: { fontSize: 15, color: '#666', fontWeight: '600' },
  commentsSection: { paddingHorizontal: 20 },
  commentsTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  commentInputRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  commentInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6c7ce7',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  noComments: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  noCommentsText: { fontSize: 14, color: '#444' },
  commentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  commentMeta: { flex: 1 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#fff' },
  commentDate: { fontSize: 11, color: '#666', marginTop: 2 },
  commentText: { fontSize: 14, color: '#ccc', lineHeight: 20 },
});

export default PostDetailScreen;