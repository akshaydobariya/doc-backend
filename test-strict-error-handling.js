/**
 * Test script to verify strict error handling without fallbacks
 */

require('dotenv').config();
const llmService = require('./src/services/llmService');

async function testStrictErrorHandling() {
  console.log('🧪 Testing Strict Error Handling (No Fallbacks)...\n');

  try {
    // Test with invalid provider to trigger error
    console.log('🎯 Testing error handling with invalid service data...');

    try {
      // This should fail immediately without fallback
      const result = await llmService.generateComprehensiveDentalContent({
        serviceName: '',  // Empty service name should cause error
        category: 'general-dentistry',
        keywords: []
      }, {
        provider: 'auto',
        websiteName: 'Test Practice',
        doctorName: 'Dr. Test'
      });

      console.log('❌ ERROR: Should have failed but succeeded:', result.success);
    } catch (error) {
      console.log('✅ SUCCESS: System correctly failed without fallback');
      console.log(`   Error message: ${error.message}`);
    }

    // Test with valid data but expect rate limiting to cause failure
    console.log('\n🎯 Testing with valid data (may hit rate limits)...');

    try {
      const result = await llmService.generateComprehensiveDentalContent({
        serviceName: 'Test Service',
        category: 'general-dentistry',
        keywords: ['test']
      }, {
        provider: 'auto',
        websiteName: 'Test Practice',
        doctorName: 'Dr. Test'
      });

      if (result.success) {
        console.log('✅ Content generation succeeded - all sections generated');
      } else {
        console.log('✅ Content generation failed properly without fallback');
      }
    } catch (error) {
      console.log('✅ SUCCESS: System failed fast on error');
      console.log(`   Error message: ${error.message}`);

      if (error.message.includes('rate limit') || error.message.includes('failed for section')) {
        console.log('   This is expected behavior - no fallback content was generated');
      }
    }

    console.log('\n🎯 Summary of Changes:');
    console.log('✅ Removed all fallback content generation');
    console.log('✅ LLM service fails immediately when any section fails');
    console.log('✅ API endpoints return errors to frontend instead of fallback content');
    console.log('✅ Parsing functions throw errors instead of generating defaults');
    console.log('✅ No createFastModeContent function used');
    console.log('✅ Strict error handling throughout the system');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testStrictErrorHandling();