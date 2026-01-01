// ============================================
// src/api/middleware/error.middleware.js
// ============================================

const logger = require('../../utils/logger');

class ErrorMiddleware {
  handler(err, req, res, next) {
    const statusCode = err.statusCode || 500;

    logger.error('Unhandled error:', {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method
    });

    res.status(statusCode).json({
      success: false,
      error: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack
      })
    });
  }
}

module.exports = new ErrorMiddleware();