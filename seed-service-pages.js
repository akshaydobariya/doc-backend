const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const ServicePage = require('./src/models/ServicePage');
const DentalService = require('./src/models/DentalService');
const Website = require('./src/models/Website');
const User = require('./src/models/User');

/**
 * Seed Service Pages for Testing
 * Creates sample service pages for existing websites
 */

// Generic service page content template - will be dynamically populated based on service data
const createServicePageContent = (serviceName, serviceData) => ({
  hero: {
    title: serviceName,
    subtitle: serviceData?.shortDescription || `Professional ${serviceName} treatment for optimal oral health`,
    description: serviceData?.fullDescription || `Experience advanced ${serviceName} with our expert dental team.`
  },
  intro: serviceData?.fullDescription || `${serviceName} is a professional dental treatment designed to improve your oral health and enhance your smile. Our experienced dental team uses state-of-the-art technology and proven techniques to deliver exceptional results with patient comfort as our top priority.`,
  overview: {
    title: `What is ${serviceName}?`,
    content: serviceData?.fullDescription || `${serviceName} is a professional dental treatment that addresses your specific oral health needs using advanced techniques and technology.`,
    highlights: serviceData?.benefits?.slice(0, 5) || [
      "Professional dental care",
      "Advanced treatment techniques",
      "Patient comfort focus",
      "Long-lasting results",
      "Expert dental team"
    ]
  },
  benefits: {
    title: `Benefits of ${serviceName}`,
    introduction: `Discover the advantages of choosing ${serviceName} for your dental treatment:`,
    list: serviceData?.benefits?.slice(0, 6).map((benefit, index) => {
      const icons = ["😌", "⚡", "🎯", "💧", "🌿", "🛡️", "🦷", "✨"];
      return {
        title: benefit.split(':')[0] || `Benefit ${index + 1}`,
        description: benefit.split(':')[1] || benefit,
        icon: icons[index % icons.length]
      };
    }) || [
      {
        title: "Professional Care",
        description: `Expert ${serviceName} treatment performed by experienced dental professionals`,
        icon: "😌"
      },
      {
        title: "Advanced Technology",
        description: "State-of-the-art equipment and modern techniques for optimal results",
        icon: "⚡"
      },
      {
        title: "Patient Comfort",
        description: "Comfortable procedures designed to minimize discomfort and anxiety",
        icon: "🎯"
      },
      {
        title: "Lasting Results",
        description: "Long-term solutions that improve your oral health and confidence",
        icon: "💧"
      },
      {
        title: "Expert Team",
        description: "Experienced dental specialists dedicated to your oral health",
        icon: "🌿"
      },
      {
        title: "Quality Care",
        description: "Comprehensive treatment approach for optimal patient outcomes",
        icon: "🛡️"
      }
    ]
  },
  procedure: {
    title: `The ${serviceName} Process`,
    introduction: `Our ${serviceName} procedures follow a careful, step-by-step approach to ensure optimal results:`,
    steps: [
      {
        stepNumber: 1,
        title: "Initial Consultation",
        description: `Comprehensive examination to determine the best ${serviceName} approach for you`,
        duration: "30 minutes"
      },
      {
        stepNumber: 2,
        title: "Treatment Planning",
        description: "Custom treatment plan designed specifically for your needs",
        duration: "15 minutes"
      },
      {
        stepNumber: 3,
        title: `${serviceName} Treatment`,
        description: `Professional ${serviceName} procedure performed with advanced technology`,
        duration: "30-60 minutes"
      },
      {
        stepNumber: 4,
        title: "Post-Treatment Care",
        description: "Follow-up instructions and monitoring for optimal healing",
        duration: "15 minutes"
      }
    ],
    additionalInfo: `All ${serviceName} procedures are performed in a comfortable, sterile environment with the latest safety protocols.`
  },
  faq: {
    title: "Frequently Asked Questions",
    introduction: `Common questions about our ${serviceName} services:`,
    questions: [
      {
        question: `Is ${serviceName} painful?`,
        answer: `Most patients experience little to no discomfort during ${serviceName} procedures. We use advanced techniques to ensure your comfort throughout treatment.`,
        order: 1
      },
      {
        question: `How long does ${serviceName} take?`,
        answer: `Treatment time varies depending on your specific needs, but most ${serviceName} treatments are completed within 30-90 minutes.`,
        order: 2
      },
      {
        question: `What can ${serviceName} treat?`,
        answer: `${serviceName} can address various dental conditions with enhanced precision and comfort. We'll discuss specific applications during your consultation.`,
        order: 3
      },
      {
        question: "How long is the recovery time?",
        answer: `Recovery time varies by individual, but most patients can return to normal activities within 24-48 hours after ${serviceName} treatment.`,
        order: 4
      },
      {
        question: `Is ${serviceName} safe?`,
        answer: `Yes, ${serviceName} is considered very safe when performed by trained professionals. Our team is experienced in advanced dental techniques.`,
        order: 5
      }
    ]
  },
  cta: {
    title: `Ready to Experience ${serviceName}?`,
    subtitle: "Take the first step towards improved oral health",
    buttonText: "Schedule Consultation",
    phoneNumber: "(555) 123-4567",
    email: "info@dentalcare.com",
    backgroundColor: "#2563eb"
  }
});

