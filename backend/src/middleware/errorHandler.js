/**
 * Centralized Error Handling Middleware
 * Ensures all API errors return consistent JSON responses.
 * Protects sensitive stack traces and credentials from leaking.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal server error occurred';

  // Handle PostgreSQL duplicate key constraint violation (Code 23505)
  if (err.code === '23505') {
    statusCode = 409;
    message = 'A record with this information already exists';
  }

  const response = {
    success: false,
    message,
  };

  // Include stack trace only in development environment
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;

