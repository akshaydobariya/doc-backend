const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import models
const Slot = require('./src/models/Slot');
const DoctorAvailability = require('./src/models/DoctorAvailability');
const User = require('./src/models/User');

async function fixAllIssues() {
  try {
    console.log('=== CONNECTING TO DATABASE ===\n');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // ISSUE 1: Check and clear blocked slots
    console.log('=== ISSUE 1: BLOCKED SLOTS ===');
    const doctorId = '68db970956f34f76afa60bda';
    const availability = await DoctorAvailability.findOne({ doctor: doctorId });

    if (availability && availability.blockedSlots.length > 0) {
      console.log(`Found ${availability.blockedSlots.length} blocked slots:`);
      availability.blockedSlots.forEach((blocked, index) => {
        console.log(`  ${index + 1}. ${blocked.startTime.toISOString()} - ${blocked.endTime.toISOString()} (${blocked.reason})`);
      });

      console.log('\nClearing blocked slots...');
      availability.blockedSlots = [];
      await availability.save();
      console.log('✅ Blocked slots cleared\n');
    } else {
      console.log('✅ No blocked slots found\n');
    }

    // ISSUE 2: Delete old slots with wrong times (before UTC fix)
    console.log('=== ISSUE 2: OLD INCORRECT SLOTS ===');
    const wrongSlots = await Slot.find({
      doctor: doctorId,
      startTime: {
        $gte: new Date('2025-10-01T00:00:00.000Z'),
        $lt: new Date('2025-10-03T00:00:00.000Z')
      }
    }).sort('startTime');

    console.log(`Found ${wrongSlots.length} slots in Oct 1-2 range:`);

    const slotsToDelete = [];
    const slotsToKeep = [];

    wrongSlots.forEach(slot => {
      const hour = slot.startTime.getUTCHours();
      // Delete slots with wrong times (before 9 AM or after 5 PM UTC)
      if (hour < 9 || hour >= 17) {
        slotsToDelete.push(slot);
        console.log(`  ❌ DELETE: ${slot.startTime.toISOString()} (Hour: ${hour})`);
      } else {
        slotsToKeep.push(slot);
        console.log(`  ✅ KEEP: ${slot.startTime.toISOString()} (Hour: ${hour})`);
      }
    });

    if (slotsToDelete.length > 0) {
      const deleteIds = slotsToDelete.map(s => s._id);
      await Slot.deleteMany({ _id: { $in: deleteIds } });
      console.log(`\n✅ Deleted ${slotsToDelete.length} incorrect slots\n`);
    } else {
      console.log('\n✅ No incorrect slots to delete\n');
    }

    // ISSUE 3: Check remaining valid slots
    console.log('=== ISSUE 3: VALID SLOTS CHECK ===');
    const validSlots = await Slot.find({
      doctor: doctorId,
      isAvailable: true,
      startTime: {
        $gte: new Date('2025-10-02T00:00:00.000Z'),
        $lt: new Date('2025-10-03T00:00:00.000Z')
      }
    }).sort('startTime');

    console.log(`Found ${validSlots.length} valid available slots for Oct 2:`);
    if (validSlots.length > 0) {
      validSlots.slice(0, 5).forEach((slot, index) => {
        console.log(`  ${index + 1}. ${slot.startTime.toISOString()} - ${slot.endTime.toISOString()} (${slot.type}, available: ${slot.isAvailable})`);
      });
      if (validSlots.length > 5) {
        console.log(`  ... and ${validSlots.length - 5} more`);
      }
    }
    console.log();

    // ISSUE 4: Test the query that getAvailableSlots would use
    console.log('=== ISSUE 4: SIMULATING getAvailableSlots QUERY ===');
    const now = new Date();
    const minLeadTime = availability?.rules?.minLeadTime || 0;
    const maxAdvanceBooking = availability?.rules?.maxAdvanceBooking || 365;

    const minBookingTime = new Date(now.getTime() + minLeadTime * 60 * 60 * 1000);
    const maxBookingTime = new Date(now.getTime() + maxAdvanceBooking * 24 * 60 * 60 * 1000);

    const queryStartDate = new Date('2025-10-02T00:00:00.000Z');
    const queryEndDate = new Date('2025-10-03T23:59:59.000Z');

    const actualStartTime = new Date(Math.max(queryStartDate.getTime(), minBookingTime.getTime()));
    const actualEndTime = new Date(Math.min(queryEndDate.getTime(), maxBookingTime.getTime()));

    console.log('Query parameters:');
    console.log('  Now:', now.toISOString());
    console.log('  Min lead time:', minLeadTime, 'hours');
    console.log('  Min booking time:', minBookingTime.toISOString());
    console.log('  Query start:', queryStartDate.toISOString());
    console.log('  Query end:', queryEndDate.toISOString());
    console.log('  Actual start (after rules):', actualStartTime.toISOString());
    console.log('  Actual end (after rules):', actualEndTime.toISOString());

    const testQuery = {
      doctor: doctorId,
      startTime: {
        $gte: actualStartTime,
        $lte: actualEndTime
      },
      isAvailable: true
    };

    console.log('\nMongoDB query:', JSON.stringify(testQuery, null, 2));

    const queryResults = await Slot.find(testQuery).sort('startTime').limit(100);
    console.log(`\n✅ Query would return ${queryResults.length} slots`);

    if (queryResults.length > 0) {
      console.log('First 3 results:');
      queryResults.slice(0, 3).forEach((slot, index) => {
        console.log(`  ${index + 1}. ${slot.startTime.toISOString()} - ${slot.endTime.toISOString()}`);
      });
    } else {
      console.log('\n⚠️ PROBLEM IDENTIFIED: Query returns 0 slots');
      console.log('\nDEBUGGING:');

      // Check if the issue is the date range
      const allAvailableSlots = await Slot.find({
        doctor: doctorId,
        isAvailable: true
      }).sort('startTime').limit(10);

      console.log(`\nTotal available slots for doctor: ${allAvailableSlots.length}`);
      if (allAvailableSlots.length > 0) {
        console.log('Sample available slots:');
        allAvailableSlots.forEach((slot, index) => {
          const isInRange = slot.startTime >= actualStartTime && slot.startTime <= actualEndTime;
          console.log(`  ${index + 1}. ${slot.startTime.toISOString()} ${isInRange ? '✅ IN RANGE' : '❌ OUT OF RANGE'}`);
        });
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`✅ Blocked slots cleared`);
    console.log(`✅ Incorrect time slots deleted: ${slotsToDelete.length}`);
    console.log(`✅ Valid slots remaining: ${validSlots.length}`);
    console.log(`✅ Slots query would return: ${queryResults.length}`);

    if (queryResults.length === 0 && validSlots.length > 0) {
      console.log('\n⚠️ WARNING: Valid slots exist but query returns 0!');
      console.log('This indicates a query logic issue in getAvailableSlots');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from database');
  }
}

fixAllIssues();
