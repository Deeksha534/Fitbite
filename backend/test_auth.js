require('dotenv').config();
const { spawn } = require('child_process');
const { pool, query } = require('./src/config/database');

const API_BASE = process.env.API_URL || 'http://localhost:5000';

const results = [];

const logResult = (testName, passed, details = '') => {
  results.push({ testName, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}${details ? ` -> ${details}` : ''}`);
};

const sendRequest = async (method, endpoint, body = null, headers = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }
  return { status: response.status, data };
};

/**
 * Verifies that the server process fails fast on startup if JWT_SECRET is missing.
 */
const testJwtSecretMissingStartup = () => {
  return new Promise((resolve) => {
    const child = spawn('node', ['-e', `"process.env.JWT_SECRET = ''; require('./src/server.js');"`], {
      cwd: __dirname,
      shell: true,
    });

    let stderr = '';
    let stdout = '';

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      const output = stderr + stdout;
      const failedProperly = code !== 0 && output.includes('JWT_SECRET environment variable is missing');
      resolve({ passed: failedProperly, exitCode: code, output: output.trim() });
    });
  });
};


async function runVerification() {
  console.log('====================================================');
  console.log(`🧪 FitBite Phase 3B Authentication & Authorization Verification`);
  console.log(`🌐 Target Server: ${API_BASE}`);
  console.log('====================================================\n');

  const uniqueId = Date.now();
  const testEmail = `test_auth_${uniqueId}@fitbite.test`;
  const testPassword = 'TestAuthPassword123!';
  const testFullName = 'FitBite Phase 3B Test User';
  const testPhone = '+91 98765 43210';

  let registeredUserId = null;
  let authToken = null;

  try {
    // --------------------------------------------------------------------------
    // 1. REGISTRATION ENDPOINT TESTS
    // --------------------------------------------------------------------------
    console.log('--- 1. Testing Registration Endpoint (POST /api/v1/auth/register) ---');

    // 1.1 Invalid registration (missing fields, malformed email, short password)
    const invalidRegRes = await sendRequest('POST', '/api/v1/auth/register', {
      email: 'not-a-valid-email',
      password: '123',
    });
    logResult(
      'Invalid registration returns 400 Bad Request with structured errors',
      invalidRegRes.status === 400 && invalidRegRes.data?.success === false && Array.isArray(invalidRegRes.data?.errors),
      `Status: ${invalidRegRes.status}, Errors count: ${invalidRegRes.data?.errors?.length || 0}`
    );

    // 1.2 Valid registration & role escalation prevention test
    const validRegRes = await sendRequest('POST', '/api/v1/auth/register', {
      email: testEmail,
      password: testPassword,
      full_name: testFullName,
      phone: testPhone,
      role: 'admin', // Role escalation attempt: must be strictly ignored and set to 'customer'
    });

    registeredUserId = validRegRes.data?.data?.user?.id;
    authToken = validRegRes.data?.data?.token;

    logResult(
      'Valid registration returns 201 Created and JWT token',
      validRegRes.status === 201 && validRegRes.data?.success === true && !!authToken,
      `Status: ${validRegRes.status}, User ID: ${registeredUserId}`
    );

    // 1.3 Verify public registration cannot create an admin user
    const returnedRole = validRegRes.data?.data?.user?.role;
    logResult(
      'Public registration cannot create admin user (role strictly forced to customer)',
      returnedRole === 'customer',
      `Assigned Role: "${returnedRole}"`
    );

    // 1.4 Verify registration response does NOT contain password or password_hash
    const regUser = validRegRes.data?.data?.user || {};
    const hasPasswordInReg = 'password' in regUser || 'password_hash' in regUser;
    logResult(
      'Registration response does NOT contain password or password_hash',
      !hasPasswordInReg,
      `password / password_hash exposed: ${hasPasswordInReg}`
    );

    // 1.5 Duplicate registration returns 409 Conflict
    const dupRegRes = await sendRequest('POST', '/api/v1/auth/register', {
      email: testEmail,
      password: 'AnotherPassword123!',
      full_name: 'Duplicate User',
    });
    logResult(
      'Duplicate registration with same email returns 409 Conflict',
      dupRegRes.status === 409 && dupRegRes.data?.success === false,
      `Status: ${dupRegRes.status}, Message: "${dupRegRes.data?.message}"`
    );

    // --------------------------------------------------------------------------
    // 2. DATABASE PERSISTENCE & ATOMIC TRANSACTIONS
    // --------------------------------------------------------------------------
    console.log('\n--- 2. Verifying PostgreSQL Database State & Atomic Transaction ---');

    // 2.1 Users table record verification
    const userDbResult = await query(
      'SELECT id, email, password_hash, role, is_active FROM public.users WHERE id = $1',
      [registeredUserId]
    );
    const dbUser = userDbResult.rows[0];

    logResult(
      'PostgreSQL contains users record with valid UUID and is_active = true',
      !!dbUser && dbUser.id === registeredUserId && dbUser.is_active === true,
      `User ID: ${dbUser?.id}`
    );

    logResult(
      'PostgreSQL users record has role = customer',
      dbUser?.role === 'customer',
      `DB Role: ${dbUser?.role}`
    );

    logResult(
      'PostgreSQL password_hash is securely encrypted with bcrypt ($2a$/$2b$ cost 12)',
      dbUser?.password_hash?.startsWith('$2a$12$') || dbUser?.password_hash?.startsWith('$2b$12$'),
      `Hash Algorithm: bcrypt cost 12`
    );

    // 2.2 Profiles table record verification
    const profileDbResult = await query(
      'SELECT id, full_name, phone FROM public.profiles WHERE id = $1',
      [registeredUserId]
    );
    const dbProfile = profileDbResult.rows[0];

    logResult(
      'PostgreSQL contains profiles record matching full_name and phone',
      !!dbProfile && dbProfile.full_name === testFullName && dbProfile.phone === testPhone,
      `Profile: full_name="${dbProfile?.full_name}", phone="${dbProfile?.phone}"`
    );

    // 2.3 Carts table record verification
    const cartDbResult = await query(
      'SELECT id, user_id FROM public.carts WHERE user_id = $1',
      [registeredUserId]
    );
    logResult(
      'PostgreSQL contains carts record initialized for user',
      cartDbResult.rows.length > 0 && cartDbResult.rows[0].user_id === registeredUserId,
      `Cart ID: ${cartDbResult.rows[0]?.id}`
    );

    // 2.4 Wishlists table record verification
    const wishlistDbResult = await query(
      'SELECT id, user_id FROM public.wishlists WHERE user_id = $1',
      [registeredUserId]
    );
    logResult(
      'PostgreSQL contains wishlists record initialized for user',
      wishlistDbResult.rows.length > 0 && wishlistDbResult.rows[0].user_id === registeredUserId,
      `Wishlist ID: ${wishlistDbResult.rows[0]?.id}`
    );

    // --------------------------------------------------------------------------
    // 3. LOGIN ENDPOINT TESTS
    // --------------------------------------------------------------------------
    console.log('\n--- 3. Testing Login Endpoint (POST /api/v1/auth/login) ---');

    // 3.1 Valid login
    const validLoginRes = await sendRequest('POST', '/api/v1/auth/login', {
      email: testEmail,
      password: testPassword,
    });
    logResult(
      'Valid login returns 200 OK and valid JWT token',
      validLoginRes.status === 200 && validLoginRes.data?.success === true && !!validLoginRes.data?.data?.token,
      `Status: ${validLoginRes.status}`
    );

    // 3.2 Login response does NOT contain password_hash
    const loginUserObj = validLoginRes.data?.data?.user || {};
    const hasPasswordInLogin = 'password' in loginUserObj || 'password_hash' in loginUserObj;
    logResult(
      'Login response does NOT contain password or password_hash',
      !hasPasswordInLogin,
      `password / password_hash exposed: ${hasPasswordInLogin}`
    );

    // 3.3 Wrong password returns 401 with uniform error message
    const wrongPasswordRes = await sendRequest('POST', '/api/v1/auth/login', {
      email: testEmail,
      password: 'WrongPassword999!',
    });
    logResult(
      'Wrong password returns 401 with uniform message "Invalid email or password"',
      wrongPasswordRes.status === 401 && wrongPasswordRes.data?.message === 'Invalid email or password',
      `Status: ${wrongPasswordRes.status}, Message: "${wrongPasswordRes.data?.message}"`
    );

    // 3.4 Non-existent email returns 401 with uniform error message
    const unknownEmailRes = await sendRequest('POST', '/api/v1/auth/login', {
      email: `non_existent_${uniqueId}@fitbite.test`,
      password: 'SomePassword123!',
    });
    logResult(
      'Non-existent email returns 401 with uniform message "Invalid email or password"',
      unknownEmailRes.status === 401 && unknownEmailRes.data?.message === 'Invalid email or password',
      `Status: ${unknownEmailRes.status}, Message: "${unknownEmailRes.data?.message}"`
    );

    // --------------------------------------------------------------------------
    // 4. PROTECTED /ME ENDPOINT TESTS
    // --------------------------------------------------------------------------
    console.log('\n--- 4. Testing Protected /me Route & JWT Middleware ---');

    // 4.1 /me with valid JWT token
    const meValidRes = await sendRequest('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${authToken}`,
    });
    logResult(
      'GET /me with valid JWT returns 200 OK and user profile',
      meValidRes.status === 200 && meValidRes.data?.data?.user?.email === testEmail,
      `Status: ${meValidRes.status}, Email: ${meValidRes.data?.data?.user?.email}`
    );

    // 4.2 /me without JWT token
    const meNoTokenRes = await sendRequest('GET', '/api/v1/auth/me');
    logResult(
      'GET /me without JWT returns 401 Unauthorized',
      meNoTokenRes.status === 401 && meNoTokenRes.data?.success === false,
      `Status: ${meNoTokenRes.status}, Message: "${meNoTokenRes.data?.message}"`
    );

    // 4.3 /me with invalid JWT token
    const meInvalidTokenRes = await sendRequest('GET', '/api/v1/auth/me', null, {
      Authorization: 'Bearer malformed.invalid.token_value',
    });
    logResult(
      'GET /me with invalid JWT returns 401 Unauthorized',
      meInvalidTokenRes.status === 401 && meInvalidTokenRes.data?.message === 'Invalid authentication token.',
      `Status: ${meInvalidTokenRes.status}, Message: "${meInvalidTokenRes.data?.message}"`
    );

    // --------------------------------------------------------------------------
    // 5. SERVER STARTUP VALIDATION (JWT_SECRET CHECK)
    // --------------------------------------------------------------------------
    console.log('\n--- 5. Testing Server Startup Validation (Missing JWT_SECRET) ---');
    const startupTest = await testJwtSecretMissingStartup();
    logResult(
      'Backend server fails fast on startup when JWT_SECRET is missing',
      startupTest.passed,
      `Exit Code: ${startupTest.exitCode}`
    );

  } finally {
    // --------------------------------------------------------------------------
    // CLEANUP TEMPORARY TEST USER FROM DATABASE
    // --------------------------------------------------------------------------
    if (testEmail) {
      await query('DELETE FROM public.users WHERE email = $1', [testEmail]);
      console.log('\n🧹 Temporary test user and associated records cleaned up from PostgreSQL.');
    }
    await pool.end();
  }

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n====================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`📊 Verification Summary: Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification().catch((err) => {
  console.error('Verification execution error:', err);
  process.exit(1);
});
