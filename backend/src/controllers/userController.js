const userService = require('../services/userService');

/**
 * Controller handling customer profile updates, password changes,
 * and account overview dashboard stats.
 */

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user's profile metadata
 * @access  Private (Authenticated)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { full_name, phone, avatar_url, bio } = req.body;
    const user = await userService.updateProfile(req.user.id, {
      full_name,
      phone,
      avatar_url,
      bio,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/v1/users/password
 * @desc    Change account password
 * @access  Private (Authenticated)
 */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const result = await userService.changePassword(req.user.id, {
      current_password,
      new_password,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/users/summary
 * @desc    Retrieve customer account summary dashboard metrics
 * @access  Private (Authenticated)
 */
const getSummary = async (req, res, next) => {
  try {
    const summary = await userService.getUserSummary(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Account summary retrieved successfully',
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateProfile,
  changePassword,
  getSummary,
};
