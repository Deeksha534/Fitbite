const { query } = require('../config/database');

/**
 * Service managing promotional discount coupons, cart threshold validation,
 * usage tracking, and administrative coupon CRUD.
 */

/**
 * Calculates discount amount given a coupon record and a subtotal.
 *
 * @param {Object} coupon - Database coupon record
 * @param {number} subtotal - Subtotal amount
 * @returns {number} Calculated discount amount
 */
const calculateDiscount = (coupon, subtotal) => {
  let discount = 0;

  if (coupon.discount_type === 'percentage') {
    const rawDiscount = (subtotal * Number(coupon.discount_value)) / 100;
    discount = coupon.max_discount_amount
      ? Math.min(rawDiscount, Number(coupon.max_discount_amount))
      : rawDiscount;
  } else if (coupon.discount_type === 'fixed') {
    discount = Math.min(Number(coupon.discount_value), subtotal);
  }

  return Number(Math.max(0, discount).toFixed(2));
};

/**
 * Validates a coupon code against a user's current shopping cart and computes savings.
 *
 * @param {string} userId - Customer User UUID
 * @param {string} code - Coupon code string
 * @returns {Promise<Object>} Calculated discount and estimated order total
 */
const validateUserCoupon = async (userId, code) => {
  const normalizedCode = code.trim().toUpperCase();

  // 1. Fetch user's active cart and compute subtotal from authoritative product prices
  const cartResult = await query(
    `SELECT ci.quantity, p.id AS product_id, p.name, p.price, p.stock_quantity, p.is_active
     FROM public.carts c
     JOIN public.cart_items ci ON c.id = ci.cart_id
     JOIN public.products p ON ci.product_id = p.id
     WHERE c.user_id = $1`,
    [userId]
  );

  if (cartResult.rows.length === 0) {
    const err = new Error('Your shopping cart is empty');
    err.statusCode = 400;
    throw err;
  }

  // Calculate cart subtotal
  let subtotal = 0;
  for (const item of cartResult.rows) {
    if (!item.is_active) {
      const err = new Error(`Product '${item.name}' is no longer active`);
      err.statusCode = 400;
      throw err;
    }
    subtotal += Number(item.price) * item.quantity;
  }
  subtotal = Number(subtotal.toFixed(2));

  // 2. Fetch coupon by code
  const couponResult = await query(
    `SELECT id, code, discount_type, discount_value, min_order_amount, max_discount_amount,
            usage_limit, used_count, is_active, starts_at, expires_at
     FROM public.coupons
     WHERE UPPER(code) = $1`,
    [normalizedCode]
  );

  if (couponResult.rows.length === 0 || !couponResult.rows[0].is_active) {
    const err = new Error(`Coupon '${normalizedCode}' is invalid or inactive`);
    err.statusCode = 400;
    throw err;
  }

  const coupon = couponResult.rows[0];
  const now = new Date();

  // Verify activation date
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    const err = new Error(`Coupon '${normalizedCode}' is not yet active`);
    err.statusCode = 400;
    throw err;
  }

  // Verify expiration date
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    const err = new Error(`Coupon '${normalizedCode}' has expired`);
    err.statusCode = 400;
    throw err;
  }

  // Verify total usage limit
  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
    const err = new Error(`Coupon '${normalizedCode}' usage limit has been reached`);
    err.statusCode = 400;
    throw err;
  }

  // Verify minimum order threshold
  const minOrder = Number(coupon.min_order_amount || 0);
  if (subtotal < minOrder) {
    const err = new Error(
      `Minimum order subtotal of ₹${minOrder.toFixed(2)} required for coupon '${normalizedCode}' (Current subtotal: ₹${subtotal.toFixed(2)})`
    );
    err.statusCode = 400;
    throw err;
  }

  // 3. Compute discount and revised total
  const discountAmount = calculateDiscount(coupon, subtotal);
  const shippingFee = subtotal > 500 ? 0 : 50;
  const estimatedTotal = Number(Math.max(0, subtotal + shippingFee - discountAmount).toFixed(2));

  return {
    valid: true,
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: Number(coupon.discount_value),
    min_order_amount: minOrder,
    max_discount_amount: coupon.max_discount_amount ? Number(coupon.max_discount_amount) : null,
    subtotal_amount: subtotal,
    discount_amount: discountAmount,
    shipping_fee: shippingFee,
    estimated_total: estimatedTotal,
    message:
      coupon.discount_type === 'percentage'
        ? `Applied ${coupon.discount_value}% discount (Saved ₹${discountAmount.toFixed(2)})`
        : `Applied flat ₹${coupon.discount_value} discount`,
  };
};

/**
 * Retrieves all coupons for store administrators with usage metrics and filters.
 *
 * @param {Object} options - { page, limit, is_active, discount_type, search }
 * @returns {Promise<Object>} Paginated coupons list
 */
