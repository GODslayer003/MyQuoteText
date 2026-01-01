// ============================================
// src/api/routes/payment.routes.js
// ============================================

const express = require('express');
const router = express.Router();

const PaymentController = require('../controllers/PaymentController');
const authMiddleware = require('../middleware/auth.middleware');
const validationMiddleware = require('../middleware/validation.middleware');

// Safety wrapper
const safe = (fn, name) => {
  if (typeof fn !== 'function') {
    throw new Error(`Missing or invalid handler: ${name}`);
  }
  return fn;
};

// Create payment intent
router.post(
  '/create-intent',
  safe(validationMiddleware.validatePaymentIntent, 'validatePaymentIntent'),
  safe(authMiddleware.optionalAuth, 'optionalAuth'),
  safe(PaymentController.createPaymentIntent, 'createPaymentIntent')
);

// Get payment details
router.get(
  '/:paymentId',
  safe(authMiddleware.authenticate, 'authenticate'),
  safe(PaymentController.getPayment, 'getPayment')
);

// Get user payments
router.get(
  '/',
  safe(authMiddleware.authenticate, 'authenticate'),
  safe(PaymentController.getUserPayments, 'getUserPayments')
);

module.exports = router;
