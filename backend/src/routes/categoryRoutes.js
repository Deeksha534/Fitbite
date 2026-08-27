const express = require('express');
const categoryController = require('../controllers/categoryController');
const { validate, createCategorySchema, updateCategorySchema } = require('../validators/categoryValidator');
const { validateUUID } = require('../validators/paramValidator');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/v1/categories
 * @desc    Get all categories (public only gets active categories)
 * @access  Public
 */
router.get('/', optionalAuth, categoryController.getAll);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Get single category by UUID
 * @access  Public
 */
router.get('/:id', validateUUID('id'), optionalAuth, categoryController.getById);

/**
 * @route   POST /api/v1/categories
 * @desc    Create a category
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validate(createCategorySchema),
  categoryController.create
);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update a category
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  validateUUID('id'),
  authenticateToken,
  requireAdmin,
  validate(updateCategorySchema),
  categoryController.update
);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete a category
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  validateUUID('id'),
  authenticateToken,
  requireAdmin,
  categoryController.delete
);

module.exports = router;
