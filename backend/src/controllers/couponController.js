const couponService = require('../services/couponService');

/**
 * Controller handling coupon validation for customers and coupon CRUD for administrators.
 */

/**
 * @route   POST /api/v1/coupons/validate
 * @desc    Validate coupon code against user's cart and calculate savings
 * @access  Private (Authenticated Customer)
 */
const validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    const result = await couponService.validateUserCoupon(req.user.id, code);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/admin/coupons
 * @desc    List all coupons with usage statistics
 * @access  Private (Admin Only)
 */
const getCoupons = async (req, res, next) => {
  try {
    const data = await couponService.getAllCoupons(req.query);

    return res.status(200).json({
      success: true,
      message: 'Coupons retrieved successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/v1/admin/coupons
 * @desc    Create a new promotional coupon
 * @access  Private (Admin Only)
 */
const createCoupon = async (req, res, next) => {
  try {
    const coupon = await couponService.createCoupon(req.body);

    return res.status(201).json({
      success: true,
      message: `Coupon '${coupon.code}' created successfully`,
      data: { coupon },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/v1/admin/coupons/:id
 * @desc    Update an existing coupon
 * @access  Private (Admin Only)
 */
const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await couponService.updateCoupon(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: `Coupon '${coupon.code}' updated successfully`,
      data: { coupon },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/v1/admin/coupons/:id
 * @desc    Delete a coupon
 * @access  Private (Admin Only)
 */
const deleteCoupon = async (req, res, next) => {
  try {
    const result = await couponService.deleteCoupon(req.params.id);

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
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
