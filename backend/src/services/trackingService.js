const { query } = require('../config/database');

/**
 * Service managing live order tracking timelines, milestone progression,
 * and privacy masking for public guest lookups.
 */

/**
 * Masks a full name for public privacy protection.
 * e.g. "Sarah Jenkins" -> "S**** J******"
 */
const maskName = (name) => {
  if (!name) return 'Customer';
  return name
    .split(' ')
    .map((part) => (part.length <= 1 ? part : `${part[0]}${'*'.repeat(Math.max(2, part.length - 1))}`))
    .join(' ');
};

/**
 * Masks a telephone number for public privacy protection.
 * e.g. "+91 98765 43210" -> "+91 98765 ****0"
 */
const maskPhone = (phone) => {
  if (!phone || phone.length < 5) return 'N/A';
  const visiblePrefix = phone.slice(0, Math.max(3, phone.length - 4));
  const visibleSuffix = phone.slice(-1);
  return `${visiblePrefix}****${visibleSuffix}`;
};

/**
 * Retrieves the tracking status and chronological milestone timeline for an order.
 *
 * @param {string} orderNumber - Canonical order number (e.g. 'FB-20260828-A101')
 * @param {Object|null} currentUser - Authenticated user context { id, role } or null
 * @returns {Promise<Object>} Tracking details and milestone progress
 */
const getTrackingTimeline = async (orderNumber, currentUser = null) => {
  const normalizedNumber = orderNumber.trim().toUpperCase();

  // 1. Fetch order
  const orderResult = await query(
    `SELECT id, order_number, user_id, shipping_address_snapshot,
            subtotal_amount::float, shipping_fee::float, discount_amount::float, total_amount::float,
            order_status, payment_status, payment_method, payment_reference_id,
            delivery_notes, created_at, updated_at
     FROM public.orders
     WHERE UPPER(order_number) = $1`,
    [normalizedNumber]
  );

  if (orderResult.rows.length === 0) {
    const err = new Error(`Order '${normalizedNumber}' not found. Please verify your order number.`);
    err.statusCode = 404;
    throw err;
  }

  const order = orderResult.rows[0];

  // 2. Fetch line items
  const itemsResult = await query(
    `SELECT id, product_id, product_name_snapshot, product_flavor_snapshot,
            product_image_snapshot, unit_price_snapshot::float, quantity, total_price::float
     FROM public.order_items
     WHERE order_id = $1`,
    [order.id]
  );

  // 3. Privacy check: Determine if viewer is authorized owner or admin
  const isAuthorizedViewer =
    currentUser && (currentUser.id === order.user_id || currentUser.role === 'admin');

  const address = order.shipping_address_snapshot || {};
  const recipientName = isAuthorizedViewer ? address.full_name : maskName(address.full_name);
  const contactPhone = isAuthorizedViewer ? address.phone : maskPhone(address.phone);

  // 4. Compute 5-stage chronological timeline
  const isCancelled = order.order_status === 'cancelled';
  const status = order.order_status;

  const isConfirmed = status !== 'pending' && !isCancelled;
  const isPacked = ['packed', 'shipped', 'delivered'].includes(status) && !isCancelled;
  const isShipped = ['shipped', 'delivered'].includes(status) && !isCancelled;
  const isDelivered = status === 'delivered';

  let currentStageIndex = 1;
  let progressPercentage = 20;

  if (isCancelled) {
    currentStageIndex = 0;
    progressPercentage = 0;
  } else if (isDelivered) {
    currentStageIndex = 5;
    progressPercentage = 100;
  } else if (isShipped) {
    currentStageIndex = 4;
    progressPercentage = 80;
  } else if (isPacked) {
    currentStageIndex = 3;
    progressPercentage = 60;
  } else if (isConfirmed) {
    currentStageIndex = 2;
    progressPercentage = 40;
  }

  const timeline = [
    {
      stage: 1,
      title: 'Order Placed',
      description: 'Your order has been successfully placed and received by our fulfillment system.',
      completed: true,
      current: currentStageIndex === 1,
      timestamp: order.created_at,
    },
    {
      stage: 2,
      title: 'Order Confirmed',
      description:
        order.payment_method === 'cod'
          ? 'COD verification confirmed. Order approved for packing.'
          : 'Payment verified and order approved for fulfillment.',
      completed: isConfirmed,
      current: currentStageIndex === 2,
      timestamp: isConfirmed ? order.updated_at : null,
    },
    {
      stage: 3,
      title: 'Packed & Quality Checked',
      description: 'Fresh protein bars packaged in climate-controlled protective casing.',
      completed: isPacked,
      current: currentStageIndex === 3,
      timestamp: isPacked ? order.updated_at : null,
    },
    {
      stage: 4,
      title: 'Shipped & In Transit',
      description: 'Handed over to our express courier partner. Tracking updates in transit.',
      completed: isShipped,
      current: currentStageIndex === 4,
      timestamp: isShipped ? order.updated_at : null,
    },
    {
      stage: 5,
      title: 'Delivered',
      description: 'Package safely delivered to your doorstep. Enjoy your FitBite protein!',
      completed: isDelivered,
      current: currentStageIndex === 5,
      timestamp: isDelivered ? order.updated_at : null,
    },
  ];

  // Estimated delivery date: 3 business days from creation
  const estimatedDelivery = new Date(
    new Date(order.created_at).getTime() + 3 * 24 * 60 * 60 * 1000
  ).toISOString();

  return {
    order_number: order.order_number,
    order_status: order.order_status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    is_cancelled: isCancelled,
    cancellation_reason: isCancelled ? 'Order was cancelled and inventory restored.' : null,
    progress_percentage: progressPercentage,
    current_stage_index: currentStageIndex,
    estimated_delivery_date: estimatedDelivery,
    delivery_destination: {
      recipient: recipientName,
      contact: contactPhone,
      city: address.city || 'India',
      state: address.state || 'India',
      postal_code: address.postal_code || '',
    },
    timeline,
    items_summary: itemsResult.rows.map((item) => ({
      product_name: item.product_name_snapshot,
      flavor: item.product_flavor_snapshot,
      image_url: item.product_image_snapshot,
      quantity: item.quantity,
      unit_price: item.unit_price_snapshot,
      total_price: item.total_price,
    })),
    total_amount: Number(order.total_amount),
    total_items_count: itemsResult.rows.reduce((sum, i) => sum + i.quantity, 0),
  };
};

module.exports = {
  getTrackingTimeline,
  maskName,
  maskPhone,
};
