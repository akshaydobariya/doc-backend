const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const DentalService = require('./src/models/DentalService');
const ServicePage = require('./src/models/ServicePage');

const websiteId = '68fdef98acf58a93c04920a2';

async function fixIntegrationStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all service pages for this website that are not integrated
    const servicePages = await ServicePage.find({
      websiteId: websiteId,
      $or: [
        { isIntegrated: { $ne: true } },
        { isIntegrated: { $exists: false } }
      ]
    }).populate('serviceId');

    console.log(`Found ${servicePages.length} service pages to update:`);

    for (const page of servicePages) {
      console.log(`\nUpdating page: ${page.serviceId?.name || 'Unknown'}`);
      console.log(`  Page ID: ${page._id}`);
      console.log(`  Current isIntegrated: ${page.isIntegrated}`);

      // Mark as integrated
      page.isIntegrated = true;
      page.integratedAt = new Date();

      await page.save();
      console.log(`  ✅ Updated - isIntegrated: ${page.isIntegrated}`);
    }

    console.log(`\n🎉 Successfully updated ${servicePages.length} service pages!`);

    // Verify the changes
    console.log('\n=== VERIFICATION ===');
    const updatedPages = await ServicePage.find({
      websiteId: websiteId
    }).populate('serviceId');

    updatedPages.forEach((page, index) => {
      console.log(`Page ${index + 1}: ${page.serviceId?.name}`);
      console.log(`  Status: ${page.status}`);
      console.log(`  isIntegrated: ${page.isIntegrated}`);
      console.log(`  integratedAt: ${page.integratedAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixIntegrationStatus();