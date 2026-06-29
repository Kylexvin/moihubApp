import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, LayoutAnimation } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import MessageDbService from '../../../services/MessageDbService';

const BASE_URL = 'https://moihub.onrender.com/api';

const smoothReorder = {
  duration: 220,
  create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
  update: { type: LayoutAnimation.Types.easeInEaseOut },
  delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
};

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
    _id: id,
    lastMessage,
    unreadCount,
    participants,
    lastMessageAt: c.lastMessageAt || c.updatedAt || '',
    chatType: c.chatType || 'normal',
  };
};

const sortConversations = (conversations) => {
  return [...conversations].sort((a, b) =>
    new Date(b.lastMessageAt || b.updatedAt || 0) - new Date(a.lastMessageAt || a.updatedAt || 0)
  );
};

export const useConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  const { currentUser, token, logout, isAuthenticated } = useAuth();
  const initialLoadDone = useRef(false);

  const setConversationsAnimated = useCallback((updater) => {
    LayoutAnimation.configureNext(smoothReorder);
    setConversations(updater);
  }, []);

  // DB init
  useEffect(() => {
    MessageDbService.init()
      .then(() => setDbInitialized(true))
      .catch(() => setDbInitialized(false));
  }, []);

  // Get other user
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
          _id: p._id || p.id,
          username: p.username || 'Unknown User',
          email: p.email || '',
          avatar: p.profilePicture || p.avatar || null,
        };
      }
    }
    return { _id: 'unknown', username: 'Unknown User' };
  }, [currentUser]);

  // Sync with server
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
        const sorted = sortConversations(valid);
        setConversationsAnimated(() => sorted);
        return valid;
      } else if (res.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.', [{ text: 'OK', onPress: logout }]);
      }
    } catch { /* silent */ }
    return [];
  }, [token, logout, currentUser, dbInitialized, setConversationsAnimated]);

  // Load local then sync
  const loadConversations = useCallback(async () => {
    setLoading(true);

    if (dbInitialized) {
      try {
        const local = await MessageDbService.getConversations();
        if (local?.length) {
          const normalized = local.map(c => normalizeConversation(c, currentUser?._id));
          const sorted = sortConversations(normalized);
          setConversations(sorted);
        }
      } catch { /* silent */ }
    }

    await syncWithServer();
    setLoading(false);
    initialLoadDone.current = true;
  }, [dbInitialized, currentUser, syncWithServer]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId) => {
    setDeletingId(conversationId);
    try {
      const res = await fetch(`${BASE_URL}/messages/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        if (dbInitialized) await MessageDbService.deleteConversation(conversationId);
        setConversationsAnimated(prev => prev.filter(c => c._id !== conversationId));
        return true;
      } else if (res.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.', [{ text: 'OK', onPress: logout }]);
        return false;
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'Failed to delete conversation');
        return false;
      }
    } catch {
      Alert.alert('Error', 'Failed to delete conversation');
      return false;
    } finally {
      setDeletingId(null);
    }
  }, [token, logout, dbInitialized, setConversationsAnimated]);

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await syncWithServer();
    setRefreshing(false);
  }, [syncWithServer]);

  // Auto-load on focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && token && dbInitialized && !initialLoadDone.current) {
        loadConversations();
      }
    }, [isAuthenticated, token, dbInitialized, loadConversations])
  );

  return {
    conversations,
    setConversations,
    setConversationsAnimated,
    loading,
    refreshing,
    dbInitialized,
    deletingId,
    getOtherUser,
    loadConversations,
    syncWithServer,
    deleteConversation,
    onRefresh,
  };
};