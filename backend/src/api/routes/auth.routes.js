const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/auth.middleware');
const validationMiddleware = require('../middleware/validation.middleware');
const rateLimitMiddleware = require('../middleware/rateLimit.middleware');

// Public routes
router.post(
  '/register',
  rateLimitMiddleware.authLimiter,
  validationMiddleware.validateRegistration,
  AuthController.register
);

router.post(
  '/login',
  rateLimitMiddleware.authLimiter,
  validationMiddleware.validateLogin,
  AuthController.login
);

router.post(
  '/refresh',
  AuthController.refresh
);

router.post(
  '/forgot-password',
  rateLimitMiddleware.strictLimiter,
  AuthController.forgotPassword
);

router.post(
  '/reset-password',
  rateLimitMiddleware.strictLimiter,
  AuthController.resetPassword
);

// Protected routes
router.post(
  '/logout',
  authMiddleware.authenticate,
  AuthController.logout
);

router.get(
  '/me',
  authMiddleware.authenticate,
  AuthController.getMe
);

module.exports = router;

// REMOVE EVERYTHING AFTER THIS LINE - NO AuthController CLASS HERE