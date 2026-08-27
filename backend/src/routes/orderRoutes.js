const express = require('express');
const orderController = require('../controllers/orderController');
const {
  validate,
  validateQuery,
  createOrderSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
} = require('../validators/orderValidator');
const { validateUUID } = require('../validators/paramValidator');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce authentication for all order routes
router.use(authenticateToken);

// ============================================================================
// ADMIN ORDER MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/orders/admin/all
 * @desc    Get all store orders with search and multi-parameter filters
 * @access  Private (Admin Only)
 */
router.get(
  '/admin/all',
  requireAdmin,
  validateQuery(orderQuerySchema),
  orderController.getAdminOrders
);

/**
 * @route   PATCH /api/v1/orders/admin/:id/status
 * @desc    Update order lifecycle status or payment status
 * @access  Private (Admin Only)
 */
router.patch(
  '/admin/:id/status',
  requireAdmin,
  validateUUID('id'),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

// ============================================================================
// CUSTOMER ORDER & CHECKOUT ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/orders
 * @desc    Place order from customer's shopping cart (Checkout)
 * @access  Private
 */
router.post('/', validate(createOrderSchema), orderController.checkout);

/**
 * @route   GET /api/v1/orders
 * @desc    Get paginated order history for current customer
 * @access  Private
 */
router.get('/', validateQuery(orderQuerySchema), orderController.getMyOrders);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get order details by UUID or order_number
 * @access  Private (Owner or Admin)
 */
router.get('/:id', orderController.getOrderDetails);

/**
 * @route   POST /api/v1/orders/:id/cancel
 * @desc    Cancel a pending customer order and restore inventory
 * @access  Private (Owner or Admin)
 */
router.post('/:id/cancel', orderController.cancelMyOrder);

module.exports = router;
