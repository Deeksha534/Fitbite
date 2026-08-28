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
 * Schema for customer coupon validation against their cart.
 */
const validateCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(2).max(50).required().messages({
    'string.empty': 'Coupon code cannot be empty',
    'any.required': 'Coupon code is required',
  }),
});

/**
 * Schema for creating a new promotional coupon (Admin).
 */
const createCouponSchema = Joi.object({
  code: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9_-]{2,50}$/)
    .required()
    .messages({
      'string.pattern.base': 'Coupon code must be alphanumeric (e.g., FITBITE20, PROTEIN50)',
      'any.required': 'Coupon code is required',
    }),
  discount_type: Joi.string().valid('percentage', 'fixed').required().messages({
    'any.only': 'Discount type must be either "percentage" or "fixed"',
    'any.required': 'Discount type is required',
  }),
  discount_value: Joi.number().positive().required().messages({
    'number.base': 'Discount value must be a positive number',
    'number.positive': 'Discount value must be greater than 0',
    'any.required': 'Discount value is required',
  }),
  min_order_amount: Joi.number().min(0).default(0),
  max_discount_amount: Joi.number().positive().allow(null).optional(),
  usage_limit: Joi.number().integer().positive().allow(null).optional(),
  starts_at: Joi.date().iso().optional(),
  expires_at: Joi.date().iso().allow(null).optional(),
  is_active: Joi.boolean().default(true),
});

/**
 * Schema for updating an existing coupon (Admin).
 */
const updateCouponSchema = Joi.object({
  code: Joi.string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9_-]{2,50}$/)
    .optional(),
  discount_type: Joi.string().valid('percentage', 'fixed').optional(),
  discount_value: Joi.number().positive().optional(),
  min_order_amount: Joi.number().min(0).optional(),
  max_discount_amount: Joi.number().positive().allow(null).optional(),
  usage_limit: Joi.number().integer().positive().allow(null).optional(),
  starts_at: Joi.date().iso().optional(),
  expires_at: Joi.date().iso().allow(null).optional(),
  is_active: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Schema for querying coupon list (Admin).
 */
const couponQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  is_active: Joi.boolean().optional(),
  discount_type: Joi.string().valid('percentage', 'fixed').optional(),
  search: Joi.string().trim().max(50).allow('', null).optional(),
});

module.exports = {
  validate,
  validateQuery,
  validateCouponSchema,
  createCouponSchema,
  updateCouponSchema,
  couponQuerySchema,
};
