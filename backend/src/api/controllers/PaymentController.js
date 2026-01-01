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
}

module.exports = new PaymentController();