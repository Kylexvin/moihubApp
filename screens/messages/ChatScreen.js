// screens/messages/ChatScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  Clipboard,
  Modal,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';
import Svg, { Path } from 'react-native-svg';

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
  
  // Long press modal state
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Three dots menu state
  const [menuVisible, setMenuVisible] = useState(false);
  const [blocking, setBlocking] = useState(false);
  
  // Keyboard state
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Derived other user
  const [derivedOtherUser, setDerivedOtherUser] = useState(null);

  // Refs
  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const modalAnimatedValue = useRef(new Animated.Value(0)).current;
  const menuAnimatedValue = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);
  const menuButtonRef = useRef(null);

  const BASE_URL = 'https://moihub.onrender.com/api';
  const SOCKET_URL = 'https://moihub.onrender.com';

  // Helper function to get consistent user ID
  const getCurrentUserId = () => {
    return currentUser?.userId || currentUser?._id || currentUser?.id || currentUserIdRef.current;
  };

  useEffect(() => {
    if (!conversationId) {
      Alert.alert('Error', 'Invalid conversation', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  }, [conversationId, navigation]);

  // Keyboard listeners
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Initialize other user
  useEffect(() => {
    if (otherUser) {
      setDerivedOtherUser(otherUser);
    } else if (conversation?.participants?.length) {
      const currentUserId = getCurrentUserId();
      const otherParticipant = conversation.participants.find(p => {
        const participantId = p._id || p.id;
        return participantId && participantId !== currentUserId;
      });
      setDerivedOtherUser(otherParticipant);
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

  // Enhanced message normalization
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

  const initializeChat = async () => {
    if (!conversationId) {
      return;
    }

    try {
      await loadMessages();
      await connectSocket();
      await markConversationAsRead();
    } catch (error) {
      Alert.alert('Error', 'Failed to load chat. Please try again.');
    }
  };

  const connectSocket = async () => {
    if (!token) {
      logout();
      return;
    }

    try {
      socketRef.current = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        timeout: 20000,
      });

      socketRef.current.on('connect', () => {
        setReconnecting(false);
        socketRef.current.emit('join_conversation', { conversationId });
      });

      socketRef.current.on('disconnect', (reason) => {
        if (reason === 'io server disconnect') {
          setReconnecting(true);
        }
      });

      socketRef.current.on('connect_error', (error) => {
        if (error.message.includes('Authentication')) {
          logout();
        } else {
          setReconnecting(true);
        }
      });

      socketRef.current.on('new_message', (messageData) => {
        handleNewMessage(messageData);
      });

      socketRef.current.on('message_sent', (messageData) => {
        updateMessageStatus(messageData.tempId, messageData, 'sent');
      });

      socketRef.current.on('message_delivered', (data) => {
        updateMessageStatus(data.messageId, null, 'delivered');
      });

      socketRef.current.on('message_read', (data) => {
        updateMessageReadStatus(data.messageId, data.readBy);
      });

      socketRef.current.on('user_typing', (data) => {
        const currentUserId = getCurrentUserId();
        if (data.userId !== currentUserId) {
          setOtherUserTyping(data.isTyping);
          if (data.isTyping) {
            setTimeout(() => setOtherUserTyping(false), 3000);
          }
        }
      });

      socketRef.current.on('user_status_changed', (data) => {
        if (data.userId === (derivedOtherUser?._id || derivedOtherUser?.id)) {
          setOtherUserOnline(data.status === 'online');
        }
      });

      socketRef.current.on('error', (error) => {
        Alert.alert('Connection Error', error.message);
      });

    } catch (error) {
      setReconnecting(true);
    }
  };

  const loadMessages = async (pageNum = 1, isLoadMore = false) => {
    if (!token) {
      logout();
      return;
    }

    if (!conversationId) {
      return;
    }

    try {
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
        if (response.status === 401) {
          logout();
        } else {
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

      if (isLoadMore) {
        setMessages((prev) => [...prev, ...normalizedMessages]);
      } else {
        setMessages(normalizedMessages);
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
            setDerivedOtherUser(other);
          }
        }
      }

      // Scroll to bottom after initial load
      if (!isLoadMore) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }

    } catch (error) {
      Alert.alert('Error', 'Could not load chat messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleNewMessage = (messageData) => {
    const normalized = normalizeMessage(messageData);

    setMessages(prev => {
      const isDuplicate = prev.some(msg =>
        (msg._id && msg._id === normalized._id) ||
        (msg.tempId && msg.tempId === normalized.tempId)
      );
      if (isDuplicate) return prev;

      return [...prev, normalized];
    });

    const messageSenderId = normalized.sender._id || normalized.sender.id;
    const currentUserId = getCurrentUserId();
    if (messageSenderId !== currentUserId) {
      setTimeout(() => markMessageAsRead(normalized._id), 500);
    }

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const updateMessageStatus = (identifier, messageData, status) => {
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

        return updatedMessage;
      }
      return msg;
    }));
  };

  const updateMessageReadStatus = (messageId, readByArray) => {
    setMessages(prev => prev.map(msg => {
      if (msg._id === messageId) {
        const readByUserIds = readByArray ? readByArray.map(item =>
          typeof item === 'string' ? item : item.user
        ) : [];

        return {
          ...msg,
          readBy: readByArray || [],
          readByUserIds,
          status: 'read',
        };
      }
      return msg;
    }));
  };

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || sending) {
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

    setMessages(prev => [...prev, tempMessage]);
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

      handleTyping(false);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch {
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
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch {
      // Silently fail
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
      loadMessages(page + 1, true);
    }
  };

  // Long press handlers
  const handleLongPress = (message) => {
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
                Alert.alert('Error', 'Failed to delete message');
              }
            } catch (error) {
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

  // Three dots menu handlers
  const showMenu = () => {
    setMenuVisible(true);
    Animated.spring(menuAnimatedValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 8,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(menuAnimatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
    });
  };

  const blockUser = async () => {
    if (!derivedOtherUser || blocking) return;

    Alert.alert(
      'Block User',
      `Are you sure you want to block ${derivedOtherUser.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setBlocking(true);
            closeMenu();
            
            try {
              const response = await fetch(`${BASE_URL}/users/block/${derivedOtherUser._id || derivedOtherUser.id}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                Alert.alert('Success', 'User blocked successfully', [
                  { text: 'OK', onPress: () => navigation.goBack() }
                ]);
              } else {
                Alert.alert('Error', 'Failed to block user');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to block user');
            } finally {
              setBlocking(false);
            }
          }
        }
      ]
    );
  };

  const reportUser = async () => {
    if (!derivedOtherUser) return;

    closeMenu();

    Alert.alert(
      'Report User',
      `Report ${derivedOtherUser.username} for inappropriate behavior?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${BASE_URL}/users/report/${derivedOtherUser._id || derivedOtherUser.id}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  reason: 'inappropriate_behavior',
                  conversationId
                })
              });

              if (response.ok) {
                Alert.alert('Success', 'User reported successfully');
              } else {
                Alert.alert('Error', 'Failed to report user');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to report user');
            }
          }
        }
      ]
    );
  };

  const renderMenu = () => {
    if (!menuVisible) return null;

    return (
      <Modal
        transparent
        visible={menuVisible}
        onRequestClose={closeMenu}
        animationType="none"
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.menuOverlay}>
            <Animated.View
              style={[
                styles.menuContainer,
                {
                  transform: [
                    {
                      scale: menuAnimatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                  opacity: menuAnimatedValue,
                  position: 'absolute',
                  top: 60,
                  right: 16,
                },
              ]}
            >
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={blockUser}
                disabled={blocking}
              >
                <Icon name="block" size={20} color="#FF9500" />
                <Text style={styles.menuItemText}>
                  {blocking ? 'Blocking...' : 'Block User'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: '#2A2A2A' }]} 
                onPress={reportUser}
              >
                <Icon name="report" size={20} color="#FF3B30" />
                <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>
                  Report User
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const cleanup = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return timePart;
    if (isYesterday) return `Yesterday ${timePart}`;

    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timePart}`;
  };

  const getMessageStatus = (message, currentUserId, otherUserId) => {
    const messageSenderId = String(message.sender?._id || message.sender?.id || '');

    if (messageSenderId !== currentUserId) return null;

    const readUserIds = (message.readBy || []).map(entry =>
      String(entry.user?._id || entry.user?.id || entry.user || '')
    );
    const deliveredUserIds = (message.deliveredTo || []).map(entry =>
      String(entry.user?._id || entry.user?.id || entry.user || '')
    );

    const isReadByOther = readUserIds.includes(String(otherUserId));
    const isDeliveredToOther = deliveredUserIds.includes(String(otherUserId));

    if (isReadByOther) {
      return (
        <View style={styles.blueTickContainer}>
          <Icon name="done-all" size={14} color="#4FC3F7" />
        </View>
      );
    } else if (isDeliveredToOther || message.status === 'delivered') {
      return <Icon name="done-all" size={14} color="rgba(255, 255, 255, 0.7)" />;
    } else if (message.status === 'sent') {
      return <Icon name="check" size={14} color="rgba(255, 255, 255, 0.7)" />;
    } else if (message.status === 'sending') {
      return <Icon name="schedule" size={14} color="rgba(255, 255, 255, 0.7)" />;
    }

    return <Icon name="check" size={14} color="#8E8E93" />;
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
          {!isOwnMessage && (
            <View style={styles.otherAvatar}>
              <Text style={styles.avatarText}>{avatarText}</Text>
            </View>
          )}

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

            <View style={styles.messageFooter}>
              <Text style={[
                styles.messageTime,
                isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
              ]}>
                {formatTime(message.createdAt)}
              </Text>
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
            <View style={styles.typingDots}>
              <Animated.View style={[styles.typingDot, { opacity: 0.6 }]} />
              <Animated.View style={[styles.typingDot, { opacity: 0.8 }]} />
              <Animated.View style={[styles.typingDot, { opacity: 1 }]} />
            </View>
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

  if (loading || !conversationId) {
    return (
      <View style={{ flex: 1, backgroundColor: '#083028' }}>
        <StatusBar backgroundColor="#0a3a2d" barStyle="light-content" />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading chat...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#083028' }}>
      <StatusBar backgroundColor="#0a3a2d" barStyle="light-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
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

              <TouchableOpacity 
                ref={menuButtonRef}
                style={styles.headerAction} 
                onPress={showMenu}
              >
                <Icon name="more-vert" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Reconnecting status */}
            {reconnecting && (
              <View style={styles.connectionStatus}>
                <Text style={styles.connectionText}>Reconnecting...</Text>
              </View>
            )}

            {/* Messages List */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item._id || item.tempId}
              renderItem={renderMessage}
              inverted={false}
              showsVerticalScrollIndicator={false}
              onEndReached={loadMoreMessages}
              onEndReachedThreshold={0.5}
              ListHeaderComponent={
                loadingMore ? (
                  <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.loadingMoreText}>Loading more messages...</Text>
                  </View>
                ) : null
              }
              ListFooterComponent={renderTypingIndicator}
              contentContainerStyle={styles.messagesList}
              onScrollToIndexFailed={() => {}}
              removeClippedSubviews={false}
              maxToRenderPerBatch={20}
              windowSize={21}
              initialNumToRender={20}
            />

            {/* Input Container */}
            <View style={styles.inputContainer}>
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
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
          </View>
        </KeyboardAvoidingView>

        {/* Three Dots Menu */}
        {renderMenu()}

        {/* Long Press Modal */}
        {renderLongPressModal()}
      </SafeAreaView>
    </View>
  );
};

const styles =  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#083028',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 0,
    backgroundColor: '#0a3a2d',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 2,
  },
  headerAction: {
    padding: 8,
  },
  connectionStatus: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  connectionText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  ownMessageWrapper: {
    justifyContent: 'flex-end',
  },
  otherMessageWrapper: {
    justifyContent: 'flex-start',
  },
  otherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2E7D2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  ownBubble: {
    backgroundColor: '#2E7D2E',
    borderTopRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#174f3a',
    borderTopLeftRadius: 4,
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingDots: {
    flexDirection: 'row',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#AAAAAA',
    marginHorizontal: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#FFFFFF',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
  },
  otherMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  blueTickContainer: {
    backgroundColor: '#e9f0e9',
    borderRadius: 8,
    padding: 2,
  },
  inputContainer: {
    backgroundColor: '#0a3a2d',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 44,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#2E7D2E',
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#AAAAAA',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 12,
    color: '#888888',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 8,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
  },
  deleteOption: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    marginTop: 8,
    paddingTop: 16,
  },
  deleteOptionText: {
    color: '#FF3B30',
  },
  modalCancel: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#888888',
  },
});

export default ChatScreen; 