import { api } from './api';

/**
 * FitBite Product Catalog & Reviews Service
 * Handles communication with backend catalog, categories, reviews, and customer cart/wishlist endpoints.
 */
export const catalogService = {
  /**
   * Fetches paginated products with filtering and sorting.
   * @param {Object} params
   * @param {string} [params.search]
   * @param {string} [params.category_id]
   * @param {number} [params.min_price]
   * @param {number} [params.max_price]
   * @param {string} [params.flavor]
   * @param {boolean} [params.is_featured]
   * @param {string} [params.sort] - 'newest' | 'price_asc' | 'price_desc' | 'calories_asc' | 'calories_desc' | 'featured'
   * @param {number} [params.page=1]
   * @param {number} [params.limit=12]
   * @returns {Promise<{ products: Array, pagination: Object }>}
   */
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    
    if (params.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params.category_id) {
      query.append('category_id', params.category_id);
    }
    if (params.min_price !== undefined && params.min_price !== null && params.min_price !== '') {
      query.append('min_price', params.min_price);
    }
    if (params.max_price !== undefined && params.max_price !== null && params.max_price !== '') {
      query.append('max_price', params.max_price);
    }
    if (params.flavor && params.flavor.trim()) {
      query.append('flavor', params.flavor.trim());
    }
    if (params.is_featured !== undefined && params.is_featured !== null && params.is_featured !== '') {
      query.append('is_featured', params.is_featured);
    }
    if (params.sort) {
      query.append('sort', params.sort);
    }
    if (params.page) {
      query.append('page', params.page);
    }
    if (params.limit) {
      query.append('limit', params.limit);
    }

    const queryString = query.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    const response = await api.get(endpoint);
    return response?.data || { products: [], pagination: {} };
  },

  /**
   * Fetches single product details with gallery images and category info.
   * @param {string} id - Product UUID
   * @returns {Promise<Object>}
   */
  async getProductById(id) {
    const response = await api.get(`/products/${id}`);
    return response?.data?.product || response?.data || null;
  },

  /**
   * Fetches all active categories with product counts.
   * @returns {Promise<Array>}
   */
  async getCategories() {
    const response = await api.get('/categories');
    return response?.data?.categories || [];
  },

  /**
   * Fetches single category by ID.
   * @param {string} id - Category UUID
   * @returns {Promise<Object>}
   */
  async getCategoryById(id) {
    const response = await api.get(`/categories/${id}`);
    return response?.data?.category || null;
  },

  /**
   * Fetches customer reviews for a product with summary stats.
   * @param {string} productId - Product UUID
   * @param {Object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=10]
   * @returns {Promise<{ product: Object, summary: Object, reviews: Array, pagination: Object }>}
   */
  async getProductReviews(productId, params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString();
    const endpoint = `/products/${productId}/reviews${qs ? `?${qs}` : ''}`;
    const response = await api.get(endpoint);
    return response?.data || { summary: {}, reviews: [], pagination: {} };
  },

  /**
   * Checks whether authenticated user is eligible to review product.
   * @param {string} productId - Product UUID
   * @returns {Promise<{ is_eligible_to_review: boolean, is_verified_buyer: boolean, has_reviewed: boolean }>}
   */
  async checkReviewEligibility(productId) {
    const response = await api.get(`/products/${productId}/reviews/eligibility`);
    return response?.data || { is_eligible_to_review: false, is_verified_buyer: false, has_reviewed: false };
  },

  /**
   * Submits a customer review for a product.
   * @param {string} productId - Product UUID
   * @param {Object} reviewData - { rating: number, title?: string, comment: string }
   * @returns {Promise<Object>}
   */
  async submitReview(productId, reviewData) {
    const response = await api.post(`/products/${productId}/reviews`, reviewData);
    return response?.data || response;
  },

  /**
   * Fetches featured high-rated reviews for the landing page.
   * @param {number} [limit=3]
   * @returns {Promise<Array>}
   */
  async getFeaturedReviews(limit = 3) {
    const response = await api.get(`/reviews/featured?limit=${limit}`);
    return response?.data?.reviews || [];
  },

  /**
   * Adds an item to the user's shopping cart (Phase 4D/4C auth-aware action).
   * @param {string} productId
   * @param {number} [quantity=1]
   * @returns {Promise<Object>}
   */
  async addToCart(productId, quantity = 1) {
    const response = await api.post('/cart/items', {
      product_id: productId,
      quantity,
    });
    return response?.data || response;
  },

  /**
   * Adds an item to the user's saved wishlist (Phase 4D/4C auth-aware action).
   * @param {string} productId
   * @returns {Promise<Object>}
   */
  async addToWishlist(productId) {
    const response = await api.post('/wishlist/items', {
      product_id: productId,
    });
    return response?.data || response;
  },
};

export default catalogService;
