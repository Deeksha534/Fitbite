const orderService = require('../services/orderService');

/**
 * @route   POST /api/v1/orders
 * @desc    Place order from customer's shopping cart
 * @access  Private (Authenticated Customer)
 */
const checkout = async (req, res, next) => {
  try {
    const order = await orderService.createOrderFromCart(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/orders
 * @desc    Retrieve current customer's order history
 * @access  Private (Authenticated Customer)
 */
const getMyOrders = async (req, res, next) => {
  try {
    const result = await orderService.getCustomerOrders(req.user.id, req.query);

    return res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Retrieve full details for an order by UUID or order_number
 * @access  Private (Customer Owner or Admin)
 */
const getOrderDetails = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const order = await orderService.getOrderByIdOrNumber(
      req.user.id,
      req.params.id,
      isAdmin
    );

    return res.status(200).json({
      success: true,
      message: 'Order details retrieved successfully',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/v1/orders/:id/cancel
 * @desc    Cancel a pending customer order and restore inventory
 * @access  Private (Customer Owner or Admin)
 */
const cancelMyOrder = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const order = await orderService.cancelOrder(req.user.id, req.params.id, isAdmin);

    return res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and inventory restored',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/orders/admin/all
 * @desc    Retrieve all store orders with filters (Admin only)
 * @access  Private (Admin only)
 */
const getAdminOrders = async (req, res, next) => {
  try {
    const result = await orderService.getAdminOrders(req.query);

    return res.status(200).json({
      success: true,
      message: 'Store orders retrieved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PATCH /api/v1/orders/admin/:id/status
 * @desc    Update order lifecycle status or payment status (Admin only)
 * @access  Private (Admin only)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatusByAdmin(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkout,
  getMyOrders,
  getOrderDetails,
  cancelMyOrder,
  getAdminOrders,
  updateOrderStatus,
};
