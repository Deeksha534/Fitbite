import { api } from './api';

/**
 * FitBite Shopping Cart Service
 * Communicates with backend /api/v1/cart endpoints.
 */
export const cartService = {
  /**
   * Retrieves the current user's persistent cart with joined product info,
   * stock indicators, subtotal, and free shipping qualification.
   * @returns {Promise<Object>}
   */
  async getCart() {
    const response = await api.get('/cart');
    return response?.data || { items: [], item_count: 0, subtotal: '0.00', estimated_shipping_fee: '0.00', estimated_total: '0.00' };
  },

  /**
   * Adds an item to the shopping cart with transactional stock validation.
   * @param {Object} payload
   * @param {string} payload.product_id - Product UUID
   * @param {number} [payload.quantity=1] - Quantity to add
   * @returns {Promise<Object>} Updated cart
   */
  async addItem({ product_id, quantity = 1 }) {
    const response = await api.post('/cart/items', {
      product_id,
      quantity,
    });
    return response?.data || response;
  },

  /**
   * Updates line item quantity with server-side stock check.
   * @param {string} itemId - Cart line item UUID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Updated cart
   */
  async updateItem(itemId, quantity) {
    const response = await api.put(`/cart/items/${itemId}`, {
      quantity,
    });
    return response?.data || response;
  },

  /**
   * Removes a single line item from the cart.
   * @param {string} itemId - Cart line item UUID
   * @returns {Promise<Object>} Updated cart
   */
  async removeItem(itemId) {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response?.data || response;
  },

  /**
   * Clears all items from the user's cart.
   * @returns {Promise<Object>} Cleared cart
   */
  async clearCart() {
    const response = await api.delete('/cart');
    return response?.data || response;
  },
};

export default cartService;
