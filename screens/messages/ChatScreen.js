// screens/messages/ChatScreen.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  Clipboard,
  Modal,
  Animated,
  PanResponder,
} from 'react-native';
import { TouchableWithoutFeedback } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';
import Svg, { Path } from 'react-native-svg';

const { height: screenHeight } = Dimensions.get('window');

const ChatScreen = ({ route, navigation }) => {
  
const routeParams = route?.params || {};
const {
  conversationId = null,
  conversation = null,
  otherUser = null,
  chatType = 'normal'
} = routeParams;

  const { currentUser, token, logout } = useAuth();
  
  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Long press modal state
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Derived other user - get from otherUser param or extract from conversation
  const [derivedOtherUser, setDerivedOtherUser] = useState(null);

  // Refs
  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const modalAnimatedValue = useRef(new Animated.Value(0)).current;

  const BASE_URL = 'https://moihub.onrender.com/api';
  const SOCKET_URL = 'https://moihub.onrender.com';

  // Helper function to get consistent user ID
const getCurrentUserId = () => {
  return currentUser?.userId || currentUser?._id || currentUser?.id || currentUserIdRef.current;
};

  // Update current user ID ref when currentUser changes
// Add this in your ChatScreen component
useEffect(() => {
  console.log('Auth Context User:', currentUser);
  console.log('User ID from context:', currentUser?._id);
  console.log('Token exists:', !!token);
}, [currentUser, token]);

  useEffect(() => {
    console.log('Chat type:', chatType);
    console.log('Current user:', currentUser);
    console.log('Current user ID:', getCurrentUserId());
  }, [currentUser]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToIndex({ index: 0, animated: true });
          }
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [messages.length]);

  // Early return if no conversationId
  useEffect(() => {
    console.log('ChatScreen route params:', { conversationId, conversation, otherUser, currentUser });
    
    if (!conversationId) {
      console.error('No conversationId provided');
      Alert.alert('Error', 'Invalid conversation', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }
  }, [conversationId, navigation]);

  // Initialize other user
  useEffect(() => {
    if (otherUser) {
      console.log('Using provided otherUser:', otherUser);
      setDerivedOtherUser(otherUser);
    } else if (conversation && conversation.participants) {
      const currentUserId = getCurrentUserId();
      const otherParticipant = conversation.participants.find(p => 
        (p._id || p.id) !== currentUserId
      );
      console.log('Found other participant from conversation:', otherParticipant);
      setDerivedOtherUser(otherParticipant);
    } else {
      console.log('No otherUser info available, will fetch from messages');
    }
  }, [otherUser, conversation, currentUser]);

  useEffect(() => {
    if (conversationId && (derivedOtherUser || !conversation)) {
      initializeChat();
    }
    return () => {
      cleanup();
    };
  }, [conversationId, derivedOtherUser]);

  useEffect(() => {
    if (!flatListRef.current || messages.length === 0 || loadingMore || loading) return;

    setTimeout(() => {
      try {
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      } catch (error) {
        console.warn('scrollToIndex failed:', error);
        if (flatListRef.current?.scrollToEnd) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }
    }, 100);
  }, [messages.length, loadingMore, loading]);
useEffect(() => {
  debugCurrentUser();
  
  // Debug messages when they load
  if (messages.length > 0) {
    console.log('=== MESSAGES DEBUG ===');
    console.log('Total messages:', messages.length);
    messages.slice(0, 3).forEach((msg, index) => {
      console.log(`Message ${index}:`, {
        id: msg._id,
        content: msg.content?.substring(0, 20),
        senderId: msg.sender?._id || msg.sender?.id,
        senderUsername: msg.sender?.username,
        timestamp: msg.createdAt
      });
    });
    console.log('====================');
  }
}, [messages, currentUser]);
// Add this useEffect after your existing useEffects
useEffect(() => {
  // Call the debug function whenever messages or currentUser changes
  if (messages.length > 0 && currentUser) {
    testUserComparison();
  }
}, [messages, currentUser]);
  // Enhanced message normalization to handle readBy array
  const normalizeMessage = (msg) => {
    const readByUserIds = msg.readBy ? msg.readBy.map(readItem => readItem.user) : [];
    
    return {
      ...msg,
      readByUserIds,
      readBy: msg.readBy || [],
      deliveredToUserIds: msg.deliveredTo ? msg.deliveredTo.map(item => 
        typeof item === 'string' ? item : item.user
      ) : [],
    };
  };
const testUserComparison = () => {
  if (messages.length > 0) {
    const testMessage = messages[0];
    const msgSenderId = String(testMessage.sender?._id || testMessage.sender?.id || '');
    const currUserId = String(getCurrentUserId() || '');
    
    console.log('=== USER COMPARISON TEST ===');
    console.log('Test message sender ID:', msgSenderId);
    console.log('Current user ID:', currUserId);
    console.log('Are they equal?', msgSenderId === currUserId);
    console.log('Length comparison:', msgSenderId.length, 'vs', currUserId.length);
    console.log('Type comparison:', typeof msgSenderId, 'vs', typeof currUserId);
    console.log('============================');
  }
};
  const initializeChat = async () => {
    if (!conversationId) {
      console.error('Cannot initialize chat without conversationId');
      return;
    }

    try {
      console.log('Initializing chat for conversation:', conversationId);
      await loadMessages();
      await connectSocket();
      await markConversationAsRead();
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      Alert.alert('Error', 'Failed to load chat. Please try again.');
    }
  };

  const connectSocket = async () => {
    if (!token) {
      console.log('No token available for socket connection');
      logout();
      return;
    }

    try {
      console.log('Connecting to socket...');
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        timeout: 20000,
      });

      // Connection events
      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current.id);
        setReconnecting(false);
        
        socketRef.current.emit('join_conversation', { conversationId });
        console.log('Emitted join_conversation for:', conversationId);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          setReconnecting(true);
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        if (error.message.includes('Authentication')) {
          logout();
        } else {
          setReconnecting(true);
        }
      });

      // Message events
      socketRef.current.on('new_message', (messageData) => {
        console.log('New message received in ChatScreen:', messageData);
        handleNewMessage(messageData);
      });

      socketRef.current.on('message_sent', (messageData) => {
        console.log('Message sent confirmation:', messageData);
        updateMessageStatus(messageData.tempId, messageData, 'sent');
      });

      socketRef.current.on('message_delivered', (data) => {
        console.log('Message delivered:', data);
        updateMessageStatus(data.messageId, null, 'delivered');
      });

      socketRef.current.on('message_read', (data) => {
        console.log('Message read:', data);
        updateMessageReadStatus(data.messageId, data.readBy);
      });

      // Typing events
      socketRef.current.on('user_typing', (data) => {
        console.log('User typing received:', data);
        const currentUserId = getCurrentUserId();
        if (data.userId !== currentUserId) {
          setOtherUserTyping(data.isTyping);
          
          if (data.isTyping) {
            setTimeout(() => setOtherUserTyping(false), 3000);
          }
        }
      });

      // User status events
      socketRef.current.on('user_status_changed', (data) => {
        console.log('User status changed:', data);
        if (data.userId === (derivedOtherUser?._id || derivedOtherUser?.id)) {
          setOtherUserOnline(data.status === 'online');
        }
      });

      socketRef.current.on('error', (error) => {
        console.error('Socket error:', error);
        Alert.alert('Connection Error', error.message);
      });

    } catch (error) {
      console.error('Socket connection failed:', error);
      setReconnecting(true);
    }
  };

  const loadMessages = async (pageNum = 1, isLoadMore = false) => {
    if (!token) {
      console.warn('No token – aborting message load');
      logout();
      return;
    }

    if (!conversationId) {
      console.error('No conversationId – aborting message load');
      return;
    }

    try {
      console.log(`Loading messages [page=${pageNum}, isLoadMore=${isLoadMore}]...`);

      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `${BASE_URL}/messages/conversations/${conversationId}/messages?page=${pageNum}&limit=20`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          console.warn('Unauthorized – logging out');
          logout();
        } else {
          console.error(`Message load failed [${response.status}]:`, errorText);
          throw new Error('Failed to load messages');
        }
        return;
      }

      const raw = await response.json();
      const rawMessages = raw.messages || raw.data || raw || [];

      const normalizedMessages = rawMessages.map((msg) => ({
        ...msg,
        sender: msg.sender || {},
        readByUserIds: (msg.readBy || []).map((r) => r.user),
        deliveredToUserIds: (msg.deliveredTo || []).map((d) => d.user),
      }));

      console.log('Normalized messages:', normalizedMessages);

      if (isLoadMore) {
        setMessages((prev) => [...prev, ...normalizedMessages]);
      } else {
        const sortedMessages = normalizedMessages.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setMessages(sortedMessages);
      }

      setHasMoreMessages(normalizedMessages.length === 20);
      setPage(pageNum);

      if (normalizedMessages.length > 0) {
        const latest = normalizedMessages[normalizedMessages.length - 1];
        lastMessageIdRef.current = latest._id;

        if (!derivedOtherUser) {
          const currentUserId = getCurrentUserId();
          const other = normalizedMessages.find(
            (m) => (m.sender._id || m.sender.id) !== currentUserId
          )?.sender;

          if (other) {
            console.log('Derived other user:', other);
            setDerivedOtherUser(other);
          }
        }
      }

      console.log(`Loaded ${normalizedMessages.length} messages`);

    } catch (error) {
      console.error('Error loading messages:', error.message || error);
      Alert.alert('Error', 'Could not load chat messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleNewMessage = (messageData) => {
    console.log('Handling new message:', messageData);

    const normalized = normalizeMessage(messageData);

    setMessages(prev => {
      const exists = prev.some(msg => msg._id === normalized._id);
      if (exists) {
        console.log('Message already exists, skipping duplicate');
        return prev;
      }

      console.log('Adding new message to state');
      return [normalized, ...prev];
    });

    const messageSenderId = normalized.sender._id || normalized.sender.id;
    const currentUserId = getCurrentUserId();
    if (messageSenderId !== currentUserId) {
      setTimeout(() => markMessageAsRead(normalized._id), 500);
    }
  };

  const updateMessageStatus = (identifier, messageData, status) => {
    console.log('Updating message status:', { identifier, status, messageData });
    
    setMessages(prev => prev.map(msg => {
      if (msg._id === identifier || msg.tempId === identifier) {
        const updatedMessage = {
          ...msg,
          ...(messageData ? normalizeMessage(messageData) : {}),
          status,
        };
        
        if (messageData && messageData._id) {
          delete updatedMessage.tempId;
        }
        
        console.log('Message updated:', updatedMessage);
        return updatedMessage;
      }
      return msg;
    }));
  };

  const updateMessageReadStatus = (messageId, readByArray) => {
    console.log('Updating message read status:', { messageId, readByArray });
    
    setMessages(prev => prev.map(msg => {
      if (msg._id === messageId) {
        const readByUserIds = readByArray ? readByArray.map(item => 
          typeof item === 'string' ? item : item.user
        ) : [];
        
        return {
          ...msg,
          readBy: readByArray || [],
          readByUserIds,
          status: 'read'
        };
      }
      return msg;
    }));
  };

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || sending) {
      console.log('Cannot send message:', { content, sending });
      return;
    }

    if (!socketRef.current?.connected) {
      Alert.alert('Connection Error', 'Not connected to server. Please check your connection.');
      return;
    }

    const tempId = 'temp_' + Date.now();
    const currentUserId = getCurrentUserId();
    const tempMessage = {
      _id: tempId,
      tempId,
      content,
      sender: {
        _id: currentUserId,
        id: currentUserId,
        username: currentUser?.username,
        ...currentUser
      },
      createdAt: new Date().toISOString(),
      status: 'sending',
      messageType: 'text',
      readByUserIds: [],
      deliveredToUserIds: [],
    };

    console.log('Sending message:', { content, tempId, conversationId, currentUserId });

    setMessages(prev => [tempMessage, ...prev]);
    setNewMessage('');
    setSending(true);

    try {
      socketRef.current.emit('send_message', {
        conversationId,
        content,
        messageType: 'text',
        tempId,
        chatType
      });
      
      console.log('Message sent via socket');
      
      handleTyping(false);
      
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({ index: 0, animated: true });
        } catch (error) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);
      
    } catch (error) {
      console.error('Send message error:', error);
      setMessages(prev => prev.filter(msg => msg.tempId !== tempId));
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (typing) => {
    if (!socketRef.current?.connected) return;

    setIsTyping(typing);
    
    socketRef.current.emit('typing', {
      conversationId,
      isTyping: typing,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (typing) {
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 3000);
    }
  };

  const markConversationAsRead = async () => {
    if (!token || !conversationId) return;

    try {
      await fetch(`${BASE_URL}/messages/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Conversation marked as read');
    } catch (error) {
      console.error('Mark conversation read error:', error);
    }
  };

  const markMessageAsRead = async (messageId) => {
    if (!socketRef.current?.connected) return;

    socketRef.current.emit('mark_read', {
      messageId,
      conversationId,
    });
  };

  const loadMoreMessages = () => {
    if (hasMoreMessages && !loadingMore) {
      console.log('Loading more messages, page:', page + 1);
      loadMessages(page + 1, true);
    }
  };

  // Long press handlers
  const handleLongPress = (message) => {
    console.log('Long press on message:', message._id);
    setSelectedMessage(message);
    setModalVisible(true);
    
    Animated.spring(modalAnimatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnimatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedMessage(null);
    });
  };

  const copyMessage = async () => {
    if (selectedMessage?.content) {
      try {
        await Clipboard.setString(selectedMessage.content);
        Alert.alert('Copied', 'Message copied to clipboard');
      } catch (error) {
        Alert.alert('Error', 'Failed to copy message');
      }
    }
    closeModal();
  };

  const deleteMessage = async () => {
    if (!selectedMessage?._id || deleting) return;

    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const response = await fetch(`${BASE_URL}/messages/messages/${selectedMessage._id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                setMessages(prev => prev.filter(msg => msg._id !== selectedMessage._id));
                Alert.alert('Success', 'Message deleted');
              } else {
                const errorText = await response.text();
                console.error('Delete message error:', errorText);
                Alert.alert('Error', 'Failed to delete message');
              }
            } catch (error) {
              console.error('Delete message error:', error);
              Alert.alert('Error', 'Failed to delete message');
            } finally {
              setDeleting(false);
              closeModal();
            }
          }
        }
      ]
    );
  };

  const cleanup = () => {
    console.log('Cleaning up ChatScreen');
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

// Enhanced message status with proper blue ticks and string conversion
// Fixed getMessageStatus function for blue ticks
const getMessageStatus = (message, currentUserId, otherUserId) => { 
  const messageSenderId = String(message.sender?._id || message.sender?.id || '');

  // Only show status for your own messages
  if (messageSenderId !== currentUserId) return null;

  // Normalize user IDs from readBy and deliveredTo
  const readUserIds = (message.readBy || []).map(entry =>
    String(entry.user?._id || entry.user?.id || entry.user || '')
  );
  const deliveredUserIds = (message.deliveredTo || []).map(entry =>
    String(entry.user?._id || entry.user?.id || entry.user || '')
  );

  const isReadByOther = readUserIds.includes(String(otherUserId));
  const isDeliveredToOther = deliveredUserIds.includes(String(otherUserId));

  // Blue double tick - message has been read
  if (isReadByOther) {
    return (
      <View style={styles.blueTickContainer}>
        <Icon name="done-all" size={14} color="#FFFFFF" />
      </View>
    );
  } 
  // Grey double tick - message has been delivered but not read
  else if (isDeliveredToOther || message.status === 'delivered') {
    return <Icon name="done-all" size={14} color="rgba(255, 255, 255, 0.7)" />;
  } 
  // Grey single tick - message has been sent but not delivered
  else if (message.status === 'sent') {
    return <Icon name="check" size={14} color="rgba(255, 255, 255, 0.7)" />;
  } 
  // Clock - message is being sent
  else if (message.status === 'sending') {
    return <Icon name="schedule" size={14} color="rgba(255, 255, 255, 0.7)" />;
  }

  // Fallback
  console.log('Returning FALLBACK single tick');
  return <Icon name="check" size={14} color="#8E8E93" />; // Fallback
};


const renderMessage = ({ item: message }) => {
  if (!message || !message.sender) return null;

  const messageSenderId = String(message.sender._id || message.sender.id || '');
  const currentUserId = String(getCurrentUserId() || '');
  const otherUserId = String(derivedOtherUser?._id || derivedOtherUser?.id || '');
  const isOwnMessage = messageSenderId === currentUserId;

  const avatarText = (message.sender?.username || '?')[0].toUpperCase();
  const messageStatus = getMessageStatus(message, currentUserId, otherUserId);

  return (
    <TouchableOpacity
      onLongPress={() => handleLongPress(message)}
      activeOpacity={0.8}
      style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}
    >
      <View style={[
        styles.messageWrapper,
        isOwnMessage ? styles.ownMessageWrapper : styles.otherMessageWrapper
      ]}>
        {/* Avatar for other messages only */}
        {!isOwnMessage && (
          <View style={styles.otherAvatar}>
            <Text style={styles.avatarText}>
              {avatarText}
            </Text>
          </View>
        )}

        {/* Message bubble */}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>

          {/* Message footer with time and status */}
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime, 
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {formatTime(message.createdAt)}
            </Text>
            {/* Only show status for own messages */}
            {isOwnMessage && messageStatus && (
              <View style={styles.messageStatus}>
                {messageStatus}
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Add this debug function to test your current user ID
const debugCurrentUser = () => {
  console.log('=== CURRENT USER DEBUG ===');
  console.log('currentUser object:', currentUser);
  console.log('currentUser._id:', currentUser?._id);
  console.log('currentUser.id:', currentUser?.id);
  console.log('getCurrentUserId():', getCurrentUserId());
  console.log('currentUserIdRef.current:', currentUserIdRef.current);
  console.log('token:', token ? 'EXISTS' : 'NULL');
  console.log('==========================');
};

  const renderTypingIndicator = () => {
    if (!otherUserTyping || !derivedOtherUser) return null;
    
    return (
      <View style={[styles.messageContainer, styles.otherMessageContainer]}>
        <View style={styles.messageWrapper}>
          <View style={styles.otherAvatar}>
            <Text style={styles.avatarText}>
              {derivedOtherUser.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={[styles.messageBubble, styles.otherBubble, styles.typingBubble]}>
            <Text style={styles.typingText}>
              {derivedOtherUser.username || 'User'} is typing...
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render long press modal
  const renderLongPressModal = () => {
    if (!modalVisible || !selectedMessage) return null;

    const currentUserId = getCurrentUserId();
    const isOwnMessage = (selectedMessage.sender?._id || selectedMessage.sender?.id) === currentUserId;

    return (
      <Modal
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
        animationType="none"
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [
                    {
                      scale: modalAnimatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                  opacity: modalAnimatedValue,
                },
              ]}
            >
              <Text style={styles.modalTitle}>Message Options</Text>
              
              <TouchableOpacity style={styles.modalOption} onPress={copyMessage}>
                <Icon name="content-copy" size={20} color="#007AFF" />
                <Text style={styles.modalOptionText}>Copy</Text>
              </TouchableOpacity>

              {isOwnMessage && (
                <TouchableOpacity 
                  style={[styles.modalOption, styles.deleteOption]} 
                  onPress={deleteMessage}
                  disabled={deleting}
                >
                  <Icon name="delete" size={20} color="#FF3B30" />
                  <Text style={[styles.modalOptionText, styles.deleteOptionText]}>
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.modalCancel} onPress={closeModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Show loading if we don't have the conversation ID
  if (loading || !conversationId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('Rendering ChatScreen with messages:', messages.length, 'otherUser:', derivedOtherUser?.username);

return (
  <SafeAreaView style={{ flex: 1 }}>
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

    {/* Chat UI */}
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={[styles.header, { zIndex: 1 }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>
                {derivedOtherUser?.username || 'Chat'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {reconnecting ? 'Connecting...' : otherUserOnline ? 'Online' : 'Offline'}
              </Text>
            </View>

            <TouchableOpacity style={styles.headerAction}>
              <Icon name="more-vert" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Reconnecting status */}
          {reconnecting && (
            <View style={[styles.connectionStatus, { zIndex: 1 }]}>
              <Text style={styles.connectionText}>Reconnecting...</Text>
            </View>
          )}

          {/* Messages */}
          <View style={[styles.chatContainer, { zIndex: 1, flex: 1 }]}>
            <FlatList
              ref={flatListRef}
              data={[...messages]}
              keyExtractor={(item) => item._id || item.tempId}
              renderItem={renderMessage}
              inverted
              showsVerticalScrollIndicator={false}
              onEndReached={loadMoreMessages}
              onEndReachedThreshold={0.1}
              ListHeaderComponent={renderTypingIndicator}
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingMoreText}>Loading more messages...</Text>
                  </View>
                ) : null
              }
              contentContainerStyle={styles.messagesList}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 100,
              }}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              initialNumToRender={20}
            />
          </View>

          {/* Input */}
          <View style={[styles.inputContainer, { zIndex: 1 }]}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={newMessage}
                onChangeText={(text) => {
                  setNewMessage(text);
                  if (text.trim().length > 0 && !isTyping) {
                    handleTyping(true);
                  } else if (text.trim().length === 0 && isTyping) {
                    handleTyping(false);
                  }
                }}
                placeholder="Type a message..."
                placeholderTextColor="#8E8E93"
                multiline
                maxLength={1000}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newMessage.trim() || sending) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!newMessage.trim() || sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Icon name="send" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Long Press Modal */}
          {renderLongPressModal()}
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  </SafeAreaView>
);

 };
const styles = StyleSheet.create({
 container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#03604d', 
    borderBottomWidth: 1,
    borderBottomColor: '#006400',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'white',
    marginTop: 2,
  },
  headerAction: {
    padding: 8,
    marginLeft: 8,
  },
  connectionStatus: {
    backgroundColor: '#FF9500',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  connectionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },

  // Message List Styles
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Message Container Styles
  messageContainer: {
    marginVertical: 3,
    width: '100%',
  },

  ownMessageContainer: {
    alignItems: 'flex-end',
  },

  otherMessageContainer: {
    alignItems: 'flex-start',
  },

  // Message Wrapper Styles
  messageWrapper: {
    flexDirection: 'row',
    maxWidth: '85%',
    alignItems: 'flex-end',
  },

  ownMessageWrapper: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },

  otherMessageWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },

  // Avatar Styles
  otherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'grey', // Nice green color
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Message Bubble Styles
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  ownBubble: {
    backgroundColor: '#174f3a', // Beautiful blue for own messages
    borderBottomRightRadius: 6, // Tail effect
  },

  otherBubble: {
    backgroundColor: '#174f3a', // Clean white for other messages
    borderBottomLeftRadius: 6, // Tail effect
    borderWidth: 1,
    borderColor: '#E8E8ED',
  },

  // Message Text Styles
  messageText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
  },

  ownMessageText: {
    color: '#FFFFFF',
  },

  otherMessageText: {
    color: '#FFFFFF',
  },

  // Message Footer Styles
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 6,
  },

  messageTime: {
    fontSize: 11,
    marginRight: 6,
    fontWeight: '500',
  },

  ownMessageTime: {
    color: 'rgb(255, 255, 255)', // Better contrast for blue background
  },

  otherMessageTime: {
    color: '#8E8E93',
  },

  messageStatus: {
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Typing Indicator Styles (WhatsApp-like)
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    alignSelf: 'flex-start',
    maxWidth: '70%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8E8ED',
  },

  typingText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    fontWeight: '400',
  },

  // Loading More Messages
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },

  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8E8E93',
  },

  // Input Container Styles
  inputContainer: {
  backgroundColor: '#FFFFFF',
  paddingHorizontal: 16,
  paddingTop: 12,
  paddingBottom: Platform.OS === 'ios' ? 16 : 8, // slightly more bottom padding for iOS
  borderTopWidth: 1,
  borderTopColor: '#E1E1E6',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -1 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 3,
},

inputRow: {
  flexDirection: 'row',
  alignItems: 'flex-end',
},


  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E1E1E6',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
    backgroundColor: '#F8F8F8',
    color: '#1C1C1E',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    minWidth: 280,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 24,
  },

  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F8F8F8',
  },

  modalOptionText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
    fontWeight: '500',
  },

  deleteOption: {
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
  },

  deleteOptionText: {
    color: '#FF3B30',
    fontWeight: '600',
  },

  modalCancel: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },

  modalCancelText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },

  // Enhanced status icons with better visibility
  statusIcon: {
    marginLeft: 4,
  },

  blueTickContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Subtle background for blue ticks
    borderRadius: 8,
    padding: 2,
    marginLeft: 4,
  },
});

export default ChatScreen;