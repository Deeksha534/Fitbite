const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, query } = require('../config/database');

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Signs a JSON Web Token with user identity and authorization role.
 *
 * @param {Object} payload - User claims { id, email, role }
 * @returns {string} Signed JWT token
 */
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET configuration is missing on server');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    },
    secret,
    { expiresIn }
  );
};

/**
 * Registers a new customer account using an atomic PostgreSQL transaction.
 * Security Note: Role is unconditionally set to 'customer' for all public registrations.
 *
 * @param {Object} userData - { email, password, full_name, phone }
 * @returns {Promise<Object>} Object containing sanitized user profile and JWT token
 */
const registerUser = async ({ email, password, full_name, phone }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = full_name.trim();
  const sanitizedPhone = phone && phone.trim().length > 0 ? phone.trim() : null;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM public.users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      const err = new Error('An account with this email address already exists');
      err.statusCode = 409;
      throw err;
    }

    // 2. Hash password with bcrypt
    const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // 3. Insert user record into public.users (role is ALWAYS customer)
    const userResult = await client.query(
      `INSERT INTO public.users (email, password_hash, role, is_active)
       VALUES ($1, $2, 'customer', true)
       RETURNING id, email, role, is_active, created_at, updated_at`,
      [normalizedEmail, password_hash]
    );

    const newUser = userResult.rows[0];

    // 4. Insert user profile into public.profiles
    const profileResult = await client.query(
      `INSERT INTO public.profiles (id, full_name, phone)
       VALUES ($1, $2, $3)
       RETURNING full_name, phone, avatar_url, bio`,
      [newUser.id, trimmedName, sanitizedPhone]
    );

    const newProfile = profileResult.rows[0];

    // 5. Initialize user shopping cart
    await client.query(
      `INSERT INTO public.carts (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [newUser.id]
    );

    // 6. Initialize user wishlist
    await client.query(
      `INSERT INTO public.wishlists (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [newUser.id]
    );

    // Commit atomic transaction
    await client.query('COMMIT');

    // 7. Generate JWT Token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        is_active: newUser.is_active,
        full_name: newProfile.full_name,
        phone: newProfile.phone,
        avatar_url: newProfile.avatar_url,
        bio: newProfile.bio,
        created_at: newUser.created_at,
      },
      token,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Authenticates user credentials and returns a JWT token.
 * Errors are kept strictly uniform to prevent account enumeration attacks.
 *
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} Object containing user details and JWT token
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Query user and profile
  const result = await query(
    `SELECT u.id, u.email, u.password_hash, u.role, u.is_active, u.created_at,
            p.full_name, p.phone, p.avatar_url, p.bio
     FROM public.users u
     LEFT JOIN public.profiles p ON u.id = p.id
     WHERE u.email = $1`,
    [normalizedEmail]
  );

  // If email is not found, return generic 401 error
  if (result.rows.length === 0) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const user = result.rows[0];

  // Check if account has been deactivated
  if (!user.is_active) {
    const err = new Error('Account has been deactivated. Please contact support.');
    err.statusCode = 403;
    throw err;
  }

  // Compare supplied plaintext password with stored bcrypt hash
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // Generate JWT token
  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      full_name: user.full_name,
      phone: user.phone,
      avatar_url: user.avatar_url,
      bio: user.bio,
      created_at: user.created_at,
    },
    token,
  };
};

/**
 * Retrieves current authenticated user's profile by ID.
 *
 * @param {string} userId - UUID of the user
 * @returns {Promise<Object>} Sanitized user and profile object
 */
const getCurrentUser = async (userId) => {
  const result = await query(
    `SELECT u.id, u.email, u.role, u.is_active, u.created_at, u.updated_at,
            p.full_name, p.phone, p.avatar_url, p.bio
     FROM public.users u
     LEFT JOIN public.profiles p ON u.id = p.id
     WHERE u.id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const user = result.rows[0];

  if (!user.is_active) {
    const err = new Error('Account has been deactivated');
    err.statusCode = 403;
    throw err;
  }

  return user;
};

module.exports = {
  generateToken,
  registerUser,
  loginUser,
  getCurrentUser,
};
