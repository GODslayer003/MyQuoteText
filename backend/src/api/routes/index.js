// src/api/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const jobRoutes = require('./job.routes');
const paymentRoutes = require('./payment.routes');
const userRoutes = require('./user.routes');
const webhookRoutes = require('./webhook.routes');
const uploadRoutes = require('./upload.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/payments', paymentRoutes);
router.use('/users', userRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/upload', uploadRoutes);

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'MyQuoteMate API',
    version: process.env.API_VERSION || 'v1',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;