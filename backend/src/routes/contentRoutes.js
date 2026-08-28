const express = require('express');
const contentController = require('../controllers/contentController');

const router = express.Router();

/**
 * @route   GET /api/v1/content/recipes
 * @desc    Get high-protein fitness recipes with nutrition breakdown and instructions
 * @access  Public
 */
router.get('/recipes', contentController.getRecipes);

/**
 * @route   GET /api/v1/content/fitness-tips
 * @desc    Get workout recovery, hydration, and muscle science articles
 * @access  Public
 */
router.get('/fitness-tips', contentController.getFitnessTips);

/**
 * @route   GET /api/v1/content/faq
 * @desc    Get categorized frequently asked questions
 * @access  Public
 */
router.get('/faq', contentController.getFAQ);

/**
 * @route   GET /api/v1/content/nutrition-guide
 * @desc    Get protein macro calculation formulas and quality standards
 * @access  Public
 */
router.get('/nutrition-guide', contentController.getNutritionGuide);

module.exports = router;
