/**
 * Centralized Error Handling Middleware
 * Ensures all API errors return consistent JSON responses.
 * Protects sensitive stack traces from leaking in production.
 */
const errorHandler = (err, req, res, next) => {
  // If status code was not previously set to an error status, default to 500
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  const response = {
    success: false,
    message: err.message || 'Internal server error occurred',
  };

  // Include stack trace only in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
