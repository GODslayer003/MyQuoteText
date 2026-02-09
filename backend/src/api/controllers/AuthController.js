const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');
const AuthService = require('../../services/auth/AuthService');
const TokenService = require('../../services/auth/TokenService');
const OTP = require('../../models/OTP');
const SMSService = require('../../services/sms/SendSMS');
const logger = require('../../utils/logger');

class AuthController {
  /**
   * Register new user
   * POST /api/v1/auth/register
   */
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone, isPhoneVerified } = req.body;
      const BannedUser = require('../../models/BannedUser');

      // Check if user is banned
      const isBanned = await BannedUser.findOne({ $or: [{ email: email.toLowerCase() }, { phone: phone }] });
      if (isBanned) {
        return res.status(403).json({
          success: false,
          error: 'This account has been suspended permanently.'
        });
      }

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
        phoneVerified: isPhoneVerified || false,
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
            avatarUrl: user.avatarUrl,
            phoneVerified: user.phoneVerified
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
      const BannedUser = require('../../models/BannedUser');

      // Check if user is banned
      const isBanned = await BannedUser.findOne({ email: email.toLowerCase() });
      if (isBanned) {
        return res.status(403).json({
          success: false,
          error: 'Your account has been suspended permanently due to a violation of our terms.'
        });
      }

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
      user.security.lastLoginAt = new Date();
      await user.save();

      // Check if user has phone number for OTP verification
      if (user.phone) {
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save/Update OTP in DB
        await OTP.findOneAndUpdate(
          { phone: user.phone },
          { code, expiresAt, attempts: 0 },
          { upsert: true, new: true }
        );

        // Send SMS via ClickSend
        const smsResult = await SMSService.sendVerificationCode(user.phone, code);

        if (!smsResult.success) {
          logger.error(`Failed to send login OTP to ${user.phone}: ${smsResult.error}`);
          // Fallback: If SMS fails, we might want to allow login OR fail. 
          // For now, let's fail as the user requested OTP verification.
          return res.status(500).json({
            success: false,
            error: 'Failed to send verification code. Please try again.'
          });
        }

        logger.info(`Login OTP sent to ${user.phone}`);

        return res.json({
          success: true,
          requiresOtp: true,
          data: {
            phone: user.phone
          }
        });
      }

      // Generate tokens if no phone (fallback/admin without phone)
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
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified
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
  /**
   * Send OTP to mobile number
   * POST /api/v1/auth/send-otp
   */
  async sendOtp(req, res, next) {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save/Update OTP in DB
      await OTP.findOneAndUpdate(
        { phone },
        { code, expiresAt, attempts: 0 },
        { upsert: true, new: true }
      );

      // Send SMS via ClickSend
      const smsResult = await SMSService.sendVerificationCode(phone, code);

      if (!smsResult.success) {
        logger.error(`Failed to send OTP to ${phone}: ${smsResult.error}`);
        return res.status(500).json({
          success: false,
          error: smsResult.error || 'Failed to send SMS. Please try again later.'
        });
      }

      logger.info(`OTP sent to ${phone}`);

      res.json({
        success: true,
        message: 'Verification code sent successfully'
      });
    } catch (error) {
      logger.error('Send OTP failed:', error);
      next(error);
    }
  }

  /**
   * Verify OTP
   * POST /api/v1/auth/verify-otp
   */
  async verifyOtp(req, res, next) {
    try {
      const { phone, code } = req.body;

      if (!phone || !code) {
        return res.status(400).json({
          success: false,
          error: 'Phone number and code are required'
        });
      }

      const otpRecord = await OTP.findOne({ phone });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired code'
        });
      }

      if (otpRecord.code !== code) {
        otpRecord.attempts += 1;
        await otpRecord.save();

        if (otpRecord.attempts >= 5) {
          await OTP.deleteOne({ phone });
          return res.status(400).json({
            success: false,
            error: 'Too many failed attempts. Please request a new code.'
          });
        }

        return res.status(400).json({
          success: false,
          error: 'Invalid verification code'
        });
      }

      // Success - Delete OTP record
      await OTP.deleteOne({ phone });

      // Check if user exists with this phone
      const user = await User.findOne({ phone });
      let tokens = null;

      if (user) {
        user.phoneVerified = true;
        await user.save();

        // Generate tokens for login flow
        const accessToken = TokenService.generateAccessToken(user._id);
        const refreshToken = TokenService.generateRefreshToken(user._id);
        tokens = {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN
        };

        // Audit log for login via OTP
        await AuditLog.log({
          userId: user._id,
          action: 'user.login.otp_verified',
          resourceType: 'user',
          resourceId: user._id.toString(),
          metadata: {
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          }
        });
      }

      res.json({
        success: true,
        message: 'Mobile number verified successfully',
        data: user ? {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            phoneVerified: user.phoneVerified
          },
          tokens
        } : null
      });
    } catch (error) {
      logger.error('Verify OTP failed:', error);
      next(error);
    }
  }
}

module.exports = new AuthController();