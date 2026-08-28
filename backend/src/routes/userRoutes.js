const express = require('express');
const userController = require('../controllers/userController');
const {
  validate,
  updateProfileSchema,
  changePasswordSchema,
} = require('../validators/userValidator');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce authentication for all user management routes
router.use(authenticateToken);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user's profile information
 * @access  Private (Authenticated)
 */
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

/**
 * @route   PUT /api/v1/users/password
 * @desc    Change account password
 * @access  Private (Authenticated)
 */
router.put('/password', validate(changePasswordSchema), userController.changePassword);

/**
 * @route   GET /api/v1/users/summary
 * @desc    Get customer account summary metrics (orders, cart, wishlist, addresses)
 * @access  Private (Authenticated)
 */
router.get('/summary', userController.getSummary);

module.exports = router;
