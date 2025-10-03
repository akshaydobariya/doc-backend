const CalendarSync = require('../models/CalendarSync');
const WebhookService = require('../services/webhookService');
const { client } = require('../config/google');

class WebhookMonitor {
  constructor() {
    this.webhookService = new WebhookService(client);
  }

  /**
   * Start monitoring webhook health
   */
  async startMonitoring() {
    setInterval(async () => {
      try {
        await this.checkExpiringSyncChannels();
        await this.checkStaleChannels();
      } catch (error) {
        console.error('Webhook monitoring error:', error);
      }
    }, 1000 * 60 * 60); // Check every hour
  }

  /**
   * Check for expiring sync channels
   */
  async checkExpiringSyncChannels() {
    try {
      const expirationThreshold = new Date();
      expirationThreshold.setHours(expirationThreshold.getHours() + 24);

      const expiringSyncs = await CalendarSync.find({
        expiration: { $lt: expirationThreshold }
      }).populate('userId');

      for (const sync of expiringSyncs) {
        try {
          console.log(`Renewing webhook for user ${sync.userId}`);
          await this.webhookService.renewWebhook(sync.userId);
        } catch (error) {
          console.error(`Failed to renew webhook for user ${sync.userId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking expiring sync channels:', error);
    }
  }

  /**
   * Check for stale channels (no updates for a long time)
   */
  async checkStaleChannels() {
    try {
      const staleThreshold = new Date();
      staleThreshold.setHours(staleThreshold.getHours() - 24);

      const staleSyncs = await CalendarSync.find({
        lastSyncTime: { $lt: staleThreshold }
      }).populate('userId');

      for (const sync of staleSyncs) {
        try {
          console.log(`Refreshing stale webhook for user ${sync.userId}`);
          await this.webhookService.renewWebhook(sync.userId);
        } catch (error) {
          console.error(`Failed to refresh stale webhook for user ${sync.userId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking stale channels:', error);
    }
  }

  /**
   * Get webhook health status
   */
  async getHealthStatus() {
    try {
      const totalChannels = await CalendarSync.countDocuments();
      const expiringChannels = await CalendarSync.countDocuments({
        expiration: { $lt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
      });
      const staleChannels = await CalendarSync.countDocuments({
        lastSyncTime: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      return {
        status: 'healthy',
        totalChannels,
        expiringChannels,
        staleChannels,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting webhook health status:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

// Create singleton instance
const webhookMonitor = new WebhookMonitor();

module.exports = webhookMonitor;