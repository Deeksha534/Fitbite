const { query } = require('../config/database');

/**
 * Retrieves all categories with associated active product counts.
 * Public visitors only receive active categories; admins can view all.
 *
 * @param {Object} options - { includeInactive: boolean }
 * @returns {Promise<Array>} List of categories
 */
const getAllCategories = async ({ includeInactive = false } = {}) => {
  const sql = `
    SELECT c.id, c.name, c.slug, c.description, c.image_url, c.is_active, c.created_at, c.updated_at,
           COUNT(p.id)::int AS product_count
    FROM public.categories c
    LEFT JOIN public.products p ON c.id = p.category_id AND (p.is_active = true OR $1 = true)
    WHERE ($1 = true OR c.is_active = true)
    GROUP BY c.id
    ORDER BY c.name ASC;
  `;

  const result = await query(sql, [includeInactive]);
  return result.rows;
};

/**
 * Retrieves a single category by UUID.
 *
 * @param {string} id - Category UUID
 * @param {Object} options - { includeInactive: boolean }
 * @returns {Promise<Object>} Category details
 */
const getCategoryById = async (id, { includeInactive = false } = {}) => {
  const sql = `
    SELECT c.id, c.name, c.slug, c.description, c.image_url, c.is_active, c.created_at, c.updated_at,
           COUNT(p.id)::int AS product_count
    FROM public.categories c
    LEFT JOIN public.products p ON c.id = p.category_id AND (p.is_active = true OR $2 = true)
    WHERE c.id = $1 AND ($2 = true OR c.is_active = true)
    GROUP BY c.id;
  `;

  const result = await query(sql, [id, includeInactive]);

  if (result.rows.length === 0) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
};

/**
 * Creates a new category.
 *
 * @param {Object} categoryData - { name, slug, description, image_url, is_active }
 * @returns {Promise<Object>} Created category record
 */
const createCategory = async ({ name, slug, description, image_url, is_active = true }) => {
  const trimmedName = name.trim();
  const trimmedSlug = slug.trim().toLowerCase();
  const trimmedDesc = description !== undefined && description !== null ? description.trim() : null;
  const trimmedImage = image_url !== undefined && image_url !== null ? image_url.trim() : null;
  const activeStatus = is_active !== undefined ? Boolean(is_active) : true;

  // Check for duplicates
  const dupCheck = await query(
    'SELECT id, name, slug FROM public.categories WHERE name = $1 OR slug = $2',
    [trimmedName, trimmedSlug]
  );

  if (dupCheck.rows.length > 0) {
    const isNameDup = dupCheck.rows.some((r) => r.name.toLowerCase() === trimmedName.toLowerCase());
    const err = new Error(
      isNameDup
        ? `A category named '${trimmedName}' already exists`
        : `A category with slug '${trimmedSlug}' already exists`
    );
    err.statusCode = 409;
    throw err;
  }

  const insertSql = `
    INSERT INTO public.categories (name, slug, description, image_url, is_active)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, slug, description, image_url, is_active, created_at, updated_at;
  `;

  const result = await query(insertSql, [
    trimmedName,
    trimmedSlug,
    trimmedDesc,
    trimmedImage,
    activeStatus,
  ]);

  return result.rows[0];
};

/**
 * Updates an existing category.
 *
 * @param {string} id - Category UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated category record
 */
const updateCategory = async (id, updates) => {
  // Check category exists
  const existing = await query('SELECT id FROM public.categories WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }

  const fields = [];
  const values = [id];
  let paramIndex = 2;

  if (updates.name !== undefined) {
    const trimmedName = updates.name.trim();
    // Check name duplicate
    const dupName = await query(
      'SELECT id FROM public.categories WHERE LOWER(name) = LOWER($1) AND id != $2',
      [trimmedName, id]
    );
    if (dupName.rows.length > 0) {
      const err = new Error(`A category named '${trimmedName}' already exists`);
      err.statusCode = 409;
      throw err;
    }
    fields.push(`name = $${paramIndex++}`);
    values.push(trimmedName);
  }

  if (updates.slug !== undefined) {
    const trimmedSlug = updates.slug.trim().toLowerCase();
    // Check slug duplicate
    const dupSlug = await query(
      'SELECT id FROM public.categories WHERE slug = $1 AND id != $2',
      [trimmedSlug, id]
    );
    if (dupSlug.rows.length > 0) {
      const err = new Error(`A category with slug '${trimmedSlug}' already exists`);
      err.statusCode = 409;
      throw err;
    }
    fields.push(`slug = $${paramIndex++}`);
    values.push(trimmedSlug);
  }

  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description !== null ? updates.description.trim() : null);
  }

  if (updates.image_url !== undefined) {
    fields.push(`image_url = $${paramIndex++}`);
    values.push(updates.image_url !== null ? updates.image_url.trim() : null);
  }

  if (updates.is_active !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(Boolean(updates.is_active));
  }

  if (fields.length === 0) {
    return getCategoryById(id, { includeInactive: true });
  }

  const sql = `
    UPDATE public.categories
    SET ${fields.join(', ')}
    WHERE id = $1
    RETURNING id, name, slug, description, image_url, is_active, created_at, updated_at;
  `;

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Deletes a category by UUID.
 *
 * @param {string} id - Category UUID
 * @returns {Promise<Object>} Deletion confirmation
 */
const deleteCategory = async (id) => {
  const existing = await query('SELECT id, name FROM public.categories WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    const err = new Error('Category not found');
    err.statusCode = 404;
    throw err;
  }

  await query('DELETE FROM public.categories WHERE id = $1', [id]);
  return { id, message: `Category '${existing.rows[0].name}' deleted successfully` };
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
