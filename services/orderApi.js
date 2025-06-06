import { useAuth } from '../context/AuthContext';

/**
 * Hook providing order-related API methods
 */
const useOrderApi = () => {
  const { token } = useAuth();
  const API_URL = 'http://192.168.100.51:5000/api'; // Same base as AuthContext http://192.168.100.51:5000

  /**
   * Creates a new food order
   */
  const createOrder = async (orderData) => {
    try {
      const response = await fetch(`${API_URL}/food/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

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

  /**
   * Gets orders for the current user
   */
  const getMyOrders = async (page = 1) => {
    try {
      const response = await fetch(`${API_URL}/food/orders/my-orders?page=${page}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      return {
        success: true,
        orders: data.orders,
        pagination: data.pagination || { page: 1, pages: 1 },
      };
    } catch (error) {
      console.error('Order API error:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  };

  /**
   * Gets details for a specific order
   */
  const getOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/food/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch order details');
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

  /**
   * Cancels an order
   */
  const cancelOrder = async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/food/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel order');
      }

      return {
        success: true,
        message: data.message || 'Order cancelled successfully',
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
    getMyOrders,
    getOrderDetails,
    cancelOrder,
  };
};

export default useOrderApi;
