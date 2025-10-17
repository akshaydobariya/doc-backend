const { google } = require('googleapis');
const WebhookUtils = require('../utils/WebhookUtils');
const CalendarSync = require('../models/CalendarSync');
const User = require('../models/User');
const Slot = require('../models/Slot');
const Appointment = require('../models/Appointment');

class EnhancedWebhookService {
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
      const expiration = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

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

      // Get initial sync token for incremental sync
      const eventsResponse = await calendar.events.list({
        calendarId: user.googleCalendarId,
        maxResults: 1,
        singleEvents: true
      });

      const syncToken = eventsResponse.data.nextSyncToken;

      // Store webhook details in CalendarSync collection
      await CalendarSync.findOneAndUpdate(
        { userId },
        {
          channelId,
          resourceId: response.data.resourceId,
          syncToken, // Store initial sync token
          expiration: new Date(expiration),
          lastSyncTime: new Date()
        },
        { upsert: true }
      );

      // Also update User collection for quick access
      await User.findByIdAndUpdate(userId, {
        webhookChannelId: channelId,
        webhookResourceId: response.data.resourceId,
        webhookExpiration: new Date(expiration),
        syncToken,
        lastSyncTime: new Date()
      });

      console.log('✅ Webhook setup successful:', {
        userId,
        channelId,
        expiration: new Date(expiration)
      });

