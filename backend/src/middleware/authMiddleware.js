const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate requests using JWT Bearer tokens.
 * Extracts token from 'Authorization: Bearer <token>' header.
 * Attaches decoded payload { id, email, role } to req.user.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Malformed authorization token.',
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({
      success: false,
      message: 'Server authentication configuration error.',
    });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Authentication token has expired. Please log in again.',
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.',
      });
    }

    // Attach authenticated user claims to request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  });
};

/**
 * Middleware to enforce role-based access control for administrators.
 * Requires authenticateToken middleware to execute first.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required before checking permissions.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Administrator privileges required.',
    });
  }

  next();
};

/**
 * Generic helper middleware to authorize arbitrary list of allowed roles.
 * @param  {...string} allowedRoles - e.g. 'admin', 'customer'
 */
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required before checking permissions.',
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. You do not have permission to access this resource.',
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  authorizeRoles,
};
