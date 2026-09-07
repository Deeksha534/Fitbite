import { api } from './api';

/**
 * FitBite Order, Checkout & Payment Service
 * Communicates with backend /api/v1/orders endpoints.
 */
export const orderService = {
  /**
   * Places an order from the user's shopping cart in an atomic PostgreSQL transaction.
   * @param {Object} payload
   * @param {string} [payload.shipping_address_id] - UUID of saved address
   * @param {Object} [payload.shipping_address] - Inline address details if no ID
   * @param {string} payload.payment_method - 'cod' | 'card' | 'upi'
   * @param {string} [payload.payment_reference_id] - Optional reference / transaction ID
   * @param {string} [payload.coupon_code] - Optional coupon code
   * @param {string} [payload.delivery_notes] - Optional delivery instructions
   * @returns {Promise<Object>} Created order data
   */
  async createOrder(payload) {
    const response = await api.post('/orders', payload);
    return response?.data || response;
  },

  /**
   * Retrieves paginated order history for current customer.
   * @param {Object} [params]
   * @returns {Promise<Object>}
   */
  async getMyOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.order_status) query.append('order_status', params.order_status);
    if (params.sort) query.append('sort', params.sort);

    const qs = query.toString();
    const endpoint = `/orders${qs ? `?${qs}` : ''}`;
    const response = await api.get(endpoint);
    return response?.data || { orders: [], pagination: {} };
  },

  /**
   * Retrieves single order by UUID or order number.
   * @param {string} id - Order UUID or order_number
   * @returns {Promise<Object>}
   */
  async getOrderById(id) {
    const response = await api.get(`/orders/${id}`);
    return response?.data || response;
  },

  /**
   * Submits payment verification for an order.
   * @param {string} orderId - Order UUID
   * @param {Object} paymentData - { payment_method, payment_reference_id?, gateway_response? }
   * @returns {Promise<Object>}
   */
  async verifyPayment(orderId, paymentData) {
    const response = await api.post(`/orders/${orderId}/payment`, paymentData);
    return response?.data?.order || response?.data || response;
  },

  /**
   * Generates a structured commercial tax invoice breakdown for an order.
   * @param {string} orderId - Order UUID
   * @returns {Promise<Object>}
   */
  async getInvoice(orderId) {
    const response = await api.get(`/orders/${orderId}/invoice`);
    return response?.data || response;
  },

  /**
   * Retrieves 5-stage order fulfillment tracking timeline.
   * @param {string} orderNumber - Order Number (e.g. 'FB-20260907-XXXX')
   * @returns {Promise<Object>}
   */
  async getTracking(orderNumber) {
    const response = await api.get(`/orders/track/${orderNumber}`);
    return response?.data || response;
  },

  /**
   * Cancels a pending order and restores product stock.
   * @param {string} orderId - Order UUID
   * @returns {Promise<Object>}
   */
  async cancelOrder(orderId) {
    const response = await api.post(`/orders/${orderId}/cancel`);
    return response?.data || response;
  },
};

export default orderService;
