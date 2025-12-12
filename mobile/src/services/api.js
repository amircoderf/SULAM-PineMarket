// Addresses API
export const addressesAPI = {
  getAll: async () => {
    const response = await api.get('/addresses');
    return response.data;
  },
  add: async (data) => {
    const response = await api.post('/addresses', data);
    return response.data;
  },
  setDefault: async (id) => {
    const response = await api.put(`/addresses/${id}/default`);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },
};
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Base API URL - Android emulator uses 10.0.2.2 to access host's localhost
// For physical device, replace with your computer's IP address (e.g., 'http://192.168.1.100:3000/api')
const API_BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:3000/api' 
  : 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      if (status === 401) {
        // Token expired or invalid - clear storage and redirect to login
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
      }
      
      return Promise.reject({
        message: data.message || 'An error occurred',
        status,
        data,
      });
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0,
      });
    } else {
      // Error in request setup
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: 0,
      });
    }
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Products API
export const productsAPI = {
  getAll: async (params) => {
    const response = await api.get('/products', { params });
    return response.data; // Interceptor returns {success, data}
  },
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data; // Interceptor returns {success, data}
  },
  create: async (data) => {
    const response = await api.post('/products', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
  delete: (id) => api.delete(`/products/${id}`),
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data; // Interceptor returns {success, data}
  },
};

// Cart API
export const cartAPI = {
  get: async () => {
    const response = await api.get('/cart');
    return response.data || {}; // Response interceptor returns {success, data}, we need inner data
  },
  add: async (data) => {
    const response = await api.post('/cart', data);
    return response; // Interceptor already returned {success, data}
  },
  update: async (id, data) => {
    const response = await api.put(`/cart/${id}`, data);
    return response; // Interceptor already returned {success, message, data}
  },
  remove: async (id) => {
    const response = await api.delete(`/cart/${id}`);
    return response; // Interceptor already returned {success, message}
  },
  clear: async () => {
    const response = await api.delete('/cart');
    return response; // Interceptor already returned {success, message}
  },
};

// Orders API
export const ordersAPI = {
  create: async (data) => {
    const response = await api.post('/orders', data);
    return response.data; // Interceptor returns {success, data}
  },
  getAll: async (params) => {
    const response = await api.get('/orders', { params });
    return response.data; // Interceptor returns {success, data}
  },
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data; // Interceptor returns {success, data}
  },
};

// Reviews API
export const reviewsAPI = {
  getByProduct: (productId, params) => api.get(`/reviews/products/${productId}`, { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  getMyReviews: (params) => api.get('/reviews/user/my-reviews', { params }),
};

// Favorites API
export const favoritesAPI = {
  getAll: (params) => api.get('/favorites', { params }),
  add: (productId) => api.post('/favorites', { product_id: productId }),
  remove: (productId) => api.delete(`/favorites/${productId}`),
  check: (productId) => api.get(`/favorites/check/${productId}`),
  toggle: (productId) => api.post('/favorites/toggle', { product_id: productId }),
};

// Seller API
export const sellerAPI = {
  getStats: async () => {
    const response = await api.get('/sellers/stats');
    return response.data; // Interceptor returns {success, data}
  },
  getOrders: async (params) => {
    const response = await api.get('/sellers/orders', { params });
    return response.data;
  },
};

export default api;
