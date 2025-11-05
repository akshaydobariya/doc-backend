/**
 * Generate Comprehensive 11-Section Content for All 18 Dental Services
 * Creates complete content structure with all 11 sections for each service
 */

const mongoose = require('mongoose');
require('dotenv').config();

const llmService = require('./src/services/llmService');
const DentalService = require('./src/models/DentalService');

async function generateContentForAllServices() {
  try {
    console.log('🎨 Generating Comprehensive 11-Section Content for All 18 Services\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-appointments');
    console.log('✅ Connected to MongoDB');

    // Get all active services
    const services = await DentalService.find({ isActive: true }).sort({ name: 1 });
    console.log(`📋 Found ${services.length} active dental services`);

    if (services.length === 0) {
      console.log('⚠️ No active services found. Please run the seeding script first.');
      return;
    }

    console.log('\n🎯 11-SECTION CONTENT STRUCTURE:');
    console.log('1. Introduction (100 words)');
    console.log('2. What does it entail (500 words, 5 bullet points)');
    console.log('3. Why undergo this treatment (500 words, 5 bullet points)');
    console.log('4. Symptoms requiring treatment (500 words, 5 bullet points)');
    console.log('5. Consequences if not performed (500 words, 5 bullet points)');
    console.log('6. Treatment procedure (500 words, 5 steps)');
    console.log('7. Post-treatment care (500 words, 5 bullet points)');
    console.log('8. Benefits (500 words, 5 bullet points)');
    console.log('9. Side effects (500 words, 5 bullet points)');
    console.log('10. Myths and facts (500 words, 5 myths/facts)');
    console.log('11. Comprehensive FAQ (25 questions with 100-word answers = 2500 words)');
    console.log('\n🎯 Target: ~5500 words per service\n');

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each service
    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      const serviceIndex = i + 1;

      console.log(`\n📝 [${serviceIndex}/${services.length}] Generating content for: ${service.name}`);
      console.log(`   Category: ${service.category}`);
      console.log(`   Keywords: ${service.seo.keywords.join(', ')}`);

      try {
        // Prepare service data for LLM
        const serviceData = {
          serviceName: service.name,
          category: service.category,
          keywords: service.seo.keywords || []
        };

        console.log(`   🔄 Starting comprehensive content generation...`);

        // Generate comprehensive content using LLM service
        const result = await llmService.generateComprehensiveDentalContent(serviceData, {
          provider: 'auto', // Use best available provider
          temperature: 0.7,
          comprehensive: true
        });

        if (result.success) {
          console.log(`   ✅ Successfully generated ${result.sectionsGenerated}/${result.totalSections} sections`);
          console.log(`   📊 Total tokens used: ${result.totalTokensUsed || 'N/A'}`);

          // Calculate total words
          const totalWords = Object.values(result.content).reduce((total, section) => {
            if (section && section.content) {
              return total + (section.content.split(' ').length || 0);
            }
            return total;
          }, 0);

          console.log(`   📝 Estimated total words: ${totalWords}`);

          results.push({
            service: service.name,
            category: service.category,
            success: true,
            sections: result.sectionsGenerated,
            totalSections: result.totalSections,
            totalWords,
            content: result.content
          });

          successCount++;
        } else {
          console.log(`   ❌ Failed to generate content: ${result.error}`);
          results.push({
            service: service.name,
            category: service.category,
            success: false,
            error: result.error
          });
          errorCount++;
        }

        // Add delay between services to respect rate limits
        if (i < services.length - 1) {
          console.log(`   ⏳ Waiting 3 seconds before next service...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        console.error(`   ❌ Error generating content for ${service.name}:`, error.message);
        results.push({
          service: service.name,
          category: service.category,
          success: false,
          error: error.message
        });
        errorCount++;
      }
    }

    // Display final summary
    console.log('\n\n📊 COMPREHENSIVE CONTENT GENERATION SUMMARY');
    console.log('══════════════════════════════════════════════════════════════════');
    console.log(`Total Services Processed: ${services.length}`);
    console.log(`Successful Generations: ${successCount}`);
    console.log(`Failed Generations: ${errorCount}`);
    console.log(`Success Rate: ${Math.round((successCount / services.length) * 100)}%`);

    console.log('\n📋 DETAILED RESULTS:');
    console.log('══════════════════════════════════════════════════════════════════');

    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${(index + 1).toString().padStart(2, '0')}. ${result.service}`);
      console.log(`    Category: ${result.category}`);

      if (result.success) {
        console.log(`    Sections: ${result.sections}/${result.totalSections}`);
        console.log(`    Words: ~${result.totalWords || 'N/A'}`);
      } else {
        console.log(`    Error: ${result.error}`);
      }
      console.log('');
    });

    if (successCount > 0) {
      console.log('\n🎉 CONTENT GENERATION COMPLETE!');
      console.log('✅ All successful services now have comprehensive 11-section content');
      console.log('📝 Each successful service includes:');
      console.log('   • Patient-friendly introduction');
      console.log('   • Detailed procedure explanation');
      console.log('   • Treatment necessity reasons');
      console.log('   • Symptom indicators');
      console.log('   • Consequences of delay');
      console.log('   • Step-by-step procedure');
      console.log('   • Post-treatment care');
      console.log('   • Benefits and advantages');
      console.log('   • Potential side effects');
      console.log('   • Myths vs facts');
      console.log('   • 25 comprehensive FAQs');

      console.log('\n🚀 READY FOR USE:');
      console.log(`✅ ${successCount} services ready for patient content`);
      console.log('✅ SEO-optimized content structure');
      console.log('✅ Patient-facing friendly tone');
      console.log('✅ Comprehensive coverage of all aspects');
      console.log(`✅ API endpoint ready: http://localhost:5000/api/services?isActive=true`);
    }

    if (errorCount > 0) {
      console.log(`\n⚠️ ${errorCount} services failed generation - may need manual retry`);
    }

  } catch (error) {
    console.error('❌ Error in content generation process:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Test function to generate content for a single service
async function testSingleServiceGeneration(serviceName = 'Teeth Whitening') {
  try {
    console.log(`🧪 Testing 11-section content generation for: ${serviceName}\n`);

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-appointments');
    console.log('✅ Connected to MongoDB');

    const service = await DentalService.findOne({ name: serviceName, isActive: true });

    if (!service) {
      console.log(`❌ Service "${serviceName}" not found`);
      return;
    }

    const serviceData = {
      serviceName: service.name,
      category: service.category,
      keywords: service.seo.keywords || []
    };

    console.log(`🔄 Generating comprehensive content...`);

    const result = await llmService.generateComprehensiveDentalContent(serviceData, {
      provider: 'mock', // Use mock for testing
      temperature: 0.7,
      comprehensive: true
    });

    if (result.success) {
      console.log(`✅ Test successful!`);
      console.log(`📊 Sections generated: ${result.sectionsGenerated}/${result.totalSections}`);

      console.log('\n📋 Generated sections:');
      Object.keys(result.content).forEach((sectionKey, index) => {
        const section = result.content[sectionKey];
        console.log(`   ${index + 1}. ${sectionKey}: ${section.content ? '✅' : '❌'}`);
      });
    } else {
      console.log(`❌ Test failed: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

// Run based on command line argument
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--test')) {
    const serviceName = args[args.indexOf('--test') + 1] || 'Teeth Whitening';
    testSingleServiceGeneration(serviceName);
  } else {
    generateContentForAllServices();
  }
}

module.exports = { generateContentForAllServices, testSingleServiceGeneration };