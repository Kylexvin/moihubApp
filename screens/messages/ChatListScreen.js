// screens/messages/ChatListScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Animated,
  Modal,
  Dimensions,
  Vibration,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

const ChatListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [deletedConversations, setDeletedConversations] = useState(new Set());
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;
  
  // Use AuthContext
  const { currentUser, token, logout, isAuthenticated } = useAuth();

  const BASE_URL = 'http://192.168.100.51:5000/api';

  // Load preferences on mount
  useEffect(() => {
    loadUserPreferences();
    animateEntry();
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (token && currentUser) {
      initSocket();
    }
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token, currentUser]);

  // Focus effect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && token) {
        fetchConversations();
      }
    }, [isAuthenticated, token])
  );

  // Filter conversations based on search and deleted conversations
  useEffect(() => {
    let filtered = conversations.filter(conv => !deletedConversations.has(conv._id));
    
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(conv => {
        const otherParticipant = conv.participants.find(p => p._id !== currentUser?.id);
        return otherParticipant?.username?.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    
    setFilteredConversations(filtered);
  }, [searchQuery, conversations, currentUser, deletedConversations]);

  const animateEntry = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadUserPreferences = async () => {
    try {
      const darkTheme = await AsyncStorage.getItem('darkTheme');
      const deletedConvs = await AsyncStorage.getItem('deletedConversations');
      
      if (darkTheme !== null) {
        setIsDarkTheme(JSON.parse(darkTheme));
      }
      
      if (deletedConvs !== null) {
        setDeletedConversations(new Set(JSON.parse(deletedConvs)));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const saveUserPreferences = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    await saveUserPreferences('darkTheme', newTheme);
    
    // Haptic feedback
    Vibration.vibrate(50);
  };

  const deleteConversation = async (conversationId) => {
    const newDeletedConversations = new Set([...deletedConversations, conversationId]);
    setDeletedConversations(newDeletedConversations);
    await saveUserPreferences('deletedConversations', Array.from(newDeletedConversations));
    
    // Show undo option
    Alert.alert(
      'Conversation Deleted',
      'The conversation has been removed from your list.',
      [
        {
          text: 'Undo',
          onPress: async () => {
            const restoredConversations = new Set(deletedConversations);
            restoredConversations.delete(conversationId);
            setDeletedConversations(restoredConversations);
            await saveUserPreferences('deletedConversations', Array.from(restoredConversations));
          },
        },
        { text: 'OK', style: 'default' },
      ]
    );
  };

  const showActionModalWithAnimation = (conversation) => {
    setSelectedConversation(conversation);
    setShowActionModal(true);
    Vibration.vibrate(100); // Haptic feedback
    
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideActionModal = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowActionModal(false);
      setSelectedConversation(null);
    });
  };

  const initSocket = async () => {
    try {
      if (!token) {
        console.log('No token available for socket connection');
        return;
      }

      const socketInstance = io('http://192.168.100.51:5000', {
        auth: { token }
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected');
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        if (error.message === 'Authentication error') {
          handleAuthError();
        }
      });

      socketInstance.on('new_message', handleNewMessage);
      socketInstance.on('user_status_changed', handleUserStatusChange);
      socketInstance.on('user_typing', handleUserTyping);

      setSocket(socketInstance);
    } catch (error) {
      console.error('Socket init error:', error);
    }
  };

  const handleAuthError = () => {
    Alert.alert(
      'Session Expired', 
      'Your session has expired. Please log in again.',
      [
        {
          text: 'OK',
          onPress: () => logout()
        }
      ]
    );
  };

  const handleNewMessage = (data) => {
    const { message, conversationId } = data;
    
    setConversations(prev => prev.map(conv => {
      if (conv._id === conversationId) {
        return {
          ...conv,
          lastMessage: message,
          lastMessageAt: message.createdAt,
          unreadCount: conv.unreadCount + 1
        };
      }
      return conv;
    }));
  };

  const handleUserStatusChange = (data) => {
    const { userId, status } = data;
    
    setOnlineUsers(prev => {
      const newSet = new Set(prev);
      if (status === 'online') {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  };

  const handleUserTyping = (data) => {
    const { conversationId, userId, isTyping } = data;
    
    setTypingUsers(prev => ({
      ...prev,
      [conversationId]: isTyping ? userId : null
    }));

    if (isTyping) {
      setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [conversationId]: null
        }));
      }, 3000);
    }
  };

  const fetchConversations = async () => {
    try {
      if (!token) {
        console.log('No token available');
        logout();
        return;
      }

      const response = await fetch(`${BASE_URL}/messages/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else if (response.status === 401) {
        console.log('Token expired or invalid');
        handleAuthError();
      } else {
        throw new Error('Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Fetch conversations error:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const navigateToChat = (conversation) => {
  const otherParticipant = conversation.participants.find(p => p._id !== currentUser?.id);
  
  navigation.navigate('ChatScreen', {
    conversationId: conversation._id,
    conversation: conversation,
    otherUser: otherParticipant
  });
};
  const navigateToNewChat = () => {
    navigation.navigate('NewChatScreen');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const AnimatedConversationItem = ({ item, index }) => {
    const itemAnimValue = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      Animated.timing(itemAnimValue, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    const handlePressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    const handleLongPress = () => {
      showActionModalWithAnimation(item);
    };

    const otherParticipant = item.participants.find(p => p._id !== currentUser?.id);
    const isOnline = onlineUsers.has(otherParticipant?._id);
    const isTyping = typingUsers[item._id];

    const currentStyles = isDarkTheme ? darkStyles : lightStyles;

    return (
      <Animated.View
        style={[
          {
            opacity: itemAnimValue,
            transform: [
              {
                translateY: itemAnimValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
              { scale: scaleValue },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.conversationItem, currentStyles.conversationItem]}
          onPress={() => navigateToChat(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onLongPress={handleLongPress}
          delayLongPress={500}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, currentStyles.avatar]}>
              <Text style={styles.avatarText}>
                {otherParticipant?.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text style={[styles.participantName, currentStyles.participantName]}>
                {otherParticipant?.username || 'Unknown User'}
              </Text>
              <Text style={[styles.timestamp, currentStyles.timestamp]}>
                {item.lastMessageAt ? formatTime(item.lastMessageAt) : ''}
              </Text>
            </View>

            <View style={styles.lastMessageContainer}>
              <Text style={[styles.lastMessage, currentStyles.lastMessage]} numberOfLines={1}>
                {isTyping ? (
                  <Text style={styles.typingText}>typing...</Text>
                ) : (
                  item.lastMessage?.content || 'No messages yet'
                )}
              </Text>
              {item.unreadCount > 0 && (
                <Animated.View style={[styles.unreadBadge, { transform: [{ scale: scaleValue }] }]}>
                  <Text style={styles.unreadCount}>
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </Text>
                </Animated.View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderConversationItem = ({ item, index }) => (
    <AnimatedConversationItem item={item} index={index} />
  );

  const ActionModal = () => {
    if (!selectedConversation) return null;

    const otherParticipant = selectedConversation.participants.find(p => p._id !== currentUser?.id);
    const currentStyles = isDarkTheme ? darkStyles : lightStyles;

    return (
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="none"
        onRequestClose={hideActionModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={hideActionModal}
        >
          <Animated.View
            style={[
              styles.actionModal,
              currentStyles.actionModal,
              {
                transform: [{ translateY: modalSlideAnim }],
              },
            ]}
          >
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <View style={[styles.modalAvatar, currentStyles.avatar]}>
                <Text style={styles.avatarText}>
                  {otherParticipant?.username?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <Text style={[styles.modalUsername, currentStyles.participantName]}>
                {otherParticipant?.username || 'Unknown User'}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, currentStyles.actionButton]}
                onPress={() => {
                  hideActionModal();
                  navigateToChat(selectedConversation);
                }}
              >
                <Icon name="chat" size={24} color={isDarkTheme ? '#FFFFFF' : '#007AFF'} />
                <Text style={[styles.actionButtonText, currentStyles.actionButtonText]}>Open Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, currentStyles.actionButton]}
                onPress={() => {
                  hideActionModal();
                  deleteConversation(selectedConversation._id);
                }}
              >
                <Icon name="delete" size={24} color="#FF3B30" />
                <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, currentStyles.actionButton]}
                onPress={() => {
                  hideActionModal();
                  toggleTheme();
                }}
              >
                <Icon 
                  name={isDarkTheme ? "light-mode" : "dark-mode"} 
                  size={24} 
                  color={isDarkTheme ? '#FFFFFF' : '#007AFF'} 
                />
                <Text style={[styles.actionButtonText, currentStyles.actionButtonText]}>
                  {isDarkTheme ? 'Light Theme' : 'Dark Theme'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (!isAuthenticated || loading) {
    const currentStyles = isDarkTheme ? darkStyles : lightStyles;
    return (
      <SafeAreaView style={[styles.container, currentStyles.container]}>
        <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, currentStyles.loadingText]}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStyles = isDarkTheme ? darkStyles : lightStyles;

  return (
    <SafeAreaView style={[styles.container, currentStyles.container]}>
      <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, currentStyles.header]}>
          <Text style={[styles.headerTitle, currentStyles.headerTitle]}>Messages</Text>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
            <Icon 
              name={isDarkTheme ? "light-mode" : "dark-mode"} 
              size={24} 
              color={isDarkTheme ? '#FFFFFF' : '#007AFF'} 
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, currentStyles.searchContainer]}>
          <Icon name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, currentStyles.searchInput]}
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

        {/* Conversations List */}
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item._id}
          renderItem={renderConversationItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="chat-bubble-outline" size={64} color="#C7C7CC" />
              <Text style={[styles.emptyTitle, currentStyles.emptyTitle]}>No conversations yet</Text>
              <Text style={[styles.emptySubtitle, currentStyles.emptySubtitle]}>
                Start a new conversation by tapping the + button
              </Text>
            </View>
          }
        />

        {/* Floating Action Button */}
        <Animated.View
          style={[
            styles.fab,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fabButton}
            onPress={navigateToNewChat}
            activeOpacity={0.8}
          >
            <Icon name="add" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      <ActionModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  themeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#083028',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: 'white',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  typingText: {
    fontStyle: 'italic',
    color: '#007AFF',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#083028',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 34,
    paddingHorizontal: 16,
    minHeight: 300,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#C7C7CC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#083028',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalUsername: {
    fontSize: 20,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});

// Light theme styles
const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    color: '#000000',
  },
  searchContainer: {
    backgroundColor: '#F2F2F7',
  },
  searchInput: {
    color: '#000000',
  },
  conversationItem: {
    borderBottomColor: '#E5E5EA',
  },
  avatar: {
    backgroundColor: '#083028',
  },
  participantName: {
    color: '#000000',
  },
  timestamp: {
    color: '#8E8E93',
  },
  lastMessage: {
    color: '#8E8E93',
  },
  loadingText: {
    color: '#8E8E93',
  },
  emptyTitle: {
    color: '#000000',
  },
  emptySubtitle: {
    color: '#8E8E93',
  },
  actionModal: {
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    backgroundColor: '#F2F2F7',
    borderColor: '#E5E5EA',
  },
  actionButtonText: {
    color: '#083028',
  },
});

// Dark theme styles
const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#0D1A16',
  },
  header: {
    borderBottomColor: '#2C2C2E',
  },
  headerTitle: {
    color: '#FFFFFF',
  },
  searchContainer: {
    backgroundColor: '#1C1C1E',
  },
  searchInput: {
    color: '#FFFFFF',
  },
  conversationItem: {
    borderBottomColor: '#2C2C2E',
  },
  avatar: {
    backgroundColor: '#8E8E93',
  },
  participantName: {
    color: '#FFFFFF',
  },
  timestamp: {
    color: '#8E8E93',
  },
  lastMessage: {
    color: '#8E8E93',
  },
  loadingText: {
    color: '#8E8E93',
  },
  emptyTitle: {
    color: '#FFFFFF',
  },
  emptySubtitle: {
    color: '#8E8E93',
  },
  actionModal: {
    backgroundColor: '#1C1C1E',
  },
  actionButton: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3A3A3C',
  },
  actionButtonText: {
    color: '#FFFFFF',
  },
});

export default ChatListScreen;