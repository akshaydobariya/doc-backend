const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const DentalService = require('./src/models/DentalService');
const ServicePage = require('./src/models/ServicePage');
const Website = require('./src/models/Website');

const serviceSlug = 'advanced-teeth-whitening';
const websiteId = '68fdef98acf58a93c04920a2';

async function debugServicePage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Check if the website exists
    console.log('\n=== WEBSITE CHECK ===');
    const website = await Website.findById(websiteId);
    if (website) {
      console.log('✅ Website found:', website.name);
      console.log('Website ID:', website._id.toString());
    } else {
      console.log('❌ Website NOT found with ID:', websiteId);
    }

    // 2. Check if the service exists
    console.log('\n=== SERVICE CHECK ===');
    const service = await DentalService.findOne({ slug: serviceSlug, isActive: true });
    if (service) {
      console.log('✅ Service found:', service.name);
      console.log('Service ID:', service._id.toString());
      console.log('Service slug:', service.slug);
      console.log('Service isActive:', service.isActive);
    } else {
      console.log('❌ Service NOT found with slug:', serviceSlug);
    }

    // 3. Check for service page
    console.log('\n=== SERVICE PAGE CHECK ===');
    if (service && website) {
      // Try exact match
      const servicePage1 = await ServicePage.findOne({
        websiteId: websiteId,
        serviceId: service._id
      });

      console.log('Query 1 - Exact match:');
      console.log('  websiteId:', websiteId);
      console.log('  serviceId:', service._id.toString());
      console.log('  Result:', servicePage1 ? '✅ Found' : '❌ Not found');

      if (servicePage1) {
        console.log('  Status:', servicePage1.status);
        console.log('  isIntegrated:', servicePage1.isIntegrated);
        console.log('  Page ID:', servicePage1._id.toString());
      }

      // Try with ObjectId conversion
      const servicePage2 = await ServicePage.findOne({
        websiteId: new mongoose.Types.ObjectId(websiteId),
        serviceId: service._id
      });

      console.log('\nQuery 2 - ObjectId conversion:');
      console.log('  Result:', servicePage2 ? '✅ Found' : '❌ Not found');

      // Try the exact query from our public endpoint
      const servicePage3 = await ServicePage.findOne({
        websiteId,
        serviceId: service._id,
        $or: [
          { status: 'published' },
          { isIntegrated: true }
        ]
      }).populate('serviceId');

      console.log('\nQuery 3 - Public endpoint query:');
      console.log('  Result:', servicePage3 ? '✅ Found' : '❌ Not found');

      if (servicePage3) {
        console.log('  Status:', servicePage3.status);
        console.log('  isIntegrated:', servicePage3.isIntegrated);
        console.log('  Populated serviceId slug:', servicePage3.serviceId?.slug);
      }

      // List all service pages for this website
      console.log('\n=== ALL SERVICE PAGES FOR THIS WEBSITE ===');
      const allPages = await ServicePage.find({ websiteId }).populate('serviceId');
      console.log('Total pages found:', allPages.length);

      allPages.forEach((page, index) => {
        console.log(`Page ${index + 1}:`);
        console.log('  ID:', page._id.toString());
        console.log('  ServiceId:', page.serviceId?._id?.toString());
        console.log('  Service Name:', page.serviceId?.name);
        console.log('  Service Slug:', page.serviceId?.slug);
        console.log('  Status:', page.status);
        console.log('  isIntegrated:', page.isIntegrated);
        console.log('  integratedAt:', page.integratedAt);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugServicePage();