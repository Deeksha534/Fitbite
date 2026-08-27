const express = require('express');
const cartController = require('../controllers/cartController');
const { validate, addToCartSchema, updateCartItemSchema } = require('../validators/cartValidator');
const { validateUUID } = require('../validators/paramValidator');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce authentication for all cart routes
router.use(authenticateToken);

/**
 * @route   GET /api/v1/cart
 * @desc    Get user's cart with subtotals and stock indicators
 * @access  Private
 */
router.get('/', cartController.getCart);

/**
 * @route   POST /api/v1/cart/items
 * @desc    Add product to cart
 * @access  Private
 */
router.post('/items', validate(addToCartSchema), cartController.addItem);

/**
 * @route   PUT /api/v1/cart/items/:itemId
 * @desc    Update cart line item quantity
 * @access  Private
 */
router.put(
  '/items/:itemId',
  validateUUID('itemId'),
  validate(updateCartItemSchema),
  cartController.updateItem
);

/**
 * @route   DELETE /api/v1/cart/items/:itemId
 * @desc    Remove single line item from cart
 * @access  Private
 */
router.delete('/items/:itemId', validateUUID('itemId'), cartController.removeItem);

/**
 * @route   DELETE /api/v1/cart
 * @desc    Clear all items in cart
 * @access  Private
 */
router.delete('/', cartController.clearCart);

module.exports = router;
