import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.100.51:5000';

// Search services by query
export const searchServices = async (query) => {
  try {
    const response = await axios.get(`${API_URL}/api/services/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching services:', error);
    throw error;
  }
};

// Explore/get all services (paginated)
export const exploreServices = async (page = 1) => {
  try {
    const response = await axios.get(`${API_URL}/api/services/explore?page=${page}`);
    return response.data;
  } catch (error) {
    console.error('Error exploring services:', error);
    throw error;
  }
};

// Rate a service
export const rateService = async (serviceId, rating, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/services/${serviceId}/rate`, 
      { value: rating },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error rating service:', error);
    throw error;
  }
};

// Get service provider details
export const getServiceProvider = async (providerId) => {
  try {
    const response = await axios.get(`${API_URL}/api/providers/${providerId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting provider details:', error);
    throw error;
  }
};

// Get service details
export const getServiceDetails = async (serviceId) => {
  try {
    const response = await axios.get(`${API_URL}/api/services/${serviceId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting service details:', error);
    throw error;
  }
};