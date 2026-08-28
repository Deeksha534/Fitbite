const { query } = require('../config/database');

/**
 * Service managing customer newsletter subscriptions, unsubscribe requests,
 * and admin subscriber listing.
 */

/**
 * Subscribes an email address to the newsletter. Handles duplicates idempotently.
 *
 * @param {string} email - Subscriber email
 * @param {string} source - Source identifier (e.g., 'homepage_footer', 'checkout')
 * @returns {Promise<Object>} Subscription confirmation
 */
const subscribe = async (email, source = 'homepage_footer') => {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await query(
    `INSERT INTO public.newsletter_subscribers (email, source, is_active)
     VALUES ($1, $2, true)
     ON CONFLICT (email) DO UPDATE
     SET is_active = true,
         updated_at = NOW()
     RETURNING id, email, source, is_active, created_at, updated_at`,
    [normalizedEmail, source]
  );

  return {
    subscriber: result.rows[0],
    message: 'Thank you for subscribing to FitBite weekly wellness updates and exclusive protein deals!',
  };
};

/**
 * Unsubscribes an email address from the newsletter.
 *
 * @param {string} email - Subscriber email
 * @returns {Promise<Object>} Unsubscribe confirmation
 */
const unsubscribe = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await query(
    `UPDATE public.newsletter_subscribers
     SET is_active = false,
         updated_at = NOW()
     WHERE email = $1
     RETURNING id, email, is_active, updated_at`,
    [normalizedEmail]
  );

  return {
    email: normalizedEmail,
    is_active: false,
    message: 'You have been successfully unsubscribed from the FitBite newsletter.',
  };
};

/**
 * Retrieves a paginated list of newsletter subscribers for administrators.
 *
 * @param {Object} options - { page, limit, is_active, search }
 * @returns {Promise<Object>} Paginated subscribers list
 */
const getSubscribers = async ({ page = 1, limit = 20, is_active, search } = {}) => {
  const whereConditions = [];
  const queryParams = [];
  let paramIndex = 1;

  if (is_active !== undefined) {
    whereConditions.push(`is_active = $${paramIndex++}`);
    queryParams.push(is_active);
  }

  if (search && search.trim().length > 0) {
    whereConditions.push(`email ILIKE $${paramIndex++}`);
    queryParams.push(`%${search.trim()}%`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM public.newsletter_subscribers ${whereClause}`,
    queryParams
  );
  const total = countResult.rows[0].total;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;

  const dataParams = [...queryParams, limit, offset];
  const subscribersResult = await query(
    `SELECT id, email, source, is_active, created_at, updated_at
     FROM public.newsletter_subscribers
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    dataParams
  );

  return {
    subscribers: subscribersResult.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      total_pages: totalPages,
      has_next_page: page < totalPages,
      has_prev_page: page > 1,
    },
  };
};

module.exports = {
  subscribe,
  unsubscribe,
  getSubscribers,
};
