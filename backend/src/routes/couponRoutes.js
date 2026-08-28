const express = require('express');
const couponController = require('../controllers/couponController');
const {
  validate,
  validateQuery,
  validateCouponSchema,
  createCouponSchema,
  updateCouponSchema,
  couponQuerySchema,
} = require('../validators/couponValidator');
const { validateUUID } = require('../validators/paramValidator');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/v1/coupons/validate
 * @desc    Validate coupon code against user's cart and calculate savings
 * @access  Private (Authenticated Customer)
 */
router.post(
  '/validate',
  authenticateToken,
  validate(validateCouponSchema),
  couponController.validateCoupon
);

// ============================================================================
// ADMIN COUPON MANAGEMENT ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/coupons/admin/all
 * @desc    List all coupons with usage statistics
 * @access  Private (Admin Only)
 */
router.get(
  '/admin/all',
  authenticateToken,
  requireAdmin,
  validateQuery(couponQuerySchema),
  couponController.getCoupons
);

/**
 * @route   POST /api/v1/coupons/admin
 * @desc    Create a new promotional coupon
 * @access  Private (Admin Only)
 */
router.post(
  '/admin',
  authenticateToken,
  requireAdmin,
  validate(createCouponSchema),
  couponController.createCoupon
);

/**
 * @route   PUT /api/v1/coupons/admin/:id
 * @desc    Update an existing coupon
 * @access  Private (Admin Only)
 */
router.put(
  '/admin/:id',
  authenticateToken,
  requireAdmin,
  validateUUID('id'),
  validate(updateCouponSchema),
  couponController.updateCoupon
);

/**
 * @route   DELETE /api/v1/coupons/admin/:id
 * @desc    Delete a coupon
 * @access  Private (Admin Only)
 */
router.delete(
  '/admin/:id',
  authenticateToken,
  requireAdmin,
  validateUUID('id'),
  couponController.deleteCoupon
);

module.exports = router;
