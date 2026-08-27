const { pool, query } = require('../config/database');

/**
 * Retrieves a paginated list of products with optional search, category, flavor,
 * price filtering, and sorting.
 *
 * @param {Object} filters - Query parameters { search, category_id, min_price, max_price, flavor, is_active, is_featured, sort, page, limit }
 * @param {string|null} userRole - 'admin' or 'customer' or null
 * @returns {Promise<Object>} Object containing products array and pagination metadata
 */
const getProducts = async (filters = {}, userRole = null) => {
  const {
    search,
    category_id,
    min_price,
    max_price,
    flavor,
    is_active,
    is_featured,
    sort = 'newest',
    page = 1,
    limit = 10,
  } = filters;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // 1. Role-based active status filter
  const isAdmin = userRole === 'admin';
  if (!isAdmin) {
    // Public visitors only see active products
    conditions.push('p.is_active = true');
  } else if (is_active !== undefined) {
    conditions.push(`p.is_active = $${paramIndex++}`);
    params.push(Boolean(is_active));
  }

  // 2. Search filter (matches name, description, flavor)
  if (search && search.trim().length > 0) {
    conditions.push(
      `(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.flavor ILIKE $${paramIndex})`
    );
    params.push(`%${search.trim()}%`);
    paramIndex++;
  }

  // 3. Category filter
  if (category_id) {
    conditions.push(`p.category_id = $${paramIndex++}`);
    params.push(category_id);
  }

  // 4. Price range filter
  if (min_price !== undefined) {
    conditions.push(`p.price >= $${paramIndex++}`);
    params.push(Number(min_price));
  }

  if (max_price !== undefined) {
    conditions.push(`p.price <= $${paramIndex++}`);
    params.push(Number(max_price));
  }

  // 5. Flavor filter
  if (flavor && flavor.trim().length > 0) {
    conditions.push(`p.flavor ILIKE $${paramIndex++}`);
    params.push(`%${flavor.trim()}%`);
  }

  // 6. Featured filter
  if (is_featured !== undefined) {
    conditions.push(`p.is_featured = $${paramIndex++}`);
    params.push(Boolean(is_featured));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 7. Sort mappings
  let orderClause;
  switch (sort) {
    case 'price_asc':
      orderClause = 'ORDER BY p.price ASC, p.created_at DESC';
      break;
    case 'price_desc':
      orderClause = 'ORDER BY p.price DESC, p.created_at DESC';
      break;
    case 'calories_asc':
      orderClause = 'ORDER BY p.calories ASC, p.created_at DESC';
      break;
    case 'calories_desc':
      orderClause = 'ORDER BY p.calories DESC, p.created_at DESC';
      break;
    case 'featured':
      orderClause = 'ORDER BY p.is_featured DESC, p.created_at DESC';
      break;
    case 'newest':
    default:
      orderClause = 'ORDER BY p.created_at DESC';
      break;
  }

  // Count total matching items
  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM public.products p
    ${whereClause};
  `;
  const countResult = await query(countSql, params);
  const total = countResult.rows[0]?.total || 0;

  // Pagination bounds
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;
  const totalPages = Math.ceil(total / parsedLimit) || 1;

  // Query records with primary image thumbnail
  const recordsSql = `
    SELECT p.id, p.category_id, p.name, p.slug, p.description, p.price, p.compare_at_price,
           p.stock_quantity, p.flavor, p.protein_grams, p.fiber_grams, p.sugar_grams,
           p.calories, p.is_featured, p.is_active, p.created_at, p.updated_at,
           c.name AS category_name, c.slug AS category_slug,
           pi.image_url AS primary_image_url,
           pi.alt_text AS primary_image_alt
    FROM public.products p
    LEFT JOIN public.categories c ON p.category_id = c.id
    LEFT JOIN LATERAL (
      SELECT image_url, alt_text
      FROM public.product_images
      WHERE product_id = p.id
      ORDER BY is_primary DESC, display_order ASC, created_at ASC
      LIMIT 1
    ) pi ON true
    ${whereClause}
    ${orderClause}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++};
  `;

  const recordParams = [...params, parsedLimit, offset];
  const recordResult = await query(recordsSql, recordParams);

  return {
    products: recordResult.rows,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages,
    },
  };
};

/**
 * Retrieves a single product by UUID with its complete image gallery.
 *
 * @param {string} id - Product UUID
 * @param {string|null} userRole - 'admin' or 'customer' or null
 * @returns {Promise<Object>} Product details with images gallery
 */
const getProductById = async (id, userRole = null) => {
  const sql = `
    SELECT p.id, p.category_id, p.name, p.slug, p.description, p.price, p.compare_at_price,
           p.stock_quantity, p.flavor, p.protein_grams, p.fiber_grams, p.sugar_grams,
           p.calories, p.is_featured, p.is_active, p.created_at, p.updated_at,
           c.name AS category_name, c.slug AS category_slug
    FROM public.products p
    LEFT JOIN public.categories c ON p.category_id = c.id
    WHERE p.id = $1;
  `;

  const result = await query(sql, [id]);

  if (result.rows.length === 0) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }

  const product = result.rows[0];

  // Inactive products are not accessible to public users
  const isAdmin = userRole === 'admin';
  if (!product.is_active && !isAdmin) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }

  // Fetch complete gallery images ordered by display_order
  const imagesSql = `
    SELECT id, image_url, alt_text, display_order, is_primary, created_at
    FROM public.product_images
    WHERE product_id = $1
    ORDER BY is_primary DESC, display_order ASC, created_at ASC;
  `;

  const imagesResult = await query(imagesSql, [id]);
  product.images = imagesResult.rows;

  return product;
};

/**
 * Creates a new product with optional image gallery in an atomic transaction.
 *
 * @param {Object} productData - Product fields and optional images array
 * @returns {Promise<Object>} Created product
 */
const createProduct = async (productData) => {
  const {
    category_id,
    name,
    slug,
    description,
    price,
    compare_at_price,
    stock_quantity = 0,
    flavor,
    protein_grams = 0,
    fiber_grams = 0,
    sugar_grams = 0,
    calories = 0,
    is_featured = false,
    is_active = true,
    images = [],
  } = productData;

  const trimmedSlug = slug.trim().toLowerCase();
  const trimmedName = name.trim();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Check duplicate slug
    const dupCheck = await client.query(
      'SELECT id FROM public.products WHERE slug = $1',
      [trimmedSlug]
    );
    if (dupCheck.rows.length > 0) {
      const err = new Error(`A product with slug '${trimmedSlug}' already exists`);
      err.statusCode = 409;
      throw err;
    }

    // 2. Validate category_id exists if supplied
    if (category_id) {
      const catCheck = await client.query(
        'SELECT id FROM public.categories WHERE id = $1',
        [category_id]
      );
      if (catCheck.rows.length === 0) {
        const err = new Error('Specified category does not exist');
        err.statusCode = 400;
        throw err;
      }
    }

    // 3. Insert product record
    const insertProductSql = `
      INSERT INTO public.products (
        category_id, name, slug, description, price, compare_at_price,
        stock_quantity, flavor, protein_grams, fiber_grams, sugar_grams,
        calories, is_featured, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const productResult = await client.query(insertProductSql, [
      category_id || null,
      trimmedName,
      trimmedSlug,
      description !== undefined && description !== null ? description.trim() : null,
      price,
      compare_at_price !== undefined ? compare_at_price : null,
      stock_quantity,
      flavor !== undefined && flavor !== null ? flavor.trim() : null,
      protein_grams,
      fiber_grams,
      sugar_grams,
      calories,
      Boolean(is_featured),
      is_active !== undefined ? Boolean(is_active) : true,
    ]);

    const createdProduct = productResult.rows[0];

    // 4. Insert image gallery if provided
    const insertedImages = [];
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        const imgInsertSql = `
          INSERT INTO public.product_images (
            product_id, image_url, alt_text, display_order, is_primary
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING id, image_url, alt_text, display_order, is_primary, created_at;
        `;
        const imgRes = await client.query(imgInsertSql, [
          createdProduct.id,
          img.image_url.trim(),
          img.alt_text ? img.alt_text.trim() : null,
          img.display_order || 0,
          Boolean(img.is_primary),
        ]);
        insertedImages.push(imgRes.rows[0]);
      }
    }

    await client.query('COMMIT');
    createdProduct.images = insertedImages;
    return createdProduct;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Updates an existing product and its image gallery transactionally.
 *
 * @param {string} id - Product UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated product
 */
