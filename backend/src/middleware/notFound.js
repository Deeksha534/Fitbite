/**
 * 404 Not Found Middleware
 * Handles requests made to undefined routes and passes a 404 error to the central error handler.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Resource not found: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = notFound;
