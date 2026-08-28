const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Service managing user profile updates, secure password changes,
 * and customer account dashboard summaries.
 */

/**
 * Updates a user's profile metadata.
 *
 * @param {string} userId - User UUID
 * @param {Object} profileData - { full_name, phone, avatar_url, bio }
 * @returns {Promise<Object>} Sanitized updated user and profile object
 */
const updateProfile = async (userId, { full_name, phone, avatar_url, bio }) => {
  // 1. Verify user exists
  const userCheck = await query(
    'SELECT id, email, role, is_active, created_at FROM public.users WHERE id = $1',
    [userId]
  );

  if (userCheck.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const user = userCheck.rows[0];

  if (!user.is_active) {
    const err = new Error('Account has been deactivated');
    err.statusCode = 403;
    throw err;
  }

  // 2. Build dynamic parameterized update for profiles
  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (full_name !== undefined) {
    updates.push(`full_name = $${paramIndex++}`);
    params.push(full_name && full_name.trim().length > 0 ? full_name.trim() : null);
  }

  if (phone !== undefined) {
    updates.push(`phone = $${paramIndex++}`);
    params.push(phone && phone.trim().length > 0 ? phone.trim() : null);
  }

  if (avatar_url !== undefined) {
    updates.push(`avatar_url = $${paramIndex++}`);
    params.push(avatar_url && avatar_url.trim().length > 0 ? avatar_url.trim() : null);
  }

  if (bio !== undefined) {
    updates.push(`bio = $${paramIndex++}`);
    params.push(bio && bio.trim().length > 0 ? bio.trim() : null);
  }

  params.push(userId);

  const updateResult = await query(
    `UPDATE public.profiles
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING full_name, phone, avatar_url, bio, updated_at`,
    params
  );

  let updatedProfile = updateResult.rows[0];
  if (!updatedProfile) {
    const insertRes = await query(
      `INSERT INTO public.profiles (id, full_name, phone, avatar_url, bio)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING
       RETURNING full_name, phone, avatar_url, bio, updated_at`,
      [
        userId,
        full_name && full_name.trim().length > 0 ? full_name.trim() : null,
        phone && phone.trim().length > 0 ? phone.trim() : null,
        avatar_url && avatar_url.trim().length > 0 ? avatar_url.trim() : null,
        bio && bio.trim().length > 0 ? bio.trim() : null,
      ]
    );
    updatedProfile = insertRes.rows[0] || {};
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    full_name: updatedProfile.full_name,
    phone: updatedProfile.phone,
    avatar_url: updatedProfile.avatar_url,
    bio: updatedProfile.bio,
    created_at: user.created_at,
    updated_at: updatedProfile.updated_at,
  };
};

/**
 * Changes a user's password securely after verifying current password.
 *
 * @param {string} userId - User UUID
 * @param {Object} passwordData - { current_password, new_password }
 * @returns {Promise<Object>} Success response
 */
const changePassword = async (userId, { current_password, new_password }) => {
  // 1. Retrieve user authentication record
  const userResult = await query(
    'SELECT id, email, password_hash, is_active FROM public.users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const user = userResult.rows[0];

  if (!user.is_active) {
    const err = new Error('Account has been deactivated');
    err.statusCode = 403;
    throw err;
  }

  // 2. Verify current password
  const isMatch = await bcrypt.compare(current_password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Current password is incorrect');
    err.statusCode = 401;
    throw err;
  }

  // 3. Prevent setting the same password
  const isSamePassword = await bcrypt.compare(new_password, user.password_hash);
  if (isSamePassword) {
    const err = new Error('New password must be different from current password');
    err.statusCode = 400;
    throw err;
  }

  // 4. Hash new password with bcrypt (cost factor 12)
  const newPasswordHash = await bcrypt.hash(new_password, BCRYPT_SALT_ROUNDS);

  // 5. Update user password in database
  await query(
    'UPDATE public.users SET password_hash = $1 WHERE id = $2',
    [newPasswordHash, userId]
  );

  return {
    success: true,
    message: 'Password changed successfully. Please use your new password on next login.',
  };
};

/**
 * Retrieves an account dashboard summary for the current customer.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Account summary metrics
 */
const getUserSummary = async (userId) => {
  const [ordersSummary, activeOrders, addressesCount, cartSummary, wishlistCount, reviewsCount] = await Promise.all([
    query('SELECT COUNT(*)::int AS total_orders, COALESCE(SUM(total_amount), 0)::float AS total_spent FROM public.orders WHERE user_id = $1', [userId]),
    query("SELECT COUNT(*)::int AS active_orders FROM public.orders WHERE user_id = $1 AND order_status IN ('pending', 'processing', 'shipped')", [userId]),
    query('SELECT COUNT(*)::int AS saved_addresses FROM public.addresses WHERE user_id = $1', [userId]),
    query('SELECT COALESCE(SUM(ci.quantity), 0)::int AS total_cart_items FROM public.cart_items ci JOIN public.carts c ON ci.cart_id = c.id WHERE c.user_id = $1', [userId]),
    query('SELECT COUNT(*)::int AS total_wishlist_items FROM public.wishlist_items wi JOIN public.wishlists w ON wi.wishlist_id = w.id WHERE w.user_id = $1', [userId]),
    query('SELECT COUNT(*)::int AS total_reviews FROM public.reviews WHERE user_id = $1', [userId]),
  ]);

  return {
    orders: {
      total_orders: ordersSummary.rows[0].total_orders,
      active_orders: activeOrders.rows[0].active_orders,
      total_spent: ordersSummary.rows[0].total_spent,
    },
    addresses: {
      saved_addresses: addressesCount.rows[0].saved_addresses,
    },
    cart: {
      total_items: cartSummary.rows[0].total_cart_items,
    },
    wishlist: {
      total_items: wishlistCount.rows[0].total_wishlist_items,
    },
    reviews: {
      total_submitted: reviewsCount.rows[0].total_reviews,
    },
  };
};

module.exports = {
  updateProfile,
  changePassword,
  getUserSummary,
};
