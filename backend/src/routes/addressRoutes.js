const express = require('express');
const addressController = require('../controllers/addressController');
const {
  validate,
  createAddressSchema,
  updateAddressSchema,
} = require('../validators/addressValidator');
const { validateUUID } = require('../validators/paramValidator');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce customer authentication for all address routes
router.use(authenticateToken);

/**
 * @route   GET /api/v1/addresses
 * @desc    Get all saved addresses for the logged-in customer
 * @access  Private
 */
router.get('/', addressController.getAddresses);

/**
 * @route   POST /api/v1/addresses
 * @desc    Create a new delivery address
 * @access  Private
 */
router.post('/', validate(createAddressSchema), addressController.createAddress);

/**
 * @route   GET /api/v1/addresses/:id
 * @desc    Get single address by UUID
 * @access  Private
 */
router.get('/:id', validateUUID('id'), addressController.getAddress);

/**
 * @route   PUT /api/v1/addresses/:id
 * @desc    Update delivery address
 * @access  Private
 */
router.put(
  '/:id',
  validateUUID('id'),
  validate(updateAddressSchema),
  addressController.updateAddress
);

/**
 * @route   DELETE /api/v1/addresses/:id
 * @desc    Delete delivery address
 * @access  Private
 */
router.delete('/:id', validateUUID('id'), addressController.deleteAddress);

/**
 * @route   PATCH /api/v1/addresses/:id/default
 * @desc    Set address as default
 * @access  Private
 */
router.patch('/:id/default', validateUUID('id'), addressController.setDefaultAddress);

module.exports = router;
