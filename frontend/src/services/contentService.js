import { api } from './api';

/**
 * FitBite Content & Support Service
 * Fetches science-backed nutrition guides, macro formulas, recipes, fitness articles, FAQs,
 * and handles customer support ticket submissions.
 */
export const contentService = {
  /**
   * Fetches nutrition guide, macro principles, and quality commitments.
   * @returns {Promise<Object>}
   */
  async getNutritionGuide() {
    const response = await api.get('/content/nutrition-guide');
    return response?.data || response || {};
  },

  /**
   * Fetches healthy recipes and meal prep guides.
   * @returns {Promise<{ total: number, recipes: Array }>}
   */
  async getRecipes() {
    const response = await api.get('/content/recipes');
    return response?.data || { total: 0, recipes: [] };
  },

  /**
   * Fetches expert fitness tips, workout advice, and recovery guidance.
   * @returns {Promise<{ total: number, tips: Array }>}
   */
  async getFitnessTips() {
    const response = await api.get('/content/fitness-tips');
    return response?.data || { total: 0, tips: [] };
  },

  /**
   * Fetches categorized frequently asked questions.
   * @returns {Promise<{ total_categories: number, faq: Array }>}
   */
  async getFAQ() {
    const response = await api.get('/content/faq');
    return response?.data || { total_categories: 0, faq: [] };
  },

  /**
   * Submits a support inquiry ticket.
   * @param {Object} ticketData
   * @param {string} ticketData.name
   * @param {string} ticketData.email
   * @param {string} ticketData.subject
   * @param {string} ticketData.category - 'general' | 'orders' | 'products' | 'shipping' | 'returns' | 'billing' | 'feedback' | 'other'
   * @param {string} ticketData.message
   * @returns {Promise<Object>}
   */
  async submitSupportTicket(ticketData) {
    const response = await api.post('/support/contact', ticketData);
    return response?.data || response;
  },
};

export default contentService;
