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
    const response = await axios.post(`${API_URL}/auth/login`, {
      emailOrUsername,
      password
    });

    const { token, user } = response.data;

    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    setToken(token);
    setCurrentUser(user);
    setIsAuthenticated(true);

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    return user;
  } catch (err) {
    console.error('Login error:', err);
    setError(err.response?.data?.message || 'Login failed');
    throw err;
  } finally {
    setLoading(false);
  }
};


  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');

      setToken(null);
      setCurrentUser(null);
      setIsAuthenticated(false);

      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout error:', error);
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
    isAuthenticated,
    setIsAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
