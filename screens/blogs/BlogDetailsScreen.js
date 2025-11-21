import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const BlogDetailsScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const [blog, setBlog] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const { currentUser, token } = useAuth();

  // Create axios instance with auth header
  const apiClient = axios.create({
    baseURL: 'https://moihub.onrender.com/api',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const fetchBlog = async () => {
    try {
      const res = await apiClient.get(`/posts/${id}`);
      setBlog(res.data.post);
      setLikesCount(res.data.post.likes?.length || 0);
      setLiked(res.data.post.likes?.includes(currentUser?._id));
    } catch (error) {
      console.error('Failed to load blog:', error);
      Alert.alert('Error', 'Failed to load blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlog();
  }, []);

  const handleLike = async () => {
    if (!currentUser) {
      Alert.alert('Authentication Required', 'Please log in to like posts.');
      return;
    }

    const newLikedState = !liked;
    
    // Optimistic update
    setLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

    try {
      const response = await apiClient.post(`/posts/${id}/like`, {
        liked: newLikedState
      });

      // Update with actual server response
      setLikesCount(response.data.likeCount);
      setLiked(response.data.liked);
    } catch (error) {
      console.error('Failed to like post:', error);
      // Revert optimistic update on error
      setLiked(!newLikedState);
      setLikesCount(prev => newLikedState ? prev - 1 : prev + 1);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this amazing blog post: "${blog.title}" - ${blog.excerpt}`,
        title: blog.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleComment = async () => {
    if (!currentUser) {
      Alert.alert('Authentication Required', 'Please log in to comment.');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Empty Comment', 'Please write something before posting.');
      return;
    }

    setCommentLoading(true);
    try {
      const response = await apiClient.post(`/posts/${id}/comment`, {
        text: comment.trim()
      });

      // Update the blog state with new comments
      setBlog(prevBlog => ({
        ...prevBlog,
        comments: response.data // Backend returns populated comments
      }));

      setComment('');
      Alert.alert('Success', 'Your comment has been posted!');
    } catch (error) {
      console.error('Failed to comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setCommentLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatCommentDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const renderContentBlock = (block, index) => {
    switch (block.type) {
      case 'header':
        return (
          <Text key={block._id || index} style={styles.headerText}>
            {block.text}
          </Text>
        );
      
      case 'paragraph':
        return (
          <Text key={block._id || index} style={styles.contentText}>
            {block.text}
          </Text>
        );
      
      case 'image':
        return (
          <View key={block._id || index} style={styles.imageBlock}>
            <Image source={{ uri: block.src }} style={styles.contentImage} />
            {block.caption && (
              <Text style={styles.imageCaption}>{block.caption}</Text>
            )}
          </View>
        );
      
      case 'list':
        return (
          <View key={block._id || index} style={styles.listBlock}>
            {block.items?.map((item, itemIndex) => (
              <Text key={itemIndex} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
        );
      
      default:
        return (
          <Text key={block._id || index} style={styles.contentText}>
            {block.text}
          </Text>
        );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading article...</Text>
      </View>
    );
  }

  if (!blog) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Article not found</Text>
        <Text style={styles.errorText}>This article may have been removed or doesn't exist.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: blog.image }} style={styles.image} />
          <View style={styles.imageOverlay}>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>{blog.category}</Text>
            </View>
          </View>
        </View>

        {/* Article Content */}
        <View style={styles.contentContainer}>
          {/* Title and Meta */}
          <Text style={styles.title}>{blog.title}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.authorContainer}>
              <View style={styles.authorAvatar}>
                <Text style={styles.authorInitial}>
                  {blog.author?.username?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.authorName}>by {blog.author?.username}</Text>
                <Text style={styles.date}>{formatDate(blog.date)}</Text>
              </View>
            </View>
            
            <View style={styles.readTimeContainer}>
              <Text style={styles.readTime}>📖 {blog.readTime} min read</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionBar}>
            <TouchableOpacity 
              style={[styles.actionButton, liked && styles.likedButton]} 
              onPress={handleLike}
            >
              <Text style={[styles.actionButtonText, liked && styles.likedButtonText]}>
                {liked ? '❤️' : '🤍'} {likesCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Text style={styles.actionButtonText}>📤 Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>🔖 Save</Text>
            </TouchableOpacity>
          </View>

          {/* Article Content */}
          <View style={styles.articleContent}>
            {blog.content?.map((block, index) => renderContentBlock(block, index))}
          </View>

          {/* Comments Section */}
          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>
              💬 Comments ({blog.comments?.length || 0})
            </Text>

            {/* Comment Input */}
            {currentUser && (
              <View style={styles.commentInputContainer}>
                <View style={styles.commentInputWrapper}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userInitial}>
                      {currentUser.username?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                  <TextInput
                    placeholder="Share your thoughts..."
                    value={comment}
                    onChangeText={setComment}
                    style={styles.commentInput}
                    multiline
                    maxLength={500}
                    editable={!commentLoading}
                  />
                </View>
                <View style={styles.commentActions}>
                  <Text style={styles.characterCount}>{comment.length}/500</Text>
                  <TouchableOpacity 
                    style={[styles.postButton, (!comment.trim() || commentLoading) && styles.disabledButton]} 
                    onPress={handleComment}
                    disabled={!comment.trim() || commentLoading}
                  >
                    {commentLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.postButtonText}>Post</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Login prompt for non-authenticated users */}
            {!currentUser && (
              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>
                  Please log in to like posts and leave comments.
                </Text>
                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Comments List */}
            <View style={styles.commentsList}>
              {blog.comments?.length > 0 ? (
                blog.comments.map((c, index) => (
                  <View key={c._id || index} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarText}>
                          {c.user?.username?.charAt(0)?.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentUser}>{c.user?.username}</Text>
                        <Text style={styles.commentDate}>
                          {formatCommentDate(c.createdAt || c.date)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.noComments}>
                  <Text style={styles.noCommentsText}>
                    No comments yet. Be the first to share your thoughts!
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    height: 250,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 36,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  readTimeContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  readTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  likedButton: {
    backgroundColor: '#ffebee',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  likedButtonText: {
    color: '#e91e63',
  },
  articleContent: {
    marginBottom: 32,
  },
  // Content block styles
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
    lineHeight: 28,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    marginBottom: 16,
    textAlign: 'justify',
  },
  imageBlock: {
    marginVertical: 16,
    alignItems: 'center',
  },
  contentImage: {
    width: width - 40,
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  imageCaption: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  listBlock: {
    marginVertical: 12,
    paddingLeft: 16,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 8,
  },
  commentSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  commentInputContainer: {
    marginBottom: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userInitial: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 14,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 42,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
  },
  postButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loginPrompt: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginPromptText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  commentsList: {
    marginTop: 8,
  },
  commentItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentAvatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  commentMeta: {
    flex: 1,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default BlogDetailsScreen;