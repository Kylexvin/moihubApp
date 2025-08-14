// utils/api.js
import axios from 'axios';
import { Platform } from 'react-native';

const baseURL = Platform.OS === 'ios'
  ? 'http://localhost:5000'
  : 'https://moihub.onrender.com';

const api = axios.create({
  baseURL,
  timeout: 10000,
});

export default api;
