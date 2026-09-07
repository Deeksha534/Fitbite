import { api } from './api';

/**
 * FitBite Promotional Coupon Service
 * Communicates with backend /api/v1/coupons endpoints.
 */
export const couponService = {
  /**
   * Validates a coupon code against current user's active shopping cart
   * and calculates authoritative discount savings.
   * @param {string} code - Coupon code (e.g., 'FITBITE20', 'PROTEIN50')
   * @returns {Promise<{ valid: boolean, code: string, discount_type: string, discount_value: number, min_order_amount: number, max_discount_amount: number, subtotal_amount: number, discount_amount: number, shipping_fee: number, estimated_total: number, message: string }>}
   */
  async validateCoupon(code) {
    const response = await api.post('/coupons/validate', {
      code: code ? code.trim().toUpperCase() : '',
    });
    return response?.data || response;
  },
};

export default couponService;
