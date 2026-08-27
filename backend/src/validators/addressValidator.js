const Joi = require('joi');

/**
 * Validation schema for creating a new delivery address.
 */
const createAddressSchema = Joi.object({
  full_name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Full name is required',
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name cannot exceed 100 characters',
      'any.required': 'Full name is required',
    }),
  phone: Joi.string()
    .trim()
    .pattern(/^[+]?[0-9\s-]{7,20}$/)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Phone number is required',
    }),
  street_address: Joi.string()
    .trim()
    .min(5)
    .max(500)
    .required()
    .messages({
      'string.empty': 'Street address is required',
      'string.min': 'Street address must be at least 5 characters',
      'string.max': 'Street address cannot exceed 500 characters',
      'any.required': 'Street address is required',
    }),
  apartment: Joi.string()
    .trim()
    .max(100)
    .allow('', null)
    .optional(),
  city: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'City is required',
      'any.required': 'City is required',
    }),
  state: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'State is required',
      'any.required': 'State is required',
    }),
  postal_code: Joi.string()
    .trim()
    .min(3)
    .max(20)
    .required()
    .messages({
      'string.empty': 'Postal code is required',
      'any.required': 'Postal code is required',
    }),
  country: Joi.string()
    .trim()
    .max(100)
    .default('India')
    .optional(),
  is_default: Joi.boolean()
    .default(false)
    .optional(),
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Validation schema for updating an existing delivery address.
 */
const updateAddressSchema = Joi.object({
  full_name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),
  phone: Joi.string()
    .trim()
    .pattern(/^[+]?[0-9\s-]{7,20}$/)
    .optional(),
  street_address: Joi.string()
    .trim()
    .min(5)
    .max(500)
    .optional(),
  apartment: Joi.string()
    .trim()
    .max(100)
    .allow('', null)
    .optional(),
  city: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),
  state: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional(),
  postal_code: Joi.string()
    .trim()
    .min(3)
    .max(20)
    .optional(),
  country: Joi.string()
    .trim()
    .max(100)
    .optional(),
  is_default: Joi.boolean()
    .optional(),
})
  .min(1)
  .options({ abortEarly: false, stripUnknown: true })
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

/**
 * Express middleware factory for validating address request payloads.
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
  createAddressSchema,
  updateAddressSchema,
  validate,
};
