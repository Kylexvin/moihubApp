import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const API_URL = 'http://192.168.100.51:5000/api';

const MatchesScreen = ({ navigation }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [startingChat, setStartingChat] = useState(null); // Track which match is starting a chat
  const { token, isAuthenticated, logout } = useAuth();

  const fetchMatches = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setOffset(0);
      } else {
        setLoading(true);
      }
      
      setError(null);

      if (!isAuthenticated || !token) {
        navigation.replace('Auth');
        return;
      }

      console.log('Fetching matches...');
      const response = await axios.get(`${API_URL}/linkme/matches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          offset: refresh ? 0 : offset,
          limit: 20
        },
        timeout: 10000,
      });

      const { matches: newMatches, hasMore: moreAvailable } = response.data.data;
      
      if (refresh) {
        setMatches(newMatches);
        setOffset(newMatches.length);
      } else {
        setMatches(prev => [...prev, ...newMatches]);
        setOffset(prev => prev + newMatches.length);
      }
      
      setHasMore(moreAvailable);

    } catch (err) {
      console.error('Error fetching matches:', err);
      
      if (err.response?.status === 401) {
        navigation.replace('Auth');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load matches');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchMatches(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchMatches();
    }
  };

  const formatMatchDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleAuthError = () => {
    Alert.alert('Session Expired', 'Please log in again.', [
      { text: 'OK', onPress: () => logout() }
    ]);
  };

  // Integrated startConversation logic from NewChatScreen
// Update the startConversation function in your MatchesScreen
const startConversation = async (user) => {
  if (!token) {
    handleAuthError();
    return;
  }

  setStartingChat(user._id); // Keep this for UI state tracking

  try {
    const res = await fetch(`${API_URL}/messages/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Use userId instead of _id for the messaging system
      body: JSON.stringify({ participantId: user.userId, chatType: 'linkme' }),

    });

    if (res.ok) {
      const convo = await res.json();
      navigation.navigate('Messages', {
        screen: 'ChatScreen',
        params: {
          conversationId: convo._id,
          conversation: convo,
          otherUser: user
        }
      });
    } else if (res.status === 401) {
      handleAuthError();
    } else {
      Alert.alert('Error', 'Failed to start conversation');
    }
  } catch (err) {
    console.error('Conversation error:', err);
    Alert.alert('Error', 'Failed to start conversation');
  } finally {
    setStartingChat(null);
  }
};

const handleStartChat = (user) => {
  startConversation(user);
};


