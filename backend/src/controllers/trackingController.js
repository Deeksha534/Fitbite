const trackingService = require('../services/trackingService');

/**
 * Controller handling public and authenticated order tracking timelines.
 */

/**
 * @route   GET /api/v1/orders/track/:orderNumber
 * @desc    Get real-time 5-stage order tracking progress timeline with privacy masking
 * @access  Public (Optional Authentication)
 */
const getTracking = async (req, res, next) => {
  try {
    const { orderNumber } = req.params;
    const data = await trackingService.getTrackingTimeline(orderNumber, req.user || null);

    return res.status(200).json({
      success: true,
      message: 'Order tracking timeline retrieved successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTracking,
};
