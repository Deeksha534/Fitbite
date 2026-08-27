require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, query } = require('./src/config/database');

const http = require('http');
const app = require('./src/app');

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

async function runCatalogVerification() {
  console.log('====================================================');
  console.log(`🧪 FitBite Phase 3C Products & Categories API Verification`);

  // Verify whether active server on port 5000 has new routes loaded; if not, spin up local test server instance
  try {
    const probe = await fetch(`${API_BASE}/api/v1/categories`);
    if (probe.status === 404) {
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
  const testCustomerEmail = `cust_${uniqueSuffix}@fitbite.test`;
  const testAdminEmail = `admin_${uniqueSuffix}@fitbite.test`;
  const testPassword = 'CatalogPassword123!';

  let customerToken = null;
  let adminToken = null;

  let customerId = null;
  let adminId = null;

  let createdCategoryId = null;
  let createdCategorySlug = `cat-${uniqueSuffix}`;
  let createdCategoryName = `Test Category ${uniqueSuffix}`;

  let createdProductId = null;
  let createdProductSlug = `prod-${uniqueSuffix}`;
  let createdProductName = `Test Protein Bar ${uniqueSuffix}`;

  let inactiveProductId = null;
  let inactiveProductSlug = `inactive-prod-${uniqueSuffix}`;

  try {
    // --------------------------------------------------------------------------
    // SETUP: CREATE TEST CUSTOMER & ADMIN TOKENS
    // --------------------------------------------------------------------------
    console.log('--- 0. Setting up Test Users (Customer & Admin) ---');

    // Register Customer via API
    const custReg = await sendRequest('POST', '/api/v1/auth/register', {
      email: testCustomerEmail,
      password: testPassword,
      full_name: 'Test Customer',
    });
    customerId = custReg.data?.data?.user?.id;
    customerToken = custReg.data?.data?.token;

    // Create Admin User directly in Database
    const adminPassHash = await bcrypt.hash(testPassword, 12);
    const adminDbRes = await query(
      `INSERT INTO public.users (email, password_hash, role, is_active)
       VALUES ($1, $2, 'admin', true)
       RETURNING id, email, role`,
      [testAdminEmail, adminPassHash]
    );
    adminId = adminDbRes.rows[0].id;
    await query('INSERT INTO public.profiles (id, full_name) VALUES ($1, $2)', [
      adminId,
      'Test Administrator',
    ]);

    // Login as Admin to get valid JWT token
    const adminLogin = await sendRequest('POST', '/api/v1/auth/login', {
      email: testAdminEmail,
      password: testPassword,
    });
    adminToken = adminLogin.data?.data?.token;

    console.log('Customer and Admin test accounts ready.\n');

    // ==========================================================================
    // CATEGORY TESTS (1 - 9)
    // ==========================================================================
    console.log('--- CATEGORY ENDPOINTS VERIFICATION ---');

    // Test 1: Public GET categories -> 200
    const catListRes = await sendRequest('GET', '/api/v1/categories');
    logResult(
      1,
      'Public GET categories returns 200 OK',
      catListRes.status === 200 && Array.isArray(catListRes.data?.data?.categories),
      `Status: ${catListRes.status}, Categories count: ${catListRes.data?.data?.categories?.length || 0}`
    );

    // Test 3: Customer POST category -> 403 Forbidden
    const custCreateCat = await sendRequest(
      'POST',
      '/api/v1/categories',
      {
        name: `Unauthorized Cat ${uniqueSuffix}`,
        slug: `unauth-cat-${uniqueSuffix}`,
      },
      { Authorization: `Bearer ${customerToken}` }
    );
    logResult(
      3,
      'Customer POST category returns 403 Forbidden',
      custCreateCat.status === 403 && custCreateCat.data?.success === false,
      `Status: ${custCreateCat.status}, Message: "${custCreateCat.data?.message}"`
    );

    // Test 4: Admin POST category -> 201 Created
    const adminCreateCat = await sendRequest(
      'POST',
      '/api/v1/categories',
      {
        name: createdCategoryName,
        slug: createdCategorySlug,
        description: 'High performance protein energy category',
        image_url: 'https://fitbite.local/images/category-energy.jpg',
        is_active: true,
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    createdCategoryId = adminCreateCat.data?.data?.category?.id;
    logResult(
      4,
      'Admin POST category returns 201 Created',
      adminCreateCat.status === 201 && adminCreateCat.data?.success === true && !!createdCategoryId,
      `Status: ${adminCreateCat.status}, Category ID: ${createdCategoryId}`
    );

    // Test 2: Public GET category by ID -> 200
    const publicCatRes = await sendRequest('GET', `/api/v1/categories/${createdCategoryId}`);
    logResult(
      2,
      'Public GET category by ID returns 200 OK',
      publicCatRes.status === 200 && publicCatRes.data?.data?.category?.id === createdCategoryId,
      `Status: ${publicCatRes.status}, Name: "${publicCatRes.data?.data?.category?.name}"`
    );

    // Test 5: Duplicate category (name or slug) -> 409 Conflict
    const dupCatRes = await sendRequest(
      'POST',
      '/api/v1/categories',
      {
        name: createdCategoryName,
        slug: `new-slug-${uniqueSuffix}`,
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      5,
      'Duplicate category name/slug returns 409 Conflict',
      dupCatRes.status === 409 && dupCatRes.data?.success === false,
      `Status: ${dupCatRes.status}, Message: "${dupCatRes.data?.message}"`
    );

    // Test 6: Invalid category UUID -> 400 Bad Request
    const invalidCatUuidRes = await sendRequest('GET', '/api/v1/categories/invalid-uuid-1234');
    logResult(
      6,
      'Invalid category UUID format returns 400 Bad Request',
      invalidCatUuidRes.status === 400 && invalidCatUuidRes.data?.success === false,
      `Status: ${invalidCatUuidRes.status}, Message: "${invalidCatUuidRes.data?.message}"`
    );

    // Test 7: Nonexistent category -> 404 Not Found
    const nonExistentCatUuid = '00000000-0000-0000-0000-000000000000';
    const nonExistentCatRes = await sendRequest('GET', `/api/v1/categories/${nonExistentCatUuid}`);
    logResult(
      7,
      'Nonexistent category UUID returns 404 Not Found',
      nonExistentCatRes.status === 404 && nonExistentCatRes.data?.success === false,
      `Status: ${nonExistentCatRes.status}, Message: "${nonExistentCatRes.data?.message}"`
    );

    // Test 8: Admin update category -> 200 OK
    const updatedDesc = 'Updated category description for performance series';
    const updateCatRes = await sendRequest(
      'PUT',
      `/api/v1/categories/${createdCategoryId}`,
      { description: updatedDesc },
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      8,
      'Admin update category returns 200 OK',
      updateCatRes.status === 200 && updateCatRes.data?.data?.category?.description === updatedDesc,
      `Status: ${updateCatRes.status}, Updated Description: "${updateCatRes.data?.data?.category?.description}"`
    );

    // Test 9: Admin delete category -> successful response
    const tempCatSlug = `temp-delete-cat-${uniqueSuffix}`;
    const tempCatRes = await sendRequest(
      'POST',
      '/api/v1/categories',
      { name: `Temp Delete Cat ${uniqueSuffix}`, slug: tempCatSlug },
      { Authorization: `Bearer ${adminToken}` }
    );
    const tempCatId = tempCatRes.data?.data?.category?.id;

    const deleteCatRes = await sendRequest(
      'DELETE',
      `/api/v1/categories/${tempCatId}`,
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      9,
      'Admin delete category returns 200 OK',
      deleteCatRes.status === 200 && deleteCatRes.data?.success === true,
      `Status: ${deleteCatRes.status}, Message: "${deleteCatRes.data?.message}"`
    );

    // ==========================================================================
    // PRODUCT TESTS (10 - 19)
    // ==========================================================================
    console.log('\n--- PRODUCT ENDPOINTS VERIFICATION ---');

    // Test 10: Public GET products -> 200 OK
    const prodListRes = await sendRequest('GET', '/api/v1/products');
    logResult(
      10,
      'Public GET products returns 200 OK',
      prodListRes.status === 200 && Array.isArray(prodListRes.data?.data?.products),
      `Status: ${prodListRes.status}, Products count: ${prodListRes.data?.data?.products?.length || 0}`
    );

    // Test 13: Customer POST product -> 403 Forbidden
    const custCreateProd = await sendRequest(
      'POST',
      '/api/v1/products',
      {
        name: `Unauthorized Product ${uniqueSuffix}`,
        slug: `unauth-prod-${uniqueSuffix}`,
        price: 150.0,
      },
      { Authorization: `Bearer ${customerToken}` }
    );
    logResult(
      13,
      'Customer POST product returns 403 Forbidden',
      custCreateProd.status === 403 && custCreateProd.data?.success === false,
      `Status: ${custCreateProd.status}, Message: "${custCreateProd.data?.message}"`
    );

    // Test 14: Admin POST product -> 201 Created (with gallery images)
    const adminCreateProd = await sendRequest(
      'POST',
      '/api/v1/products',
      {
        category_id: createdCategoryId,
        name: createdProductName,
        slug: createdProductSlug,
        description: 'Delicious chocolate peanut butter fudge protein bar with 20g whey protein.',
        price: 140.0,
        compare_at_price: 180.0,
        stock_quantity: 50,
        flavor: 'Peanut Butter Fudge',
        protein_grams: 20.0,
        fiber_grams: 8.5,
        sugar_grams: 1.5,
        calories: 220,
        is_featured: true,
        is_active: true,
        images: [
          {
            image_url: 'https://fitbite.local/images/pbf-main.jpg',
            alt_text: 'Peanut Butter Fudge Hero Image',
            display_order: 0,
            is_primary: true,
          },
          {
            image_url: 'https://fitbite.local/images/pbf-nutrition.jpg',
            alt_text: 'Peanut Butter Fudge Nutrition Facts',
            display_order: 1,
            is_primary: false,
          },
        ],
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    createdProductId = adminCreateProd.data?.data?.product?.id;
    logResult(
      14,
      'Admin POST product returns 201 Created with images',
      adminCreateProd.status === 201 && adminCreateProd.data?.success === true && !!createdProductId,
      `Status: ${adminCreateProd.status}, Product ID: ${createdProductId}`
    );

    // Also create an inactive product for testing privacy
    const inactiveProdRes = await sendRequest(
      'POST',
      '/api/v1/products',
      {
        category_id: createdCategoryId,
        name: `Inactive Seasonal Bar ${uniqueSuffix}`,
        slug: inactiveProductSlug,
        description: 'Seasonal winter bar currently discontinued',
        price: 199.0,
        stock_quantity: 0,
        flavor: 'Cinnamon Spice',
        is_active: false,
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    inactiveProductId = inactiveProdRes.data?.data?.product?.id;

    // Test 11: Public GET product by ID -> 200 OK
    const publicProdRes = await sendRequest('GET', `/api/v1/products/${createdProductId}`);
    logResult(
      11,
      'Public GET product by ID returns 200 OK',
      publicProdRes.status === 200 && publicProdRes.data?.data?.product?.id === createdProductId,
      `Status: ${publicProdRes.status}, Product: "${publicProdRes.data?.data?.product?.name}"`
    );

    // Test 12: Public inactive products are not exposed
    const directInactiveGet = await sendRequest('GET', `/api/v1/products/${inactiveProductId}`);
    const publicList = await sendRequest('GET', '/api/v1/products');
    const inactiveInPublicList = publicList.data?.data?.products?.some((p) => p.id === inactiveProductId);

    logResult(
      12,
      'Public inactive products are not exposed (404 on direct access & excluded from catalog)',
      directInactiveGet.status === 404 && !inactiveInPublicList,
      `Direct Status: ${directInactiveGet.status}, In Public List: ${inactiveInPublicList}`
    );

    // Test 15: Duplicate product slug -> 409 Conflict
    const dupProdRes = await sendRequest(
      'POST',
      '/api/v1/products',
      {
        name: 'Another Duplicate Bar',
        slug: createdProductSlug,
        price: 120.0,
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      15,
      'Duplicate product slug returns 409 Conflict',
      dupProdRes.status === 409 && dupProdRes.data?.success === false,
      `Status: ${dupProdRes.status}, Message: "${dupProdRes.data?.message}"`
    );

    // Test 16: Invalid product UUID -> 400 Bad Request
    const invalidProdUuidRes = await sendRequest('GET', '/api/v1/products/invalid-uuid-5678');
    logResult(
      16,
      'Invalid product UUID format returns 400 Bad Request',
      invalidProdUuidRes.status === 400 && invalidProdUuidRes.data?.success === false,
      `Status: ${invalidProdUuidRes.status}, Message: "${invalidProdUuidRes.data?.message}"`
    );

    // Test 17: Nonexistent product -> 404 Not Found
    const nonExistentProdUuid = '00000000-0000-0000-0000-000000000000';
    const nonExistentProdRes = await sendRequest('GET', `/api/v1/products/${nonExistentProdUuid}`);
    logResult(
      17,
      'Nonexistent product UUID returns 404 Not Found',
      nonExistentProdRes.status === 404 && nonExistentProdRes.data?.success === false,
      `Status: ${nonExistentProdRes.status}, Message: "${nonExistentProdRes.data?.message}"`
    );

    // Test 18: Admin update product -> 200 OK
    const updatedPrice = 135.0;
    const updateProdRes = await sendRequest(
      'PUT',
      `/api/v1/products/${createdProductId}`,
      { price: updatedPrice, stock_quantity: 75 },
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      18,
      'Admin update product returns 200 OK',
      updateProdRes.status === 200 && Number(updateProdRes.data?.data?.product?.price) === updatedPrice,
      `Status: ${updateProdRes.status}, New Price: ${updateProdRes.data?.data?.product?.price}`
    );

    // Test 19: Admin delete/deactivate product -> successful response
    const tempProdRes = await sendRequest(
      'POST',
      '/api/v1/products',
      {
        name: `Temp Delete Bar ${uniqueSuffix}`,
        slug: `temp-delete-bar-${uniqueSuffix}`,
        price: 99.0,
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    const tempProdId = tempProdRes.data?.data?.product?.id;

    const deleteProdRes = await sendRequest(
      'DELETE',
      `/api/v1/products/${tempProdId}`,
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      19,
      'Admin delete product returns 200 OK',
      deleteProdRes.status === 200 && deleteProdRes.data?.success === true,
      `Status: ${deleteProdRes.status}, Message: "${deleteProdRes.data?.message}"`
    );

    // ==========================================================================
    // FILTERING, SORTING & PAGINATION TESTS (20 - 24)
    // ==========================================================================
    console.log('\n--- FILTERING, SORTING & PAGINATION VERIFICATION ---');

    // Test 20: Search filtering works
    const searchRes = await sendRequest('GET', `/api/v1/products?search=peanut`);
    const searchMatches = searchRes.data?.data?.products?.some((p) => p.id === createdProductId);
    logResult(
      20,
      'Search filtering (?search=...) matches product title/flavor/description',
      searchRes.status === 200 && searchMatches,
      `Status: ${searchRes.status}, Found Target Product: ${searchMatches}`
    );

    // Test 21: Category filtering works
    const catFilterRes = await sendRequest('GET', `/api/v1/products?category_id=${createdCategoryId}`);
    const allMatchCategory = catFilterRes.data?.data?.products?.every(
      (p) => p.category_id === createdCategoryId
    );
    logResult(
      21,
      'Category filtering (?category_id=...) returns only products in target category',
      catFilterRes.status === 200 && allMatchCategory && catFilterRes.data?.data?.products?.length > 0,
      `Status: ${catFilterRes.status}, Matched count: ${catFilterRes.data?.data?.products?.length || 0}`
    );

    // Test 22: Price range filtering works
    const priceFilterRes = await sendRequest('GET', `/api/v1/products?min_price=100&max_price=150`);
    const allInPriceRange = priceFilterRes.data?.data?.products?.every(
      (p) => Number(p.price) >= 100 && Number(p.price) <= 150
    );
    logResult(
      22,
      'Price range filtering (?min_price=...&max_price=...) filters accurately',
      priceFilterRes.status === 200 && allInPriceRange,
      `Status: ${priceFilterRes.status}, Products within range: ${priceFilterRes.data?.data?.products?.length || 0}`
    );

    // Test 23: Pagination works
    const pageRes = await sendRequest('GET', `/api/v1/products?page=1&limit=1`);
    const pMeta = pageRes.data?.data?.pagination;
    logResult(
      23,
      'Pagination (?page=1&limit=1) returns valid pagination metadata',
      pageRes.status === 200 &&
        pMeta &&
        pMeta.page === 1 &&
        pMeta.limit === 1 &&
        pMeta.total >= 1 &&
        pMeta.totalPages >= 1 &&
        pageRes.data?.data?.products?.length === 1,
      `Page: ${pMeta?.page}, Limit: ${pMeta?.limit}, Total: ${pMeta?.total}, TotalPages: ${pMeta?.totalPages}`
    );

    // Test 24: Admin can see inactive products
    const adminInactiveList = await sendRequest(
      'GET',
      '/api/v1/products?is_active=false',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    const adminFoundInactive = adminInactiveList.data?.data?.products?.some(
      (p) => p.id === inactiveProductId
    );
    logResult(
      24,
      'Admin with Bearer token can view inactive products (?is_active=false)',
      adminInactiveList.status === 200 && adminFoundInactive,
      `Status: ${adminInactiveList.status}, Found inactive product in list: ${adminFoundInactive}`
    );

    // ==========================================================================
    // IMAGES & DATABASE PERSISTENCE TESTS (25 - 27)
    // ==========================================================================
    console.log('\n--- IMAGES & DATABASE PERSISTENCE VERIFICATION ---');

    // Test 25: Product detail returns image gallery correctly ordered by display_order
    const prodDetailRes = await sendRequest('GET', `/api/v1/products/${createdProductId}`);
    const imagesGallery = prodDetailRes.data?.data?.product?.images;
    const hasOrderedGallery =
      Array.isArray(imagesGallery) &&
      imagesGallery.length === 2 &&
      imagesGallery[0].is_primary === true &&
      imagesGallery[0].display_order <= imagesGallery[1].display_order;
    logResult(
      25,
      'Product detail GET returns complete image gallery ordered by display_order',
      hasOrderedGallery,
      `Gallery image count: ${imagesGallery?.length || 0}, Primary image first: ${imagesGallery?.[0]?.is_primary}`
    );

    // Test 26: Direct PostgreSQL verification
    const catDbCheck = await query('SELECT id, name, slug FROM public.categories WHERE id = $1', [
      createdCategoryId,
    ]);
    const prodDbCheck = await query(
      'SELECT id, name, slug, price, category_id FROM public.products WHERE id = $1',
      [createdProductId]
    );
    const imgDbCheck = await query(
      'SELECT id, image_url, display_order FROM public.product_images WHERE product_id = $1',
      [createdProductId]
    );

    const dbVerified =
      catDbCheck.rows.length === 1 &&
      prodDbCheck.rows.length === 1 &&
      imgDbCheck.rows.length === 2 &&
      prodDbCheck.rows[0].category_id === createdCategoryId;

    logResult(
      26,
      'Direct PostgreSQL verification confirms category, product, and image records are persisted',
      dbVerified,
      `DB Category: "${catDbCheck.rows[0]?.name}", DB Product: "${prodDbCheck.rows[0]?.name}", Images in DB: ${imgDbCheck.rows.length}`
    );

  } finally {
    // --------------------------------------------------------------------------
    // CLEANUP TEMPORARY TEST DATA FROM POSTGRESQL
    // --------------------------------------------------------------------------
    console.log('\n--- 27. Cleaning up temporary test records ---');

    // Delete created products (cascades to product_images)
    if (createdProductId || inactiveProductId) {
      await query('DELETE FROM public.products WHERE id IN ($1, $2)', [
        createdProductId,
        inactiveProductId,
      ]);
    }

    // Delete created category
    if (createdCategoryId) {
      await query('DELETE FROM public.categories WHERE id = $1', [createdCategoryId]);
    }

    // Delete test users (cascades to profiles, carts, wishlists)
    if (customerId || adminId) {
      await query('DELETE FROM public.users WHERE id IN ($1, $2)', [customerId, adminId]);
    }

    // Test 27: Verify cleanup
    const cleanCheck = await query(
      'SELECT COUNT(*)::int AS count FROM public.products WHERE id IN ($1, $2)',
      [createdProductId || '00000000-0000-0000-0000-000000000000', inactiveProductId || '00000000-0000-0000-0000-000000000000']
    );
    const cleanedSuccessfully = cleanCheck.rows[0].count === 0;

    logResult(
      27,
      'Temporary test records cleaned up from PostgreSQL',
      cleanedSuccessfully,
      `Remaining test product records: ${cleanCheck.rows[0].count}`
    );

    if (localServer) {
      await new Promise((resolve) => localServer.close(resolve));
    }
    await pool.end();
  }


  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n====================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`📊 Verification Summary: Total Tests: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCatalogVerification().catch((err) => {
  console.error('Catalog verification suite execution error:', err);
  process.exit(1);
});
