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
 * Schema for verifying order payment.
 */
const paymentVerifySchema = Joi.object({
  payment_method: Joi.string().valid('card', 'upi', 'cod').required().messages({
    'any.only': 'Payment method must be one of: card, upi, cod',
    'any.required': 'Payment method is required',
  }),
  payment_reference_id: Joi.string().trim().max(255).allow('', null).optional().messages({
    'string.max': 'Payment reference ID cannot exceed 255 characters',
  }),
  gateway_response: Joi.object().optional(),
});

module.exports = {
  validate,
  paymentVerifySchema,
};