const seedServicePages = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an existing website and user
    const website = await Website.findOne().populate('doctorId');
    if (!website) {
      console.log('No websites found. Please create a website first.');
      return;
    }

    console.log(`Found website: ${website.name || website.subdomain || 'Unknown'}`);
    console.log(`Website ID: ${website._id}`);
    console.log(`Doctor: ${website.doctorId?.email || 'Unknown doctor'}`);

    // Ensure we have a valid doctor ID
    let doctorId = website.doctorId?._id || website.doctorId;
    if (!doctorId) {
      // Find any doctor if the website doesn't have one
      const anyDoctor = await User.findOne({ role: 'doctor' });
      if (anyDoctor) {
        doctorId = anyDoctor._id;
        console.log(`Using doctor: ${anyDoctor.email}`);
      } else {
        console.log('No doctors found in the system. Please create a doctor user first.');
        return;
      }
    }

    // Find or create a dental service using environment variables or defaults
    const serviceName = process.env.SEED_SERVICE_NAME || 'General Dental Treatment';
    const serviceCategory = process.env.SEED_SERVICE_CATEGORY || 'general-dentistry';
    const serviceShortDesc = process.env.SEED_SERVICE_SHORT_DESC || 'Professional dental care for optimal oral health';
    const serviceFullDesc = process.env.SEED_SERVICE_FULL_DESC || 'Comprehensive dental services designed to maintain and improve your oral health with modern techniques and personalized care.';
    const serviceBenefits = process.env.SEED_SERVICE_BENEFITS ?
      process.env.SEED_SERVICE_BENEFITS.split(',').map(b => b.trim()) :
      [
        'Comprehensive oral health assessment',
        'Professional dental care',
        'Modern treatment techniques',
        'Personalized treatment plans'
      ];

    let dentalService = await DentalService.findOne({ name: serviceName });
    if (!dentalService) {
      dentalService = new DentalService({
        name: serviceName,
        category: serviceCategory,
        shortDescription: serviceShortDesc,
        fullDescription: serviceFullDesc,
        isActive: true,
        benefits: serviceBenefits
      });
      await dentalService.save();
      console.log(`Created dental service: ${serviceName}`);
    }

    // Check if service page already exists
    const existingServicePage = await ServicePage.findOne({
      websiteId: website._id,
      serviceId: dentalService._id
    });

    if (existingServicePage) {
      console.log('Service page already exists for this website and service');
      return;
    }

    // Create dynamic service page content
    const servicePageContent = createServicePageContent(dentalService.name, dentalService);

    // Create service page
    const servicePage = new ServicePage({
      websiteId: website._id,
      serviceId: dentalService._id,
      doctorId: doctorId,
      title: `${dentalService.name} - Advanced Dental Treatment`,
      slug: dentalService.name.toLowerCase().replace(/\s+/g, '-'),
      status: 'published',
      content: servicePageContent,
      seo: {
        metaTitle: `${dentalService.name} | Advanced Treatment`,
        metaDescription: `Experience professional ${dentalService.name.toLowerCase()} with advanced technology. ${dentalService.shortDescription}`,
        keywords: [dentalService.name.toLowerCase(), 'dental treatment', 'advanced dentistry', dentalService.category],
        focusKeyword: dentalService.name.toLowerCase()
      },
      design: {
        template: 'standard',
        colorScheme: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#10b981'
        }
      },
      generation: {
        lastGenerated: new Date(),
        generatedBy: 'manual',
        promptUsed: 'Sample service page for testing'
      },
      analytics: {
        views: 0,
        uniqueViews: 0,
        bookings: 0
      },
      isIntegrated: true,
      integratedAt: new Date(),
      editingMode: 'template'
    });

    // Create initial version
    await servicePage.createVersion(
      servicePageContent,
      [], // No components for template mode
      servicePage.seo,
      servicePage.design,
      doctorId,
      'Initial service page creation'
    );

    await servicePage.save();
    console.log(`Created service page: ${servicePage.title}`);

    // Create a second service page for variety
    let rootCanalService = await DentalService.findOne({ name: 'Root Canal Treatment' });
    if (!rootCanalService) {
      rootCanalService = new DentalService({
        name: 'Root Canal Treatment',
        category: 'general-dentistry',
        shortDescription: 'Expert root canal therapy to save your natural teeth',
        fullDescription: 'Modern root canal treatment is comfortable and highly successful. Our expert endodontic care preserves your natural smile.',
        isActive: true,
        benefits: [
          'Endodontic therapy',
          'Pulp removal',
          'Canal cleaning',
          'Tooth restoration'
        ]
      });
      await rootCanalService.save();
      console.log('Created dental service: Root Canal Treatment');
    }

    // Create dynamic content for root canal service
    const rootCanalContent = createServicePageContent(rootCanalService.name, rootCanalService);

    const existingRootCanalPage = await ServicePage.findOne({
      websiteId: website._id,
      serviceId: rootCanalService._id
    });

    if (!existingRootCanalPage) {
      const rootCanalPage = new ServicePage({
        websiteId: website._id,
        serviceId: rootCanalService._id,
        doctorId: doctorId,
        title: `${rootCanalService.name} - Expert Endodontic Care`,
        slug: rootCanalService.name.toLowerCase().replace(/\s+/g, '-'),
        status: 'draft',
        content: rootCanalContent,
        seo: {
          metaTitle: `${rootCanalService.name} | Expert Care`,
          metaDescription: `Expert ${rootCanalService.name.toLowerCase()} to save your natural teeth. ${rootCanalService.shortDescription}`,
          keywords: [rootCanalService.name.toLowerCase(), 'endodontic therapy', 'tooth pain relief', rootCanalService.category],
          focusKeyword: rootCanalService.name.toLowerCase()
        },
        design: {
          template: 'standard',
          colorScheme: {
            primary: '#dc2626',
            secondary: '#64748b',
            accent: '#f59e0b'
          }
        },
        generation: {
          lastGenerated: new Date(),
          generatedBy: 'manual',
          promptUsed: 'Sample root canal service page for testing'
        },
        analytics: {
          views: 0,
          uniqueViews: 0,
          bookings: 0
        },
        isIntegrated: false,
        editingMode: 'template'
      });

      await rootCanalPage.createVersion(
        rootCanalContent,
        [],
        rootCanalPage.seo,
        rootCanalPage.design,
        doctorId,
        'Initial root canal service page creation'
      );

      await rootCanalPage.save();
      console.log(`Created service page: ${rootCanalPage.title}`);
    }

    console.log('Service page seeding completed successfully!');
    console.log('\nYou can now test the service page editing functionality:');
    console.log('1. Log in as a doctor');
    console.log('2. Go to Website Manager');
    console.log('3. Click on "Service Pages" tab');
    console.log('4. Select your website');
    console.log('5. Click "Edit Service Page" on any service page');

  } catch (error) {
    console.error('Error seeding service pages:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seeder
if (require.main === module) {
  seedServicePages();
}

module.exports = seedServicePages;