const wishlistService = require('../services/wishlistService');

/**
 * @route   GET /api/v1/wishlist
 * @desc    Retrieve the current user's saved wishlist
 * @access  Private (Authenticated)
 */
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.getWishlist(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Wishlist retrieved successfully',
      data: wishlist,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/v1/wishlist/items
 * @desc    Save a product to the user's wishlist
 * @access  Private (Authenticated)
 */
const addItem = async (req, res, next) => {
  try {
    const { isNew, wishlist } = await wishlistService.addItem(
      req.user.id,
      req.body.product_id
    );

    const statusCode = isNew ? 201 : 200;
    const message = isNew ? 'Item added to wishlist' : 'Item is already in your wishlist';

    return res.status(statusCode).json({
      success: true,
      message,
      data: wishlist,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/v1/wishlist/items/:itemId
 * @desc    Remove an item from user's wishlist
 * @access  Private (Authenticated)
 */
const removeItem = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.removeItem(req.user.id, req.params.itemId);

    return res.status(200).json({
      success: true,
      message: 'Item removed from wishlist',
      data: wishlist,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/v1/wishlist/move-to-cart/:itemId
 * @desc    Atomically move a saved wishlist product into the user's shopping cart
 * @access  Private (Authenticated)
 */
const moveToCart = async (req, res, next) => {
  try {
    const result = await wishlistService.moveToCart(req.user.id, req.params.itemId);

    return res.status(200).json({
      success: true,
      message: 'Item moved to cart successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWishlist,
  addItem,
  removeItem,
  moveToCart,
};
