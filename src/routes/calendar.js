const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Sync doctor's calendar with webhook
router.post('/sync',
  isAuthenticated,
  hasRole(['doctor']),
  calendarController.syncCalendar
);

// Generate slots based on availability rules
router.post('/generate-slots',
  isAuthenticated,
  hasRole(['doctor']),
  calendarController.generateSlots
);

// Create single available slot manually
router.post('/slots',
  isAuthenticated,
  hasRole(['doctor']),
  calendarController.createSlot
);

// Check if doctor has today's slots
router.get('/check-today-slots',
  isAuthenticated,
  hasRole(['doctor']),
  calendarController.checkTodaySlots
);

// Get available slots for booking (PUBLIC - for patient booking widget)
router.get('/slots',
  calendarController.getAvailableSlots
);

// Book a slot (PUBLIC - for patient booking widget)
router.post('/book-slot',
  calendarController.bookSlotPublic
);

// Book a slot (authenticated users only)
router.post('/slots/book',
  isAuthenticated,
  hasRole(['client']),
  calendarController.bookSlot
);

// Cancel appointment
router.post('/appointments/:appointmentId/cancel',
  isAuthenticated,
  calendarController.cancelAppointment
);

// Reschedule appointment
router.post('/appointments/:appointmentId/reschedule',
  isAuthenticated,
  calendarController.rescheduleAppointment
);

// Clear all calendar events (doctor only)
router.delete('/clear-all',
  isAuthenticated,
  hasRole(['doctor']),
  calendarController.clearAllCalendarEvents
);

module.exports = router;