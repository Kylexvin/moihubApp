// context/FoodContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import * as foodApi from '../services/foodApi.js';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FoodContext = createContext();

export const useFoodContext = () => useContext(FoodContext);

export const FoodProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [vendorError, setVendorError] = useState(null);
  const [cart, setCart] = useState([]);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  // Load approved vendors when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      loadVendors();
      loadSavedCart();
      loadRecentOrders();
    }
  }, [isAuthenticated]);

  // Load saved cart from AsyncStorage
  const loadSavedCart = async () => {
    try {
      const savedCartData = await AsyncStorage.getItem('foodCart');
      const savedVendorData = await AsyncStorage.getItem('currentVendor');
      
      if (savedCartData) {
        const parsedCart = JSON.parse(savedCartData);
        setCart(parsedCart);
      }
      
      if (savedVendorData) {
        setCurrentVendor(JSON.parse(savedVendorData));
      }
    } catch (error) {
      console.error('Error loading saved cart:', error);
    }
  };

  // Load recent orders from AsyncStorage
  const loadRecentOrders = async () => {
    try {
      const savedOrdersData = await AsyncStorage.getItem('recentOrders');
      
      if (savedOrdersData) {
        setRecentOrders(JSON.parse(savedOrdersData));
      }
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  };

  // Save cart to AsyncStorage
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('foodCart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };
    
    saveCart();
  }, [cart]);

  // Save current vendor to AsyncStorage
  useEffect(() => {
    const saveVendor = async () => {
      try {
        if (currentVendor) {
          await AsyncStorage.setItem('currentVendor', JSON.stringify(currentVendor));
        } else {
          await AsyncStorage.removeItem('currentVendor');
        }
      } catch (error) {
        console.error('Error saving current vendor:', error);
      }
    };
    
    saveVendor();
  }, [currentVendor]);

  // Save recent orders to AsyncStorage
  useEffect(() => {
    const saveRecentOrders = async () => {
      try {
        await AsyncStorage.setItem('recentOrders', JSON.stringify(recentOrders));
      } catch (error) {
        console.error('Error saving recent orders:', error);
      }
    };
    
    saveRecentOrders();
  }, [recentOrders]);

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      setVendorError(null);
      const data = await foodApi.fetchApprovedVendors();
      setVendors(data.vendors || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
      setVendorError('Failed to load food vendors. Please try again later.');
    } finally {
      setLoadingVendors(false);
    }
  };

  // Cart functions
  const addToCart = (item, quantity = 1) => {
    // Only allow items from the same vendor
    if (cart.length > 0 && item.vendorId !== cart[0].vendorId) {
      return { 
        success: false, 
        message: 'You can only order from one vendor at a time. Clear your cart to order from a different vendor.' 
      };
    }

    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem._id === item._id);
      
      if (existingItemIndex >= 0) {
        // Update quantity if item already in cart
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
        return updatedCart;
      } else {
        // Add new item to cart
        return [...prevCart, { ...item, quantity }];
      }
    });

    // Set current vendor if cart was empty
    if (cart.length === 0) {
      setCurrentVendor(item.vendorId);
    }

    return { success: true, message: 'Item added to cart' };
  };

  // Fixed: This function should align with what OrderScreen expects
  const updateCartItemQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prevCart => 
      prevCart.map(item => 
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item._id !== itemId);
      // Reset current vendor if cart becomes empty
      if (updatedCart.length === 0) {
        setCurrentVendor(null);
      }
      return updatedCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    setCurrentVendor(null);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Add recent order function for OrderScreen
  const addRecentOrder = (order) => {
    setRecentOrders(prevOrders => {
      // Add the new order to the beginning of the array
      const updatedOrders = [order, ...prevOrders];
      // Limit to 10 recent orders
      return updatedOrders.slice(0, 10);
    });
  };

  const value = {
    vendors,
    loadingVendors,
    vendorError,
    loadVendors,
    cart,
    addToCart,
    updateCartItemQuantity, // Renamed from updateItemQuantity to match OrderScreen
    removeFromCart,
    clearCart,
    getCartTotal,
    currentVendor,
    recentOrders,
    addRecentOrder
  };

  return (
    <FoodContext.Provider value={value}>
      {children}
    </FoodContext.Provider>
  );
};

export default FoodContext;