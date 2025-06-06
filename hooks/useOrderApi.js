// hooks/useOrderApi.js
import { useAuth } from '../context/AuthContext';

/**
 * Hook providing order-related API methods
 */
const useOrderApi = () => {
  const { token } = useAuth();
  const API_URL = 'http://192.168.100.51:5000/api'; // Same base as AuthContext

  /**
   * Creates a new food order
   */
  const createOrder = async (orderData) => {
    try {
      console.log('Creating order with data:', JSON.stringify(orderData));
      console.log('Using token:', token.substring(0, 10) + '...');
      
      const response = await fetch(`${API_URL}/food/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      console.log('Order API response status:', response.status);
      console.log('Order API response data:', JSON.stringify(data));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }

      return {
        success: true,
        order: data.order,
      };
    } catch (error) {
      console.error('Order API error:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  };





  return {
    createOrder,
    
  };
};

export default useOrderApi;