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
 * Schema for newsletter subscription.
 */
const newsletterSubscribeSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Please provide a valid email address for newsletter subscription',
    'any.required': 'Email is required',
  }),
  source: Joi.string().trim().max(50).default('homepage_footer'),
});

/**
 * Schema for newsletter unsubscribe.
 */
const newsletterUnsubscribeSchema = Joi.object({
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
});

/**
 * Schema for admin querying newsletter subscribers.
 */
const newsletterQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  is_active: Joi.boolean().optional(),
  search: Joi.string().trim().max(100).allow('', null).optional(),
});

module.exports = {
  validate,
  validateQuery,
  newsletterSubscribeSchema,
  newsletterUnsubscribeSchema,
  newsletterQuerySchema,
};
