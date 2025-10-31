const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const ServicePage = require('./src/models/ServicePage');
const DentalService = require('./src/models/DentalService');
const Website = require('./src/models/Website');

/**
 * Health Check for Service Page Implementation
 * Verifies all components are working correctly
 */

const healthCheck = async () => {
  try {
    console.log('🏥 Service Page Implementation Health Check');
    console.log('==========================================\n');

    // Connect to database
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check models
    console.log('2. Checking Database Models...');

    const websiteCount = await Website.countDocuments();
    console.log(`✅ Websites: ${websiteCount} found`);

    const serviceCount = await DentalService.countDocuments();
    console.log(`✅ Dental Services: ${serviceCount} found`);

    const servicePageCount = await ServicePage.countDocuments();
    console.log(`✅ Service Pages: ${servicePageCount} found\n`);

    if (servicePageCount === 0) {
      console.log('⚠️  No service pages found. Run: node seed-service-pages.js\n');
    }

    // Check service page features
    console.log('3. Checking Service Page Features...');

    const servicePage = await ServicePage.findOne().populate(['serviceId', 'websiteId']);
    if (servicePage) {
      console.log(`✅ Service Page Model: ${servicePage.title}`);
      console.log(`✅ Version Control: ${servicePage.versions?.length || 0} versions`);
      console.log(`✅ Current Version: ${servicePage.currentVersion}`);
      console.log(`✅ Editing Mode: ${servicePage.editingMode}`);
      console.log(`✅ Status: ${servicePage.status}`);

      // Test helper methods
      try {
        const capabilities = servicePage.getEditingCapabilities();
        console.log(`✅ Editing Capabilities: Available`);

        const versionData = servicePage.getCurrentVersionData();
        console.log(`✅ Version Data: ${versionData ? 'Available' : 'None'}`);

        const structuredData = servicePage.generateStructuredData();
        console.log(`✅ Structured Data: ${structuredData ? 'Generated' : 'Failed'}`);
      } catch (error) {
        console.log(`❌ Model Methods: ${error.message}`);
      }
    } else {
      console.log('❌ No service pages found for testing');
    }

    console.log('\n4. Checking Static Site Generator...');
    try {
      const staticSiteGenerator = require('./src/services/staticSiteGenerator');
      console.log('✅ Static Site Generator: Loaded');

      // Check if methods exist
      if (typeof staticSiteGenerator.generateServicePageHTML === 'function') {
        console.log('✅ Service Page HTML Generation: Available');
      } else {
        console.log('❌ Service Page HTML Generation: Missing');
      }

      if (typeof staticSiteGenerator.generateServicePage === 'function') {
        console.log('✅ Individual Service Page Generation: Available');
      } else {
        console.log('❌ Individual Service Page Generation: Missing');
      }
    } catch (error) {
      console.log(`❌ Static Site Generator: ${error.message}`);
    }

    console.log('\n5. Checking API Routes...');
    try {
      const servicePageRoutes = require('./src/routes/servicePages');
      console.log('✅ Service Page Routes: Loaded');
    } catch (error) {
      console.log(`❌ Service Page Routes: ${error.message}`);
    }

    try {
      const servicePageController = require('./src/controllers/servicePageController');
      console.log('✅ Service Page Controller: Loaded');
    } catch (error) {
      console.log(`❌ Service Page Controller: ${error.message}`);
    }

    console.log('\n6. Recommendations...');

    if (websiteCount === 0) {
      console.log('📝 Create at least one website to test service pages');
    }

    if (serviceCount === 0) {
      console.log('📝 Dental services will be created automatically by seeder');
    }

    if (servicePageCount === 0) {
      console.log('📝 Run: node seed-service-pages.js to create test data');
    }

    console.log('\n✅ Health check completed successfully!');
    console.log('\n🚀 Ready for testing:');
    console.log('   1. Start backend: npm start');
    console.log('   2. Start frontend: npm start');
    console.log('   3. Navigate to: http://localhost:3000/websites');
    console.log('   4. Click "Service Pages" tab');

  } catch (error) {
    console.error('❌ Health check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
};

// Run health check
if (require.main === module) {
  healthCheck();
}

module.exports = healthCheck;