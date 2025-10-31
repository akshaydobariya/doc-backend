const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const DentalService = require('./src/models/DentalService');
const ServicePage = require('./src/models/ServicePage');

const websiteId = '68fdef98acf58a93c04920a2';

async function fixIntegrationDirect() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Use updateMany to directly update all service pages
    const result = await ServicePage.updateMany(
      {
        websiteId: websiteId,
        $or: [
          { isIntegrated: { $ne: true } },
          { isIntegrated: { $exists: false } }
        ]
      },
      {
        $set: {
          isIntegrated: true,
          integratedAt: new Date()
        }
      }
    );

    console.log('Update result:', result);
    console.log(`Updated ${result.modifiedCount} service pages`);

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

    // Test the specific query that our public endpoint uses
    console.log('\n=== PUBLIC ENDPOINT TEST ===');
    const service = await DentalService.findOne({ slug: 'advanced-teeth-whitening', isActive: true });

    if (service) {
      const servicePage = await ServicePage.findOne({
        websiteId: websiteId,
        serviceId: service._id,
        $or: [
          { status: 'published' },
          { isIntegrated: true }
        ]
      }).populate('serviceId');

      if (servicePage) {
        console.log('✅ Public endpoint query will now work!');
        console.log('Service page found:', servicePage.serviceId?.name);
        console.log('Status:', servicePage.status);
        console.log('isIntegrated:', servicePage.isIntegrated);
      } else {
        console.log('❌ Public endpoint query still fails');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixIntegrationDirect();