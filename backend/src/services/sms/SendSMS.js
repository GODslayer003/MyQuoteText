// ============================================
// src/services/sms/SendSMS.js
// ============================================

const axios = require('axios');
const smsConfig = require('../../config/sms');
const logger = require('../../utils/logger');

/**
 * ClickSend SMS Service
 * Handles all SMS communications via the ClickSend REST API
 */
class SMSService {
    constructor() {
        this.config = smsConfig;
        this.authHeader = this._createAuthHeader();
    }

    /**
     * Private: Create Basic Auth header for ClickSend
     */
    _createAuthHeader() {
        if (!this.config.username || !this.config.apiKey) return null;
        const credentials = Buffer.from(`${this.config.username}:${this.config.apiKey}`).toString('base64');
        return `Basic ${credentials}`;
    }

    /**
     * Send a single SMS message
     * @param {string} to - Recipient number (E.164 format recommended, e.g., +61400000000)
     * @param {string} body - Message content
     * @param {string} [from] - Optional Sender ID (overrides default)
     * @returns {Promise<Object>} - API Response
     */
    async sendSingleSMS(to, body, from = null) {
        if (!this.config.enabled) {
            logger.warn('[SMS Service] Attempted to send SMS but service is disabled or credentials missing');
            return { success: false, error: 'SMS service disabled' };
        }

        try {
            logger.info(`[SMS Service] Sending SMS to ${to}...`);

            const payload = {
                messages: [
                    {
                        source: 'MyQuoteMate-Backend',
                        from: from || this.config.senderId,
                        body: body,
                        to: to,
                        schedule: 0
                    }
                ]
            };

            const response = await axios.post(this.config.apiUrl, payload, {
                headers: {
                    'Authorization': this.authHeader,
                    'Content-Type': 'application/json'
                }
            });

            // ClickSend returns 200 even for some failures, check response status
            const data = response.data;
            if (data.http_code === 200 && data.response_code === 'SUCCESS') {
                logger.info(`[SMS Service] SMS successfully sent to ${to}. MessageID: ${data.data.messages[0].message_id}`);
                return { success: true, data: data.data };
            } else {
                logger.error('[SMS Service] ClickSend returned an error:', data);
                return { success: false, error: data.response_msg || 'Unknown failure' };
            }

        } catch (error) {
            const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
            logger.error(`[SMS Service] Failed to send SMS to ${to}: ${errorMessage}`);
            return { success: false, error: 'Connection failure or API error' };
        }
    }

    /**
     * Send bulk SMS messages
     * @param {Array<Object>} messages - Array of { to, body } objects
     * @returns {Promise<Object>} - API Response
     */
    async sendBulkSMS(messages) {
        if (!this.config.enabled) {
            logger.warn('[SMS Service] Attempted to send bulk SMS but service is disabled');
            return { success: false, error: 'SMS service disabled' };
        }

        try {
            logger.info(`[SMS Service] Sending bulk SMS to ${messages.length} recipients...`);

            const payload = {
                messages: messages.map(msg => ({
                    source: 'MyQuoteMate-Backend',
                    from: this.config.senderId,
                    body: msg.body,
                    to: msg.to
                }))
            };

            const response = await axios.post(this.config.apiUrl, payload, {
                headers: {
                    'Authorization': this.authHeader,
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data;
            if (data.http_code === 200) {
                logger.info(`[SMS Service] Bulk SMS processed. Success count: ${data.data.messages.filter(m => m.status === 'SUCCESS').length}`);
                return { success: true, data: data.data };
            }

            return { success: false, error: 'Bulk processing failure' };

        } catch (error) {
            logger.error('[SMS Service] Bulk SMS failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send a verification code
     * @param {string} to - Recipient number
     * @param {string} code - The code to send
     */
    async sendVerificationCode(to, code) {
        const body = `Your MyQuoteMate verification code is: ${code}. Valid for 10 minutes.`;
        return this.sendSingleSMS(to, body);
    }

    /**
     * Send analysis completion notification
     * @param {string} to - Recipient number
     * @param {string} quoteName - Name of the quote analyzed
     */
    async sendAnalysisNotification(to, quoteName) {
        const body = `Great news! Your analysis for "${quoteName}" is complete and ready to view. Login to MyQuoteMate to see your detailed report.`;
        return this.sendSingleSMS(to, body);
    }
}

module.exports = new SMSService();
