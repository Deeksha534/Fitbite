const Joi = require('joi');

/**
 * Validation schema for new user registration.
 * Explicitly excludes and strips any 'role' field to guarantee client cannot elevate privileges.
 */
const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .lowercase()
    .max(255)
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email must not exceed 255 characters',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required',
    }),
  full_name: Joi.string()
    .trim()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name must not exceed 255 characters',
      'any.required': 'Full name is required',
    }),
  phone: Joi.string()
    .trim()
    .max(50)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Phone number must not exceed 50 characters',
    }),
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Validation schema for user authentication / login.
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Express middleware factory for validating request bodies against a Joi schema.
 * Rejects invalid payloads with a 400 Bad Request and structured error list.
 *
 * @param {Joi.ObjectSchema} schema - Joi validation schema
 * @returns {Function} Express middleware function
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

  // Replace req.body with sanitized and stripped values
  req.body = value;
  next();
};

module.exports = {
  registerSchema,
  loginSchema,
  validate,
};
