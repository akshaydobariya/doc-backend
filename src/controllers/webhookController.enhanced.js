const { client } = require('../config/google');
const EnhancedWebhookService = require('../services/webhookService.enhanced');
const webhookService = new EnhancedWebhookService(client);

/**
 * Enhanced Webhook controller for handling Google Calendar notifications
 */
class EnhancedWebhookController {
  /**
   * Setup webhook for a user's calendar
   */
  static async setupWebhook(req, res) {
    try {
      const userId = req.user?._id || req.session?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'User not authenticated'
        });
      }

      const result = await webhookService.setupWebhook(userId);

      res.json({
        message: 'Webhook setup successful',
        data: result
      });
    } catch (error) {
      console.error('❌ Webhook setup error:', error);
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
      // Immediately respond to Google to prevent timeout
      res.status(200).send('OK');

      // Process webhook asynchronously
      setImmediate(async () => {
        try {
          await webhookService.handleNotification(req.webhook);
          console.log('✅ Webhook processed successfully');
        } catch (error) {
          console.error('❌ Async webhook processing error:', error);
        }
      });
    } catch (error) {
      console.error('❌ Webhook handling error:', error);
      // Already sent response, just log the error
    }
  }

  /**
   * Renew webhook subscription before expiration
   */
  static async renewWebhook(req, res) {
    try {
      const userId = req.user?._id || req.session?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'User not authenticated'
        });
      }

      const result = await webhookService.renewWebhook(userId);

      res.json({
        message: 'Webhook renewed successfully',
        data: result
      });
    } catch (error) {
      console.error('❌ Webhook renewal error:', error);
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
      const userId = req.user?._id || req.session?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'User not authenticated'
        });
      }

      await webhookService.stopWebhook(userId);

      res.json({
        message: 'Webhook stopped successfully'
      });
    } catch (error) {
      console.error('❌ Webhook stop error:', error);
      res.status(500).json({
        error: 'Failed to stop webhook',
        message: error.message
      });
    }
  }

  /**
   * Check webhook status
   */
  static async checkWebhookStatus(req, res) {
    try {
      const userId = req.user?._id || req.session?.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'User not authenticated'
        });
      }

      const CalendarSync = require('../models/CalendarSync');
      const sync = await CalendarSync.findOne({ userId });

      if (!sync) {
        return res.json({
          status: 'not_configured',
          message: 'Webhook not configured'
        });
      }

      const now = new Date();
      const expiration = new Date(sync.expiration);
      const hoursUntilExpiration = (expiration - now) / (1000 * 60 * 60);

      res.json({
        status: hoursUntilExpiration > 0 ? 'active' : 'expired',
        channelId: sync.channelId,
        expiration: sync.expiration,
        hoursUntilExpiration: Math.max(0, hoursUntilExpiration),
        lastSyncTime: sync.lastSyncTime
      });
    } catch (error) {
      console.error('❌ Webhook status check error:', error);
      res.status(500).json({
        error: 'Failed to check webhook status',
        message: error.message
      });
    }
  }

  /**
   * Manual trigger for checking and renewing expiring webhooks (admin only)
   */
  static async checkAndRenewExpiring(req, res) {
    try {
      const results = await webhookService.checkAndRenewExpiring();

      res.json({
        message: 'Webhook renewal check completed',
        results
      });
    } catch (error) {
      console.error('❌ Webhook renewal check error:', error);
      res.status(500).json({
        error: 'Failed to check and renew webhooks',
        message: error.message
      });
    }
  }
}

module.exports = EnhancedWebhookController;
