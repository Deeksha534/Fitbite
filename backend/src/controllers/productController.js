const productService = require('../services/productService');

/**
 * @route   GET /api/v1/products
 * @desc    Retrieve products with filtering, search, sorting & pagination
 * @access  Public (inactive items hidden unless Admin)
 */
const getAll = async (req, res, next) => {
  try {
    const userRole = req.user ? req.user.role : null;
    const result = await productService.getProducts(req.query, userRole);

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/products/:id
 * @desc    Retrieve single product with complete image gallery
 * @access  Public (inactive hidden unless Admin)
 */
const getById = async (req, res, next) => {
  try {
    const userRole = req.user ? req.user.role : null;
    const product = await productService.getProductById(req.params.id, userRole);

    return res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: {
        product,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/v1/products
 * @desc    Create a new product with image gallery
 * @access  Private (Admin only)
 */
const create = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        product,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update an existing product and its image gallery
 * @access  Private (Admin only)
 */
const update = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: {
        product,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete a product
 * @access  Private (Admin only)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const result = await productService.deleteProduct(req.params.id);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        id: result.id,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  delete: deleteProduct,
};
