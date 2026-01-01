// src/services/email/EmailService.js
const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    this.from = {
      email: process.env.EMAIL_FROM,
      name: process.env.EMAIL_FROM_NAME || 'MyQuoteMate'
    };
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: `"${this.from.name}" <${this.from.email}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`Email sent to ${to}`, {
        messageId: info.messageId,
        subject
      });

      return info;
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw error;
    }
  }

  /**
   * Send analysis complete email
   */
  async sendAnalysisComplete(to, data) {
    const subject = 'Your Quote Analysis is Ready';
    const html = this.buildAnalysisCompleteTemplate(data);

    return this.sendEmail(to, subject, html);
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(to, data) {
    const subject = 'Payment Confirmation - MyQuoteMate';
    const html = this.buildPaymentConfirmationTemplate(data);

    return this.sendEmail(to, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(to, resetToken) {
    const subject = 'Reset Your Password - MyQuoteMate';
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = this.buildPasswordResetTemplate(resetUrl);

    return this.sendEmail(to, subject, html);
  }

  /**
   * Template builders
   */
  buildAnalysisCompleteTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Quote Analysis is Ready!</h1>
          </div>
          <div class="content">
            <p>Good news! We've completed the analysis of your contractor quote.</p>
            ${data.hasPaymentRequired ? 
              '<p><strong>To view the full analysis, please complete payment.</strong></p>' :
              '<p>Your analysis is ready to view now.</p>'
            }
            <a href="${process.env.FRONTEND_URL}/jobs/${data.jobId}" class="button">View Analysis</a>
            <p>If you have any questions, please don't hesitate to contact us.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} MyQuoteMate. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  buildPaymentConfirmationTemplate(data) {
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Confirmed</h1>
          </div>
          <div class="content">
            <p>Thank you for your payment of $${(data.amount / 100).toFixed(2)} AUD.</p>
            <p>Your ${data.tier} analysis is now unlocked and ready to view.</p>
            <a href="${process.env.FRONTEND_URL}/jobs/${data.jobId}" class="button">View Full Analysis</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  buildPasswordResetTemplate(resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>You requested to reset your password. Click the button below to proceed:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }
}

module.exports = new EmailService();