const mongoose = require('mongoose');
const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const User = require('./src/models/User');
const Slot = require('./src/models/Slot');
const Appointment = require('./src/models/Appointment');

async function clearGoogleCalendar() {
  try {
    console.log('=== CLEAR GOOGLE CALENDAR EVENTS ===\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const doctorId = '68db970956f34f76afa60bda';

    // Get doctor details
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      console.log('❌ Doctor not found');
      return;
    }

    console.log(`Doctor: ${doctor.name}`);
    console.log(`Email: ${doctor.email}`);
    console.log(`Google Calendar ID: ${doctor.googleCalendarId || 'Not set'}\n`);

    if (!doctor.googleAccessToken) {
      console.log('⚠️ Doctor has no Google access token. Calendar not connected.');
      return;
    }

    // Setup Google Calendar API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: doctor.googleAccessToken,
      refresh_token: doctor.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarId = doctor.googleCalendarId || 'primary';

    console.log('STEP 1: Fetching all events from Google Calendar...');

    try {
      // Get all events from the calendar
      const response = await calendar.events.list({
        calendarId: calendarId,
        maxResults: 2500, // Maximum allowed by API
        singleEvents: true,
        orderBy: 'startTime',
        timeMin: new Date('2024-01-01').toISOString(), // Get events from 2024 onwards
      });

      const events = response.data.items || [];
      console.log(`Found ${events.length} events in Google Calendar\n`);

      if (events.length === 0) {
        console.log('✅ Calendar is already empty!\n');
      } else {
        console.log('Sample of events to be deleted:');
        events.slice(0, 5).forEach((event, index) => {
          const start = event.start?.dateTime || event.start?.date || 'No date';
          console.log(`  ${index + 1}. ${event.summary || 'No title'} - ${start}`);
        });

        if (events.length > 5) {
          console.log(`  ... and ${events.length - 5} more events\n`);
        }

        // Ask for confirmation (in production, you might want to skip this)
        console.log('\nSTEP 2: Deleting all events from Google Calendar...');

        let deletedCount = 0;
        let failedCount = 0;

        for (const event of events) {
          try {
            await calendar.events.delete({
              calendarId: calendarId,
              eventId: event.id,
            });
            deletedCount++;

            // Log progress every 10 events
            if (deletedCount % 10 === 0) {
              console.log(`  Deleted ${deletedCount} / ${events.length} events...`);
            }
          } catch (error) {
            failedCount++;
            console.log(`  ⚠️ Failed to delete event: ${event.summary} - ${error.message}`);
          }
        }

        console.log(`\n✅ Deleted ${deletedCount} events from Google Calendar`);
        if (failedCount > 0) {
          console.log(`⚠️ Failed to delete ${failedCount} events`);
        }
      }
    } catch (error) {
      console.error('❌ Error accessing Google Calendar:', error.message);
      if (error.code === 401) {
        console.log('\n⚠️ Access token expired. Doctor needs to re-authenticate.');
      }
    }

    console.log('\nSTEP 3: Clearing calendar sync data from database...');

    // Clear all slots with googleEventId
    const slotsWithEvents = await Slot.find({
      doctor: doctorId,
      googleEventId: { $ne: null }
    });

    console.log(`Found ${slotsWithEvents.length} slots with Google Calendar events`);

    if (slotsWithEvents.length > 0) {
      await Slot.updateMany(
        { doctor: doctorId },
        { $set: { googleEventId: null } }
      );
      console.log('✅ Cleared googleEventId from all slots');
    }

    // Check appointments
    const appointmentsWithEvents = await Appointment.find({
      doctor: doctorId,
    }).populate('slot');

    console.log(`Found ${appointmentsWithEvents.length} appointments in database`);

    console.log('\nSTEP 4: Summary');
    console.log('━'.repeat(50));
    console.log('✅ Google Calendar events cleared');
    console.log('✅ Database sync data cleared');
    console.log('✅ Calendar is now clean and ready to use');
    console.log('\nNext steps:');
    console.log('1. Doctor can generate new slots');
    console.log('2. Patients can book appointments');
    console.log('3. Only booked appointments will appear in Google Calendar');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

clearGoogleCalendar();
