// screens/messages/ChatListScreen.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
  Modal,
  StatusBar,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import io from 'socket.io-client';
import MessageDbService from '../../services/MessageDbService';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Smooth reorder animation config — subtle, not bouncy
const smoothReorder = {
  duration: 220,
  create:  { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  update:  { type: LayoutAnimation.Types.easeInEaseOut },
  delete:  { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
};

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:           '#07201A',
  surface:      '#0D2E24',
  surfaceAlt:   '#0A2820',
  headerBg:     '#092318',
  own:          '#1B5E3B',
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
  overlay:      'rgba(4,14,10,0.82)',
  linkme:       '#C026D3',
  linkmeLight:  '#1A0820',
  system:       '#2563EB',
  systemLight:  '#0D1B3E',
};

const BASE_URL   = 'https://moihub.onrender.com/api';
const SOCKET_URL = 'https://moihub.onrender.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const avatarPalette = ['#1B6B45','#2D5A8E','#7B3FA0','#B05A1A','#2E7D6B','#6B3A1B','#1B4A6B'];

const getAvatarColor = (username) => {
  if (!username) return avatarPalette[0];
  return avatarPalette[username.charCodeAt(0) % avatarPalette.length];
};

const getInitial = (username) => (username || '?')[0].toUpperCase();

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date   = new Date(timestamp);
  const now    = new Date();
  const diffMs = now - date;
  const diffH  = diffMs / (1000 * 60 * 60);
  const diffD  = diffMs / (1000 * 60 * 60 * 24);
  if (diffH < 1)  return `${Math.floor(diffMs / (1000 * 60))}m`;
  if (diffH < 24) return `${Math.floor(diffH)}h`;
  if (diffD < 7)  return `${Math.floor(diffD)}d`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// Always returns a string regardless of what lastMessage is
const getPreviewText = (lastMessage, n = 40) => {
  if (!lastMessage) return '';
  const str = typeof lastMessage === 'string'
    ? lastMessage
    : (lastMessage?.content || '');
  return str.length > n ? str.substring(0, n) + '…' : str;
};

// Normalize a raw conversation from either SQLite or API into a stable shape
const normalizeConversation = (c, currentUserId) => {
  const id = (c._id || c.id || '').toString();
  const lastMessage = typeof c.lastMessage === 'string'
    ? c.lastMessage
    : (c.lastMessage?.content || '');
  const unreadCount =
    typeof c.unreadCount === 'number' ? c.unreadCount :
    Array.isArray(c.unreadCount)
      ? c.unreadCount.find(u => u.user === currentUserId)?.count || 0
      : 0;
  const participants = Array.isArray(c.participants)
    ? c.participants
    : (typeof c.participants === 'string' ? JSON.parse(c.participants) : []);

  return {
    ...c,
    // Always _id, never id — FlatList key is always stable
    _id: id,
    lastMessage,
    unreadCount,
    participants,
    lastMessageAt: c.lastMessageAt || c.updatedAt || '',
    chatType: c.chatType || 'normal',
  };
};

// Sort conversations by lastMessageAt (newest first)
const sortConversations = (conversations) => {
  return [...conversations].sort((a, b) => 
    new Date(b.lastMessageAt || b.updatedAt || 0) - new Date(a.lastMessageAt || a.updatedAt || 0)
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const ConversationAvatar = React.memo(({ user, isSystem, isLinkMe, isOnline }) => {
  const bg = isSystem ? C.systemLight : getAvatarColor(user?.username);
  return (
    <View style={styles.avatarWrap}>
      <View style={[
        styles.avatarCircle,
        { backgroundColor: bg },
        isSystem && styles.avatarSystem,
        isLinkMe && styles.avatarLinkMe,
      ]}>
        {isSystem
          ? <Icon name="notifications" size={22} color={C.system} />
          : <Text style={styles.avatarInitial}>{getInitial(user?.username)}</Text>
        }
        {isLinkMe && (
          <View style={styles.linkMeBadge}>
            <Text style={styles.linkMeBadgeText}>💘</Text>
          </View>
        )}
      </View>
      {!isSystem && isOnline && <View style={styles.onlineDot} />}
    </View>
  );
});

// ─── Conversation row ─────────────────────────────────────────────────────────
const ConversationRow = React.memo(({
  item, otherUser, isOnline, typingText, isDeleting, onPress, onLongPress,
}) => {
  const isLinkMe = item.chatType === 'linkme';
  const isSystem = item.chatType === 'system';
  const preview  = typingText || getPreviewText(item.lastMessage) || 'No messages yet';

  if (isDeleting) {
    return (
      <View style={[styles.rowCard, { opacity: 0.45 }]}>
        <ActivityIndicator color={C.accent} style={{ marginRight: 14 }} />
        <Text style={styles.deletingText}>Deleting…</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.rowCard,
        isLinkMe && styles.rowCardLinkMe,
        isSystem && styles.rowCardSystem,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={420}
      activeOpacity={0.72}
    >
      <ConversationAvatar
        user={otherUser}
        isSystem={isSystem}
        isLinkMe={isLinkMe}
        isOnline={isOnline}
      />
      <View style={styles.rowInfo}>
        <View style={styles.rowTop}>
          <Text style={[
            styles.rowName,
            isLinkMe && { color: '#E879F9' },
            isSystem && { color: C.blue },
          ]} numberOfLines={1}>
            {otherUser?.username || 'Unknown User'}
            {isSystem ? ' · System' : ''}
          </Text>
          <Text style={[styles.rowTime, isSystem && { color: '#93C5FD' }]}>
            {formatTime(item.lastMessageAt)}
          </Text>
        </View>
        <View style={styles.rowBottom}>
          <Text style={[
            styles.rowPreview,
            typingText && styles.rowTyping,
            isSystem && styles.rowPreviewSystem,
          ]} numberOfLines={1}>
            {preview}
          </Text>
          {item.unreadCount > 0 && (
            <View style={[
              styles.unreadBadge,
              isLinkMe && { backgroundColor: C.linkme },
              isSystem && { backgroundColor: C.system },
            ]}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prev, next) => {
  // Custom comparison — only re-render if these specific fields changed
  return (
    prev.item._id           === next.item._id &&
    prev.item.lastMessage   === next.item.lastMessage &&
    prev.item.lastMessageAt === next.item.lastMessageAt &&
    prev.item.unreadCount   === next.item.unreadCount &&
    prev.isOnline           === next.isOnline &&
    prev.typingText         === next.typingText &&
    prev.isDeleting         === next.isDeleting &&
    prev.otherUser?.username === next.otherUser?.username
  );
});

// ─── Main screen ──────────────────────────────────────────────────────────────
const ChatListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [conversations,         setConversations]         = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchQuery,           setSearchQuery]           = useState('');
  const [loading,               setLoading]               = useState(true);
  const [refreshing,            setRefreshing]            = useState(false);
  const [connectionState,       setConnectionState]       = useState('disconnected');
  const [onlineUsers,           setOnlineUsers]           = useState(new Set());
  const [typingUsers,           setTypingUsers]           = useState({});
  const [activeTab,             setActiveTab]             = useState('all');
  const [actionSheetVisible,    setActionSheetVisible]    = useState(false);
  const [selectedConversation,  setSelectedConversation]  = useState(null);
  const [deletingId,            setDeletingId]            = useState(null);
  const [dbInitialized,         setDbInitialized]         = useState(false);

  const sheetAnim = useRef(new Animated.Value(0)).current;
  const socketRef = useRef(null);
  const { currentUser, token, logout, isAuthenticated } = useAuth();

  // Stable setter that applies LayoutAnimation before mutating list state
  const setConversationsAnimated = useCallback((updater) => {
    LayoutAnimation.configureNext(smoothReorder);
    setConversations(updater);
  }, []);

  // ── DB init ──
  useEffect(() => {
    MessageDbService.init()
      .then(() => setDbInitialized(true))
      .catch(() => setDbInitialized(false));
  }, []);

  // ── getOtherUser — handles both API (_id) and SQLite (id) rows ──
  const getOtherUser = useCallback((conv) => {
    if (conv?.chatType === 'system') {
      return { _id: 'system', username: 'MoiHub', isSystem: true };
    }
    const uid = (currentUser?._id || currentUser?.userId)?.toString();
    if (!uid || !Array.isArray(conv?.participants)) {
      return { _id: 'unknown', username: 'Unknown User' };
    }
    for (const p of conv.participants) {
      const pid = (p?._id || p?.id)?.toString();
      if (pid && pid !== uid) {
        return {
          _id:      p._id || p.id,
          username: p.username || 'Unknown User',
          email:    p.email || '',
          avatar:   p.profilePicture || p.avatar || null,
        };
      }
    }
    return { _id: 'unknown', username: 'Unknown User' };
  }, [currentUser]);

  // ── Load local then sync ──
  const loadConversations = useCallback(async () => {
    setLoading(true);

    if (dbInitialized) {
      try {
        const local = await MessageDbService.getConversations();
        if (local?.length) {
          const normalized = local.map(c => normalizeConversation(c, currentUser?._id));
          // Sort by newest first
          const sorted = sortConversations(normalized);
          setConversations(sorted);
        }
      } catch { /* silent */ }
    }

    await syncWithServer();
    setLoading(false);
  }, [dbInitialized, currentUser]);

  const syncWithServer = useCallback(async () => {
    if (!token) { logout(); return; }
    try {
      const res = await fetch(`${BASE_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const valid = data
          .filter(c => {
            if (!c._id) return false;
            if (!Array.isArray(c.participants) || !c.participants.length) {
              return c.chatType === 'system';
            }
            return true;
          })
          .map(c => normalizeConversation(c, currentUser?._id));

        if (dbInitialized) {
          for (const conv of valid) await MessageDbService.saveConversation(conv);
        }
        // Sort and animate the sync update
        const sorted = sortConversations(valid);
        setConversationsAnimated(() => sorted);
      } else if (res.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.', [{ text: 'OK', onPress: logout }]);
      }
    } catch { /* silent */ }
  }, [token, logout, currentUser, dbInitialized, setConversationsAnimated]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && token && dbInitialized) loadConversations();
    }, [isAuthenticated, token, dbInitialized, loadConversations])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncWithServer();
    setRefreshing(false);
  }, [syncWithServer]);

  // ── Socket ──
  useEffect(() => {
    if (!isAuthenticated || !token || !currentUser) return;

    const sock = io(SOCKET_URL, {
      auth: { token, userId: currentUser._id },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    sock.on('connect', () => {
      setConnectionState('connected');
      if (currentUser?._id) sock.emit('join_user_room', currentUser._id);
    });
    sock.on('disconnect',    () => setConnectionState('disconnected'));
    sock.on('connect_error', () => setConnectionState('error'));

    sock.on('new_message',        handleNewMessage);
    sock.on('new_system_message', handleNewMessage);

    sock.on('conversation_updated', (updated) => {
      const normalized = normalizeConversation(updated, currentUser._id);
      setConversationsAnimated(prev => {
        const updatedList = prev.map(c => c._id === normalized._id ? normalized : c);
        return sortConversations(updatedList);
      });
      if (dbInitialized) MessageDbService.saveConversation(normalized);
    });

    sock.on('user_status_changed', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const s = new Set(prev);
        status === 'online' ? s.add(userId) : s.delete(userId);
        return s;
      });
    });

    sock.on('user_typing', ({ conversationId, userId, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: isTyping ? { userId } : null,
      }));
    });

    sock.on('message_read', ({ conversationId }) => {
      setConversations(prev => {
        const updated = prev.map(c => c._id === conversationId
          ? { ...c, unreadCount: Math.max(0, (c.unreadCount || 1) - 1) }
          : c
        );
        return sortConversations(updated);
      });
      if (dbInitialized) MessageDbService.resetUnreadCount(conversationId);
    });

    socketRef.current = sock;
    return () => sock.disconnect();
  }, [isAuthenticated, token, currentUser, dbInitialized]);

  const handleNewMessage = useCallback(async (message) => {
    const convId  = message.conversation || message.conversationId;
    const content = message.content || '';
    const sid     = typeof message.sender === 'object' ? message.sender._id : message.sender;
    const isOther = sid !== currentUser?._id;

    if (dbInitialized) {
      await MessageDbService.saveMessage({
        _id:            message._id,
        conversationId: convId,
        content,
        senderId:       sid,
        senderName:     message.sender?.username || 'Unknown',
        createdAt:      message.createdAt,
        status:         'sent',
      });
    }

    setConversationsAnimated(prev => {
      const updated = prev.map(conv => {
        if (conv._id !== convId) return conv;
        return {
          ...conv,
          lastMessage:         content,
          lastMessageAt:       message.createdAt,
          lastMessageSenderId: sid,
          unreadCount: isOther ? (conv.unreadCount || 0) + 1 : conv.unreadCount,
        };
      });
      return sortConversations(updated);
    });
  }, [currentUser, dbInitialized, setConversationsAnimated]);

  // ── Filter ──
  useEffect(() => {
    let list = conversations;
    if (activeTab === 'linkme') list = list.filter(c => c.chatType === 'linkme');
    else if (activeTab === 'system') list = list.filter(c => c.chatType === 'system');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(conv => {
        if (conv.chatType === 'system') {
          return getPreviewText(conv.lastMessage).toLowerCase().includes(q) ||
                 conv.metadata?.title?.toLowerCase().includes(q);
        }
        const other = getOtherUser(conv);
        return (
          other?.username?.toLowerCase().includes(q) ||
          other?.email?.toLowerCase().includes(q) ||
          getPreviewText(conv.lastMessage).toLowerCase().includes(q)
        );
      });
    }
    setFilteredConversations(list);
  }, [searchQuery, conversations, activeTab, getOtherUser]);

  // ── Action sheet ──
  const openActionSheet = useCallback((conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedConversation(conversation);
    setActionSheetVisible(true);
    Animated.spring(sheetAnim, {
      toValue: 1, useNativeDriver: true, tension: 160, friction: 9,
    }).start();
  }, [sheetAnim]);

  const closeActionSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    Animated.timing(sheetAnim, {
      toValue: 0, duration: 180, useNativeDriver: true,
    }).start(() => {
      setActionSheetVisible(false);
      setSelectedConversation(null);
    });
  }, [sheetAnim]);

  const confirmDelete = async () => {
    if (!selectedConversation) return;
    const id = selectedConversation._id;
    closeActionSheet();
    setDeletingId(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      const res = await fetch(`${BASE_URL}/messages/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        if (dbInitialized) await MessageDbService.deleteConversation(id);
        setConversationsAnimated(prev => prev.filter(c => c._id !== id));
      } else if (res.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.', [{ text: 'OK', onPress: logout }]);
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'Failed to delete conversation');
      }
    } catch {
      Alert.alert('Error', 'Failed to delete conversation');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render item ──
  const renderItem = useCallback(({ item }) => {
    const otherUser  = getOtherUser(item);
    const isOnline   = onlineUsers.has(String(otherUser?._id));
    const typing     = typingUsers[item._id];
    const typingText = typing && typing.userId !== currentUser?._id ? 'typing…' : null;
    const isDeleting = deletingId === item._id;

    return (
      <ConversationRow
        item={item}
        otherUser={otherUser}
        isOnline={isOnline}
        typingText={typingText}
        isDeleting={isDeleting}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('ChatScreen', {
            conversationId: item._id,
            conversation:   item,
            otherUser,
            chatType:       item.chatType || 'normal',
          });
        }}
        onLongPress={() => openActionSheet(item)}
      />
    );
  }, [getOtherUser, onlineUsers, typingUsers, currentUser, deletingId, navigation, openActionSheet]);

  // Stable string key — always item._id after normalization
  const keyExtractor = useCallback((item) => item._id, []);

  // ── Tabs ──
  const TABS = [
    { key: 'all',    label: 'All',    icon: null },
    { key: 'linkme', label: 'LinkMe', icon: '💘' },
    { key: 'system', label: 'System', icon: 'notifications' },
  ];

  const tabCount = useMemo(() => ({
    all:    conversations.length,
    linkme: conversations.filter(c => c.chatType === 'linkme').length,
    system: conversations.filter(c => c.chatType === 'system').length,
  }), [conversations]);

  // ── Empty ──
  const renderEmpty = useCallback(() => {
    const copy = {
      linkme: { title: 'No LinkMe chats',         sub: 'Your matches will appear here' },
      system: { title: 'No system notifications', sub: 'System announcements will appear here' },
      all:    { title: 'No conversations yet',    sub: 'Tap + to start a new conversation' },
    };
    const { title, sub } = copy[activeTab] || copy.all;
    return (
      <View style={styles.emptyWrap}>
        {activeTab === 'system'
          ? <Icon name="notifications-none" size={60} color={C.textMeta} />
          : activeTab === 'linkme'
            ? <Text style={{ fontSize: 60 }}>💘</Text>
            : <Icon name="chat-bubble-outline" size={60} color={C.textMeta} />
        }
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySub}>{sub}</Text>
      </View>
    );
  }, [activeTab]);

  // ── Loading ──
  if (loading && !dbInitialized) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar backgroundColor={C.headerBg} barStyle="light-content" translucent={false} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={styles.loadingText}>Loading conversations…</Text>
        </View>
      </View>
    );
  }

  // ── Main ──
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor={C.headerBg} barStyle="light-content" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={[styles.connPill, connectionState === 'connected' && styles.connPillOnline]}>
          <View style={[styles.connDot, connectionState === 'connected' && styles.connDotOnline]} />
          <Text style={[styles.connText, connectionState === 'connected' && styles.connTextOnline]}>
            {connectionState === 'connected' ? 'Online' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Icon name="search" size={18} color={C.textMeta} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations…"
          placeholderTextColor={C.textMeta}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="clear" size={18} color={C.textMeta} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <View style={styles.tabsContainer}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            const count  = tabCount[tab.key];
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.key);
                }}
              >
                <View style={styles.tabInner}>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                  {tab.icon === 'notifications'
                    ? <Icon name="notifications" size={13} color={active ? C.blue : C.textMeta} style={{ marginLeft: 4 }} />
                    : tab.icon
                      ? <Text style={{ fontSize: 13, marginLeft: 4 }}>{tab.icon}</Text>
                      : null
                  }
                  {count > 0 && (
                    <View style={[styles.tabCount, active && styles.tabCountActive]}>
                      <Text style={styles.tabCountText}>{count}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.accent}
            colors={[C.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          filteredConversations.length === 0 && { flexGrow: 1 },
        ]}
        removeClippedSubviews={Platform.OS === 'android'}
        maxToRenderPerBatch={12}
        windowSize={10}
        initialNumToRender={12}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate('NewChatScreen');
        }}
        activeOpacity={0.85}
      >
        <Icon name="edit" size={22} color={C.white} />
      </TouchableOpacity>

      {/* Action sheet */}
      <Modal
        visible={actionSheetVisible}
        transparent
        animationType="none"
        onRequestClose={closeActionSheet}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={closeActionSheet}
        >
          <Animated.View
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + 20 },
              {
                transform: [{
                  translateY: sheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                }],
                opacity: sheetAnim,
              },
            ]}
          >
            {selectedConversation && (() => {
              const other = getOtherUser(selectedConversation);
              return (
                <View style={styles.sheetPreview}>
                  <View style={[
                    styles.sheetPreviewAvatar,
                    { backgroundColor: getAvatarColor(other?.username) },
                  ]}>
                    <Text style={styles.sheetPreviewInitial}>
                      {getInitial(other?.username)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetPreviewName}>{other?.username || 'Unknown'}</Text>
                    <Text style={styles.sheetPreviewSub} numberOfLines={1}>
                      {getPreviewText(selectedConversation.lastMessage, 36) || 'No messages yet'}
                    </Text>
                  </View>
                </View>
              );
            })()}

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                if (!selectedConversation) return;
                const other = getOtherUser(selectedConversation);
                closeActionSheet();
                setTimeout(() => {
                  navigation.navigate('ChatScreen', {
                    conversationId: selectedConversation._id,
                    conversation:   selectedConversation,
                    otherUser:      other,
                    chatType:       selectedConversation.chatType || 'normal',
                  });
                }, 220);
              }}
            >
              <View style={[styles.sheetIconWrap, { backgroundColor: 'rgba(52,201,122,0.14)' }]}>
                <Icon name="chat-bubble-outline" size={18} color={C.accent} />
              </View>
              <Text style={styles.sheetItemLabel}>Open chat</Text>
              <Icon name="chevron-right" size={20} color={C.textMeta} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetItem} onPress={confirmDelete}>
              <View style={[styles.sheetIconWrap, { backgroundColor: 'rgba(224,82,82,0.14)' }]}>
                <Icon name="delete-outline" size={18} color={C.danger} />
              </View>
              <Text style={[styles.sheetItemLabel, { color: C.danger }]}>Delete conversation</Text>
              <Icon name="chevron-right" size={20} color={C.textMeta} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCancel} onPress={closeActionSheet}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.headerBg,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: C.textPrimary, letterSpacing: 0.2 },
  connPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: 'rgba(224,82,82,0.15)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(224,82,82,0.3)',
  },
  connPillOnline: { backgroundColor: 'rgba(52,201,122,0.12)', borderColor: 'rgba(52,201,122,0.3)' },
  connDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: C.danger, marginRight: 5 },
  connDotOnline:  { backgroundColor: C.accent },
  connText:       { fontSize: 11, color: C.danger, fontWeight: '600' },
  connTextOnline: { color: C.accent },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, marginHorizontal: 14, marginTop: 10, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: C.textPrimary },

  tabsRow: {
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
    paddingVertical: 6, backgroundColor: C.bg,
  },
  tabsContainer:  { flexDirection: 'row', paddingHorizontal: 12 },
  tab:            { paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 4, borderRadius: 20 },
  tabActive:      { backgroundColor: C.own },
  tabInner:       { flexDirection: 'row', alignItems: 'center' },
  tabLabel:       { fontSize: 13, fontWeight: '500', color: C.textMeta },
  tabLabelActive: { color: C.textPrimary, fontWeight: '700' },
  tabCount:       { marginLeft: 5, backgroundColor: C.border, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  tabCountActive: { backgroundColor: 'rgb(7, 0, 0)' },
  tabCountText:   { fontSize: 10, color: C.textMeta, fontWeight: '600' },

  listContent: { paddingTop: 8, paddingBottom: 88 },

  rowCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 11,
    marginHorizontal: 12, marginVertical: 3,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.border,
  },
  rowCardLinkMe: {
    backgroundColor: C.linkmeLight, borderLeftWidth: 3,
    borderLeftColor: C.linkme, borderColor: 'rgba(192,38,211,0.3)',
  },
  rowCardSystem: {
    backgroundColor: C.systemLight, borderLeftWidth: 3,
    borderLeftColor: C.system, borderColor: 'rgba(37,99,235,0.3)',
  },
  deletingText: { fontSize: 14, color: C.textMeta, fontStyle: 'italic' },

  avatarWrap:      { position: 'relative', marginRight: 12 },
  avatarCircle:    { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarSystem:    { borderWidth: 1.5, borderColor: C.system },
  avatarLinkMe:    { borderWidth: 1.5, borderColor: C.linkme },
  avatarInitial:   { color: C.white, fontSize: 19, fontWeight: '700' },
  linkMeBadge: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: C.bg, borderRadius: 9,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
  },
  linkMeBadgeText: { fontSize: 11 },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 11, height: 11, borderRadius: 5.5,
    backgroundColor: C.accent, borderWidth: 2, borderColor: C.surface,
  },

  rowInfo:         { flex: 1, justifyContent: 'center' },
  rowTop:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  rowName:         { fontSize: 15, fontWeight: '600', color: C.textPrimary, flex: 1, marginRight: 8 },
  rowTime:         { fontSize: 11, color: C.textMeta },
  rowBottom:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowPreview:      { fontSize: 13, color: C.textSecondary, flex: 1, marginRight: 8 },
  rowTyping:       { color: C.accent, fontStyle: 'italic' },
  rowPreviewSystem:{ color: '#93C5FD', fontStyle: 'italic' },
  unreadBadge: {
    backgroundColor: C.accent, borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  unreadText: { color: C.white, fontSize: 10, fontWeight: '700' },

  fab: {
    position: 'absolute', right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center',
    elevation: 6,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 6,
  },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { fontSize: 14, color: C.textSecondary },
  emptyWrap:   { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  emptyTitle:  { fontSize: 18, fontWeight: '600', color: C.textSecondary, marginTop: 8 },
  emptySub:    { fontSize: 14, color: C.textMeta, textAlign: 'center', lineHeight: 20 },

  sheetOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surfaceAlt,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth, borderColor: C.border,
    overflow: 'hidden',
  },
  sheetPreview: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
    backgroundColor: C.surface, gap: 12,
  },
  sheetPreviewAvatar:  { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sheetPreviewInitial: { color: C.white, fontSize: 17, fontWeight: '700' },
  sheetPreviewName:    { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  sheetPreviewSub:     { fontSize: 12, color: C.textMeta, marginTop: 1 },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, gap: 14,
  },
  sheetIconWrap:  { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  sheetItemLabel: { flex: 1, fontSize: 15, color: C.textPrimary, fontWeight: '500' },
  sheetCancel: {
    marginHorizontal: 20, marginTop: 6, paddingVertical: 14,
    backgroundColor: C.surface, borderRadius: 14, alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.border,
  },
  sheetCancelText: { fontSize: 15, color: C.textSecondary, fontWeight: '600' },
});

export default ChatListScreen;