/**
 * Seed 18 Comprehensive Dental Services
 * Creates all 18 dental services with proper structure for DentalService model
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Define the 18 dental services with correct schema structure
const dentalServices = [
  {
    name: 'Root Canal Treatment',
    category: 'endodontics',
    shortDescription: 'Advanced endodontic treatment to save severely infected or damaged teeth and restore oral health',
    fullDescription: 'Comprehensive root canal therapy using modern techniques to eliminate infection, preserve natural teeth, and restore oral health with minimal discomfort.',
    seo: {
      keywords: ['root canal', 'endodontics', 'tooth infection', 'pain relief', 'dental treatment'],
      focusKeyword: 'root canal treatment'
    },
    pricing: {
      priceRange: { min: 800, max: 1500 },
      currency: 'USD'
    },
    duration: {
      procedure: 90
    },
    isActive: true
  },
  {
    name: 'Composite Fillings',
    category: 'general-dentistry',
    shortDescription: 'Tooth-colored composite resin fillings for cavities and minor tooth damage restoration',
    fullDescription: 'Modern composite fillings that match your natural tooth color, providing durable and aesthetically pleasing cavity treatment.',
    seo: {
      keywords: ['composite fillings', 'tooth colored fillings', 'cavity treatment', 'dental restoration'],
      focusKeyword: 'composite fillings'
    },
    pricing: {
      priceRange: { min: 150, max: 300 },
      currency: 'USD'
    },
    duration: {
      procedure: 30
    },
    isActive: true
  },
  {
    name: 'Dental Implants',
    category: 'oral-surgery',
    shortDescription: 'Permanent tooth replacement solution using titanium implants for missing teeth',
    fullDescription: 'State-of-the-art dental implants that provide permanent, natural-looking tooth replacement with excellent function and durability.',
    seo: {
      keywords: ['dental implants', 'tooth replacement', 'implant surgery', 'missing teeth', 'oral surgery'],
      focusKeyword: 'dental implants'
    },
    pricing: {
      priceRange: { min: 2500, max: 5000 },
      currency: 'USD'
    },
    duration: {
      procedure: 120
    },
    isActive: true,
    isPremium: true
  },
  {
    name: 'Orthodontics (Braces/Aligners/Invisalign)',
    category: 'orthodontics',
    shortDescription: 'Comprehensive orthodontic treatment including braces, clear aligners, and Invisalign for teeth straightening',
    fullDescription: 'Complete orthodontic solutions from traditional braces to clear aligners and Invisalign for achieving perfectly aligned teeth.',
    seo: {
      keywords: ['orthodontics', 'braces', 'invisalign', 'clear aligners', 'teeth straightening'],
      focusKeyword: 'orthodontics'
    },
    pricing: {
      priceRange: { min: 3000, max: 8000 },
      currency: 'USD'
    },
    duration: {
      procedure: 60
    },
    isActive: true,
    isPopular: true
  },
  {
    name: 'Tooth Extractions',
    category: 'oral-surgery',
    shortDescription: 'Safe and comfortable tooth extraction procedures for damaged or problematic teeth',
    fullDescription: 'Professional tooth extraction services using modern techniques to ensure comfort and promote rapid healing.',
    seo: {
      keywords: ['tooth extraction', 'tooth removal', 'oral surgery', 'dental extraction'],
      focusKeyword: 'tooth extraction'
    },
    pricing: {
      priceRange: { min: 200, max: 600 },
      currency: 'USD'
    },
    duration: {
      procedure: 45
    },
    isActive: true
  },
  {
    name: 'Wisdom Tooth Removal',
    category: 'oral-surgery',
    shortDescription: 'Specialized wisdom tooth extraction to prevent complications and maintain oral health',
    fullDescription: 'Expert wisdom tooth removal procedures designed to prevent impaction, crowding, and other complications.',
    seo: {
      keywords: ['wisdom teeth', 'wisdom tooth removal', 'impacted teeth', 'oral surgery'],
      focusKeyword: 'wisdom tooth removal'
    },
    pricing: {
      priceRange: { min: 300, max: 800 },
      currency: 'USD'
    },
    duration: {
      procedure: 60
    },
    isActive: true
  },
  {
    name: 'Fixed Partial Denture (Crowns and Bridges)',
    category: 'prosthodontics',
    shortDescription: 'Custom crowns and bridges to restore damaged teeth and replace missing teeth permanently',
    fullDescription: 'High-quality fixed partial dentures including crowns and bridges for comprehensive tooth restoration and replacement.',
    seo: {
      keywords: ['dental crowns', 'dental bridges', 'fixed dentures', 'tooth restoration', 'prosthodontics'],
      focusKeyword: 'crowns and bridges'
    },
    pricing: {
      priceRange: { min: 1200, max: 3000 },
      currency: 'USD'
    },
    duration: {
      procedure: 90
    },
    isActive: true
  },
  {
    name: 'Panoramic Dental X-Ray',
    category: 'general-dentistry',
    shortDescription: 'Comprehensive panoramic X-ray imaging for complete oral and dental health assessment',
    fullDescription: 'Advanced panoramic X-ray technology providing complete oral health evaluation in a single, comfortable scan.',
    seo: {
      keywords: ['panoramic xray', 'dental imaging', 'oral diagnosis', 'dental examination'],
      focusKeyword: 'panoramic dental x-ray'
    },
    pricing: {
      priceRange: { min: 100, max: 200 },
      currency: 'USD'
    },
    duration: {
      procedure: 15
    },
    isActive: true
  },
  {
    name: 'Dental Crowns',
    category: 'prosthodontics',
    shortDescription: 'Custom dental crowns to restore damaged teeth and improve both function and appearance',
    fullDescription: 'Premium dental crowns crafted from high-quality materials to restore tooth structure, function, and aesthetics.',
    seo: {
      keywords: ['dental crowns', 'tooth caps', 'tooth restoration', 'prosthodontics'],
      focusKeyword: 'dental crowns'
    },
    pricing: {
      priceRange: { min: 800, max: 1800 },
      currency: 'USD'
    },
    duration: {
      procedure: 75
    },
    isActive: true,
    isPopular: true
  },
  {
    name: 'Complete Denture',
    category: 'prosthodontics',
    shortDescription: 'Full dentures for complete tooth replacement and restoration of oral function',
    fullDescription: 'Custom-fitted complete dentures providing full mouth restoration with comfortable fit and natural appearance.',
    seo: {
      keywords: ['complete dentures', 'full dentures', 'tooth replacement', 'prosthodontics'],
      focusKeyword: 'complete denture'
    },
    pricing: {
      priceRange: { min: 1500, max: 4000 },
      currency: 'USD'
    },
    duration: {
      procedure: 120
    },
    isActive: true
  },
  {
    name: 'Periodontal Scaling',
    category: 'periodontics',
    shortDescription: 'Deep cleaning treatment for gum disease and periodontal health maintenance',
    fullDescription: 'Professional periodontal scaling and root planing to treat gum disease and restore periodontal health.',
    seo: {
      keywords: ['periodontal scaling', 'deep cleaning', 'gum disease treatment', 'periodontics'],
      focusKeyword: 'periodontal scaling'
    },
    pricing: {
      priceRange: { min: 200, max: 500 },
      currency: 'USD'
    },
    duration: {
      procedure: 60
    },
    isActive: true
  },
  {
    name: 'Fluoride Treatment',
    category: 'general-dentistry',
    shortDescription: 'Professional fluoride application to strengthen teeth and prevent cavities',
    fullDescription: 'Preventive fluoride treatment to strengthen tooth enamel and provide long-lasting cavity protection.',
    seo: {
      keywords: ['fluoride treatment', 'cavity prevention', 'tooth strengthening', 'preventive care'],
      focusKeyword: 'fluoride treatment'
    },
    pricing: {
      priceRange: { min: 50, max: 150 },
      currency: 'USD'
    },
    duration: {
      procedure: 20
    },
    isActive: true
  },
  {
    name: 'Intraoral Camera',
    category: 'general-dentistry',
    shortDescription: 'Advanced intraoral camera examination for detailed visualization of oral health conditions',
    fullDescription: 'High-resolution intraoral camera technology for comprehensive oral examination and patient education.',
    seo: {
      keywords: ['intraoral camera', 'dental examination', 'oral diagnosis', 'dental imaging'],
      focusKeyword: 'intraoral camera'
    },
    pricing: {
      priceRange: { min: 75, max: 150 },
      currency: 'USD'
    },
    duration: {
      procedure: 15
    },
    isActive: true
  },
  {
    name: 'Laser Dentistry',
    category: 'cosmetic-dentistry',
    shortDescription: 'Advanced laser technology for precise, comfortable dental treatments and procedures',
    fullDescription: 'State-of-the-art laser dentistry offering precise, minimally invasive treatments with enhanced comfort and faster healing.',
    seo: {
      keywords: ['laser dentistry', 'laser treatment', 'modern dentistry', 'pain-free dental care'],
      focusKeyword: 'laser dentistry'
    },
    pricing: {
      priceRange: { min: 300, max: 800 },
      currency: 'USD'
    },
    duration: {
      procedure: 45
    },
    isActive: true,
    isPremium: true
  },
  {
    name: 'Dental Exams and Cleaning',
    category: 'general-dentistry',
    shortDescription: 'Comprehensive dental examinations and professional teeth cleaning for optimal oral health',
    fullDescription: 'Regular dental checkups and professional cleanings to maintain excellent oral health and prevent dental problems.',
    seo: {
      keywords: ['dental exam', 'teeth cleaning', 'preventive care', 'oral health checkup'],
      focusKeyword: 'dental exam and cleaning'
    },
    pricing: {
      priceRange: { min: 100, max: 250 },
      currency: 'USD'
    },
    duration: {
      procedure: 45
    },
    isActive: true,
    isPopular: true
  },
  {
    name: 'Mouth Guard and Night Guard',
    category: 'general-dentistry',
    shortDescription: 'Custom-fitted mouth guards and night guards for teeth protection and TMJ relief',
    fullDescription: 'Professional custom mouth guards and night guards to protect teeth from grinding, sports injuries, and TMJ disorders.',
    seo: {
      keywords: ['mouth guard', 'night guard', 'teeth protection', 'TMJ treatment', 'bruxism'],
      focusKeyword: 'mouth guard'
    },
    pricing: {
      priceRange: { min: 200, max: 600 },
      currency: 'USD'
    },
    duration: {
      procedure: 30
    },
    isActive: true
  },
  {
    name: 'Teeth Whitening',
    category: 'cosmetic-dentistry',
    shortDescription: 'Professional teeth whitening treatment for brighter, more confident smiles',
    fullDescription: 'Advanced professional teeth whitening procedures to achieve dramatically whiter teeth and a more confident smile.',
    seo: {
      keywords: ['teeth whitening', 'smile brightening', 'cosmetic dentistry', 'tooth bleaching'],
      focusKeyword: 'teeth whitening'
    },
    pricing: {
      priceRange: { min: 300, max: 700 },
      currency: 'USD'
    },
    duration: {
      procedure: 60
    },
    isActive: true,
    isPopular: true
  }
];

async function seedDentalServices() {
  try {
    console.log('🦷 Seeding 18 Comprehensive Dental Services\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-appointments');
    console.log('✅ Connected to MongoDB');

    // Import DentalService model
    const DentalService = require('./src/models/DentalService');

    // Clear existing services (optional - remove if you want to keep existing)
    console.log('🗑️ Clearing existing services...');
    await DentalService.deleteMany({});

    // Insert all 18 services
    console.log('📝 Inserting 18 dental services...');
    const insertedServices = await DentalService.insertMany(dentalServices);

    console.log(`✅ Successfully inserted ${insertedServices.length} dental services!\n`);

    // Display summary
    console.log('📋 SERVICES SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════════');

    const categorySummary = {};
    insertedServices.forEach((service, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${service.name}`);
      console.log(`    Category: ${service.category}`);
      console.log(`    Duration: ${service.duration.procedure} min | Price: $${service.pricing.priceRange.min}-${service.pricing.priceRange.max}`);
      console.log(`    Description: ${service.shortDescription.substring(0, 80)}...`);
      console.log('');

      // Count by category
      categorySummary[service.category] = (categorySummary[service.category] || 0) + 1;
    });

    console.log('📊 CATEGORY BREAKDOWN:');
    console.log('═══════════════════════════════════════════════════════════════');
    Object.entries(categorySummary).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} services`);
    });

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. ✅ Services seeded successfully');
    console.log('2. 🔄 Test API endpoint: http://localhost:5000/api/services?isActive=true');
    console.log('3. 🎨 Generate 11-section content structure for each service');
    console.log('4. 🧪 Use comprehensive content generation');

    console.log('\n🚀 All 18 dental services are now available for LLM content generation!');
    console.log('📝 Each service includes:');
    console.log('   • Name, category, and descriptions');
    console.log('   • SEO keywords and focus keywords');
    console.log('   • Pricing ranges and duration');
    console.log('   • Popular and premium flags');
    console.log('   • Ready for 11-section content generation');

  } catch (error) {
    console.error('❌ Error seeding services:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding
if (require.main === module) {
  seedDentalServices();
}

module.exports = { dentalServices, seedDentalServices };