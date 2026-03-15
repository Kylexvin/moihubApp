import React, { useState, useEffect, useCallback } from 'react';
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
  Image,
  Modal,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import io from 'socket.io-client';
import Svg, { Path } from 'react-native-svg';
import { Swipeable } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

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
  const [activeTab, setActiveTab] = useState('all');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [longPressedConversation, setLongPressedConversation] = useState(null);

  const { currentUser, token, logout, isAuthenticated } = useAuth();

  const BASE_URL = 'https://moihub.onrender.com/api';
  const SOCKET_URL = 'https://moihub.onrender.com';

  // ── Re-fetch whenever screen comes into focus ──────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && token) {
        fetchConversations();
      }
    }, [isAuthenticated, token])
  );

  // ── Socket ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token || !currentUser) return;

    const socketConnection = io(SOCKET_URL, {
      auth: { token, userId: currentUser._id },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    socketConnection.on('connect', () => {
      setConnectionState('connected');
      if (currentUser?._id) socketConnection.emit('join_user_room', currentUser._id);
    });

    socketConnection.on('disconnect', () => setConnectionState('disconnected'));
    socketConnection.on('connect_error', () => setConnectionState('error'));

    socketConnection.on('new_message', (message) => updateConversationWithNewMessage(message));
    socketConnection.on('new_system_message', (message) => updateConversationWithNewMessage(message));

    socketConnection.on('conversation_updated', (updatedConversation) => {
      setConversations(prev =>
        prev.map(conv => conv._id === updatedConversation._id ? updatedConversation : conv)
          .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );
    });

    socketConnection.on('user_status_changed', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        status === 'online' ? newSet.add(userId) : newSet.delete(userId);
        return newSet;
      });
    });

    socketConnection.on('user_typing', ({ conversationId, userId, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: isTyping ? { userId, isTyping } : null,
      }));
    });

    socketConnection.on('message_read', ({ conversationId, messageId, userId }) => {
      setConversations(prev =>
        prev.map(conv => {
          if (conv._id !== conversationId) return conv;
          if (!conv.lastMessage || conv.lastMessage._id !== messageId) return conv;
          if (conv.lastMessage.readBy?.some(rb => rb.user === userId)) return conv;
          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              readBy: [...(conv.lastMessage.readBy || []), { user: userId, readAt: new Date() }],
            },
          };
        })
      );
    });

    setSocket(socketConnection);
    return () => socketConnection.disconnect();
  }, [isAuthenticated, token, currentUser]);

  // ── Initial load + fade ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) { logout(); return; }

    Animated.timing(fadeAnim, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();
  }, [isAuthenticated, token]);

  // ── Filter conversations ───────────────────────────────────────────────────
  useEffect(() => {
    let filtered = conversations;

    if (activeTab === 'linkme') filtered = filtered.filter(c => c.chatType === 'linkme');
    else if (activeTab === 'system') filtered = filtered.filter(c => c.chatType === 'system');

    if (searchQuery.trim()) {
      filtered = filtered.filter(conv => {
        const other = getOtherUser(conv);
        if (conv.chatType === 'system') {
          return (
            conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.lastMessage?.metadata?.title?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        return (
          other?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          other?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    setFilteredConversations(filtered);
  }, [searchQuery, conversations, activeTab]);

  // ── Auth error ─────────────────────────────────────────────────────────────
  const handleAuthError = () => {
    Alert.alert('Session Expired', 'Please log in again.', [
      { text: 'OK', onPress: () => logout() }
    ]);
  };

  // ── Fetch conversations ────────────────────────────────────────────────────
  const fetchConversations = async () => {
    if (!token) return handleAuthError();

    try {
      const response = await fetch(`${BASE_URL}/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        const valid = data.filter(conv => {
          if (!conv._id) return false;
          if (!Array.isArray(conv.participants) || conv.participants.length === 0) {
            if (conv.chatType !== 'system') return false;
          }
          return true;
        }).map(conv => ({
          ...conv,
          unreadCount:
            typeof conv.unreadCount === 'number' ? conv.unreadCount :
            Array.isArray(conv.unreadCount) ?
              conv.unreadCount.find(uc => uc.user === currentUser._id)?.count || 0 : 0,
        }));

        setConversations(valid);
      } else if (response.status === 401) {
        handleAuthError();
      } else {
        throw new Error(`Failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Fetch conversations error:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // ── Delete conversation ────────────────────────────────────────────────────
  const handleDeletePress = (conversation) => {
    setSelectedConversation(conversation);
    setDeleteModalVisible(true);
  };
const handleLongPress = (conversation) => {
  // Only show modal if not already deleting
  if (deletingId !== conversation._id) {
    setSelectedConversation(conversation);
    setDeleteModalVisible(true);
  }
};
  const confirmDelete = async () => {
    if (!selectedConversation) return;
    
    setDeletingId(selectedConversation._id);
    setDeleteModalVisible(false);
    
    try {
      const response = await fetch(`${BASE_URL}/messages/conversations/${selectedConversation._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove conversation from state
        setConversations(prev => prev.filter(conv => conv._id !== selectedConversation._id));
        Alert.alert('Success', 'Conversation deleted');
      } else if (response.status === 401) {
        handleAuthError();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('Delete conversation error:', error);
      Alert.alert('Error', 'Failed to delete conversation');
    } finally {
      setDeletingId(null);
      setSelectedConversation(null);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, []);

  const updateConversationWithNewMessage = (message) => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv._id !== message.conversation) return conv;
        const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
        const isFromOtherUser = senderId !== currentUser._id;
        return {
          ...conv,
          lastMessage: message,
          lastMessageAt: message.createdAt,
          unreadCount: isFromOtherUser ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
        };
      }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
    );
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getOtherUser = (conversation) => {
    const rawUserId = currentUser?._id || currentUser?.userId;

    if (conversation?.chatType === 'system') {
      return { _id: '000000000000000000000000', username: 'MoiHub', avatar: null, isSystem: true };
    }

    if (!rawUserId || !Array.isArray(conversation?.participants)) return defaultUnknownUser();

    const currentUserId = rawUserId.toString();
    for (const p of conversation.participants) {
      if (p?._id?.toString() !== currentUserId) {
        return {
          _id: p._id,
          username: p.username || 'Unknown User',
          email: p.email || '',
          avatar: p.avatar || null,
        };
      }
    }
    return defaultUnknownUser();
  };

  const defaultUnknownUser = () => ({ _id: 'unknown', username: 'Unknown User', email: '', avatar: null });

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffH = diffMs / (1000 * 60 * 60);
    const diffD = diffMs / (1000 * 60 * 60 * 24);
    if (diffH < 1) return `${Math.floor(diffMs / (1000 * 60))}m`;
    if (diffH < 24) return `${Math.floor(diffH)}h`;
    if (diffD < 7) return `${Math.floor(diffD)}d`;
    return date.toLocaleDateString();
  };

  const truncateMessage = (message, maxLength = 35) => {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  };

  const getTypingIndicator = (conversationId) => {
    const t = typingUsers[conversationId];
    return t && t.userId !== currentUser._id ? 'typing...' : null;
  };

  const isUserOnline = (userId) => onlineUsers.has(userId);

  const navigateToChat = (conversation) => {
    navigation.navigate('ChatScreen', {
      conversationId: conversation._id,
      conversation,
      otherUser: getOtherUser(conversation),
    });
  };

  // ── Swipeable render ───────────────────────────────────────────────────────
  const renderRightActions = (progress, dragX, conversation) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const isDeleting = deletingId === conversation._id;

    return (
      <TouchableOpacity
        onPress={() => handleDeletePress(conversation)}
        style={styles.deleteAction}
        disabled={isDeleting}
      >
        <Animated.View style={[styles.deleteButton, { transform: [{ scale }] }]}>
          {isDeleting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Icon name="delete" size={24} color="white" />
              <Text style={styles.deleteText}>Delete</Text>
            </>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
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
        {[
          { key: 'all', label: 'All', icon: null },
          { key: 'linkme', label: 'LinkMe', icon: '💘' },
          { key: 'system', label: 'System', icon: 'notifications' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <View style={styles.tabWithIcon}>
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
              {tab.icon === 'notifications' ? (
                <Icon name="notifications" size={16} color={activeTab === tab.key ? '#1E90FF' : '#666'} style={{ marginLeft: 4 }} />
              ) : tab.icon ? (
                <Text style={[styles.linkmeIcon]}>{tab.icon}</Text>
              ) : null}
            </View>
            {activeTab === tab.key && (
              <View style={[
                styles.tabIndicator,
                tab.key === 'linkme' && styles.linkmeIndicator,
                tab.key === 'system' && styles.systemIndicator,
              ]} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => {
    const messages = {
      linkme: { title: 'No LinkMe conversations', sub: "You don't have any LinkMe matches yet" },
      system: { title: 'No system notifications', sub: 'System announcements will appear here' },
      all: { title: 'No conversations yet', sub: 'Start a new conversation by tapping the + button' },
    };
    const { title, sub } = messages[activeTab] || messages.all;

    return (
      <View style={styles.emptyContainer}>
        {activeTab === 'system' ? (
          <Icon name="notifications-none" size={64} color="#ccc" />
        ) : activeTab === 'linkme' ? (
          <Text style={{ fontSize: 64 }}>💘</Text>
        ) : (
          <Icon name="chat-bubble-outline" size={64} color="#ccc" />
        )}
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySubtitle}>{sub}</Text>
      </View>
    );
  };

const renderConversationItem = ({ item }) => {
  const otherUser = getOtherUser(item);
  const isOnline = isUserOnline(otherUser?._id);
  const typingIndicator = getTypingIndicator(item._id);
  const isLinkMe = item.chatType === 'linkme';
  const isSystem = item.chatType === 'system';
  const isDeleting = deletingId === item._id;

  if (isDeleting) {
    return (
      <View style={[styles.conversationItem, styles.deletingItem]}>
        <View style={styles.conversationTouchable}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <ActivityIndicator color="#4CAF50" />
            </View>
          </View>
          <View style={styles.conversationInfo}>
            <Text style={styles.deletingText}>Deleting conversation...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Swipeable
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
      rightThreshold={40}
      overshootRight={false}
      containerStyle={styles.swipeableContainer}
      // Optional: Prevent swipe while long press menu is visible
      enabled={!deleteModalVisible}
    >
      <Animated.View style={[
        styles.conversationItem,
        isLinkMe && styles.linkMeItem,
        isSystem && styles.systemItem,
        { opacity: fadeAnim },
      ]}>
        <TouchableOpacity
          style={styles.conversationTouchable}
          onPress={() => navigateToChat(item)}
          onLongPress={() => handleLongPress(item)}
          delayLongPress={500} // 500ms long press delay
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <View style={[
              styles.avatar,
              isLinkMe && styles.linkMeAvatar,
              isSystem && styles.systemAvatar,
            ]}>
              {isSystem ? (
                <Icon name="notifications" size={22} color="#1E90FF" />
              ) : otherUser?.avatar ? (
                <Image source={{ uri: otherUser.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={[
                  styles.avatarText,
                  isLinkMe && styles.linkMeAvatarText,
                  isSystem && styles.systemAvatarText,
                ]}>
                  {otherUser?.username?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              )}

              {isLinkMe && (
                <Text style={styles.linkMeBadge}>💘</Text>
              )}
            </View>

            {!isSystem && isOnline && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={[
                styles.username,
                isLinkMe && styles.linkMeUsername,
                isSystem && styles.systemUsername,
              ]}>
                {otherUser?.username || 'Unknown User'}
                {isSystem && ' (System)'}
              </Text>
              <View style={styles.rightSection}>
                <Text style={[styles.timestamp, isSystem && styles.systemTimestamp]}>
                  {formatTime(item.lastMessageAt)}
                </Text>
                {item.unreadCount > 0 && (
                  <View style={[
                    styles.unreadBadge,
                    isLinkMe && styles.linkMeUnreadBadge,
                    isSystem && styles.systemUnreadBadge,
                  ]}>
                    <Text style={styles.unreadText}>
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.lastMessageContainer}>
              <Text style={[styles.lastMessage, isSystem && styles.systemLastMessage]}>
                {typingIndicator || truncateMessage(item.lastMessage?.content)}
              </Text>
              {connectionState !== 'connected' && (
                <Icon name="schedule" size={12} color="#FF6B6B" style={styles.pendingIcon} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Swipeable>
  );
};

  // ── Loading state ──────────────────────────────────────────────────────────
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

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 0 }}>
          <Svg height="100%" width="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={filteredConversations.length === 0 && styles.emptyListContainer}
        />

        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('NewChatScreen')}
          activeOpacity={0.8}
        >
          <Icon name="add" size={28} color="white" />
        </TouchableOpacity>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Icon name="delete" size={48} color="#FF6B6B" style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Delete Conversation?</Text>
              <Text style={styles.modalText}>
                This will hide the conversation from your list. The other person will still have access to it.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteConfirmButton]}
                  onPress={confirmDelete}
                >
                  <Text style={styles.deleteConfirmText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
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
  swipeableContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  conversationItem: {
    backgroundColor: '#174f3a',
    borderWidth: 1,
    borderColor: '#2E7D2E',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  deletingItem: {
    opacity: 0.5,
  },
  linkMeItem: {
    backgroundColor: '#230c3a',
    borderLeftWidth: 4,
    borderLeftColor: '#FF4081',
    borderColor: '#4CAF50',
  },
  systemItem: {
    backgroundColor: '#0d2b52',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    borderColor: '#2196F3',
  },
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
    overflow: 'hidden',
  },
  linkMeAvatar: {
    backgroundColor: '#4CAF50',
  },
  systemAvatar: {
    backgroundColor: '#0d2b52',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkMeAvatarText: {
    color: '#FFF',
  },
  systemAvatarText: {
    color: '#2196F3',
  },
  linkMeBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    fontSize: 14,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 2,
    overflow: 'hidden',
  },
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
  systemUsername: {
    color: '#2196F3',
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#888888',
  },
  systemTimestamp: {
    color: '#64B5F6',
  },
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
  systemUnreadBadge: {
    backgroundColor: '#2196F3',
  },
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
  systemLastMessage: {
    color: '#90CAF9',
    fontStyle: 'italic',
  },
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  // Delete action styles
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: '100%',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  deletingText: {
    color: '#888888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteConfirmButton: {
    backgroundColor: '#FF6B6B',
  },
  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatListScreen; 