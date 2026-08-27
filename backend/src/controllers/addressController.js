const addressService = require('../services/addressService');

/**
 * @route   GET /api/v1/addresses
 * @desc    Retrieve all saved delivery addresses for the current user
 * @access  Private (Authenticated)
 */
const getAddresses = async (req, res, next) => {
  try {
    const addresses = await addressService.getUserAddresses(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Addresses retrieved successfully',
      data: {
        addresses,
        count: addresses.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/addresses/:id
 * @desc    Retrieve single address with ownership check
 * @access  Private (Authenticated)
 */
const getAddress = async (req, res, next) => {
  try {
    const address = await addressService.getAddressById(req.user.id, req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Address retrieved successfully',
      data: address,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/v1/addresses
 * @desc    Create a new delivery address
 * @access  Private (Authenticated)
 */
const createAddress = async (req, res, next) => {
  try {
    const address = await addressService.createAddress(req.user.id, req.body);

    return res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: address,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/v1/addresses/:id
 * @desc    Update an existing delivery address
 * @access  Private (Authenticated)
 */
const updateAddress = async (req, res, next) => {
  try {
    const address = await addressService.updateAddress(
      req.user.id,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: address,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/v1/addresses/:id
 * @desc    Delete a delivery address
 * @access  Private (Authenticated)
 */
const deleteAddress = async (req, res, next) => {
  try {
    const result = await addressService.deleteAddress(req.user.id, req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PATCH /api/v1/addresses/:id/default
 * @desc    Set delivery address as default
 * @access  Private (Authenticated)
 */
const setDefaultAddress = async (req, res, next) => {
  try {
    const address = await addressService.setDefaultAddress(req.user.id, req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Default address updated successfully',
      data: address,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
