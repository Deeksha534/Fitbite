import { api } from './api';

/**
 * FitBite Saved Wishlist Service
 * Communicates with backend /api/v1/wishlist endpoints.
 */
export const wishlistService = {
  /**
   * Retrieves the current user's saved wishlist items.
   * @returns {Promise<{ wishlist_id: string, item_count: number, items: Array }>}
   */
  async getWishlist() {
    const response = await api.get('/wishlist');
    return response?.data || { wishlist_id: null, item_count: 0, items: [] };
  },

  /**
   * Adds a product to the user's wishlist idempotently.
   * @param {string} productId - Product UUID
   * @returns {Promise<Object>} Updated wishlist
   */
  async addItem(productId) {
    const response = await api.post('/wishlist/items', {
      product_id: productId,
    });
    return response?.data || response;
  },

  /**
   * Removes an item from the user's wishlist.
   * @param {string} itemId - Wishlist item UUID
   * @returns {Promise<Object>} Updated wishlist
   */
  async removeItem(itemId) {
    const response = await api.delete(`/wishlist/items/${itemId}`);
    return response?.data || response;
  },

  /**
   * Atomically moves a saved wishlist item into the user's shopping cart.
   * @param {string} itemId - Wishlist item UUID
   * @returns {Promise<{ cart: Object, wishlist: Object }>}
   */
  async moveToCart(itemId) {
    const response = await api.post(`/wishlist/move-to-cart/${itemId}`);
    return response?.data || response;
  },
};

export default wishlistService;
