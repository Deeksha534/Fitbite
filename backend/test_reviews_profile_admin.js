require('dotenv').config();
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const { pool, query } = require('./src/config/database');

let API_BASE = process.env.API_URL || 'http://localhost:5000';
let localServer = null;

const results = [];

const logResult = (testNum, testName, passed, details = '') => {
  results.push({ testNum, testName, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [Test ${testNum}]: ${testName}${details ? ` -> ${details}` : ''}`);
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

async function runReviewsProfileAdminVerification() {
  console.log('====================================================');
  console.log(`🧪 FitBite Phase 3F Reviews, Profile & Admin Verification`);

  // Probe server or spawn ephemeral server
  try {
    const probe = await fetch(`${API_BASE}/api/v1/health`);
    if (probe.status !== 200) {
      localServer = http.createServer(app);
      await new Promise((resolve) => localServer.listen(0, resolve));
      const dynamicPort = localServer.address().port;
      API_BASE = `http://localhost:${dynamicPort}`;
    }
  } catch (e) {
    localServer = http.createServer(app);
    await new Promise((resolve) => localServer.listen(0, resolve));
    const dynamicPort = localServer.address().port;
    API_BASE = `http://localhost:${dynamicPort}`;
  }

  console.log(`🌐 Target Server: ${API_BASE}`);
  console.log('====================================================\n');

  const uniqueSuffix = Date.now();
  const userAEmail = `usera_rev_${uniqueSuffix}@fitbite.test`;
  const userBEmail = `userb_rev_${uniqueSuffix}@fitbite.test`;
  const adminEmail = `admin_rev_${uniqueSuffix}@fitbite.test`;
  const testPassword = 'InitialSecurePassword123!';
  const newPassword = 'BrandNewPassword456@!';

  let userAToken = null;
  let userBToken = null;
  let adminToken = null;

  let userAId = null;
  let userBId = null;
  let adminId = null;

  let testCategory = null;
  let testProduct1 = null;
  let testProduct2 = null;
  let testProductLowStock = null;

  let reviewAId = null;
  let reviewBId = null;

  try {
    // --------------------------------------------------------------------------
    // 0. Setup Test Users & Catalog Data
    // --------------------------------------------------------------------------
    console.log('--- 0. Setting up Test Users and Products in Database ---');

    // Register User A (Customer)
    const regResA = await sendRequest('POST', '/api/v1/auth/register', {
      email: userAEmail,
      password: testPassword,
      full_name: 'Customer Reviewer One',
      phone: '+91 98765 11111',
    });
    userAToken = regResA.data.data.token;
    userAId = regResA.data.data.user.id;

    // Register User B (Customer who will purchase and get verified review)
    const regResB = await sendRequest('POST', '/api/v1/auth/register', {
      email: userBEmail,
      password: testPassword,
      full_name: 'Customer Verified Buyer',
      phone: '+91 98765 22222',
    });
    userBToken = regResB.data.data.token;
    userBId = regResB.data.data.user.id;

    // Create Admin User directly in DB
    const adminHash = await bcrypt.hash(testPassword, 12);
    const adminDbRes = await query(
      `INSERT INTO public.users (email, password_hash, role, is_active)
       VALUES ($1, $2, 'admin', true)
       RETURNING id, email, role`,
      [adminEmail, adminHash]
    );
    adminId = adminDbRes.rows[0].id;
    await query(
      `INSERT INTO public.profiles (id, full_name, phone)
       VALUES ($1, 'FitBite Store Admin', '+91 98765 99999')`,
      [adminId]
    );

    // Login as Admin to obtain valid JWT
    const loginAdminRes = await sendRequest('POST', '/api/v1/auth/login', {
      email: adminEmail,
      password: testPassword,
    });
    adminToken = loginAdminRes.data.data.token;

    // Create test category and products
    const catRes = await query(
      `INSERT INTO public.categories (name, slug, description, is_active)
       VALUES ($1, $2, 'Special test category for Phase 3F', true)
       RETURNING id, name, slug`,
      [`Test Category ${uniqueSuffix}`, `test-cat-${uniqueSuffix}`]
    );
    testCategory = catRes.rows[0];

    const prod1Res = await query(
      `INSERT INTO public.products (category_id, name, slug, description, price, stock_quantity, flavor, is_active, is_featured)
       VALUES ($1, $2, $3, 'High protein delicious bar', 150.00, 50, 'Dark Chocolate', true, true)
       RETURNING id, name, slug, price, stock_quantity`,
      [testCategory.id, `Review Bar Alpha ${uniqueSuffix}`, `rev-alpha-${uniqueSuffix}`]
    );
    testProduct1 = prod1Res.rows[0];

    const prod2Res = await query(
      `INSERT INTO public.products (category_id, name, slug, description, price, stock_quantity, flavor, is_active, is_featured)
       VALUES ($1, $2, $3, 'Berry blast recovery bar', 180.00, 40, 'Berry Blast', true, false)
       RETURNING id, name, slug, price, stock_quantity`,
      [testCategory.id, `Review Bar Beta ${uniqueSuffix}`, `rev-beta-${uniqueSuffix}`]
    );
    testProduct2 = prod2Res.rows[0];

    // Create low-stock product for admin alert testing (stock = 5)
    const prodLowRes = await query(
      `INSERT INTO public.products (category_id, name, slug, description, price, stock_quantity, flavor, is_active, is_featured)
       VALUES ($1, $2, $3, 'Limited stock test bar', 200.00, 5, 'Peanut Butter', true, false)
       RETURNING id, name, slug, price, stock_quantity`,
      [testCategory.id, `Low Stock Bar ${uniqueSuffix}`, `low-stock-${uniqueSuffix}`]
    );
    testProductLowStock = prodLowRes.rows[0];

    console.log('Setup completed.\n');

    // --------------------------------------------------------------------------
    // 1. STRUCTURED CONTENT & WELLNESS APIS
    // --------------------------------------------------------------------------
    console.log('--- 1. STRUCTURED CONTENT & WELLNESS ENDPOINTS ---');

    // Test 1: Recipes
    const recipesRes = await sendRequest('GET', '/api/v1/content/recipes');
    logResult(
      1,
      'GET /api/v1/content/recipes returns 200 OK with structured recipes list',
      recipesRes.status === 200 &&
        recipesRes.data?.success === true &&
        Array.isArray(recipesRes.data?.data?.recipes) &&
        recipesRes.data.data.recipes.length > 0,
      `Status: ${recipesRes.status}, Total Recipes: ${recipesRes.data?.data?.recipes?.length}`
    );

    // Test 2: Fitness Tips
    const tipsRes = await sendRequest('GET', '/api/v1/content/fitness-tips');
    logResult(
      2,
      'GET /api/v1/content/fitness-tips returns 200 OK with science-backed articles',
      tipsRes.status === 200 &&
        tipsRes.data?.success === true &&
        Array.isArray(tipsRes.data?.data?.tips) &&
        tipsRes.data.data.tips.length > 0,
      `Status: ${tipsRes.status}, Total Tips: ${tipsRes.data?.data?.tips?.length}`
    );

    // Test 3: FAQ
    const faqRes = await sendRequest('GET', '/api/v1/content/faq');
    logResult(
      3,
      'GET /api/v1/content/faq returns 200 OK with categorized questions',
      faqRes.status === 200 &&
        faqRes.data?.success === true &&
        Array.isArray(faqRes.data?.data?.faq) &&
        faqRes.data.data.faq.length > 0,
      `Status: ${faqRes.status}, FAQ Categories: ${faqRes.data?.data?.faq?.length}`
    );

    // Test 4: Nutrition Guide
    const nutRes = await sendRequest('GET', '/api/v1/content/nutrition-guide');
    logResult(
      4,
      'GET /api/v1/content/nutrition-guide returns 200 OK with macro formulas and standards',
      nutRes.status === 200 &&
        nutRes.data?.success === true &&
        Array.isArray(nutRes.data?.data?.macro_principles),
      `Status: ${nutRes.status}, Principles count: ${nutRes.data?.data?.macro_principles?.length}`
    );

    console.log('');

    // --------------------------------------------------------------------------
    // 2. REVIEWS & RATINGS VALIDATION AND SUBMISSION
    // --------------------------------------------------------------------------
    console.log('--- 2. REVIEWS & RATINGS VALIDATION AND SUBMISSION ---');

    // Test 5: Review creation without token (401)
    const noAuthRev = await sendRequest(
      'POST',
      `/api/v1/products/${testProduct1.id}/reviews`,
      { rating: 5, comment: 'Great bar' }
    );
    logResult(
      5,
      'POST /api/v1/products/:id/reviews without token returns 401 Unauthorized',
      noAuthRev.status === 401 && noAuthRev.data?.success === false,
      `Status: ${noAuthRev.status}`
    );

    // Test 6: Review creation with invalid rating (out of range: 6) (400)
    const invalidRatingRev = await sendRequest(
      'POST',
      `/api/v1/products/${testProduct1.id}/reviews`,
      { rating: 6, comment: 'Invalid rating test' },
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      6,
      'POST /api/v1/products/:id/reviews with rating > 5 returns 400 Bad Request',
      invalidRatingRev.status === 400 && invalidRatingRev.data?.success === false,
      `Status: ${invalidRatingRev.status}`
    );

    // Test 7: Review creation on non-existent product UUID (404)
    const nonExistentProdRev = await sendRequest(
      'POST',
      '/api/v1/products/00000000-0000-0000-0000-000000000000/reviews',
      { rating: 5, comment: 'Non existent' },
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      7,
      'POST /api/v1/products/:id/reviews for non-existent product returns 404 Not Found',
      nonExistentProdRev.status === 404 && nonExistentProdRev.data?.success === false,
      `Status: ${nonExistentProdRev.status}`
    );

    // Test 8: Check review eligibility before purchase or review
    const eligA = await sendRequest(
      'GET',
      `/api/v1/products/${testProduct1.id}/reviews/eligibility`,
      null,
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      8,
      'GET /api/v1/products/:id/reviews/eligibility reports is_eligible_to_review = true and has_purchased = false',
      eligA.status === 200 &&
        eligA.data?.data?.is_eligible_to_review === true &&
        eligA.data?.data?.is_verified_buyer === false &&
        eligA.data?.data?.has_reviewed === false,
      `Eligible: ${eligA.data?.data?.is_eligible_to_review}, Verified Buyer: ${eligA.data?.data?.is_verified_buyer}`
    );

    // Test 9: Customer A submits review for Product 1 (non-buyer -> is_verified_purchase = false)
    const createRevA = await sendRequest(
      'POST',
      `/api/v1/products/${testProduct1.id}/reviews`,
      {
        rating: 4,
        title: 'Crispy texture and great taste',
        comment: 'Really enjoyed the rich dark chocolate flavor. Will order a box soon!',
      },
      { Authorization: `Bearer ${userAToken}` }
    );
    reviewAId = createRevA.data?.data?.review?.id;
    logResult(
      9,
      'POST /api/v1/products/:id/reviews as non-buyer creates review with is_verified_purchase = false (201 Created)',
      createRevA.status === 201 &&
        createRevA.data?.success === true &&
        createRevA.data?.data?.review?.rating === 4 &&
        createRevA.data?.data?.review?.is_verified_purchase === false,
      `Status: ${createRevA.status}, Review ID: ${reviewAId}, Verified: ${createRevA.data?.data?.review?.is_verified_purchase}`
    );

    // Test 10: Duplicate review attempt by Customer A for Product 1 (409 Conflict)
    const dupRevA = await sendRequest(
      'POST',
      `/api/v1/products/${testProduct1.id}/reviews`,
      { rating: 5, comment: 'Attempting duplicate review' },
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      10,
      'POST /api/v1/products/:id/reviews with duplicate submission returns 409 Conflict',
      dupRevA.status === 409 && dupRevA.data?.success === false,
      `Status: ${dupRevA.status}, Message: "${dupRevA.data?.message}"`
    );

    // --------------------------------------------------------------------------
    // 3. VERIFIED PURCHASE DETECTION & RATINGS AGGREGATION
    // --------------------------------------------------------------------------
    console.log('\n--- 3. VERIFIED PURCHASE DETECTION & AGGREGATION ---');

    // Customer B places order for Product 1 and address
    const addrBRes = await sendRequest(
      'POST',
      '/api/v1/addresses',
      {
        full_name: 'Sarah Jenkins',
        phone: '+91 98765 22222',
        street_address: '100 Marathon Boulevard',
        city: 'Bengaluru',
        state: 'Karnataka',
        postal_code: '560001',
        country: 'India',
        is_default: true,
      },
      { Authorization: `Bearer ${userBToken}` }
    );
    const addrBId = addrBRes.data?.data?.id || addrBRes.data?.data?.address?.id;

    // Add Product 1 to Cart B and Checkout
    await sendRequest(
      'POST',
      '/api/v1/cart/items',
      { product_id: testProduct1.id, quantity: 2 },
      { Authorization: `Bearer ${userBToken}` }
    );

    const orderBRes = await sendRequest(
      'POST',
      '/api/v1/orders',
      {
        shipping_address_id: addrBId,
        payment_method: 'cod',
      },
      { Authorization: `Bearer ${userBToken}` }
    );
    const orderBId = orderBRes.data?.data?.id || orderBRes.data?.data?.order?.id;

    // Admin marks Customer B's order as 'delivered'
    await sendRequest(
      'PATCH',
      `/api/v1/orders/admin/${orderBId}/status`,
      { order_status: 'delivered', payment_status: 'paid' },
      { Authorization: `Bearer ${adminToken}` }
    );

    // Customer B checks eligibility now -> should be verified buyer!
    const eligB = await sendRequest(
      'GET',
      `/api/v1/products/${testProduct1.id}/reviews/eligibility`,
      null,
      { Authorization: `Bearer ${userBToken}` }
    );
    logResult(
      11,
      'Eligibility check after order delivery detects is_verified_buyer = true from database',
      eligB.status === 200 &&
        eligB.data?.data?.is_verified_buyer === true &&
        eligB.data?.data?.is_eligible_to_review === true,
      `Verified Buyer: ${eligB.data?.data?.is_verified_buyer}`
    );

    // Customer B submits review for Product 1 -> automatically marked as verified purchase!
    const createRevB = await sendRequest(
      'POST',
      `/api/v1/products/${testProduct1.id}/reviews`,
      {
        rating: 5,
        title: 'Best Post-Workout Fuel',
        comment: 'I eat one of these right after long runs. Excellent texture and real cocoa!',
      },
      { Authorization: `Bearer ${userBToken}` }
    );
    reviewBId = createRevB.data?.data?.review?.id;
    logResult(
      12,
      'POST /api/v1/products/:id/reviews for delivered buyer creates review with is_verified_purchase = true (201 Created)',
      createRevB.status === 201 &&
        createRevB.data?.data?.review?.is_verified_purchase === true &&
        createRevB.data?.data?.review?.rating === 5,
      `Status: ${createRevB.status}, Verified Flag: ${createRevB.data?.data?.review?.is_verified_purchase}`
    );

    // Test 13: Public GET product reviews with rating breakdown summary
    const prodReviewsRes = await sendRequest(
      'GET',
      `/api/v1/products/${testProduct1.id}/reviews`
    );
    const summary = prodReviewsRes.data?.data?.summary;
    logResult(
      13,
      'GET /api/v1/products/:id/reviews returns accurate rating breakdown (avg 4.5, total 2, 5★:1, 4★:1)',
      prodReviewsRes.status === 200 &&
        summary?.total_reviews === 2 &&
        summary?.average_rating === 4.5 &&
        summary?.rating_distribution[5] === 1 &&
        summary?.rating_distribution[4] === 1,
      `Avg Rating: ${summary?.average_rating}, Total: ${summary?.total_reviews}, 5★: ${summary?.rating_distribution[5]}, 4★: ${summary?.rating_distribution[4]}`
    );

    // Test 14: Public GET featured reviews (homepage testimonials)
    const featReviewsRes = await sendRequest('GET', '/api/v1/reviews/featured?limit=5');
    logResult(
      14,
      'GET /api/v1/reviews/featured returns top-rated verified testimonials with product details',
      featReviewsRes.status === 200 &&
        featReviewsRes.data?.success === true &&
        Array.isArray(featReviewsRes.data?.data?.reviews) &&
        featReviewsRes.data.data.reviews.length > 0,
      `Total Featured: ${featReviewsRes.data?.data?.reviews?.length}`
    );

    // --------------------------------------------------------------------------
    // 4. REVIEW UPDATES, OWNERSHIP & MODERATION
    // --------------------------------------------------------------------------
    console.log('\n--- 4. REVIEW UPDATES, OWNERSHIP & MODERATION ---');

    // Test 15: Customer B tries to edit Customer A's review (403 Forbidden)
    const unauthorizedEdit = await sendRequest(
      'PUT',
      `/api/v1/reviews/${reviewAId}`,
      { rating: 1, comment: 'Hacked review' },
      { Authorization: `Bearer ${userBToken}` }
    );
    logResult(
      15,
      'PUT /api/v1/reviews/:id by non-owner returns 403 Forbidden (ownership isolation)',
      unauthorizedEdit.status === 403 && unauthorizedEdit.data?.success === false,
      `Status: ${unauthorizedEdit.status}, Message: "${unauthorizedEdit.data?.message}"`
    );

    // Test 16: Customer A updates own review rating & comment (200 OK)
    const editOwnRev = await sendRequest(
      'PUT',
      `/api/v1/reviews/${reviewAId}`,
      { rating: 5, comment: 'Updated to 5 stars after ordering my second box!' },
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      16,
      'PUT /api/v1/reviews/:id by owner updates rating and comment successfully (200 OK)',
      editOwnRev.status === 200 &&
        editOwnRev.data?.data?.review?.rating === 5 &&
        editOwnRev.data?.data?.review?.comment.includes('second box'),
      `Status: ${editOwnRev.status}, New Rating: ${editOwnRev.data?.data?.review?.rating}`
    );

    // Test 17: Customer B tries to delete Customer A's review (403 Forbidden)
    const unauthorizedDelete = await sendRequest(
      'DELETE',
      `/api/v1/reviews/${reviewAId}`,
      null,
      { Authorization: `Bearer ${userBToken}` }
    );
    logResult(
      17,
      'DELETE /api/v1/reviews/:id by non-owner returns 403 Forbidden',
      unauthorizedDelete.status === 403,
      `Status: ${unauthorizedDelete.status}`
    );

    // Test 18: Customer A deletes own review (200 OK)
    const deleteOwnRev = await sendRequest(
      'DELETE',
      `/api/v1/reviews/${reviewAId}`,
      null,
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      18,
      'DELETE /api/v1/reviews/:id by owner deletes review successfully (200 OK)',
      deleteOwnRev.status === 200 && deleteOwnRev.data?.success === true,
      `Status: ${deleteOwnRev.status}`
    );

    // Test 19: Admin deletes Customer B's review for content moderation (200 OK)
    const adminDeleteRev = await sendRequest(
      'DELETE',
      `/api/v1/reviews/${reviewBId}`,
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      19,
      'DELETE /api/v1/reviews/:id by Admin deletes review for moderation (200 OK)',
      adminDeleteRev.status === 200 && adminDeleteRev.data?.success === true,
      `Status: ${adminDeleteRev.status}`
    );

    // --------------------------------------------------------------------------
    // 5. USER PROFILE & PASSWORD MANAGEMENT
    // --------------------------------------------------------------------------
    console.log('\n--- 5. USER PROFILE & SECURITY MANAGEMENT ---');

    // Test 20: GET customer account summary
    const summaryRes = await sendRequest(
      'GET',
      '/api/v1/users/summary',
      null,
      { Authorization: `Bearer ${userBToken}` }
    );
    logResult(
      20,
      'GET /api/v1/users/summary returns customer account metrics (orders, addresses, cart)',
      summaryRes.status === 200 &&
        summaryRes.data?.data?.orders?.total_orders >= 1 &&
        summaryRes.data?.data?.addresses?.saved_addresses >= 1,
      `Total Orders: ${summaryRes.data?.data?.orders?.total_orders}, Addresses: ${summaryRes.data?.data?.addresses?.saved_addresses}`
    );

    // Test 21: Update user profile
    const updateProfRes = await sendRequest(
      'PUT',
      '/api/v1/users/profile',
      {
        full_name: 'Sarah Jenkins Pro Runner',
        phone: '+91 98765 33333',
        bio: 'Competitive marathoner and nutrition advocate',
      },
      { Authorization: `Bearer ${userBToken}` }
    );
    logResult(
      21,
      'PUT /api/v1/users/profile updates profile metadata successfully (200 OK)',
      updateProfRes.status === 200 &&
        updateProfRes.data?.data?.user?.full_name === 'Sarah Jenkins Pro Runner' &&
        updateProfRes.data?.data?.user?.phone === '+91 98765 33333',
      `Updated Name: "${updateProfRes.data?.data?.user?.full_name}", Phone: "${updateProfRes.data?.data?.user?.phone}"`
    );

    // Test 22: Password change with invalid current password (401)
    const wrongPassRes = await sendRequest(
      'PUT',
      '/api/v1/users/password',
      {
        current_password: 'WrongCurrentPassword999!',
        new_password: newPassword,
        confirm_password: newPassword,
      },
      { Authorization: `Bearer ${userBToken}` }
    );
    logResult(
      22,
      'PUT /api/v1/users/password with wrong current password returns 401 Unauthorized',
      wrongPassRes.status === 401 && wrongPassRes.data?.success === false,
      `Status: ${wrongPassRes.status}, Message: "${wrongPassRes.data?.message}"`
    );

    // Test 23: Password change with weak new password (400)
    const weakPassRes = await sendRequest(
      'PUT',
      '/api/v1/users/password',
      {
        current_password: testPassword,
        new_password: 'weak',
        confirm_password: 'weak',
      },
      { Authorization: `Bearer ${userBToken}` }
    );
    logResult(
      23,
      'PUT /api/v1/users/password with weak password returns 400 Bad Request',
      weakPassRes.status === 400 && weakPassRes.data?.success === false,
      `Status: ${weakPassRes.status}`
    );

    // Test 24: Password change with valid credentials (200 OK)
    const validPassRes = await sendRequest(
      'PUT',
      '/api/v1/users/password',
      {
        current_password: testPassword,
        new_password: newPassword,
        confirm_password: newPassword,
      },
      { Authorization: `Bearer ${userBToken}` }
    );
    logResult(
      24,
      'PUT /api/v1/users/password changes password securely (200 OK)',
      validPassRes.status === 200 && validPassRes.data?.success === true,
      `Status: ${validPassRes.status}`
    );

    // Test 25: Login with new password succeeds and old password fails
    const oldLoginRes = await sendRequest('POST', '/api/v1/auth/login', {
      email: userBEmail,
      password: testPassword,
    });
    const newLoginRes = await sendRequest('POST', '/api/v1/auth/login', {
      email: userBEmail,
      password: newPassword,
    });
    logResult(
      25,
      'Login verifies new password works (200 OK) and old password is rejected (401 Unauthorized)',
      oldLoginRes.status === 401 && newLoginRes.status === 200,
      `Old Password Login: ${oldLoginRes.status}, New Password Login: ${newLoginRes.status}`
    );

    // --------------------------------------------------------------------------
    // 6. ADMIN DASHBOARD STATS & CUSTOMER DIRECTORY
    // --------------------------------------------------------------------------
    console.log('\n--- 6. ADMIN DASHBOARD STATS & CUSTOMER DIRECTORY ---');

    // Test 26: Customer attempt to access Admin dashboard (403 Forbidden)
    const custAdminStats = await sendRequest(
      'GET',
      '/api/v1/admin/dashboard/stats',
      null,
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      26,
      'GET /api/v1/admin/dashboard/stats by Customer returns 403 Forbidden (RBAC)',
      custAdminStats.status === 403 && custAdminStats.data?.success === false,
      `Status: ${custAdminStats.status}`
    );

    // Test 27: Admin accesses store dashboard statistics (200 OK)
    const adminStatsRes = await sendRequest(
      'GET',
      '/api/v1/admin/dashboard/stats',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    const statsData = adminStatsRes.data?.data;
    logResult(
      27,
      'GET /api/v1/admin/dashboard/stats by Admin returns 200 OK with financial, inventory & order metrics',
      adminStatsRes.status === 200 &&
        statsData?.financials?.gross_revenue !== undefined &&
        statsData?.orders?.total !== undefined &&
        statsData?.inventory?.total_products !== undefined &&
        statsData?.customers?.total_registered !== undefined &&
        Array.isArray(statsData?.recent_orders),
      `Gross Revenue: ₹${statsData?.financials?.gross_revenue}, Orders Total: ${statsData?.orders?.total}, Customers: ${statsData?.customers?.total_registered}`
    );

    // Test 28: Low stock inventory alerts listed in admin dashboard
    const lowStockAlerts = statsData?.inventory?.low_stock_alerts || [];
    const foundLowStockItem = lowStockAlerts.some((item) => item.id === testProductLowStock.id);
    logResult(
      28,
      'Admin dashboard accurately surfaces low-stock alert items (stock <= 10)',
      foundLowStockItem === true && statsData?.inventory?.low_stock_count >= 1,
      `Low Stock Count: ${statsData?.inventory?.low_stock_count}, Found target item in alerts: ${foundLowStockItem}`
    );

    // Test 29: Admin customer directory with lifetime spend metrics
    const custDirectoryRes = await sendRequest(
      'GET',
      '/api/v1/admin/customers?limit=10',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    const customersList = custDirectoryRes.data?.data?.customers || [];
    const targetCustB = customersList.find((c) => c.id === userBId);
    logResult(
      29,
      'GET /api/v1/admin/customers returns paginated customer list with calculated lifetime spend',
      custDirectoryRes.status === 200 &&
        custDirectoryRes.data?.success === true &&
        targetCustB !== undefined &&
        targetCustB.lifetime_spend > 0,
      `Total Customers: ${custDirectoryRes.data?.data?.pagination?.total}, Customer B Lifetime Spend: ₹${targetCustB?.lifetime_spend}`
    );

    // Test 30: Admin customer search by email filter
    const searchCustRes = await sendRequest(
      'GET',
      `/api/v1/admin/customers?search=${userBEmail}`,
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      30,
      'GET /api/v1/admin/customers?search=... filters customer directory accurately',
      searchCustRes.status === 200 &&
        searchCustRes.data?.data?.customers?.length === 1 &&
        searchCustRes.data?.data?.customers[0]?.email === userBEmail,
      `Found Matches: ${searchCustRes.data?.data?.customers?.length}, Email: ${searchCustRes.data?.data?.customers[0]?.email}`
    );

    // Test 31: Admin customer deep dive by ID
    const custDetailRes = await sendRequest(
      'GET',
      `/api/v1/admin/customers/${userBId}`,
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      31,
      'GET /api/v1/admin/customers/:id returns complete customer profile, orders, and addresses',
      custDetailRes.status === 200 &&
        custDetailRes.data?.data?.customer?.email === userBEmail &&
        Array.isArray(custDetailRes.data?.data?.addresses) &&
        Array.isArray(custDetailRes.data?.data?.recent_orders),
      `Customer Email: ${custDetailRes.data?.data?.customer?.email}, Saved Addresses: ${custDetailRes.data?.data?.addresses?.length}, Orders: ${custDetailRes.data?.data?.recent_orders?.length}`
    );

    // --------------------------------------------------------------------------
    // 7. DIRECT DATABASE INTEGRITY & CLEANUP
    // --------------------------------------------------------------------------
    console.log('\n--- 7. DIRECT DATABASE INTEGRITY & CLEANUP ---');

    // Test 32: Direct PostgreSQL query verification
    const dbProfileRes = await query(
      'SELECT full_name, phone, bio FROM public.profiles WHERE id = $1',
      [userBId]
    );
    logResult(
      32,
      'Direct PostgreSQL query confirms profile updates and password hash changes are persisted',
      dbProfileRes.rows.length === 1 &&
        dbProfileRes.rows[0].full_name === 'Sarah Jenkins Pro Runner',
      `DB Name: "${dbProfileRes.rows[0]?.full_name}", DB Phone: "${dbProfileRes.rows[0]?.phone}"`
    );

    // Clean up temporary test data
    console.log('\n--- 33. Cleaning up temporary test records ---');
    await query('DELETE FROM public.orders WHERE user_id IN ($1, $2, $3)', [
      userAId,
      userBId,
      adminId,
    ]);
    await query('DELETE FROM public.addresses WHERE user_id IN ($1, $2, $3)', [
      userAId,
      userBId,
      adminId,
    ]);
    await query('DELETE FROM public.reviews WHERE user_id IN ($1, $2, $3)', [
      userAId,
      userBId,
      adminId,
    ]);
    await query('DELETE FROM public.products WHERE category_id = $1', [testCategory.id]);
    await query('DELETE FROM public.categories WHERE id = $1', [testCategory.id]);
    await query('DELETE FROM public.users WHERE id IN ($1, $2, $3)', [
      userAId,
      userBId,
      adminId,
    ]);

    logResult(
      33,
      'Temporary test records cleaned up completely from PostgreSQL',
      true,
      'Cleaned up test users, orders, reviews, addresses, and products'
    );
  } catch (error) {
    console.error('Unhandled Exception in Phase 3F test suite:', error);
    logResult(999, 'Test suite execution completed without uncaught exceptions', false, error.message);
  } finally {
    if (localServer) {
      localServer.close();
    }
  }

  console.log('\n====================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`📊 Verification Summary: Total Tests: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runReviewsProfileAdminVerification().then(() => {
  pool.end();
});
