const { query } = require('../config/database');

/**
 * Service managing payment verification, transaction logging,
 * and structured tax invoice generation.
 */

/**
 * Verifies payment confirmation for an order and advances order status.
 *
 * @param {string} userId - User UUID
 * @param {string} userRole - User role ('customer' or 'admin')
 * @param {string} orderId - Order UUID
 * @param {Object} paymentData - { payment_method, payment_reference_id }
 * @returns {Promise<Object>} Updated order object
 */
const verifyPayment = async (userId, userRole, orderId, { payment_method, payment_reference_id }) => {
  // 1. Fetch order
  const orderResult = await query(
    `SELECT id, order_number, user_id, order_status, payment_status, payment_method,
            subtotal_amount::float, shipping_fee::float, discount_amount::float, total_amount::float,
            created_at, updated_at
     FROM public.orders
     WHERE id = $1`,
    [orderId]
  );

  if (orderResult.rows.length === 0) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  const order = orderResult.rows[0];

  // 2. Ownership enforcement
  if (order.user_id !== userId && userRole !== 'admin') {
    const err = new Error('Forbidden. You do not have permission to process payment for this order.');
    err.statusCode = 403;
    throw err;
  }

  // Check if order was cancelled
  if (order.order_status === 'cancelled') {
    const err = new Error('Cannot process payment for a cancelled order');
    err.statusCode = 400;
    throw err;
  }

  const resolvedPaymentMethod = payment_method || order.payment_method;
  const resolvedRefId =
    payment_reference_id && payment_reference_id.trim().length > 0
      ? payment_reference_id.trim()
      : `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrderStatus = order.order_status === 'pending' ? 'confirmed' : order.order_status;

  // 3. Update order payment status and reference ID
  const updateResult = await query(
    `UPDATE public.orders
     SET payment_status = 'paid',
         payment_method = $1,
         payment_reference_id = $2,
         order_status = $3,
         updated_at = NOW()
     WHERE id = $4
     RETURNING id, order_number, user_id, order_status, payment_status, payment_method,
               payment_reference_id, subtotal_amount::float, shipping_fee::float,
               discount_amount::float, total_amount::float, created_at, updated_at`,
    [resolvedPaymentMethod, resolvedRefId, newOrderStatus, orderId]
  );

  return updateResult.rows[0];
};

/**
 * Generates a structured commercial tax invoice for an order.
 *
 * @param {string} userId - User UUID
 * @param {string} userRole - User role ('customer' or 'admin')
 * @param {string} orderId - Order UUID
 * @returns {Promise<Object>} Formatted tax invoice document
 */
const generateInvoice = async (userId, userRole, orderId) => {
  // 1. Fetch order
  const orderResult = await query(
    `SELECT id, order_number, user_id, shipping_address_snapshot,
            subtotal_amount::float, shipping_fee::float, discount_amount::float, total_amount::float,
            order_status, payment_status, payment_method, payment_reference_id,
            delivery_notes, created_at, updated_at
     FROM public.orders
     WHERE id = $1`,
    [orderId]
  );

  if (orderResult.rows.length === 0) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }

  const order = orderResult.rows[0];

  // 2. Ownership enforcement
  if (order.user_id !== userId && userRole !== 'admin') {
    const err = new Error('Forbidden. You do not have permission to view invoice for this order.');
    err.statusCode = 403;
    throw err;
  }

  // 3. Fetch line items
  const itemsResult = await query(
    `SELECT id, product_id, product_name_snapshot, product_flavor_snapshot,
            product_image_snapshot, unit_price_snapshot::float, quantity, total_price::float
     FROM public.order_items
     WHERE order_id = $1`,
    [orderId]
  );

  const subtotal = Number(order.subtotal_amount);
  const taxRate = 0.05; // 5% GST included
  const cgst = Number(((subtotal * taxRate) / 2).toFixed(2));
  const sgst = Number(((subtotal * taxRate) / 2).toFixed(2));
  const totalTax = Number((cgst + sgst).toFixed(2));

  return {
    invoice: {
      invoice_number: `INV-${order.order_number.replace('FB-', '')}`,
      invoice_date: order.created_at,
      place_of_supply: 'Karnataka (29)',
      currency: 'INR',
      seller: {
        legal_name: 'FitBite Nutrition Labs Private Limited',
        brand_name: 'FitBite — Premium Protein & Fitness Nutrition',
        gstin: '29AABCF1234M1ZV',
        pan: 'AABCF1234M',
        registered_address: '100 Fitness Way, Indiranagar 100 Feet Road, Bengaluru, Karnataka 560038, India',
        contact_email: 'billing@fitbite.com',
        support_phone: '+91 80 4567 8900',
        website: 'https://fitbite.in',
      },
      order: {
        id: order.id,
        order_number: order.order_number,
        order_date: order.created_at,
        order_status: order.order_status,
        payment_status: order.payment_status,
        payment_method: order.payment_method.toUpperCase(),
        payment_reference_id: order.payment_reference_id || 'N/A',
      },
      customer: {
        recipient_name: order.shipping_address_snapshot?.full_name || 'Valued Customer',
        contact_phone: order.shipping_address_snapshot?.phone || 'N/A',
        shipping_address: {
          street: order.shipping_address_snapshot?.street_address,
          apartment: order.shipping_address_snapshot?.apartment || '',
          city: order.shipping_address_snapshot?.city,
          state: order.shipping_address_snapshot?.state,
          postal_code: order.shipping_address_snapshot?.postal_code,
          country: order.shipping_address_snapshot?.country || 'India',
        },
      },
      items: itemsResult.rows.map((item, idx) => ({
        item_number: idx + 1,
        product_name: item.product_name_snapshot,
        flavor: item.product_flavor_snapshot || 'Standard',
        hsn_code: '21069099', // Dietary food supplements / protein bars HSN
        unit_price: item.unit_price_snapshot,
        quantity: item.quantity,
        total_price: item.total_price,
      })),
      financial_breakdown: {
        subtotal_amount: subtotal,
        discount_amount: Number(order.discount_amount),
        shipping_fee: Number(order.shipping_fee),
        tax_details: {
          tax_rate: '5% GST Included',
          cgst_rate: '2.5%',
          cgst_amount: cgst,
          sgst_rate: '2.5%',
          sgst_amount: sgst,
          total_tax: totalTax,
        },
        total_amount: Number(order.total_amount),
      },
      footer_notes: 'This is a computer-generated commercial tax invoice for dietary nutrition products. No physical signature required.',
    },
  };
};

module.exports = {
  verifyPayment,
  generateInvoice,
};
