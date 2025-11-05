/**
 * Seed 18 Comprehensive Dental Services
 * Creates all 18 dental services with proper categorization for LLM content generation
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Define the 18 dental services with proper categories and descriptions
const dentalServices = [
  {
    name: 'Root Canal Treatment',
    category: 'endodontics',
    description: 'Advanced endodontic treatment to save severely infected or damaged teeth and restore oral health',
    keywords: ['root canal', 'endodontics', 'tooth infection', 'pain relief', 'dental treatment'],
    isActive: true,
    estimatedDuration: 90,
    price: { min: 800, max: 1500 }
  },
  {
    name: 'Composite Fillings',
    category: 'restorative-dentistry',
    description: 'Tooth-colored composite resin fillings for cavities and minor tooth damage restoration',
    keywords: ['composite fillings', 'tooth colored fillings', 'cavity treatment', 'dental restoration'],
    isActive: true,
    estimatedDuration: 30,
    price: { min: 150, max: 300 }
  },
  {
    name: 'Dental Implants',
    category: 'oral-surgery',
    description: 'Permanent tooth replacement solution using titanium implants for missing teeth',
    keywords: ['dental implants', 'tooth replacement', 'implant surgery', 'missing teeth', 'oral surgery'],
    isActive: true,
    estimatedDuration: 120,
    price: { min: 2500, max: 5000 }
  },
  {
    name: 'Orthodontics (Braces/Aligners/Invisalign)',
    category: 'orthodontics',
    description: 'Comprehensive orthodontic treatment including braces, clear aligners, and Invisalign for teeth straightening',
    keywords: ['orthodontics', 'braces', 'invisalign', 'clear aligners', 'teeth straightening'],
    isActive: true,
    estimatedDuration: 60,
    price: { min: 3000, max: 8000 }
  },
  {
    name: 'Tooth Extractions',
    category: 'oral-surgery',
    description: 'Safe and comfortable tooth extraction procedures for damaged or problematic teeth',
    keywords: ['tooth extraction', 'tooth removal', 'oral surgery', 'dental extraction'],
    isActive: true,
    estimatedDuration: 45,
    price: { min: 200, max: 600 }
  },
  {
    name: 'Wisdom Tooth Removal',
    category: 'oral-surgery',
    description: 'Specialized wisdom tooth extraction to prevent complications and maintain oral health',
    keywords: ['wisdom teeth', 'wisdom tooth removal', 'impacted teeth', 'oral surgery'],
    isActive: true,
    estimatedDuration: 60,
    price: { min: 300, max: 800 }
  },
  {
    name: 'Fixed Partial Denture (Crowns and Bridges)',
    category: 'prosthodontics',
    description: 'Custom crowns and bridges to restore damaged teeth and replace missing teeth permanently',
    keywords: ['dental crowns', 'dental bridges', 'fixed dentures', 'tooth restoration', 'prosthodontics'],
    isActive: true,
    estimatedDuration: 90,
    price: { min: 1200, max: 3000 }
  },
  {
    name: 'Panoramic Dental X-Ray',
    category: 'diagnostic-imaging',
    description: 'Comprehensive panoramic X-ray imaging for complete oral and dental health assessment',
    keywords: ['panoramic xray', 'dental imaging', 'oral diagnosis', 'dental examination'],
    isActive: true,
    estimatedDuration: 15,
    price: { min: 100, max: 200 }
  },
  {
    name: 'Dental Crowns',
    category: 'prosthodontics',
    description: 'Custom dental crowns to restore damaged teeth and improve both function and appearance',
    keywords: ['dental crowns', 'tooth caps', 'tooth restoration', 'prosthodontics'],
    isActive: true,
    estimatedDuration: 75,
    price: { min: 800, max: 1800 }
  },
  {
    name: 'Complete Denture',
    category: 'prosthodontics',
    description: 'Full dentures for complete tooth replacement and restoration of oral function',
    keywords: ['complete dentures', 'full dentures', 'tooth replacement', 'prosthodontics'],
    isActive: true,
    estimatedDuration: 120,
    price: { min: 1500, max: 4000 }
  },
  {
    name: 'Periodontal Scaling',
    category: 'periodontics',
    description: 'Deep cleaning treatment for gum disease and periodontal health maintenance',
    keywords: ['periodontal scaling', 'deep cleaning', 'gum disease treatment', 'periodontics'],
    isActive: true,
    estimatedDuration: 60,
    price: { min: 200, max: 500 }
  },
  {
    name: 'Fluoride Treatment',
    category: 'preventive-dentistry',
    description: 'Professional fluoride application to strengthen teeth and prevent cavities',
    keywords: ['fluoride treatment', 'cavity prevention', 'tooth strengthening', 'preventive care'],
    isActive: true,
    estimatedDuration: 20,
    price: { min: 50, max: 150 }
  },
  {
    name: 'Intraoral Camera',
    category: 'diagnostic-imaging',
    description: 'Advanced intraoral camera examination for detailed visualization of oral health conditions',
    keywords: ['intraoral camera', 'dental examination', 'oral diagnosis', 'dental imaging'],
    isActive: true,
    estimatedDuration: 15,
    price: { min: 75, max: 150 }
  },
  {
    name: 'Laser Dentistry',
    category: 'cosmetic-dentistry',
    description: 'Advanced laser technology for precise, comfortable dental treatments and procedures',
    keywords: ['laser dentistry', 'laser treatment', 'modern dentistry', 'pain-free dental care'],
    isActive: true,
    estimatedDuration: 45,
    price: { min: 300, max: 800 }
  },
  {
    name: 'Dental Exams and Cleaning',
    category: 'preventive-dentistry',
    description: 'Comprehensive dental examinations and professional teeth cleaning for optimal oral health',
    keywords: ['dental exam', 'teeth cleaning', 'preventive care', 'oral health checkup'],
    isActive: true,
    estimatedDuration: 45,
    price: { min: 100, max: 250 }
  },
  {
    name: 'Mouth Guard and Night Guard',
    category: 'preventive-dentistry',
    description: 'Custom-fitted mouth guards and night guards for teeth protection and TMJ relief',
    keywords: ['mouth guard', 'night guard', 'teeth protection', 'TMJ treatment', 'bruxism'],
    isActive: true,
    estimatedDuration: 30,
    price: { min: 200, max: 600 }
  },
  {
    name: 'Teeth Whitening',
    category: 'cosmetic-dentistry',
    description: 'Professional teeth whitening treatment for brighter, more confident smiles',
    keywords: ['teeth whitening', 'smile brightening', 'cosmetic dentistry', 'tooth bleaching'],
    isActive: true,
    estimatedDuration: 60,
    price: { min: 300, max: 700 }
  }
];

// Note: Removed duplicate "Root Canal Treatment" as requested (was #16)

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
      console.log(`    Duration: ${service.estimatedDuration} min | Price: $${service.price.min}-${service.price.max}`);
      console.log(`    Description: ${service.description.substring(0, 80)}...`);
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
    console.log('2. 🔄 Run comprehensive content generation for all 18 services');
    console.log('3. 🧪 Test API endpoint: http://localhost:5000/api/services?isActive=true');
    console.log('4. 🎨 Generate 11-section content structure for each service');

    console.log('\n🚀 All 18 dental services are now available for LLM content generation!');

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