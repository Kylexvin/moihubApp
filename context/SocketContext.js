// contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token, currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
  const socketRef = useRef(null);
  const initializationRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);

  const SOCKET_URL = 'https://moihub.onrender.com';

  // Optimized socket configuration
  const socketConfig = {
    auth: {
      token,
      userId: currentUser?._id
    },
    transports: ['websocket', 'polling'], // Allow fallback to polling
    upgrade: true, // Allow upgrade from polling to websocket
    forceNew: false, // Don't force new connection if one exists
    timeout: 10000, // Reduced timeout for faster failure detection
    reconnection: true,
    reconnectionAttempts: 3, // Reduced attempts for faster recovery
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    maxReconnectionAttempts: 3,
    // Performance optimizations
    autoConnect: false, // Manual connection control
    compress: true, // Enable compression
  };

  // Cleanup function
  const cleanup = useCallback(() => {
    if (socketRef.current) {
      console.log('🧹 Cleaning up socket connection');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setSocket(null);
    setIsConnected(false);
    setConnectionState('disconnected');
    initializationRef.current = false;
  }, []);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    // Prevent multiple initializations
    if (initializationRef.current || socketRef.current) {
      console.log('🔄 Socket already initializing/exists, skipping...');
      return;
    }

    if (!isAuthenticated || !token || !currentUser) {
      console.log('❌ Cannot initialize socket - missing auth data');
      return;
    }

    console.log('🚀 Initializing socket connection...');
    initializationRef.current = true;
    setConnectionState('connecting');

    try {
      const socketInstance = io(SOCKET_URL, socketConfig);

      // Store reference immediately
      socketRef.current = socketInstance;
      setSocket(socketInstance);

      // Connection event handlers
      socketInstance.on('connect', () => {
        console.log('✅ Socket connected:', socketInstance.id);
        setIsConnected(true);
        setConnectionState('connected');
        
        // Join user room immediately upon connection
        if (currentUser?._id) {
          socketInstance.emit('join_user_room', { userId: currentUser._id });
        }
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
        setConnectionState('disconnected');
      });

      socketInstance.on('connect_error', (error) => {
        console.warn('⚠️ Socket connection error:', error.message);
        setIsConnected(false);
        setConnectionState('error');
        
        // Don't retry if it's an auth error
        if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
          console.log('🔐 Authentication error - not retrying');
          cleanup();
          return;
        }
      });

      socketInstance.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        setConnectionState('connected');
        
        // Rejoin user room on reconnection
        if (currentUser?._id) {
          socketInstance.emit('join_user_room', { userId: currentUser._id });
        }
      });

      socketInstance.on('reconnect_error', (error) => {
        console.log('🔄❌ Socket reconnection error:', error.message);
        setConnectionState('error');
      });

      socketInstance.on('reconnect_failed', () => {
        console.log('🔄❌ Socket reconnection failed - max attempts reached');
        setConnectionState('error');
      });

      // Vendor-specific events
      socketInstance.on('vendor_join', (data) => {
        console.log('🏪 Joined vendor room:', data);
      });

      socketInstance.on('vendor_leave', (data) => {
        console.log('🏪 Left vendor room:', data);
      });

      // Handle authentication errors
      socketInstance.on('auth_error', (error) => {
        console.error('🔐 Authentication error:', error);
        cleanup();
      });

      // Start the connection
      socketInstance.connect();

    } catch (error) {
      console.error('❌ Error initializing socket:', error);
      setConnectionState('error');
      initializationRef.current = false;
    }
  }, [isAuthenticated, token, currentUser, cleanup]);

  // Main effect - handles socket lifecycle
  useEffect(() => {
    if (!isAuthenticated || !token || !currentUser) {
      cleanup();
      return;
    }

    // Debounce socket initialization to prevent rapid re-connections
    const timeoutId = setTimeout(() => {
      initializeSocket();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isAuthenticated, token, currentUser, initializeSocket, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Helper methods
  const joinVendorRoom = useCallback((shopId) => {
    if (socket && isConnected && shopId) {
      console.log('🏪 Joining vendor room:', shopId);
      socket.emit('join_vendor_room', { shopId });
    } else {
      console.warn('⚠️ Cannot join vendor room - socket not ready or missing shopId');
    }
  }, [socket, isConnected]);

  const leaveVendorRoom = useCallback((shopId) => {
    if (socket && isConnected && shopId) {
      console.log('🏪 Leaving vendor room:', shopId);
      socket.emit('leave_vendor_room', { shopId });
    } else {
      console.warn('⚠️ Cannot leave vendor room - socket not ready or missing shopId');
    }
  }, [socket, isConnected]);

  const joinUserRoom = useCallback((userId) => {
    if (socket && isConnected && userId) {
      console.log('👤 Joining user room:', userId);
      socket.emit('join_user_room', { userId });
    } else {
      console.warn('⚠️ Cannot join user room - socket not ready or missing userId');
    }
  }, [socket, isConnected]);

  const reconnect = useCallback(() => {
    if (socket) {
      console.log('🔄 Manual reconnection triggered');
      socket.disconnect();
      socket.connect();
    } else {
      console.log('🔄 No socket instance - initializing new connection');
      initializeSocket();
    }
  }, [socket, initializeSocket]);

  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn(`⚠️ Cannot emit ${event} - socket not connected`);
    }
  }, [socket, isConnected]);

  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
    return () => {};
  }, [socket]);

  const off = useCallback((event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  // Enhanced helper for waiting for connection
  const waitForConnection = useCallback((timeout = 5000) => {
    return new Promise((resolve, reject) => {
      if (isConnected) {
        resolve(socket);
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, timeout);

      const checkConnection = () => {
        if (isConnected) {
          clearTimeout(timeoutId);
          resolve(socket);
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }, [isConnected, socket]);

  const value = {
    socket,
    isConnected,
    connectionState,
    
    // Helper methods
    joinVendorRoom,
    leaveVendorRoom,
    joinUserRoom,
    reconnect,
    emit,
    on,
    off,
    waitForConnection,
    
    // Connection management
    connect: () => {
      if (socket && !isConnected) {
        socket.connect();
      } else {
        initializeSocket();
      }
    },
    
    disconnect: () => {
      if (socket) {
        socket.disconnect();
      }
    },
    
    // Status helpers
    isConnecting: connectionState === 'connecting',
    hasError: connectionState === 'error',
    isReady: isConnected && connectionState === 'connected',
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;