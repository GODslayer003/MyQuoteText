// // StripeService.js
// const Stripe = require('stripe');
// const crypto = require('crypto');
// const logger = require('../../utils/logger');
// const Payment = require('../../models/Payment');
// const Job = require('../../models/Job');
// const AuditLog = require('../../models/AuditLog');

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// class StripeService {
//   constructor() {
//     this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
//   }

//   /**
//    * Create payment intent for job unlock
//    * @param {Object} jobData - Job information
//    * @param {string} tier - 'standard' or 'premium'
//    * @param {Object} customerData - Customer information
//    * @returns {Promise<Object>} Payment intent and client secret
//    */
//   async createPaymentIntent(jobData, tier, customerData) {
//     try {
//       // Get price based on tier
//       const amount = this._getTierAmount(tier);

//       // Generate idempotency key to prevent duplicate charges
//       const idempotencyKey = this._generateIdempotencyKey(jobData.jobId, tier);

//       // Create or retrieve Stripe customer
//       const customer = await this._getOrCreateCustomer(customerData);

//       // Create payment intent
//       const paymentIntent = await stripe.paymentIntents.create({
//         amount: amount,
//         currency: 'aud',
//         customer: customer.id,
//         receipt_email: customerData.email,
//         description: `MyQuoteMate ${tier} analysis - Job ${jobData.jobId}`,
//         metadata: {
//           jobId: jobData.jobId,
//           tier: tier,
//           userId: customerData.userId || 'guest'
//         },
//         automatic_payment_methods: {
//           enabled: true
//         }
//       }, {
//         idempotencyKey: idempotencyKey
//       });

//       // Create payment record in database
//       const payment = await Payment.create({
//         userId: customerData.userId || null,
//         jobId: jobData._id,
//         stripePaymentIntentId: paymentIntent.id,
//         stripeCustomerId: customer.id,
//         amount: amount,
//         currency: 'aud',
//         status: 'pending',
//         tier: tier,
//         billingDetails: {
//           name: customerData.name,
//           email: customerData.email,
//           phone: customerData.phone
//         },
//         idempotencyKey: idempotencyKey,
//         metadata: {
//           ipAddress: customerData.ipAddress,
//           userAgent: customerData.userAgent,
//           source: 'web'
//         }
//       });

//       // Audit log
//       await AuditLog.log({
//         userId: customerData.userId || null,
//         action: 'payment.initiated',
//         resourceType: 'payment',
//         resourceId: payment._id.toString(),
//         details: {
//           jobId: jobData.jobId,
//           tier: tier,
//           amount: amount,
//           paymentIntentId: paymentIntent.id
//         },
//         metadata: {
//           ipAddress: customerData.ipAddress
//         }
//       });

//       logger.info(`Payment intent created: ${paymentIntent.id} for job ${jobData.jobId}`);

//       return {
//         paymentIntentId: paymentIntent.id,
//         clientSecret: paymentIntent.client_secret,
//         amount: amount,
//         currency: 'aud',
//         customerId: customer.id
//       };
//     } catch (error) {
//       logger.error('Failed to create payment intent:', error);
//       throw new Error('Payment initialization failed. Please try again.');
//     }
//   }

//   /**
//    * Handle Stripe webhook events
//    * @param {Object} request - Express request object
//    * @returns {Promise<Object>} Processing result
//    */
//   async handleWebhook(request) {
//     const sig = request.headers['stripe-signature'];
//     let event;

//     try {
//       // Verify webhook signature
//       event = stripe.webhooks.constructEvent(
//         request.body,
//         sig,
//         this.webhookSecret
//       );
//     } catch (err) {
//       logger.error('Webhook signature verification failed:', err);
//       throw new Error('Webhook signature verification failed');
//     }

//     logger.info(`Processing webhook event: ${event.type}`);

//     try {
//       // Handle different event types
//       switch (event.type) {
//         case 'payment_intent.succeeded':
//           await this._handlePaymentSuccess(event.data.object);
//           break;

//         case 'payment_intent.payment_failed':
//           await this._handlePaymentFailed(event.data.object);
//           break;

//         case 'charge.refunded':
//           await this._handleRefund(event.data.object);
//           break;

//         case 'payment_intent.canceled':
//           await this._handlePaymentCanceled(event.data.object);
//           break;

//         default:
//           logger.info(`Unhandled event type: ${event.type}`);
//       }

