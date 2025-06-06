// services/foodApi.js
import axios from 'axios';

// Get all approved food vendors
export const fetchApprovedVendors = async () => {
  try {
    const response = await axios.get('/api/food/vendors/public/approved');
    return response.data;
  } catch (error) {
    console.error('Error fetching approved vendors:', error);
    throw error;
  }
};

// Get food listings for a specific vendor
export const fetchVendorListings = async (vendorId, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`/api/food/listings/vendor/${vendorId}`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching vendor listings:', error);
    throw error;
  }
};

// Place a food order
export const placeOrder = async (orderData) => {
  try {
    const response = await axios.post('/api/food/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
};

// Get user's orders
// ✅ Get logged-in user's orders
export const fetchUserOrders = async (token, page = 1, limit = 10) => {
  try {
    const response = await axios.get('/api/food/orders/my', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};
export const clearUserOrders = async (token) => {
  try {
    const response = await axios.delete('/api/food/orders/clear', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('clearUserOrders error:', error);
    return { success: false, message: 'Failed to clear orders' };
  }
};
// Get order details
export const fetchOrderDetails = async (orderId) => {
  try {
    const response = await axios.get(`/api/food/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};

// Cancel an order
export const cancelOrder = async (orderId) => {
  try {
    const response = await axios.put(`/api/food/orders/${orderId}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Error canceling order:', error);
    throw error;
  }
};