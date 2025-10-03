const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const Slot = require('./src/models/Slot');
const Appointment = require('./src/models/Appointment');
const DoctorAvailability = require('./src/models/DoctorAvailability');

async function clearDatabaseCalendarData() {
  try {
    console.log('=== CLEAR DATABASE CALENDAR DATA ===\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const doctorId = '68db970956f34f76afa60bda';

    console.log('STEP 1: Clearing all slots...');
    const deletedSlots = await Slot.deleteMany({ doctor: doctorId });
    console.log(`✅ Deleted ${deletedSlots.deletedCount} slots\n`);

    console.log('STEP 2: Clearing all appointments...');
    const deletedAppointments = await Appointment.deleteMany({ doctor: doctorId });
    console.log(`✅ Deleted ${deletedAppointments.deletedCount} appointments\n`);

    console.log('STEP 3: Clearing blocked slots...');
    const availability = await DoctorAvailability.findOne({ doctor: doctorId });
    if (availability) {
      const blockedCount = availability.blockedSlots.length;
      availability.blockedSlots = [];
      availability.markModified('blockedSlots');
      await availability.save();
      console.log(`✅ Cleared ${blockedCount} blocked slots\n`);
    } else {
      console.log('ℹ️ No availability document found\n');
    }

    console.log('STEP 4: Summary');
    console.log('━'.repeat(50));
    console.log(`✅ Slots deleted: ${deletedSlots.deletedCount}`);
    console.log(`✅ Appointments deleted: ${deletedAppointments.deletedCount}`);
    console.log(`✅ Blocked slots cleared: ${availability?.blockedSlots.length || 0}`);
    console.log('\n✅ Database is now clean!');
    console.log('\nNext steps:');
    console.log('1. Doctor can generate new slots');
    console.log('2. No old calendar events in database');
    console.log('3. Fresh start for the booking system');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

clearDatabaseCalendarData();
