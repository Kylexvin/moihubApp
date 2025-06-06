import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.100.51:5000/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const loadStoredUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setCurrentUser(JSON.parse(storedUser));
          
          // Set axios default headers
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
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      // Auto-login after successful registration
      if (response.data.token) {
        await login(userData.email, userData.password);
      }
      
      return response.data;
    } catch (err) {
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
      console.log('Attempting login with:', { emailOrUsername, password });
      console.log('API URL:', `${API_URL}/auth/login`);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        emailOrUsername,
        password
      });
      
      console.log('Login response:', response.data);
      
      // Extract data from response
      const { token, userId, role, username, email } = response.data;

const user = {
  id: userId,
  role,
  username,
  email
};

      // Store token and user in AsyncStorage
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Set current state
      setToken(token);
      setCurrentUser(user);
      
      // Set axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return user;
    } catch (err) {
      console.error('Login error details:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      
      // Clear state
      setToken(null);
      setCurrentUser(null);
      
      // Clear axios header
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value = {
    currentUser,
    token,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};