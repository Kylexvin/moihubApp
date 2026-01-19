import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';
import Svg, { Path } from 'react-native-svg';

const ChatListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [socket, setSocket] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  
  // New state for tabs
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'linkme', 'system'

  const { currentUser, token, logout, isAuthenticated } = useAuth();
  
  const BASE_URL = 'https://moihub.onrender.com/api';
  const SOCKET_URL = 'https://moihub.onrender.com'; 

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !token || !currentUser) {
      return;
    }

    console.log('Initializing socket connection...');
    
    const socketConnection = io(SOCKET_URL, {
      auth: {
        token: token,
        userId: currentUser._id
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    socketConnection.on('connect', () => {
      console.log('Socket connected:', socketConnection.id);
      setConnectionState('connected');
      
      // Join user room
      if (currentUser?._id) {
        socketConnection.emit('join_user_room', currentUser._id);
      }
    });

    socketConnection.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnectionState('disconnected');
    });

    socketConnection.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionState('error');
    });

    // Handle real-time events
    socketConnection.on('new_message', (message) => {
      console.log('Received new message:', message);
      updateConversationWithNewMessage(message);
    });

    socketConnection.on('new_system_message', (message) => {
      console.log('Received new system message:', message);
      updateConversationWithNewMessage(message);
    });

    socketConnection.on('conversation_updated', (updatedConversation) => {
      console.log('Conversation updated:', updatedConversation);
      setConversations(prevConversations => {
        return prevConversations.map(conv => 
          conv._id === updatedConversation._id ? updatedConversation : conv
        ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    });

    socketConnection.on('user_status_changed', ({ userId, status }) => {
      console.log('User status changed:', userId, status);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (status === 'online') {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    socketConnection.on('user_typing', ({ conversationId, userId, isTyping }) => {
      console.log('User typing:', conversationId, userId, isTyping);
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: isTyping ? { userId, isTyping } : null
      }));
    });

    socketConnection.on('message_read', ({ conversationId, messageId, userId }) => {
      console.log('Message read:', conversationId, messageId, userId);

      setConversations(prev =>
        prev.map(conv => {
          if (conv._id !== conversationId) return conv;

          if (!conv.lastMessage || conv.lastMessage._id !== messageId) return conv;

          const alreadyRead = conv.lastMessage.readBy?.some(rb => rb.user === userId);
          if (alreadyRead) return conv;

          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              readBy: [
                ...(conv.lastMessage.readBy || []),
                { user: userId, readAt: new Date() }
              ]
            }
          };
        })
      );
    });

    setSocket(socketConnection);

    return () => {
      console.log('Cleaning up socket connection');
      socketConnection.disconnect();
    };
  }, [isAuthenticated, token, currentUser]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      logout();
      return;
    }
    fetchConversations();
    
    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isAuthenticated, token, currentUser]);

  // Filter conversations based on active tab and search
  useEffect(() => {
    let filtered = conversations;
    
    // First filter by tab
    if (activeTab === 'linkme') {
      filtered = filtered.filter(conv => conv.chatType === 'linkme');
    } else if (activeTab === 'system') {
      filtered = filtered.filter(conv => conv.chatType === 'system');
    }
    // 'all' tab shows everything
    
    // Then filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(conv => {
        const otherUser = getOtherUser(conv);
        const isSystem = conv.chatType === 'system';
        
        if (isSystem) {
          // For system messages, search in content and metadata
          return (
            conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.lastMessage?.metadata?.title?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        
        return (
          otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          otherUser?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }
    
    setFilteredConversations(filtered);
  }, [searchQuery, conversations, activeTab]);

  const handleAuthError = () => {
    Alert.alert('Session Expired', 'Please log in again.', [
      { text: 'OK', onPress: () => logout() }
    ]);
  };

  const fetchConversations = async () => {
    if (!token) return handleAuthError();

    try {
      console.log('Fetching conversations with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${BASE_URL}/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched conversations:', data);
        
        // Validate and clean the data
        const validConversations = data.filter(conv => {
          if (!conv._id) {
            console.warn('Conversation missing ID:', conv);
            return false;
          }
          
          if (!Array.isArray(conv.participants) || conv.participants.length === 0) {
            // System conversations might not have participants array
            if (conv.chatType !== 'system') {
              console.warn('Non-system conversation missing participants:', conv);
              return false;
            }
          }
          
          return true;
        }).map(conv => ({
          ...conv,
          // Normalize unreadCount - handle both number and array formats
          unreadCount: typeof conv.unreadCount === 'number' ? conv.unreadCount : 
                      Array.isArray(conv.unreadCount) ? 
                        conv.unreadCount.find(uc => uc.user === currentUser._id)?.count || 0 :
                        0
        }));
        
        console.log('Valid conversations:', validConversations.length);
        setConversations(validConversations);
      } else if (response.status === 401) {
        handleAuthError();
      } else {
        const errorText = await response.text();
        console.error('Fetch conversations failed:', response.status, errorText);
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }
    } catch (error) {
      console.error('Fetch conversations error:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, []);

  const updateConversationWithNewMessage = (message) => {
    console.log('Updating conversation with new message:', message);
    setConversations(prevConversations => {
      return prevConversations.map(conv => {
        if (conv._id === message.conversation) {
          // Get sender ID properly
          const senderId = typeof message.sender === 'object' 
            ? message.sender._id 
            : message.sender;
          
          const currentUserId = currentUser._id;
          const isFromOtherUser = senderId !== currentUserId;

          console.log('Message from other user:', isFromOtherUser, 'SenderId:', senderId, 'CurrentUserId:', currentUserId);

          return {
            ...conv,
            lastMessage: message,
            lastMessageAt: message.createdAt,
            unreadCount: isFromOtherUser ? (conv.unreadCount || 0) + 1 : conv.unreadCount
          };
        }
        return conv;
      }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    });
  };

  // Fixed getOtherUser function with better error handling
  const getOtherUser = (conversation) => {
    const rawUserId = currentUser?._id || currentUser?.userId;
    
    // For system conversations, return system user info
    if (conversation?.chatType === 'system') {
      return {
        _id: '000000000000000000000000',
        username: 'MoiHub',
        profilePicture: '/avatars/moihub-system.png',
        isSystem: true
      };
    }
    
    if (!rawUserId || !Array.isArray(conversation?.participants)) {
      console.warn('Missing currentUser or participants:', currentUser, conversation?.participants);
      return defaultUnknownUser();
    }

    const currentUserId = rawUserId.toString();

    for (const participant of conversation.participants) {
      const participantId = participant?._id?.toString();
      if (participantId && participantId !== currentUserId) {
        return {
          _id: participant._id,
          username: participant.username || 'Unknown User',
          email: participant.email || '',
          profilePicture: participant.profilePicture || null
        };
      }
    }

    console.warn('No other user found, fallback triggered');
    return defaultUnknownUser();
  };

  const defaultUnknownUser = () => ({
    _id: 'unknown',
    username: 'Unknown User',
    email: '',
    profilePicture: null
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      return `${Math.floor(diffInMs / (1000 * 60))}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (message, maxLength = 35) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const getTypingIndicator = (conversationId) => {
    const typingUser = typingUsers[conversationId];
    if (typingUser && typingUser.userId !== currentUser._id) {
      return 'typing...';
    }
    return null;
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const navigateToChat = (conversation) => {
    const otherUser = getOtherUser(conversation);
    navigation.navigate('ChatScreen', {
      conversationId: conversation._id,
      conversation,
      otherUser
    });
  };

  const navigateToNewChat = () => {
    navigation.navigate('NewChatScreen');
  };

  const renderConversationItem = ({ item, index }) => {
    const otherUser = getOtherUser(item);
    const isOnline = isUserOnline(otherUser?._id);
    const typingIndicator = getTypingIndicator(item._id);
    const isLinkMe = item.chatType === 'linkme';
    const isSystem = item.chatType === 'system';

    return (
      <Animated.View
        style={[
          styles.conversationItem,
          isLinkMe && styles.linkMeItem,
          isSystem && styles.systemItem,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          style={styles.conversationTouchable}
          onPress={() => navigateToChat(item)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <View style={[
              styles.avatar, 
              isLinkMe && styles.linkMeAvatar,
              isSystem && styles.systemAvatar
            ]}>
              {isSystem ? (
                <Icon name="notifications" size={22} color="#1E90FF" />
              ) : (
                <Text style={[
                  styles.avatarText, 
                  isLinkMe && styles.linkMeAvatarText,
                  isSystem && styles.systemAvatarText
                ]}>
                  {otherUser?.username?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              )}

              {/* 💘 Small emoji badge for LinkMe */}
              {isLinkMe && (
                <Text style={{
                  position: 'absolute',
                  bottom: -6,
                  right: -6,
                  fontSize: 14,
                  backgroundColor: 'white',
                  borderRadius: 10,
                  paddingHorizontal: 2,
                  paddingVertical: 0,
                  color: 'purple',
                  overflow: 'hidden',
                }}>
                  💘
                </Text>
              )}
            </View>

            {!isSystem && isOnline && (
              <View style={styles.onlineIndicator} />
            )}
          </View>

          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={[
                styles.username, 
                isLinkMe && styles.linkMeUsername,
                isSystem && styles.systemUsername
              ]}>
                {otherUser?.username || 'Unknown User'}
                {isSystem && ' (System)'}
              </Text>
              <View style={styles.rightSection}>
                <Text style={[
                  styles.timestamp,
                  isSystem && styles.systemTimestamp
                ]}>
                  {formatTime(item.lastMessageAt)}
                </Text>
                {item.unreadCount > 0 && (
                  <View style={[
                    styles.unreadBadge, 
                    isLinkMe && styles.linkMeUnreadBadge,
                    isSystem && styles.systemUnreadBadge
                  ]}>
                    <Text style={styles.unreadText}>
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.lastMessageContainer}>
              <Text style={[
                styles.lastMessage,
                isSystem && styles.systemLastMessage
              ]}>
                {typingIndicator || truncateMessage(item.lastMessage?.content)}
              </Text>
              {connectionState !== 'connected' && (
                <Icon name="schedule" size={12} color="#FF6B6B" style={styles.pendingIcon} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Messages</Text>
      <View style={styles.headerRight}>
        <View style={[styles.connectionStatus, connectionState === 'connected' && styles.connectedStatus]}>
          <View style={[styles.connectionDot, connectionState === 'connected' && styles.connectedDot]} />
          <Text style={styles.connectionText}>
            {connectionState === 'connected' ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Icon name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search conversations..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#8E8E93"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Icon name="clear" size={20} color="#8E8E93" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
          {activeTab === 'all' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'linkme' && styles.activeTab]}
          onPress={() => setActiveTab('linkme')}
        >
          <View style={styles.tabWithIcon}>
            <Text style={[styles.tabText, activeTab === 'linkme' && styles.activeTabText]}>
              LinkMe
            </Text>
            <Text style={styles.linkmeIcon}>💘</Text>
          </View>
          {activeTab === 'linkme' && <View style={[styles.tabIndicator, styles.linkmeIndicator]} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'system' && styles.activeTab]}
          onPress={() => setActiveTab('system')}
        >
          <View style={styles.tabWithIcon}>
            <Text style={[styles.tabText, activeTab === 'system' && styles.activeTabText]}>
              System
            </Text>
            <Icon name="notifications" size={16} color={activeTab === 'system' ? '#1E90FF' : '#666'} />
          </View>
          {activeTab === 'system' && <View style={[styles.tabIndicator, styles.systemIndicator]} />}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => {
    let message = 'No conversations yet';
    let subMessage = 'Start a new conversation by tapping the + button';
    
    if (activeTab === 'linkme') {
      message = 'No LinkMe conversations';
      subMessage = 'You don\'t have any LinkMe matches yet';
    } else if (activeTab === 'system') {
      message = 'No system notifications';
      subMessage = 'System announcements will appear here';
    }

    return (
      <View style={styles.emptyContainer}>
        {activeTab === 'system' ? (
          <Icon name="notifications-none" size={64} color="#ccc" />
        ) : activeTab === 'linkme' ? (
          <Text style={{ fontSize: 64 }}>💘</Text>
        ) : (
          <Icon name="chat-bubble-outline" size={64} color="#ccc" />
        )}
        <Text style={styles.emptyTitle}>{message}</Text>
        <Text style={styles.emptySubtitle}>{subMessage}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* SVG Futuristic Background */}
      <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 0 }}>
        <Svg
          height="100%"
          width="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
        >
          <Path
            d="
              M12 18 C15 12, 25 12, 28 18
              M62 14 C65 10, 75 10, 78 14
              M20 80 C22 85, 28 85, 30 80
              M70 82 C72 87, 78 87, 80 82
              M34 34 Q40 28, 46 34
              M60 60 Q66 66, 72 60
              M25 65 C30 58, 40 58, 45 65
              M10 45 C15 52, 25 52, 30 45
              M58 26 Q64 20, 70 26
              M42 78 Q48 72, 54 78
              M5 5 C8 3, 12 3, 15 5
              M85 95 C88 93, 92 93, 95 95
            "
            stroke="#1E90FF22"
            strokeWidth="0.35"
            fill="none"
          />
        </Svg>
      </View>
      
      {renderHeader()}
      {renderSearchBar()}
      {renderTabs()}
      
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item._id}
        renderItem={renderConversationItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredConversations.length === 0 && styles.emptyListContainer}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={navigateToNewChat}
        activeOpacity={0.8}
      >
        <Icon name="add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#083028',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#2D1B2E',
  },
  connectedStatus: {
    backgroundColor: '#1B2D1B',
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B6B',
    marginRight: 4,
  },
  connectedDot: {
    backgroundColor: '#4CAF50',
  },
  connectionText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },

  // ============ NEW TABS STYLES ============
  tabsContainer: {
    backgroundColor: '#083028',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#2E7D2E',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#AAAAAA',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tabWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkmeIcon: {
    fontSize: 14,
    marginLeft: 4,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -8,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#4CAF50',
    borderRadius: 1.5,
  },
  linkmeIndicator: {
    backgroundColor: '#FF4081',
  },
  systemIndicator: {
    backgroundColor: '#2196F3',
  },
  // ========================================

  conversationItem: {
    backgroundColor: '#174f3a', // Clean white for other messages
    borderBottomLeftRadius: 6, // Tail effect
    borderWidth: 1,
    borderColor: '#2E7D2E',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  linkMeItem: {
    backgroundColor: '#230c3a',
    borderLeftWidth: 4,
    borderLeftColor: '#FF4081',
    borderColor: '#4CAF50',
  },
  // ============ NEW SYSTEM ITEM STYLES ============
  systemItem: {
    backgroundColor: '#0d2b52',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    borderColor: '#2196F3',
  },
  // ================================================
  conversationTouchable: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2E7D2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkMeAvatar: {
    backgroundColor: '#4CAF50',
  },
  // ============ NEW SYSTEM AVATAR STYLES ============
  systemAvatar: {
    backgroundColor: '#0d2b52',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  // ================================================
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkMeAvatarText: {
    color: '#FFF',
  },
  // ============ NEW SYSTEM AVATAR TEXT ============
  systemAvatarText: {
    color: '#2196F3',
  },
  // ===============================================
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1C1C1C',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  linkMeUsername: {
    color: '#66BB6A',
  },
  // ============ NEW SYSTEM USERNAME STYLES ============
  systemUsername: {
    color: '#2196F3',
  },
  // ====================================================
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#888888',
  },
  // ============ NEW SYSTEM TIMESTAMP ============
  systemTimestamp: {
    color: '#64B5F6',
  },
  // ==============================================
  unreadBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  linkMeUnreadBadge: {
    backgroundColor: '#66BB6A',
  },
  // ============ NEW SYSTEM UNREAD BADGE ============
  systemUnreadBadge: {
    backgroundColor: '#2196F3',
  },
  // ================================================
  unreadText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#AAAAAA',
    flex: 1,
  },
  // ============ NEW SYSTEM LAST MESSAGE ============
  systemLastMessage: {
    color: '#90CAF9',
    fontStyle: 'italic',
  },
  // ================================================
  pendingIcon: {
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#888888',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#AAAAAA',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ChatListScreen;

