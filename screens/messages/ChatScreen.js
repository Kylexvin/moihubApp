// screens/messages/ChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
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

const { height: screenHeight } = Dimensions.get('window');

const ChatScreen = ({ route, navigation }) => {
  // Safely extract route params with defaults
  const routeParams = route?.params || {};
  const { 
    conversationId = null, 
    conversation = null, 
    otherUser = null 
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
  const currentUserIdRef = useRef(currentUser?.id || currentUser?._id);
  const modalAnimatedValue = useRef(new Animated.Value(0)).current;

  const BASE_URL = 'http://192.168.100.51:5000/api';
  const SOCKET_URL = 'http://192.168.100.51:5000';

  // Update current user ID ref when currentUser changes
  useEffect(() => {
    currentUserIdRef.current = currentUser?.id || currentUser?._id;
  }, [currentUser]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to bottom when keyboard appears
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
      // Extract other user from conversation participants
      const otherParticipant = conversation.participants.find(p => 
        (p._id || p.id) !== currentUserIdRef.current
      );
      console.log('Found other participant from conversation:', otherParticipant);
      setDerivedOtherUser(otherParticipant);
    } else {
      console.log('No otherUser info available, will fetch from messages');
    }
  }, [otherUser, conversation]);

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
      flatListRef.current.scrollToIndex({ index: 0, animated: true });
    } catch (error) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, 100);
}, [messages.length, loadingMore, loading]);

