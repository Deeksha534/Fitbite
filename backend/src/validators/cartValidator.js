const Joi = require('joi');
const { UUID_REGEX } = require('./paramValidator');

/**
 * Schema for adding an item to the shopping cart.
 */
const addToCartSchema = Joi.object({
  product_id: Joi.string()
    .pattern(UUID_REGEX)
    .required()
    .messages({
      'string.empty': 'product_id is required',
      'string.pattern.base': 'product_id must be a valid UUID',
      'any.required': 'product_id is required',
    }),
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(1)
    .optional()
    .messages({
      'number.base': 'quantity must be a number',
      'number.integer': 'quantity must be an integer',
      'number.min': 'quantity must be at least 1',
      'number.max': 'quantity cannot exceed 100 per single operation',
    }),
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Schema for updating the quantity of an existing cart line item.
 */
const updateCartItemSchema = Joi.object({
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .required()
    .messages({
      'number.base': 'quantity must be a number',
      'number.integer': 'quantity must be an integer',
      'number.min': 'quantity must be at least 1',
      'number.max': 'quantity cannot exceed 100',
      'any.required': 'quantity is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Express middleware factory for validating cart request payloads.
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/['"]/g, ''),
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  req.body = value;
  next();
};

module.exports = {
  addToCartSchema,
  updateCartItemSchema,
  validate,
};
