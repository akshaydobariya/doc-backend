const { google } = require('googleapis');
const { client } = require('../config/google');
const User = require('../models/User');
const Slot = require('../models/Slot');
const Appointment = require('../models/Appointment');
const DoctorAvailability = require('../models/DoctorAvailability');

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

// Sync calendar with webhook setup
exports.syncCalendar = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const calendar = await getCalendarApi(userId);

    // Get primary calendar ID
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items.find(cal => cal.primary);

    if (!primaryCalendar) {
      throw new Error('Primary calendar not found');
    }

    // Setup webhook for real-time updates
    const webhookUrl = `${process.env.BACKEND_URL}/api/webhook/calendar`;
    const channelId = `doctor-${userId}-${Date.now()}`;

    try {
      const watchResponse = await calendar.events.watch({
        calendarId: primaryCalendar.id,
        requestBody: {
          id: channelId,
          type: 'web_hook',
          address: webhookUrl,
          token: process.env.WEBHOOK_SECRET,
          expiration: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // Update user with calendar and webhook info
      await User.findByIdAndUpdate(userId, {
        googleCalendarId: primaryCalendar.id,
        calendarConnected: true,
        webhookChannelId: watchResponse.data.id,
        webhookResourceId: watchResponse.data.resourceId,
        webhookExpiration: new Date(parseInt(watchResponse.data.expiration)),
        lastSyncTime: new Date()
      });

    } catch (webhookError) {
      console.error('Webhook setup error (continuing without webhook):', webhookError);
      // Continue without webhook - update user anyway
      await User.findByIdAndUpdate(userId, {
        googleCalendarId: primaryCalendar.id,
        calendarConnected: true,
        lastSyncTime: new Date()
      });
    }

    // Initial sync of existing events
    const events = await calendar.events.list({
      calendarId: primaryCalendar.id,
      timeMin: new Date().toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime'
    });

    let syncedCount = 0;
    // Process existing events - mark as unavailable to prevent double booking
    for (const event of events.data.items || []) {
      if (!event.start?.dateTime) continue; // Skip all-day events

      const startTime = new Date(event.start.dateTime);
      const endTime = new Date(event.end.dateTime);

      // Create or update slot as blocked
      await Slot.findOneAndUpdate(
        { googleEventId: event.id, doctor: userId },
        {
          doctor: userId,
          startTime,
          endTime,
          duration: Math.round((endTime - startTime) / (1000 * 60)),
          type: event.summary || 'Imported Event',
          isAvailable: false,
          googleEventId: event.id
        },
        { upsert: true, new: true }
      );
      syncedCount++;
    }

    res.json({
      message: 'Calendar synced successfully',
      syncedEvents: syncedCount,
      calendarId: primaryCalendar.id
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    res.status(500).json({
      message: 'Calendar sync failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate slots based on doctor availability
exports.generateSlots = async (req, res) => {
  try {
    const doctorId = getUserId(req);
    const { startDate, endDate, appointmentTypeId, includeWeekends = false } = req.body;

    console.log('=== GENERATE SLOTS REQUEST ===');
    console.log('Doctor ID:', doctorId);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
    console.log('Appointment Type ID:', appointmentTypeId);
    console.log('Include Weekends:', includeWeekends);

    // Get doctor availability settings
    const availability = await DoctorAvailability.findOne({ doctor: doctorId });
    if (!availability) {
      return res.status(404).json({ message: 'Please configure availability settings first' });
    }

    console.log('Availability found:', {
      standardAvailability: availability.standardAvailability.map(a => ({
        day: a.dayOfWeek,
        enabled: a.enabled,
        time: `${a.startTime}-${a.endTime}`
      }))
    });

    // Get the appointment type
    const appointmentType = availability.appointmentTypes.id(appointmentTypeId);
    if (!appointmentType || !appointmentType.enabled) {
      return res.status(400).json({ message: 'Invalid or disabled appointment type' });
    }

    console.log('Appointment type:', {
      name: appointmentType.name,
      duration: appointmentType.duration,
      enabled: appointmentType.enabled
    });

    console.log(`Blocked slots count: ${availability.blockedSlots.length}`);
    if (availability.blockedSlots.length > 0) {
      console.log('First few blocked slots:', availability.blockedSlots.slice(0, 3).map(b => ({
        start: b.startTime,
        end: b.endTime,
        reason: b.reason
      })));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const generatedSlots = [];

    const calendar = await getCalendarApi(doctorId);
    const user = await User.findById(doctorId);

    // Loop through each day
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      console.log(`\nChecking date: ${date.toISOString()} (Day: ${dayOfWeek})`);

      // Check if weekend and should skip
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (isWeekend && !includeWeekends) {
        console.log(`  ⏭️  Skipping weekend day ${dayOfWeek} (includeWeekends=false)`);
        continue;
      }

      // Find availability for this day
      let dayAvailability = availability.standardAvailability.find(
        a => a.dayOfWeek === dayOfWeek && a.enabled
      );

      // If weekend and includeWeekends is true, but no weekend availability configured,
      // use weekday availability as fallback (or skip if you prefer)
      if (!dayAvailability && isWeekend && includeWeekends) {
        console.log(`  ⚠️  No weekend availability configured for day ${dayOfWeek}, using default weekday hours`);
        // Use first enabled weekday availability as template
        const weekdayAvailability = availability.standardAvailability.find(a => a.enabled);
        if (weekdayAvailability) {
          dayAvailability = {
            dayOfWeek,
            startTime: weekdayAvailability.startTime,
            endTime: weekdayAvailability.endTime,
            enabled: true
          };
        }
      }

      if (!dayAvailability) {
        console.log(`  ❌ No availability configured for day ${dayOfWeek}`);
        continue;
      }

      console.log(`  ✅ Day available: ${dayAvailability.startTime} - ${dayAvailability.endTime}`);

      // Parse start and end times
      const [startHour, startMinute] = dayAvailability.startTime.split(':');
      const [endHour, endMinute] = dayAvailability.endTime.split(':');

      // Use UTC methods to avoid timezone issues
      const dayStart = new Date(date);
      dayStart.setUTCHours(parseInt(startHour), parseInt(startMinute), 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setUTCHours(parseInt(endHour), parseInt(endMinute), 0, 0);

      // If this is today, adjust start time to current time + buffer
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      if (isToday && dayStart < now) {
        console.log(`  ⏰ Today detected - current time: ${now.toISOString()}`);
        // Round up to next slot interval (e.g., if it's 2:17 PM and slots are 30 min, start at 2:30 PM)
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
          console.log(`  ⏰ Adjusted start time to: ${dayStart.toISOString()} (current time + lead time + rounding)`);
        }

        // If adjusted start time is after end time, skip this day
        if (dayStart >= dayEnd) {
          console.log(`  ⏭️  Skipping today - no available time slots remaining`);
          continue;
        }
      }

      console.log(`  📅 Final time range: ${dayStart.toISOString()} - ${dayEnd.toISOString()}`);

      // Check if appointment type has time restrictions
      let effectiveStart = new Date(dayStart);
      let effectiveEnd = new Date(dayEnd);

      if (appointmentType.timeRestrictions && appointmentType.timeRestrictions.length > 0) {
        // Use time restrictions for this type
        for (const restriction of appointmentType.timeRestrictions) {
          const [restrictStartHour, restrictStartMinute] = restriction.startTime.split(':');
          const [restrictEndHour, restrictEndMinute] = restriction.endTime.split(':');

          const restrictStart = new Date(date);
          restrictStart.setUTCHours(parseInt(restrictStartHour), parseInt(restrictStartMinute), 0, 0);

          const restrictEnd = new Date(date);
          restrictEnd.setUTCHours(parseInt(restrictEndHour), parseInt(restrictEndMinute), 0, 0);

          // Generate slots within this restriction window
          let currentTime = new Date(Math.max(restrictStart, dayStart));
          const restrictionEnd = new Date(Math.min(restrictEnd, dayEnd));

          while (currentTime < restrictionEnd) {
            const slotEnd = new Date(currentTime.getTime() + appointmentType.duration * 60000);

            if (slotEnd > restrictionEnd) break;

            await createSlotIfValid(currentTime, slotEnd, appointmentType, doctorId, availability, calendar, user, generatedSlots);

            // Move to next slot (include appointment-specific buffer time)
            const bufferTime = ((appointmentType.bufferBefore || 0) + (appointmentType.bufferAfter || 0)) * 60000;
            currentTime = new Date(slotEnd.getTime() + bufferTime);
          }
        }
        continue; // Skip default slot generation
      }

      // No restrictions - generate slots for entire working day
      let currentTime = new Date(dayStart);
      while (currentTime < dayEnd) {
        const slotEnd = new Date(currentTime.getTime() + appointmentType.duration * 60000);

        if (slotEnd > dayEnd) break;

        await createSlotIfValid(currentTime, slotEnd, appointmentType, doctorId, availability, calendar, user, generatedSlots);

        // Move to next slot (include appointment-specific buffer time)
        const bufferTime = ((appointmentType.bufferBefore || 0) + (appointmentType.bufferAfter || 0)) * 60000;
        currentTime = new Date(slotEnd.getTime() + bufferTime);
      }
    }

    res.json({
      message: `Generated ${generatedSlots.length} slots`,
      slots: generatedSlots
    });
  } catch (error) {
    console.error('Generate slots error:', error);
    res.status(500).json({ message: 'Failed to generate slots' });
  }
};

// Helper function to create slot if valid
async function createSlotIfValid(currentTime, slotEnd, appointmentType, doctorId, availability, calendar, user, generatedSlots) {
        // Check if slot is blocked
        const isBlocked = isSlotBlocked(currentTime, slotEnd, availability.blockedSlots);
        if (isBlocked) {
          console.log(`    ⛔ Slot blocked: ${currentTime.toISOString()}`);
          return;
        }

        // Check if slot already exists
        const existingSlot = await Slot.findOne({
          doctor: doctorId,
          startTime: currentTime,
          endTime: slotEnd
        });

        if (existingSlot) {
          console.log(`    ⏭️  Slot already exists: ${currentTime.toISOString()}`);
          return;
        }

        // Create slot in database ONLY (no calendar event yet)
        const slot = new Slot({
          doctor: doctorId,
          startTime: new Date(currentTime),
          endTime: new Date(slotEnd),
          duration: appointmentType.duration,
          type: appointmentType.name,
          isAvailable: true,
          googleEventId: null // Will be created when patient books
        });

        await slot.save();
        generatedSlots.push(slot);
        console.log(`    ✅ Created slot: ${currentTime.toISOString()} - ${slotEnd.toISOString()}`);
}

// Create single slot manually
exports.createSlot = async (req, res) => {
  try {
    const { startTime, endTime, type } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.round((end - start) / (1000 * 60));

    // Check for overlapping slots
    const overlapping = await Slot.findOne({
      doctor: getUserId(req),
      $or: [
        { startTime: { $gte: start, $lt: end } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({ message: 'Slot overlaps with existing slot' });
    }

    // Create slot in database ONLY (no calendar event yet)
    const slot = new Slot({
      doctor: getUserId(req),
      startTime: start,
      endTime: end,
      duration,
      type,
      isAvailable: true,
      googleEventId: null // Will be created when patient books
    });

    await slot.save();

    res.json({ slot });
  } catch (error) {
    console.error('Create slot error:', error);
    res.status(500).json({ message: 'Failed to create slot' });
  }
};

// Get available slots for booking (with rules applied)
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, startDate, endDate, appointmentType } = req.query;

    console.log('\n=== GET AVAILABLE SLOTS REQUEST ===');
    console.log('Doctor ID:', doctorId);
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);
    console.log('Appointment Type:', appointmentType);

    if (!doctorId) {
      return res.status(400).json({ message: 'Doctor ID is required' });
    }

    // Get doctor availability rules
    const availability = await DoctorAvailability.findOne({ doctor: doctorId });
    console.log('Availability rules:', availability?.rules);

    const now = new Date();
    const minLeadTime = availability?.rules?.minLeadTime || 0; // Default 0 hours (allow immediate booking for testing)
    const maxAdvanceBooking = availability?.rules?.maxAdvanceBooking || 365; // Default 1 year

    const minBookingTime = new Date(now.getTime() + minLeadTime * 60 * 60 * 1000);
    const maxBookingTime = new Date(now.getTime() + maxAdvanceBooking * 24 * 60 * 60 * 1000);

    console.log('Booking time constraints:');
    console.log('  Now:', now.toISOString());
    console.log('  Min booking time:', minBookingTime.toISOString());
    console.log('  Max booking time:', maxBookingTime.toISOString());

    // Parse dates
    const queryStartDate = startDate ? new Date(startDate) : now;
    const queryEndDate = endDate ? new Date(endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

    console.log('Query date range:');
    console.log('  Query Start:', queryStartDate.toISOString());
    console.log('  Query End:', queryEndDate.toISOString());

    const actualStartTime = new Date(Math.max(queryStartDate.getTime(), minBookingTime.getTime()));
    const actualEndTime = new Date(Math.min(queryEndDate.getTime(), maxBookingTime.getTime()));

    console.log('Actual query range after applying rules:');
    console.log('  Actual Start:', actualStartTime.toISOString());
    console.log('  Actual End:', actualEndTime.toISOString());

    const query = {
      doctor: doctorId,
      startTime: {
        $gte: actualStartTime,
        $lte: actualEndTime
      },
      isAvailable: true
    };

    if (appointmentType) {
      query.type = appointmentType;
    }

    console.log('MongoDB query:', JSON.stringify(query, null, 2));

    const slots = await Slot.find(query).sort('startTime').limit(100);

    console.log(`Found ${slots.length} available slots for doctor ${doctorId}`);

    if (slots.length > 0) {
      console.log('Sample slots (first 3):');
      slots.slice(0, 3).forEach(slot => {
        console.log(`  - ${slot.startTime.toISOString()} to ${slot.endTime.toISOString()} (${slot.type}, available: ${slot.isAvailable})`);
      });
    } else {
      // Debug: Check if ANY slots exist for this doctor
      const allSlots = await Slot.find({ doctor: doctorId }).limit(5);
      console.log(`\n⚠️ No slots found matching query. Total slots for this doctor: ${allSlots.length}`);
      if (allSlots.length > 0) {
        console.log('Sample of ALL slots for this doctor:');
        allSlots.forEach(slot => {
          console.log(`  - ${slot.startTime.toISOString()} to ${slot.endTime.toISOString()} (${slot.type}, available: ${slot.isAvailable})`);
        });
      }
    }

    res.json({
      slots,
      rules: availability?.rules,
      count: slots.length
    });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ message: 'Failed to get slots', error: error.message });
  }
};

// Book a slot
exports.bookSlot = async (req, res) => {
  try {
    const { slotId, reasonForVisit, notes, patientName, patientEmail, patientPhone } = req.body;

    const slot = await Slot.findById(slotId).populate('doctor');
    if (!slot || !slot.isAvailable) {
      return res.status(400).json({ message: 'Slot not available' });
    }

    // Check if appointment time is still valid (min lead time)
    const availability = await DoctorAvailability.findOne({ doctor: slot.doctor._id });
    const minLeadTime = availability?.rules.minLeadTime || 1;
    const minBookingTime = new Date(Date.now() + minLeadTime * 60 * 60 * 1000);

    if (slot.startTime < minBookingTime) {
      return res.status(400).json({ message: `Appointments must be booked at least ${minLeadTime} hours in advance` });
    }

    const client = await User.findById(getUserId(req));

    // Create appointment - use provided patient details or fall back to client info
    const appointment = new Appointment({
      slot: slotId,
      doctor: slot.doctor._id,
      client: getUserId(req),
      patientName: patientName || client.name,
      patientEmail: patientEmail || client.email,
      patientPhone: patientPhone || client.phone,
      reasonForVisit: reasonForVisit || '',
      notes: notes || '',
      status: 'scheduled',
      history: [{
        action: 'created',
        timestamp: new Date(),
        performedBy: getUserId(req)
      }]
    });

    // CREATE NEW Google Calendar event (not update)
    const calendar = await getCalendarApi(slot.doctor._id);

    // Use the appointment patient details (which may be custom or from client)
    const finalPatientName = appointment.patientName;
    const finalPatientEmail = appointment.patientEmail;
    const finalPatientPhone = appointment.patientPhone;

    const event = await calendar.events.insert({
      calendarId: slot.doctor.googleCalendarId,
      requestBody: {
        summary: `Appointment: ${finalPatientName}`,
        description: `Patient: ${finalPatientName}\nEmail: ${finalPatientEmail}\nPhone: ${finalPatientPhone || 'N/A'}\nType: ${slot.type}\nReason: ${reasonForVisit || 'Not specified'}`,
        start: { dateTime: slot.startTime.toISOString() },
        end: { dateTime: slot.endTime.toISOString() },
        transparency: 'opaque',
        attendees: [
          { email: slot.doctor.email },
          { email: finalPatientEmail }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 } // 1 hour before
          ]
        }
      }
    });

    // Save the event ID in both appointment and slot
    appointment.googleEventId = event.data.id;
    slot.googleEventId = event.data.id;

    await appointment.save();

    // Mark slot as unavailable
    slot.isAvailable = false;
    await slot.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor')
      .populate('client')
      .populate('slot');

    // Send notifications to patient and doctor
    try {
      const notificationService = require('../services/notificationService');

      const appointmentDate = notificationService.formatAppointmentDate(slot.startTime);
      const appointmentTime = notificationService.formatAppointmentTime(slot.startTime, slot.endTime);

      // Send confirmation to patient
      await notificationService.sendPatientConfirmation({
        patientName: finalPatientName,
        patientEmail: finalPatientEmail,
        patientPhone: finalPatientPhone,
        doctorName: slot.doctor.name,
        appointmentDate,
        appointmentTime,
        appointmentType: slot.type,
        appointmentId: appointment._id.toString(),
      });

      // Send notification to doctor
      await notificationService.sendDoctorNotification({
        doctorName: slot.doctor.name,
        doctorEmail: slot.doctor.email,
        doctorPhone: slot.doctor.phone || '',
        patientName: finalPatientName,
        patientEmail: finalPatientEmail,
        patientPhone: finalPatientPhone,
        appointmentDate,
        appointmentTime,
        appointmentType: slot.type,
        appointmentReason: reasonForVisit || 'Not specified',
        appointmentId: appointment._id.toString(),
      });

      console.log('✅ Notifications sent successfully');
    } catch (notifError) {
      console.error('⚠️ Notification sending failed (non-critical):', notifError);
      // Don't fail the booking if notifications fail
    }

    res.json({ appointment: populatedAppointment });
  } catch (error) {
    console.error('Book slot error:', error);
    res.status(500).json({ message: 'Failed to book slot' });
  }
};

// Book slot (PUBLIC - for patient booking widget without authentication)
exports.bookSlotPublic = async (req, res) => {
  try {
    const { slotId, patientName, patientEmail, patientPhone, reasonForVisit, notes } = req.body;

    // Validate required fields
    if (!slotId || !patientName || !patientEmail || !patientPhone) {
      return res.status(400).json({ message: 'Missing required fields: slotId, patientName, patientEmail, patientPhone' });
    }

    const slot = await Slot.findById(slotId).populate('doctor');
    if (!slot || !slot.isAvailable) {
      return res.status(400).json({ message: 'Slot not available' });
    }

    // Check if appointment time is still valid (min lead time)
    const availability = await DoctorAvailability.findOne({ doctor: slot.doctor._id });
    const minLeadTime = availability?.rules.minLeadTime || 1;
    const minBookingTime = new Date(Date.now() + minLeadTime * 60 * 60 * 1000);

    if (slot.startTime < minBookingTime) {
      return res.status(400).json({ message: `Appointments must be booked at least ${minLeadTime} hours in advance` });
    }

    // Create appointment without client reference (public booking)
    const appointment = new Appointment({
      slot: slotId,
      doctor: slot.doctor._id,
      client: null, // No client for public bookings
      patientName,
      patientEmail,
      patientPhone,
      reasonForVisit: reasonForVisit || '',
      notes: notes || '',
      status: 'scheduled',
      history: [{
        action: 'created',
        timestamp: new Date(),
        performedBy: null // No user for public booking
      }]
    });

    // CREATE Google Calendar event
    const calendar = await getCalendarApi(slot.doctor._id);

    const event = await calendar.events.insert({
      calendarId: slot.doctor.googleCalendarId,
      requestBody: {
        summary: `Appointment: ${patientName}`,
        description: `Patient: ${patientName}\nEmail: ${patientEmail}\nPhone: ${patientPhone}\nType: ${slot.type}\nReason: ${reasonForVisit || 'Not specified'}\n\n(Booked via public widget)`,
        start: { dateTime: slot.startTime.toISOString() },
        end: { dateTime: slot.endTime.toISOString() },
        transparency: 'opaque',
        attendees: [
          { email: slot.doctor.email },
          { email: patientEmail }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 } // 1 hour before
          ]
        }
      }
    });

    // Save the event ID in both appointment and slot
    appointment.googleEventId = event.data.id;
    slot.googleEventId = event.data.id;

    await appointment.save();

    // Mark slot as unavailable
    slot.isAvailable = false;
    await slot.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor')
      .populate('slot');

    // Send notifications to patient and doctor
    try {
      const notificationService = require('../services/notificationService');

      const appointmentDate = notificationService.formatAppointmentDate(slot.startTime);
      const appointmentTime = notificationService.formatAppointmentTime(slot.startTime, slot.endTime);

      // Send confirmation to patient
      await notificationService.sendPatientConfirmation({
        patientName,
        patientEmail,
        patientPhone,
        doctorName: slot.doctor.name,
        appointmentDate,
        appointmentTime,
        appointmentType: slot.type,
        appointmentId: appointment._id.toString()
      });

      // Send notification to doctor
      await notificationService.sendDoctorNotification({
        doctorEmail: slot.doctor.email,
        doctorName: slot.doctor.name,
        patientName,
        patientEmail,
        patientPhone,
        appointmentDate,
        appointmentTime,
        appointmentType: slot.type,
        reasonForVisit: reasonForVisit || 'Not specified'
      });

      console.log('✅ Booking notifications sent successfully');
    } catch (notifError) {
      console.error('⚠️ Notification sending failed (non-critical):', notifError);
      // Don't fail the booking if notifications fail
    }

    res.json({
      appointment: populatedAppointment,
      message: 'Appointment booked successfully! Confirmation email sent.'
    });
  } catch (error) {
    console.error('Public book slot error:', error);
    res.status(500).json({
      message: 'Failed to book slot',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate('slot doctor');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if user is authorized
    if (appointment.client.toString() !== getUserId(req) &&
        appointment.doctor._id.toString() !== getUserId(req)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check cancellation policy
    const availability = await DoctorAvailability.findOne({ doctor: appointment.doctor._id });
    const minCancellationNotice = availability?.rules.minCancellationNotice || 24;
    const minCancellationTime = new Date(appointment.slot.startTime.getTime() - minCancellationNotice * 60 * 60 * 1000);

    if (new Date() > minCancellationTime && appointment.client.toString() === getUserId(req)) {
      return res.status(400).json({
        message: `Appointments must be cancelled at least ${minCancellationNotice} hours in advance`
      });
    }

    // Update appointment
    appointment.status = 'cancelled';
    appointment.cancelledBy = getUserId(req);
    appointment.cancellationReason = cancellationReason;
    appointment.cancelledAt = new Date();
    appointment.history.push({
      action: 'cancelled',
      timestamp: new Date(),
      performedBy: getUserId(req),
      notes: cancellationReason
    });
    await appointment.save();

    // Make slot available again
    const slot = await Slot.findById(appointment.slot._id);
    slot.isAvailable = true;

    // DELETE Google Calendar event (not update to available)
    try {
      const calendar = await getCalendarApi(appointment.doctor._id);
      await calendar.events.delete({
        calendarId: appointment.doctor.googleCalendarId,
        eventId: slot.googleEventId,
        sendUpdates: 'all' // Notify attendees
      });

      // Remove event ID from slot
      slot.googleEventId = null;
    } catch (calError) {
      console.error('Calendar delete error:', calError);
    }

    await slot.save();

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Failed to cancel appointment' });
  }
};

// Reschedule appointment
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { newSlotId } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate('slot doctor');
    const newSlot = await Slot.findById(newSlotId);

    if (!appointment || !newSlot) {
      return res.status(404).json({ message: 'Appointment or slot not found' });
    }

    if (!newSlot.isAvailable) {
      return res.status(400).json({ message: 'New slot is not available' });
    }

    // Check authorization
    if (appointment.client.toString() !== getUserId(req) &&
        appointment.doctor._id.toString() !== getUserId(req)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check reschedule policy
    const availability = await DoctorAvailability.findOne({ doctor: appointment.doctor._id });
    const minRescheduleNotice = availability?.rules.minRescheduleNotice || 24;
    const minRescheduleTime = new Date(appointment.slot.startTime.getTime() - minRescheduleNotice * 60 * 60 * 1000);

    if (new Date() > minRescheduleTime && appointment.client.toString() === getUserId(req)) {
      return res.status(400).json({
        message: `Appointments must be rescheduled at least ${minRescheduleNotice} hours in advance`
      });
    }

    // Free old slot
    const oldSlot = await Slot.findById(appointment.slot._id);
    oldSlot.isAvailable = true;
    await oldSlot.save();

    // Update appointment
    appointment.slot = newSlotId;
    appointment.status = 'rescheduled';
    appointment.history.push({
      action: 'rescheduled',
      timestamp: new Date(),
      performedBy: getUserId(req),
      notes: `Rescheduled from ${oldSlot.startTime} to ${newSlot.startTime}`
    });
    await appointment.save();

    // Book new slot
    newSlot.isAvailable = false;
    await newSlot.save();

    // Update Google Calendar
    try {
      const calendar = await getCalendarApi(appointment.doctor._id);
      const client = await User.findById(appointment.client);

      // Update old event to available
      await calendar.events.patch({
        calendarId: appointment.doctor.googleCalendarId,
        eventId: oldSlot.googleEventId,
        requestBody: {
          summary: `Available: ${oldSlot.type}`,
          transparency: 'transparent',
          attendees: []
        }
      });

      // Update new event to booked
      await calendar.events.patch({
        calendarId: appointment.doctor.googleCalendarId,
        eventId: newSlot.googleEventId,
        requestBody: {
          summary: `Appointment: ${client.name}`,
          description: `Patient: ${client.name}\nType: ${newSlot.type}\nRescheduled`,
          transparency: 'opaque',
          attendees: [
            { email: appointment.doctor.email },
            { email: client.email }
          ]
        }
      });
    } catch (calError) {
      console.error('Calendar update error:', calError);
    }

    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate('slot doctor client');

    res.json({ message: 'Appointment rescheduled successfully', appointment: updatedAppointment });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({ message: 'Failed to reschedule appointment' });
  }
};

// Clear all Google Calendar events for doctor
exports.clearAllCalendarEvents = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const doctor = await User.findById(userId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    console.log(`\n=== CLEARING ALL CALENDAR DATA FOR ${doctor.name} ===`);

    let deletedCount = 0;
    let failedCount = 0;
    let calendarConnected = false;

    // Try to clear Google Calendar if connected
    if (doctor.refreshToken) {
      try {
        calendarConnected = true;
        console.log('Google Calendar is connected - clearing calendar events...');

        const calendar = await getCalendarApi(userId);
        const calendarId = doctor.googleCalendarId || 'primary';

        // Get all events from the calendar
        const response = await calendar.events.list({
          calendarId: calendarId,
          maxResults: 2500,
          singleEvents: true,
          orderBy: 'startTime',
          timeMin: new Date('2024-01-01').toISOString(),
        });

        const events = response.data.items || [];
        console.log(`Found ${events.length} events to delete`);

        // Delete all events
        for (const event of events) {
          try {
            await calendar.events.delete({
              calendarId: calendarId,
              eventId: event.id,
            });
            deletedCount++;
          } catch (error) {
            failedCount++;
            console.log(`Failed to delete event: ${event.summary} - ${error.message}`);
          }
        }

        console.log(`✅ Deleted ${deletedCount} calendar events from Google Calendar`);
      } catch (calendarError) {
        console.log(`⚠️ Google Calendar error (continuing with database cleanup): ${calendarError.message}`);
      }
    } else {
      console.log('Google Calendar not connected - skipping calendar event deletion');
    }

    // Always clear database data
    console.log('Clearing database data...');

    // Clear database sync data
    await Slot.updateMany(
      { doctor: userId },
      { $set: { googleEventId: null } }
    );

    // Delete all slots and appointments
    const deletedSlots = await Slot.deleteMany({ doctor: userId });
    const deletedAppointments = await Appointment.deleteMany({ doctor: userId });

    // Clear blocked slots
    const availability = await DoctorAvailability.findOne({ doctor: userId });
    let blockedSlotsCleared = 0;
    if (availability && availability.blockedSlots.length > 0) {
      blockedSlotsCleared = availability.blockedSlots.length;
      availability.blockedSlots = [];
      availability.markModified('blockedSlots');
      await availability.save();
    }

    console.log(`✅ Deleted ${deletedSlots.deletedCount} slots from database`);
    console.log(`✅ Deleted ${deletedAppointments.deletedCount} appointments from database`);
    console.log(`✅ Cleared ${blockedSlotsCleared} blocked slots`);

    const message = calendarConnected
      ? 'Calendar and database cleared successfully'
      : 'Database cleared successfully (Google Calendar not connected)';

    res.json({
      message,
      summary: {
        calendarEventsDeleted: deletedCount,
        calendarEventsFailed: failedCount,
        slotsDeleted: deletedSlots.deletedCount,
        appointmentsDeleted: deletedAppointments.deletedCount,
        blockedSlotsCleared,
        googleCalendarConnected: calendarConnected
      }
    });
  } catch (error) {
    console.error('Clear calendar error:', error);
    res.status(500).json({
      message: 'Failed to clear calendar',
      error: error.message
    });
  }
};

module.exports = exports;