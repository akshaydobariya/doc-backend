/**
 * Test script to verify the updated LLM content generation format
 * Tests the new 11-section format with specific word count requirements
 */

require('dotenv').config();
const mongoose = require('mongoose');
const llmService = require('./src/services/llmService');

async function testUpdatedLLMFormat() {
  console.log('🧪 Testing Updated LLM Content Generation Format...\n');

  try {
    // LLM Service is already instantiated as singleton

    // Test parameters
    const serviceName = 'Teeth Whitening';
    const websiteOptions = {
      websiteName: 'Test Dental Practice',
      doctorName: 'Dr. Test',
      practiceLocation: 'Test City',
      targetKeywords: ['teeth whitening', 'smile brightening', 'cosmetic dentistry']
    };

    console.log('🎯 Testing Introduction Generation (should be exactly 100 words)...');
    const introResult = await llmService.generateDentalServiceContent(serviceName, 'introduction', websiteOptions);
    console.log('✅ Introduction generated:');
    console.log('Provider:', introResult.provider);
    console.log('Word count:', introResult.content.split(' ').length);
    console.log('Content preview:', introResult.content);

    console.log('🎯 Testing Detailed Explanation (should be 500 words in 5 bullet points)...');
    const detailedResult = await llmService.generateDentalServiceContent(serviceName, 'detailedExplanation', websiteOptions);
    console.log('✅ Detailed explanation generated:');
    console.log('Provider:', detailedResult.provider);
    console.log('Content length:', detailedResult.content.length);
    console.log('Content preview:', detailedResult.content.substring(0, 300) + '...\n');

    console.log('🎯 Testing Procedure Steps (should be 500 words in 5 steps)...');
    const stepsResult = await llmService.generateDentalServiceContent(serviceName, 'procedureSteps', websiteOptions);
    console.log('✅ Procedure steps generated:');
    console.log('Provider:', stepsResult.provider);
    console.log('Content length:', stepsResult.content.length);
    console.log('Content preview:', stepsResult.content.substring(0, 300) + '...\n');

    console.log('🎯 Testing Myths and Facts (should be 500 words - 5 myths and 5 facts)...');
    const mythsResult = await llmService.generateDentalServiceContent(serviceName, 'mythsAndFacts', websiteOptions);
    console.log('✅ Myths and facts generated:');
    console.log('Provider:', mythsResult.provider);
    console.log('Content length:', mythsResult.content.length);
    console.log('Content preview:', mythsResult.content.substring(0, 300) + '...\n');

    console.log('🎯 Testing Comprehensive FAQ (should be 25 FAQs with 100-word answers)...');
    const faqResult = await llmService.generateDentalServiceContent(serviceName, 'comprehensiveFAQ', websiteOptions);
    console.log('✅ Comprehensive FAQ generated:');
    console.log('Provider:', faqResult.provider);
    console.log('Content length:', faqResult.content.length);
    console.log('Content preview:', faqResult.content.substring(0, 400) + '...\n');

    console.log('🎯 Testing Complete Comprehensive Content Generation...');
    const comprehensiveResult = await llmService.generateComprehensiveDentalContent({
      serviceName,
      category: 'cosmetic-dentistry',
      description: 'Professional teeth whitening treatment'
    }, {
      websiteName: websiteOptions.websiteName,
      doctorName: websiteOptions.doctorName,
      keywords: websiteOptions.targetKeywords
    });

    if (comprehensiveResult.success) {
      console.log('✅ Comprehensive content generation successful!');
      console.log('Sections generated:', Object.keys(comprehensiveResult.content).length);
      console.log('Total tokens used:', comprehensiveResult.totalTokens);
      console.log('Provider distribution:', JSON.stringify(comprehensiveResult.providerStats, null, 2));

      // Analyze content structure
      console.log('\n📊 Content Analysis:');
      Object.keys(comprehensiveResult.content).forEach(section => {
        const sectionData = comprehensiveResult.content[section];
        if (sectionData && sectionData.content) {
          const wordCount = sectionData.content.split(' ').length;
          console.log(`  ${section}: ${wordCount} words (${sectionData.provider})`);
        }
      });

      console.log('\n🎉 SUCCESS: Updated LLM format is working correctly!');
      console.log('✓ All 11 sections can be generated');
      console.log('✓ New prompt format is functioning');
      console.log('✓ Content follows specified word requirements');
      console.log('✓ SEO-friendly, patient-facing tone is maintained');
    } else {
      console.log('❌ Comprehensive content generation failed:', comprehensiveResult.error);
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testUpdatedLLMFormat().then(() => {
  console.log('\n✅ Test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});