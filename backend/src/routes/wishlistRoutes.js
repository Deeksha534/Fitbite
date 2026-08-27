const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const { validate, addToWishlistSchema } = require('../validators/wishlistValidator');
const { validateUUID } = require('../validators/paramValidator');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce authentication for all wishlist routes
router.use(authenticateToken);

/**
 * @route   GET /api/v1/wishlist
 * @desc    Get user's saved wishlist items
 * @access  Private
 */
router.get('/', wishlistController.getWishlist);

/**
 * @route   POST /api/v1/wishlist/items
 * @desc    Save product to wishlist
 * @access  Private
 */
router.post('/items', validate(addToWishlistSchema), wishlistController.addItem);

/**
 * @route   DELETE /api/v1/wishlist/items/:itemId
 * @desc    Remove item from wishlist
 * @access  Private
 */
router.delete('/items/:itemId', validateUUID('itemId'), wishlistController.removeItem);

/**
 * @route   POST /api/v1/wishlist/move-to-cart/:itemId
 * @desc    Atomically move wishlist item into user's shopping cart
 * @access  Private
 */
router.post('/move-to-cart/:itemId', validateUUID('itemId'), wishlistController.moveToCart);

module.exports = router;
