// src/services/auth/AuthService.js
const crypto = require('crypto');
const User = require('../../models/User');
const logger = require('../../utils/logger');

class AuthService {
  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(user) {
    try {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      user.passwordResetToken = hashedToken;
      user.passwordResetExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      return resetToken; // Return unhashed token to send in email
    } catch (error) {
      logger.error('Failed to generate password reset token:', error);
      throw error;
    }
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token) {
    try {
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
        accountStatus: 'active'
      }).select('+passwordResetToken +passwordResetExpires');

      return user;
    } catch (error) {
      logger.error('Failed to verify password reset token:', error);
      return null;
    }
  }

  /**
   * Generate email verification token
   */
  async generateEmailVerificationToken(user) {
    try {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

      user.emailVerificationToken = hashedToken;
      user.emailVerificationExpires = Date.now() + 86400000; // 24 hours
      await user.save();

      return verificationToken;
    } catch (error) {
      logger.error('Failed to generate email verification token:', error);
      throw error;
    }
  }

  /**
   * Verify email verification token
   */
  async verifyEmailToken(token) {
    try {
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
      }).select('+emailVerificationToken +emailVerificationExpires');

      if (user) {
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
      }

      return user;
    } catch (error) {
      logger.error('Failed to verify email token:', error);
      return null;
    }
  }
}

module.exports = new AuthService();