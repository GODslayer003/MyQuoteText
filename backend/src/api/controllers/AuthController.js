const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');
const AuthService = require('../../services/auth/AuthService');
const TokenService = require('../../services/auth/TokenService');
const logger = require('../../utils/logger');

class AuthController {
  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone } = req.body;

      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email already registered'
        });
      }

      // Create user
      const user = await User.create({
        email: email.toLowerCase(),
        passwordHash: password,
        firstName,
        lastName,
        phone,
        metadata: {
          registrationSource: 'manual',
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      // Generate tokens
      const accessToken = TokenService.generateAccessToken(user._id);
      const refreshToken = TokenService.generateRefreshToken(user._id);

      // Audit log
      await AuditLog.log({
        userId: user._id,
        action: 'user.register',
        resourceType: 'user',
        resourceId: user._id.toString(),
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      logger.info(`User registered: ${user.email}`);

      // Send welcome email (non-blocking)
      const EmailService = require('../../services/email/EmailService');
      EmailService.sendWelcomeEmail(user).catch(err => logger.error('Failed to send welcome email:', err));

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN
          }
        }
      });
    } catch (error) {
      logger.error('Registration failed:', error);
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findByEmail(email).select('+passwordHash');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // ReCAPTCHA Verification (Optional but recommended)
      const { captchaToken } = req.body;
      if (captchaToken) {
        // Verify with Google
        // const isRecaptchaValid = await AuthService.verifyRecaptcha(captchaToken);
        // if (!isRecaptchaValid) return res.status(400).json({ error: 'Invalid captcha' });
      }

      // Check if account is locked
      if (user.isLocked) {
        const remainingTime = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        return res.status(423).json({
          success: false,
          error: `Account is locked. Try again in ${remainingTime} minutes.`,
          lockUntil: user.lockUntil
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        await user.incLoginAttempts();

        // Re-check lock status after increment
        if (user.isLocked) {
          const remainingTime = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
          return res.status(423).json({
            success: false,
            error: `Account is locked. Try again in ${remainingTime} minutes.`,
            lockUntil: user.lockUntil
          });
        }

        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }

      // Reset login attempts on success
      if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Update last login
      // user.updateLastLogin(); // Use model method if available or manual:
      user.security.lastLoginAt = new Date();
      await user.save();

      // Generate tokens
      const accessToken = TokenService.generateAccessToken(user._id);
      const refreshToken = TokenService.generateRefreshToken(user._id);

      // Audit log
      await AuditLog.log({
        userId: user._id,
        action: 'user.login',
        resourceType: 'user',
        resourceId: user._id.toString(),
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        }
      });

      logger.info(`User logged in: ${user.email}`);

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            emailVerified: user.emailVerified
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN
          }
        }
      });
    } catch (error) {
      logger.error('Login failed:', error);
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = TokenService.verifyRefreshToken(refreshToken);

      if (!decoded) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired refresh token'
        });
      }

      // Find user
      const user = await User.findById(decoded.userId);

      if (!user || user.accountStatus !== 'active') {
        return res.status(401).json({
          success: false,
          error: 'User not found or inactive'
        });
      }

      // Generate new tokens
      const newAccessToken = TokenService.generateAccessToken(user._id);
      const newRefreshToken = TokenService.generateRefreshToken(user._id);

      res.json({
        success: true,
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: process.env.JWT_EXPIRES_IN
          }
        }
      });
    } catch (error) {
      logger.error('Token refresh failed:', error);
      next(error);
    }
  }

  /**
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);

      // Don't reveal if user exists
      if (!user) {
        return res.json({
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link.'
        });
      }

      // Generate reset token
      const resetToken = await AuthService.generatePasswordResetToken(user);

      // Send reset email (queue it)
      const { emailQueue } = require('../../config/queue');
      await emailQueue.add('send-email', {
        to: user.email,
        template: 'password_reset',
        data: {
          resetToken,
          userName: user.firstName
        }
      });

      logger.info(`Password reset requested for: ${user.email}`);

      res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    } catch (error) {
      logger.error('Forgot password failed:', error);
      next(error);
    }
  }

  /**
   * Reset password
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      const user = await AuthService.verifyPasswordResetToken(token);

      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired reset token'
        });
      }

      // Update password
      user.passwordHash = newPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      // Audit log
      await AuditLog.log({
        userId: user._id,
        action: 'user.password_reset',
        resourceType: 'user',
        resourceId: user._id.toString(),
        metadata: {
          ipAddress: req.ip
        }
      });

      logger.info(`Password reset successful for: ${user.email}`);

      res.json({
        success: true,
        message: 'Password has been reset successfully'
      });
    } catch (error) {
      logger.error('Password reset failed:', error);
      next(error);
    }
  }

  /**
   * Logout
   * POST /api/v1/auth/logout
   */
  async logout(req, res, next) {
    try {
      // Audit log
      await AuditLog.log({
        userId: req.user._id,
        action: 'user.logout',
        resourceType: 'user',
        resourceId: req.user._id.toString(),
        metadata: {
          ipAddress: req.ip
        }
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout failed:', error);
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user._id)
        .select('-passwordHash -emailVerificationToken -passwordResetToken');

      res.json({
        success: true,
        data: {
          user
        }
      });
    } catch (error) {
      logger.error('Get current user failed:', error);
      next(error);
    }
  }
}

module.exports = new AuthController();