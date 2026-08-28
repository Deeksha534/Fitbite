const { query } = require('../config/database');

/**
 * Service providing administrative intelligence, financial metrics,
 * inventory health, and customer directory analytics.
 */

/**
 * Retrieves comprehensive store dashboard statistics and performance metrics.
 *
 * @returns {Promise<Object>} Aggregated financial, order, inventory, and customer metrics
 */
const getDashboardStats = async () => {
  // 1. Financial & Order Metrics
  const orderStatsPromise = query(
    `SELECT 
       COUNT(*)::int AS total_orders,
       COALESCE(SUM(total_amount), 0)::float AS gross_revenue,
       COALESCE(SUM(total_amount) FILTER (WHERE order_status = 'delivered'), 0)::float AS completed_revenue,
       COALESCE(ROUND(AVG(total_amount), 2), 0)::float AS average_order_value,
       COUNT(*) FILTER (WHERE order_status = 'pending')::int AS pending_orders,
       COUNT(*) FILTER (WHERE order_status = 'processing')::int AS processing_orders,
       COUNT(*) FILTER (WHERE order_status = 'shipped')::int AS shipped_orders,
       COUNT(*) FILTER (WHERE order_status = 'delivered')::int AS delivered_orders,
       COUNT(*) FILTER (WHERE order_status = 'cancelled')::int AS cancelled_orders,
       COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS paid_orders,
       COUNT(*) FILTER (WHERE payment_status = 'unpaid')::int AS unpaid_orders
     FROM public.orders`
  );

  // 2. Catalog & Inventory Metrics
  const inventoryStatsPromise = query(
    `SELECT 
       COUNT(*)::int AS total_products,
       COUNT(*) FILTER (WHERE is_active = true)::int AS active_products,
       COUNT(*) FILTER (WHERE stock_quantity <= 10 AND is_active = true)::int AS low_stock_count,
       COUNT(*) FILTER (WHERE stock_quantity = 0 AND is_active = true)::int AS out_of_stock_count
     FROM public.products`
  );

  // 3. Low-Stock Alerts List
  const lowStockListPromise = query(
    `SELECT 
       id, 
       name, 
       slug, 
       price::float, 
       stock_quantity, 
       flavor
     FROM public.products
     WHERE stock_quantity <= 10 AND is_active = true
     ORDER BY stock_quantity ASC
     LIMIT 10`
  );

  // 4. Customer Directory Metrics
  const customerStatsPromise = query(
    `SELECT 
       COUNT(*)::int AS total_customers,
       COUNT(*) FILTER (WHERE is_active = true)::int AS active_customers,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS new_customers_30d
     FROM public.users
     WHERE role = 'customer'`
  );

  // 5. Recent 5 Store Orders
  const recentOrdersPromise = query(
    `SELECT 
       o.id,
       o.order_number,
       o.total_amount::float,
       o.order_status,
       o.payment_status,
       o.payment_method,
       o.created_at,
       COALESCE(p.full_name, 'Guest / Anonymous') AS customer_name,
       u.email AS customer_email
     FROM public.orders o
     JOIN public.users u ON o.user_id = u.id
     LEFT JOIN public.profiles p ON u.id = p.id
     ORDER BY o.created_at DESC
     LIMIT 5`
  );

  const [orderStatsRes, inventoryStatsRes, lowStockListRes, customerStatsRes, recentOrdersRes] =
    await Promise.all([
      orderStatsPromise,
      inventoryStatsPromise,
      lowStockListPromise,
      customerStatsPromise,
      recentOrdersPromise,
    ]);

  const orderStats = orderStatsRes.rows[0];
  const inventoryStats = inventoryStatsRes.rows[0];
  const customerStats = customerStatsRes.rows[0];

  return {
    financials: {
      gross_revenue: orderStats.gross_revenue,
      completed_revenue: orderStats.completed_revenue,
      average_order_value: orderStats.average_order_value,
    },
    orders: {
      total: orderStats.total_orders,
      by_status: {
        pending: orderStats.pending_orders,
        processing: orderStats.processing_orders,
        shipped: orderStats.shipped_orders,
        delivered: orderStats.delivered_orders,
        cancelled: orderStats.cancelled_orders,
      },
      by_payment: {
        paid: orderStats.paid_orders,
        unpaid: orderStats.unpaid_orders,
      },
    },
    inventory: {
      total_products: inventoryStats.total_products,
      active_products: inventoryStats.active_products,
      low_stock_count: inventoryStats.low_stock_count,
      out_of_stock_count: inventoryStats.out_of_stock_count,
      low_stock_alerts: lowStockListRes.rows,
    },
    customers: {
      total_registered: customerStats.total_customers,
      active_customers: customerStats.active_customers,
      new_in_last_30_days: customerStats.new_customers_30d,
    },
    recent_orders: recentOrdersRes.rows,
  };
};

