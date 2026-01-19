// ============================================
// src/api/controllers/paymentController.js
// ============================================
const stripeService = require('../../services/payment/StripeService');
const Payment = require('../../models/Payment');
const Job = require('../../models/Job');
const logger = require('../../utils/logger');

class PaymentController {
  /**
   * Create payment intent
   * POST /api/v1/payments/create-intent
   */
  async createPaymentIntent(req, res, next) {
    try {
      const { jobId, tier, customerData } = req.body;

      // Validate tier
      if (!['standard', 'premium'].includes(tier)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tier. Must be standard or premium.'
        });
      }

      // Find job
      const job = await Job.findOne({ jobId });

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      // Check if already paid
      if (job.unlocked) {
        return res.status(400).json({
          success: false,
          error: 'Job is already unlocked'
        });
      }

      // Check if job is completed
      if (job.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Job analysis not yet complete'
        });
      }

      // Create payment intent
      const paymentIntent = await stripeService.createPaymentIntent(
        job,
        tier,
        {
          ...customerData,
          userId: req.user?._id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      );

      res.status(200).json({
        success: true,
        data: paymentIntent
      });

    } catch (error) {
      logger.error('Payment intent creation failed:', error);
      next(error);
    }
  }

  /**
   * Handle Stripe webhook
   * POST /api/v1/payments/webhook
   */
  async handleWebhook(req, res, next) {
    try {
      await stripeService.handleWebhook(req);

      res.status(200).json({ received: true });

    } catch (error) {
      logger.error('Webhook handling failed:', error);
      res.status(400).json({
        success: false,
        error: 'Webhook Error'
      });
    }
  }

  /**
   * Get payment details
   * GET /api/v1/payments/:paymentId
   */
  async getPayment(req, res, next) {
    try {
      const { paymentId } = req.params;

      const payment = await Payment.findById(paymentId)
        .populate('jobId', 'jobId tier status');

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      // Check ownership
      if (payment.userId?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: {
          id: payment._id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          tier: payment.tier,
          jobId: payment.jobId?.jobId,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt
        }
      });

    } catch (error) {
      logger.error('Failed to fetch payment:', error);
      next(error);
    }
  }

  /**
   * Get user payments
   * GET /api/v1/payments
   */
  async getUserPayments(req, res, next) {
    try {
      const { limit = 20, offset = 0 } = req.query;

      const payments = await Payment.find({
        userId: req.user._id
      })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .populate('jobId', 'jobId tier');

      const total = await Payment.countDocuments({
        userId: req.user._id
      });

      res.json({
        success: true,
        data: {
          payments: payments.map(p => ({
            id: p._id,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            tier: p.tier,
            jobId: p.jobId?.jobId,
            createdAt: p.createdAt,
            paidAt: p.paidAt
          })),
          pagination: {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: offset + payments.length < total
          }
        }
      });

    } catch (error) {
      logger.error('Failed to fetch user payments:', error);
      next(error);
    }
  }

  /**
   * Mock Upgrade (DEV ONLY)
   * POST /api/v1/payments/mock-upgrade
   */
  async mockUpgrade(req, res, next) {
    try {
      const { tier } = req.body;
      const User = require('../../models/User'); // Lazy load to avoid circular deps if any

      if (!['Free', 'Standard', 'Premium'].includes(tier)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tier'
        });
      }

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Update subscription / Credits
      let creditsToAdd = 0;
      if (tier === 'Standard') creditsToAdd = 1;
      if (tier === 'Premium') creditsToAdd = 3; // "3 Reports per Buy"

      user.subscription.credits = (user.subscription.credits || 0) + creditsToAdd;
      user.subscription.reportsTotal = (user.subscription.reportsTotal || 0) + creditsToAdd;
      user.subscription.reportsUsed = 0; // Reset usage for the new purchased batch

      // Update tier only if upgrading to a higher tier or stay in Premium
      const tierLevels = { 'Free': 0, 'Standard': 1, 'Premium': 2 };
      const currentTier = user.subscription.plan || 'Free';

      if (tierLevels[tier] > tierLevels[currentTier] || tier === 'Premium') {
        user.subscription.plan = tier;
      }

      user.subscription.status = 'active';
      user.subscription.currentPeriodStart = new Date();
      // user.subscription.currentPeriodEnd = ... (No expiry for credits, usually)

      await user.save();

      // Log the mock payment
      const payment = new Payment({
        userId: user._id,
        amount: tier === 'Standard' ? 799 : 999,
        currency: 'usd',
        status: 'succeeded',
        provider: 'stripe', // Mocking stripe
        stripePaymentIntentId: 'mock_pi_' + Date.now(),
        tier: tier
      });
      await payment.save();

      // Send receipt email
      const EmailService = require('../../services/email/EmailService');
      await EmailService.sendPaymentReceiptEmail(user, payment);

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            subscription: user.subscription,
            isAdmin: user.isAdmin
          }
        }
      });

    } catch (error) {
      logger.error('Mock upgrade failed:', error);
      next(error);
    }
  }
}

module.exports = new PaymentController();