//       return { received: true, eventType: event.type };
//     } catch (error) {
//       logger.error(`Error processing webhook ${event.type}:`, error);
//       throw error;
//     }
//   }

//   /**
//    * Handle successful payment
//    */
//   async _handlePaymentSuccess(paymentIntent) {
//     try {
//       // Find payment record
//       const payment = await Payment.findByPaymentIntent(paymentIntent.id);

//       if (!payment) {
//         logger.error(`Payment not found for intent: ${paymentIntent.id}`);
//         return;
//       }

//       // Check idempotency - prevent duplicate processing
//       const existingEvent = payment.webhookEvents.find(
//         e => e.eventId === paymentIntent.id && e.eventType === 'payment_intent.succeeded'
//       );

//       if (existingEvent && existingEvent.processed) {
//         logger.info(`Duplicate webhook event ignored: ${paymentIntent.id}`);
//         return;
//       }

//       // Update payment status
//       await payment.markAsSucceeded(
//         paymentIntent.charges?.data[0]?.id,
//         new Date(paymentIntent.created * 1000)
//       );

//       // Record webhook event
//       await payment.recordWebhookEvent(paymentIntent.id, 'payment_intent.succeeded');

//       // CRITICAL: Unlock the job
//       const job = await Job.findById(payment.jobId);
//       if (job) {
//         await job.unlock();
//         logger.info(`Job ${job.jobId} unlocked after successful payment`);
//       }

//       // Audit log
//       await AuditLog.log({
//         userId: payment.userId,
//         action: 'payment.succeeded',
//         resourceType: 'payment',
//         resourceId: payment._id.toString(),
//         details: {
//           jobId: job?.jobId,
//           amount: payment.amount,
//           paymentIntentId: paymentIntent.id
//         },
//         severity: 'info'
//       });

//       logger.info(`Payment succeeded: ${paymentIntent.id}`);
//     } catch (error) {
//       logger.error('Error handling payment success:', error);
//       throw error;
//     }
//   }

//   /**
//    * Handle failed payment
//    */
//   async _handlePaymentFailed(paymentIntent) {
//     try {
//       const payment = await Payment.findByPaymentIntent(paymentIntent.id);

//       if (!payment) return;

//       await payment.markAsFailed(
//         paymentIntent.last_payment_error?.code,
//         paymentIntent.last_payment_error?.message
//       );

//       await payment.recordWebhookEvent(paymentIntent.id, 'payment_intent.payment_failed');

//       // Audit log
//       await AuditLog.log({
//         userId: payment.userId,
//         action: 'payment.failed',
//         resourceType: 'payment',
//         resourceId: payment._id.toString(),
//         details: {
//           failureCode: paymentIntent.last_payment_error?.code,
//           failureMessage: paymentIntent.last_payment_error?.message
//         },
//         severity: 'warning'
//       });

//       logger.warn(`Payment failed: ${paymentIntent.id}`);
//     } catch (error) {
//       logger.error('Error handling payment failure:', error);
//     }
//   }

//   /**
//    * Handle refund
//    */
//   async _handleRefund(charge) {
//     try {
//       const payment = await Payment.findOne({ stripeChargeId: charge.id });

//       if (!payment) return;

//       const refund = charge.refunds.data[0];

//       await payment.addRefund({
//         id: refund.id,
//         amount: refund.amount,
//         reason: refund.reason,
//         status: refund.status
//       });

//       // If fully refunded, lock the job again
//       if (payment.isFullyRefunded) {
//         const job = await Job.findById(payment.jobId);
//         if (job) {
//           job.unlocked = false;
//           await job.save();
//           logger.info(`Job ${job.jobId} locked after full refund`);
//         }
//       }

//       // Audit log
//       await AuditLog.log({
//         userId: payment.userId,
//         action: 'payment.refund',
//         resourceType: 'payment',
//         resourceId: payment._id.toString(),
//         details: {
//           refundAmount: refund.amount,
//           refundReason: refund.reason,
//           fullyRefunded: payment.isFullyRefunded
//         },
//         severity: 'warning'
//       });

//       logger.info(`Refund processed: ${refund.id}`);
//     } catch (error) {
//       logger.error('Error handling refund:', error);
//     }
//   }

//   /**
//    * Handle canceled payment
//    */
//   async _handlePaymentCanceled(paymentIntent) {
//     try {
//       const payment = await Payment.findByPaymentIntent(paymentIntent.id);

//       if (!payment) return;

