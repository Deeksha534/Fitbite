/**
 * In-memory sliding-window rate limiting middleware for sensitive endpoints.
 * Provides protection against brute-force attacks and abuse without external infrastructure.
 */

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 100,                  // Max requests per window
  message = 'Too many requests. Please try again later.',
  keyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown_client',
} = {}) => {
  const hits = new Map();

  // Periodic cleanup of expired window entries every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  if (cleanupInterval.unref) {
    cleanupInterval.unref(); // Prevent timer from keeping event loop active
  }

  return (req, res, next) => {
    // Allow bypassing rate limiter if header 'x-skip-rate-limit' is present in test environment
    if (process.env.NODE_ENV === 'test' && req.headers['x-skip-rate-limit']) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    let record = hits.get(key);
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs,
      };
      hits.set(key, record);
    }

    record.count++;

    const remaining = Math.max(0, max - record.count);
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message,
        retry_after_seconds: retryAfterSeconds,
      });
    }

    next();
  };
};

// Specialized pre-configured limiters
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

const checkoutLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many order checkout attempts. Please try again in a few minutes.',
});

const publicLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many requests. Please slow down.',
});

module.exports = {
  createRateLimiter,
  authLimiter,
  checkoutLimiter,
  publicLimiter,
};
