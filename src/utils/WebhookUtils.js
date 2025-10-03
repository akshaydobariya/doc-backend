const crypto = require('crypto');
const { promisify } = require('util');

/**
 * Webhook utility functions for Google Calendar integration
 */
class WebhookUtils {
  /**
   * Generate HMAC signature for webhook payload
   * @param {string} payload - The webhook payload
   * @param {string} secret - The webhook secret
   * @returns {string} - The HMAC signature
   */
  static generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature from Google Calendar
   * @param {string} signature - The signature from X-Goog-Signature header
   * @param {string} payload - The webhook payload
   * @param {string} secret - The webhook secret
   * @returns {boolean} - Whether the signature is valid
   */
  static verifySignature(signature, payload, secret) {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Generate a new channel ID for webhook
   * @returns {string} - UUID v4 channel ID
   */
  static generateChannelId() {
    return crypto.randomUUID();
  }

  /**
   * Calculate webhook expiration time
   * @param {number} durationDays - Duration in days
   * @returns {string} - ISO string of expiration time
   */
  static calculateExpiration(durationDays = 7) {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + durationDays);
    return expiration.toISOString();
  }

  /**
   * Validate webhook headers
   * @param {Object} headers - The webhook request headers
   * @returns {boolean} - Whether the headers are valid
   */
  static validateHeaders(headers) {
    const requiredHeaders = [
      'x-goog-channel-id',
      'x-goog-resource-id',
      'x-goog-resource-state',
      'x-goog-message-number'
    ];

    return requiredHeaders.every(header => 
      headers[header] || headers[header.toLowerCase()]
    );
  }

  /**
   * Parse webhook notification type
   * @param {Object} headers - The webhook request headers
   * @returns {string} - The notification type
   */
  static getNotificationType(headers) {
    const state = headers['x-goog-resource-state'] || 
                 headers['x-goog-resource-state'.toLowerCase()];
    
    switch(state) {
      case 'sync':
        return 'SYNC';
      case 'exists':
        return 'UPDATE';
      case 'not_exists':
        return 'DELETE';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Check if webhook is expiring soon
   * @param {Date} expirationDate - The webhook expiration date
   * @param {number} thresholdHours - Hours threshold before expiration
   * @returns {boolean} - Whether the webhook is expiring soon
   */
  static isExpiringSoon(expirationDate, thresholdHours = 24) {
    const now = new Date();
    const threshold = thresholdHours * 60 * 60 * 1000; // Convert to milliseconds
    return (expirationDate.getTime() - now.getTime()) <= threshold;
  }

  /**
   * Create webhook notification payload
   * @param {Object} data - The webhook data
   * @returns {Object} - Formatted webhook payload
   */
  static createNotificationPayload(data) {
    return {
      channelId: data.channelId,
      resourceId: data.resourceId,
      resourceState: data.resourceState,
      messageNumber: data.messageNumber,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = WebhookUtils;