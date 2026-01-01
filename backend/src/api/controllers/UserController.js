// ============================================
// src/api/controllers/UserController.js
// ============================================
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');
const logger = require('../../utils/logger');

class UserController {
  // Get current user profile
  async getProfile(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          id: req.user._id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          phone: req.user.phone,
          createdAt: req.user.createdAt
        }
      });
    } catch (error) {
      logger.error('Get profile failed:', error);
      next(error);
    }
  }

  // Update profile
  async updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone } = req.body;

      if (firstName !== undefined) req.user.firstName = firstName;
      if (lastName !== undefined) req.user.lastName = lastName;
      if (phone !== undefined) req.user.phone = phone;

      await req.user.save();

      res.json({
        success: true,
        data: req.user
      });
    } catch (error) {
      logger.error('Update profile failed:', error);
      next(error);
    }
  }

  // Change password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const isValid = await req.user.comparePassword(currentPassword);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      req.user.passwordHash = newPassword;
      await req.user.save();

      await AuditLog.log({
        userId: req.user._id,
        action: 'user.password_change',
        resourceType: 'user',
        resourceId: req.user._id.toString()
      });

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      logger.error('Change password failed:', error);
      next(error);
    }
  }

  // User statistics
  async getStats(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          jobsCreated: req.user.jobsCreated || 0,
          lastLoginAt: req.user.lastLoginAt,
          accountCreatedAt: req.user.createdAt
        }
      });
    } catch (error) {
      logger.error('Get stats failed:', error);
      next(error);
    }
  }

  // Delete account (soft delete)
  async deleteAccount(req, res, next) {
    try {
      req.user.deletedAt = new Date();
      await req.user.save();

      await AuditLog.log({
        userId: req.user._id,
        action: 'user.delete',
        resourceType: 'user',
        resourceId: req.user._id.toString()
      });

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      logger.error('Delete account failed:', error);
      next(error);
    }
  }
}

module.exports = new UserController();