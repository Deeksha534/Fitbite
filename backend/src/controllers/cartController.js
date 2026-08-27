const cartService = require('../services/cartService');

/**
 * @route   GET /api/v1/cart
 * @desc    Retrieve the current user's shopping cart
 * @access  Private (Authenticated)
 */
const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getCart(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/v1/cart/items
 * @desc    Add a product to the user's shopping cart
 * @access  Private (Authenticated)
 */
const addItem = async (req, res, next) => {
  try {
    const cart = await cartService.addItem(req.user.id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/v1/cart/items/:itemId
 * @desc    Update quantity of a line item in cart
 * @access  Private (Authenticated)
 */
const updateItem = async (req, res, next) => {
  try {
    const cart = await cartService.updateItemQuantity(
      req.user.id,
      req.params.itemId,
      req.body.quantity
    );

    return res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/v1/cart/items/:itemId
 * @desc    Remove a specific line item from cart
 * @access  Private (Authenticated)
 */
const removeItem = async (req, res, next) => {
  try {
    const cart = await cartService.removeItem(req.user.id, req.params.itemId);

    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/v1/cart
 * @desc    Clear all items in cart
 * @access  Private (Authenticated)
 */
const clearCart = async (req, res, next) => {
  try {
    const cart = await cartService.clearCart(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
