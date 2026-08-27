const Joi = require('joi');

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Schema for creating a new product category.
 */
const createCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Category name is required',
      'string.min': 'Category name must be at least 2 characters long',
      'string.max': 'Category name must not exceed 255 characters',
      'any.required': 'Category name is required',
    }),
  slug: Joi.string()
    .trim()
    .lowercase()
    .min(2)
    .max(255)
    .pattern(SLUG_REGEX)
    .required()
    .messages({
      'string.empty': 'Category slug is required',
      'string.pattern.base': 'Category slug must contain only lowercase alphanumeric characters separated by hyphens (e.g. protein-bars)',
      'any.required': 'Category slug is required',
    }),
  description: Joi.string()
    .trim()
    .max(2000)
    .allow('', null)
    .optional(),
  image_url: Joi.string()
    .trim()
    .allow('', null)
    .optional(),
  is_active: Joi.boolean()
    .optional()
    .default(true),
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Schema for updating an existing product category.
 */
const updateCategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(255)
    .optional(),
  slug: Joi.string()
    .trim()
    .lowercase()
    .min(2)
    .max(255)
    .pattern(SLUG_REGEX)
    .optional()
    .messages({
      'string.pattern.base': 'Category slug must contain only lowercase alphanumeric characters separated by hyphens (e.g. protein-bars)',
    }),
  description: Joi.string()
    .trim()
    .max(2000)
    .allow('', null)
    .optional(),
  image_url: Joi.string()
    .trim()
    .allow('', null)
    .optional(),
  is_active: Joi.boolean()
    .optional(),
})
  .min(1)
  .options({ abortEarly: false, stripUnknown: true })
  .messages({
    'object.min': 'At least one category field must be provided for update',
  });

/**
 * Express middleware factory for validating category requests.
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
  createCategorySchema,
  updateCategorySchema,
  validate,
};
