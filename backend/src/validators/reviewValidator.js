const Joi = require('joi');

/**
 * Middleware factory for request body validation using Joi schemas.
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/['"]/g, ''),
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorDetails,
    });
  }

  req.body = value;
  next();
};

/**
 * Middleware factory for request query validation using Joi schemas.
 */
const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/['"]/g, ''),
    }));

    return res.status(400).json({
      success: false,
      message: 'Query validation failed',
      errors: errorDetails,
    });
  }

  req.query = value;
  next();
};

/**
 * Schema for creating a product review.
 */
const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'Rating must be an integer between 1 and 5',
    'number.min': 'Rating must be at least 1 star',
    'number.max': 'Rating cannot exceed 5 stars',
    'any.required': 'Rating is required',
  }),
  title: Joi.string().trim().max(255).allow('', null).optional().messages({
    'string.max': 'Review title cannot exceed 255 characters',
  }),
  comment: Joi.string().trim().max(2000).allow('', null).optional().messages({
    'string.max': 'Review comment cannot exceed 2000 characters',
  }),
});

/**
 * Schema for updating an existing product review.
 */
const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional().messages({
    'number.base': 'Rating must be an integer between 1 and 5',
    'number.min': 'Rating must be at least 1 star',
    'number.max': 'Rating cannot exceed 5 stars',
  }),
  title: Joi.string().trim().max(255).allow('', null).optional().messages({
    'string.max': 'Review title cannot exceed 255 characters',
  }),
  comment: Joi.string().trim().max(2000).allow('', null).optional().messages({
    'string.max': 'Review comment cannot exceed 2000 characters',
  }),
}).min(1).messages({
  'object.min': 'At least one field (rating, title, comment) must be provided for update',
});

/**
 * Schema for product reviews list query parameters.
 */
const reviewQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string()
    .valid('newest', 'oldest', 'highest_rating', 'lowest_rating')
    .default('newest'),
});

module.exports = {
  validate,
  validateQuery,
  createReviewSchema,
  updateReviewSchema,
  reviewQuerySchema,
};
