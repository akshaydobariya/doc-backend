const DoctorAvailability = require('../models/DoctorAvailability');
const User = require('../models/User');

// Helper to get userId from request
const getUserId = (req) => {
  return req.user?._id || req.session?.userId;
};

// Initialize doctor availability with default settings
exports.initializeAvailability = async (req, res) => {
  try {
    const doctorId = getUserId(req);

    // Check if availability already exists
    let availability = await DoctorAvailability.findOne({ doctor: doctorId });

    if (!availability) {
      // Create default availability (Mon-Fri, 9am-5pm)
      availability = new DoctorAvailability({
        doctor: doctorId,
        standardAvailability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', enabled: true }, // Monday
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', enabled: true }, // Tuesday
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', enabled: true }, // Wednesday
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', enabled: true }, // Thursday
          { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', enabled: true }  // Friday
        ],
        appointmentTypes: [
          { name: 'Consultation', duration: 30, color: '#4CAF50', enabled: true },
          { name: 'Cleaning', duration: 45, color: '#2196F3', enabled: true },
          { name: 'Root Canal', duration: 90, color: '#F44336', enabled: true },
          { name: 'Filling', duration: 60, color: '#FF9800', enabled: true }
        ],
        rules: {
          bufferTimeBefore: 0,
          bufferTimeAfter: 10,
          maxAppointmentsPerDay: null,
          minLeadTime: 1,
          maxAdvanceBooking: 90,
          allowReschedule: true,
          allowCancellation: true,
          minRescheduleNotice: 24,
          minCancellationNotice: 24
        }
      });
      await availability.save();
    }

    res.json({ availability });
  } catch (error) {
    console.error('Initialize availability error:', error);
    res.status(500).json({ message: 'Failed to initialize availability' });
  }
};

// Get doctor availability settings
exports.getAvailability = async (req, res) => {
  try {
    const doctorId = req.query.doctorId || getUserId(req);

    const availability = await DoctorAvailability.findOne({ doctor: doctorId });

    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    res.json({ availability });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Failed to get availability' });
  }
};

// Update standard availability (weekly schedule)
exports.updateStandardAvailability = async (req, res) => {
  try {
    const doctorId = getUserId(req);
    const { standardAvailability } = req.body;

    const availability = await DoctorAvailability.findOne({ doctor: doctorId });

    if (!availability) {
      return res.status(404).json({ message: 'Availability not found. Please initialize first.' });
    }

    availability.standardAvailability = standardAvailability;
    await availability.save();

    res.json({ availability });
  } catch (error) {
    console.error('Update standard availability error:', error);
    res.status(500).json({ message: 'Failed to update availability' });
  }
};

// Update appointment types
exports.updateAppointmentTypes = async (req, res) => {
  try {
    const doctorId = getUserId(req);
    const { appointmentTypes } = req.body;

    const availability = await DoctorAvailability.findOne({ doctor: doctorId });

    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    availability.appointmentTypes = appointmentTypes;
    await availability.save();

    res.json({ availability });
  } catch (error) {
    console.error('Update appointment types error:', error);
    res.status(500).json({ message: 'Failed to update appointment types' });
  }
};

// Update booking rules
exports.updateRules = async (req, res) => {
  try {
    const doctorId = getUserId(req);
    const { rules } = req.body;

    const availability = await DoctorAvailability.findOne({ doctor: doctorId });

    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    availability.rules = { ...availability.rules, ...rules };
    await availability.save();

    res.json({ availability });
  } catch (error) {
    console.error('Update rules error:', error);
    res.status(500).json({ message: 'Failed to update rules' });
  }
};

// Clear all blocked slots
exports.clearBlockedSlots = async (req, res) => {
  try {
    const doctorId = getUserId(req);

    const availability = await DoctorAvailability.findOne({ doctor: doctorId });

    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    const clearedCount = availability.blockedSlots.length;
    availability.blockedSlots = [];
    await availability.save();

    res.json({
      message: `Cleared ${clearedCount} blocked slots`,
      availability
    });
  } catch (error) {
    console.error('Clear blocked slots error:', error);
    res.status(500).json({ message: 'Failed to clear blocked slots' });
  }
};

// Add blocked slot (holiday, break, etc.)
exports.addBlockedSlot = async (req, res) => {
  try {
    const doctorId = getUserId(req);
    const { startTime, endTime, reason, isRecurring } = req.body;

    const availability = await DoctorAvailability.findOne({ doctor: doctorId });

    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    availability.blockedSlots.push({
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      reason,
      isRecurring: isRecurring || false
    });

    await availability.save();

    res.json({ availability });
  } catch (error) {
    console.error('Add blocked slot error:', error);
    res.status(500).json({ message: 'Failed to add blocked slot' });
  }
};

// Remove blocked slot
exports.removeBlockedSlot = async (req, res) => {
  try {
    const doctorId = getUserId(req);
    const { slotId } = req.params;

    const availability = await DoctorAvailability.findOne({ doctor: doctorId });

    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    availability.blockedSlots = availability.blockedSlots.filter(
      slot => slot._id.toString() !== slotId
    );

    await availability.save();

    res.json({ availability });
  } catch (error) {
    console.error('Remove blocked slot error:', error);
    res.status(500).json({ message: 'Failed to remove blocked slot' });
  }
};

// Get all doctors with their availability info
exports.getAllDoctorsWithAvailability = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', calendarConnected: true })
      .select('name email picture calendarConnected')
      .sort({ name: 1 });

    // Get availability for each doctor
    const doctorsWithAvailability = await Promise.all(
      doctors.map(async (doctor) => {
        const availability = await DoctorAvailability.findOne({ doctor: doctor._id });
        return {
          ...doctor.toObject(),
          hasAvailability: !!availability,
          appointmentTypes: availability?.appointmentTypes || []
        };
      })
    );

    res.json({ doctors: doctorsWithAvailability });
  } catch (error) {
    console.error('Get doctors with availability error:', error);
    res.status(500).json({ message: 'Failed to get doctors' });
  }
};

// Get availability by doctor ID (PUBLIC - for patient booking widget)
exports.getAvailabilityByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const availability = await DoctorAvailability.findOne({ doctor: doctorId });

    if (!availability) {
      return res.status(404).json({ message: 'Availability not found for this doctor' });
    }

    res.json({ availability });
  } catch (error) {
    console.error('Get availability by doctor ID error:', error);
    res.status(500).json({
      message: 'Failed to get availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = exports;