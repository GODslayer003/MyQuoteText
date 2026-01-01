// ============================================
// src/api/middleware/rateLimit.middleware.js
// ============================================

const rateLimit = require('express-rate-limit');
const logger = require('../../utils/logger');

/**
 * Global rate limiter
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Auth limiter
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict limiter
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Job creation limiter (THIS WAS MISSING)
 */
const jobCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Job creation rate limit exceeded: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many jobs created. Please try again later.'
    });
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  strictLimiter,
  jobCreationLimiter // ✅ REQUIRED
};