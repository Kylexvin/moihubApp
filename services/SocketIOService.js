import React, { useEffect, useState, useContext, createContext } from 'react';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://192.168.100.51:5000/api';
const socketUrl = API_URL; 

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated, currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});

  // Event listeners that can be subscribed to from components
  const [eventListeners, setEventListeners] = useState({
    new_message: [],
    user_status_changed: [],
    user_typing: [],
    user_stopped_typing: [],
    message_read: [],
    message_sent: [],
    message_delivered: [],
    conversation_updated: [],
    socket_reconnected: [],
    socket_disconnected: [],
    error: [],
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      establishConnection();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const establishConnection = async () => {
    try {
      const socketIO = io(socketUrl, {
        auth: {
          token: `Bearer ${token}`,
        },
        transports: ['websocket'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      
      setSocket(socketIO);

      // Connection events
      socketIO.on('connect', () => {
        console.log('Socket connected with ID:', socketIO.id);
        setConnectionState('connected');
        
        // Send queued messages on reconnect
        sendQueuedMessages();
        
        // Join user's personal room for notifications
        if (currentUser?._id) {
          socketIO.emit('join_user_room', currentUser._id);
        }
      });

      socketIO.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setConnectionState('disconnected');
        emitToListeners('socket_disconnected', { reason });
      });

      socketIO.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setConnectionState('error');
        emitToListeners('error', { type: 'connection_error', error: err });
      });

      socketIO.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        setConnectionState('connected');
        emitToListeners('socket_reconnected', { attemptNumber });
      });

      socketIO.on('reconnect_error', (err) => {
        console.error('Socket reconnection error:', err);
        emitToListeners('error', { type: 'reconnection_error', error: err });
      });

      socketIO.on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
        setConnectionState('error');
        emitToListeners('error', { type: 'reconnection_failed' });
      });

      // Message events
      socketIO.on('new_message', (message) => {
        console.log('New Message received:', message);
        emitToListeners('new_message', message);
      });

      socketIO.on('message_sent', (data) => {
        console.log('Message sent confirmation:', data);
        emitToListeners('message_sent', data);
      });

      socketIO.on('message_delivered', (data) => {
        console.log('Message delivered:', data);
        emitToListeners('message_delivered', data);
      });

      socketIO.on('message_read', (data) => {
        console.log('Message read receipt:', data);
        emitToListeners('message_read', data);
      });

      // Typing events
      socketIO.on('user_typing', (data) => {
        console.log('User typing:', data);
        setTypingUsers(prev => ({
          ...prev,
          [data.conversationId]: data.isTyping ? {
            userId: data.userId,
            username: data.username
          } : null
        }));
        emitToListeners('user_typing', data);
      });

      socketIO.on('user_stopped_typing', (data) => {
        console.log('User stopped typing:', data);
        setTypingUsers(prev => {
          const updated = { ...prev };
          delete updated[data.conversationId];
          return updated;
        });
        emitToListeners('user_stopped_typing', data);
        // Also emit to user_typing listeners with isTyping: false for compatibility
        emitToListeners('user_typing', { ...data, isTyping: false });
      });

      // Online status events
      socketIO.on('user_status_changed', (data) => {
        console.log('User status changed:', data);
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          if (data.status === 'online') {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
        emitToListeners('user_status_changed', data);
      });

      // Conversation events
      socketIO.on('conversation_updated', (conversation) => {
        console.log('Conversation updated:', conversation);
        emitToListeners('conversation_updated', conversation);
      });

      // Error handling
      socketIO.on('error', (error) => {
        console.error('Socket error:', error);
        emitToListeners('error', { type: 'socket_error', error });
      });

      // Additional backend-specific events
      socketIO.on('socket_disconnected', () => {
        console.log('Server notified socket disconnected');
        setConnectionState('disconnected');
        emitToListeners('socket_disconnected', {});
      });

      socketIO.on('socket_reconnected', () => {
        console.log('Server notified socket reconnected');
        setConnectionState('connected');
        emitToListeners('socket_reconnected', {});
      });

    } catch (error) {
      console.error('Error establishing socket connection:', error);
      setConnectionState('error');
      emitToListeners('error', { type: 'establishment_error', error });
    }
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setConnectionState('disconnected');
      setOnlineUsers(new Set());
      setTypingUsers({});
    }
  };

  const sendMessage = (messageData) => {
    if (connectionState === 'connected' && socket) {
      console.log('Sending message:', messageData);
      socket.emit('send_message', messageData);
    } else {
      console.log('Queueing message for later sending:', messageData);
      setOfflineQueue((prevQueue) => [...prevQueue, { type: 'send_message', data: messageData }]);
    }
  };

  const sendQueuedMessages = () => {
    if (offlineQueue.length > 0 && connectionState === 'connected' && socket) {
      console.log('Sending queued messages:', offlineQueue.length);
      offlineQueue.forEach((queuedItem) => {
        socket.emit(queuedItem.type, queuedItem.data);
      });
      setOfflineQueue([]);
    }
  };

  const markTyping = (conversationId, isTyping = true) => {
    if (connectionState === 'connected' && socket && currentUser?._id) {
      console.log('Sending typing indicator:', { conversationId, isTyping });
      socket.emit('typing', {
        conversationId,
        userId: currentUser._id,
        isTyping
      });
    }
  };

  const markRead = (messageId, conversationId) => {
    const readData = {
      messageId,
      conversationId,
      userId: currentUser?._id
    };

    if (connectionState === 'connected' && socket) {
      console.log('Marking message as read:', readData);
      socket.emit('mark_read', readData);
    } else {
      console.log('Queueing mark_read for later:', readData);
      setOfflineQueue((prevQueue) => [...prevQueue, { 
        type: 'mark_read', 
        data: readData 
      }]);
    }
  };

  const joinConversation = (conversationId) => {
    if (connectionState === 'connected' && socket) {
      console.log('Joining conversation:', conversationId);
      socket.emit('join_conversation', { conversationId });
    }
  };

  const leaveConversation = (conversationId) => {
    if (connectionState === 'connected' && socket) {
      console.log('Leaving conversation:', conversationId);
      socket.emit('leave_conversation', { conversationId });
    }
  };

  const joinUserRoom = (userId = null) => {
    const userIdToJoin = userId || currentUser?._id;
    if (connectionState === 'connected' && socket && userIdToJoin) {
      console.log('Joining user room:', userIdToJoin);
      socket.emit('join_user_room', userIdToJoin);
    }
  };

  // Event listener management
  const addEventListener = (eventType, listener) => {
    if (!eventListeners[eventType]) {
      console.warn(`Event type ${eventType} is not supported`);
      return () => {};
    }

    setEventListeners(prev => ({
      ...prev,
      [eventType]: [...(prev[eventType] || []), listener]
    }));

    // Return cleanup function
    return () => {
      setEventListeners(prev => ({
        ...prev,
        [eventType]: (prev[eventType] || []).filter(l => l !== listener)
      }));
    };
  };

  const removeEventListener = (eventType, listener) => {
    setEventListeners(prev => ({
      ...prev,
      [eventType]: (prev[eventType] || []).filter(l => l !== listener)
    }));
  };

  const emitToListeners = (eventType, data) => {
    const listeners = eventListeners[eventType] || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in ${eventType} listener:`, error);
      }
    });
  };

  // Helper functions
  const isConnected = () => connectionState === 'connected';
  
  const getConnectionState = () => connectionState;
  
  const getOnlineUsers = () => onlineUsers;
  
  const getTypingUsers = () => typingUsers;
  
  const isUserOnline = (userId) => onlineUsers.has(userId);
  
  const isUserTyping = (conversationId) => {
    return typingUsers[conversationId] ? typingUsers[conversationId].userId : null;
  };

  const getQueuedMessagesCount = () => offlineQueue.length;

  // Force reconnection
  const forceReconnect = () => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
  };

  const value = {
    // Connection state
    connectionState,
    isConnected,
    getConnectionState,
    
    // User status
    onlineUsers,
    getOnlineUsers,
    isUserOnline,
    
    // Typing indicators
    typingUsers,
    getTypingUsers,
    isUserTyping,
    
    // Message functions
    sendMessage,
    markTyping,
    markRead,
    
    // Room management
    joinConversation,
    leaveConversation,
    joinUserRoom,
    
    // Connection management
    disconnect: disconnectSocket,
    forceReconnect,
    
    // Event management
    addEventListener,
    removeEventListener,
    
    // Utility
    getQueuedMessagesCount,
    
    // Direct socket access (use sparingly)
    socket: connectionState === 'connected' ? socket : null,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;