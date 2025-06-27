import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setCurrentUser(JSON.parse(storedUser));
          setIsAuthenticated(true);

          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error('Error loading auth data from storage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredUser();
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

      // Store with proper validation
      console.log('Storing token:', token);
      console.log('Storing user:', JSON.stringify(user, null, 2));
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setCurrentUser(user);
      setIsAuthenticated(true);

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

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

  const socialLogin = async (provider, userData) => {
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/social-login', {
        provider,
        ...userData,
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

      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setCurrentUser(user);
      setIsAuthenticated(true);

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

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
    setLoading(true);
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');

      setToken(null);
      setCurrentUser(null);
      setIsAuthenticated(false);

      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};