const getAllCoupons = async ({ page = 1, limit = 20, is_active, discount_type, search } = {}) => {
  const whereConditions = [];
  const queryParams = [];
  let paramIndex = 1;

  if (is_active !== undefined) {
    whereConditions.push(`is_active = $${paramIndex++}`);
    queryParams.push(is_active);
  }

  if (discount_type) {
    whereConditions.push(`discount_type = $${paramIndex++}`);
    queryParams.push(discount_type);
  }

  if (search && search.trim().length > 0) {
    whereConditions.push(`code ILIKE $${paramIndex++}`);
    queryParams.push(`%${search.trim()}%`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Total count
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM public.coupons ${whereClause}`,
    queryParams
  );
  const total = countResult.rows[0].total;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;

  // Fetch paginated coupons
  const dataParams = [...queryParams, limit, offset];
  const couponsResult = await query(
    `SELECT id, code, discount_type, discount_value::float, min_order_amount::float,
            max_discount_amount::float, usage_limit, used_count, is_active,
            starts_at, expires_at, created_at, updated_at
     FROM public.coupons
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    dataParams
  );

  return {
    coupons: couponsResult.rows,
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

/**
 * Creates a new promotional coupon code.
 *
 * @param {Object} data - Coupon fields
 * @returns {Promise<Object>} Created coupon
 */
const createCoupon = async (data) => {
  const normalizedCode = data.code.trim().toUpperCase();

  // Check code uniqueness
  const check = await query('SELECT id FROM public.coupons WHERE UPPER(code) = $1', [normalizedCode]);
  if (check.rows.length > 0) {
    const err = new Error(`Coupon with code '${normalizedCode}' already exists`);
    err.statusCode = 409;
    throw err;
  }

  const result = await query(
    `INSERT INTO public.coupons (
       code, discount_type, discount_value, min_order_amount,
       max_discount_amount, usage_limit, starts_at, expires_at, is_active
     )
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, NOW()), $8, COALESCE($9, true))
     RETURNING id, code, discount_type, discount_value::float, min_order_amount::float,
               max_discount_amount::float, usage_limit, used_count, is_active,
               starts_at, expires_at, created_at, updated_at`,
    [
      normalizedCode,
      data.discount_type,
      data.discount_value,
      data.min_order_amount || 0,
      data.max_discount_amount || null,
      data.usage_limit || null,
      data.starts_at || null,
      data.expires_at || null,
      data.is_active !== undefined ? data.is_active : true,
    ]
  );

  return result.rows[0];
};

/**
 * Updates an existing coupon code.
 *
 * @param {string} id - Coupon UUID
 * @param {Object} data - Updated fields
 * @returns {Promise<Object>} Updated coupon
 */
const updateCoupon = async (id, data) => {
  const check = await query('SELECT id, code FROM public.coupons WHERE id = $1', [id]);
  if (check.rows.length === 0) {
    const err = new Error('Coupon not found');
    err.statusCode = 404;
    throw err;
  }

  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (data.code) {
    const norm = data.code.trim().toUpperCase();
    updates.push(`code = $${paramIndex++}`);
    params.push(norm);
  }
  if (data.discount_type) {
    updates.push(`discount_type = $${paramIndex++}`);
    params.push(data.discount_type);
  }
  if (data.discount_value !== undefined) {
    updates.push(`discount_value = $${paramIndex++}`);
    params.push(data.discount_value);
  }
  if (data.min_order_amount !== undefined) {
    updates.push(`min_order_amount = $${paramIndex++}`);
    params.push(data.min_order_amount);
  }
  if (data.max_discount_amount !== undefined) {
    updates.push(`max_discount_amount = $${paramIndex++}`);
    params.push(data.max_discount_amount);
  }
  if (data.usage_limit !== undefined) {
    updates.push(`usage_limit = $${paramIndex++}`);
    params.push(data.usage_limit);
  }
  if (data.starts_at !== undefined) {
    updates.push(`starts_at = $${paramIndex++}`);
    params.push(data.starts_at);
  }
  if (data.expires_at !== undefined) {
    updates.push(`expires_at = $${paramIndex++}`);
    params.push(data.expires_at);
  }
  if (data.is_active !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    params.push(data.is_active);
  }

  params.push(id);

  const result = await query(
    `UPDATE public.coupons
     SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, code, discount_type, discount_value::float, min_order_amount::float,
               max_discount_amount::float, usage_limit, used_count, is_active,
               starts_at, expires_at, created_at, updated_at`,
    params
  );

  return result.rows[0];
};

/**
 * Deletes a coupon code.
 *
 * @param {string} id - Coupon UUID
 * @returns {Promise<Object>} Deletion result
 */
const deleteCoupon = async (id) => {
  const result = await query('DELETE FROM public.coupons WHERE id = $1 RETURNING id, code', [id]);
  if (result.rows.length === 0) {
    const err = new Error('Coupon not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    success: true,
    message: `Coupon '${result.rows[0].code}' deleted successfully`,
    deleted_id: id,
  };
};

module.exports = {
  calculateDiscount,
  validateUserCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
