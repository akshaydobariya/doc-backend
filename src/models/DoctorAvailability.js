const mongoose = require('mongoose');

// Model for doctor's availability rules and settings
const doctorAvailabilitySchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Standard availability (recurring weekly schedule)
  standardAvailability: [{
    dayOfWeek: {
      type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      required: true,
      min: 0,
      max: 6
    },
    startTime: {
      type: String, // Format: "09:00"
      required: true
    },
    endTime: {
      type: String, // Format: "17:00"
      required: true
    },
    enabled: {
      type: Boolean,
      default: true
    }
  }],

  // Appointment types (services offered)
  appointmentTypes: [{
    name: {
      type: String,
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: true
    },
    color: {
      type: String,
      default: '#4CAF50'
    },
    description: {
      type: String
    },
    enabled: {
      type: Boolean,
      default: true
    },
    bufferBefore: {
      type: Number, // Buffer time before this appointment type
      default: 10
    },
    bufferAfter: {
      type: Number, // Buffer time after this appointment type
      default: 5
    },
    timeRestrictions: [{
      startTime: {
        type: String // Format: "09:00"
      },
      endTime: {
        type: String // Format: "12:00"
      }
    }]
  }],

  // Booking rules
  rules: {
    bufferTimeBefore: {
      type: Number, // in minutes
      default: 0
    },
    bufferTimeAfter: {
      type: Number, // in minutes
      default: 0
    },
    maxAppointmentsPerDay: {
      type: Number,
      default: null // null means unlimited
    },
    minLeadTime: {
      type: Number, // in hours (minimum time before booking)
      default: 1
    },
    maxAdvanceBooking: {
      type: Number, // in days (how far in advance can book)
      default: 90
    },
    allowReschedule: {
      type: Boolean,
      default: true
    },
    allowCancellation: {
      type: Boolean,
      default: true
    },
    minRescheduleNotice: {
      type: Number, // in hours
      default: 24
    },
    minCancellationNotice: {
      type: Number, // in hours
      default: 24
    }
  },

  // Blocked dates/times (holidays, breaks, emergencies)
  blockedSlots: [{
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    reason: {
      type: String
    },
    isRecurring: {
      type: Boolean,
      default: false
    }
  }],

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
doctorAvailabilitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying - unique to prevent duplicates
doctorAvailabilitySchema.index({ doctor: 1 }, { unique: true });

module.exports = mongoose.model('DoctorAvailability', doctorAvailabilitySchema);