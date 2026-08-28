const express = require('express');
const newsletterController = require('../controllers/newsletterController');
const {
  validate,
  validateQuery,
  newsletterSubscribeSchema,
  newsletterUnsubscribeSchema,
  newsletterQuerySchema,
} = require('../validators/newsletterValidator');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/v1/newsletter/subscribe
 * @desc    Subscribe email to FitBite newsletter
 * @access  Public
 */
router.post('/subscribe', validate(newsletterSubscribeSchema), newsletterController.subscribe);

/**
 * @route   POST /api/v1/newsletter/unsubscribe
 * @desc    Unsubscribe email from FitBite newsletter
 * @access  Public
 */
router.post('/unsubscribe', validate(newsletterUnsubscribeSchema), newsletterController.unsubscribe);

/**
 * @route   GET /api/v1/newsletter/admin/subscribers
 * @desc    List all newsletter subscribers with filters
 * @access  Private (Admin Only)
 */
router.get(
  '/admin/subscribers',
  authenticateToken,
  requireAdmin,
  validateQuery(newsletterQuerySchema),
  newsletterController.getSubscribers
);

module.exports = router;
