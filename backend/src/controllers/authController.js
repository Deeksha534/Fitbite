const authService = require('../services/authService');

/**
 * Controller handling user registration.
 *
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { email, password, full_name, phone } = req.body;
    const result = await authService.registerUser({ email, password, full_name, phone });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller handling user authentication / login.
 *
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    return res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller handling retrieval of current authenticated user profile.
 *
 * @route   GET /api/v1/auth/me
 * @access  Private (Authenticated)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
