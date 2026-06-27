// screens/messages/ChatScreen.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Clipboard,
  Modal,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';
import MessageDbService from '../../services/MessageDbService';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:           '#07201A',
  surface:      '#0D2E24',
  surfaceAlt:   '#0A2820',
  headerBg:     '#092318',
  own:          '#1B5E3B',
  other:        '#112B22',
  inputBg:      '#0F2A20',
  border:       '#1A3D2E',
  accent:       '#34C97A',
  accentMuted:  '#1E6640',
  white:        '#FFFFFF',
  textPrimary:  '#E8F5EE',
  textSecondary:'#7CA98A',
  textMeta:     '#5A8570',
  danger:       '#E05252',
  warning:      '#F0A040',
  blue:         '#4FC3F7',
  overlay:      'rgba(4,14,10,0.72)',
};

const BASE_URL   = 'https://moihub.onrender.com/api';
const SOCKET_URL = 'https://moihub.onrender.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now  = new Date();
  const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) return timePart;
  const yesterday = new Date(); yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday ${timePart}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${timePart}`;
};

const avatarInitial = (user) =>
  (user?.username || user?.name || '?')[0].toUpperCase();

const avatarColor = (user) => {
  const palette = ['#1B6B45','#2D5A8E','#7B3FA0','#B05A1A','#2E7D6B'];
  const name = user?.username || user?.name || '';
  return palette[name.charCodeAt(0) % palette.length] || C.own;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Avatar = React.memo(({ user, size = 34 }) => (
  <View style={[
    styles.avatar,
    { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(user) }
  ]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{avatarInitial(user)}</Text>
  </View>
));

const TickIcon = React.memo(({ status, isReadByOther }) => {
  if (isReadByOther) return (
    <View style={styles.blueTickWrap}>
      <Icon name="done-all" size={13} color={C.blue} />
    </View>
  );
  if (status === 'delivered') return <Icon name="done-all" size={13} color={C.textMeta} />;
  if (status === 'sent')      return <Icon name="check"    size={13} color={C.textMeta} />;
  if (status === 'sending')   return <Icon name="schedule" size={13} color={C.textMeta} />;
  return <Icon name="check" size={13} color={C.textMeta} />;
});

const TypingIndicator = React.memo(({ user }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (d, delay) => Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ])
    ).start();
    anim(dot1, 0); anim(dot2, 150); anim(dot3, 300);
    return () => { dot1.stopAnimation(); dot2.stopAnimation(); dot3.stopAnimation(); };
  }, []);

  const dotStyle = (anim) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={styles.typingRow}>
      <Avatar user={user} size={28} />
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View key={`typing_dot_${i}`} style={[styles.typingDot, dotStyle(d)]} />
        ))}
      </View>
    </View>
  );
});

// ─── Message bubble ───────────────────────────────────────────────────────────
const MessageBubble = React.memo(({ message, isOwn, otherUserId, onLongPress }) => {
  const readByOther = useMemo(() => {
    const ids = (message.readBy || []).map(e =>
      String(e.user?._id || e.user?.id || e.user || ''));
    return ids.includes(String(otherUserId));
  }, [message.readBy, otherUserId]);

  return (
    <TouchableOpacity
      key={message._id || message.tempId}
      onLongPress={() => onLongPress(message)}
      activeOpacity={0.85}
      style={[styles.bubbleRow, isOwn ? styles.bubbleRowOwn : styles.bubbleRowOther]}
    >
      {!isOwn && <Avatar user={message.sender} size={30} />}

      <View style={[
        styles.bubble,
        isOwn ? styles.bubbleOwn : styles.bubbleOther,
        !isOwn && { marginLeft: 8 },
      ]}>
        <View style={[styles.tail, isOwn ? styles.tailOwn : styles.tailOther]} />
        <Text style={styles.bubbleText}>{message.content}</Text>
        <View style={styles.bubbleMeta}>
          <Text style={styles.bubbleTime}>{formatTime(message.createdAt)}</Text>
          {isOwn && <TickIcon status={message.status} isReadByOther={readByOther} />}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Date separator ───────────────────────────────────────────────────────────
const DateSeparator = React.memo(({ date }) => (
  <View style={styles.dateSepRow}>
    <View style={styles.dateSepLine} />
    <View style={styles.dateSepPill}>
      <Text style={styles.dateSepText}>{date}</Text>
    </View>
    <View style={styles.dateSepLine} />
  </View>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ChatScreen = ({ route, navigation }) => {
  const routeParams = route?.params || {};
  const {
    conversationId = null,
    conversation   = null,
    otherUser      = null,
    chatType       = 'normal',
  } = routeParams;

  const { currentUser, token, logout } = useAuth();

  const [messages,         setMessages]         = useState([]);
  const [newMessage,       setNewMessage]       = useState('');
  const [loading,          setLoading]          = useState(true);
  const [sending,          setSending]          = useState(false);
  const [loadingMore,      setLoadingMore]      = useState(false);
  const [hasMoreMessages,  setHasMoreMessages]  = useState(true);
  const [page,             setPage]             = useState(1);
  const [isTyping,         setIsTyping]         = useState(false);
  const [otherUserTyping,  setOtherUserTyping]  = useState(false);
  const [otherUserOnline,  setOtherUserOnline]  = useState(false);
  const [reconnecting,     setReconnecting]     = useState(false);
  const [initialLoadDone,  setInitialLoadDone]  = useState(false);
  const [derivedOtherUser, setDerivedOtherUser] = useState(null);
  const [dbInitialized,    setDbInitialized]    = useState(false);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [modalVisible,    setModalVisible]    = useState(false);
  const [deleting,        setDeleting]        = useState(false);
  const [menuVisible,     setMenuVisible]     = useState(false);
  const [blocking,        setBlocking]        = useState(false);

  const flatListRef      = useRef(null);
  const socketRef        = useRef(null);
  const typingTimeoutRef = useRef(null);
  const modalAnim        = useRef(new Animated.Value(0)).current;
  const menuAnim         = useRef(new Animated.Value(0)).current;
  const inputRef         = useRef(null);

  const getCurrentUserId = useCallback(() =>
    currentUser?.userId || currentUser?._id || currentUser?.id,
  [currentUser]);

  // ── Initialize Database ──
  useEffect(() => {
    const initDB = async () => {
      try {
        await MessageDbService.init();
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize DB:', error);
        setDbInitialized(false);
      }
    };
    initDB();
  }, []);

  // ── Original working two-effect pattern ──
  useEffect(() => {
    if (!conversationId) {
      Alert.alert('Error', 'Invalid conversation', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      return;
    }
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
    if (conversationId && (derivedOtherUser || !conversation) && dbInitialized) {
      initializeChat();
    }
    return () => cleanup();
  }, [conversationId, derivedOtherUser, dbInitialized]);

  const initializeChat = async () => {
    try {
      // 1. Load from local DB instantly
      await loadMessagesFromLocal();
      
      // 2. Connect socket for real-time
      connectSocket();
      
      // 3. Mark as read
      await markConversationAsRead();
    } catch {
      Alert.alert('Error', 'Failed to load chat. Please try again.');
    } finally {
      setInitialLoadDone(true);
    }
  };

  // ── Load messages from local DB (INSTANT!) ──
  const loadMessagesFromLocal = useCallback(async () => {
    if (!dbInitialized || !conversationId) return;

    try {
      const localMessages = await MessageDbService.getMessages(conversationId, 50);
      if (localMessages && localMessages.length > 0) {
        // Format messages to match expected structure
        const formatted = localMessages.map(msg => ({
          ...msg,
          _id: msg.id || msg._id,
          sender: {
            _id: msg.senderId,
            id: msg.senderId,
            username: msg.senderName || 'Unknown',
          },
          readBy: msg.readBy || [],
          deliveredTo: msg.deliveredTo || [],
          status: msg.status || 'sent',
        }));
        setMessages(formatted);
        setLoading(false);
        
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
      }
    } catch (error) {
      console.error('Failed to load from local DB:', error);
    }
  }, [dbInitialized, conversationId]);

  // ── Socket ──
  const connectSocket = () => {
    if (!token) { logout(); return; }

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
      if (reason === 'io server disconnect') setReconnecting(true);
    });

    socketRef.current.on('connect_error', (err) => {
      if (err.message.includes('Authentication')) logout();
      else setReconnecting(true);
    });

    socketRef.current.on('new_message', handleNewMessage);

    socketRef.current.on('message_sent', ({ tempId, ...rest }) => {
      updateMessageStatus(tempId, rest, 'sent');
    });

    socketRef.current.on('message_delivered', ({ messageId }) => {
      updateMessageStatus(messageId, null, 'delivered');
    });

    socketRef.current.on('message_read', ({ messageId, readBy }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId
          ? { ...m, readBy: readBy || [], status: 'read' }
          : m
      ));
      // Update local DB
      if (dbInitialized) {
        MessageDbService.markMessageRead(messageId, getCurrentUserId());
      }
    });

    socketRef.current.on('user_typing', ({ userId, isTyping: t }) => {
      if (userId !== getCurrentUserId()) {
        setOtherUserTyping(t);
        if (t) setTimeout(() => setOtherUserTyping(false), 3000);
      }
    });

    socketRef.current.on('user_status_changed', ({ userId, status }) => {
      const otherId = derivedOtherUser?._id || derivedOtherUser?.id;
      if (userId === otherId) setOtherUserOnline(status === 'online');
    });

    socketRef.current.on('error', (err) => Alert.alert('Connection Error', err.message));
  };

  // ── Load messages from server (background sync) ──
  const loadMessages = async (pageNum = 1, isLoadMore = false) => {
    if (!token) { logout(); return; }
    if (!conversationId) return;

    isLoadMore ? setLoadingMore(true) : setLoading(true);

    try {
      const res = await fetch(
        `${BASE_URL}/messages/conversations/${conversationId}/messages?page=${pageNum}&limit=20`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (!res.ok) {
        if (res.status === 401) logout();
        throw new Error('Failed to load');
      }

      const raw = await res.json();
      const rawMsgs = raw.messages || raw.data || raw || [];

      const normalized = rawMsgs.map(msg => ({
        ...msg,
        sender:             msg.sender || {},
        readByUserIds:      (msg.readBy || []).map(r => r.user),
        deliveredToUserIds: (msg.deliveredTo || []).map(d => d.user),
      }));

      // Save to local DB
      if (dbInitialized) {
        for (const msg of normalized) {
          await MessageDbService.saveMessage({
            _id: msg._id,
            conversationId: msg.conversationId || conversationId,
            content: msg.content,
            senderId: msg.sender._id || msg.sender.id,
            senderName: msg.sender.username || 'Unknown',
            createdAt: msg.createdAt,
            status: msg.status || 'sent',
            readBy: msg.readBy || [],
            deliveredTo: msg.deliveredTo || [],
          });
        }
      }

      setMessages(prev => isLoadMore ? [...normalized, ...prev] : normalized);
      setHasMoreMessages(normalized.length === 20);
      setPage(pageNum);

      if (!isLoadMore && normalized.length > 0 && !derivedOtherUser) {
        const uid = getCurrentUserId();
        const other = normalized.find(m => (m.sender._id || m.sender.id) !== uid)?.sender;
        if (other) setDerivedOtherUser(other);
      }

      if (!isLoadMore) {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 120);
      }
    } catch {
      Alert.alert('Error', 'Could not load messages');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleNewMessage = useCallback(async (data) => {
    const normalized = normalizeMessage(data);

    // Ensure sender is always a populated object
    if (!normalized.sender?.username) {
      normalized.sender = {
        ...normalized.sender,
        username: derivedOtherUser?.username || 'User',
        _id: normalized.sender?._id || normalized.sender || derivedOtherUser?._id,
      };
    }

    // Save to local DB
    if (dbInitialized) {
      await MessageDbService.saveMessage({
        _id: normalized._id,
        conversationId: normalized.conversationId || conversationId,
        content: normalized.content,
        senderId: normalized.sender._id || normalized.sender.id,
        senderName: normalized.sender.username || 'Unknown',
        createdAt: normalized.createdAt,
        status: normalized.status || 'sent',
        readBy: normalized.readBy || [],
        deliveredTo: normalized.deliveredTo || [],
      });
    }

    setMessages(prev => {
      const dup = prev.some(m =>
        (m._id && m._id === normalized._id) ||
        (m.tempId && m.tempId === normalized.tempId)
      );
      return dup ? prev : [...prev, normalized];
    });

    const sid = normalized.sender._id || normalized.sender.id;
    if (sid !== getCurrentUserId())
      setTimeout(() => markMessageAsRead(normalized._id), 500);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [getCurrentUserId, derivedOtherUser, dbInitialized, conversationId]);

  const normalizeMessage = useCallback((msg) => ({
    ...msg,
    readBy:             msg.readBy || [],
    readByUserIds:      (msg.readBy || []).map(r => r.user),
    deliveredToUserIds: (msg.deliveredTo || []).map(d =>
      typeof d === 'string' ? d : d.user),
  }), []);

  const updateMessageStatus = useCallback(async (identifier, messageData, status) => {
    setMessages(prev => prev.map(m => {
      if (m._id !== identifier && m.tempId !== identifier) return m;
      const updated = {
        ...m,
        ...(messageData ? normalizeMessage(messageData) : {}),
        status,
      };
      if (messageData?._id) delete updated.tempId;
      return updated;
    }));

    // Update local DB
    if (dbInitialized) {
      await MessageDbService.updateMessageStatus(identifier, status);
    }
  }, [normalizeMessage, dbInitialized]);

  const listData = useMemo(() => {
    const result = [];
    let lastDate = null;
    for (const msg of messages) {
      const d = new Date(msg.createdAt);
      const label = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
      if (label !== lastDate) {
        result.push({ type: 'date', id: `date_${msg._id}`, label });
        lastDate = label;
      }
      result.push({ type: 'message', ...msg });
    }
    return result;
  }, [messages]);

  // ── Send ──
  const sendMessage = useCallback(async () => {
    const content = newMessage.trim();
    if (!content || sending) return;

    if (!socketRef.current?.connected) {
      Alert.alert('Not connected', 'Check your connection and try again.');
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const uid    = getCurrentUserId();

    const tempMessage = {
      _id: tempId,
      tempId,
      content,
      sender: { _id: uid, id: uid, username: currentUser?.username, ...currentUser },
      createdAt: new Date().toISOString(),
      status: 'sending',
      messageType: 'text',
      readByUserIds: [],
      deliveredToUserIds: [],
      readBy: [],
      deliveredTo: [],
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setSending(true);

    // Save to local DB instantly
    if (dbInitialized) {
      await MessageDbService.saveMessage({
        _id: tempId,
        conversationId: conversationId,
        content: content,
        senderId: uid,
        senderName: currentUser?.username || 'You',
        createdAt: new Date().toISOString(),
        status: 'sending',
        tempId: tempId,
      });
    }

    try {
      socketRef.current.emit('send_message', {
        conversationId, content, messageType: 'text', tempId, chatType,
      });
      handleTyping(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setMessages(prev => prev.filter(m => m.tempId !== tempId));
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [newMessage, sending, getCurrentUserId, conversationId, chatType, currentUser, dbInitialized]);

  const handleTyping = useCallback((typing) => {
    if (!socketRef.current?.connected) return;
    setIsTyping(typing);
    socketRef.current.emit('typing', { conversationId, isTyping: typing });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (typing) typingTimeoutRef.current = setTimeout(() => handleTyping(false), 3000);
  }, [conversationId]);

  const markConversationAsRead = async () => {
    if (!token || !conversationId) return;
    try {
      await fetch(`${BASE_URL}/messages/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      // Update local DB
      if (dbInitialized) {
        await MessageDbService.markConversationMessagesRead(conversationId, getCurrentUserId());
      }
    } catch { /* silent */ }
  };

  const markMessageAsRead = (messageId) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('mark_read', { messageId, conversationId });
  };

  const loadMoreMessages = () => {
    if (hasMoreMessages && !loadingMore) loadMessages(page + 1, true);
  };

  const cleanup = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.disconnect();
  };

  // ── Long-press modal ──
  const openModal = useCallback((message) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMessage(message);
    setModalVisible(true);
    Animated.spring(modalAnim, { toValue: 1, useNativeDriver: true, tension: 160, friction: 9 }).start();
  }, [modalAnim]);

  const closeModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    Animated.timing(modalAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setModalVisible(false);
      setSelectedMessage(null);
    });
  }, [modalAnim]);

  const copyMessage = async () => {
    if (selectedMessage?.content) {
      try {
        await Clipboard.setString(selectedMessage.content);
        Alert.alert('Copied', 'Message copied to clipboard');
      } catch { Alert.alert('Error', 'Failed to copy'); }
    }
    closeModal();
  };

  const deleteMessage = () => {
    if (!selectedMessage?._id || deleting) return;
    Alert.alert('Delete Message', 'Delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setDeleting(true);
          try {
            const res = await fetch(`${BASE_URL}/messages/messages/${selectedMessage._id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (res.ok) {
              setMessages(prev => prev.filter(m => m._id !== selectedMessage._id));
              // Delete from local DB
              if (dbInitialized) {
                await MessageDbService.deleteMessage(selectedMessage._id);
              }
            } else {
              Alert.alert('Error', 'Failed to delete message');
            }
          } catch {
            Alert.alert('Error', 'Failed to delete message');
          } finally {
            setDeleting(false);
            closeModal();
          }
        },
      },
    ]);
  };

  // ── Three-dot menu ──
  const openMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuVisible(true);
    Animated.spring(menuAnim, { toValue: 1, useNativeDriver: true, tension: 160, friction: 9 }).start();
  };

  const closeMenu = () => {
    Animated.timing(menuAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() =>
      setMenuVisible(false)
    );
  };

  const blockUser = () => {
    if (!derivedOtherUser || blocking) return;
    Alert.alert('Block User', `Block ${derivedOtherUser.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block', style: 'destructive',
        onPress: async () => {
          setBlocking(true);
          closeMenu();
          try {
            const res = await fetch(
              `${BASE_URL}/users/block/${derivedOtherUser._id || derivedOtherUser.id}`,
              { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
            );
            if (res.ok) {
              Alert.alert('Blocked', 'User blocked.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            } else Alert.alert('Error', 'Failed to block user');
          } catch { Alert.alert('Error', 'Failed to block user'); }
          finally { setBlocking(false); }
        },
      },
    ]);
  };

  const reportUser = () => {
    if (!derivedOtherUser) return;
    closeMenu();
    Alert.alert('Report User', `Report ${derivedOtherUser.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report', style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(
              `${BASE_URL}/users/report/${derivedOtherUser._id || derivedOtherUser.id}`,
              {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'inappropriate_behavior', conversationId }),
              }
            );
            if (res.ok) Alert.alert('Reported', 'Thank you for the report.');
            else Alert.alert('Error', 'Failed to report user');
          } catch { Alert.alert('Error', 'Failed to report user'); }
        },
      },
    ]);
  };

  // ── Render item ──
  const renderItem = useCallback(({ item }) => {
    if (item.type === 'date') return <DateSeparator key={item.id} date={item.label} />;

    const uid     = String(getCurrentUserId() || '');
    const sid     = String(item.sender?._id || item.sender?.id || '');
    const isOwn   = sid === uid;
    const otherId = derivedOtherUser?._id || derivedOtherUser?.id;

    return (
      <MessageBubble
        key={item._id || item.tempId}
        message={item}
        isOwn={isOwn}
        otherUserId={otherId}
        onLongPress={openModal}
      />
    );
  }, [getCurrentUserId, derivedOtherUser, openModal]);

  const keyExtractor = useCallback((item) =>
    item.id || item._id || item.tempId, []);

  // ── Modals ──
  const LongPressModal = () => {
    if (!modalVisible || !selectedMessage) return null;
    const uid   = getCurrentUserId();
    const sid   = selectedMessage.sender?._id || selectedMessage.sender?.id;
    const isOwn = String(sid) === String(uid);

    return (
      <Modal transparent visible={modalVisible} onRequestClose={closeModal} animationType="none">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.overlayFull}>
            <TouchableWithoutFeedback>
              <Animated.View style={[
                styles.actionSheet,
                {
                  transform: [{ translateY: modalAnim.interpolate({ inputRange: [0,1], outputRange: [80, 0] }) }],
                  opacity: modalAnim,
                },
              ]}>
                <View style={styles.actionSheetPreview}>
                  <Text style={styles.actionSheetPreviewText} numberOfLines={2}>
                    {selectedMessage.content}
                  </Text>
                </View>

                <TouchableOpacity key="copy_action" style={styles.actionSheetItem} onPress={copyMessage}>
                  <View style={[styles.actionIcon, { backgroundColor: 'rgba(79,195,247,0.15)' }]}>
                    <Icon name="content-copy" size={18} color={C.blue} />
                  </View>
                  <Text style={styles.actionSheetLabel}>Copy message</Text>
                  <Icon name="chevron-right" size={20} color={C.textMeta} />
                </TouchableOpacity>

                {isOwn && (
                  <TouchableOpacity
                    key="delete_action"
                    style={styles.actionSheetItem}
                    onPress={deleteMessage}
                    disabled={deleting}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: 'rgba(224,82,82,0.15)' }]}>
                      <Icon name="delete-outline" size={18} color={C.danger} />
                    </View>
                    <Text style={[styles.actionSheetLabel, { color: C.danger }]}>
                      {deleting ? 'Deleting…' : 'Delete message'}
                    </Text>
                    <Icon name="chevron-right" size={20} color={C.textMeta} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity key="cancel_action" style={styles.actionSheetCancel} onPress={closeModal}>
                  <Text style={styles.actionSheetCancelText}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const MenuModal = () => {
    if (!menuVisible) return null;
    return (
      <Modal transparent visible={menuVisible} onRequestClose={closeMenu} animationType="none">
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.overlayFull}>
            <Animated.View style={[
              styles.dropMenu,
              {
                transform: [{ scale: menuAnim.interpolate({ inputRange: [0,1], outputRange: [0.85, 1] }) }],
                opacity: menuAnim,
              },
            ]}>
              <TouchableOpacity key="block_action" style={styles.dropMenuItem} onPress={blockUser} disabled={blocking}>
                <Icon name="block" size={18} color={C.warning} />
                <Text style={[styles.dropMenuLabel, { color: C.warning }]}>
                  {blocking ? 'Blocking…' : 'Block user'}
                </Text>
              </TouchableOpacity>
              <View style={styles.dropMenuDivider} />
              <TouchableOpacity key="report_action" style={styles.dropMenuItem} onPress={reportUser}>
                <Icon name="flag" size={18} color={C.danger} />
                <Text style={[styles.dropMenuLabel, { color: C.danger }]}>Report user</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // ── Loading screen ──
  if (loading || !initialLoadDone) {
    return (
      <View style={styles.root}>
        <StatusBar backgroundColor={C.headerBg} barStyle="light-content" translucent={false} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={22} color={C.white} />
            </TouchableOpacity>
            <View style={styles.headerMeta}>
              <View style={[styles.skelLine, { width: 120, height: 14, marginBottom: 6 }]} />
              <View style={[styles.skelLine, { width: 60, height: 10 }]} />
            </View>
          </View>
          <View style={styles.loadingBody}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={styles.loadingLabel}>Loading messages…</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Main render ──
  return (
    <View style={styles.root}>
      {/* Fixed background image — outside layout, never re-renders */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Image
          source={require('../../assets/chat-bg.jpg')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          fadeDuration={0}
        />
      </View>

      <StatusBar backgroundColor={C.headerBg} barStyle="light-content" translucent={false} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBack} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={22} color={C.white} />
            </TouchableOpacity>

            <View style={styles.headerAvatarWrap}>
              <Avatar user={derivedOtherUser} size={38} />
              {otherUserOnline && <View style={styles.onlineDot} />}
            </View>

            <View style={styles.headerMeta}>
              <Text style={styles.headerName} numberOfLines={1}>
                {derivedOtherUser?.username || 'Chat'}
              </Text>
              <Text style={styles.headerStatus}>
                {reconnecting
                  ? 'Reconnecting…'
                  : otherUserTyping
                    ? 'typing…'
                    : otherUserOnline
                      ? 'online'
                      : 'offline'}
              </Text>
            </View>

            <TouchableOpacity style={styles.headerMenu} onPress={openMenu}>
              <Icon name="more-vert" size={22} color={C.white} />
            </TouchableOpacity>
          </View>

          {reconnecting && (
            <View style={styles.reconnectBanner}>
              <ActivityIndicator size="small" color={C.white} style={{ marginRight: 8 }} />
              <Text style={styles.reconnectText}>Reconnecting…</Text>
            </View>
          )}

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={listData}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.4}
            ListHeaderComponent={
              loadingMore ? (
                <View style={styles.loadMoreRow}>
                  <ActivityIndicator size="small" color={C.accent} />
                  <Text style={styles.loadMoreLabel}>Loading older messages…</Text>
                </View>
              ) : null
            }
            ListFooterComponent={
              otherUserTyping && derivedOtherUser
                ? <TypingIndicator user={derivedOtherUser} />
                : <View style={{ height: 8 }} />
            }
            contentContainerStyle={styles.messageList}
            removeClippedSubviews={Platform.OS === 'android'}
            maxToRenderPerBatch={15}
            windowSize={21}
            initialNumToRender={20}
            style={{ flex: 1 }}
          />

          {/* Input bar */}
          <View style={styles.inputBar}>
            <View style={styles.inputWrap}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={newMessage}
                onChangeText={(text) => {
                  setNewMessage(text);
                  const hasText = text.trim().length > 0;
                  if (hasText && !isTyping) handleTyping(true);
                  else if (!hasText && isTyping) handleTyping(false);
                }}
                placeholder="Message"
                placeholderTextColor={C.textMeta}
                multiline
                maxLength={1000}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
                blurOnSubmit={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
              activeOpacity={0.8}
            >
              {sending
                ? <ActivityIndicator size="small" color={C.white} />
                : <Icon name="send" size={18} color={C.white} style={{ marginLeft: 2 }} />
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <LongPressModal />
      <MenuModal />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: C.headerBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerBack: {
    padding: 6,
    marginRight: 4,
  },
  headerAvatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.accent,
    borderWidth: 2,
    borderColor: C.headerBg,
  },
  headerMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 0.1,
  },
  headerStatus: {
    fontSize: 11,
    color: C.textMeta,
    marginTop: 1,
    textTransform: 'lowercase',
  },
  headerMenu: {
    padding: 8,
  },
  reconnectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7A3020',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  reconnectText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '500',
  },
  messageList: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-end',
    maxWidth: '82%',
  },
  bubbleRowOwn: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
    maxWidth: '100%',
    position: 'relative',
  },
  bubbleOwn: {
    backgroundColor: C.own,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: C.other,
    borderBottomLeftRadius: 4,
  },
  tail: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
  },
  tailOwn: {
    right: -6,
    borderTopWidth: 8,
    borderTopColor: C.own,
    borderLeftWidth: 8,
    borderLeftColor: 'transparent',
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  tailOther: {
    left: -6,
    borderTopWidth: 8,
    borderTopColor: C.other,
    borderRightWidth: 8,
    borderRightColor: 'transparent',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
    color: C.textPrimary,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
    gap: 4,
  },
  bubbleTime: {
    fontSize: 10,
    color: C.textMeta,
  },
  blueTickWrap: {
    backgroundColor: 'rgba(79,195,247,0.12)',
    borderRadius: 6,
    padding: 2,
  },
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: C.white,
    fontWeight: '700',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 6,
    gap: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.other,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.textSecondary,
  },
  dateSepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 4,
  },
  dateSepLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
  },
  dateSepPill: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  dateSepText: {
    fontSize: 11,
    color: C.textMeta,
    fontWeight: '500',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    backgroundColor: C.headerBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: C.textPrimary,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  sendBtnDisabled: {
    backgroundColor: C.accentMuted,
    elevation: 0,
    shadowOpacity: 0,
  },
  loadingBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLabel: {
    marginTop: 14,
    fontSize: 14,
    color: C.textSecondary,
  },
  skelLine: {
    backgroundColor: C.border,
    borderRadius: 4,
  },
  loadMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  loadMoreLabel: {
    fontSize: 12,
    color: C.textSecondary,
  },
  overlayFull: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: C.surfaceAlt,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  actionSheetPreview: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  actionSheetPreviewText: {
    fontSize: 13,
    color: C.textSecondary,
    fontStyle: 'italic',
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSheetLabel: {
    flex: 1,
    fontSize: 15,
    color: C.textPrimary,
    fontWeight: '500',
  },
  actionSheetCancel: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 14,
    backgroundColor: C.surface,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  actionSheetCancelText: {
    fontSize: 15,
    color: C.textSecondary,
    fontWeight: '600',
  },
  dropMenu: {
    position: 'absolute',
    top: 56,
    right: 14,
    backgroundColor: C.surface,
    borderRadius: 12,
    width: 190,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  dropMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  dropMenuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
  },
  dropMenuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginHorizontal: 12,
  },
});

export default ChatScreen;