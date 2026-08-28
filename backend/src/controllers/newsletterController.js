const newsletterService = require('../services/newsletterService');

/**
 * Controller handling customer newsletter subscriptions, unsubscribe requests,
 * and admin subscriber listing.
 */

/**
 * @route   POST /api/v1/newsletter/subscribe
 * @desc    Subscribe email to FitBite newsletter
 * @access  Public
 */
const subscribe = async (req, res, next) => {
  try {
    const { email, source } = req.body;
    const result = await newsletterService.subscribe(email, source);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.subscriber,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/v1/newsletter/unsubscribe
 * @desc    Unsubscribe email from FitBite newsletter
 * @access  Public
 */
const unsubscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await newsletterService.unsubscribe(email);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: { email: result.email, is_active: result.is_active },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/admin/newsletter/subscribers
 * @desc    List all newsletter subscribers with filters
 * @access  Private (Admin Only)
 */
const getSubscribers = async (req, res, next) => {
  try {
    const data = await newsletterService.getSubscribers(req.query);

    return res.status(200).json({
      success: true,
      message: 'Subscribers retrieved successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  subscribe,
  unsubscribe,
  getSubscribers,
};
