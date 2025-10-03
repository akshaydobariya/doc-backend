const { google } = require('googleapis');
const WebhookUtils = require('../utils/WebhookUtils');
const CalendarSync = require('../models/CalendarSync');
const User = require('../models/User');
const Slot = require('../models/Slot');

class WebhookService {
  constructor(client) {
    this.client = client;
  }

  /**
   * Setup webhook channel for a user's calendar
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - The webhook setup result
   */
  async setupWebhook(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.googleCalendarId) {
        throw new Error('Invalid user or calendar not connected');
      }

      // Create calendar API client
      this.client.setCredentials({ refresh_token: user.refreshToken });
      const calendar = google.calendar({ version: 'v3', auth: this.client });

      const channelId = WebhookUtils.generateChannelId();
      const expiration = WebhookUtils.calculateExpiration(7); // 7 days

      // Setup webhook channel
      const response = await calendar.events.watch({
        calendarId: user.googleCalendarId,
        requestBody: {
          id: channelId,
          type: 'web_hook',
          address: `${process.env.BACKEND_URL}/api/webhook/notify`,
          token: process.env.WEBHOOK_SECRET,
          expiration
        }
      });

      // Store webhook details
      await CalendarSync.findOneAndUpdate(
        { userId },
        {
          channelId,
          resourceId: response.data.resourceId,
          expiration: new Date(expiration),
          lastSyncTime: new Date()
        },
        { upsert: true }
      );

      return {
        channelId,
        resourceId: response.data.resourceId,
        expiration
      };
    } catch (error) {
      console.error('Webhook setup error:', error);
      throw error;
    }
  }

  /**
   * Handle calendar webhook notification
   * @param {Object} webhookData - The webhook notification data
   * @returns {Promise<void>}
   */
  async handleNotification(webhookData) {
    try {
      const sync = await CalendarSync.findOne({ channelId: webhookData.channelId });
      if (!sync) {
        throw new Error('Sync record not found');
      }

      const user = await User.findById(sync.userId);
      if (!user) {
        throw new Error('User not found');
      }

      this.client.setCredentials({ refresh_token: user.refreshToken });
      const calendar = google.calendar({ version: 'v3', auth: this.client });

      // Get changes since last sync
      const response = await calendar.events.list({
        calendarId: user.googleCalendarId,
        syncToken: sync.syncToken,
        showDeleted: true,
        singleEvents: true
      });

      // Process changes
      for (const event of response.data.items) {
        await this._processCalendarEvent(event, user._id);
      }

      // Update sync token
      sync.syncToken = response.data.nextSyncToken;
      sync.lastSyncTime = new Date();
      await sync.save();

      // Check webhook expiration
      if (WebhookUtils.isExpiringSoon(sync.expiration)) {
        await this.renewWebhook(user._id);
      }
    } catch (error) {
      console.error('Webhook notification handling error:', error);
      throw error;
    }
  }

  /**
   * Process individual calendar event
   * @param {Object} event - The calendar event
   * @param {string} userId - The user ID
   * @returns {Promise<void>}
   */
  async _processCalendarEvent(event, userId) {
    try {
      if (event.status === 'cancelled') {
        await Slot.findOneAndUpdate(
          { googleEventId: event.id },
          { isAvailable: false }
        );
        return;
      }

      const startTime = new Date(event.start.dateTime || event.start.date);
      const endTime = new Date(event.end.dateTime || event.end.date);

      await Slot.findOneAndUpdate(
        { googleEventId: event.id },
        {
          startTime,
          endTime,
          duration: Math.round((endTime - startTime) / (1000 * 60)),
          type: this._getEventType(event),
          isAvailable: event.transparency === 'transparent',
          doctor: userId
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Event processing error:', error);
      throw error;
    }
  }

  /**
   * Get event type from calendar event
   * @param {Object} event - The calendar event
   * @returns {string} - The event type
   */
  _getEventType(event) {
    if (event.summary && event.summary.startsWith('Available: ')) {
      return event.summary.replace('Available: ', '');
    }
    return 'Appointment';
  }

  /**
   * Renew webhook subscription
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - The renewal result
   */
  async renewWebhook(userId) {
    try {
      const sync = await CalendarSync.findOne({ userId });
      if (!sync) {
        throw new Error('Sync record not found');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Stop existing webhook
      this.client.setCredentials({ refresh_token: user.refreshToken });
      const calendar = google.calendar({ version: 'v3', auth: this.client });

      try {
        await calendar.channels.stop({
          requestBody: {
            id: sync.channelId,
            resourceId: sync.resourceId
          }
        });
      } catch (error) {
        console.warn('Error stopping existing webhook:', error);
      }

      // Create new webhook
      return await this.setupWebhook(userId);
    } catch (error) {
      console.error('Webhook renewal error:', error);
      throw error;
    }
  }

  /**
   * Stop webhook channel
   * @param {string} userId - The user ID
   * @returns {Promise<void>}
   */
  async stopWebhook(userId) {
    try {
      const sync = await CalendarSync.findOne({ userId });
      if (!sync) return;

      const user = await User.findById(userId);
      if (!user) return;

      this.client.setCredentials({ refresh_token: user.refreshToken });
      const calendar = google.calendar({ version: 'v3', auth: this.client });

      await calendar.channels.stop({
        requestBody: {
          id: sync.channelId,
          resourceId: sync.resourceId
        }
      });

      await CalendarSync.deleteOne({ userId });
    } catch (error) {
      console.error('Webhook stop error:', error);
      throw error;
    }
  }
}

module.exports = WebhookService;