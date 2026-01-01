// ============================================
// src/services/auth/TokenService.js
// ============================================
const jwt = require('jsonwebtoken');
const appConfig = require('../../config/app');
const logger = require('../../utils/logger');

class TokenService {
  /**
   * Generate access token
   */
  generateAccessToken(userId) {
    try {
      return jwt.sign(
        { userId: userId.toString() },
        appConfig.security.jwtSecret,
        { expiresIn: appConfig.security.jwtExpiresIn }
      );
    } catch (error) {
      logger.error('Failed to generate access token:', error);
      throw error;
    }
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    try {
      return jwt.sign(
        { 
          userId: userId.toString(),
          type: 'refresh'
        },
        appConfig.security.jwtRefreshSecret,
        { expiresIn: appConfig.security.jwtRefreshExpiresIn }
      );
    } catch (error) {
      logger.error('Failed to generate refresh token:', error);
      throw error;
    }
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, appConfig.security.jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('Access token expired');
      } else if (error.name === 'JsonWebTokenError') {
        logger.debug('Invalid access token');
      } else {
        logger.error('Token verification error:', error);
      }
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, appConfig.security.jwtRefreshSecret);
      
      if (decoded.type !== 'refresh') {
        logger.warn('Invalid token type for refresh');
        return null;
      }
      
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.debug('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        logger.debug('Invalid refresh token');
      } else {
        logger.error('Refresh token verification error:', error);
      }
      return null;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Token decode error:', error);
      return null;
    }
  }

  /**
   * Generate token pair
   */
  generateTokenPair(userId) {
    return {
      accessToken: this.generateAccessToken(userId),
      refreshToken: this.generateRefreshToken(userId),
      expiresIn: appConfig.security.jwtExpiresIn
    };
  }
}

module.exports = new TokenService();