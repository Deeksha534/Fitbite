const Joi = require('joi');
const { UUID_REGEX } = require('./paramValidator');

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const imageItemSchema = Joi.object({
  image_url: Joi.string().trim().required().messages({
    'string.empty': 'image_url cannot be empty',
    'any.required': 'image_url is required for each image item',
  }),
  alt_text: Joi.string().trim().max(255).allow('', null).optional(),
  display_order: Joi.number().integer().min(0).default(0).optional(),
  is_primary: Joi.boolean().default(false).optional(),
});

/**
 * Schema for creating a new product.
 */
const createProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Product name is required',
      'string.min': 'Product name must be at least 2 characters long',
      'string.max': 'Product name must not exceed 255 characters',
      'any.required': 'Product name is required',
    }),
  slug: Joi.string()
    .trim()
    .lowercase()
    .min(2)
    .max(255)
    .pattern(SLUG_REGEX)
    .required()
    .messages({
      'string.empty': 'Product slug is required',
      'string.pattern.base': 'Product slug must contain only lowercase alphanumeric characters separated by hyphens (e.g. peanut-butter-fudge)',
      'any.required': 'Product slug is required',
    }),
  category_id: Joi.string()
    .pattern(UUID_REGEX)
    .allow(null)
    .optional()
    .messages({
      'string.pattern.base': 'category_id must be a valid UUID',
    }),
  description: Joi.string()
    .trim()
    .allow('', null)
    .optional(),
  price: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Price must be a valid number',
      'number.min': 'Price must be greater than or equal to 0',
      'any.required': 'Price is required',
    }),
  compare_at_price: Joi.number()
    .min(0)
    .allow(null)
    .optional()
    .messages({
      'number.base': 'compare_at_price must be a valid number',
      'number.min': 'compare_at_price must be greater than or equal to 0',
    }),
  stock_quantity: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .optional()
    .messages({
      'number.min': 'Stock quantity cannot be negative',
    }),
  flavor: Joi.string()
    .trim()
    .max(100)
    .allow('', null)
    .optional(),
  protein_grams: Joi.number()
    .min(0)
    .default(0)
    .optional()
    .messages({
      'number.min': 'Protein grams cannot be negative',
    }),
  fiber_grams: Joi.number()
    .min(0)
    .default(0)
    .optional()
    .messages({
      'number.min': 'Fiber grams cannot be negative',
    }),
  sugar_grams: Joi.number()
    .min(0)
    .default(0)
    .optional()
    .messages({
      'number.min': 'Sugar grams cannot be negative',
    }),
  calories: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .optional()
    .messages({
      'number.min': 'Calories cannot be negative',
    }),
  is_featured: Joi.boolean()
    .default(false)
    .optional(),
  is_active: Joi.boolean()
    .default(true)
    .optional(),
  images: Joi.array()
    .items(imageItemSchema)
    .optional(),
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Schema for updating an existing product.
 */
const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(255).optional(),
  slug: Joi.string().trim().lowercase().min(2).max(255).pattern(SLUG_REGEX).optional().messages({
    'string.pattern.base': 'Product slug must contain only lowercase alphanumeric characters separated by hyphens',
  }),
  category_id: Joi.string().pattern(UUID_REGEX).allow(null).optional().messages({
    'string.pattern.base': 'category_id must be a valid UUID',
  }),
  description: Joi.string().trim().allow('', null).optional(),
  price: Joi.number().min(0).optional().messages({
    'number.min': 'Price must be greater than or equal to 0',
  }),
  compare_at_price: Joi.number().min(0).allow(null).optional().messages({
    'number.min': 'compare_at_price must be greater than or equal to 0',
  }),
  stock_quantity: Joi.number().integer().min(0).optional(),
  flavor: Joi.string().trim().max(100).allow('', null).optional(),
  protein_grams: Joi.number().min(0).optional(),
  fiber_grams: Joi.number().min(0).optional(),
  sugar_grams: Joi.number().min(0).optional(),
  calories: Joi.number().integer().min(0).optional(),
  is_featured: Joi.boolean().optional(),
  is_active: Joi.boolean().optional(),
  images: Joi.array().items(imageItemSchema).optional(),
})
  .min(1)
  .options({ abortEarly: false, stripUnknown: true })
  .messages({
    'object.min': 'At least one product field must be provided for update',
  });

/**
 * Schema for validating query parameters in GET /api/v1/products.
 */
const productListQuerySchema = Joi.object({
  search: Joi.string().trim().max(100).allow('', null).optional(),
  category_id: Joi.string().pattern(UUID_REGEX).optional().messages({
    'string.pattern.base': 'category_id query parameter must be a valid UUID',
  }),
  min_price: Joi.number().min(0).optional(),
  max_price: Joi.number().min(0).optional(),
  flavor: Joi.string().trim().max(100).optional(),
  is_active: Joi.boolean().optional(),
  is_featured: Joi.boolean().optional(),
  sort: Joi.string()
    .valid('newest', 'price_asc', 'price_desc', 'calories_asc', 'calories_desc', 'featured')
    .default('newest')
    .optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Express middleware factory for validating request bodies.
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
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
  validate,
  validateQuery,
};
