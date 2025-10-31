const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const DentalService = require('./src/models/DentalService');
const ServicePage = require('./src/models/ServicePage');
const Website = require('./src/models/Website');

const serviceSlug = 'advanced-teeth-whitening';
const websiteId = '68fdef98acf58a93c04920a2';

async function fixMissingServicePage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the service
    const service = await DentalService.findOne({ slug: serviceSlug });
    if (!service) {
      console.log('Service not found');
      return;
    }

    console.log('Found service:', service.name);

    // Check if service page already exists
    const existingPage = await ServicePage.findOne({
      websiteId: websiteId,
      serviceId: service._id
    });

    if (existingPage) {
      console.log('Service page already exists:', existingPage._id);
      console.log('Status:', existingPage.status);
      console.log('Integrated:', existingPage.isIntegrated);

      // If it exists but isn't integrated, mark it as integrated
      if (!existingPage.isIntegrated) {
        existingPage.isIntegrated = true;
        existingPage.integratedAt = new Date();
        await existingPage.save();
        console.log('Marked service page as integrated');
      }
      return;
    }

    // Create the missing service page
    const servicePageData = {
      websiteId: websiteId,
      serviceId: service._id,
      status: 'draft',
      isIntegrated: true,
      integratedAt: new Date(),
      content: {
        hero: {
          title: service.name,
          subtitle: service.shortDescription,
          description: service.fullDescription,
          ctaText: 'Book Consultation'
        },
        overview: {
          title: 'Treatment Overview',
          content: service.fullDescription
        },
        benefits: {
          title: 'Benefits',
          introduction: 'Experience the many advantages of our advanced treatment:',
          list: service.benefits?.map(benefit => ({
            title: benefit,
            description: ''
          })) || []
        },
        faq: {
          title: 'Frequently Asked Questions',
          introduction: 'Common questions about this treatment:',
          questions: service.faqs || []
        },
        cta: {
          title: `Ready for ${service.name}?`,
          subtitle: `Schedule your ${service.name} consultation today.`,
          buttonText: 'Book Consultation',
          phoneNumber: '(555) 123-4567'
        }
      },
      seo: service.seo || {},
      design: {
        template: 'modern',
        primaryColor: '#007cba',
        secondaryColor: '#2563eb'
      }
    };

    const servicePage = new ServicePage(servicePageData);
    await servicePage.save();

    console.log('Created service page:', servicePage._id);
    console.log('Service page is integrated and ready for viewing');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixMissingServicePage();