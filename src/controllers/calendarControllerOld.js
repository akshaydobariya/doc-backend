const { google } = require('googleapis');
const { client } = require('../config/google');
const User = require('../models/User');
const Slot = require('../models/Slot');
const Appointment = require('../models/Appointment');

// Create a Calendar API client
const getCalendarApi = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.refreshToken) {
    throw new Error('User not found or no refresh token');
  }

  client.setCredentials({ refresh_token: user.refreshToken });
  return google.calendar({ version: 'v3', auth: client });
};

exports.syncCalendar = async (req, res) => {
  try {
    const calendar = await getCalendarApi(req.session.userId);
    
    // Get primary calendar ID
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items.find(cal => cal.primary);
    
    if (!primaryCalendar) {
      throw new Error('Primary calendar not found');
    }

    // Update user with calendar ID
    await User.findByIdAndUpdate(req.session.userId, {
      googleCalendarId: primaryCalendar.id,
      calendarConnected: true
    });

    // Initial sync of existing events
    const events = await calendar.events.list({
      calendarId: primaryCalendar.id,
      timeMin: new Date().toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    // Process existing events
    for (const event of events.data.items) {
      const startTime = new Date(event.start.dateTime || event.start.date);
      const endTime = new Date(event.end.dateTime || event.end.date);
      
      // Create or update slot
      await Slot.findOneAndUpdate(
        { googleEventId: event.id, doctor: req.session.userId },
        {
          startTime,
          endTime,
          duration: Math.round((endTime - startTime) / (1000 * 60)),
          type: 'Imported Event',
          isAvailable: false,
          googleEventId: event.id
        },
        { upsert: true }
      );
    }

    // Setup webhook for real-time updates
    await axios.post(`${process.env.BACKEND_URL}/api/webhook/setup`, {
      userId: req.session.userId
    });

    res.json({ message: 'Calendar synced and webhook setup successfully' });
  } catch (error) {
    console.error('Calendar sync error:', error);
    res.status(500).json({ message: 'Calendar sync failed' });
  }
};

exports.createSlot = async (req, res) => {
  try {
    const { startTime, endTime, type } = req.body;
    
    // Create slot in database
    const slot = new Slot({
      doctor: req.session.userId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration: Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60)),
      type,
      isAvailable: true
    });

    // Create event in Google Calendar
    const calendar = await getCalendarApi(req.session.userId);
    const user = await User.findById(req.session.userId);

    const event = await calendar.events.insert({
      calendarId: user.googleCalendarId,
      requestBody: {
        summary: `Available: ${type}`,
        start: {
          dateTime: new Date(startTime).toISOString()
        },
        end: {
          dateTime: new Date(endTime).toISOString()
        },
        transparency: 'transparent' // Show as available
      }
    });

    slot.googleEventId = event.data.id;
    await slot.save();

    res.json({ slot });
  } catch (error) {
    console.error('Create slot error:', error);
    res.status(500).json({ message: 'Failed to create slot' });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, startDate, endDate } = req.query;
    
    const slots = await Slot.find({
      doctor: doctorId,
      startTime: { 
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      isAvailable: true
    }).sort('startTime');

    res.json({ slots });
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ message: 'Failed to get slots' });
  }
};

exports.bookSlot = async (req, res) => {
  try {
    const { slotId } = req.body;
    
    const slot = await Slot.findById(slotId);
    if (!slot || !slot.isAvailable) {
      return res.status(400).json({ message: 'Slot not available' });
    }

    // Create appointment
    const appointment = new Appointment({
      slot: slotId,
      doctor: slot.doctor,
      client: req.session.userId
    });

    // Update Google Calendar event
    const calendar = await getCalendarApi(slot.doctor);
    const doctor = await User.findById(slot.doctor);
    const client = await User.findById(req.session.userId);

    const event = await calendar.events.patch({
      calendarId: doctor.googleCalendarId,
      eventId: slot.googleEventId,
      requestBody: {
        summary: `Appointment with ${client.name}`,
        description: `Appointment type: ${slot.type}`,
        transparency: 'opaque', // Show as busy
        attendees: [
          { email: doctor.email },
          { email: client.email }
        ]
      }
    });

    // Update appointment with Google event ID
    appointment.googleEventId = event.data.id;
    await appointment.save();

    // Mark slot as unavailable
    slot.isAvailable = false;
    await slot.save();

    res.json({ appointment });
  } catch (error) {
    console.error('Book slot error:', error);
    res.status(500).json({ message: 'Failed to book slot' });
  }
};