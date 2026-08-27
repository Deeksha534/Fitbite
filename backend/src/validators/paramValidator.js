const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;


/**
 * Validates that a route parameter is a valid UUIDv4 string.
 * Rejects invalid format with 400 Bad Request.
 *
 * @param {string} paramName - Name of the request parameter to validate (e.g. 'id')
 * @returns {Function} Express middleware function
 */
const validateUUID = (paramName = 'id') => (req, res, next) => {
  const value = req.params[paramName];

  if (!value || !UUID_REGEX.test(value)) {
    return res.status(400).json({
      success: false,
      message: `Invalid identifier format for parameter '${paramName}'. Must be a valid UUID.`,
    });
  }

  next();
};

module.exports = {
  validateUUID,
  UUID_REGEX,
};