const updateProduct = async (id, updates) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify product exists
    const existing = await client.query('SELECT id FROM public.products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }

    // 2. Check slug uniqueness if updating slug
    if (updates.slug !== undefined) {
      const trimmedSlug = updates.slug.trim().toLowerCase();
      const dupSlug = await client.query(
        'SELECT id FROM public.products WHERE slug = $1 AND id != $2',
        [trimmedSlug, id]
      );
      if (dupSlug.rows.length > 0) {
        const err = new Error(`A product with slug '${trimmedSlug}' already exists`);
        err.statusCode = 409;
        throw err;
      }
    }

    // 3. Validate category_id if updating category
    if (updates.category_id) {
      const catCheck = await client.query(
        'SELECT id FROM public.categories WHERE id = $1',
        [updates.category_id]
      );
      if (catCheck.rows.length === 0) {
        const err = new Error('Specified category does not exist');
        err.statusCode = 400;
        throw err;
      }
    }

    // 4. Construct dynamic product update
    const fields = [];
    const values = [id];
    let paramIndex = 2;

    const allowedFields = [
      'category_id',
      'name',
      'slug',
      'description',
      'price',
      'compare_at_price',
      'stock_quantity',
      'flavor',
      'protein_grams',
      'fiber_grams',
      'sugar_grams',
      'calories',
      'is_featured',
      'is_active',
    ];

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        if (key === 'slug') {
          values.push(updates[key].trim().toLowerCase());
        } else if (typeof updates[key] === 'string') {
          values.push(updates[key].trim());
        } else {
          values.push(updates[key]);
        }
      }
    }

    let updatedProduct;
    if (fields.length > 0) {
      const updateSql = `
        UPDATE public.products
        SET ${fields.join(', ')}
        WHERE id = $1
        RETURNING *;
      `;
      const updateRes = await client.query(updateSql, values);
      updatedProduct = updateRes.rows[0];
    } else {
      const currentRes = await client.query('SELECT * FROM public.products WHERE id = $1', [id]);
      updatedProduct = currentRes.rows[0];
    }

    // 5. Update images gallery if provided
    if (Array.isArray(updates.images)) {
      await client.query('DELETE FROM public.product_images WHERE product_id = $1', [id]);

      const newImages = [];
      for (const img of updates.images) {
        const imgInsertSql = `
          INSERT INTO public.product_images (
            product_id, image_url, alt_text, display_order, is_primary
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING id, image_url, alt_text, display_order, is_primary, created_at;
        `;
        const imgRes = await client.query(imgInsertSql, [
          id,
          img.image_url.trim(),
          img.alt_text ? img.alt_text.trim() : null,
          img.display_order || 0,
          Boolean(img.is_primary),
        ]);
        newImages.push(imgRes.rows[0]);
      }
      updatedProduct.images = newImages;
    } else {
      const currentImages = await client.query(
        'SELECT id, image_url, alt_text, display_order, is_primary, created_at FROM public.product_images WHERE product_id = $1 ORDER BY is_primary DESC, display_order ASC, created_at ASC',
        [id]
      );
      updatedProduct.images = currentImages.rows;
    }

    await client.query('COMMIT');
    return updatedProduct;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Deletes a product by UUID.
 *
 * @param {string} id - Product UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
const deleteProduct = async (id) => {
  const existing = await query('SELECT id, name FROM public.products WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }

  await query('DELETE FROM public.products WHERE id = $1', [id]);
  return { id, message: `Product '${existing.rows[0].name}' deleted successfully` };
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
