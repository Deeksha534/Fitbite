const Joi = require('joi');
const { UUID_REGEX } = require('./paramValidator');

/**
 * Schema for adding an item to customer wishlist.
 */
const addToWishlistSchema = Joi.object({
  product_id: Joi.string()
    .pattern(UUID_REGEX)
    .required()
    .messages({
      'string.empty': 'product_id is required',
      'string.pattern.base': 'product_id must be a valid UUID',
      'any.required': 'product_id is required',
    }),
}).options({ abortEarly: false, stripUnknown: true });

/**
 * Express middleware factory for validating wishlist request payloads.
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
  addToWishlistSchema,
  validate,
};