//       payment.status = 'cancelled';
//       payment.cancelledAt = new Date();
//       await payment.save();

//       await payment.recordWebhookEvent(paymentIntent.id, 'payment_intent.canceled');

//       logger.info(`Payment canceled: ${paymentIntent.id}`);
//     } catch (error) {
//       logger.error('Error handling payment cancellation:', error);
//     }
//   }

//   /**
//    * Get or create Stripe customer
//    */
//   async _getOrCreateCustomer(customerData) {
//     // Check if customer exists
//     if (customerData.stripeCustomerId) {
//       try {
//         const customer = await stripe.customers.retrieve(customerData.stripeCustomerId);
//         if (!customer.deleted) {
//           return customer;
//         }
//       } catch (error) {
//         logger.warn(`Failed to retrieve customer ${customerData.stripeCustomerId}`);
//       }
//     }

//     // Create new customer
//     const customer = await stripe.customers.create({
//       email: customerData.email,
//       name: customerData.name,
//       phone: customerData.phone,
//       metadata: {
//         userId: customerData.userId || 'guest'
//       }
//     });

//     return customer;
//   }

//   /**
//    * Get tier pricing
//    */
//   _getTierAmount(tier) {
//     const prices = {
//       standard: 2900, // $29.00 AUD
//       premium: 4900   // $49.00 AUD
//     };

//     return prices[tier] || prices.standard;
//   }

//   /**
//    * Generate idempotency key
//    */
//   _generateIdempotencyKey(jobId, tier) {
//     const data = `${jobId}-${tier}-${Date.now()}`;
//     return crypto.createHash('sha256').update(data).digest('hex');
//   }

//   /**
//    * Create refund
//    */
//   async createRefund(paymentId, amount = null, reason = 'requested_by_customer') {
//     try {
//       const payment = await Payment.findById(paymentId);

//       if (!payment || payment.status !== 'succeeded') {
//         throw new Error('Payment not found or not in succeeded state');
//       }

//       const refund = await stripe.refunds.create({
//         payment_intent: payment.stripePaymentIntentId,
//         amount: amount, // null = full refund
//         reason: reason
//       });

//       await payment.addRefund({
//         id: refund.id,
//         amount: refund.amount,
//         reason: refund.reason,
//         status: refund.status
//       });

//       logger.info(`Refund created: ${refund.id} for payment ${payment._id}`);

//       return refund;
//     } catch (error) {
//       logger.error('Failed to create refund:', error);
//       throw error;
//     }
//   }
// }

// module.exports = new StripeService();



// ============================================
// src/services/payment/StripeService.js
// MOCK + STRIPE READY
// ============================================

const Payment = require('../../models/Payment');
const Job = require('../../models/Job');
const logger = require('../../utils/logger');

const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'mock';

const PRICING = {
  Standard: 7.99,
  Premium: 9.99
};

class StripeService {
  // ------------------------------------------
  // CREATE PAYMENT INTENT
  // ------------------------------------------
  async createPaymentIntent(job, tier, metadata = {}) {
    if (!PRICING[tier]) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    if (PAYMENT_PROVIDER === 'mock') {
      return this.createMockPayment(job, tier, metadata);
    }

    throw new Error('Stripe is not configured yet');
  }

  // ------------------------------------------
  // MOCK PAYMENT (NO STRIPE)
  // ------------------------------------------
  async createMockPayment(job, tier, metadata) {
    try {
      const amount = PRICING[tier];

      const payment = await Payment.create({
        userId: metadata.userId,
        jobId: job._id,
        stripePaymentIntentId: `mock_${Date.now()}`,
        amount,
        currency: 'AUD',
        status: 'succeeded',
        tier,
        paidAt: new Date(),
        metadata: {
          source: 'mock',
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent
        }
      });

      // 🔓 Unlock job immediately
      job.tier = tier;
      job.status = 'completed';
      job.unlocked = true;
      await job.save();

      logger.info('Mock payment succeeded', {
        paymentId: payment._id,
        jobId: job.jobId
      });

      return {
        paymentId: payment._id,
        amount,
        currency: 'AUD',
        status: 'succeeded',
        provider: 'mock'
      };
    } catch (error) {
      logger.error('Mock payment failed:', error);
      throw error;
    }
  }

  // ------------------------------------------
  // WEBHOOK (NO-OP FOR MOCK)
  // ------------------------------------------
  async handleWebhook() {
    return true;
  }
}

module.exports = new StripeService();
