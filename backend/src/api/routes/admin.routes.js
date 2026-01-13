// backend/src/api/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

// Public Admin Routes
router.post('/login', AdminController.login);

// Protected Admin Routes
router.use(authenticate, requireAdmin);

router.get('/me', AdminController.getProfile);
router.put('/me', AdminController.updateProfile);

router.get('/stats', AdminController.getStats);
router.get('/users', AdminController.getUsers);
router.patch('/users/:userId', AdminController.updateUserStatus); // Added method for completeness
router.delete('/users/:userId', AdminController.deleteUser);      // Added method for completeness

router.get('/payments', AdminController.getPayments);

module.exports = router;
