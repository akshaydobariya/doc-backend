const { client } = require('../config/google');
const WebhookService = require('../services/webhookService');
const webhookService = new WebhookService(client);

/**
 * Webhook controller for handling Google Calendar notifications
 */
class WebhookController {
  /**
   * Setup webhook for a user's calendar
   */
  static async setupWebhook(req, res) {
    try {
      const { userId } = req.body;
      const result = await webhookService.setupWebhook(userId);
      res.json({
        message: 'Webhook setup successful',
        data: result
      });
    } catch (error) {
      console.error('Webhook setup error:', error);
      res.status(500).json({
        error: 'Failed to setup webhook',
        message: error.message
      });
    }
  }

  /**
   * Handle webhook notifications from Google Calendar
   */
  static async handleWebhook(req, res) {
    try {
      await webhookService.handleNotification(req.webhook);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook handling error:', error);
      res.status(500).json({
        error: 'Webhook processing failed',
        message: error.message
      });
    }
  }

  /**
   * Renew webhook subscription before expiration
   */
  static async renewWebhook(req, res) {
    try {
      const { userId } = req.body;
      const result = await webhookService.renewWebhook(userId);
      res.json({
        message: 'Webhook renewed successfully',
        data: result
      });
    } catch (error) {
      console.error('Webhook renewal error:', error);
      res.status(500).json({
        error: 'Failed to renew webhook',
        message: error.message
      });
    }
  }

  /**
   * Stop webhook subscription
   */
  static async stopWebhook(req, res) {
    try {
      const { userId } = req.body;
      await webhookService.stopWebhook(userId);
      res.json({
        message: 'Webhook stopped successfully'
      });
    } catch (error) {
      console.error('Webhook stop error:', error);
      res.status(500).json({
        error: 'Failed to stop webhook',
        message: error.message
      });
    }
  }
}

module.exports = WebhookController;