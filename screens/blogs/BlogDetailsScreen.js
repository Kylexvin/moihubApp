// screens/blogs/BlogDetailsScreen.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  StatusBar,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import BlogDbService from '../../services/BlogDbService';

const { width } = Dimensions.get('window');

const BlogColors = {
  primary: '#187013',
  secondary: '#187013',
  accent: '#4ECDC4',
  background: '#0A0A0A',
  surface: '#1A1A1A',
  card: '#242424',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#757575',
  border: '#333333',
  like: '#FF0000',
};

const parseContent = (content) => {
  if (!content) return [];
  if (Array.isArray(content)) return content;
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return [{ type: 'paragraph', text: content }];
    }
  }
  if (typeof content === 'object' && content.content) {
    return parseContent(content.content);
  }
  return [];
};

const normalizeBlog = (blog) => {
  if (!blog) return null;
  
  return {
    ...blog,
    _id: blog._id || blog.id,
    id: blog._id || blog.id,
    title: blog.title || 'Untitled',
    excerpt: blog.excerpt || '',
    content: parseContent(blog.content),
    image: blog.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400',
    category: blog.category || 'General',
    readTime: blog.readTime || 5,
    date: blog.date || blog.createdAt || new Date().toISOString(),
    author: blog.author || { username: blog.authorName || 'Unknown' },
    likes: blog.likes || [],
    comments: blog.comments || [],
    saved: blog.saved || false,
  };
};