// Enhanced message normalization to handle readBy array
const normalizeMessage = (msg) => {
  // Convert readBy array to readByUserIds for easier checking
  const readByUserIds = msg.readBy ? msg.readBy.map(readItem => readItem.user) : [];
  
  return {
    ...msg,
    readByUserIds,
    // Keep original readBy for detailed info if needed
    readBy: msg.readBy || [],
    // Handle deliveredTo array
    deliveredToUserIds: msg.deliveredTo ? msg.deliveredTo.map(item => 
      typeof item === 'string' ? item : item.user
    ) : [],
  };
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
        
        // Join conversation room
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
        if (data.userId !== currentUserIdRef.current) {
          setOtherUserTyping(data.isTyping);
          
          if (data.isTyping) {
            // Auto-clear typing indicator after 3 seconds
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
    console.log('No token for loading messages');
    logout();
    return;
  }

  if (!conversationId) {
    console.error('Cannot load messages without conversationId');
    return;
  }

  try {
    console.log(`Loading messages - page: ${pageNum}, isLoadMore: ${isLoadMore}`);

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const response = await fetch(
      `${BASE_URL}/messages/conversations/${conversationId}/messages?page=${pageNum}&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('Messages API response:', data);

      const newMessagesRaw = data.messages || data.data || data || [];
      const normalizedMessages = newMessagesRaw.map(normalizeMessage);
      console.log('Normalized messages:', normalizedMessages);

      if (isLoadMore) {
        setMessages(prev => [...prev, ...normalizedMessages]);
      } else {
        const sortedMessages = normalizedMessages.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setMessages(sortedMessages);
      }

      setHasMoreMessages(normalizedMessages.length === 20);
      setPage(pageNum);

      if (normalizedMessages.length > 0) {
        const sortedMessages = normalizedMessages.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        const latestMessage = sortedMessages[0];
        lastMessageIdRef.current = latestMessage._id;

        if (!derivedOtherUser && latestMessage.sender) {
          const messageSenderId = latestMessage.sender._id || latestMessage.sender.id;
          if (messageSenderId !== currentUserIdRef.current) {
            console.log('Deriving other user from message sender:', latestMessage.sender);
            setDerivedOtherUser(latestMessage.sender);
          } else {
            const otherSender = normalizedMessages.find(msg =>
              (msg.sender._id || msg.sender.id) !== currentUserIdRef.current
            )?.sender;
            if (otherSender) {
              console.log('Found other sender in messages:', otherSender);
              setDerivedOtherUser(otherSender);
            }
          }
        }
      }

      console.log('Messages state updated, total messages:', normalizedMessages.length);

    } else if (response.status === 401) {
      console.log('Unauthorized - logging out');
      logout();
    } else {
      const errorText = await response.text();
      console.error('Failed to load messages:', response.status, errorText);
      throw new Error('Failed to load messages');
    }
  } catch (error) {
    console.error('Load messages error:', error);
    Alert.alert('Error', 'Failed to load messages');
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
  if (messageSenderId !== currentUserIdRef.current) {
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
        
        // Remove temp ID once real message is received
        if (messageData && messageData._id) {
          delete updatedMessage.tempId;
        }
        
        console.log('Message updated:', updatedMessage);
        return updatedMessage;
      }
      return msg;
    }));
  };

  // New function to handle read status updates
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
    const tempMessage = {
      _id: tempId,
      tempId,
      content,
      sender: {
        _id: currentUserIdRef.current,
        id: currentUserIdRef.current,
        username: currentUser?.username,
        ...currentUser
      },
      createdAt: new Date().toISOString(),
      status: 'sending',
      messageType: 'text',
      readByUserIds: [],
      deliveredToUserIds: [],
    };

    console.log('Sending message:', { content, tempId, conversationId });

    // Add message optimistically to the beginning of the list
    setMessages(prev => [tempMessage, ...prev]);
    setNewMessage('');
    setSending(true);

    try {
      socketRef.current.emit('send_message', {
        conversationId,
        content,
        messageType: 'text',
        tempId,
      });
      
      console.log('Message sent via socket');
      
      // Stop typing indicator
      handleTyping(false);
      
      // Scroll to bottom after sending
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({ index: 0, animated: true });
        } catch (error) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);
      
    } catch (error) {
      console.error('Send message error:', error);
      // Remove failed message
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

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds
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
                // Remove message from local state
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

// Enhanced message status with proper blue ticks
const getMessageStatus = (message) => {
  const messageSenderId = message.sender?._id || message.sender?.id;
  if (messageSenderId !== currentUserIdRef.current) return null;

  const otherUserId = derivedOtherUser?._id || derivedOtherUser?.id;
  const readByUserIds = message.readByUserIds || [];
  const deliveredToUserIds = message.deliveredToUserIds || [];

  console.log('Message status check:', {
    messageId: message._id,
    readByUserIds,
    deliveredToUserIds,
    otherUserId,
    status: message.status
  });

  // Check if message is read by other user (blue double ticks)
  if (readByUserIds.includes(otherUserId)) {
    return <Icon name="done-all" size={14} color="#007AFF" />; // blue double tick
  } 
  // Check if message is delivered (grey double ticks)
  else if (deliveredToUserIds.includes(otherUserId) || message.status === 'delivered') {
    return <Icon name="done-all" size={14} color="#8E8E93" />; // grey double tick
  } 
  // Message sent but not delivered (single grey tick)
  else if (message.status === 'sent' || message._id) {
    return <Icon name="check" size={14} color="#8E8E93" />; // grey single tick
  }
  // Message sending (clock icon)
  else if (message.status === 'sending') {
    return <Icon name="schedule" size={14} color="#8E8E93" />; // clock icon
  }

  return <Icon name="check" size={14} color="#8E8E93" />; // default single tick
};

  const renderMessage = ({ item: message }) => {
    if (!message || !message.sender) {
      console.warn('Invalid message data:', message);
      return null;
    }

    // Fix: Use consistent sender ID comparison
    const messageSenderId = message.sender._id || message.sender.id;
    const isOwnMessage = messageSenderId === currentUserIdRef.current;
    
    console.log('Rendering message:', {
      id: message._id,
      content: message.content,
      senderId: messageSenderId,
      currentUserId: currentUserIdRef.current,
      isOwnMessage,
      sender: message.sender?.username,
      readByUserIds: message.readByUserIds
    });
    
    return (
      <TouchableOpacity
        onLongPress={() => handleLongPress(message)}
        activeOpacity={0.8}
        delayLongPress={500}
      >
        <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
          {!isOwnMessage && (
            <View style={styles.otherAvatar}>
              <Text style={styles.avatarText}>
                {(derivedOtherUser?.username || message.sender?.username)?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          
          <View style={[styles.messageBubble, isOwnMessage ? styles.ownBubble : styles.otherBubble]}>
            <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
              {message.content}
            </Text>
            
            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime]}>
                {formatTime(message.createdAt)}
              </Text>
              {isOwnMessage && (
                <View style={styles.messageStatus}>
                  {getMessageStatus(message)}
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTypingIndicator = () => {
    if (!otherUserTyping || !derivedOtherUser) return null;
    
    return (
      <View style={[styles.messageContainer, styles.otherMessage]}>
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
    );
  };

  // Render long press modal
  const renderLongPressModal = () => {
    if (!modalVisible || !selectedMessage) return null;

    const isOwnMessage = (selectedMessage.sender?._id || selectedMessage.sender?.id) === currentUserIdRef.current;

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
  <SafeAreaView style={styles.container}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // adjust based on header height
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color="#007AFF" />
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
              <Icon name="more-vert" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Connection Status */}
          {reconnecting && (
            <View style={styles.connectionStatus}>
              <Text style={styles.connectionText}>Reconnecting...</Text>
            </View>
          )}

          {/* Chat Container */}
          <View style={styles.chatContainer}>
            {/* Messages List */}
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
            />
          </View>

          {/* Input Container */}
          <View style={[styles.inputContainer, { marginBottom: keyboardHeight > 0 ? 0 : 20 }]}>
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
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
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
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
    backgroundColor: '#F2F2F7',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  otherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    maxWidth: '100%',
  },
  ownBubble: {
    backgroundColor: 'grey',
    marginRight: 8,
  },
  otherBubble: {
    backgroundColor: '#E5E5EA',
    marginLeft: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
    marginRight: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#8E8E93',
  },
  messageStatus: {
    marginLeft: 4,
  },
  typingBubble: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
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
  inputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
    backgroundColor: '#F8F8F8',
    color: '#000000',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#8E8E93',
    opacity: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
  },
  deleteOption: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  deleteOptionText: {
    color: '#FF3B30',
  },
  modalCancel: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
});

export default ChatScreen;