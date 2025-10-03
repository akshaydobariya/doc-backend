const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  type: {
    type: String,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  googleEventId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying of available slots
slotSchema.index({ doctor: 1, startTime: 1, isAvailable: 1 });

module.exports = mongoose.model('Slot', slotSchema);