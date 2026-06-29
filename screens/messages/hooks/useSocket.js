import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import MessageDbService from '../../../services/MessageDbService';

const SOCKET_URL = 'https://moihub.onrender.com';

export const useSocket = ({
  onNewMessage,
  onConversationUpdated,
  onMessageRead,
  dbInitialized,
}) => {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});
  
  const socketRef = useRef(null);
  const { currentUser, token, isAuthenticated } = useAuth();

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
    sock.on('disconnect', () => setConnectionState('disconnected'));
    sock.on('connect_error', () => setConnectionState('error'));

    sock.on('new_message', (message) => {
      onNewMessage?.(message);
    });
    sock.on('new_system_message', (message) => {
      onNewMessage?.(message);
    });

    sock.on('conversation_updated', (updated) => {
      onConversationUpdated?.(updated);
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
      onMessageRead?.(conversationId);
      if (dbInitialized) MessageDbService.resetUnreadCount(conversationId);
    });

    socketRef.current = sock;
    return () => sock.disconnect();
  }, [isAuthenticated, token, currentUser, dbInitialized, onNewMessage, onConversationUpdated, onMessageRead]);

  const emitTyping = useCallback((conversationId, isTyping) => {
    socketRef.current?.emit('typing', { conversationId, isTyping });
  }, []);

  const emitRead = useCallback((conversationId) => {
    socketRef.current?.emit('read', { conversationId });
  }, []);

  return {
    connectionState,
    onlineUsers,
    typingUsers,
    socketRef,
    emitTyping,
    emitRead,
  };
};