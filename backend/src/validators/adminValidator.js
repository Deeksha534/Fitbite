const Joi = require('joi');

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
 * Schema for querying registered customers in admin dashboard.
 */
const adminCustomerQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100).allow('', null).optional(),
  sort: Joi.string()
    .valid('created_at_desc', 'created_at_asc', 'spend_desc', 'orders_desc', 'name_asc')
    .default('created_at_desc'),
});

module.exports = {
  validateQuery,
  adminCustomerQuerySchema,
};
