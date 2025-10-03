const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testPatientSlotSearch() {
  try {
    console.log('=== TESTING PATIENT SLOT SEARCH ===\n');

    // Step 1: Login as patient
    console.log('Step 1: Logging in as patient...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'patient@example.com',
      password: 'password123'
    }, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' }
    });

    const cookies = loginResponse.headers['set-cookie'];
    console.log('✅ Patient logged in successfully\n');

    // Step 2: Search for slots
    console.log('Step 2: Searching for available slots...');
    const doctorId = '68db970956f34f76afa60bda';
    const startDate = '2025-10-02T00:00:00.000Z';
    const endDate = '2025-10-03T23:59:59.000Z';

    console.log(`Doctor ID: ${doctorId}`);
    console.log(`Date Range: ${startDate} to ${endDate}\n`);

    const slotsResponse = await axios.get(`${BASE_URL}/calendar/slots`, {
      params: {
        doctorId,
        startDate,
        endDate
      },
      headers: {
        Cookie: cookies.join('; ')
      },
      withCredentials: true
    });

    console.log('✅ Response received:');
    console.log(`Found ${slotsResponse.data.count} slots`);

    if (slotsResponse.data.slots && slotsResponse.data.slots.length > 0) {
      console.log('\nSlots:');
      slotsResponse.data.slots.forEach((slot, index) => {
        console.log(`  ${index + 1}. ${slot.startTime} - ${slot.endTime} (${slot.type})`);
      });
    } else {
      console.log('\n⚠️ No slots found!');
    }

    console.log('\nRules:', JSON.stringify(slotsResponse.data.rules, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\nNote: Make sure a patient account exists with:');
      console.log('  Email: patient@example.com');
      console.log('  Password: password123');
    }
  }
}

testPatientSlotSearch();