const renderMatch = ({ item }) => (
  <View style={styles.matchCardWrapper}>
    <LinearGradient
      colors={['rgba(123, 32, 161, 0.15)', 'rgba(75, 0, 130, 0.05)']}
      style={styles.matchCardGradient}
    >
      <TouchableOpacity 
        style={styles.matchCard}
        onPress={() => handleStartChat(item.user)}
        activeOpacity={0.8}
        disabled={startingChat === item.user._id}
      >
        {/* Animated glow effect */}
        <View style={styles.glowContainer}>
          <View style={[styles.glow, { opacity: 0.3 }]} />
        </View>

        <View style={styles.matchContent}>
          {/* Profile Image Section */}
          <View style={styles.profileSection}>
            <View style={styles.imageContainer}>
              <LinearGradient
                colors={['#7b20a1', '#4b0082', '#2e003e']}
                style={styles.imageBorder}
              >
                <Image 
                  source={{ uri: item.user.profilePhotoUrl }} 
                  style={styles.matchImage}
                  resizeMode="cover"
                />
              </LinearGradient>

              {/* Match indicator */}
              <View style={styles.matchIndicator}>
                <LinearGradient
                  colors={['#ff6b9d', '#c73650']}
                  style={styles.heartBadge}
                >
                  <Icon name="heart" size={10} color="#fff" />
                </LinearGradient>
              </View>

              {/* Online status */}
              <View style={styles.onlineStatus}>
                <View style={styles.onlineDot} />
              </View>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.nameRow}>
              <Text style={styles.matchName}>{item.user.displayName}</Text>
              <View style={styles.ageChip}>
                <Text style={styles.ageText}>{item.user.age}</Text>
              </View>
            </View>

            <View style={styles.matchDateRow}>
              <Icon name="time-outline" size={12} color="#9575cd" />
              <Text style={styles.matchDate}>
                Matched {formatMatchDate(item.matchDate)}
              </Text>
            </View>

            {item.lastMessage && (
              <View style={styles.lastMessageContainer}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>
            )}
          </View>

          {/* Action Section */}
          <View style={styles.actionSection}>
            <LinearGradient
              colors={['#7b20a1', '#4b0082']}
              style={styles.chatButtonGradient}
            >
              {startingChat === item.user._id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="chatbubble" size={18} color="#fff" />
              )}
            </LinearGradient>
          </View>
        </View>

        {/* Holographic effect overlay */}
        <View style={styles.holographicOverlay} />
      </TouchableOpacity>
    </LinearGradient>
  </View>
);


  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['rgba(123, 32, 161, 0.1)', 'transparent']}
        style={styles.emptyGradient}
      >
        <View style={styles.emptyIconContainer}>
          <Icon name="heart-outline" size={100} color="#7b20a1" />
          <View style={styles.emptyGlow} />
        </View>
        
        <Text style={styles.emptyTitle}>No LinkMe Connections Yet</Text>
        <Text style={styles.emptyMessage}>
          Your perfect match is out there in the digital universe! ✨
        </Text>
        
        <TouchableOpacity 
          style={styles.startSwipingButton}
          onPress={() => navigation.navigate('Discover')}
        >
          <LinearGradient
            colors={['#7b20a1', '#4b0082']}
            style={styles.buttonGradient}
          >
            <Icon name="rocket" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.startSwipingText}>Start Exploring</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderFooter = () => {
    if (!loading || matches.length === 0) return null;
    
    return (
      <View style={styles.footerLoader}>
        <LinearGradient
          colors={['#7b20a1', '#4b0082']}
          style={styles.loaderGradient}
        >
          <ActivityIndicator size="small" color="#fff" />
        </LinearGradient>
      </View>
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchMatches(true);
    }, [token, isAuthenticated])
  );

  if (loading && matches.length === 0) {
    return (
      <LinearGradient colors={['#0a0a0a', '#1a1a2e', '#2d1b69']} style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconContainer}>
            <LinearGradient
              colors={['#7b20a1', '#4b0082']}
              style={styles.loadingIcon}
            >
              <ActivityIndicator size="large" color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.loadingText}>Scanning the cosmos for your matches...</Text>
          <View style={styles.loadingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (error && matches.length === 0) {
    return (
      <LinearGradient colors={['#0a0a0a', '#1a1a2e', '#2d1b69']} style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <View style={styles.errorContent}>
          <Icon name="warning-outline" size={80} color="#ff6b9d" />
          <Text style={styles.errorTitle}>Connection Lost</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <LinearGradient
              colors={['#7b20a1', '#4b0082']}
              style={styles.retryGradient}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Reconnect</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0a0a0a', '#1a1a2e', '#2d1b69']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['rgba(123, 32, 161, 0.2)', 'transparent']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
             
              <View style={styles.titleGlow} />
            </View>
            <View style={styles.headerStats}>
              <Text style={styles.headerSubtitle}>
                {matches.length} {matches.length === 1 ? 'connection' : 'connections'}
              </Text>
              <Icon name="sparkles" size={16} color="#7b20a1" />
            </View>
          </View>
        </LinearGradient>
      </View>
      
      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.matchId}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#7b20a1', '#4b0082']}
            tintColor="#7b20a1"
            progressBackgroundColor="#1a1a2e"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmpty : null}
        contentContainerStyle={matches.length === 0 ? styles.emptyList : styles.listContainer}
      />
    </LinearGradient>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerGradient: {
    padding: 20,
    borderRadius: 15,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitleContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  titleGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#7b20a1',
    opacity: 0.3,
    borderRadius: 10,
    blur: 10,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9575cd',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  matchCardWrapper: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  matchCardGradient: {
    borderRadius: 20,
    padding: 2,
  },
  matchCard: {
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: '#7b20a1',
    borderRadius: 20,
    opacity: 0.1,
  },
  matchContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  profileSection: {
    marginRight: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  imageBorder: {
    padding: 3,
    borderRadius: 35,
  },
  matchImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2a2a2a',
  },
  matchIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  heartBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  infoSection: {
    flex: 1,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  matchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  ageChip: {
    backgroundColor: 'rgba(123, 32, 161, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7b20a1',
  },
  ageText: {
    fontSize: 12,
    color: '#9575cd',
    fontWeight: '600',
  },
  matchDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchDate: {
    fontSize: 13,
    color: '#9575cd',
    marginLeft: 4,
  },
  lastMessageContainer: {
    backgroundColor: 'rgba(123, 32, 161, 0.1)',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#7b20a1',
  },
  lastMessage: {
    fontSize: 13,
    color: '#cccccc',
    fontStyle: 'italic',
  },
  actionSection: {
    alignItems: 'center',
  },
  chatButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  chatButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  holographicOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, transparent 30%, rgba(123, 32, 161, 0.05) 50%, transparent 70%)',
    pointerEvents: 'none',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyGradient: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 30,
  },
  emptyIconContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  emptyGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    backgroundColor: '#7b20a1',
    opacity: 0.1,
    borderRadius: 60,
    top: -10,
    left: -10,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#9575cd',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  startSwipingButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  buttonIcon: {
    marginRight: 8,
  },
  startSwipingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loaderGradient: {
    padding: 15,
    borderRadius: 25,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIconContainer: {
    marginBottom: 30,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#9575cd',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7b20a1',
  },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.7 },
  dot3: { opacity: 1 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#9575cd',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyList: {
    flex: 1,
  },
});

export default MatchesScreen;