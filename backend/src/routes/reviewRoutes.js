const express = require('express');
const reviewController = require('../controllers/reviewController');
const {
  validate,
  validateQuery,
  createReviewSchema,
  updateReviewSchema,
  reviewQuerySchema,
} = require('../validators/reviewValidator');
const { validateUUID } = require('../validators/paramValidator');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/v1/reviews/featured
 * @desc    Get featured 5-star customer testimonials for homepage
 * @access  Public
 */
router.get('/featured', reviewController.getFeaturedReviews);

/**
 * @route   GET /api/v1/reviews/products/:productId/eligibility
 * @desc    Check customer review eligibility and verified buyer status
 * @access  Private (Authenticated)
 */
router.get(
  '/products/:productId/eligibility',
  authenticateToken,
  validateUUID('productId'),
  reviewController.checkEligibility
);

/**
 * @route   GET /api/v1/reviews/products/:productId
 * @desc    Get paginated reviews for a specific product with rating summary
 * @access  Public
 */
router.get(
  '/products/:productId',
  validateUUID('productId'),
  validateQuery(reviewQuerySchema),
  reviewController.getProductReviews
);

/**
 * @route   POST /api/v1/reviews/products/:productId
 * @desc    Submit a review for a specific product
 * @access  Private (Authenticated)
 */
router.post(
  '/products/:productId',
  authenticateToken,
  validateUUID('productId'),
  validate(createReviewSchema),
  reviewController.createReview
);

/**
 * @route   PUT /api/v1/reviews/:id
 * @desc    Update an existing review
 * @access  Private (Owner or Admin)
 */
router.put(
  '/:id',
  authenticateToken,
  validateUUID('id'),
  validate(updateReviewSchema),
  reviewController.updateReview
);

/**
 * @route   DELETE /api/v1/reviews/:id
 * @desc    Delete a review
 * @access  Private (Owner or Admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  validateUUID('id'),
  reviewController.deleteReview
);

module.exports = router;