const BlogDetailsScreen = ({ route, navigation }) => {
  const { id } = route.params;
  
  const [blog, setBlog] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const { currentUser, token } = useAuth();
  
  const fetchedRef = useRef(false);

  const getUserId = () => currentUser?._id || currentUser?.id || currentUser?.userId;
  const getUsername = () => currentUser?.username || currentUser?.name || currentUser?.displayName || 'You';

  useEffect(() => {
    const initDb = async () => {
      try {
        await BlogDbService.init();
        setDbInitialized(true);
      } catch (error) {
        console.error('❌ Blog DB init failed:', error);
        setDbInitialized(false);
      }
    };
    initDb();
  }, []);

  const fetchBlog = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    setLoading(true);

    try {
      if (dbInitialized) {
        const localBlog = await BlogDbService.getBlog(id);
        if (localBlog) {
          const normalized = normalizeBlog(localBlog);
          setBlog(normalized);
          setLikesCount(normalized.likes?.length || 0);
          setLiked(normalized.likes?.includes(getUserId()));
          setSaved(normalized.saved || false);
          setLoading(false);
        }
      }

      if (token) {
        const res = await axios.get(`api/posts/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const serverBlog = res.data.post;

        if (serverBlog) {
          const normalized = normalizeBlog(serverBlog);
          
          if (dbInitialized) {
            await BlogDbService.saveBlog(serverBlog);
          }

          setBlog(normalized);
          setLikesCount(normalized.likes?.length || 0);
          setLiked(normalized.likes?.includes(getUserId()));
          setSaved(normalized.saved || false);
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch blog:', error);
      if (!blog) {
        Alert.alert('Error', 'Failed to load blog post. Please try again.');
        setLoading(false);
      }
    }
  }, [id, token, dbInitialized]);

  useEffect(() => {
    if (dbInitialized && !fetchedRef.current) {
      fetchBlog();
    }
  }, [dbInitialized, fetchBlog]);

  const handleLike = async () => {
    if (!currentUser) {
      Alert.alert('Authentication Required', 'Please log in to like posts.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

    try {
      const response = await axios.post(`api/posts/${id}/like`, {
        liked: newLikedState
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLikesCount(response.data.likeCount);
      setLiked(response.data.liked);

      if (dbInitialized && blog) {
        const updatedBlog = {
          ...blog,
          likes: response.data.liked 
            ? [...(blog.likes || []), getUserId()]
            : (blog.likes || []).filter(uid => uid !== getUserId())
        };
        await BlogDbService.saveBlog(updatedBlog);
      }
    } catch (error) {
      console.error('Failed to like post:', error);
      setLiked(!newLikedState);
      setLikesCount(prev => newLikedState ? prev - 1 : prev + 1);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      const blogUrl = `https://moihub-silk.vercel.app/blog/${blog._id}`;
      await Share.share({
        message: `Check out this amazing blog post: "${blog.title}" - ${blog.excerpt}\n\nRead more at: ${blogUrl}`,
        title: blog.title,
        url: blogUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      Alert.alert('Authentication Required', 'Please log in to save posts.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newSavedState = !saved;
    setSaved(newSavedState);

    if (dbInitialized && blog) {
      const result = await BlogDbService.toggleSaved(id, getUserId());
      setSaved(result.saved);
    }

    Alert.alert(
      saved ? 'Removed' : 'Saved',
      saved ? 'Article removed from your reading list' : 'Article saved to your reading list'
    );
  };

  const canEditComment = (commentCreatedAt) => {
    const commentDate = new Date(commentCreatedAt);
    const now = new Date();
    const diffMinutes = (now - commentDate) / (1000 * 60);
    return diffMinutes <= 5;
  };

  const handleEditComment = (comment) => {
    if (!canEditComment(comment.createdAt)) {
      Alert.alert('Edit Time Expired', 'You can only edit comments within 5 minutes of posting.');
      return;
    }
    setEditingComment(comment);
    setEditText(comment.text);
    setModalVisible(true);
  };

  const submitEditComment = async () => {
    if (!editText.trim()) {
      Alert.alert('Empty Comment', 'Comment cannot be empty.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const originalComments = [...blog.comments];
    const updatedText = editText.trim();

    setBlog(prevBlog => ({
      ...prevBlog,
      comments: prevBlog.comments.map(c =>
        c._id === editingComment._id ? { ...c, text: updatedText } : c
      )
    }));
    setModalVisible(false);
    setEditingComment(null);
    setEditText('');

    try {
      await axios.put(`api/posts/${id}/comments/${editingComment._id}`, {
        text: updatedText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (dbInitialized && blog) {
        const updatedBlog = {
          ...blog,
          comments: blog.comments.map(c =>
            c._id === editingComment._id ? { ...c, text: updatedText } : c
          )
        };
        await BlogDbService.saveBlog(updatedBlog);
      }

    } catch (error) {
      console.error('Failed to edit comment:', error);
      setBlog(prevBlog => ({
        ...prevBlog,
        comments: originalComments
      }));
      Alert.alert('Error', 'Failed to edit comment. Please try again.');
    }
  };

  const handleDeleteComment = (comment) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

            const originalComments = [...blog.comments];

            setBlog(prevBlog => ({
              ...prevBlog,
              comments: prevBlog.comments.filter(c => c._id !== comment._id)
            }));

            try {
              await axios.delete(`api/posts/${id}/comments/${comment._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });

              if (dbInitialized && blog) {
                const updatedBlog = {
                  ...blog,
                  comments: blog.comments.filter(c => c._id !== comment._id)
                };
                await BlogDbService.saveBlog(updatedBlog);
              }

            } catch (error) {
              console.error('Failed to delete comment:', error);
              setBlog(prevBlog => ({
                ...prevBlog,
                comments: originalComments
              }));
              Alert.alert('Error', 'Failed to delete comment. Please try again.');
            }
          }
        }
      ]
    );
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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const commentText = comment.trim();
    const userId = getUserId();
    const username = getUsername();
    
    // Generate a unique temp ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Create temp comment with user's info - INSTANT UI
    const tempComment = {
      _id: tempId,
      text: commentText,
      createdAt: new Date().toISOString(),
      user: {
        _id: userId,
        username: username,
        avatar: currentUser?.avatar || '',
      },
      isTemp: true, // Mark as temporary - prevents edit/delete
    };

    // Store current comments for rollback
    const originalComments = [...(blog?.comments || [])];
    
    // Clear input and show loading
    setComment('');
    setCommentLoading(true);
    
    // Add temp comment to UI - INSTANT VISUAL FEEDBACK
    setBlog(prevBlog => ({
      ...prevBlog,
      comments: [tempComment, ...(prevBlog?.comments || [])]
    }));

    try {
      const response = await axios.post(`api/posts/${id}/comment`, {
        text: commentText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Get the real comment from response
      let realComment = response.data.comment || response.data;
      if (Array.isArray(realComment)) {
        realComment = realComment[0];
      }

      // Ensure the real comment has proper user data
      if (realComment && !realComment.user) {
        realComment.user = {
          _id: realComment.userId || userId,
          username: realComment.username || username,
          avatar: realComment.avatar || currentUser?.avatar || '',
        };
      }

      // Remove isTemp flag if it exists
      if (realComment && realComment.isTemp) {
        delete realComment.isTemp;
      }

      // Replace temp comment with real comment - NO DUPLICATES
      setBlog(prevBlog => {
        // Filter out ALL comments with the temp ID (safety measure)
        const filteredComments = prevBlog.comments.filter(c => c._id !== tempId);
        // Add the real comment at the top
        return {
          ...prevBlog,
          comments: [realComment, ...filteredComments]
        };
      });

      // Update DB with the real comment
      if (dbInitialized && blog) {
        const updatedBlog = {
          ...blog,
          comments: [realComment, ...originalComments]
        };
        await BlogDbService.saveBlog(updatedBlog);
      }

    } catch (error) {
      console.error('Failed to comment:', error);
      // Rollback - remove temp comment
      setBlog(prevBlog => ({
        ...prevBlog,
        comments: prevBlog.comments.filter(c => c._id !== tempId)
      }));
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setCommentLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatCommentDate = (dateString) => {
    if (!dateString) return 'Just now';
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
    if (!block) return null;
    
    switch (block.type) {
      case 'header':
        return (
          <Animatable.View key={block._id || `header_${index}`} animation="fadeInUp" delay={index * 100}>
            <Text style={styles.headerText}>{block.text}</Text>
          </Animatable.View>
        );
      
      case 'paragraph':
        return (
          <Animatable.View key={block._id || `paragraph_${index}`} animation="fadeInUp" delay={index * 100}>
            <Text style={styles.contentText}>{block.text}</Text>
          </Animatable.View>
        );
      
      case 'image':
        return (
          <Animatable.View key={block._id || `image_${index}`} animation="fadeInUp" delay={index * 100} style={styles.imageBlock}>
            <Image source={{ uri: block.src }} style={styles.contentImage} />
            {block.caption && (
              <Text style={styles.imageCaption}>{block.caption}</Text>
            )}
          </Animatable.View>
        );
      
      case 'list':
        return (
          <Animatable.View key={block._id || `list_${index}`} animation="fadeInUp" delay={index * 100} style={styles.listBlock}>
            {block.items?.map((item, itemIndex) => (
              <View key={`${block._id || index}_item_${itemIndex}`} style={styles.listItemContainer}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listItem}>{item}</Text>
              </View>
            ))}
          </Animatable.View>
        );
      
      default:
        if (block.text) {
          return (
            <Animatable.View key={block._id || `default_${index}`} animation="fadeInUp" delay={index * 100}>
              <Text style={styles.contentText}>{block.text}</Text>
            </Animatable.View>
          );
        }
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={BlogColors.background} />
        <LinearGradient
          colors={[BlogColors.background, BlogColors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <Animatable.View animation="pulse" iterationCount="infinite">
            <View style={styles.loadingIcon}>
              <Icon name="auto-stories" size={60} color={BlogColors.primary} />
            </View>
          </Animatable.View>
          <ActivityIndicator size="large" color={BlogColors.primary} />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      </View>
    );
  }

  if (!blog) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[BlogColors.background, BlogColors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Icon name="error-outline" size={60} color={BlogColors.primary} />
          </View>
          <Text style={styles.errorTitle}>Article not found</Text>
          <Text style={styles.errorText}>This article may have been removed or doesn't exist.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <LinearGradient
              colors={[BlogColors.primary, BlogColors.secondary]}
              style={styles.backButtonGradient}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BlogColors.background} />
      
      <LinearGradient
        colors={[BlogColors.background, BlogColors.surface]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.floatingIcons}>
        <Text style={[styles.floatingIcon, styles.icon1]}>📚</Text>
        <Text style={[styles.floatingIcon, styles.icon2]}>✍️</Text>
        <Text style={[styles.floatingIcon, styles.icon3]}>📖</Text>
        <Text style={[styles.floatingIcon, styles.icon4]}>📝</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animatable.View animation="fadeInDown" duration={800} style={styles.imageContainer}>
          <Image source={{ uri: blog.image }} style={styles.image} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.imageOverlay}
          >
            <View style={styles.categoryContainer}>
              <LinearGradient
                colors={[BlogColors.primary, BlogColors.secondary]}
                style={styles.categoryBadge}
              >
                <Text style={styles.categoryText}>{blog.category || 'General'}</Text>
              </LinearGradient>
            </View>
          </LinearGradient>
        </Animatable.View>

        <View style={styles.contentContainer}>
          <Animatable.View animation="fadeInUp" delay={200}>
            <Text style={styles.title}>{blog.title}</Text>
          </Animatable.View>
          
          <Animatable.View animation="fadeInUp" delay={300} style={styles.metaContainer}>
            <View style={styles.authorContainer}>
              <LinearGradient
                colors={[BlogColors.primary, BlogColors.secondary]}
                style={styles.authorAvatar}
              >
                <Text style={styles.authorInitial}>
                  {blog.author?.username?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
              <View>
                <Text style={styles.authorName}>{blog.author?.username || 'Unknown'}</Text>
                <Text style={styles.date}>{formatDate(blog.date)}</Text>
              </View>
            </View>
            
            <View style={styles.readTimeContainer}>
              <Icon name="access-time" size={16} color={BlogColors.accent} />
              <Text style={styles.readTime}>{blog.readTime || 5} min read</Text>
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeInUp" delay={400} style={styles.actionBar}>
            <TouchableOpacity 
              style={[styles.actionButton, liked && styles.likedButton]} 
              onPress={handleLike}
            >
              <LinearGradient
                colors={liked ? [BlogColors.like, '#CC0000'] : [BlogColors.card, BlogColors.surface]}
                style={styles.actionGradient}
              >
                <Icon 
                  name={liked ? "favorite" : "favorite-border"} 
                  size={20} 
                  color={liked ? '#fff' : BlogColors.textSecondary} 
                />
                <Text style={[styles.actionButtonText, liked && styles.likedButtonText]}>
                  {likesCount}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <LinearGradient
                colors={[BlogColors.card, BlogColors.surface]}
                style={styles.actionGradient}
              >
                <Icon name="share" size={20} color={BlogColors.textSecondary} />
                <Text style={styles.actionButtonText}>Share</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
              <LinearGradient
                colors={[BlogColors.card, BlogColors.surface]}
                style={styles.actionGradient}
              >
                <Icon 
                  name={saved ? "bookmark" : "bookmark-border"} 
                  size={20} 
                  color={saved ? BlogColors.accent : BlogColors.textSecondary} 
                />
                <Text style={styles.actionButtonText}>{saved ? 'Saved' : 'Save'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          <View style={styles.articleContent}>
            {blog.content && blog.content.length > 0 ? (
              blog.content.map((block, index) => renderContentBlock(block, index))
            ) : (
              <Text style={styles.contentText}>{blog.excerpt || 'No content available'}</Text>
            )}
          </View>

          <Animatable.View animation="fadeInUp" delay={500} style={styles.commentSection}>
            <Text style={styles.sectionTitle}>
              Comments ({blog.comments?.length || 0})
            </Text>

            {currentUser ? (
              <View style={styles.commentInputContainer}>
                <LinearGradient
                  colors={[BlogColors.card, BlogColors.surface]}
                  style={styles.commentInputWrapper}
                >
                  <LinearGradient
                    colors={[BlogColors.primary, BlogColors.secondary]}
                    style={styles.userAvatar}
                  >
                    <Text style={styles.userInitial}>
                      {getUsername().charAt(0)?.toUpperCase()}
                    </Text>
                  </LinearGradient>
                  <TextInput
                    placeholder="Share your thoughts..."
                    placeholderTextColor={BlogColors.textMuted}
                    value={comment}
                    onChangeText={setComment}
                    style={styles.commentInput}
                    multiline
                    maxLength={500}
                    editable={!commentLoading}
                  />
                </LinearGradient>
                <View style={styles.commentActions}>
                  <Text style={styles.characterCount}>{comment.length}/500</Text>
                  <TouchableOpacity 
                    style={[styles.postButton, (!comment.trim() || commentLoading) && styles.disabledButton]} 
                    onPress={handleComment}
                    disabled={!comment.trim() || commentLoading}
                  >
                    <LinearGradient
                      colors={[BlogColors.primary, BlogColors.secondary]}
                      style={styles.postButtonGradient}
                    >
                      {commentLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.postButtonText}>Post</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <LinearGradient
                colors={[BlogColors.card, BlogColors.surface]}
                style={styles.loginPrompt}
              >
                <Icon name="lock" size={24} color={BlogColors.textMuted} />
                <Text style={styles.loginPromptText}>
                  Please log in to like posts and leave comments.
                </Text>
                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={() => navigation.navigate('Login')}
                >
                  <LinearGradient
                    colors={[BlogColors.primary, BlogColors.secondary]}
                    style={styles.loginButtonGradient}
                  >
                    <Text style={styles.loginButtonText}>Login</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            )}

            <View style={styles.commentsList}>
              {blog.comments?.length > 0 ? (
                blog.comments.map((c, index) => {
                  const username = c.user?.username || c.username || 'User';
                  const userId = c.user?._id || c.userId;
                  const isOwner = userId === getUserId();
                  const isTemp = c.isTemp === true;
                  
                  // CRITICAL: Only real comments can be edited/deleted
                  const canEdit = isOwner && canEditComment(c.createdAt) && !isTemp;
                  
                  const key = c._id ? String(c._id) : `comment_${index}`;
                  
                  return (
                    <Animatable.View 
                      key={key}
                      animation="fadeInUp" 
                      delay={600 + (index * 100)}
                    >
                      <LinearGradient
                        colors={[BlogColors.card, BlogColors.surface]}
                        style={[
                          styles.commentItem,
                          isTemp && styles.tempComment
                        ]}
                      >
                        <View style={styles.commentHeader}>
                          <LinearGradient
                            colors={[BlogColors.primary, BlogColors.secondary]}
                            style={[
                              styles.commentAvatar,
                              isTemp && styles.tempAvatar
                            ]}
                          >
                            <Text style={styles.commentAvatarText}>
                              {username.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                          </LinearGradient>
                          <View style={styles.commentMeta}>
                            <Text style={styles.commentUser}>
                              {username}
                              {isTemp && (
                                <Text style={styles.postingText}> • Sending...</Text>
                              )}
                            </Text>
                            <Text style={styles.commentDate}>
                              {formatCommentDate(c.createdAt || c.date)}
                              {isOwner && canEdit && !isTemp && (
                                <Text style={styles.editBadge}> • Editable</Text>
                              )}
                            </Text>
                          </View>
                          {/* CRITICAL FIX: Only show actions if NOT temp */}
                          {isOwner && !isTemp && (
                            <View style={styles.commentActionsRow}>
                              {canEdit && (
                                <TouchableOpacity 
                                  onPress={() => handleEditComment(c)}
                                  style={styles.commentActionBtn}
                                >
                                  <Icon name="edit" size={16} color={BlogColors.accent} />
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity 
                                onPress={() => handleDeleteComment(c)}
                                style={styles.commentActionBtn}
                              >
                                <Icon name="delete-outline" size={16} color={BlogColors.like} />
                              </TouchableOpacity>
                            </View>
                          )}
                          {/* Show loading for temp comments instead */}
                          {isTemp && (
                            <View style={styles.commentActionsRow}>
                              <ActivityIndicator size="small" color={BlogColors.accent} />
                            </View>
                          )}
                        </View>
                        <Text style={[
                          styles.commentText,
                          isTemp && styles.tempText
                        ]}>
                          {c.text || ''}
                        </Text>
                      </LinearGradient>
                    </Animatable.View>
                  );
                })
              ) : (
                <View style={styles.noComments}>
                  <Icon name="chat" size={40} color={BlogColors.textMuted} />
                  <Text style={styles.noCommentsText}>
                    No comments yet. Be the first to share your thoughts!
                  </Text>
                </View>
              )}
            </View>
          </Animatable.View>
        </View>
      </ScrollView>

      {/* Edit Comment Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Comment</Text>
            <TextInput
              style={styles.modalInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              maxLength={500}
              placeholder="Edit your comment..."
              placeholderTextColor={BlogColors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalCancelBtn]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalSaveBtn]} 
                onPress={submitEditComment}
              >
                <LinearGradient
                  colors={[BlogColors.primary, BlogColors.secondary]}
                  style={styles.modalSaveGradient}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BlogColors.background,
  },
  floatingIcons: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  floatingIcon: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.1,
    color: BlogColors.textMuted,
  },
  icon1: {
    top: '10%',
    right: '5%',
    transform: [{ rotate: '15deg' }],
  },
  icon2: {
    top: '30%',
    left: '5%',
    transform: [{ rotate: '-10deg' }],
  },
  icon3: {
    bottom: '20%',
    right: '10%',
    transform: [{ rotate: '25deg' }],
  },
  icon4: {
    bottom: '40%',
    left: '8%',
    transform: [{ rotate: '-15deg' }],
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
    justifyContent: 'flex-end',
    padding: 16,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
  },
  categoryBadge: {
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
    fontWeight: '800',
    color: BlogColors.text,
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
    borderBottomColor: BlogColors.border,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    color: BlogColors.text,
  },
  date: {
    fontSize: 12,
    color: BlogColors.textMuted,
    marginTop: 2,
  },
  readTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BlogColors.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  readTime: {
    fontSize: 12,
    color: BlogColors.accent,
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  likedButton: {
    borderWidth: 1,
    borderColor: BlogColors.like,
  },
  actionButtonText: {
    fontSize: 13,
    color: BlogColors.textSecondary,
    fontWeight: '600',
  },
  likedButtonText: {
    color: '#fff',
  },
  articleContent: {
    marginBottom: 32,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: BlogColors.primary,
    marginTop: 24,
    marginBottom: 12,
    lineHeight: 28,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
    color: BlogColors.textSecondary,
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
    borderRadius: 12,
    resizeMode: 'cover',
  },
  imageCaption: {
    fontSize: 14,
    color: BlogColors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  listBlock: {
    marginVertical: 12,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listBullet: {
    fontSize: 16,
    color: BlogColors.primary,
    marginRight: 8,
    lineHeight: 24,
  },
  listItem: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: BlogColors.textSecondary,
  },
  commentSection: {
    borderTopWidth: 1,
    borderTopColor: BlogColors.border,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BlogColors.text,
    marginBottom: 20,
  },
  commentInputContainer: {
    marginBottom: 24,
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BlogColors.border,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    color: BlogColors.text,
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
    color: BlogColors.textMuted,
  },
  postButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  postButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loginPrompt: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BlogColors.border,
  },
  loginPromptText: {
    fontSize: 14,
    color: BlogColors.textSecondary,
    marginVertical: 12,
    textAlign: 'center',
  },
  loginButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  loginButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  commentsList: {
    marginTop: 8,
  },
  commentItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BlogColors.border,
  },
  tempComment: {
    opacity: 0.8,
    borderColor: BlogColors.accent,
    borderWidth: 1,
    borderStyle: 'dashed',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  tempAvatar: {
    opacity: 0.7,
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
    color: BlogColors.text,
  },
  postingText: {
    fontSize: 12,
    color: BlogColors.accent,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  commentDate: {
    fontSize: 11,
    color: BlogColors.textMuted,
    marginTop: 1,
  },
  editBadge: {
    color: BlogColors.accent,
    fontSize: 11,
  },
  commentActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionBtn: {
    padding: 4,
  },
  commentText: {
    fontSize: 14,
    color: BlogColors.textSecondary,
    lineHeight: 20,
  },
  tempText: {
    opacity: 0.9,
  },
  noComments: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  noCommentsText: {
    fontSize: 14,
    color: BlogColors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BlogColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: BlogColors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BlogColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: BlogColors.text,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: BlogColors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: BlogColors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: BlogColors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BlogColors.text,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: BlogColors.card,
    borderRadius: 12,
    padding: 12,
    color: BlogColors.text,
    fontSize: 14,
    minHeight: 80,
    maxHeight: 150,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: BlogColors.border,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: 'transparent',
  },
  modalCancelText: {
    color: BlogColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    overflow: 'hidden',
  },
  modalSaveGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BlogDetailsScreen; 