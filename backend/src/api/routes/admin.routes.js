// backend/src/api/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Payment = require('../../models/Payment');
const AuditLog = require('../../models/AuditLog');
const { authenticate } = require('../middleware/auth.middleware');

// Simple role guard
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
    return next();
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Access check failed' });
  }
};

// Admin login using fixed credentials from env or defaults provided by request
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rohan@gmail.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Roohan00327!';

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    await AuditLog.log({ action: 'admin.access', severity: 'warning', metadata: { email, ipAddress: req.ip, userAgent: req.get('user-agent') }, result: 'failure' });
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  // Ensure an admin user exists (idempotent)
  let adminUser = await User.findOne({ email: ADMIN_EMAIL });
  if (!adminUser) {
    adminUser = await User.create({ email: ADMIN_EMAIL, passwordHash: ADMIN_PASSWORD, firstName: 'Admin', lastName: 'User', role: 'admin', emailVerified: true });
  } else if (adminUser.role !== 'admin') {
    adminUser.role = 'admin';
    await adminUser.save();
  }

  const accessToken = jwt.sign({ userId: adminUser._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
  const refreshToken = jwt.sign({ userId: adminUser._id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

  await AuditLog.log({ userId: adminUser._id, action: 'admin.access', resourceType: 'user', resourceId: adminUser._id.toString(), metadata: { ipAddress: req.ip, userAgent: req.get('user-agent') }, result: 'success' });

  return res.json({ success: true, data: { user: { id: adminUser._id, email: adminUser.email, role: 'admin', firstName: adminUser.firstName, lastName: adminUser.lastName }, tokens: { accessToken, refreshToken } } });
});

// Stats: total users, standard purchased, premium purchased
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [totalUsers, standardCount, premiumCount] = await Promise.all([
      User.countDocuments({ accountStatus: { $ne: 'deleted' } }),
      Payment.countDocuments({ status: { $in: ['succeeded', 'partially_refunded', 'refunded'] }, tier: 'standard' }),
      Payment.countDocuments({ status: { $in: ['succeeded', 'partially_refunded', 'refunded'] }, tier: 'premium' })
    ]);

    return res.json({ success: true, data: { totalUsers, standardPurchases: standardCount, premiumPurchases: premiumCount } });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// Admin profile get/update
router.get('/me', authenticate, requireAdmin, async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  return res.json({ success: true, data: user });
});

router.put('/me', authenticate, requireAdmin, async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  const updates = {};
  if (email) updates.email = email.toLowerCase();
  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;
  if (password) updates.passwordHash = password; // pre-save hook will hash

  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!user) return res.status(404).json({ success: false, error: 'Admin not found' });

  Object.assign(user, updates);
  await user.save();

  await AuditLog.log({ userId: user._id, action: 'user.profile_update', resourceType: 'user', resourceId: user._id.toString(), metadata: { fields: Object.keys(updates) } });

  const sanitized = await User.findById(user._id).select('-passwordHash');
  return res.json({ success: true, data: sanitized });
});

// Get all users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { accountStatus: { $ne: 'deleted' } };
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    if (status !== 'all' && status !== 'all') {
      query.accountStatus = status;
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-passwordHash').skip(skip).limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    return res.json({ 
      success: true, 
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Get all payments
router.get('/payments', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all', tier = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    
    if (status !== 'all') {
      query.status = status;
    }

    if (tier !== 'all') {
      query.tier = tier;
    }

    const [payments, total] = await Promise.all([
      Payment.find(query).skip(skip).limit(parseInt(limit)).populate('userId', 'email firstName lastName'),
      Payment.countDocuments(query)
    ]);

    return res.json({ 
      success: true, 
      data: payments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
});

module.exports = router;