      return {
        channelId,
        resourceId: response.data.resourceId,
        expiration,
        syncToken
      };
    } catch (error) {
      console.error('❌ Webhook setup error:', error);
      throw error;
    }
  }

  /**
   * Handle calendar webhook notification with incremental sync
   * @param {Object} webhookData - The webhook notification data
   * @returns {Promise<void>}
   */
  async handleNotification(webhookData) {
    try {
      console.log('\n🔔 Webhook notification received:', {
        channelId: webhookData.channelId,
        resourceState: webhookData.resourceState,
        messageNumber: webhookData.messageNumber
      });

      // Ignore sync notifications (initial setup confirmation)
      if (webhookData.resourceState === 'sync') {
        console.log('⏭️  Skipping sync notification (initial setup)');
        return;
      }

      const sync = await CalendarSync.findOne({ channelId: webhookData.channelId });
      if (!sync) {
        console.warn('⚠️  Sync record not found for channelId:', webhookData.channelId);
        return;
      }

      const user = await User.findById(sync.userId);
      if (!user) {
        console.warn('⚠️  User not found:', sync.userId);
        return;
      }

      this.client.setCredentials({ refresh_token: user.refreshToken });
      const calendar = google.calendar({ version: 'v3', auth: this.client });

      let events;
      let newSyncToken;

      try {
        // Try incremental sync with syncToken (MOST EFFICIENT)
        if (sync.syncToken) {
          console.log('📊 Using incremental sync with syncToken');
          const response = await calendar.events.list({
            calendarId: user.googleCalendarId,
            syncToken: sync.syncToken,
            showDeleted: true,
            singleEvents: true
          });

          events = response.data.items || [];
          newSyncToken = response.data.nextSyncToken;
          console.log(`✅ Incremental sync: ${events.length} changed events`);
        }
      } catch (syncError) {
        // Handle invalid sync token (410 error)
        if (syncError.code === 410 || syncError.status === 410) {
          console.warn('⚠️  Sync token invalid (410), performing full sync');

          // Fallback to full sync
          const response = await calendar.events.list({
            calendarId: user.googleCalendarId,
            timeMin: new Date().toISOString(),
            maxResults: 250,
            showDeleted: true,
            singleEvents: true,
            orderBy: 'startTime'
          });

          events = response.data.items || [];
          newSyncToken = response.data.nextSyncToken;
          console.log(`✅ Full sync fallback: ${events.length} events processed`);
        } else {
          throw syncError;
        }
      }

      // Process changed events
      let processedCount = 0;
      for (const event of events) {
        await this._processCalendarEvent(event, user._id);
        processedCount++;
      }

      console.log(`✅ Processed ${processedCount} calendar events`);

      // Update sync token and last sync time
      sync.syncToken = newSyncToken;
      sync.lastSyncTime = new Date();
      await sync.save();

      // Also update user
      await User.findByIdAndUpdate(user._id, {
        syncToken: newSyncToken,
        lastSyncTime: new Date()
      });

      // Check webhook expiration and renew if needed
      if (WebhookUtils.isExpiringSoon(sync.expiration, 48)) { // 48 hours before
        console.log('⏰ Webhook expiring soon, renewing...');
        await this.renewWebhook(user._id);
      }
    } catch (error) {
      console.error('❌ Webhook notification handling error:', error);
      throw error;
    }
  }

  /**
   * Process individual calendar event (create/update/delete slot)
   * @param {Object} event - The calendar event
   * @param {string} userId - The user ID
   * @returns {Promise<void>}
   */
  async _processCalendarEvent(event, userId) {
    try {
      console.log(`  📅 Processing event: ${event.id} - ${event.summary || 'Untitled'} (${event.status})`);

      // Handle deleted events
      if (event.status === 'cancelled') {
        console.log('    🗑️  Event cancelled, checking if it has appointment');

        // Check if this was a booked appointment
        const appointment = await Appointment.findOne({ googleEventId: event.id });
        if (appointment) {
          console.log('    ⚠️  Booked appointment cancelled externally, updating status');
          appointment.status = 'cancelled';
          appointment.cancellationReason = 'Cancelled in Google Calendar';
          appointment.cancelledAt = new Date();
          await appointment.save();

          // Make slot available again
          const slot = await Slot.findById(appointment.slot);
          if (slot) {
            slot.isAvailable = true;
            slot.googleEventId = null;
            await slot.save();
          }
        } else {
          // Just remove the blocked slot
          await Slot.findOneAndDelete({ googleEventId: event.id, doctor: userId });
        }
        return;
      }

      // Skip all-day events
      if (!event.start?.dateTime) {
        console.log('    ⏭️  Skipping all-day event');
        return;
      }

      const startTime = new Date(event.start.dateTime);
      const endTime = new Date(event.end.dateTime);
      const duration = Math.round((endTime - startTime) / (1000 * 60));

      // Check if this is an appointment or external event
      const isAppointment = event.summary && event.summary.includes('Appointment:');

      if (isAppointment) {
        console.log('    📌 Appointment event, syncing with database');
        // Update existing appointment/slot if needed
        await Slot.findOneAndUpdate(
          { googleEventId: event.id, doctor: userId },
          {
            startTime,
            endTime,
            duration,
            type: this._getEventType(event),
            isAvailable: false // Appointment slots are not available
          }
        );
      } else {
        console.log('    🔒 External event, blocking slot');
        // External calendar event - create/update blocked slot
        await Slot.findOneAndUpdate(
          { googleEventId: event.id, doctor: userId },
          {
            doctor: userId,
            startTime,
            endTime,
            duration,
            type: event.summary || 'Blocked - External Event',
            isAvailable: false, // Block this time
            googleEventId: event.id
          },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error('❌ Event processing error:', error);
      // Don't throw - continue processing other events
    }
  }

  /**
   * Get event type from calendar event
   * @param {Object} event - The calendar event
   * @returns {string} - The event type
   */
  _getEventType(event) {
    if (event.summary && event.summary.startsWith('Appointment:')) {
      // Extract appointment type from description
      const descMatch = event.description?.match(/Type: (.+)/);
      return descMatch ? descMatch[1] : 'Appointment';
    }
    return event.summary || 'External Event';
  }

  /**
   * Renew webhook subscription before expiration
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - The renewal result
   */
  async renewWebhook(userId) {
    try {
      console.log('🔄 Renewing webhook for user:', userId);

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
        console.log('✅ Stopped old webhook channel');
      } catch (error) {
        console.warn('⚠️  Error stopping existing webhook (may already be expired):', error.message);
      }

      // Create new webhook
      const result = await this.setupWebhook(userId);
      console.log('✅ Webhook renewed successfully');
      return result;
    } catch (error) {
      console.error('❌ Webhook renewal error:', error);
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
      console.log('✅ Webhook stopped successfully');
    } catch (error) {
      console.error('❌ Webhook stop error:', error);
      throw error;
    }
  }

  /**
   * Check and renew expiring webhooks (for cron job)
   * @returns {Promise<Object>} - Renewal results
   */
  async checkAndRenewExpiring() {
    try {
      const threshold = new Date(Date.now() + (48 * 60 * 60 * 1000)); // 48 hours
      const expiringSyncs = await CalendarSync.find({
        expiration: { $lte: threshold }
      });

      console.log(`🔍 Found ${expiringSyncs.length} expiring webhooks`);

      const results = {
        checked: expiringSyncs.length,
        renewed: 0,
        failed: []
      };

      for (const sync of expiringSyncs) {
        try {
          await this.renewWebhook(sync.userId);
          results.renewed++;
        } catch (error) {
          console.error(`Failed to renew webhook for user ${sync.userId}:`, error);
          results.failed.push({
            userId: sync.userId,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Webhook check and renew error:', error);
      throw error;
    }
  }
}

module.exports = EnhancedWebhookService;
