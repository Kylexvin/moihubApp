// context/SocketContext.js
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { AppState } from 'react-native';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { currentUser, token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const reconnectAttempts = useRef(0);

  const SOCKET_URL = 'http://192.168.100.51:5000'; // Your server URL

  const connectSocket = () => {
    if (!isAuthenticated || !currentUser || !token) {
      console.log('Cannot connect socket: User not authenticated');
      return;
    }

    if (socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    console.log('Connecting to socket...');

    const newSocket = io(SOCKET_URL, {
      auth: {
        token: token,
        userId: currentUser._id,
      },
      transports: ['websocket'],
      timeout: 20000,
      forceNew: true,
    });

    // Connection successful
    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setIsConnected(true);
      setConnectionError(null);
      reconnectAttempts.current = 0;
      
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    // Connection error
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setConnectionError(error.message);
      
      // Attempt to reconnect
      attemptReconnect();
    });

    // Disconnection
    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      
      // Only attempt reconnect if it wasn't a manual disconnect
      if (reason !== 'io client disconnect') {
        attemptReconnect();
      }
    });

    // Authentication error
    newSocket.on('auth_error', (error) => {
      console.error('Socket authentication error:', error);
      setConnectionError('Authentication failed');
      newSocket.disconnect();
    });

    setSocket(newSocket);
  };

  const attemptReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      setConnectionError('Failed to connect after multiple attempts');
      return;
    }

    if (reconnectTimeoutRef.current) {
      return; // Already attempting to reconnect
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff, max 30s
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttempts.current++;
      reconnectTimeoutRef.current = null;
      connectSocket();
    }, delay);
  };

  const disconnectSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socket) {
      console.log('Disconnecting socket...');
      socket.disconnect();
      setSocket(null);
    }
    
    setIsConnected(false);
    setConnectionError(null);
    reconnectAttempts.current = 0;
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated && !isConnected) {
        // App became active and we're not connected, try to reconnect
        console.log('App became active, attempting to reconnect socket');
        connectSocket();
      } else if (nextAppState === 'background') {
        // App went to background, but keep socket connected for notifications
        console.log('App went to background');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, isConnected]);

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser && token) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, currentUser, token]);

  // Manual reconnect function
  const reconnect = () => {
    reconnectAttempts.current = 0;
    disconnectSocket();
    setTimeout(() => {
      connectSocket();
    }, 1000);
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    connectSocket,
    disconnectSocket,
    reconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};