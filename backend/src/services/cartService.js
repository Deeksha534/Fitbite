const { pool, query } = require('../config/database');

/**
 * Ensures a persistent shopping cart row exists for the user and returns the cart ID.
 *
 * @param {Object} db - Database client or pool
 * @param {string} userId - User UUID
 * @returns {Promise<string>} Cart UUID
 */
const getOrCreateCart = async (db, userId) => {
  const findRes = await db.query('SELECT id FROM public.carts WHERE user_id = $1', [userId]);
  if (findRes.rows.length > 0) {
    return findRes.rows[0].id;
  }

  const insertRes = await db.query(
    `INSERT INTO public.carts (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING id`,
    [userId]
  );

  if (insertRes.rows.length > 0) {
    return insertRes.rows[0].id;
  }

  const fallback = await db.query('SELECT id FROM public.carts WHERE user_id = $1', [userId]);
  return fallback.rows[0].id;
};

/**
 * Formats full cart object with joined product details, subtotals, and stock indicators.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Cart data structure
 */
const getCart = async (userId) => {
  await getOrCreateCart(pool, userId);

  const sql = `
    SELECT c.id AS cart_id, c.updated_at AS cart_updated_at,
           ci.id AS item_id, ci.quantity, ci.created_at AS item_created_at, ci.updated_at AS item_updated_at,
           p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
           p.price, p.compare_at_price, p.flavor, p.protein_grams, p.calories,
           p.stock_quantity, p.is_active,
           pi.image_url AS primary_image_url,
           pi.alt_text AS primary_image_alt
    FROM public.carts c
    LEFT JOIN public.cart_items ci ON c.id = ci.cart_id
    LEFT JOIN public.products p ON ci.product_id = p.id
    LEFT JOIN LATERAL (
      SELECT image_url, alt_text
      FROM public.product_images
      WHERE product_id = p.id
      ORDER BY is_primary DESC, display_order ASC, created_at ASC
      LIMIT 1
    ) pi ON true
    WHERE c.user_id = $1
    ORDER BY ci.created_at ASC;
  `;

  const result = await query(sql, [userId]);

  const items = [];
  let subtotal = 0;
  let totalItems = 0;
  let hasOutOfStockItems = false;
  let cartId = null;

  for (const row of result.rows) {
    cartId = row.cart_id;
    if (!row.item_id) continue;

    const unitPrice = Number(row.price);
    const itemSubtotal = unitPrice * row.quantity;
    const inStock = Boolean(row.is_active && row.stock_quantity >= row.quantity);

    if (!inStock) {
      hasOutOfStockItems = true;
    }

    subtotal += itemSubtotal;
    totalItems += row.quantity;

    items.push({
      id: row.item_id,
      product: {
        id: row.product_id,
        name: row.product_name,
        slug: row.product_slug,
        price: row.price,
        compare_at_price: row.compare_at_price,
        flavor: row.flavor,
        protein_grams: row.protein_grams,
        calories: row.calories,
        stock_quantity: row.stock_quantity,
        is_active: row.is_active,
        image_url: row.primary_image_url,
        image_alt: row.primary_image_alt,
      },
      quantity: row.quantity,
      unit_price: unitPrice.toFixed(2),
      item_subtotal: itemSubtotal.toFixed(2),
      is_in_stock: inStock,
      available_stock: row.stock_quantity,
    });
  }

  // Free shipping threshold: Orders > ₹500 get free shipping, else ₹50
  const shippingFee = subtotal >= 500 || subtotal === 0 ? 0 : 50;
  const grandTotal = subtotal + shippingFee;

  return {
    cart_id: cartId,
    items,
    item_count: totalItems,
    subtotal: subtotal.toFixed(2),
    estimated_shipping_fee: shippingFee.toFixed(2),
    estimated_total: grandTotal.toFixed(2),
    free_shipping_qualified: subtotal >= 500,
    has_out_of_stock_items: hasOutOfStockItems,
  };
};

/**
 * Adds an item to the user's cart with transactional stock lock and combined-quantity validation.
 *
 * @param {string} userId - User UUID
 * @param {Object} itemData - { product_id, quantity }
 * @returns {Promise<Object>} Updated cart
 */
