const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const Slot = require('./src/models/Slot');
const DoctorAvailability = require('./src/models/DoctorAvailability');

async function completeCleanup() {
  try {
    console.log('=== COMPLETE DATABASE CLEANUP ===\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const doctorId = '68db970956f34f76afa60bda';

    // STEP 1: Delete ALL slots for this doctor (start fresh)
    console.log('STEP 1: Deleting ALL existing slots...');
    const deleteResult = await Slot.deleteMany({ doctor: doctorId });
    console.log(`✅ Deleted ${deleteResult.deletedCount} slots\n`);

    // STEP 2: Permanently clear blocked slots
    console.log('STEP 2: Clearing blocked slots permanently...');
    const availability = await DoctorAvailability.findOne({ doctor: doctorId });

    if (availability) {
      console.log(`Current blocked slots: ${availability.blockedSlots.length}`);
      availability.blockedSlots.forEach((blocked, index) => {
        console.log(`  ${index + 1}. ${blocked.startTime.toISOString()} - ${blocked.endTime.toISOString()}`);
      });

      availability.blockedSlots = [];
      availability.markModified('blockedSlots');
      await availability.save();
      console.log('✅ Blocked slots cleared and saved\n');
    } else {
      console.log('⚠️ No availability document found\n');
    }

    // STEP 3: Verify cleanup
    console.log('STEP 3: Verifying cleanup...');
    const remainingSlots = await Slot.countDocuments({ doctor: doctorId });
    const updatedAvailability = await DoctorAvailability.findOne({ doctor: doctorId });

    console.log(`Remaining slots: ${remainingSlots}`);
    console.log(`Blocked slots: ${updatedAvailability?.blockedSlots.length || 0}`);

    if (remainingSlots === 0 && (updatedAvailability?.blockedSlots.length || 0) === 0) {
      console.log('\n✅ CLEANUP SUCCESSFUL!');
      console.log('\nNext steps:');
      console.log('1. Doctor should generate new slots');
      console.log('2. All new slots will have correct UTC times');
      console.log('3. No blocked slots will interfere');
    } else {
      console.log('\n⚠️ CLEANUP INCOMPLETE!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

completeCleanup();
