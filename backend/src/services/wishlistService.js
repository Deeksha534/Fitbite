const { pool, query } = require('../config/database');
const { getOrCreateCart, getCart } = require('./cartService');

/**
 * Ensures a persistent wishlist row exists for the user and returns the wishlist ID.
 *
 * @param {Object} db - Database client or pool
 * @param {string} userId - User UUID
 * @returns {Promise<string>} Wishlist UUID
 */
const getOrCreateWishlist = async (db, userId) => {
  const findRes = await db.query('SELECT id FROM public.wishlists WHERE user_id = $1', [userId]);
  if (findRes.rows.length > 0) {
    return findRes.rows[0].id;
  }

  const insertRes = await db.query(
    `INSERT INTO public.wishlists (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING id`,
    [userId]
  );

  if (insertRes.rows.length > 0) {
    return insertRes.rows[0].id;
  }

  const fallback = await db.query('SELECT id FROM public.wishlists WHERE user_id = $1', [userId]);
  return fallback.rows[0].id;
};

/**
 * Formats customer wishlist items with joined product info and primary thumbnail.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Wishlist items list
 */
const getWishlist = async (userId) => {
  await getOrCreateWishlist(pool, userId);

  const sql = `
    SELECT w.id AS wishlist_id,
           wi.id AS item_id, wi.created_at AS added_at,
           p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
           p.price, p.compare_at_price, p.flavor, p.protein_grams, p.calories,
           p.stock_quantity, p.is_active,
           pi.image_url AS primary_image_url,
           pi.alt_text AS primary_image_alt
    FROM public.wishlists w
    LEFT JOIN public.wishlist_items wi ON w.id = wi.wishlist_id
    LEFT JOIN public.products p ON wi.product_id = p.id
    LEFT JOIN LATERAL (
      SELECT image_url, alt_text
      FROM public.product_images
      WHERE product_id = p.id
      ORDER BY is_primary DESC, display_order ASC, created_at ASC
      LIMIT 1
    ) pi ON true
    WHERE w.user_id = $1
    ORDER BY wi.created_at DESC;
  `;

  const result = await query(sql, [userId]);

  const items = [];
  let wishlistId = null;

  for (const row of result.rows) {
    wishlistId = row.wishlist_id;
    if (!row.item_id) continue;

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
      is_in_stock: Boolean(row.is_active && row.stock_quantity > 0),
      added_at: row.added_at,
    });
  }

  return {
    wishlist_id: wishlistId,
    item_count: items.length,
    items,
  };
};

/**
 * Adds a product to user's wishlist idempotently.
 *
 * @param {string} userId - User UUID
 * @param {string} productId - Product UUID
 * @returns {Promise<Object>} { isNew: boolean, wishlist: Object }
 */
const addItem = async (userId, productId) => {
  // 1. Verify product exists
  const prodRes = await query(
    'SELECT id, name, is_active FROM public.products WHERE id = $1',
    [productId]
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

  // 2. Ensure wishlist exists
  const wishlistId = await getOrCreateWishlist(pool, userId);

  // 3. Insert item idempotently
  const insertRes = await query(
    `INSERT INTO public.wishlist_items (wishlist_id, product_id)
     VALUES ($1, $2)
     ON CONFLICT (wishlist_id, product_id) DO NOTHING
     RETURNING id`,
    [wishlistId, productId]
  );

  const isNew = insertRes.rows.length > 0;
  const wishlist = await getWishlist(userId);

  return {
    isNew,
    wishlist,
  };
};

/**
 * Removes an item from user's wishlist with ownership verification.
 *
 * @param {string} userId - User UUID
 * @param {string} itemId - Wishlist item UUID
 * @returns {Promise<Object>} Updated wishlist
 */
const removeItem = async (userId, itemId) => {
  const existing = await query(
    `SELECT wi.id
     FROM public.wishlist_items wi
     JOIN public.wishlists w ON wi.wishlist_id = w.id
     WHERE wi.id = $1 AND w.user_id = $2`,
    [itemId, userId]
  );

  if (existing.rows.length === 0) {
    const err = new Error('Wishlist item not found');
    err.statusCode = 404;
    throw err;
  }

  await query('DELETE FROM public.wishlist_items WHERE id = $1', [itemId]);
  return getWishlist(userId);
};

/**
 * Atomically moves an item from customer's wishlist into their shopping cart.
 *
 * @param {string} userId - User UUID
 * @param {string} itemId - Wishlist item UUID
 * @returns {Promise<Object>} { cart, wishlist }
 */
const moveToCart = async (userId, itemId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify item in user's wishlist and lock product stock
    const itemRes = await client.query(
      `SELECT wi.id AS item_id, wi.wishlist_id, wi.product_id,
              p.name AS product_name, p.price, p.stock_quantity, p.is_active
       FROM public.wishlist_items wi
       JOIN public.wishlists w ON wi.wishlist_id = w.id
       JOIN public.products p ON wi.product_id = p.id
       WHERE wi.id = $1 AND w.user_id = $2
       FOR UPDATE OF p`,
      [itemId, userId]
    );

    if (itemRes.rows.length === 0) {
      const err = new Error('Wishlist item not found');
      err.statusCode = 404;
      throw err;
    }

    const row = itemRes.rows[0];

    if (!row.is_active) {
      const err = new Error(`'${row.product_name}' is currently unavailable`);
      err.statusCode = 400;
      throw err;
    }

    if (row.stock_quantity <= 0) {
      const err = new Error(`'${row.product_name}' is currently out of stock`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Ensure cart exists
    const cartId = await getOrCreateCart(client, userId);

    // 3. Check combined quantity in cart
    const existingCartItem = await client.query(
      `SELECT id, quantity
       FROM public.cart_items
       WHERE cart_id = $1 AND product_id = $2
       FOR UPDATE`,
      [cartId, row.product_id]
    );

    const currentQty = existingCartItem.rows.length > 0 ? existingCartItem.rows[0].quantity : 0;
    const combinedQty = currentQty + 1;

    if (combinedQty > row.stock_quantity) {
      const err = new Error(
        `Cannot move to cart: you already have ${currentQty} in your cart, and only ${row.stock_quantity} are in stock.`
      );
      err.statusCode = 400;
      throw err;
    }

    // 4. Upsert into cart
    await client.query(
      `INSERT INTO public.cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, 1)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + 1, updated_at = NOW()`,
      [cartId, row.product_id]
    );

    // 5. Delete item from wishlist
    await client.query('DELETE FROM public.wishlist_items WHERE id = $1', [itemId]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const [cart, wishlist] = await Promise.all([getCart(userId), getWishlist(userId)]);
  return { cart, wishlist };
};

module.exports = {
  getOrCreateWishlist,
  getWishlist,
  addItem,
  removeItem,
  moveToCart,
};
