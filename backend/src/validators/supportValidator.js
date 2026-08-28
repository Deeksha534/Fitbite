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
 * Schema for submitting a customer support ticket / contact inquiry.
 */
const createTicketSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'any.required': 'Name is required',
  }),
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Please provide a valid contact email address',
    'any.required': 'Email is required',
  }),
  subject: Joi.string().trim().min(3).max(255).required().messages({
    'string.min': 'Subject must be at least 3 characters long',
    'any.required': 'Subject is required',
  }),
  category: Joi.string()
    .valid('general', 'order', 'product', 'nutrition', 'refund')
    .default('general'),
  message: Joi.string().trim().min(5).max(3000).required().messages({
    'string.min': 'Message must be at least 5 characters long',
    'string.max': 'Message cannot exceed 3000 characters',
    'any.required': 'Message is required',
  }),
});

/**
 * Schema for updating ticket status / resolution notes (Admin).
 */
const updateTicketStatusSchema = Joi.object({
  status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').optional(),
  admin_notes: Joi.string().trim().max(2000).allow('', null).optional(),
}).min(1).messages({
  'object.min': 'At least one field (status, admin_notes) must be provided for update',
});

/**
 * Schema for querying support tickets (Admin).
 */
const ticketQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').optional(),
  category: Joi.string().valid('general', 'order', 'product', 'nutrition', 'refund').optional(),
  search: Joi.string().trim().max(100).allow('', null).optional(),
});

module.exports = {
  validate,
  validateQuery,
  createTicketSchema,
  updateTicketStatusSchema,
  ticketQuerySchema,
};
