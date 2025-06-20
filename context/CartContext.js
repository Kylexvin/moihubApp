// context/CartContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        items: action.payload
      };
    
    case 'ADD_TO_CART':
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + (action.payload.quantity || 1)
        };
        return {
          ...state,
          items: updatedItems
        };
      } else {
        // Add new item
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }]
        };
      }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.productId !== action.payload)
      };
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.productId === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };
    
    default:
      return state;
  }
};

// Initial state
const initialState = {
  items: []
};

// Cart Provider
export const CartProvider = ({ children }) => {
  const [cartState, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from AsyncStorage on app start
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    saveCart();
  }, [cartState.items]);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cart');
      if (savedCart) {
        dispatch({
          type: 'SET_CART',
          payload: JSON.parse(savedCart)
        });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem('cart', JSON.stringify(cartState.items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const addToCart = (product) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: product
    });
  };

  const removeFromCart = (productId) => {
    dispatch({
      type: 'REMOVE_FROM_CART',
      payload: productId
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      dispatch({
        type: 'UPDATE_QUANTITY',
        payload: { productId, quantity }
      });
    }
  };

  const clearCart = () => {
    dispatch({
      type: 'CLEAR_CART'
    });
  };

  const getCartItemCount = () => {
    return cartState.items.reduce((total, item) => total + item.quantity, 0);
  };

  // Add alias for getTotalQuantity (same as getCartItemCount)
  const getTotalQuantity = () => {
    return getCartItemCount();
  };

  const getCartTotal = () => {
    return cartState.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const isInCart = (productId) => {
    return cartState.items.some(item => item.productId === productId);
  };

  const getCartItem = (productId) => {
    return cartState.items.find(item => item.productId === productId);
  };

  // Add method to get quantity of specific item
  const getCartItemQuantity = (productId) => {
    const item = cartState.items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const value = {
    cartItems: cartState.items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemCount,
    getTotalQuantity, // Added this method
    getCartTotal,
    isInCart,
    getCartItem,
    getCartItemQuantity // Added this method
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};