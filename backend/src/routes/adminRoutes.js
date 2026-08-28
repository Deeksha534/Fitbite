const express = require('express');
const adminController = require('../controllers/adminController');
const {
  validateQuery,
  adminCustomerQuerySchema,
} = require('../validators/adminValidator');
const { validateUUID } = require('../validators/paramValidator');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce authentication and administrator role for all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route   GET /api/v1/admin/dashboard/stats
 * @desc    Get store financial overview, order breakdown, inventory health, and customer metrics
 * @access  Private (Admin Only)
 */
router.get('/dashboard/stats', adminController.getDashboardStats);

/**
 * @route   GET /api/v1/admin/customers
 * @desc    Get paginated directory of registered customers with lifetime spend
 * @access  Private (Admin Only)
 */
router.get(
  '/customers',
  validateQuery(adminCustomerQuerySchema),
  adminController.getCustomers
);

/**
 * @route   GET /api/v1/admin/customers/:id
 * @desc    Get detailed customer profile, addresses, and order history
 * @access  Private (Admin Only)
 */
router.get('/customers/:id', validateUUID('id'), adminController.getCustomerById);

module.exports = router;
