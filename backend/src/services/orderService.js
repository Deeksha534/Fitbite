const { pool, query } = require('../config/database');
const { UUID_REGEX } = require('../validators/paramValidator');

/**
 * Generates a human-friendly unique order number (e.g., FB-20260827-7K9A).
 */
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FB-${dateStr}-${randomSuffix}`;
};

/**
 * Creates an order from the customer's current shopping cart in an atomic PostgreSQL transaction.
 *
 * @param {string} userId - Customer user UUID
 * @param {Object} payload - Order parameters
 * @returns {Promise<Object>} Created order with line items
 */
const createOrderFromCart = async (userId, payload) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Lock user's cart items and product rows to prevent overselling race conditions
    const cartItemsQuery = `
      SELECT ci.id AS cart_item_id, ci.quantity,
             p.id AS product_id, p.name AS product_name, p.flavor AS product_flavor,
             p.price, p.stock_quantity, p.is_active,
             pi.image_url AS primary_image_url
      FROM public.cart_items ci
      JOIN public.carts c ON ci.cart_id = c.id
      JOIN public.products p ON ci.product_id = p.id
      LEFT JOIN LATERAL (
        SELECT image_url FROM public.product_images
        WHERE product_id = p.id
        ORDER BY is_primary DESC, display_order ASC, created_at ASC
        LIMIT 1
      ) pi ON true
      WHERE c.user_id = $1
      FOR UPDATE OF p;
    `;

    const cartRes = await client.query(cartItemsQuery, [userId]);

    if (cartRes.rows.length === 0) {
      const err = new Error('Your shopping cart is empty');
      err.statusCode = 400;
      throw err;
    }

    // 2. Validate stock availability and product active state
    for (const item of cartRes.rows) {
      if (!item.is_active) {
        const err = new Error(`'${item.product_name}' is currently unavailable`);
        err.statusCode = 400;
        throw err;
      }

      if (item.stock_quantity < item.quantity) {
        const err = new Error(
          `Insufficient stock for '${item.product_name}'. Available: ${item.stock_quantity}, In cart: ${item.quantity}`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    // 3. Resolve shipping address and construct frozen JSON snapshot
    let shippingAddressSnapshot = null;
    let shippingAddressId = null;

    if (payload.shipping_address_id) {
      const addrRes = await client.query(
        `SELECT id, full_name, phone, street_address, apartment,
                city, state, postal_code, country
         FROM public.addresses
         WHERE id = $1 AND user_id = $2`,
        [payload.shipping_address_id, userId]
      );

      if (addrRes.rows.length === 0) {
        const err = new Error('Shipping address not found');
        err.statusCode = 404;
        throw err;
      }

      const addr = addrRes.rows[0];
      shippingAddressId = addr.id;
      shippingAddressSnapshot = {
        full_name: addr.full_name,
        phone: addr.phone,
        street_address: addr.street_address,
        apartment: addr.apartment,
        city: addr.city,
        state: addr.state,
        postal_code: addr.postal_code,
        country: addr.country,
      };
    } else if (payload.shipping_address) {
      shippingAddressSnapshot = {
        full_name: payload.shipping_address.full_name,
        phone: payload.shipping_address.phone,
        street_address: payload.shipping_address.street_address,
        apartment: payload.shipping_address.apartment || null,
        city: payload.shipping_address.city,
        state: payload.shipping_address.state,
        postal_code: payload.shipping_address.postal_code,
        country: payload.shipping_address.country || 'India',
      };
    }

    // 4. Calculate financial totals server-side
    let subtotal = 0;
    for (const item of cartRes.rows) {
      subtotal += Number(item.price) * item.quantity;
    }
    subtotal = Number(subtotal.toFixed(2));

    const shippingFee = subtotal >= 500 || subtotal === 0 ? 0 : 50;
    let discountAmount = 0;
    let appliedCouponId = null;

    if (payload.coupon_code && payload.coupon_code.trim().length > 0) {
      const normalizedCode = payload.coupon_code.trim().toUpperCase();
      const couponRes = await client.query(
        `SELECT id, code, discount_type, discount_value, min_order_amount,
                max_discount_amount, usage_limit, used_count, is_active, starts_at, expires_at
         FROM public.coupons
         WHERE UPPER(code) = $1
         FOR UPDATE`,
        [normalizedCode]
      );

      if (couponRes.rows.length === 0 || !couponRes.rows[0].is_active) {
        const err = new Error(`Coupon '${normalizedCode}' is invalid or inactive`);
        err.statusCode = 400;
        throw err;
      }

      const coupon = couponRes.rows[0];
      const now = new Date();

      if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        const err = new Error(`Coupon '${normalizedCode}' is not yet active`);
        err.statusCode = 400;
        throw err;
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < now) {
        const err = new Error(`Coupon '${normalizedCode}' has expired`);
        err.statusCode = 400;
        throw err;
      }

      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        const err = new Error(`Coupon '${normalizedCode}' usage limit has been reached`);
        err.statusCode = 400;
        throw err;
      }

      const minOrder = Number(coupon.min_order_amount || 0);
      if (subtotal < minOrder) {
        const err = new Error(
          `Minimum order subtotal of ₹${minOrder.toFixed(2)} required for coupon '${normalizedCode}'`
        );
        err.statusCode = 400;
        throw err;
      }

      if (coupon.discount_type === 'percentage') {
        const rawDiscount = (subtotal * Number(coupon.discount_value)) / 100;
        discountAmount = coupon.max_discount_amount
          ? Math.min(rawDiscount, Number(coupon.max_discount_amount))
          : rawDiscount;
      } else if (coupon.discount_type === 'fixed') {
        discountAmount = Math.min(Number(coupon.discount_value), subtotal);
      }

      discountAmount = Number(discountAmount.toFixed(2));
      appliedCouponId = coupon.id;
    }

    const totalAmount = Number(Math.max(0, subtotal + shippingFee - discountAmount).toFixed(2));

    // 5. Generate unique order number
    let orderNumber = generateOrderNumber();
    let orderNumberUnique = false;
    while (!orderNumberUnique) {
      const checkRes = await client.query(
        'SELECT id FROM public.orders WHERE order_number = $1',
        [orderNumber]
      );
      if (checkRes.rows.length === 0) {
        orderNumberUnique = true;
      } else {
        orderNumber = generateOrderNumber();
      }
    }

    // Initial payment status
    const paymentStatus = payload.payment_method === 'cod' ? 'unpaid' : 'paid';

    // 6. Insert Order Record
    const orderInsertSql = `
      INSERT INTO public.orders (
        order_number, user_id, shipping_address_id, shipping_address_snapshot,
        subtotal_amount, shipping_fee, discount_amount, total_amount,
        order_status, payment_status, payment_method, payment_reference_id, delivery_notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12)
      RETURNING id, order_number, user_id, shipping_address_id, shipping_address_snapshot,
                subtotal_amount, shipping_fee, discount_amount, total_amount,
                order_status, payment_status, payment_method, payment_reference_id,
                delivery_notes, created_at, updated_at;
    `;

    const orderInsertParams = [
      orderNumber,
      userId,
      shippingAddressId,
      JSON.stringify(shippingAddressSnapshot),
      subtotal.toFixed(2),
      shippingFee.toFixed(2),
      discountAmount.toFixed(2),
      totalAmount.toFixed(2),
      paymentStatus,
      payload.payment_method,
      payload.payment_reference_id || null,
      payload.delivery_notes || null,
    ];

    const orderRes = await client.query(orderInsertSql, orderInsertParams);
    const createdOrder = orderRes.rows[0];

    // Atomically increment coupon usage counter if coupon was applied
    if (appliedCouponId) {
      await client.query(
        `UPDATE public.coupons
         SET used_count = used_count + 1, updated_at = NOW()
         WHERE id = $1`,
        [appliedCouponId]
      );
    }

    // 7. Insert Order Items & Decrement Inventory Atomically
    const createdItems = [];
    for (const item of cartRes.rows) {
      const unitPrice = Number(item.price);
      const itemTotalPrice = unitPrice * item.quantity;

      const itemInsertSql = `
        INSERT INTO public.order_items (
          order_id, product_id, product_name_snapshot, product_flavor_snapshot,
          product_image_snapshot, unit_price_snapshot, quantity, total_price
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, order_id, product_id, product_name_snapshot, product_flavor_snapshot,
                  product_image_snapshot, unit_price_snapshot, quantity, total_price;
      `;

      const itemInsertParams = [
        createdOrder.id,
        item.product_id,
        item.product_name,
        item.product_flavor || null,
        item.primary_image_url || null,
        unitPrice.toFixed(2),
        item.quantity,
        itemTotalPrice.toFixed(2),
      ];

      const itemRes = await client.query(itemInsertSql, itemInsertParams);
      createdItems.push(itemRes.rows[0]);

      // Decrement stock
      await client.query(
        `UPDATE public.products
         SET stock_quantity = stock_quantity - $1, updated_at = NOW()
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 8. Clear customer shopping cart
    await client.query(
      `DELETE FROM public.cart_items
       WHERE cart_id = (SELECT id FROM public.carts WHERE user_id = $1)`,
      [userId]
    );

    await client.query('COMMIT');

    return {
      ...createdOrder,
      items: createdItems,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Retrieves paginated orders for a customer.
 *
 * @param {string} userId - Customer user UUID
 * @param {Object} queryParams - { page, limit, order_status }
 * @returns {Promise<Object>} Paginated orders list
 */
const getCustomerOrders = async (userId, queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(queryParams.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const conditions = ['o.user_id = $1'];
  const params = [userId];
  let paramIdx = 2;

  if (queryParams.order_status) {
    conditions.push(`o.order_status = $${paramIdx}`);
    params.push(queryParams.order_status);
    paramIdx++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Count total orders
  const countRes = await query(
    `SELECT COUNT(*)::int AS total FROM public.orders o ${whereClause}`,
    params
  );
  const total = countRes.rows[0].total;
  const totalPages = Math.ceil(total / limit) || 1;

  // Query order list with items aggregation
  const listSql = `
    SELECT o.id, o.order_number, o.subtotal_amount, o.shipping_fee, o.discount_amount,
           o.total_amount, o.order_status, o.payment_status, o.payment_method,
           o.delivery_notes, o.shipping_address_snapshot, o.created_at, o.updated_at,
           COUNT(oi.id)::int AS item_count,
           COALESCE(
             JSON_AGG(
               JSON_BUILD_OBJECT(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name_snapshot,
                 'product_flavor', oi.product_flavor_snapshot,
                 'product_image', oi.product_image_snapshot,
                 'unit_price', oi.unit_price_snapshot,
                 'quantity', oi.quantity,
                 'total_price', oi.total_price
               ) ORDER BY oi.created_at ASC
             ) FILTER (WHERE oi.id IS NOT NULL),
             '[]'::json
           ) AS items
    FROM public.orders o
    LEFT JOIN public.order_items oi ON o.id = oi.order_id
    ${whereClause}
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1};
  `;

  const listParams = [...params, limit, offset];
  const listRes = await query(listSql, listParams);

  return {
    orders: listRes.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Retrieves full order details by UUID or order_number with ownership verification.
 *
 * @param {string} userId - Requesting user UUID
 * @param {string} identifier - UUID or order_number
 * @param {boolean} isAdmin - Whether requesting user is admin
 * @returns {Promise<Object>} Order details
 */
const getOrderByIdOrNumber = async (userId, identifier, isAdmin = false) => {
  const isUuid = UUID_REGEX.test(identifier);
  const filterClause = isUuid ? 'o.id = $1' : 'o.order_number = $1';

  const sql = `
    SELECT o.id, o.order_number, o.user_id, o.shipping_address_id, o.shipping_address_snapshot,
           o.subtotal_amount, o.shipping_fee, o.discount_amount, o.total_amount,
           o.order_status, o.payment_status, o.payment_method, o.payment_reference_id,
           o.delivery_notes, o.created_at, o.updated_at,
           u.email AS customer_email,
           p.full_name AS customer_name,
           p.phone AS customer_phone,
           COALESCE(
             JSON_AGG(
               JSON_BUILD_OBJECT(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name_snapshot,
                 'product_flavor', oi.product_flavor_snapshot,
                 'product_image', oi.product_image_snapshot,
                 'unit_price', oi.unit_price_snapshot,
                 'quantity', oi.quantity,
                 'total_price', oi.total_price
               ) ORDER BY oi.created_at ASC
             ) FILTER (WHERE oi.id IS NOT NULL),
             '[]'::json
           ) AS items
    FROM public.orders o
    LEFT JOIN public.order_items oi ON o.id = oi.order_id
    LEFT JOIN public.users u ON o.user_id = u.id
    LEFT JOIN public.profiles p ON o.user_id = p.id
    WHERE ${filterClause}
    GROUP BY o.id, u.email, p.full_name, p.phone;
  `;

  const result = await query(sql, [identifier]);

  if (result.rows.length === 0) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  const order = result.rows[0];

  // Enforce customer ownership if not admin
  if (!isAdmin && order.user_id !== userId) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  return order;
};

/**
 * Cancels an order and transactionally restores product inventory.
 *
 * @param {string} userId - Requesting user UUID
 * @param {string} orderId - Order UUID
 * @param {boolean} isAdmin - Whether requesting user is admin
 * @returns {Promise<Object>} Updated order
 */
const cancelOrder = async (userId, orderId, isAdmin = false) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Lock order row
    const orderRes = await client.query(
      'SELECT id, user_id, order_status, payment_status FROM public.orders WHERE id = $1 FOR UPDATE',
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    const order = orderRes.rows[0];

    // 2. Enforce customer ownership
    if (!isAdmin && order.user_id !== userId) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    // 3. Status checks
    if (order.order_status === 'cancelled') {
      const err = new Error('Order is already cancelled');
      err.statusCode = 400;
      throw err;
    }

    // Customer can only cancel 'pending' orders
    if (!isAdmin && order.order_status !== 'pending') {
      const err = new Error(
        `Cannot cancel order with status '${order.order_status}'. Only pending orders can be cancelled.`
      );
      err.statusCode = 400;
      throw err;
    }

    // 4. Restore product inventory for items
    const itemsRes = await client.query(
      'SELECT product_id, quantity FROM public.order_items WHERE order_id = $1',
      [orderId]
    );

    for (const item of itemsRes.rows) {
      if (item.product_id) {
        await client.query(
          `UPDATE public.products
           SET stock_quantity = stock_quantity + $1, updated_at = NOW()
           WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }
    }

    // 5. Update order status to cancelled
    const updateRes = await client.query(
      `UPDATE public.orders
       SET order_status = 'cancelled', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [orderId]
    );

    await client.query('COMMIT');

    return updateRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Retrieves all orders for the store (Admin only).
 *
 * @param {Object} queryParams - Filtering and pagination parameters
 * @returns {Promise<Object>} Paginated store orders
 */
const getAdminOrders = async (queryParams = {}) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(queryParams.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (queryParams.order_status) {
    conditions.push(`o.order_status = $${paramIdx}`);
    params.push(queryParams.order_status);
    paramIdx++;
  }

  if (queryParams.payment_status) {
    conditions.push(`o.payment_status = $${paramIdx}`);
    params.push(queryParams.payment_status);
    paramIdx++;
  }

  if (queryParams.search) {
    conditions.push(
      `(o.order_number ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx} OR p.full_name ILIKE $${paramIdx})`
    );
    params.push(`%${queryParams.search}%`);
    paramIdx++;
  }

  if (queryParams.start_date) {
    conditions.push(`o.created_at >= $${paramIdx}`);
    params.push(queryParams.start_date);
    paramIdx++;
  }

  if (queryParams.end_date) {
    conditions.push(`o.created_at <= $${paramIdx}`);
    params.push(queryParams.end_date);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Order sorting
  let orderByClause = 'ORDER BY o.created_at DESC';
  if (queryParams.sort === 'oldest') orderByClause = 'ORDER BY o.created_at ASC';
  if (queryParams.sort === 'total_asc') orderByClause = 'ORDER BY o.total_amount ASC';
  if (queryParams.sort === 'total_desc') orderByClause = 'ORDER BY o.total_amount DESC';

  const countRes = await query(
    `SELECT COUNT(*)::int AS total
     FROM public.orders o
     LEFT JOIN public.users u ON o.user_id = u.id
     LEFT JOIN public.profiles p ON o.user_id = p.id
     ${whereClause}`,
    params
  );
  const total = countRes.rows[0].total;
  const totalPages = Math.ceil(total / limit) || 1;

  const listSql = `
    SELECT o.id, o.order_number, o.user_id, o.subtotal_amount, o.shipping_fee,
           o.discount_amount, o.total_amount, o.order_status, o.payment_status,
           o.payment_method, o.payment_reference_id, o.delivery_notes,
           o.shipping_address_snapshot, o.created_at, o.updated_at,
           u.email AS customer_email,
           p.full_name AS customer_name,
           p.phone AS customer_phone,
           COUNT(oi.id)::int AS item_count,
           COALESCE(
             JSON_AGG(
               JSON_BUILD_OBJECT(
                 'id', oi.id,
                 'product_id', oi.product_id,
                 'product_name', oi.product_name_snapshot,
                 'product_flavor', oi.product_flavor_snapshot,
                 'product_image', oi.product_image_snapshot,
                 'unit_price', oi.unit_price_snapshot,
                 'quantity', oi.quantity,
                 'total_price', oi.total_price
               ) ORDER BY oi.created_at ASC
             ) FILTER (WHERE oi.id IS NOT NULL),
             '[]'::json
           ) AS items
    FROM public.orders o
    LEFT JOIN public.order_items oi ON o.id = oi.order_id
    LEFT JOIN public.users u ON o.user_id = u.id
    LEFT JOIN public.profiles p ON o.user_id = p.id
    ${whereClause}
    GROUP BY o.id, u.email, p.full_name, p.phone
    ${orderByClause}
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1};
  `;

  const listParams = [...params, limit, offset];
  const listRes = await query(listSql, listParams);

  return {
    orders: listRes.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Updates order status and payment status by Admin with stock restoration on cancellation.
 *
 * @param {string} orderId - Order UUID
 * @param {Object} statusData - { order_status, payment_status }
 * @returns {Promise<Object>} Updated order details
 */
const updateOrderStatusByAdmin = async (orderId, statusData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderRes = await client.query(
      'SELECT id, order_status, payment_status FROM public.orders WHERE id = $1 FOR UPDATE',
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      const err = new Error('Order not found');
      err.statusCode = 404;
      throw err;
    }

    const currentOrder = orderRes.rows[0];
    const newOrderStatus = statusData.order_status || currentOrder.order_status;
    const newPaymentStatus = statusData.payment_status || currentOrder.payment_status;

    // If transitioned to 'cancelled' from an active state, restore inventory
    if (newOrderStatus === 'cancelled' && currentOrder.order_status !== 'cancelled') {
      const itemsRes = await client.query(
        'SELECT product_id, quantity FROM public.order_items WHERE order_id = $1',
        [orderId]
      );
      for (const item of itemsRes.rows) {
        if (item.product_id) {
          await client.query(
            `UPDATE public.products
             SET stock_quantity = stock_quantity + $1, updated_at = NOW()
             WHERE id = $2`,
            [item.quantity, item.product_id]
          );
        }
      }
    }

    const updateSql = `
      UPDATE public.orders
      SET order_status = $1, payment_status = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;

    const updateRes = await client.query(updateSql, [newOrderStatus, newPaymentStatus, orderId]);
    await client.query('COMMIT');

    return getOrderByIdOrNumber(null, orderId, true);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  createOrderFromCart,
  getCustomerOrders,
  getOrderByIdOrNumber,
  cancelOrder,
  getAdminOrders,
  updateOrderStatusByAdmin,
};
