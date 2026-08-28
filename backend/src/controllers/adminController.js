const adminService = require('../services/adminService');

/**
 * Controller handling administrator dashboard analytics, financial metrics,
 * low-stock inventory alerts, and customer directory intelligence.
 */

/**
 * @route   GET /api/v1/admin/dashboard/stats
 * @desc    Get store financial overview, order breakdown, inventory health, and customer metrics
 * @access  Private (Admin Only)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();

    return res.status(200).json({
      success: true,
      message: 'Dashboard analytics retrieved successfully',
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/admin/customers
 * @desc    Get paginated directory of registered customers with lifetime spend
 * @access  Private (Admin Only)
 */
const getCustomers = async (req, res, next) => {
  try {
    const { page, limit, search, sort } = req.query;
    const data = await adminService.getCustomers({ page, limit, search, sort });

    return res.status(200).json({
      success: true,
      message: 'Customer directory retrieved successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/admin/customers/:id
 * @desc    Get detailed customer profile, addresses, and order history
 * @access  Private (Admin Only)
 */
const getCustomerById = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const data = await adminService.getCustomerById(customerId);

    return res.status(200).json({
      success: true,
      message: 'Customer details retrieved successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getCustomers,
  getCustomerById,
};
