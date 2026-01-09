// backend/src/api/middleware/rateLimit.middleware.js
const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP + user ID for authenticated users
    return req.user?._id ? `${req.ip}-${req.user._id}` : req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/health/detailed';
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  keyGenerator: (req) => req.ip
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: 'Too many file uploads, please try again after 1 hour'
  },
  standardHeaders: true,
  keyGenerator: (req) => req.user?._id ? req.user._id.toString() : req.ip
});

/**
 * API key rate limiter
 */
const apiKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    error: 'API rate limit exceeded'
  },
  keyGenerator: (req) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    return apiKey || req.ip;
  }
});

/**
 * Strict rate limiter for password reset endpoints
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 attempts per hour
  message: {
    success: false,
    error: 'Too many attempts, please try again after 1 hour'
  },
  standardHeaders: true,
  keyGenerator: (req) => req.ip
});

module.exports = {
  globalLimiter,
  authLimiter,
  uploadLimiter,
  apiKeyLimiter,
  strictLimiter
};