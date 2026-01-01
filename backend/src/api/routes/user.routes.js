const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middleware/auth.middleware');

// All user routes require authentication
router.use(authMiddleware.authenticate);

// Get profile
router.get('/me', UserController.getProfile);

// Update profile
router.put('/me', UserController.updateProfile);

// Change password
router.put('/me/password', UserController.changePassword);

// Get statistics
router.get('/me/stats', UserController.getStats);

// Delete account
router.delete('/me', UserController.deleteAccount);

module.exports = router;