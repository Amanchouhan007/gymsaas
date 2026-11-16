// src/utils/axiosInstance.js
import axios from 'axios';
import BaseUrl from './BaseUrl';

// Create an Axios instance with a sensible 15s timeout
const axiosInstance = axios.create({
  baseURL: BaseUrl,
  timeout: 15000, // 15 seconds request timeout
});

// Request Interceptor to attach the token to the headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
      if (!config.headers) config.headers = {};
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor to handle token expiration, timeouts, and gateway errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Timeout handling
    if (error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'))) {
      error.userMessage = "Request timed out. Please check your internet connection or try again.";
      return Promise.reject(error);
    }

    // 2. Network connectivity handling
    if (!error.response) {
      error.userMessage = "Unable to reach the server. Please check your network connection.";
      return Promise.reject(error);
    }

    const status = error.response.status;
    const url = error.config?.url || '';
    const isLoginRequest = url.includes('/login');
    const isNotifRequest = url.includes('/notif/');

    // 3. 401 Unauthorized handling
    if (status === 401) {
      // Only clear tokens and redirect for authenticated application routes, NOT for login attempts
      if (!isLoginRequest && !isNotifRequest) {
        const token = localStorage.getItem('authToken');
        if (token) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userData');
          localStorage.removeItem('userId');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
      error.userMessage = error.response?.data?.message || "Invalid credentials. Please verify your email and password.";
      return Promise.reject(error);
    }

    // 4. 403 Forbidden handling
    if (status === 403) {
      error.userMessage = error.response?.data?.message || "Access denied. Your account may be inactive or lack required permissions.";
      return Promise.reject(error);
    }

    // 5. Gateway / Server Availability (502, 503, 504)
    if ([502, 503, 504].includes(status)) {
      error.userMessage = "Server is temporarily unavailable or restarting. Please try again shortly.";
      return Promise.reject(error);
    }

    // 6. Generic 500 error
    if (status >= 500) {
      error.userMessage = error.response?.data?.message || "An unexpected server error occurred. Please try again later.";
      return Promise.reject(error);
    }

    // Fallback message
    error.userMessage = error.response?.data?.message || error.message || "An error occurred. Please try again.";
    return Promise.reject(error);
  }
);

export default axiosInstance;