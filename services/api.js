import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Define API URL based on platform
// For iOS simulators, localhost points to the simulator itself
// For Android emulators, 10.0.2.2 is the special IP that points to host machine's localhost
const API_URL = 'http://192.168.100.51:5000/api';


// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Add a timeout to detect network issues
});

// Add a request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.log('API Error:', error);
    
    // Handle network errors more gracefully
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject({
        response: {
          data: { message: 'Network error. Please check your connection and try again.' }
        }
      });
    }
    
    const originalRequest = error.config;
    
    // If the error is 401 and it's not already a retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token (if you have implemented token refresh on your API)
        // const refreshToken = await AsyncStorage.getItem('refreshToken');
        // const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        // const { token } = response.data;
        
        // await AsyncStorage.setItem('authToken', token);
        // originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // return api(originalRequest);
        
        // If no refresh token logic, just logout
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
        
        // You might need to implement a global event emitter to notify the app to redirect to login
        return Promise.reject(error);
      } catch (refreshError) {
        // If refresh fails, logout
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('user');
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (credentials) => {
    console.log('Login credentials:', credentials);
    console.log('Attempting login at:', `${API_URL}/auth/login`);
    return api.post('/auth/login', credentials)
      .then(response => {
        console.log('Login API response:', response.data);
        return response;
      })
      .catch(error => {
        console.error('Login API error:', error.message);
        console.error('Error details:', error.response?.data);
        throw error;
      });
  },
  register: (userData) => {
    console.log('Register user data:', userData);
    console.log('Attempting register at:', `${API_URL}/auth/register`);
    return api.post('/auth/register', userData)
      .then(response => {
        console.log('Register API response:', response.data);
        return response;
      })
      .catch(error => {
        console.error('Register API error:', error.message);
        console.error('Error details:', error.response?.data);
        throw error;
      });
  },
  logout: () => {
    return AsyncStorage.removeItem('authToken')
      .then(() => AsyncStorage.removeItem('user'));
  },
  getCurrentUser: async () => {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

// User services
export const userService = {
  getProfile: () => {
    return api.get('/users/profile');
  },
  updateProfile: (userData) => {
    return api.put('/users/profile', userData);
  },
};

// Example of a protected resource service
export const protectedService = {
  getSomeData: () => {
    return api.get('/some-protected-endpoint');
  },
};

export default api;