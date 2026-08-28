const contentService = require('../services/contentService');

/**
 * Controller handling public structured content requests for recipes,
 * fitness tips, FAQ, and nutrition guide.
 */

/**
 * @route   GET /api/v1/content/recipes
 * @access  Public
 */
const getRecipes = async (req, res, next) => {
  try {
    const data = await contentService.getRecipes();
    return res.status(200).json({
      success: true,
      message: 'Recipes retrieved successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/content/fitness-tips
 * @access  Public
 */
const getFitnessTips = async (req, res, next) => {
  try {
    const data = await contentService.getFitnessTips();
    return res.status(200).json({
      success: true,
      message: 'Fitness tips retrieved successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/content/faq
 * @access  Public
 */
const getFAQ = async (req, res, next) => {
  try {
    const data = await contentService.getFAQ();
    return res.status(200).json({
      success: true,
      message: 'FAQ retrieved successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/v1/content/nutrition-guide
 * @access  Public
 */
const getNutritionGuide = async (req, res, next) => {
  try {
    const data = await contentService.getNutritionGuide();
    return res.status(200).json({
      success: true,
      message: 'Nutrition guide retrieved successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRecipes,
  getFitnessTips,
  getFAQ,
  getNutritionGuide,
};
