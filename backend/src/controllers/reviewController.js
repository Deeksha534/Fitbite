const reviewService = require('../services/reviewService');

/**
 * Controller handling customer reviews, ratings aggregations,
 * and review moderation.
 */

/**
 * @route   GET /api/v1/products/:productId/reviews or /api/v1/reviews/products/:productId
 * @desc    Get reviews for a product with rating summary
 * @access  Public
 */
const getProductReviews = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.params.id;
    const { page, limit, sort } = req.query;

    const data = await reviewService.getProductReviews(productId, { page, limit, sort });

    return res.status(200).json({
      success: true,
      message: 'Product reviews retrieved successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/reviews/featured
 * @desc    Get featured top-rated reviews for homepage testimonials
 * @access  Public
 */
const getFeaturedReviews = async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 6;
    const reviews = await reviewService.getFeaturedReviews(limit);

    return res.status(200).json({
      success: true,
      message: 'Featured reviews retrieved successfully',
      data: {
        total: reviews.length,
        reviews,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/products/:productId/reviews/eligibility
 * @desc    Check if current user is eligible to review and verified status
 * @access  Private (Authenticated)
 */
const checkEligibility = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.params.id;
    const data = await reviewService.checkReviewEligibility(req.user.id, productId);

    return res.status(200).json({
      success: true,
      message: 'Review eligibility checked successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/v1/products/:productId/reviews
 * @desc    Submit a review for a product
 * @access  Private (Authenticated)
 */
const createReview = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.params.id;
    const { rating, title, comment } = req.body;

    const review = await reviewService.createProductReview(req.user.id, productId, {
      rating,
      title,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/v1/reviews/:id
 * @desc    Update an existing review
 * @access  Private (Owner or Admin)
 */
const updateReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const { rating, title, comment } = req.body;

    const review = await reviewService.updateReview(req.user.id, req.user.role, reviewId, {
      rating,
      title,
      comment,
    });

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: { review },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/v1/reviews/:id
 * @desc    Delete a review
 * @access  Private (Owner or Admin)
 */
const deleteReview = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const result = await reviewService.deleteReview(req.user.id, req.user.role, reviewId);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: { deleted_id: result.deleted_id },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProductReviews,
  getFeaturedReviews,
  checkEligibility,
  createReview,
  updateReview,
  deleteReview,
};
