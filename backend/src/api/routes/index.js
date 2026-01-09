// backend/src/api/routes/index.js
const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth.routes');
const jobRoutes = require('./job.routes');
const userRoutes = require('./user.routes');
const uploadRoutes = require('./upload.routes');
const adminRoutes = require('./admin.routes');
const pricingRoutes = require('./pricing.routes');
const discountRoutes = require('./discount.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/admin', adminRoutes);
router.use('/pricing', pricingRoutes);
router.use('/discounts', discountRoutes);

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString(),
    version: 'v1'
  });
});

module.exports = router;