const addItem = async (userId, { product_id, quantity = 1 }) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Lock product row to prevent race conditions on stock quantity
    const prodRes = await client.query(
      `SELECT id, name, price, stock_quantity, is_active
       FROM public.products
       WHERE id = $1
       FOR UPDATE`,
      [product_id]
    );

    if (prodRes.rows.length === 0) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }

    const product = prodRes.rows[0];

    if (!product.is_active) {
      const err = new Error(`'${product.name}' is currently unavailable`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Ensure user cart exists
    const cartId = await getOrCreateCart(client, userId);

    // 3. Lock existing cart item if present to evaluate combined quantity
    const existingItemRes = await client.query(
      `SELECT id, quantity
       FROM public.cart_items
       WHERE cart_id = $1 AND product_id = $2
       FOR UPDATE`,
      [cartId, product_id]
    );

    const currentQty = existingItemRes.rows.length > 0 ? existingItemRes.rows[0].quantity : 0;
    const combinedQty = currentQty + quantity;

    // 4. Validate combined quantity against available stock
    if (combinedQty > product.stock_quantity) {
      const available = product.stock_quantity - currentQty;
      const err = new Error(
        available > 0
          ? `Cannot add ${quantity} more. You already have ${currentQty} in your cart, and only ${product.stock_quantity} total are in stock.`
          : `You already have all ${product.stock_quantity} available units of '${product.name}' in your cart.`
      );
      err.statusCode = 400;
      throw err;
    }

    // 5. Upsert line item
    await client.query(
      `INSERT INTO public.cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = NOW()`,
      [cartId, product_id, quantity]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return getCart(userId);
};

/**
 * Updates quantity of a specific cart item with transactional stock lock.
 *
 * @param {string} userId - User UUID
 * @param {string} itemId - Cart item UUID
 * @param {number} quantity - New quantity
 * @returns {Promise<Object>} Updated cart
 */
const updateItemQuantity = async (userId, itemId, quantity) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify item ownership and lock product + cart_item
    const itemRes = await client.query(
      `SELECT ci.id AS item_id, ci.cart_id, ci.product_id,
              p.name AS product_name, p.stock_quantity, p.is_active,
              c.user_id
       FROM public.cart_items ci
       JOIN public.carts c ON ci.cart_id = c.id
       JOIN public.products p ON ci.product_id = p.id
       WHERE ci.id = $1 AND c.user_id = $2
       FOR UPDATE OF p, ci`,
      [itemId, userId]
    );

    if (itemRes.rows.length === 0) {
      const err = new Error('Cart item not found');
      err.statusCode = 404;
      throw err;
    }

    const row = itemRes.rows[0];

    if (!row.is_active) {
      const err = new Error(`'${row.product_name}' is currently unavailable`);
      err.statusCode = 400;
      throw err;
    }

    if (quantity > row.stock_quantity) {
      const err = new Error(
        `Requested quantity (${quantity}) exceeds available stock (${row.stock_quantity}) for '${row.product_name}'`
      );
      err.statusCode = 400;
      throw err;
    }

    // 2. Update line item quantity
    await client.query(
      `UPDATE public.cart_items
       SET quantity = $1, updated_at = NOW()
       WHERE id = $2`,
      [quantity, itemId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return getCart(userId);
};

/**
 * Removes a single item from user's cart with ownership check.
 *
 * @param {string} userId - User UUID
 * @param {string} itemId - Cart item UUID
 * @returns {Promise<Object>} Updated cart
 */
const removeItem = async (userId, itemId) => {
  const existing = await query(
    `SELECT ci.id
     FROM public.cart_items ci
     JOIN public.carts c ON ci.cart_id = c.id
     WHERE ci.id = $1 AND c.user_id = $2`,
    [itemId, userId]
  );

  if (existing.rows.length === 0) {
    const err = new Error('Cart item not found');
    err.statusCode = 404;
    throw err;
  }

  await query('DELETE FROM public.cart_items WHERE id = $1', [itemId]);
  return getCart(userId);
};

/**
 * Clears all items from user's cart.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Cleared cart
 */
const clearCart = async (userId) => {
  await query(
    `DELETE FROM public.cart_items
     WHERE cart_id = (SELECT id FROM public.carts WHERE user_id = $1)`,
    [userId]
  );

  return getCart(userId);
};

module.exports = {
  getOrCreateCart,
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
};
