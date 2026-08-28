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
 * Schema for updating user profile.
 */
const updateProfileSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(255).optional().messages({
    'string.min': 'Full name must be at least 2 characters long',
    'string.max': 'Full name cannot exceed 255 characters',
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^[+]?[0-9\s\-()]{7,25}$/)
    .max(50)
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'Please enter a valid telephone number',
      'string.max': 'Phone number cannot exceed 50 characters',
    }),
  avatar_url: Joi.string()
    .trim()
    .uri({ scheme: ['http', 'https'] })
    .max(1000)
    .allow('', null)
    .optional()
    .messages({
      'string.uri': 'Avatar URL must be a valid HTTP or HTTPS web address',
      'string.max': 'Avatar URL cannot exceed 1000 characters',
    }),
  bio: Joi.string().trim().max(1000).allow('', null).optional().messages({
    'string.max': 'Bio cannot exceed 1000 characters',
  }),
}).min(1).messages({
  'object.min': 'At least one profile field must be provided for update',
});

/**
 * Strong password pattern:
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special symbol
 */
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^_\-~])[A-Za-z\d@$!%*?&#^_\-~]{8,}$/;

/**
 * Schema for changing user password.
 */
const changePasswordSchema = Joi.object({
  current_password: Joi.string().required().messages({
    'any.required': 'Current password is required',
    'string.empty': 'Current password cannot be empty',
  }),
  new_password: Joi.string()
    .min(8)
    .max(128)
    .pattern(STRONG_PASSWORD_REGEX)
    .required()
    .messages({
      'string.empty': 'New password cannot be empty',
      'string.min': 'New password must be at least 8 characters long',
      'string.max': 'New password cannot exceed 128 characters',
      'string.pattern.base':
        'New password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&#^_-~)',
      'any.required': 'New password is required',
    }),
  confirm_password: Joi.string()
    .valid(Joi.ref('new_password'))
    .required()
    .messages({
      'any.only': 'Password confirmation must match the new password',
      'any.required': 'Password confirmation is required',
    }),
});

module.exports = {
  validate,
  updateProfileSchema,
  changePasswordSchema,
};
