const Joi = require('joi');
const { UUID_REGEX } = require('./paramValidator');

/**
 * Validation schema for placing an order from the user's shopping cart.
 */
const createOrderSchema = Joi.object({
  shipping_address_id: Joi.string()
    .pattern(UUID_REGEX)
    .optional()
    .messages({
      'string.pattern.base': 'shipping_address_id must be a valid UUID',
    }),
  shipping_address: Joi.object({
    full_name: Joi.string().trim().min(2).max(100).required(),
    phone: Joi.string().trim().pattern(/^[+]?[0-9\s-]{7,20}$/).required(),
    street_address: Joi.string().trim().min(5).max(500).required(),
    apartment: Joi.string().trim().max(100).allow('', null).optional(),
    city: Joi.string().trim().min(2).max(100).required(),
    state: Joi.string().trim().min(2).max(100).required(),
    postal_code: Joi.string().trim().min(3).max(20).required(),
    country: Joi.string().trim().max(100).default('India').optional(),
  }).optional(),
  payment_method: Joi.string()
    .valid('cod', 'card', 'upi')
    .required()
    .messages({
      'any.only': "payment_method must be one of: 'cod', 'card', 'upi'",
      'any.required': 'payment_method is required',
    }),
  payment_reference_id: Joi.string()
    .trim()
    .max(255)
    .allow('', null)
    .optional(),
  coupon_code: Joi.string()
    .trim()
    .uppercase()
    .max(50)
    .allow('', null)
    .optional(),
  delivery_notes: Joi.string()
    .trim()
    .max(500)
    .allow('', null)
    .optional(),
})
  .or('shipping_address_id', 'shipping_address')
  .options({ abortEarly: false, stripUnknown: true })
  .messages({
    'object.missing': 'Either shipping_address_id or shipping_address details must be provided',
  });

/**
 * Validation schema for admin status updates.
 */
const updateOrderStatusSchema = Joi.object({
  order_status: Joi.string()
    .valid('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')
    .optional()
    .messages({
      'any.only':
        "order_status must be one of: 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'",
    }),
  payment_status: Joi.string()
    .valid('unpaid', 'paid', 'failed', 'refunded')
    .optional()
    .messages({
      'any.only': "payment_status must be one of: 'unpaid', 'paid', 'failed', 'refunded'",
    }),
})
  .min(1)
  .options({ abortEarly: false, stripUnknown: true })
  .messages({
    'object.min': 'At least one status field (order_status or payment_status) must be provided for update',
  });

/**
 * Validation schema for listing and filtering orders.
 */
const orderQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  order_status: Joi.string()
    .valid('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')
    .optional(),
  payment_status: Joi.string()
    .valid('unpaid', 'paid', 'failed', 'refunded')
    .optional(),
  search: Joi.string().trim().max(100).optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
  sort: Joi.string()
    .valid('newest', 'oldest', 'total_asc', 'total_desc')
    .default('newest')
    .optional(),
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Express middleware factory for validating body payloads.
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

/**
 * Express middleware factory for validating query parameters.
 */
const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query);

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/['"]/g, ''),
    }));

    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors,
    });
  }

  req.query = value;
  next();
};

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
  validate,
  validateQuery,
};
