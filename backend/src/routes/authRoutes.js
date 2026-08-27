const express = require('express');
const authController = require('../controllers/authController');
const { validate, registerSchema, loginSchema } = require('../validators/authValidator');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new customer account
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and obtain JWT token
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Retrieve profile for currently authenticated user
 * @access  Private (Authenticated)
 */
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
