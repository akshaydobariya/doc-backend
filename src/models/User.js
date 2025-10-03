const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['doctor', 'client', 'staff'],
    required: true
  },
  picture: {
    type: String
  },
  phone: {
    type: String
  },

  // Doctor specific fields
  calendarConnected: {
    type: Boolean,
    default: false
  },
  googleCalendarId: {
    type: String
  },
  refreshToken: {
    type: String
  },
  webhookChannelId: {
    type: String
  },
  webhookResourceId: {
    type: String
  },
  webhookExpiration: {
    type: Date
  },
  syncToken: {
    type: String
  },
  lastSyncTime: {
    type: Date
  },

  // For staff role - link to doctor
  associatedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);