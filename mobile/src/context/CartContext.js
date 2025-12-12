import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await cartAPI.get();
      
      // Data is already unwrapped by the API service
      const { items, summary } = data;
      setCartItems(items || []);
      setCartCount(summary?.itemCount || 0);
      setCartTotal(parseFloat(summary?.total || 0));
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await cartAPI.add({ productId, quantity });
      
      if (response.success) {
        await fetchCart();
        return { success: true };
      }
      
      return { success: false, message: 'Failed to add to cart' };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to add to cart' };
    }
  };

  const updateCartItem = async (cartId, quantity) => {
    try {
      const response = await cartAPI.update(cartId, { quantity });
      
      if (response && response.success) {
        await fetchCart();
        return { success: true };
      }
      
      return { success: false, message: response?.message || 'Failed to update cart' };
    } catch (error) {
      console.error('Update cart error in context:', error);
      return { success: false, message: error.message || 'Failed to update cart' };
    }
  };

  const removeFromCart = async (cartId) => {
    try {
      const response = await cartAPI.remove(cartId);
      
      if (response && response.success) {
        await fetchCart();
        return { success: true };
      }
      
      return { success: false, message: response?.message || 'Failed to remove item' };
    } catch (error) {
      console.error('Remove cart error in context:', error);
      return { success: false, message: error.message || 'Failed to remove item' };
    }
  };

  const clearCart = async () => {
    try {
      const response = await cartAPI.clear();
      
      if (response.success) {
        setCartItems([]);
        setCartCount(0);
        setCartTotal(0);
        return { success: true };
      }
      
      return { success: false, message: 'Failed to clear cart' };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to clear cart' };
    }
  };

  const value = {
    cartItems,
    cartCount,
    cartTotal,
    loading,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
