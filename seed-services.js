const mongoose = require('mongoose');
require('dotenv').config();

// Import the DentalService model
const DentalService = require('./src/models/DentalService');

// Sample dental services data
const sampleServices = [
  {
    name: 'Dental Cleaning & Hygiene',
    category: 'general-dentistry',
    description: 'Professional teeth cleaning, plaque removal, and oral hygiene maintenance to keep your teeth and gums healthy.',
    shortDescription: 'Regular dental cleanings to maintain optimal oral health',
    pricing: {
      basePrice: 150,
      currency: 'USD',
      priceRange: { min: 120, max: 200 }
    },
    duration: '60 minutes',
    benefits: [
      'Removes plaque and tartar buildup',
      'Prevents gum disease',
      'Freshens breath',
      'Early detection of dental issues'
    ],
    isActive: true,
    isPopular: true
  },
  {
    name: 'Professional Teeth Whitening',
    category: 'cosmetic-dentistry',
    description: 'Professional-grade whitening treatment for brighter, whiter teeth using the latest technology.',
    shortDescription: 'Achieve a brighter, more confident smile',
    pricing: {
      basePrice: 500,
      currency: 'USD',
      priceRange: { min: 400, max: 800 }
    },
    duration: '90 minutes',
    benefits: [
      'Removes years of stains',
      'Safe and effective',
      'Immediate results',
      'Boosts confidence'
    ],
    isActive: true,
    isPopular: true
  },
  {
    name: 'Dental Implants',
    category: 'prosthodontics',
    description: 'Permanent tooth replacement with titanium implants and custom crowns for a natural look and feel.',
    shortDescription: 'Permanent solution for missing teeth',
    pricing: {
      basePrice: 3000,
      currency: 'USD',
      priceRange: { min: 2500, max: 5000 }
    },
    duration: '3-6 months',
    benefits: [
      'Permanent solution',
      'Looks and feels natural',
      'Preserves jawbone',
      'No impact on adjacent teeth'
    ],
    isActive: true,
    isPopular: true
  },
  {
    name: 'Wisdom Teeth Removal',
    category: 'oral-surgery',
    description: 'Expert removal of problematic wisdom teeth with minimal discomfort and quick recovery.',
    shortDescription: 'Safe removal of problematic wisdom teeth',
    pricing: {
      basePrice: 400,
      currency: 'USD',
      priceRange: { min: 300, max: 800 }
    },
    duration: '90 minutes',
    benefits: [
      'Prevents crowding',
      'Reduces pain',
      'Prevents complications',
      'Improves oral health'
    ],
    isActive: true,
    isPopular: false
  },
  {
    name: 'Clear Aligners (Invisalign)',
    category: 'orthodontics',
    description: 'Nearly invisible aligners for discreet teeth straightening without traditional braces.',
    shortDescription: 'Invisible solution for straighter teeth',
    pricing: {
      basePrice: 5000,
      currency: 'USD',
      priceRange: { min: 4000, max: 8000 }
    },
    duration: '12-18 months',
    benefits: [
      'Nearly invisible',
      'Removable',
      'Comfortable',
      'Predictable results'
    ],
    isActive: true,
    isPopular: true
  }
];

async function seedServices() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing services
    await DentalService.deleteMany({});
    console.log('Cleared existing services');

    // Insert sample services
    const createdServices = await DentalService.insertMany(sampleServices);
    console.log(`Created ${createdServices.length} sample services:`);

    createdServices.forEach(service => {
      console.log(`- ${service.name} (${service.category})`);
    });

    console.log('Database seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedServices();