import { api } from './api';

/**
 * FitBite Delivery Address Service
 * Communicates with backend /api/v1/addresses endpoints.
 */
export const addressService = {
  /**
   * Retrieves all saved addresses for current customer.
   * @returns {Promise<Array>}
   */
  async getAddresses() {
    const response = await api.get('/addresses');
    return response?.data?.addresses || response?.data || [];
  },

  /**
   * Retrieves single address by UUID.
   * @param {string} id - Address UUID
   * @returns {Promise<Object>}
   */
  async getAddress(id) {
    const response = await api.get(`/addresses/${id}`);
    return response?.data?.address || response?.data || null;
  },

  /**
   * Creates a new delivery address for the customer.
   * @param {Object} addressData
   * @returns {Promise<Object>} Created address
   */
  async createAddress(addressData) {
    const response = await api.post('/addresses', addressData);
    return response?.data?.address || response?.data || response;
  },

  /**
   * Updates an existing delivery address.
   * @param {string} id - Address UUID
   * @param {Object} addressData
   * @returns {Promise<Object>} Updated address
   */
  async updateAddress(id, addressData) {
    const response = await api.put(`/addresses/${id}`, addressData);
    return response?.data?.address || response?.data || response;
  },

  /**
   * Deletes a delivery address.
   * @param {string} id - Address UUID
   * @returns {Promise<Object>}
   */
  async deleteAddress(id) {
    const response = await api.delete(`/addresses/${id}`);
    return response?.data || response;
  },

  /**
   * Sets an address as the default delivery address.
   * @param {string} id - Address UUID
   * @returns {Promise<Object>}
   */
  async setDefaultAddress(id) {
    const response = await api.patch(`/addresses/${id}/default`);
    return response?.data?.address || response?.data || response;
  },
};

export default addressService;