/**
 * Retrieves a paginated directory of registered customers with lifetime spend metrics.
 *
 * @param {Object} options - { page, limit, search, sort }
 * @returns {Promise<Object>} Paginated customers list
 */
const getCustomers = async ({ page = 1, limit = 20, search = '', sort = 'created_at_desc' }) => {
  const whereConditions = ["u.role = 'customer'"];
  const queryParams = [];
  let paramIndex = 1;

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    whereConditions.push(
      `(u.email ILIKE $${paramIndex} OR p.full_name ILIKE $${paramIndex} OR p.phone ILIKE $${paramIndex})`
    );
    queryParams.push(term);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Count total matching customers
  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM public.users u
     LEFT JOIN public.profiles p ON u.id = p.id
     WHERE ${whereClause}`,
    queryParams
  );

  const total = countResult.rows[0].total;
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;

  // Sorting
  let orderByClause = 'u.created_at DESC';
  if (sort === 'created_at_asc') {
    orderByClause = 'u.created_at ASC';
  } else if (sort === 'spend_desc') {
    orderByClause = 'lifetime_spend DESC, u.created_at DESC';
  } else if (sort === 'orders_desc') {
    orderByClause = 'total_orders DESC, u.created_at DESC';
  } else if (sort === 'name_asc') {
    orderByClause = 'p.full_name ASC NULLS LAST, u.created_at DESC';
  }

  // Fetch customer list with aggregated order statistics
  const dataParams = [...queryParams, limit, offset];
  const customersResult = await query(
    `SELECT 
       u.id,
       u.email,
       u.is_active,
       u.created_at,
       p.full_name,
       p.phone,
       p.avatar_url,
       p.bio,
       COUNT(o.id)::int AS total_orders,
       COALESCE(SUM(o.total_amount) FILTER (WHERE o.order_status != 'cancelled'), 0)::float AS lifetime_spend,
       MAX(o.created_at) AS last_order_at
     FROM public.users u
     LEFT JOIN public.profiles p ON u.id = p.id
     LEFT JOIN public.orders o ON u.id = o.user_id
     WHERE ${whereClause}
     GROUP BY u.id, u.email, u.is_active, u.created_at, p.full_name, p.phone, p.avatar_url, p.bio
     ORDER BY ${orderByClause}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    dataParams
  );

  return {
    customers: customersResult.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      total_pages: totalPages,
      has_next_page: page < totalPages,
      has_prev_page: page > 1,
    },
  };
};

/**
 * Retrieves detailed customer information including addresses and orders.
 *
 * @param {string} customerId - User UUID
 * @returns {Promise<Object>} Customer detail profile
 */
const getCustomerById = async (customerId) => {
  const userResult = await query(
    `SELECT 
       u.id,
       u.email,
       u.role,
       u.is_active,
       u.created_at,
       u.updated_at,
       p.full_name,
       p.phone,
       p.avatar_url,
       p.bio
     FROM public.users u
     LEFT JOIN public.profiles p ON u.id = p.id
     WHERE u.id = $1`,
    [customerId]
  );

  if (userResult.rows.length === 0) {
    const err = new Error('Customer not found');
    err.statusCode = 404;
    throw err;
  }

  const customer = userResult.rows[0];

  // Fetch addresses and orders
  const [addressesRes, ordersRes, lifetimeRes] = await Promise.all([
    query('SELECT * FROM public.addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC', [customerId]),
    query(
      `SELECT id, order_number, total_amount::float, order_status, payment_status, payment_method, created_at
       FROM public.orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [customerId]
    ),
    query(
      `SELECT 
         COUNT(*)::int AS total_orders,
         COALESCE(SUM(total_amount) FILTER (WHERE order_status != 'cancelled'), 0)::float AS lifetime_spend
       FROM public.orders 
       WHERE user_id = $1`,
      [customerId]
    ),
  ]);

  return {
    customer,
    summary: lifetimeRes.rows[0],
    addresses: addressesRes.rows,
    recent_orders: ordersRes.rows,
  };
};

module.exports = {
  getDashboardStats,
  getCustomers,
  getCustomerById,
};
