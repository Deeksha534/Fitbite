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
  return { status: response.status, data, headers: response.headers };
};

async function runPhase3GVerification() {
  console.log('====================================================');
  console.log(`🧪 FitBite Phase 3G Commercial Workflows & Production Verification`);

  // Probe server or spin up ephemeral port
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
  const userAEmail = `usera_3g_${uniqueSuffix}@fitbite.test`;
  const userBEmail = `userb_3g_${uniqueSuffix}@fitbite.test`;
  const adminEmail = `admin_3g_${uniqueSuffix}@fitbite.test`;
  const subscriberEmail = `newsletter_${uniqueSuffix}@fitbite.test`;
  const testPassword = 'SecurePassword3G!123';

  let userAToken = null;
  let userBToken = null;
  let adminToken = null;

  let userAId = null;
  let userBId = null;
  let adminId = null;

  let testCategory = null;
  let testProduct1 = null;
  let testProduct2 = null;

  let coupon20Id = null;
  let couponFixedId = null;
  let couponTempId = null;

  let createdOrderA = null;
  let createdTicketA = null;

  try {
    // --------------------------------------------------------------------------
    // 0. Setup Test Users & Products
    // --------------------------------------------------------------------------
    console.log('--- 0. Setting up Test Users and Products in Database ---');

    // Register User A
    const regResA = await sendRequest('POST', '/api/v1/auth/register', {
      email: userAEmail,
      password: testPassword,
      full_name: 'Alex Rivera',
      phone: '+91 98765 44444',
    });
    userAToken = regResA.data.data.token;
    userAId = regResA.data.data.user.id;

    // Register User B
    const regResB = await sendRequest('POST', '/api/v1/auth/register', {
      email: userBEmail,
      password: testPassword,
      full_name: 'Samantha Hayes',
      phone: '+91 98765 55555',
    });
    userBToken = regResB.data.data.token;
    userBId = regResB.data.data.user.id;

    // Create Admin User in DB
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
       VALUES ($1, 'Store Operations Manager', '+91 98765 00000')`,
      [adminId]
    );

    const loginAdminRes = await sendRequest('POST', '/api/v1/auth/login', {
      email: adminEmail,
      password: testPassword,
    });
    adminToken = loginAdminRes.data.data.token;

    // Create Category and Products
    const catRes = await query(
      `INSERT INTO public.categories (name, slug, description, is_active)
       VALUES ($1, $2, 'Phase 3G Test Category', true)
       RETURNING id, name, slug`,
      [`Cat 3G ${uniqueSuffix}`, `cat-3g-${uniqueSuffix}`]
    );
    testCategory = catRes.rows[0];

    const prod1Res = await query(
      `INSERT INTO public.products (category_id, name, slug, description, price, stock_quantity, flavor, is_active)
       VALUES ($1, $2, $3, 'Test Bar 1', 150.00, 100, 'Chocolate Fudge', true)
       RETURNING id, name, slug, price, stock_quantity`,
      [testCategory.id, `Bar 3G One ${uniqueSuffix}`, `bar-one-${uniqueSuffix}`]
    );
    testProduct1 = prod1Res.rows[0];

    const prod2Res = await query(
      `INSERT INTO public.products (category_id, name, slug, description, price, stock_quantity, flavor, is_active)
       VALUES ($1, $2, $3, 'Test Bar 2', 200.00, 100, 'Almond Crunch', true)
       RETURNING id, name, slug, price, stock_quantity`,
      [testCategory.id, `Bar 3G Two ${uniqueSuffix}`, `bar-two-${uniqueSuffix}`]
    );
    testProduct2 = prod2Res.rows[0];

    console.log('Setup completed.\n');

    // --------------------------------------------------------------------------
    // 1. COUPONS & CART DISCOUNT ENGINE
    // --------------------------------------------------------------------------
    console.log('--- 1. COUPONS & CART DISCOUNT ENGINE ---');

    // Test 1: Validate coupon without token (401)
    const noAuthCoup = await sendRequest('POST', '/api/v1/coupons/validate', { code: 'FITBITE20' });
    logResult(
      1,
      'POST /api/v1/coupons/validate without token returns 401 Unauthorized',
      noAuthCoup.status === 401,
      `Status: ${noAuthCoup.status}`
    );

    // Test 2: Validate coupon with empty cart (400)
    const emptyCartCoup = await sendRequest(
      'POST',
      '/api/v1/coupons/validate',
      { code: 'FITBITE20' },
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      2,
      'POST /api/v1/coupons/validate with empty cart returns 400 Bad Request',
      emptyCartCoup.status === 400 && emptyCartCoup.data?.message.includes('empty'),
      `Status: ${emptyCartCoup.status}, Message: "${emptyCartCoup.data?.message}"`
    );

    // Test 3: Admin creates percentage coupon (201 Created)
    const code20 = `FITBITE20_${uniqueSuffix}`;
    const create20Res = await sendRequest(
      'POST',
      '/api/v1/coupons/admin',
      {
        code: code20,
        discount_type: 'percentage',
        discount_value: 20,
        min_order_amount: 300,
        max_discount_amount: 100,
        usage_limit: 50,
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    coupon20Id = create20Res.data?.data?.coupon?.id;
    logResult(
      3,
      'POST /api/v1/coupons/admin creates percentage discount coupon (201 Created)',
      create20Res.status === 201 &&
        create20Res.data?.data?.coupon?.code === code20 &&
        create20Res.data?.data?.coupon?.discount_value === 20,
      `Coupon ID: ${coupon20Id}, Code: "${create20Res.data?.data?.coupon?.code}"`
    );

    // Test 4: Admin creates fixed amount coupon (201 Created)
    const codeFixed = `PROTEIN50_${uniqueSuffix}`;
    const createFixedRes = await sendRequest(
      'POST',
      '/api/v1/coupons/admin',
      {
        code: codeFixed,
        discount_type: 'fixed',
        discount_value: 50,
        min_order_amount: 250,
        usage_limit: 100,
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    couponFixedId = createFixedRes.data?.data?.coupon?.id;
    logResult(
      4,
      'POST /api/v1/coupons/admin creates fixed discount coupon (201 Created)',
      createFixedRes.status === 201 && createFixedRes.data?.data?.coupon?.discount_value === 50,
      `Coupon ID: ${couponFixedId}, Code: "${createFixedRes.data?.data?.coupon?.code}"`
    );

    // Test 5: Admin duplicate coupon creation returns 409 Conflict
    const dupCoupRes = await sendRequest(
      'POST',
      '/api/v1/coupons/admin',
      {
        code: code20,
        discount_type: 'percentage',
        discount_value: 20,
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      5,
      'POST /api/v1/coupons/admin with duplicate code returns 409 Conflict',
      dupCoupRes.status === 409,
      `Status: ${dupCoupRes.status}, Message: "${dupCoupRes.data?.message}"`
    );

    // Add 3 items of Product 1 (3 x 150 = 450) to Cart A
    await sendRequest(
      'POST',
      '/api/v1/cart/items',
      { product_id: testProduct1.id, quantity: 3 },
      { Authorization: `Bearer ${userAToken}` }
    );

    // Test 6: Validate percentage coupon against Cart A (subtotal 450 -> 20% = 90 discount, shipping 50 -> total 410)
    const val20Res = await sendRequest(
      'POST',
      '/api/v1/coupons/validate',
      { code: code20 },
      { Authorization: `Bearer ${userAToken}` }
    );
    const valData = val20Res.data?.data;
    logResult(
      6,
      'POST /api/v1/coupons/validate calculates accurate 20% discount (Saved ₹90 on ₹450 subtotal)',
      val20Res.status === 200 &&
        valData?.discount_amount === 90 &&
        valData?.subtotal_amount === 450 &&
        valData?.estimated_total === 410,
      `Subtotal: ₹${valData?.subtotal_amount}, Discount: ₹${valData?.discount_amount}, Estimated Total: ₹${valData?.estimated_total}`
    );

    // Test 7: Validate coupon below minimum order threshold
    const highMinCode = `HIGHMIN_${uniqueSuffix}`;
    await sendRequest(
      'POST',
      '/api/v1/coupons/admin',
      {
        code: highMinCode,
        discount_type: 'percentage',
        discount_value: 30,
        min_order_amount: 1000,
      },
      { Authorization: `Bearer ${adminToken}` }
    );

    const valHighMinRes = await sendRequest(
      'POST',
      '/api/v1/coupons/validate',
      { code: highMinCode },
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      7,
      'POST /api/v1/coupons/validate rejects coupon when cart subtotal < min_order_amount (400 Bad Request)',
      valHighMinRes.status === 400 && valHighMinRes.data?.message.includes('Minimum order subtotal'),
      `Status: ${valHighMinRes.status}, Message: "${valHighMinRes.data?.message}"`
    );

    // Add address for User A
    const addrARes = await sendRequest(
      'POST',
      '/api/v1/addresses',
      {
        full_name: 'Alex Rivera',
        phone: '+91 98765 44444',
        street_address: '404 Innovation Drive',
        city: 'Bengaluru',
        state: 'Karnataka',
        postal_code: '560038',
        country: 'India',
        is_default: true,
      },
      { Authorization: `Bearer ${userAToken}` }
    );
    const addrAId = addrARes.data?.data?.id || addrARes.data?.data?.address?.id;

    // Test 8: Checkout with coupon code -> server applies discount atomically
    const checkoutRes = await sendRequest(
      'POST',
      '/api/v1/orders',
      {
        shipping_address_id: addrAId,
        payment_method: 'card',
        coupon_code: code20,
      },
      { Authorization: `Bearer ${userAToken}` }
    );
    createdOrderA = checkoutRes.data?.data;
    logResult(
      8,
      'POST /api/v1/orders applies coupon discount atomically in checkout transaction (201 Created)',
      checkoutRes.status === 201 &&
        Number(createdOrderA?.subtotal_amount) === 450 &&
        Number(createdOrderA?.discount_amount) === 90 &&
        Number(createdOrderA?.total_amount) === 410 &&
        createdOrderA?.payment_status === 'paid',
      `Order #: ${createdOrderA?.order_number}, Subtotal: ₹${createdOrderA?.subtotal_amount}, Discount: ₹${createdOrderA?.discount_amount}, Total: ₹${createdOrderA?.total_amount}`
    );

    // Test 9: Atomically incremented used_count in PostgreSQL
    const couponCountCheck = await query('SELECT used_count FROM public.coupons WHERE id = $1', [
      coupon20Id,
    ]);
    logResult(
      9,
      'PostgreSQL confirms coupon used_count incremented from 0 to 1 upon checkout',
      couponCountCheck.rows[0]?.used_count === 1,
      `DB used_count: ${couponCountCheck.rows[0]?.used_count}`
    );

    // Test 10: Admin lists all coupons
    const listCoupRes = await sendRequest(
      'GET',
      '/api/v1/coupons/admin/all',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      10,
      'GET /api/v1/coupons/admin/all returns 200 OK with coupons list',
      listCoupRes.status === 200 &&
        listCoupRes.data?.data?.coupons?.length >= 3,
      `Total Coupons: ${listCoupRes.data?.data?.pagination?.total}`
    );

    // Test 11: Admin updates coupon
    const updateCoupRes = await sendRequest(
      'PUT',
      `/api/v1/coupons/admin/${couponFixedId}`,
      { discount_value: 60, min_order_amount: 200 },
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      11,
      'PUT /api/v1/coupons/admin/:id updates coupon values successfully (200 OK)',
      updateCoupRes.status === 200 && updateCoupRes.data?.data?.coupon?.discount_value === 60,
      `Updated Discount: ₹${updateCoupRes.data?.data?.coupon?.discount_value}`
    );

    // Test 12: Admin deletes coupon
    const tempCoupRes = await sendRequest(
      'POST',
      '/api/v1/coupons/admin',
      { code: `TEMP_${uniqueSuffix}`, discount_type: 'fixed', discount_value: 10 },
      { Authorization: `Bearer ${adminToken}` }
    );
    couponTempId = tempCoupRes.data?.data?.coupon?.id;
    const deleteCoupRes = await sendRequest(
      'DELETE',
      `/api/v1/coupons/admin/${couponTempId}`,
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      12,
      'DELETE /api/v1/coupons/admin/:id deletes coupon successfully (200 OK)',
      deleteCoupRes.status === 200 && deleteCoupRes.data?.success === true,
      `Status: ${deleteCoupRes.status}`
    );

    // --------------------------------------------------------------------------
    // 2. PAYMENT VERIFICATION & TAX INVOICING
    // --------------------------------------------------------------------------
    console.log('\n--- 2. PAYMENT VERIFICATION & TAX INVOICING ---');

    // Create an unpaid COD/Card order for User B
    const addrBRes = await sendRequest(
      'POST',
      '/api/v1/addresses',
      {
        full_name: 'Samantha Hayes',
        phone: '+91 98765 55555',
        street_address: '500 Skyline Boulevard',
        city: 'Mumbai',
        state: 'Maharashtra',
        postal_code: '400001',
        country: 'India',
        is_default: true,
      },
      { Authorization: `Bearer ${userBToken}` }
    );
    const addrBId = addrBRes.data?.data?.id || addrBRes.data?.data?.address?.id;

    await sendRequest(
      'POST',
      '/api/v1/cart/items',
      { product_id: testProduct2.id, quantity: 2 },
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
    const orderBId = orderBRes.data?.data?.id;

    // Test 13: Payment verification by non-owner returns 403 Forbidden
    const unauthPay = await sendRequest(
      'POST',
      `/api/v1/orders/${orderBId}/payment`,
      { payment_method: 'upi', payment_reference_id: 'UPI-REF-999' },
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      13,
      'POST /api/v1/orders/:id/payment by non-owner returns 403 Forbidden',
      unauthPay.status === 403,
      `Status: ${unauthPay.status}`
    );

    // Test 14: Customer verifies payment -> updates status to paid and confirmed
    const payVerifyRes = await sendRequest(
      'POST',
      `/api/v1/orders/${orderBId}/payment`,
      {
        payment_method: 'upi',
        payment_reference_id: `UPI-TXN-${uniqueSuffix}`,
      },
      { Authorization: `Bearer ${userBToken}` }
    );
    logResult(
      14,
      'POST /api/v1/orders/:id/payment records payment reference and updates order to confirmed (200 OK)',
      payVerifyRes.status === 200 &&
        payVerifyRes.data?.data?.order?.payment_status === 'paid' &&
        payVerifyRes.data?.data?.order?.order_status === 'confirmed' &&
        payVerifyRes.data?.data?.order?.payment_reference_id.includes('UPI-TXN'),
      `Status: ${payVerifyRes.status}, Payment Status: ${payVerifyRes.data?.data?.order?.payment_status}, Order Status: ${payVerifyRes.data?.data?.order?.order_status}`
    );

    // Test 15: Tax invoice generation without token (401)
    const noAuthInv = await sendRequest('GET', `/api/v1/orders/${orderBId}/invoice`);
    logResult(
      15,
      'GET /api/v1/orders/:id/invoice without token returns 401 Unauthorized',
      noAuthInv.status === 401,
      `Status: ${noAuthInv.status}`
    );

    // Test 16: Tax invoice generation by owner (200 OK)
    const invoiceRes = await sendRequest(
      'GET',
      `/api/v1/orders/${orderBId}/invoice`,
      null,
      { Authorization: `Bearer ${userBToken}` }
    );
    const invData = invoiceRes.data?.data?.invoice;
    logResult(
      16,
      'GET /api/v1/orders/:id/invoice returns structured commercial tax invoice with GST breakdown',
      invoiceRes.status === 200 &&
        invData?.invoice_number.startsWith('INV-') &&
        invData?.seller?.gstin !== undefined &&
        invData?.financial_breakdown?.tax_details?.cgst_amount !== undefined &&
        invData?.items?.length > 0,
      `Invoice #: ${invData?.invoice_number}, Seller: "${invData?.seller?.legal_name}", GSTIN: ${invData?.seller?.gstin}, Total: ₹${invData?.financial_breakdown?.total_amount}`
    );

    // --------------------------------------------------------------------------
    // 3. PUBLIC & CUSTOMER ORDER TRACKING TIMELINE
    // --------------------------------------------------------------------------
    console.log('\n--- 3. PUBLIC & CUSTOMER ORDER TRACKING TIMELINE ---');

    // Test 17: Public guest tracking by order number (200 OK with privacy masking)
    const publicTrackRes = await sendRequest(
      'GET',
      `/api/v1/orders/track/${createdOrderA.order_number}`
    );
    const trackData = publicTrackRes.data?.data;
    logResult(
      17,
      'GET /api/v1/orders/track/:orderNumber (Public) returns 200 OK with privacy-masked customer data',
      publicTrackRes.status === 200 &&
        trackData?.order_number === createdOrderA.order_number &&
        trackData?.delivery_destination?.recipient.includes('*') &&
        trackData?.delivery_destination?.contact.includes('****'),
      `Masked Recipient: "${trackData?.delivery_destination?.recipient}", Masked Contact: "${trackData?.delivery_destination?.contact}", City: "${trackData?.delivery_destination?.city}"`
    );

    // Test 18: Authenticated owner tracking exposes unmasked customer data
    const authTrackRes = await sendRequest(
      'GET',
      `/api/v1/orders/track/${createdOrderA.order_number}`,
      null,
      { Authorization: `Bearer ${userAToken}` }
    );
    const authTrackData = authTrackRes.data?.data;
    logResult(
      18,
      'GET /api/v1/orders/track/:orderNumber (Owner Authenticated) returns unmasked customer name and phone',
      authTrackRes.status === 200 &&
        authTrackData?.delivery_destination?.recipient === 'Alex Rivera' &&
        authTrackData?.delivery_destination?.contact === '+91 98765 44444',
      `Unmasked Recipient: "${authTrackData?.delivery_destination?.recipient}", Contact: "${authTrackData?.delivery_destination?.contact}"`
    );

    // Test 19: Tracking includes 5-stage progress timeline
    logResult(
      19,
      'Order tracking timeline contains all 5 progressive fulfillment stages',
      Array.isArray(authTrackData?.timeline) &&
        authTrackData.timeline.length === 5 &&
        authTrackData.timeline[0].title === 'Order Placed' &&
        authTrackData.timeline[4].title === 'Delivered',
      `Stages Count: ${authTrackData?.timeline?.length}, Progress: ${authTrackData?.progress_percentage}%`
    );

    // Test 20: Non-existent order number tracking returns 404 Not Found
    const notFoundTrack = await sendRequest('GET', '/api/v1/orders/track/FB-NONEXISTENT-9999');
    logResult(
      20,
      'GET /api/v1/orders/track/:orderNumber with non-existent number returns 404 Not Found',
      notFoundTrack.status === 404,
      `Status: ${notFoundTrack.status}`
    );

    // --------------------------------------------------------------------------
    // 4. NEWSLETTER SUBSCRIPTIONS
    // --------------------------------------------------------------------------
    console.log('\n--- 4. NEWSLETTER SUBSCRIPTIONS ---');

    // Test 21: Public newsletter subscription (200 OK)
    const subRes = await sendRequest('POST', '/api/v1/newsletter/subscribe', {
      email: subscriberEmail,
      source: 'homepage_footer',
    });
    logResult(
      21,
      'POST /api/v1/newsletter/subscribe registers email subscriber successfully (200 OK)',
      subRes.status === 200 &&
        subRes.data?.data?.email === subscriberEmail &&
        subRes.data?.data?.is_active === true,
      `Email: ${subRes.data?.data?.email}, Active: ${subRes.data?.data?.is_active}`
    );

    // Test 22: Duplicate newsletter subscription is handled smoothly
    const dupSubRes = await sendRequest('POST', '/api/v1/newsletter/subscribe', {
      email: subscriberEmail,
      source: 'promo_modal',
    });
    logResult(
      22,
      'POST /api/v1/newsletter/subscribe with duplicate email handles idempotently without error',
      dupSubRes.status === 200 && dupSubRes.data?.success === true,
      `Status: ${dupSubRes.status}`
    );

    // Test 23: Public newsletter unsubscribe (200 OK)
    const unsubRes = await sendRequest('POST', '/api/v1/newsletter/unsubscribe', {
      email: subscriberEmail,
    });
    logResult(
      23,
      'POST /api/v1/newsletter/unsubscribe marks subscriber inactive (200 OK)',
      unsubRes.status === 200 && unsubRes.data?.data?.is_active === false,
      `Status: ${unsubRes.status}, Active: ${unsubRes.data?.data?.is_active}`
    );

    // Test 24: Customer accessing admin newsletter list returns 403 Forbidden
    const unauthSubList = await sendRequest(
      'GET',
      '/api/v1/newsletter/admin/subscribers',
      null,
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      24,
      'GET /api/v1/newsletter/admin/subscribers for non-admin returns 403 Forbidden',
      unauthSubList.status === 403,
      `Status: ${unauthSubList.status}`
    );

    // Test 25: Admin retrieves newsletter subscribers list
    const adminSubList = await sendRequest(
      'GET',
      '/api/v1/newsletter/admin/subscribers',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      25,
      'GET /api/v1/newsletter/admin/subscribers returns 200 OK for Admin',
      adminSubList.status === 200 && adminSubList.data?.data?.subscribers?.length >= 1,
      `Total Subscribers: ${adminSubList.data?.data?.pagination?.total}`
    );

    // --------------------------------------------------------------------------
    // 5. CUSTOMER SUPPORT & INQUIRY TICKETS
    // --------------------------------------------------------------------------
    console.log('\n--- 5. CUSTOMER SUPPORT & INQUIRY TICKETS ---');

    // Test 26: Public/Customer creates support inquiry ticket (201 Created)
    const createTickRes = await sendRequest(
      'POST',
      '/api/v1/support/contact',
      {
        name: 'Alex Rivera',
        email: userAEmail,
        subject: 'Nutrition advice regarding whey vs pea protein',
        category: 'nutrition',
        message: 'Could you please advise if your Almond Crunch bar contains dairy whey or plant protein isolate?',
      },
      { Authorization: `Bearer ${userAToken}` }
    );
    createdTicketA = createTickRes.data?.data?.ticket;
    logResult(
      26,
      'POST /api/v1/support/contact creates support ticket with generated tracking ID (201 Created)',
      createTickRes.status === 201 &&
        createdTicketA?.ticket_number.startsWith('TICK-') &&
        createdTicketA?.status === 'open' &&
        createdTicketA?.category === 'nutrition',
      `Ticket #: "${createdTicketA?.ticket_number}", Category: "${createdTicketA?.category}", Status: "${createdTicketA?.status}"`
    );

    // Test 27: Ticket creation with invalid email returns 400 Bad Request
    const invalidEmailTick = await sendRequest('POST', '/api/v1/support/contact', {
      name: 'Tester',
      email: 'not-an-email',
      subject: 'Test Subject',
      message: 'This is a test inquiry message',
    });
    logResult(
      27,
      'POST /api/v1/support/contact with invalid email format returns 400 Bad Request',
      invalidEmailTick.status === 400,
      `Status: ${invalidEmailTick.status}`
    );

    // Test 28: Customer retrieves own submitted support tickets (200 OK)
    const myTicketsRes = await sendRequest(
      'GET',
      '/api/v1/support/my-tickets',
      null,
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      28,
      'GET /api/v1/support/my-tickets returns authenticated customer ticket history (200 OK)',
      myTicketsRes.status === 200 && myTicketsRes.data?.data?.tickets?.length >= 1,
      `Customer Tickets Count: ${myTicketsRes.data?.data?.total}`
    );

    // Test 29: Customer accessing admin tickets returns 403 Forbidden
    const unauthTickets = await sendRequest(
      'GET',
      '/api/v1/support/admin/tickets',
      null,
      { Authorization: `Bearer ${userAToken}` }
    );
    logResult(
      29,
      'GET /api/v1/support/admin/tickets for non-admin returns 403 Forbidden',
      unauthTickets.status === 403,
      `Status: ${unauthTickets.status}`
    );

    // Test 30: Admin retrieves all support tickets
    const adminTicketsRes = await sendRequest(
      'GET',
      '/api/v1/support/admin/tickets',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      30,
      'GET /api/v1/support/admin/tickets returns 200 OK for store administrators',
      adminTicketsRes.status === 200 && adminTicketsRes.data?.data?.tickets?.length >= 1,
      `Total Store Tickets: ${adminTicketsRes.data?.data?.pagination?.total}`
    );

    // Test 31: Admin updates ticket status and resolution notes (200 OK)
    const updateTickRes = await sendRequest(
      'PATCH',
      `/api/v1/support/admin/tickets/${createdTicketA.id}`,
      {
        status: 'resolved',
        admin_notes: 'Replied to customer with detailed allergen sheet and whey isolate specifications.',
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    logResult(
      31,
      'PATCH /api/v1/support/admin/tickets/:id resolves ticket with admin notes (200 OK)',
      updateTickRes.status === 200 &&
        updateTickRes.data?.data?.ticket?.status === 'resolved' &&
        updateTickRes.data?.data?.ticket?.admin_notes.includes('allergen sheet'),
      `Updated Status: "${updateTickRes.data?.data?.ticket?.status}", Notes: "${updateTickRes.data?.data?.ticket?.admin_notes}"`
    );

    // --------------------------------------------------------------------------
    // 6. SECURITY & RATE LIMITING HEADERS
    // --------------------------------------------------------------------------
    console.log('\n--- 6. SECURITY & RATE LIMITING HEADERS ---');

    // Test 32: Rate limiting headers attached on auth requests
    const authHeadersProbe = await sendRequest('POST', '/api/v1/auth/login', {
      email: adminEmail,
      password: testPassword,
    });
    logResult(
      32,
      'Authentication endpoint provides rate limit headers (X-RateLimit-Limit, Remaining, Reset)',
      authHeadersProbe.status === 200 && authHeadersProbe.headers.get('x-ratelimit-limit') !== null,
      `Limit: ${authHeadersProbe.headers.get('x-ratelimit-limit')}, Remaining: ${authHeadersProbe.headers.get('x-ratelimit-remaining')}`
    );

    // Test 33: Security HTTP headers verified (Helmet)
    logResult(
      33,
      'API responds with standard security headers (X-DNS-Prefetch-Control, X-Content-Type-Options)',
      authHeadersProbe.headers.get('x-content-type-options') === 'nosniff',
      `X-Content-Type-Options: ${authHeadersProbe.headers.get('x-content-type-options')}`
    );

    // --------------------------------------------------------------------------
    // 7. DIRECT DATABASE INTEGRITY & CLEANUP
    // --------------------------------------------------------------------------
    console.log('\n--- 7. DIRECT DATABASE INTEGRITY & CLEANUP ---');

    // Test 34: Direct PostgreSQL verification for coupons
    const dbCouponCheck = await query('SELECT code, discount_value, used_count FROM public.coupons WHERE id = $1', [
      coupon20Id,
    ]);
    logResult(
      34,
      'Direct PostgreSQL query confirms coupon records and usage counters persisted correctly',
      dbCouponCheck.rows.length === 1 && dbCouponCheck.rows[0].used_count === 1,
      `DB Code: "${dbCouponCheck.rows[0]?.code}", Used Count: ${dbCouponCheck.rows[0]?.used_count}`
    );

    // Test 35: Direct PostgreSQL verification for newsletter subscribers
    const dbSubCheck = await query('SELECT email, is_active FROM public.newsletter_subscribers WHERE email = $1', [
      subscriberEmail,
    ]);
    logResult(
      35,
      'Direct PostgreSQL query confirms newsletter subscription record persisted correctly',
      dbSubCheck.rows.length === 1 && dbSubCheck.rows[0].is_active === false,
      `DB Email: "${dbSubCheck.rows[0]?.email}", Active: ${dbSubCheck.rows[0]?.is_active}`
    );

    // Test 36: Direct PostgreSQL verification for support tickets
    const dbTicketCheck = await query('SELECT ticket_number, status FROM public.support_tickets WHERE id = $1', [
      createdTicketA.id,
    ]);
    logResult(
      36,
      'Direct PostgreSQL query confirms support ticket record and resolved status persisted correctly',
      dbTicketCheck.rows.length === 1 && dbTicketCheck.rows[0].status === 'resolved',
      `DB Ticket #: "${dbTicketCheck.rows[0]?.ticket_number}", Status: "${dbTicketCheck.rows[0]?.status}"`
    );

    // --------------------------------------------------------------------------
    // Cleanup temporary test data
    // --------------------------------------------------------------------------
    console.log('\n--- 37. Cleaning up temporary Phase 3G test records ---');
    await query('DELETE FROM public.support_tickets WHERE user_id IN ($1, $2, $3) OR email = $4', [
      userAId,
      userBId,
      adminId,
      userAEmail,
    ]);
    await query('DELETE FROM public.newsletter_subscribers WHERE email = $1', [subscriberEmail]);
    await query('DELETE FROM public.coupons WHERE id IN ($1, $2, $3)', [
      coupon20Id,
      couponFixedId,
      couponTempId,
    ]);
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
    await query('DELETE FROM public.products WHERE category_id = $1', [testCategory.id]);
    await query('DELETE FROM public.categories WHERE id = $1', [testCategory.id]);
    await query('DELETE FROM public.users WHERE id IN ($1, $2, $3)', [
      userAId,
      userBId,
      adminId,
    ]);

    logResult(
      37,
      'Temporary test records cleaned up completely from PostgreSQL',
      true,
      'Cleaned up test users, orders, coupons, newsletter subscribers, and support tickets'
    );
  } catch (error) {
    console.error('Unhandled Exception in Phase 3G test suite:', error);
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

runPhase3GVerification().then(() => {
  pool.end();
});
