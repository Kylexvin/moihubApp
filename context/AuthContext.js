import { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AppState } from 'react-native';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const tokenCheckInterval = useRef(null);
  const logoutTimeout = useRef(null);

  // Function to decode JWT token and get expiration time
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Function to check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  };

  // Function to get time until token expires (in milliseconds)
  const getTimeUntilExpiry = (token) => {
    if (!token) return 0;
    
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return 0;
    
    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = (decoded.exp - currentTime) * 1000;
    return Math.max(0, timeUntilExpiry);
  };

  // Function to handle session expiry
  const handleSessionExpiry = async () => {
    console.log('Session expired - logging out user');
    
    // Clear intervals and timeouts
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
      tokenCheckInterval.current = null;
    }
    if (logoutTimeout.current) {
      clearTimeout(logoutTimeout.current);
      logoutTimeout.current = null;
    }

    // Show alert to user
    Alert.alert(
      'Session Expired',
      'Your login session has expired. Please log in again.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Perform logout
            performLogout();
          }
        }
      ],
      { cancelable: false }
    );
  };

  // Function to perform logout without showing alert
  const performLogout = async () => {
    setLoading(true);
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');

      setToken(null);
      setCurrentUser(null);
      setIsAuthenticated(false);
      setError('');

      delete axios.defaults.headers.common['Authorization'];

      // Clear intervals and timeouts
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
        tokenCheckInterval.current = null;
      }
      if (logoutTimeout.current) {
        clearTimeout(logoutTimeout.current);
        logoutTimeout.current = null;
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to setup token expiry monitoring
  const setupTokenMonitoring = (token) => {
    if (!token) return;

    // Clear existing intervals/timeouts
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
    }
    if (logoutTimeout.current) {
      clearTimeout(logoutTimeout.current);
    }

    // Check if token is already expired
    if (isTokenExpired(token)) {
      handleSessionExpiry();
      return;
    }

    // Get time until expiry
    const timeUntilExpiry = getTimeUntilExpiry(token);
    
    // Set timeout to logout user when token expires
    logoutTimeout.current = setTimeout(() => {
      handleSessionExpiry();
    }, timeUntilExpiry);

    // Set interval to check token validity every 30 seconds
    tokenCheckInterval.current = setInterval(() => {
      if (isTokenExpired(token)) {
        handleSessionExpiry();
      }
    }, 30000); // Check every 30 seconds

    console.log(`Token monitoring setup. Token expires in: ${Math.round(timeUntilExpiry / 1000)} seconds`);
  };

  // Setup axios interceptor to handle 401 responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('401 error detected - session expired');
          handleSessionExpiry();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          // Check if stored token is expired
          if (isTokenExpired(storedToken)) {
            console.log('Stored token is expired, clearing storage');
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('user');
            setLoading(false);
            return;
          }

          setToken(storedToken);
          setCurrentUser(JSON.parse(storedUser));
          setIsAuthenticated(true);

          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Setup token monitoring
          setupTokenMonitoring(storedToken);
        }
      } catch (error) {
        console.error('Error loading auth data from storage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
      if (logoutTimeout.current) {
        clearTimeout(logoutTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') {
      refreshUser();
    }
  });

  return () => subscription.remove();
}, []);

  const register = async (userData) => {
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/register', userData);
      
      console.log('Register response:', response.data);

      // Auto-login after successful registration
      if (response.data.token) {
        await login(userData.email, userData.password);
      }

      return response.data;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername, password) => {
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        emailOrUsername,
        password,
      });

      console.log('Login response:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', Object.keys(response.data));
      
      // More detailed logging
      console.log('Token exists:', !!response.data.token);
      console.log('User exists:', !!response.data.user);
      console.log('User type:', typeof response.data.user);
      
      if (response.data.user) {
        console.log('User keys:', Object.keys(response.data.user));
        console.log('User data:', JSON.stringify(response.data.user, null, 2));
      }

      const { token, user } = response.data;

      // Validate data before storing
      if (!token) {
        console.error('Token validation failed - token:', token);
        throw new Error('No token received from server');
      }

      if (!user) {
        console.error('User validation failed - user:', user);
        console.error('Full response data:', JSON.stringify(response.data, null, 2));
        throw new Error('No user data received from server');
      }

      // Additional validation for user object
      if (typeof user !== 'object' || user === null) {
        console.error('User is not an object:', user, typeof user);
        throw new Error('Invalid user data format received from server');
      }

      // Check if token is expired before storing
      if (isTokenExpired(token)) {
        throw new Error('Received expired token from server');
      }

      // Store with proper validation
      console.log('Storing token:', token);
      console.log('Storing user:', JSON.stringify(user, null, 2));
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setCurrentUser(user);
      setIsAuthenticated(true);

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Setup token monitoring
      setupTokenMonitoring(token);

      console.log('Login successful - currentUser set to:', user);
      return user;
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (provider, socialToken) => {
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/social-login', {
        provider,
        token: socialToken,
      });

      console.log('Social login response:', response.data);

      const { token, user } = response.data;

      // Validate data before storing
      if (!token) {
        throw new Error('No token received from server');
      }

      if (!user) {
        throw new Error('No user data received from server');
      }

      // Check if token is expired before storing
      if (isTokenExpired(token)) {
        throw new Error('Received expired token from server');
      }

      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setCurrentUser(user);
      setIsAuthenticated(true);

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Setup token monitoring
      setupTokenMonitoring(token);

      return user;
    } catch (err) {
      console.error('Social login error:', err);
      setError(err.response?.data?.message || err.message || 'Social login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await performLogout();
  };

  // Add a function to update user data
  const updateUser = async (updatedUserData) => {
    try {
      // Update the current user state
      setCurrentUser(updatedUserData);
      
      // Update AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

const refreshUser = async () => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');
    if (!storedToken || isTokenExpired(storedToken)) return;

    const response = await axios.get('/api/auth/me');
    const updatedUser = response.data.user;

    setCurrentUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  } catch (error) {
    console.error('Failed to refresh user:', error);
  }
};

  const value = {
    currentUser,
    token,
    loading,
    error,
    register,
    login,
    socialLogin,
    logout,
    isAuthenticated,
    setIsAuthenticated,
    setError,
    setCurrentUser,  
    refreshUser,
    updateUser,      
    isTokenExpired: () => isTokenExpired(token),
    getTimeUntilExpiry: () => getTimeUntilExpiry(token),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};