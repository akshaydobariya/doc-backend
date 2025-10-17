const { google } = require('googleapis');
const { client } = require('../config/google');
const User = require('../models/User');
const Slot = require('../models/Slot');
const Appointment = require('../models/Appointment');
const DoctorAvailability = require('../models/DoctorAvailability');
const EnhancedWebhookService = require('../services/webhookService.enhanced');

// Create a Calendar API client
const getCalendarApi = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.refreshToken) {
    throw new Error('User not found or no refresh token');
  }

  client.setCredentials({ refresh_token: user.refreshToken });
  return google.calendar({ version: 'v3', auth: client });
};

// Helper function to check if a time slot overlaps with blocked slots
const isSlotBlocked = (startTime, endTime, blockedSlots) => {
  return blockedSlots.some(blocked => {
    const blockedStart = new Date(blocked.startTime);
    const blockedEnd = new Date(blocked.endTime);
    return (
      (startTime >= blockedStart && startTime < blockedEnd) ||
      (endTime > blockedStart && endTime <= blockedEnd) ||
      (startTime <= blockedStart && endTime >= blockedEnd)
    );
  });
};

// Helper to get userId from request
const getUserId = (req) => {
  return req.user?._id || req.session?.userId;
};

// Check if doctor has created slots for today
exports.checkTodaySlots = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get today's date range (start of day to end of day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Check if there are any slots for today
    const todaySlots = await Slot.find({
      doctor: userId,
      startTime: {
        $gte: todayStart,
        $lte: todayEnd
      }
    });

    const hasTodaySlots = todaySlots.length > 0;

    return res.json({
      hasTodaySlots,
      slotsCount: todaySlots.length,
      todayDate: todayStart.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Check today slots error:', error);
    res.status(500).json({
      message: 'Failed to check today slots',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Sync calendar with webhook setup (OPTIMIZED)
exports.syncCalendar = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    const calendar = await getCalendarApi(userId);

    // Get primary calendar ID
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items.find(cal => cal.primary);

    if (!primaryCalendar) {
      throw new Error('Primary calendar not found');
    }

    // Update calendar connection first
    await User.findByIdAndUpdate(userId, {
      googleCalendarId: primaryCalendar.id,
      calendarConnected: true
    });

    // Setup webhook using enhanced service
    let webhookSetup = false;
    let syncToken = null;

    try {
      const webhookService = new EnhancedWebhookService(client);
      const webhookResult = await webhookService.setupWebhook(userId);
      webhookSetup = true;
      syncToken = webhookResult.syncToken;

      console.log('✅ Webhook setup successful for user:', userId);
    } catch (webhookError) {
      console.error('⚠️  Webhook setup error (continuing without webhook):', webhookError.message);
    }

    // Initial sync of existing events (mark as blocked to prevent double booking)
    const events = await calendar.events.list({
      calendarId: primaryCalendar.id,
      timeMin: new Date().toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime'
    });

    let syncedCount = 0;
    for (const event of events.data.items || []) {
      if (!event.start?.dateTime) continue; // Skip all-day events

      const startTime = new Date(event.start.dateTime);
      const endTime = new Date(event.end.dateTime);

      // Create or update slot as blocked (NOT available for booking)
      await Slot.findOneAndUpdate(
        { googleEventId: event.id, doctor: userId },
        {
          doctor: userId,
          startTime,
          endTime,
          duration: Math.round((endTime - startTime) / (1000 * 60)),
          type: event.summary || 'Imported Event',
          isAvailable: false, // Blocked by existing calendar event
          googleEventId: event.id
        },
        { upsert: true, new: true }
      );
      syncedCount++;
    }

    console.log(`✅ Synced ${syncedCount} existing calendar events as blocked slots`);

    res.json({
      message: 'Calendar synced successfully',
      syncedEvents: syncedCount,
      calendarId: primaryCalendar.id,
      webhookSetup,
      webhookEnabled: webhookSetup
    });
  } catch (error) {
    console.error('❌ Calendar sync error:', error);
    res.status(500).json({
      message: 'Calendar sync failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate slots based on doctor availability (OPTIMIZED - NO CALENDAR EVENTS CREATED)
exports.generateSlots = async (req, res) => {
  try {
    const doctorId = getUserId(req);
    const { startDate, endDate, appointmentTypeId, includeWeekends = false } = req.body;

    console.log('\n=== GENERATE SLOTS REQUEST (OPTIMIZED) ===');
    console.log('Doctor ID:', doctorId);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
    console.log('Appointment Type ID:', appointmentTypeId);
    console.log('Include Weekends:', includeWeekends);
    console.log('⚡ OPTIMIZATION: Slots created in DB only (NO Google Calendar API calls)');

    // Get doctor availability settings
    const availability = await DoctorAvailability.findOne({ doctor: doctorId });
    if (!availability) {
      return res.status(404).json({ message: 'Please configure availability settings first' });
    }

    // Get the appointment type
    const appointmentType = availability.appointmentTypes.id(appointmentTypeId);
    if (!appointmentType || !appointmentType.enabled) {
      return res.status(400).json({ message: 'Invalid or disabled appointment type' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const generatedSlots = [];
    const skippedReasons = {
      weekendsSkipped: 0,
      noAvailabilityConfigured: [],
      noTimeRemaining: [],
      blockedSlots: 0,
      duplicateSlots: 0
    };

    // Loop through each day
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();

      // Check if weekend and should skip
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (isWeekend && !includeWeekends) {
        skippedReasons.weekendsSkipped++;
        continue;
      }

      // Find availability for this day
      let dayAvailability = availability.standardAvailability.find(
        a => a.dayOfWeek === dayOfWeek && a.enabled
      );

      if (!dayAvailability) {
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
        skippedReasons.noAvailabilityConfigured.push(dayName);
        continue;
      }

      // Parse start and end times
      const [startHour, startMinute] = dayAvailability.startTime.split(':');
      const [endHour, endMinute] = dayAvailability.endTime.split(':');

      const dayStart = new Date(date);
      dayStart.setUTCHours(parseInt(startHour), parseInt(startMinute), 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setUTCHours(parseInt(endHour), parseInt(endMinute), 0, 0);

      // If this is today, adjust start time to current time + buffer
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday && dayStart < now) {
        const minLeadTime = availability?.rules?.minLeadTime || 0;
        const minStartTime = new Date(now.getTime() + minLeadTime * 60 * 60 * 1000);

        // Round up to next appointment interval
        const minutes = minStartTime.getMinutes();
        const roundedMinutes = Math.ceil(minutes / appointmentType.duration) * appointmentType.duration;
        minStartTime.setMinutes(roundedMinutes);
        minStartTime.setSeconds(0);
        minStartTime.setMilliseconds(0);

        if (minStartTime > dayStart) {
          dayStart.setTime(minStartTime.getTime());
        }

        if (dayStart >= dayEnd) {
          skippedReasons.noTimeRemaining.push('Today (past working hours)');
          continue;
        }
      }

      // Generate slots for this day (DB only - no calendar events)
      let currentTime = new Date(dayStart);
      while (currentTime < dayEnd) {
        const slotEnd = new Date(currentTime.getTime() + appointmentType.duration * 60000);

        if (slotEnd > dayEnd) break;

        await createSlotIfValid(
          currentTime,
          slotEnd,
          appointmentType,
          doctorId,
          availability,
          null, // NO calendar API
          null, // NO user object needed
          generatedSlots,
          skippedReasons
        );

        // Move to next slot (include appointment-specific buffer time)
        const bufferTime = ((appointmentType.bufferBefore || 0) + (appointmentType.bufferAfter || 0)) * 60000;
        currentTime = new Date(slotEnd.getTime() + bufferTime);
      }
    }

    console.log(`✅ Generated ${generatedSlots.length} slots in DATABASE (0 Google Calendar API calls)`);

    // Build helpful message
    let message = `Generated ${generatedSlots.length} slots`;
    const reasons = [];

    if (generatedSlots.length === 0) {
      reasons.push('❌ No slots were created. Possible reasons:\n');

      if (skippedReasons.weekendsSkipped > 0) {
        reasons.push(`• ${skippedReasons.weekendsSkipped} weekend day(s) were skipped. Enable "Include Weekends" to generate slots on weekends.`);
      }

      if (skippedReasons.noAvailabilityConfigured.length > 0) {
        const days = [...new Set(skippedReasons.noAvailabilityConfigured)].join(', ');
        reasons.push(`• No working hours configured for: ${days}. Go to Settings → Availability to configure working hours.`);
      }

      if (skippedReasons.noTimeRemaining.length > 0) {
        reasons.push(`• Today's working hours have already passed. Try generating slots for tomorrow or future dates.`);
      }

      if (skippedReasons.duplicateSlots > 0) {
        reasons.push(`• ${skippedReasons.duplicateSlots} time slot(s) already exist in the system (duplicates are not created).`);
      }

      if (skippedReasons.blockedSlots > 0) {
        reasons.push(`• ${skippedReasons.blockedSlots} time slot(s) were blocked due to blocked dates/holidays.`);
      }

      message = reasons.join('\n');
    }

    res.json({
      message,
      slots: generatedSlots,
      summary: {
        generated: generatedSlots.length,
        skipped: {
          weekends: skippedReasons.weekendsSkipped,
          noAvailability: skippedReasons.noAvailabilityConfigured,
          noTimeRemaining: skippedReasons.noTimeRemaining.length,
          blocked: skippedReasons.blockedSlots,
          duplicates: skippedReasons.duplicateSlots
        },
        optimization: {
          googleApiCallsSaved: generatedSlots.length, // Saved 100%!
          note: 'Calendar events created only when patient books'
        }
      }
    });
  } catch (error) {
    console.error('❌ Generate slots error:', error);
    res.status(500).json({ message: 'Failed to generate slots', error: error.message });
  }
};

// Helper function to create slot if valid (OPTIMIZED - NO CALENDAR EVENTS)
async function createSlotIfValid(currentTime, slotEnd, appointmentType, doctorId, availability, calendar, user, generatedSlots, skippedReasons) {
  // Check if slot is blocked
  const isBlocked = isSlotBlocked(currentTime, slotEnd, availability.blockedSlots);
  if (isBlocked) {
    if (skippedReasons) skippedReasons.blockedSlots++;
    return;
  }

  // Check if slot already exists
  const existingSlot = await Slot.findOne({
    doctor: doctorId,
    startTime: currentTime,
    endTime: slotEnd
  });

  if (existingSlot) {
    if (skippedReasons) skippedReasons.duplicateSlots++;
    return;
  }

  // Create slot in DATABASE ONLY (NO Google Calendar event)
  const slot = new Slot({
    doctor: doctorId,
    startTime: new Date(currentTime),
    endTime: new Date(slotEnd),
    duration: appointmentType.duration,
    type: appointmentType.name,
    isAvailable: true,
    googleEventId: null // Will be created when patient books ✅
  });

  await slot.save();
  generatedSlots.push(slot);
}

// The rest of the exports remain the same (bookSlot, cancelAppointment, etc.)
// These functions already create calendar events only when booking happens

module.exports = {
  ...require('./calendarController'),
  ...exports
};
