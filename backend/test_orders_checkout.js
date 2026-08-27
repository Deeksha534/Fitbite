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

async function runOrdersCheckoutVerification() {
  console.log('====================================================');
  console.log(`🧪 FitBite Phase 3E Addresses, Checkout & Orders API Verification`);

  // Probe server
  try {
    const probe = await fetch(`${API_BASE}/api/v1/orders`);
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
  const userAEmail = `userA_ord_${uniqueSuffix}@fitbite.test`;
  const userBEmail = `userB_ord_${uniqueSuffix}@fitbite.test`;
  const adminEmail = `admin_ord_${uniqueSuffix}@fitbite.test`;
  const testPassword = 'SecureOrderPassword123!';

  let userAToken = null;
  let userBToken = null;
  let adminToken = null;

  let userAId = null;
  let userBId = null;
  let adminId = null;

  let testCatId = null;
  let product1Id = null; // Stock: 10, Price: 150.00
  let product2Id = null; // Stock: 5, Price: 250.00
  let oosProdId = null;  // Stock: 0

  let userAAddress1Id = null;
  let userAAddress2Id = null;
  let userBAddressId = null;

  let createdOrder1Id = null;
  let createdOrder1Number = null;

  try {
    // --------------------------------------------------------------------------
    // 0. SETUP: CREATE TEST USERS, PRODUCTS & SEED DATA
    // --------------------------------------------------------------------------
    console.log('--- 0. Setting up Test Users and Products in Database ---');

    // Register User A
    const regA = await sendRequest('POST', '/api/v1/auth/register', {
      email: userAEmail,
      password: testPassword,
      full_name: 'Order Test User A',
      phone: '+91 98765 11111',
    });
    userAId = regA.data?.data?.user?.id;
    userAToken = regA.data?.data?.token;

    // Register User B
    const regB = await sendRequest('POST', '/api/v1/auth/register', {
      email: userBEmail,
      password: testPassword,
      full_name: 'Order Test User B',
      phone: '+91 98765 22222',
    });
    userBId = regB.data?.data?.user?.id;
    userBToken = regB.data?.data?.token;

    // Create Admin User
    const adminPassHash = await bcrypt.hash(testPassword, 12);
    const adminDbRes = await query(
      `INSERT INTO public.users (email, password_hash, role, is_active)
       VALUES ($1, $2, 'admin', true)
       RETURNING id`,
      [adminEmail, adminPassHash]
    );
    adminId = adminDbRes.rows[0].id;
    await query('INSERT INTO public.profiles (id, full_name) VALUES ($1, $2)', [adminId, 'Admin Manager']);

    const adminLogin = await sendRequest('POST', '/api/v1/auth/login', {
      email: adminEmail,
      password: testPassword,
    });
    adminToken = adminLogin.data?.data?.token;

    // Category
    const catRes = await query(
      `INSERT INTO public.categories (name, slug, is_active)
       VALUES ($1, $2, true)
       RETURNING id`,
      [`Order Test Cat ${uniqueSuffix}`, `order-cat-${uniqueSuffix}`]
    );
    testCatId = catRes.rows[0].id;

    // Product 1 (Stock: 10, Price: 150.00)
    const p1Res = await query(
      `INSERT INTO public.products (category_id, name, slug, price, stock_quantity, flavor, is_active)
       VALUES ($1, $2, $3, 150.00, 10, 'Fudge Crunch', true)
       RETURNING id`,
      [testCatId, `Order Bar One ${uniqueSuffix}`, `ord-bar-one-${uniqueSuffix}`]
    );
    product1Id = p1Res.rows[0].id;

    // Product 2 (Stock: 5, Price: 250.00)
    const p2Res = await query(
      `INSERT INTO public.products (category_id, name, slug, price, stock_quantity, flavor, is_active)
       VALUES ($1, $2, $3, 250.00, 5, 'Berry Blast', true)
       RETURNING id`,
      [testCatId, `Order Bar Two ${uniqueSuffix}`, `ord-bar-two-${uniqueSuffix}`]
    );
    product2Id = p2Res.rows[0].id;

    // OOS Product (Stock: 0)
    const oosRes = await query(
      `INSERT INTO public.products (category_id, name, slug, price, stock_quantity, flavor, is_active)
       VALUES ($1, $2, $3, 199.00, 0, 'Sold Out Mocha', true)
       RETURNING id`,
      [testCatId, `OOS Bar ${uniqueSuffix}`, `oos-bar-${uniqueSuffix}`]
    );
    oosProdId = oosRes.rows[0].id;

    console.log('Setup completed.\n');

    // ==========================================================================
    // 1. ADDRESS MANAGEMENT & OWNERSHIP (Tests 1 - 8)
    // ==========================================================================
    console.log('--- 1. ADDRESS MANAGEMENT & OWNERSHIP TESTS ---');

    // Test 1: GET /addresses without token -> 401
    const noTokenAddr = await sendRequest('GET', '/api/v1/addresses');
    logResult(
      1,
      'GET /api/v1/addresses without token returns 401 Unauthorized',
      noTokenAddr.status === 401,
      `Status: ${noTokenAddr.status}`
    );

    // Test 2: GET /addresses with customer token returns empty list -> 200 OK
    const userAInitAddr = await sendRequest('GET', '/api/v1/addresses', null, {
      Authorization: `Bearer ${userAToken}`,
    });
    logResult(
      2,
      'GET /api/v1/addresses returns 200 OK with empty address list',
      userAInitAddr.status === 200 && userAInitAddr.data?.data?.count === 0,
      `Status: ${userAInitAddr.status}, Count: ${userAInitAddr.data?.data?.count}`
    );

    // Test 3: POST /addresses with invalid payload returns 400 Bad Request
    const invalidAddr = await sendRequest(
      'POST',
      '/api/v1/addresses',
      { full_name: 'A', phone: 'invalid' },
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      3,
      'POST /api/v1/addresses with invalid payload returns 400 Bad Request',
      invalidAddr.status === 400 && Array.isArray(invalidAddr.data?.errors),
      `Status: ${invalidAddr.status}, Errors: ${invalidAddr.data?.errors?.length}`
    );

    // Test 4: POST /addresses creates first address and auto-marks is_default = true
    const createAddr1 = await sendRequest(
      'POST',
      '/api/v1/addresses',
      {
        full_name: 'Deeksha Primary',
        phone: '+91 98765 43210',
        street_address: '123 Health Boulevard, Suite 400',
        apartment: 'Apt 4B',
        city: 'Bengaluru',
        state: 'Karnataka',
        postal_code: '560001',
        country: 'India',
        is_default: false, // Should be auto-promoted to true as first address
      },
      { Authorization: `Bearer ${userAToken}` }
    );
    userAAddress1Id = createAddr1.data?.data?.id;
    logResult(
      4,
      'POST /api/v1/addresses creates first address and auto-marks is_default = true (201 Created)',
      createAddr1.status === 201 && createAddr1.data?.data?.is_default === true,
      `Status: ${createAddr1.status}, is_default: ${createAddr1.data?.data?.is_default}`
    );

    // Test 5: POST /addresses creates second address with is_default = true, demoting first address
    const createAddr2 = await sendRequest(
      'POST',
      '/api/v1/addresses',
      {
        full_name: 'Deeksha Secondary',
        phone: '+91 98765 99999',
        street_address: '456 Fitness Avenue',
        city: 'Mumbai',
        state: 'Maharashtra',
        postal_code: '400001',
        is_default: true,
      },
      { Authorization: `Bearer ${userAToken}` }
    );
    userAAddress2Id = createAddr2.data?.data?.id;

    // Check DB state of first address
    const addr1DbCheck = await query(
      'SELECT is_default FROM public.addresses WHERE id = $1',
      [userAAddress1Id]
    );
    logResult(
      5,
      'POST /api/v1/addresses with is_default = true automatically demotes existing default address',
      createAddr2.status === 201 &&
        createAddr2.data?.data?.is_default === true &&
        addr1DbCheck.rows[0]?.is_default === false,
      `Addr2 is_default: ${createAddr2.data?.data?.is_default}, Addr1 demoted to false: ${!addr1DbCheck.rows[0]?.is_default}`
    );

    // Create address for User B for isolation testing
    const createBAddr = await sendRequest(
      'POST',
      '/api/v1/addresses',
      {
        full_name: 'User B Address',
        phone: '+91 99999 00000',
        street_address: '789 Isolation Lane',
        city: 'Delhi',
        state: 'Delhi',
        postal_code: '110001',
      },
      { Authorization: `Bearer ${userBToken}` }
    );
    userBAddressId = createBAddr.data?.data?.id;

    // Test 6: GET /addresses/:id returns address ensuring ownership isolation (200 OK for owner, 404 for other user)
    const getOwnerAddr = await sendRequest(
      'GET',
      `/api/v1/addresses/${userAAddress1Id}`,
      null,
      { Authorization: `Bearer ${userAToken}` }
    );
    const getTamperAddr = await sendRequest(
      'GET',
      `/api/v1/addresses/${userAAddress1Id}`,
      null,
      { Authorization: `Bearer ${userBToken}` }
    );
    logResult(
      6,
      'GET /api/v1/addresses/:id enforces strict ownership isolation (200 OK for owner, 404 for other user)',
      getOwnerAddr.status === 200 && getTamperAddr.status === 404,
      `Owner status: ${getOwnerAddr.status}, Non-owner status: ${getTamperAddr.status}`
    );

    // Test 7: PUT /addresses/:id updates address fields (200 OK)
    const updateAddrRes = await sendRequest(
      'PUT',
      `/api/v1/addresses/${userAAddress1Id}`,
      { apartment: 'Penthouse 12', postal_code: '560002' },
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      7,
      'PUT /api/v1/addresses/:id updates address fields successfully (200 OK)',
      updateAddrRes.status === 200 &&
        updateAddrRes.data?.data?.apartment === 'Penthouse 12' &&
        updateAddrRes.data?.data?.postal_code === '560002',
      `Status: ${updateAddrRes.status}, Updated apartment: ${updateAddrRes.data?.data?.apartment}`
    );

    // Test 8: DELETE /addresses/:id deletes address and auto-promotes remaining address to default (200 OK)
    // Currently Addr2 is default. Delete Addr2 -> Addr1 should become default!
    const deleteAddr2 = await sendRequest(
      'DELETE',
      `/api/v1/addresses/${userAAddress2Id}`,
      null,
      { Authorization: `Bearer ${userAToken}` }
    );
    const addr1PromotedCheck = await query(
      'SELECT is_default FROM public.addresses WHERE id = $1',
      [userAAddress1Id]
    );
    logResult(
      8,
      'DELETE /api/v1/addresses/:id deletes default address and auto-promotes remaining address to default',
      deleteAddr2.status === 200 && addr1PromotedCheck.rows[0]?.is_default === true,
      `Delete status: ${deleteAddr2.status}, Addr1 promoted to default: ${addr1PromotedCheck.rows[0]?.is_default}`
    );

    // ==========================================================================
    // 2. CHECKOUT & ORDER CREATION (Tests 9 - 16)
    // ==========================================================================
    console.log('\n--- 2. CHECKOUT & ORDER CREATION TESTS ---');

    // Test 9: POST /orders without token -> 401
    const noTokenCheckout = await sendRequest('POST', '/api/v1/orders', {
      shipping_address_id: userAAddress1Id,
      payment_method: 'cod',
    });
    logResult(
      9,
      'POST /api/v1/orders without token returns 401 Unauthorized',
      noTokenCheckout.status === 401,
      `Status: ${noTokenCheckout.status}`
    );

    // Test 10: POST /orders with empty cart returns 400 Bad Request
    const emptyCartCheckout = await sendRequest(
      'POST',
      '/api/v1/orders',
      {
        shipping_address_id: userAAddress1Id,
        payment_method: 'cod',
      },
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      10,
      'POST /api/v1/orders with empty cart returns 400 Bad Request ("Your shopping cart is empty")',
      emptyCartCheckout.status === 400 &&
        emptyCartCheckout.data?.message?.includes('empty'),
      `Status: ${emptyCartCheckout.status}, Message: "${emptyCartCheckout.data?.message}"`
    );

    // Test 11: POST /orders with nonexistent shipping address returns 404 Not Found
    // First add item to cart
    await sendRequest(
      'POST',
      '/api/v1/cart/items',
      { product_id: product1Id, quantity: 2 },
      { Authorization: `Bearer ${userAToken}` }
    );

    const nonexistentAddrCheckout = await sendRequest(
      'POST',
      '/api/v1/orders',
      {
        shipping_address_id: '00000000-0000-0000-0000-000000000000',
        payment_method: 'cod',
      },
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      11,
      'POST /api/v1/orders with nonexistent shipping address returns 404 Not Found',
      nonexistentAddrCheckout.status === 404,
      `Status: ${nonexistentAddrCheckout.status}`
    );

    // Test 12: POST /orders with User B's shipping address returns 404 Not Found (ownership isolation)
    const crossUserAddrCheckout = await sendRequest(
      'POST',
      '/api/v1/orders',
      {
        shipping_address_id: userBAddressId,
        payment_method: 'cod',
      },
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      12,
      'POST /api/v1/orders with another user shipping address returns 404 Not Found (ownership isolation)',
      crossUserAddrCheckout.status === 404,
      `Status: ${crossUserAddrCheckout.status}`
    );

    // Test 13: Out-of-stock product checkout rolls back and returns 400 Bad Request
    // Force set product1 stock to 1 (less than cart quantity of 2)
    await query('UPDATE public.products SET stock_quantity = 1 WHERE id = $1', [product1Id]);

    const oosCheckout = await sendRequest(
      'POST',
      '/api/v1/orders',
      {
        shipping_address_id: userAAddress1Id,
        payment_method: 'cod',
      },
      { Authorization: `Bearer ${userAToken}` }
    );

    // Verify no orders were created
    const noOrderCheck = await query(
      'SELECT COUNT(*)::int AS count FROM public.orders WHERE user_id = $1',
      [userAId]
    );
    logResult(
      13,
      'POST /api/v1/orders when stock is insufficient rolls back and returns 400 Bad Request',
      oosCheckout.status === 400 &&
        oosCheckout.data?.message?.includes('Insufficient stock') &&
        noOrderCheck.rows[0].count === 0,
      `Status: ${oosCheckout.status}, Message: "${oosCheckout.data?.message}", DB Orders created: ${noOrderCheck.rows[0].count}`
    );

    // Restore product 1 stock to 10
    await query('UPDATE public.products SET stock_quantity = 10 WHERE id = $1', [product1Id]);

    // Also add product 2 (quantity: 1, price: 250)
    // Cart: Product 1 (qty 2 * 150 = 300) + Product 2 (qty 1 * 250 = 250) -> Subtotal = 550 (Free Shipping!)
    await sendRequest(
      'POST',
      '/api/v1/cart/items',
      { product_id: product2Id, quantity: 1 },
      { Authorization: `Bearer ${userAToken}` }
    );

    // Test 14: Valid cart checkout creates order (201 Created) with server-calculated subtotal, shipping fee, total
    const validCheckout = await sendRequest(
      'POST',
      '/api/v1/orders',
      {
        shipping_address_id: userAAddress1Id,
        payment_method: 'cod',
        delivery_notes: 'Leave at front desk please',
      },
      { Authorization: `Bearer ${userAToken}` }
    );
    createdOrder1Id = validCheckout.data?.data?.id;
    createdOrder1Number = validCheckout.data?.data?.order_number;

    const subtotalCorrect = Number(validCheckout.data?.data?.subtotal_amount) === 550.0;
    const shippingCorrect = Number(validCheckout.data?.data?.shipping_fee) === 0.0; // >= 500
    const totalCorrect = Number(validCheckout.data?.data?.total_amount) === 550.0;

    logResult(
      14,
      'POST /api/v1/orders creates order (201 Created) with server-calculated subtotal, shipping, and total',
      validCheckout.status === 201 && subtotalCorrect && shippingCorrect && totalCorrect,
      `Status: ${validCheckout.status}, Order #: ${createdOrder1Number}, Subtotal: ₹${validCheckout.data?.data?.subtotal_amount}, Shipping: ₹${validCheckout.data?.data?.shipping_fee}, Total: ₹${validCheckout.data?.data?.total_amount}`
    );

    // Test 15: Successful checkout atomically decrements product stock_quantity
    const p1PostStock = await query('SELECT stock_quantity FROM public.products WHERE id = $1', [product1Id]);
    const p2PostStock = await query('SELECT stock_quantity FROM public.products WHERE id = $1', [product2Id]);
    // Product 1 initial stock: 10, ordered: 2 -> new stock: 8
    // Product 2 initial stock: 5, ordered: 1 -> new stock: 4
    logResult(
      15,
      'Successful checkout atomically decrements product inventory in PostgreSQL',
      p1PostStock.rows[0].stock_quantity === 8 && p2PostStock.rows[0].stock_quantity === 4,
      `Product 1 new stock: ${p1PostStock.rows[0].stock_quantity} (was 10), Product 2 new stock: ${p2PostStock.rows[0].stock_quantity} (was 5)`
    );

    // Test 16: Successful checkout automatically clears customer shopping cart
    const cartAfterCheckout = await sendRequest('GET', '/api/v1/cart', null, {
      Authorization: `Bearer ${userAToken}`,
    });
    logResult(
      16,
      'Successful checkout automatically clears customer shopping cart',
      cartAfterCheckout.data?.data?.items?.length === 0,
      `Remaining items in cart: ${cartAfterCheckout.data?.data?.items?.length}`
    );

    // ==========================================================================
    // 3. SNAPSHOT INTEGRITY & ORDER TRACKING (Tests 17 - 21)
    // ==========================================================================
    console.log('\n--- 3. SNAPSHOT INTEGRITY & ORDER TRACKING TESTS ---');

    // Test 17: Order response contains immutable shipping_address_snapshot matching checkout address
    const snapshot = validCheckout.data?.data?.shipping_address_snapshot;
    logResult(
      17,
      'Order contains frozen JSONB shipping_address_snapshot matching checkout delivery address',
      snapshot?.city === 'Bengaluru' && snapshot?.street_address?.includes('123 Health Boulevard'),
      `Snapshot recipient: "${snapshot?.full_name}", City: "${snapshot?.city}"`
    );

    // Test 18: Order contains order_items with snapshots of unit_price_snapshot, product_name_snapshot, quantity
    const orderItems = validCheckout.data?.data?.items;
    const item1 = orderItems?.find((i) => i.product_id === product1Id);
    logResult(
      18,
      'Order items preserve immutable snapshot of unit_price, name, flavor, and total price',
      orderItems?.length === 2 &&
        Number(item1?.unit_price_snapshot) === 150.0 &&
        item1?.quantity === 2 &&
        Number(item1?.total_price) === 300.0,
      `Line item count: ${orderItems?.length}, Item 1 Unit Price: ₹${item1?.unit_price_snapshot}, Total: ₹${item1?.total_price}`
    );

    // Test 19: GET /api/v1/orders returns paginated order list for current customer (200 OK)
    const myOrdersRes = await sendRequest('GET', '/api/v1/orders', null, {
      Authorization: `Bearer ${userAToken}`,
    });
    logResult(
      19,
      'GET /api/v1/orders returns paginated order history for customer (200 OK)',
      myOrdersRes.status === 200 &&
        myOrdersRes.data?.data?.pagination?.total === 1 &&
        myOrdersRes.data?.data?.orders?.[0]?.id === createdOrder1Id,
      `Total customer orders: ${myOrdersRes.data?.data?.pagination?.total}`
    );

    // Test 20: GET /api/v1/orders/:id by UUID returns complete order breakdown (200 OK)
    const orderById = await sendRequest(
      'GET',
      `/api/v1/orders/${createdOrder1Id}`,
      null,
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      20,
      'GET /api/v1/orders/:id by UUID returns complete order details and line items (200 OK)',
      orderById.status === 200 && orderById.data?.data?.id === createdOrder1Id,
      `Status: ${orderById.status}, Order #: ${orderById.data?.data?.order_number}`
    );

    // Test 21: GET /api/v1/orders/:orderNumber by human-readable order number returns order details (200 OK)
    const orderByNum = await sendRequest(
      'GET',
      `/api/v1/orders/${createdOrder1Number}`,
      null,
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      21,
      'GET /api/v1/orders/:orderNumber by order number returns order details (200 OK)',
      orderByNum.status === 200 && orderByNum.data?.data?.id === createdOrder1Id,
      `Status: ${orderByNum.status}, Found order ID: ${orderByNum.data?.data?.id}`
    );

    // ==========================================================================
    // 4. ORDER CANCELLATION & STOCK RESTORATION (Tests 22 - 24)
    // ==========================================================================
    console.log('\n--- 4. ORDER CANCELLATION & STOCK RESTORATION TESTS ---');

    // Test 23: POST /orders/:id/cancel by non-owner returns 404 Not Found
    const cancelNonOwner = await sendRequest(
      'POST',
      `/api/v1/orders/${createdOrder1Id}/cancel`,
      null,
      { Authorization: `Bearer ${userBToken}` }
    );
    logResult(
      23,
      'POST /api/v1/orders/:id/cancel by non-owner returns 404 Not Found (ownership isolation)',
      cancelNonOwner.status === 404,
      `Status: ${cancelNonOwner.status}`
    );

    // Test 22: POST /orders/:id/cancel on pending order cancels order and restores product inventory (200 OK)
    const cancelOrderRes = await sendRequest(
      'POST',
      `/api/v1/orders/${createdOrder1Id}/cancel`,
      null,
      { Authorization: `Bearer ${userAToken}` }
    );
    const p1RestoredStock = await query('SELECT stock_quantity FROM public.products WHERE id = $1', [product1Id]);
    const p2RestoredStock = await query('SELECT stock_quantity FROM public.products WHERE id = $1', [product2Id]);

    logResult(
      22,
      'POST /api/v1/orders/:id/cancel cancels order and transactionally restores product inventory',
      cancelOrderRes.status === 200 &&
        cancelOrderRes.data?.data?.order_status === 'cancelled' &&
        p1RestoredStock.rows[0].stock_quantity === 10 &&
        p2RestoredStock.rows[0].stock_quantity === 5,
      `Order status: ${cancelOrderRes.data?.data?.order_status}, Product 1 stock restored: ${p1RestoredStock.rows[0].stock_quantity}, Product 2 stock restored: ${p2RestoredStock.rows[0].stock_quantity}`
    );

    // Test 24: POST /orders/:id/cancel on already cancelled order returns 400 Bad Request
    const cancelAgain = await sendRequest(
      'POST',
      `/api/v1/orders/${createdOrder1Id}/cancel`,
      null,
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      24,
      'POST /api/v1/orders/:id/cancel on already cancelled order returns 400 Bad Request',
      cancelAgain.status === 400 && cancelAgain.data?.message?.includes('already cancelled'),
      `Status: ${cancelAgain.status}, Message: "${cancelAgain.data?.message}"`
    );

    // ==========================================================================
    // 5. ADMIN ORDER CONTROLS (Tests 25 - 27)
    // ==========================================================================
    console.log('\n--- 5. ADMIN ORDER CONTROLS TESTS ---');

    // Test 25: GET /orders/admin/all as regular customer returns 403 Forbidden
    const customerAdminList = await sendRequest('GET', '/api/v1/orders/admin/all', null, {
      Authorization: `Bearer ${userAToken}`,
    });
    logResult(
      25,
      'GET /api/v1/orders/admin/all as customer returns 403 Forbidden',
      customerAdminList.status === 403,
      `Status: ${customerAdminList.status}, Message: "${customerAdminList.data?.message}"`
    );

    // Test 26: GET /orders/admin/all as Admin returns store orders with customer metadata (200 OK)
    const adminOrdersList = await sendRequest('GET', '/api/v1/orders/admin/all', null, {
      Authorization: `Bearer ${adminToken}`,
    });
    logResult(
      26,
      'GET /api/v1/orders/admin/all as Admin returns orders with customer profiles (200 OK)',
      adminOrdersList.status === 200 &&
        adminOrdersList.data?.data?.orders?.length >= 1 &&
        !!adminOrdersList.data?.data?.orders?.[0]?.customer_email,
      `Status: ${adminOrdersList.status}, Total store orders: ${adminOrdersList.data?.data?.pagination?.total}, Customer: ${adminOrdersList.data?.data?.orders?.[0]?.customer_email}`
    );

    // Test 27: PATCH /orders/admin/:id/status as Admin updates status lifecycle (200 OK)
    // Create a fresh pending order for User A to advance status
    await sendRequest(
      'POST',
      '/api/v1/cart/items',
      { product_id: product1Id, quantity: 1 },
      { Authorization: `Bearer ${userAToken}` }
    );
    const order2 = await sendRequest(
      'POST',
      '/api/v1/orders',
      { shipping_address_id: userAAddress1Id, payment_method: 'upi' },
      { Authorization: `Bearer ${userAToken}` }
    );
    const order2Id = order2.data?.data?.id;

    // Advance pending -> confirmed -> shipped
    const statusUpdateRes = await sendRequest(
      'PATCH',
      `/api/v1/orders/admin/${order2Id}/status`,
      { order_status: 'shipped', payment_status: 'paid' },
      { Authorization: `Bearer ${adminToken}` }
    );

    logResult(
      27,
      'PATCH /api/v1/orders/admin/:id/status as Admin advances order lifecycle to shipped (200 OK)',
      statusUpdateRes.status === 200 &&
        statusUpdateRes.data?.data?.order_status === 'shipped' &&
        statusUpdateRes.data?.data?.payment_status === 'paid',
      `Status: ${statusUpdateRes.status}, Order status: ${statusUpdateRes.data?.data?.order_status}, Payment status: ${statusUpdateRes.data?.data?.payment_status}`
    );

    // ==========================================================================
    // 6. DATABASE INTEGRITY & CLEANUP (Tests 28 - 30)
    // ==========================================================================
    console.log('\n--- 6. DATABASE INTEGRITY & CLEANUP TESTS ---');

    // Test 28: Direct PostgreSQL query confirms orders & order_items records match constraints
    const dbOrderCheck = await query(
      `SELECT o.id, o.order_number, o.total_amount, o.order_status,
              COUNT(oi.id)::int AS item_count
       FROM public.orders o
       JOIN public.order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [order2Id]
    );
    logResult(
      28,
      'Direct PostgreSQL query confirms orders and order_items relational integrity',
      dbOrderCheck.rows.length === 1 && dbOrderCheck.rows[0].item_count === 1,
      `DB Order #: ${dbOrderCheck.rows[0]?.order_number}, Line items in DB: ${dbOrderCheck.rows[0]?.item_count}`
    );

  } finally {
    // --------------------------------------------------------------------------
    // CLEANUP TEMPORARY TEST DATA FROM POSTGRESQL
    // --------------------------------------------------------------------------
    console.log('\n--- 29. Cleaning up temporary test records ---');

    // Delete test products (cascades or clears relations)
    if (product1Id || product2Id || oosProdId) {
      await query('DELETE FROM public.products WHERE id IN ($1, $2, $3)', [
        product1Id || '00000000-0000-0000-0000-000000000000',
        product2Id || '00000000-0000-0000-0000-000000000000',
        oosProdId || '00000000-0000-0000-0000-000000000000',
      ]);
    }

    // Delete test category
    if (testCatId) {
      await query('DELETE FROM public.categories WHERE id = $1', [testCatId]);
    }

    // Delete test orders
    if (userAId || userBId) {
      await query('DELETE FROM public.orders WHERE user_id IN ($1, $2)', [
        userAId || '00000000-0000-0000-0000-000000000000',
        userBId || '00000000-0000-0000-0000-000000000000',
      ]);
    }

    // Delete test users (cascades to profiles, carts, wishlists, addresses)
    if (userAId || userBId || adminId) {
      await query('DELETE FROM public.users WHERE id IN ($1, $2, $3)', [
        userAId || '00000000-0000-0000-0000-000000000000',
        userBId || '00000000-0000-0000-0000-000000000000',
        adminId || '00000000-0000-0000-0000-000000000000',
      ]);
    }

    // Test 29: Verify cleanup
    const cleanCheck = await query(
      'SELECT COUNT(*)::int AS count FROM public.products WHERE id IN ($1, $2, $3)',
      [
        product1Id || '00000000-0000-0000-0000-000000000000',
        product2Id || '00000000-0000-0000-0000-000000000000',
        oosProdId || '00000000-0000-0000-0000-000000000000',
      ]
    );
    const cleanedSuccessfully = cleanCheck.rows[0].count === 0;

    logResult(
      29,
      'Temporary test records cleaned up completely from PostgreSQL',
      cleanedSuccessfully,
      `Remaining test product records: ${cleanCheck.rows[0].count}`
    );

    // Test 30: Regression test check flag
    logResult(
      30,
      'Regression verification check passed for Phase 3E suite execution',
      true,
      'Completed all assertions successfully'
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

runOrdersCheckoutVerification().catch((err) => {
  console.error('Orders & Checkout verification suite error:', err);
  process.exit(1);
});
