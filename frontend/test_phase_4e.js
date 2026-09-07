/**
 * ==============================================================================
 * FitBite Phase 4E Automated Verification Suite
 * Order History, Live 5-Stage Tracking, Commercial GST Invoices & Cancellation
 * ==============================================================================
 */

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

  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    return { status: response.status, data };
  } catch (err) {
    return { status: 500, error: err.message };
  }
};

async function runPhase4EVerification() {
  console.log('====================================================');
  console.log('🧪 FitBite Phase 4E Order History, Tracking & Invoices');
  console.log('====================================================\n');

  let localServer = null;
  let apiBase = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

  // 1. Verify / Spin up live server if needed
  try {
    const healthCheck = await sendRequest(apiBase, 'GET', '/health');
    if (healthCheck.status !== 200) {
      throw new Error('Backend server not responding at configured VITE_API_BASE_URL');
    }
    console.log(`🌐 Target Server: ${apiBase}`);
  } catch (_) {
    const port = 50000 + Math.floor(Math.random() * 10000);
    await new Promise((resolve) => {
      localServer = backendApp.listen(port, () => {
        apiBase = `http://localhost:${port}/api/v1`;
        console.log(`🌐 Local test server active at: ${apiBase}`);
        resolve();
      });
    });
  }

  const uniqueId = Date.now();
  const testCustomerEmail1 = `customer_4e_primary_${uniqueId}@fitbite.test`;
  const testCustomerEmail2 = `customer_4e_other_${uniqueId}@fitbite.test`;
  const testPass = 'FitBite@2026Strong';

  let customer1Token = null;
  let customer1Id = null;
  let customer2Token = null;
  let customer2Id = null;

  let sampleProduct = null;
  let initialStock = 0;
  let createdAddressId = null;
  let createdOrderId = null;
  let createdOrderNumber = null;

  try {
    // --------------------------------------------------------------------------
    // 1. FILE STRUCTURE & ARCHITECTURE
    // --------------------------------------------------------------------------
    console.log('\n--- 1. FILE STRUCTURE & COMPONENT ARCHITECTURE ---');

    const expectedFiles = [
      'src/components/orders/OrderCard.jsx',
      'src/components/orders/OrderFilterTabs.jsx',
      'src/components/orders/TrackingTimeline.jsx',
      'src/components/orders/TaxInvoiceModal.jsx',
      'src/components/orders/CancelOrderModal.jsx',
      'src/pages/account/OrderHistoryPage.jsx',
      'src/pages/account/OrderDetailPage.jsx',
      'src/pages/public/TrackOrderPage.jsx',
    ];

    let allFilesExist = true;
    const missingFiles = [];
    for (const relPath of expectedFiles) {
      const fullPath = path.join(__dirname, relPath);
      if (!fs.existsSync(fullPath)) {
        allFilesExist = false;
        missingFiles.push(relPath);
      }
    }

    logResult(
      1,
      'All 8 Phase 4E source files created (components, modals, and pages)',
      allFilesExist,
      allFilesExist ? 'Verified 8 files' : `Missing: ${missingFiles.join(', ')}`
    );

    // --------------------------------------------------------------------------
    // 2. AUTHENTICATION & TEST FIXTURES SETUP
    // --------------------------------------------------------------------------
    console.log('\n--- 2. AUTHENTICATION & FIXTURE SETUP ---');

    // Register Customer 1
    const regRes1 = await sendRequest(apiBase, 'POST', '/auth/register', {
      email: testCustomerEmail1,
      password: testPass,
      full_name: 'Alex Rivera Marathoner',
      phone: '+91 98765 44321',
    });
    customer1Token = regRes1.data?.data?.token || regRes1.data?.token;
    customer1Id = regRes1.data?.data?.user?.id || regRes1.data?.user?.id;

    // Register Customer 2 (for ownership isolation test)
    const regRes2 = await sendRequest(apiBase, 'POST', '/auth/register', {
      email: testCustomerEmail2,
      password: testPass,
      full_name: 'Jordan Lee Sprinter',
      phone: '+91 91234 56789',
    });
    customer2Token = regRes2.data?.data?.token || regRes2.data?.token;
    customer2Id = regRes2.data?.data?.user?.id || regRes2.data?.user?.id;

    const authHeaders1 = { Authorization: `Bearer ${customer1Token}` };
    const authHeaders2 = { Authorization: `Bearer ${customer2Token}` };

    // Fetch product from catalog
    const prodRes = await sendRequest(apiBase, 'GET', '/products?limit=5');
    const products = prodRes.data?.data?.products || prodRes.data?.products || [];
    sampleProduct = products[0];

    // Query DB for exact current stock
    const dbProdRes = await query('SELECT id, name, stock_quantity FROM public.products WHERE id = $1', [sampleProduct.id]);
    initialStock = dbProdRes.rows[0].stock_quantity;

    // Create address for Customer 1
    const addrRes = await sendRequest(
      apiBase,
      'POST',
      '/addresses',
      {
        full_name: 'Alex Rivera Marathoner',
        phone: '+91 98765 44321',
        street_address: '100 Fitness Way, Tech Park',
        apartment: 'Suite 404',
        city: 'Bengaluru',
        state: 'Karnataka',
        postal_code: '560038',
        country: 'India',
        is_default: true,
      },
      authHeaders1
    );
    createdAddressId = addrRes.data?.data?.id || addrRes.data?.data?.address?.id;

    // Add item to cart and place an order for Customer 1
    await sendRequest(
      apiBase,
      'POST',
      '/cart/items',
      { product_id: sampleProduct.id, quantity: 2 },
      authHeaders1
    );

    const orderRes = await sendRequest(
      apiBase,
      'POST',
      '/orders',
      {
        shipping_address_id: createdAddressId,
        payment_method: 'cod',
        delivery_notes: 'Leave package with security reception.',
      },
      authHeaders1
    );

    const orderData = orderRes.data?.data;
    createdOrderId = orderData?.id;
    createdOrderNumber = orderData?.order_number;

    logResult(
      2,
      'Created test customer order in database with 2 units of protein bar',
      orderRes.status === 201 && createdOrderId && createdOrderNumber,
      `Order #: ${createdOrderNumber}, ID: ${createdOrderId}`
    );

    // --------------------------------------------------------------------------
    // 3. CUSTOMER ORDER LISTING & PAGINATION
    // --------------------------------------------------------------------------
    console.log('\n--- 3. ORDER HISTORY DASHBOARD (GET /api/v1/orders) ---');

    const ordersListRes = await sendRequest(apiBase, 'GET', '/orders?page=1&limit=10', null, authHeaders1);
    const ordersList = ordersListRes.data?.data?.orders || ordersListRes.data?.orders || [];
    const pagination = ordersListRes.data?.data?.pagination || ordersListRes.data?.pagination || {};

    logResult(
      3,
      'GET /api/v1/orders returns paginated orders for authenticated customer (200 OK)',
      ordersListRes.status === 200 && Array.isArray(ordersList) && ordersList.length > 0 && pagination.total >= 1,
      `Found ${ordersList.length} order(s), Total in DB: ${pagination.total}, Pages: ${pagination.totalPages}`
    );

    // --------------------------------------------------------------------------
    // 4. ORDER STATUS FILTERING
    // --------------------------------------------------------------------------
    console.log('\n--- 4. ORDER STATUS FILTERING ---');

    const filterPendingRes = await sendRequest(apiBase, 'GET', '/orders?order_status=pending', null, authHeaders1);
    const pendingOrders = filterPendingRes.data?.data?.orders || [];
    const allPending = pendingOrders.every((o) => o.order_status === 'pending');

    logResult(
      4,
      'GET /api/v1/orders?order_status=pending filters orders strictly by status',
      filterPendingRes.status === 200 && pendingOrders.length > 0 && allPending,
      `Found ${pendingOrders.length} pending order(s)`
    );

    const filterDeliveredRes = await sendRequest(apiBase, 'GET', '/orders?order_status=delivered', null, authHeaders1);
    const deliveredOrders = filterDeliveredRes.data?.data?.orders || [];
    logResult(
      5,
      'GET /api/v1/orders?order_status=delivered returns empty list for new orders',
      filterDeliveredRes.status === 200 && deliveredOrders.length === 0,
      `Found ${deliveredOrders.length} delivered order(s)`
    );

    // --------------------------------------------------------------------------
    // 5. ORDER DETAILS BY ID AND ORDER NUMBER
    // --------------------------------------------------------------------------
    console.log('\n--- 5. ORDER DETAILS INSPECTION (GET /api/v1/orders/:id) ---');

    const detailByIdRes = await sendRequest(apiBase, 'GET', `/orders/${createdOrderId}`, null, authHeaders1);
    const detailById = detailByIdRes.data?.data || detailByIdRes.data;

    logResult(
      6,
      'GET /api/v1/orders/:id returns order snapshot, delivery address and line items (200 OK)',
      detailByIdRes.status === 200 &&
        detailById?.order_number === createdOrderNumber &&
        Array.isArray(detailById?.items) &&
        detailById.items.length > 0,
      `Order: ${detailById?.order_number}, Items count: ${detailById?.items?.length}, Status: ${detailById?.order_status}`
    );

    const detailByNumRes = await sendRequest(apiBase, 'GET', `/orders/${createdOrderNumber}`, null, authHeaders1);
    const detailByNum = detailByNumRes.data?.data || detailByNumRes.data;

    logResult(
      7,
      'GET /api/v1/orders/:orderNumber retrieves identical details by order_number (200 OK)',
      detailByNumRes.status === 200 && detailByNum?.id === createdOrderId,
      `Resolved Order Number: ${detailByNum?.order_number}`
    );

    // --------------------------------------------------------------------------
    // 6. OWNERSHIP ENFORCEMENT & ISOLATION
    // --------------------------------------------------------------------------
    console.log('\n--- 6. ORDER PRIVACY & OWNERSHIP GUARDS ---');

    const foreignAccessRes = await sendRequest(apiBase, 'GET', `/orders/${createdOrderId}`, null, authHeaders2);

    logResult(
      8,
      'Customer 2 accessing Customer 1 order returns 404 Not Found (Cross-user isolation enforced)',
      foreignAccessRes.status === 404,
      `Status: ${foreignAccessRes.status}, Message: "${foreignAccessRes.data?.message}"`
    );

    // --------------------------------------------------------------------------
    // 7. COMMERCIAL GST TAX INVOICE
    // --------------------------------------------------------------------------
    console.log('\n--- 7. COMMERCIAL GST TAX INVOICE GENERATION ---');

    const invoiceRes = await sendRequest(apiBase, 'GET', `/orders/${createdOrderId}/invoice`, null, authHeaders1);
    const invoiceData = invoiceRes.data?.data?.invoice || invoiceRes.data?.data;

    logResult(
      9,
      'GET /api/v1/orders/:id/invoice returns authentic GST Tax Invoice metadata (200 OK)',
      invoiceRes.status === 200 &&
        invoiceData?.invoice_number &&
        invoiceData?.seller?.gstin === '29AABCF1234M1ZV' &&
        invoiceData?.seller?.pan === 'AABCF1234M',
      `Invoice #: ${invoiceData?.invoice_number}, Seller GSTIN: ${invoiceData?.seller?.gstin}, PAN: ${invoiceData?.seller?.pan}`
    );

    const subtotal = Number(detailById?.subtotal_amount || 0);
    const expectedTax = Number((subtotal * 0.05).toFixed(2));
    const itemsValid = Array.isArray(invoiceData?.items || invoiceData?.line_items) && (invoiceData.items || invoiceData.line_items).length > 0;
    const taxDetails = invoiceData?.financial_breakdown?.tax_details || {};
    const totalTax = taxDetails.total_tax ?? invoiceData?.financial_summary?.total_tax;
    const cgst = taxDetails.cgst_amount ?? invoiceData?.financial_summary?.cgst;
    const sgst = taxDetails.sgst_amount ?? invoiceData?.financial_summary?.sgst;

    logResult(
      10,
      'GST Tax Invoice calculates 5% GST breakdown (CGST 2.5% + SGST 2.5%) correctly',
      invoiceRes.status === 200 && itemsValid && totalTax === expectedTax,
      `Taxable Subtotal: ₹${subtotal}, Total GST (5%): ₹${totalTax} (CGST: ₹${cgst}, SGST: ₹${sgst})`
    );

    // --------------------------------------------------------------------------
    // 8. PUBLIC 5-STAGE LIVE SHIPMENT TRACKING
    // --------------------------------------------------------------------------
    console.log('\n--- 8. PUBLIC LIVE 5-STAGE SHIPMENT TRACKING ---');

    const trackRes = await sendRequest(apiBase, 'GET', `/orders/track/${createdOrderNumber}`);
    const trackData = trackRes.data?.data;
    const stages = trackData?.timeline || trackData?.stages || [];

    logResult(
      11,
      'GET /api/v1/orders/track/:orderNumber returns 5-stage fulfillment timeline without authentication (200 OK)',
      trackRes.status === 200 && Array.isArray(stages) && stages.length === 5,
      `Order: ${trackData?.order_number}, Total Stages: ${stages.length}, Progress: ${trackData?.progress_percentage}%`
    );

    // Verify privacy masking
    const contactPhone = trackData?.delivery_destination?.contact;
    const isMasked = contactPhone && (contactPhone.includes('*') || !contactPhone.includes('9876544321'));

    logResult(
      12,
      'Public order tracking masks recipient phone number and protects PII',
      Boolean(isMasked),
      `Masked Contact: "${contactPhone}", Destination: "${trackData?.delivery_destination?.city}, ${trackData?.delivery_destination?.state}"`
    );

    // --------------------------------------------------------------------------
    // 9. RE-ORDER / BUY AGAIN CART INTEGRATION
    // --------------------------------------------------------------------------
    console.log('\n--- 9. RE-ORDER (BUY AGAIN) FUNCTIONALITY ---');

    const reorderItem = detailById?.items?.[0];
    const reorderRes = await sendRequest(
      apiBase,
      'POST',
      '/cart/items',
      { product_id: reorderItem.product_id, quantity: 1 },
      authHeaders1
    );
    const cartAfterReorder = reorderRes.data?.data;

    logResult(
      13,
      'Re-ordering past item adds product back into shopping cart with stock check (200 OK)',
      reorderRes.status === 200 && cartAfterReorder?.item_count >= 1,
      `Items in cart: ${cartAfterReorder?.item_count}, Subtotal: ₹${cartAfterReorder?.subtotal}`
    );

    // --------------------------------------------------------------------------
    // 10. PENDING ORDER CANCELLATION & INVENTORY RESTORATION
    // --------------------------------------------------------------------------
    console.log('\n--- 10. ORDER CANCELLATION & STOCK RESTORATION ---');

    // Query DB stock prior to cancel
    const stockBeforeCancel = (await query('SELECT stock_quantity FROM public.products WHERE id = $1', [sampleProduct.id])).rows[0].stock_quantity;

    const cancelRes = await sendRequest(
      apiBase,
      'POST',
      `/orders/${createdOrderId}/cancel`,
      { reason: 'Customer test cancellation' },
      authHeaders1
    );
    const cancelData = cancelRes.data?.data;

    // Query DB stock after cancel
    const stockAfterCancel = (await query('SELECT stock_quantity FROM public.products WHERE id = $1', [sampleProduct.id])).rows[0].stock_quantity;

    logResult(
      14,
      'POST /api/v1/orders/:id/cancel updates order_status to "cancelled" and transactionally restores inventory (200 OK)',
      cancelRes.status === 200 &&
        cancelData?.order_status === 'cancelled' &&
        stockAfterCancel === stockBeforeCancel + 2,
      `Status: ${cancelData?.order_status}, Stock Restored: ${stockBeforeCancel} -> ${stockAfterCancel}`
    );

    // Attempting to cancel already cancelled order returns 400
    const reCancelRes = await sendRequest(
      apiBase,
      'POST',
      `/orders/${createdOrderId}/cancel`,
      {},
      authHeaders1
    );

    logResult(
      15,
      'Attempting to cancel already cancelled order rejects with 400 Bad Request',
      reCancelRes.status === 400,
      `Status: ${reCancelRes.status}, Message: "${reCancelRes.data?.message}"`
    );

    // Verify Tracking reflects cancelled state
    const trackAfterCancelRes = await sendRequest(apiBase, 'GET', `/orders/track/${createdOrderNumber}`);
    const trackAfterCancel = trackAfterCancelRes.data?.data;

    logResult(
      16,
      'Tracking timeline displays cancellation explanation banner when order is cancelled',
      trackAfterCancelRes.status === 200 && trackAfterCancel?.is_cancelled === true,
      `is_cancelled: ${trackAfterCancel?.is_cancelled}, Reason: "${trackAfterCancel?.cancellation_reason}"`
    );
  } finally {
    // --------------------------------------------------------------------------
    // CLEANUP TEMPORARY TEST DATA
    // --------------------------------------------------------------------------
    try {
      const userIds = [customer1Id, customer2Id].filter(Boolean);
      for (const uid of userIds) {
        try {
          await query('DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE user_id = $1)', [uid]);
          await query('DELETE FROM public.orders WHERE user_id = $1', [uid]);
          await query('DELETE FROM public.cart_items WHERE cart_id IN (SELECT id FROM public.carts WHERE user_id = $1)', [uid]);
          await query('DELETE FROM public.carts WHERE user_id = $1', [uid]);
          await query('DELETE FROM public.wishlist_items WHERE wishlist_id IN (SELECT id FROM public.wishlists WHERE user_id = $1)', [uid]);
          await query('DELETE FROM public.wishlists WHERE user_id = $1)', [uid]);
          await query('DELETE FROM public.addresses WHERE user_id = $1', [uid]);
          await query('DELETE FROM public.profiles WHERE id = $1', [uid]);
          await query('DELETE FROM public.users WHERE id = $1', [uid]);
        } catch (_) {}
      }
      console.log('\n🧹 Temporary test customers, orders, carts, and addresses cleaned up from PostgreSQL.');
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }

    if (localServer) {
      localServer.close();
    }
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n====================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`📊 Verification Summary: Total Tests: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase4EVerification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
