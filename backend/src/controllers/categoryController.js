const categoryService = require('../services/categoryService');

/**
 * @route   GET /api/v1/categories
 * @desc    Retrieve all categories
 * @access  Public (inactive filtered unless Admin)
 */
const getAll = async (req, res, next) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const includeInactive = isAdmin && req.query.is_active !== 'true';

    const categories = await categoryService.getAllCategories({ includeInactive });

    return res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: {
        categories,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Retrieve single category by UUID
 * @access  Public (inactive 404s unless Admin)
 */
const getById = async (req, res, next) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const category = await categoryService.getCategoryById(req.params.id, { includeInactive: isAdmin });

    return res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: {
        category,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/v1/categories
 * @desc    Create a new product category
 * @access  Private (Admin only)
 */
const create = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Update an existing category
 * @access  Private (Admin only)
 */
const update = async (req, res, next) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Delete a category
 * @access  Private (Admin only)
 */
const deleteCategory = async (req, res, next) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);

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
  delete: deleteCategory,
};
