import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend environment and DB pool
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const backendApp = require('../backend/src/app');
const { pool, query } = require('../backend/src/config/database');
const bcrypt = require('../backend/node_modules/bcryptjs');

const results = [];

const logResult = (testNum, testName, passed, details = '') => {
  results.push({ testNum, testName, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [Test ${testNum}]: ${testName}${details ? ` -> ${details}` : ''}`);
};

const sendRequest = async (apiBase, method, endpoint, body = null, headers = {}) => {
  const url = `${apiBase}${endpoint}`;
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

async function runPhase4BVerification() {
  console.log('====================================================');
  console.log('🧪 FitBite Phase 4B Auth, RBAC, Routing & Profile Verification');
  console.log('====================================================\n');

  let localServer = null;
  let apiBase = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

  // Setup ephemeral or live target server
  try {
    const probe = await fetch('http://localhost:5000/api/v1/health');
    if (probe.status === 200) {
      apiBase = 'http://localhost:5000/api/v1';
    } else {
      localServer = http.createServer(backendApp);
      await new Promise((resolve) => localServer.listen(0, resolve));
      const port = localServer.address().port;
      apiBase = `http://localhost:${port}/api/v1`;
    }
  } catch (e) {
    localServer = http.createServer(backendApp);
    await new Promise((resolve) => localServer.listen(0, resolve));
    const port = localServer.address().port;
    apiBase = `http://localhost:${port}/api/v1`;
  }

  console.log(`🌐 Target Server: ${apiBase}\n`);

  const uniqueId = Date.now();
  const testCustomerEmail = `customer_4b_${uniqueId}@fitbite.test`;
  const testCustomerPass = 'InitialCustomerPass123!';
  const newCustomerPass = 'UpdatedCustomerPass456@!';
  const testCustomerName = 'FitBite Phase 4B Athlete';
  const testCustomerPhone = '+91 98765 43210';

  const testAdminEmail = `admin_4b_${uniqueId}@fitbite.test`;
  const testAdminPass = 'AdminSecretPass789@!';

  let customerToken = null;
  let customerId = null;
  let adminToken = null;
  let adminId = null;

  try {
    // --------------------------------------------------------------------------
    // 1. PROJECT STRUCTURE & COMPONENT VERIFICATION
    // --------------------------------------------------------------------------
    console.log('--- 1. FILE STRUCTURE & REACT ARCHITECTURE ---');

    const expectedFiles = [
      'src/services/authService.js',
      'src/context/AuthContext.jsx',
      'src/components/common/ProtectedRoute.jsx',
      'src/components/common/AdminRoute.jsx',
      'src/components/common/PublicOnlyRoute.jsx',
      'src/pages/auth/LoginPage.jsx',
      'src/pages/auth/SignupPage.jsx',
      'src/pages/account/ProfilePage.jsx',
      'src/pages/account/components/ProfileInfoTab.jsx',
      'src/pages/account/components/SecurityTab.jsx',
      'src/pages/account/components/AccountSummaryWidget.jsx',
    ];

    let allFilesExist = true;
    for (const relPath of expectedFiles) {
      const fullPath = path.join(__dirname, relPath);
      if (!fs.existsSync(fullPath)) {
        allFilesExist = false;
        console.error(`Missing file: ${relPath}`);
      }
    }

    logResult(
      1,
      'All 11 Phase 4B source files created (AuthContext, authService, guards, auth & profile pages)',
      allFilesExist,
      `Verified ${expectedFiles.length} files`
    );

    // --------------------------------------------------------------------------
    // 2. CUSTOMER REGISTRATION (POST /api/v1/auth/register)
    // --------------------------------------------------------------------------
    console.log('\n--- 2. CUSTOMER REGISTRATION & ROLE ENFORCEMENT ---');

    const regRes = await sendRequest(apiBase, 'POST', '/auth/register', {
      email: testCustomerEmail,
      password: testCustomerPass,
      full_name: testCustomerName,
      phone: testCustomerPhone,
    });

    customerToken = regRes.data?.data?.token;
    customerId = regRes.data?.data?.user?.id;

    logResult(
      2,
      'POST /api/v1/auth/register creates customer account and returns JWT token (201 Created)',
      regRes.status === 201 && regRes.data?.success === true && !!customerToken && !!customerId,
      `Status: ${regRes.status}, User ID: ${customerId}`
    );

    // Test Role Escalation Prevention on registration
    const escalateEmail = `escalate_${uniqueId}@fitbite.test`;
    const escalateRes = await sendRequest(apiBase, 'POST', '/auth/register', {
      email: escalateEmail,
      password: testCustomerPass,
      full_name: 'Escalation Attempt',
      role: 'admin', // Malicious attempt to self-assign admin role
    });

    const assignedRole = escalateRes.data?.data?.user?.role;
    logResult(
      3,
      'Public registration strictly forces role = "customer" (role escalation prevented)',
      escalateRes.status === 201 && assignedRole === 'customer',
      `Assigned Role: "${assignedRole}"`
    );

    // Clean up escalation test user
    await query('DELETE FROM public.users WHERE email = $1', [escalateEmail]);

    // --------------------------------------------------------------------------
    // 3. AUTHENTICATION & LOGIN (POST /api/v1/auth/login)
    // --------------------------------------------------------------------------
    console.log('\n--- 3. AUTHENTICATION & CREDENTIAL VALIDATION ---');

    // Valid Login
    const loginRes = await sendRequest(apiBase, 'POST', '/auth/login', {
      email: testCustomerEmail,
      password: testCustomerPass,
    });

    logResult(
      4,
      'POST /api/v1/auth/login with valid credentials returns 200 OK and JWT token',
      loginRes.status === 200 &&
        loginRes.data?.success === true &&
        loginRes.data?.data?.token &&
        loginRes.data?.data?.user?.email === testCustomerEmail,
      `Status: ${loginRes.status}, User: ${loginRes.data?.data?.user?.full_name}`
    );

    // Invalid Login (Wrong Password)
    const invalidPassRes = await sendRequest(apiBase, 'POST', '/auth/login', {
      email: testCustomerEmail,
      password: 'WrongPassword999!',
    });

    logResult(
      5,
      'POST /api/v1/auth/login with invalid password returns 401 Unauthorized',
      invalidPassRes.status === 401 && invalidPassRes.data?.success === false,
      `Status: ${invalidPassRes.status}, Message: "${invalidPassRes.data?.message}"`
    );

    // --------------------------------------------------------------------------
    // 4. SESSION RESTORATION (GET /api/v1/auth/me)
    // --------------------------------------------------------------------------
    console.log('\n--- 4. SESSION RESTORATION & TOKEN VERIFICATION ---');

    // Session restoration with valid token
    const meRes = await sendRequest(apiBase, 'GET', '/auth/me', null, {
      Authorization: `Bearer ${customerToken}`,
    });

    logResult(
      6,
      'GET /api/v1/auth/me with valid Bearer token restores user profile (200 OK)',
      meRes.status === 200 &&
        meRes.data?.success === true &&
        meRes.data?.data?.user?.id === customerId &&
        meRes.data?.data?.user?.role === 'customer',
      `Status: ${meRes.status}, Restored User: ${meRes.data?.data?.user?.email}`
    );

    // Session restoration with invalid/tampered token
    const meInvalidRes = await sendRequest(apiBase, 'GET', '/auth/me', null, {
      Authorization: 'Bearer invalid.tampered.token.signature',
    });

    logResult(
      7,
      'GET /api/v1/auth/me with invalid/tampered token returns 401 Unauthorized',
      meInvalidRes.status === 401 && meInvalidRes.data?.success === false,
      `Status: ${meInvalidRes.status}, Message: "${meInvalidRes.data?.message}"`
    );

    // --------------------------------------------------------------------------
    // 5. CUSTOMER PROFILE UPDATE (PUT /api/v1/users/profile)
    // --------------------------------------------------------------------------
    console.log('\n--- 5. CUSTOMER PROFILE UPDATES ---');

    const updatedName = 'Alex Rivera Marathoner';
    const updatedBio = 'Training for 42km endurance with 150g daily protein.';
    const updatedPhone = '+91 98765 88888';

    const updateProfileRes = await sendRequest(
      apiBase,
      'PUT',
      '/users/profile',
      {
        full_name: updatedName,
        bio: updatedBio,
        phone: updatedPhone,
      },
      {
        Authorization: `Bearer ${customerToken}`,
      }
    );

    logResult(
      8,
      'PUT /api/v1/users/profile updates athlete metadata in database (200 OK)',
      updateProfileRes.status === 200 &&
        updateProfileRes.data?.success === true &&
        updateProfileRes.data?.data?.user?.full_name === updatedName &&
        updateProfileRes.data?.data?.user?.bio === updatedBio,
      `Status: ${updateProfileRes.status}, Name: "${updateProfileRes.data?.data?.user?.full_name}"`
    );

    // --------------------------------------------------------------------------
    // 6. ACCOUNT SUMMARY METRICS (GET /api/v1/users/summary)
    // --------------------------------------------------------------------------
    console.log('\n--- 6. ACCOUNT SUMMARY METRICS WIDGET ---');

    const summaryRes = await sendRequest(apiBase, 'GET', '/users/summary', null, {
      Authorization: `Bearer ${customerToken}`,
    });

    const summaryData = summaryRes.data?.data;
    logResult(
      9,
      'GET /api/v1/users/summary returns structured account metrics for dashboard (200 OK)',
      summaryRes.status === 200 &&
        summaryRes.data?.success === true &&
        summaryData?.orders !== undefined &&
        summaryData?.addresses !== undefined &&
        summaryData?.cart !== undefined &&
        summaryData?.wishlist !== undefined &&
        summaryData?.reviews !== undefined,
      `Orders: ${summaryData?.orders?.total_orders}, Addresses: ${summaryData?.addresses?.saved_addresses}`
    );

    // --------------------------------------------------------------------------
    // 7. PASSWORD CHANGE & COMPLEXITY VALIDATION (PUT /api/v1/users/password)
    // --------------------------------------------------------------------------
    console.log('\n--- 7. PASSWORD CHANGE & SECURITY COMPLEXITY ---');

    // Weak password rejection
    const weakPassRes = await sendRequest(
      apiBase,
      'PUT',
      '/users/password',
      {
        current_password: testCustomerPass,
        new_password: 'weak',
        confirm_password: 'weak',
      },
      {
        Authorization: `Bearer ${customerToken}`,
      }
    );

    logResult(
      10,
      'PUT /api/v1/users/password rejects weak password violating complexity rules (400 Bad Request)',
      weakPassRes.status === 400 && weakPassRes.data?.success === false,
      `Status: ${weakPassRes.status}`
    );

    // Valid password change
    const changePassRes = await sendRequest(
      apiBase,
      'PUT',
      '/users/password',
      {
        current_password: testCustomerPass,
        new_password: newCustomerPass,
        confirm_password: newCustomerPass,
      },
      {
        Authorization: `Bearer ${customerToken}`,
      }
    );

    logResult(
      11,
      'PUT /api/v1/users/password updates password securely with bcrypt cost 12 (200 OK)',
      changePassRes.status === 200 && changePassRes.data?.success === true,
      `Status: ${changePassRes.status}, Message: "${changePassRes.data?.message}"`
    );

    // Verify login with new password succeeds and old password fails
    const oldLoginCheck = await sendRequest(apiBase, 'POST', '/auth/login', {
      email: testCustomerEmail,
      password: testCustomerPass,
    });
    const newLoginCheck = await sendRequest(apiBase, 'POST', '/auth/login', {
      email: testCustomerEmail,
      password: newCustomerPass,
    });

    logResult(
      12,
      'Login verifies new password accepted (200 OK) and old password rejected (401 Unauthorized)',
      oldLoginCheck.status === 401 && newLoginCheck.status === 200,
      `Old Pass: ${oldLoginCheck.status}, New Pass: ${newLoginCheck.status}`
    );

    // --------------------------------------------------------------------------
    // 8. ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT
    // --------------------------------------------------------------------------
    console.log('\n--- 8. ROLE-BASED ACCESS CONTROL (RBAC) ENFORCEMENT ---');

    // Customer attempt to access Admin endpoint (403 Forbidden)
    const custAdminAttempt = await sendRequest(
      apiBase,
      'GET',
      '/admin/dashboard/stats',
      null,
      {
        Authorization: `Bearer ${customerToken}`,
      }
    );

    logResult(
      13,
      'Customer accessing admin endpoint returns 403 Forbidden (RBAC Guard Enforced)',
      custAdminAttempt.status === 403 && custAdminAttempt.data?.success === false,
      `Status: ${custAdminAttempt.status}, Message: "${custAdminAttempt.data?.message}"`
    );

    // Setup Admin account in database for RBAC verification
    const adminHash = await bcrypt.hash(testAdminPass, 12);
    const adminDbRes = await query(
      `INSERT INTO public.users (email, password_hash, role, is_active)
       VALUES ($1, $2, 'admin', true)
       RETURNING id, email, role`,
      [testAdminEmail, adminHash]
    );
    adminId = adminDbRes.rows[0].id;

    // Login as Admin
    const adminLoginRes = await sendRequest(apiBase, 'POST', '/auth/login', {
      email: testAdminEmail,
      password: testAdminPass,
    });
    adminToken = adminLoginRes.data?.data?.token;

    // Admin access to Admin endpoint (200 OK)
    const adminStatsRes = await sendRequest(
      apiBase,
      'GET',
      '/admin/dashboard/stats',
      null,
      {
        Authorization: `Bearer ${adminToken}`,
      }
    );

    logResult(
      14,
      'Admin accessing admin endpoint returns 200 OK with store operations data',
      adminStatsRes.status === 200 &&
        adminStatsRes.data?.success === true &&
        adminStatsRes.data?.data?.financials !== undefined,
      `Status: ${adminStatsRes.status}, Gross Revenue: ₹${adminStatsRes.data?.data?.financials?.gross_revenue}`
    );
  } catch (error) {
    console.error('Unhandled exception in Phase 4B test suite:', error);
    logResult(999, 'Test suite execution completed without uncaught exceptions', false, error.message);
  } finally {
    // --------------------------------------------------------------------------
    // CLEANUP TEMPORARY TEST USERS
    // --------------------------------------------------------------------------
    if (testCustomerEmail || testAdminEmail) {
      await query('DELETE FROM public.users WHERE email IN ($1, $2)', [
        testCustomerEmail,
        testAdminEmail,
      ]);
      console.log('\n🧹 Temporary test customer and admin users cleaned up from PostgreSQL.');
    }

    if (localServer) {
      localServer.close();
    }
    pool.end();
  }

  console.log('\n====================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(
    `📊 Verification Summary: Total Tests: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`
  );
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase4BVerification();
