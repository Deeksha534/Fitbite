const paymentService = require('../services/paymentService');

/**
 * Controller handling order payment verification and commercial tax invoicing.
 */

/**
 * @route   POST /api/v1/orders/:id/payment
 * @desc    Submit payment confirmation details to update order to paid/confirmed
 * @access  Private (Order Owner or Admin)
 */
const verifyPayment = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const { payment_method, payment_reference_id } = req.body;

    const order = await paymentService.verifyPayment(req.user.id, req.user.role, orderId, {
      payment_method,
      payment_reference_id,
    });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully',
      data: { order },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/orders/:id/invoice
 * @desc    Generate a structured tax invoice breakdown for an order
 * @access  Private (Order Owner or Admin)
 */
const getInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const data = await paymentService.generateInvoice(req.user.id, req.user.role, orderId);

    return res.status(200).json({
      success: true,
      message: 'Tax invoice generated successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  verifyPayment,
  getInvoice,
};
