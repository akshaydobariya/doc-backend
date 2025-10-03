const mongoose = require('mongoose');

const calendarSyncSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channelId: {
    type: String
  },
  resourceId: {
    type: String
  },
  syncToken: {
    type: String
  },
  expiration: {
    type: Date
  },
  lastSyncTime: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
calendarSyncSchema.index({ userId: 1 }, { unique: true });
calendarSyncSchema.index({ expiration: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('CalendarSync', calendarSyncSchema);