const express = require('express');
const productController = require('../controllers/productController');
const {
  validate,
  validateQuery,
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
} = require('../validators/productValidator');
const { validateUUID } = require('../validators/paramValidator');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @route   GET /api/v1/products
 * @desc    Get products with search, category, flavor, price filters & pagination
 * @access  Public
 */
router.get(
  '/',
  optionalAuth,
  validateQuery(productListQuerySchema),
  productController.getAll
);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product details with complete image gallery
 * @access  Public
 */
router.get(
  '/:id',
  validateUUID('id'),
  optionalAuth,
  productController.getById
);

/**
 * @route   POST /api/v1/products
 * @desc    Create a product with image gallery
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validate(createProductSchema),
  productController.create
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update a product and its image gallery
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  validateUUID('id'),
  authenticateToken,
  requireAdmin,
  validate(updateProductSchema),
  productController.update
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete a product
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  validateUUID('id'),
  authenticateToken,
  requireAdmin,
  productController.delete
);

module.exports = router;
