const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Patient details (for non-registered users in future)
  patientName: {
    type: String
  },
  patientEmail: {
    type: String
  },
  patientPhone: {
    type: String
  },
  reasonForVisit: {
    type: String
  },
  notes: {
    type: String
  },

  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'cancelled', 'completed', 'no-show', 'rescheduled'],
    default: 'scheduled'
  },

  // History tracking
  history: [{
    action: {
      type: String,
      enum: ['created', 'confirmed', 'cancelled', 'rescheduled', 'completed']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],

  googleEventId: {
    type: String
  },

  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String
  },
  cancelledAt: {
    type: Date
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

// Middleware to update the updatedAt field and add to history
appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying of appointments
appointmentSchema.index({ doctor: 1, status: 1, createdAt: -1 });
appointmentSchema.index({ client: 1, status: 1, createdAt: -1 });
appointmentSchema.index({ 'slot': 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);