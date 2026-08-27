const { pool, query } = require('../config/database');

/**
 * Retrieves all delivery addresses saved by a customer.
 *
 * @param {string} userId - Customer user UUID
 * @returns {Promise<Array>} List of address records
 */
const getUserAddresses = async (userId) => {
  const sql = `
    SELECT id, full_name, phone, street_address, apartment,
           city, state, postal_code, country, is_default,
           created_at, updated_at
    FROM public.addresses
    WHERE user_id = $1
    ORDER BY is_default DESC, created_at DESC;
  `;
  const result = await query(sql, [userId]);
  return result.rows;
};

/**
 * Retrieves a single delivery address with ownership verification.
 *
 * @param {string} userId - Customer user UUID
 * @param {string} addressId - Address UUID
 * @returns {Promise<Object>} Address record
 */
const getAddressById = async (userId, addressId) => {
  const sql = `
    SELECT id, full_name, phone, street_address, apartment,
           city, state, postal_code, country, is_default,
           created_at, updated_at
    FROM public.addresses
    WHERE id = $1 AND user_id = $2;
  `;
  const result = await query(sql, [addressId, userId]);

  if (result.rows.length === 0) {
    const err = new Error('Address not found');
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
};

/**
 * Creates a new delivery address with automatic default handling.
 *
 * @param {string} userId - Customer user UUID
 * @param {Object} data - Address data
 * @returns {Promise<Object>} Created address
 */
const createAddress = async (userId, data) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check count of existing addresses for user
    const countRes = await client.query(
      'SELECT COUNT(*)::int AS count FROM public.addresses WHERE user_id = $1',
      [userId]
    );
    const hasExisting = countRes.rows[0].count > 0;

    // If marked default or if first address ever, make it default
    const shouldBeDefault = Boolean(data.is_default || !hasExisting);

    if (shouldBeDefault && hasExisting) {
      await client.query(
        'UPDATE public.addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    const insertSql = `
      INSERT INTO public.addresses (
        user_id, full_name, phone, street_address, apartment,
        city, state, postal_code, country, is_default
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, full_name, phone, street_address, apartment,
                city, state, postal_code, country, is_default,
                created_at, updated_at;
    `;

    const insertParams = [
      userId,
      data.full_name,
      data.phone,
      data.street_address,
      data.apartment || null,
      data.city,
      data.state,
      data.postal_code,
      data.country || 'India',
      shouldBeDefault,
    ];

    const result = await client.query(insertSql, insertParams);
    await client.query('COMMIT');

    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Updates an existing delivery address with ownership check and default address toggling.
 *
 * @param {string} userId - Customer user UUID
 * @param {string} addressId - Address UUID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated address
 */
const updateAddress = async (userId, addressId, updateData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify existence and lock row
    const existing = await client.query(
      'SELECT id, is_default FROM public.addresses WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [addressId, userId]
    );

    if (existing.rows.length === 0) {
      const err = new Error('Address not found');
      err.statusCode = 404;
      throw err;
    }

    // If promoting to default, demote others
    if (updateData.is_default === true) {
      await client.query(
        'UPDATE public.addresses SET is_default = false WHERE user_id = $1 AND id != $2',
        [userId, addressId]
      );
    }

    // Dynamic field building
    const allowedFields = [
      'full_name',
      'phone',
      'street_address',
      'apartment',
      'city',
      'state',
      'postal_code',
      'country',
      'is_default',
    ];

    const setClauses = [];
    const values = [];
    let idx = 1;

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        setClauses.push(`${field} = $${idx}`);
        values.push(updateData[field]);
        idx++;
      }
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(addressId);
    values.push(userId);

    const updateSql = `
      UPDATE public.addresses
      SET ${setClauses.join(', ')}
      WHERE id = $${idx} AND user_id = $${idx + 1}
      RETURNING id, full_name, phone, street_address, apartment,
                city, state, postal_code, country, is_default,
                created_at, updated_at;
    `;

    const result = await client.query(updateSql, values);
    await client.query('COMMIT');

    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Deletes an address and auto-promotes latest remaining address to default if needed.
 *
 * @param {string} userId - Customer user UUID
 * @param {string} addressId - Address UUID
 * @returns {Promise<Object>} Deletion result
 */
const deleteAddress = async (userId, addressId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT id, is_default FROM public.addresses WHERE id = $1 AND user_id = $2 FOR UPDATE',
      [addressId, userId]
    );

    if (existing.rows.length === 0) {
      const err = new Error('Address not found');
      err.statusCode = 404;
      throw err;
    }

    const wasDefault = existing.rows[0].is_default;

    await client.query('DELETE FROM public.addresses WHERE id = $1', [addressId]);

    // If the deleted address was default, make the most recent remaining address default
    if (wasDefault) {
      const remaining = await client.query(
        'SELECT id FROM public.addresses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      if (remaining.rows.length > 0) {
        await client.query(
          'UPDATE public.addresses SET is_default = true WHERE id = $1',
          [remaining.rows[0].id]
        );
      }
    }

    await client.query('COMMIT');
    return { id: addressId, deleted: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Convenience method to mark an address as default.
 *
 * @param {string} userId - Customer user UUID
 * @param {string} addressId - Address UUID
 * @returns {Promise<Object>} Updated address
 */
const setDefaultAddress = async (userId, addressId) => {
  return updateAddress(userId, addressId, { is_default: true });
};

module.exports = {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
