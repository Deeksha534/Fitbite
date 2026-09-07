/**
 * FitBite Authentication & User Profile API Service
 * Centralizes all HTTP communication with the backend authentication and user management endpoints.
 */

import { api, setToken, clearToken } from './api';

export const authService = {
  /**
   * Register a new customer account.
   * @param {Object} userData - { email, password, full_name, phone }
   * @returns {Promise<Object>} { user, token }
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response?.data || response;
  },

  /**
   * Log in an existing user with email and password.
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} { user, token }
   */
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response?.data || response;
  },

  /**
   * Retrieve the current authenticated user profile from backend session.
   * @returns {Promise<Object>} { user }
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response?.data || response;
  },

  /**
   * Update the authenticated user's profile information.
   * @param {Object} profileData - { full_name, phone, avatar_url, bio }
   * @returns {Promise<Object>} { user }
   */
  async updateProfile(profileData) {
    const response = await api.put('/users/profile', profileData);
    return response?.data || response;
  },

  /**
   * Change the authenticated user's account password.
   * @param {Object} passwordData - { current_password, new_password, confirm_password }
   * @returns {Promise<Object>} Response object
   */
  async changePassword(passwordData) {
    const response = await api.put('/users/password', passwordData);
    return response;
  },

  /**
   * Retrieve customer account summary metrics (orders, addresses, cart, wishlist, reviews).
   * @returns {Promise<Object>} Summary metrics object
   */
  async getSummary() {
    const response = await api.get('/users/summary');
    return response?.data || response;
  },

  /**
   * Save the auth token in localStorage.
   * @param {string} token
   */
  saveToken(token) {
    setToken(token);
  },

  /**
   * Remove stored authentication tokens.
   */
  clearAuth() {
    clearToken();
  },
};

export default authService;
