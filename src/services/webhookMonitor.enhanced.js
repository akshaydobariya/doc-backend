const cron = require('node-cron');
const { client } = require('../config/google');
const EnhancedWebhookService = require('./webhookService.enhanced');
const CalendarSync = require('../models/CalendarSync');

/**
 * Webhook Monitor Service
 * Automatically checks and renews expiring webhooks
 */
class WebhookMonitor {
  constructor() {
    this.webhookService = new EnhancedWebhookService(client);
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Start the webhook monitor
   * Runs every 6 hours to check for expiring webhooks
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Webhook monitor already running');
      return;
    }

    console.log('🚀 Starting webhook monitor...');

    // Run every 6 hours: 0 */6 * * *
    this.cronJob = cron.schedule('0 */6 * * *', async () => {
      await this.checkAndRenew();
    });

    this.isRunning = true;
    console.log('✅ Webhook monitor started (runs every 6 hours)');

    // Run immediately on startup
    this.checkAndRenew();
  }

  /**
   * Stop the webhook monitor
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Webhook monitor not running');
      return;
    }

    if (this.cronJob) {
      this.cronJob.stop();
    }

    this.isRunning = false;
    console.log('✅ Webhook monitor stopped');
  }

  /**
   * Check and renew expiring webhooks
   */
  async checkAndRenew() {
    try {
      console.log('\n🔍 [Webhook Monitor] Checking for expiring webhooks...');
      const startTime = Date.now();

      const results = await this.webhookService.checkAndRenewExpiring();

      const duration = Date.now() - startTime;

      console.log('📊 [Webhook Monitor] Results:', {
        checked: results.checked,
        renewed: results.renewed,
        failed: results.failed.length,
        duration: `${duration}ms`
      });

      if (results.failed.length > 0) {
        console.error('❌ [Webhook Monitor] Failed renewals:', results.failed);
      }

      return results;
    } catch (error) {
      console.error('❌ [Webhook Monitor] Error during check:', error);
    }
  }

  /**
   * Get monitor status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.cronJob?.nextDate()?.toString() || null
    };
  }

  /**
   * Get all webhook statuses
   */
  async getAllWebhookStatuses() {
    try {
      const syncs = await CalendarSync.find({}).populate('userId', 'name email');

      const now = new Date();
      return syncs.map(sync => {
        const expiration = new Date(sync.expiration);
        const hoursUntilExpiration = (expiration - now) / (1000 * 60 * 60);

        return {
          userId: sync.userId?._id,
          userName: sync.userId?.name,
          userEmail: sync.userId?.email,
          channelId: sync.channelId,
          expiration: sync.expiration,
          hoursUntilExpiration: Math.round(hoursUntilExpiration * 10) / 10,
          status: hoursUntilExpiration > 48 ? 'healthy' :
                  hoursUntilExpiration > 0 ? 'expiring_soon' : 'expired',
          lastSyncTime: sync.lastSyncTime
        };
      });
    } catch (error) {
      console.error('Error getting webhook statuses:', error);
      throw error;
    }
  }
}

// Create singleton instance
const webhookMonitor = new WebhookMonitor();

module.exports = webhookMonitor;
