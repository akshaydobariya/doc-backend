const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Initialize availability (called after calendar sync)
router.post('/initialize',
  isAuthenticated,
  hasRole(['doctor']),
  availabilityController.initializeAvailability
);

// Get availability settings
router.get('/',
  isAuthenticated,
  availabilityController.getAvailability
);

// Update standard availability (weekly schedule)
router.put('/standard',
  isAuthenticated,
  hasRole(['doctor']),
  availabilityController.updateStandardAvailability
);

// Update appointment types
router.put('/appointment-types',
  isAuthenticated,
  hasRole(['doctor']),
  availabilityController.updateAppointmentTypes
);

// Update booking rules
router.put('/rules',
  isAuthenticated,
  hasRole(['doctor']),
  availabilityController.updateRules
);

// Clear all blocked slots
router.delete('/blocked-slots',
  isAuthenticated,
  hasRole(['doctor']),
  availabilityController.clearBlockedSlots
);

// Add blocked slot
router.post('/blocked-slots',
  isAuthenticated,
  hasRole(['doctor']),
  availabilityController.addBlockedSlot
);

// Remove blocked slot
router.delete('/blocked-slots/:slotId',
  isAuthenticated,
  hasRole(['doctor']),
  availabilityController.removeBlockedSlot
);

// Get all doctors with availability
router.get('/doctors',
  isAuthenticated,
  availabilityController.getAllDoctorsWithAvailability
);

module.exports = router;