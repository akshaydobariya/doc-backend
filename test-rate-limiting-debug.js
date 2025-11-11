/**
 * Debug rate limiting and provider fallback issues
 */
require('dotenv').config();

async function testRateLimitingDebug() {
  try {
    console.log('🧪 Testing Rate Limiting and Provider Fallback...');

    // Import LLM Service (singleton instance)
    const llmService = require('./src/services/llmService');

    console.log('✅ LLM Service loaded');

    // Check provider status
    console.log('\n📊 Current Provider Status:');
    const providerStatus = llmService.getProviderStatus();
    providerStatus.forEach(provider => {
      console.log(`- ${provider.name} (${provider.key}):`);
      console.log(`  - Enabled: ${provider.enabled}`);
      console.log(`  - Configured: ${provider.configured}`);
      console.log(`  - Rate Limited: ${provider.rateLimited}`);
      console.log(`  - Model: ${provider.model}`);
    });

    console.log('\n📋 Provider Order:', llmService.providerOrder);

    // Test single generation to see which provider is used
    console.log('\n🧪 Test 1: Single Content Generation');
    try {
      const result1 = await llmService.generateDentalServiceContent(
        'Test Service',
        'introduction',
        {
          websiteName: 'Test Clinic',
          keywords: ['test'],
          maxTokens: 100
        }
      );
      console.log(`✅ Success with provider: ${result1.provider}, tokens: ${result1.tokensUsed}`);
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
    }

    // Test rapid consecutive generations (this might trigger rate limiting)
    console.log('\n🧪 Test 2: Rapid Consecutive Generations (testing rate limits)');
    for (let i = 0; i < 5; i++) {
      try {
        const result = await llmService.generateDentalServiceContent(
          `Test Service ${i+1}`,
          'introduction',
          {
            websiteName: 'Test Clinic',
            keywords: ['test'],
            maxTokens: 50
          }
        );
        console.log(`✅ Request ${i+1} success with ${result.provider}, tokens: ${result.tokensUsed}`);
      } catch (error) {
        console.error(`❌ Request ${i+1} failed: ${error.message}`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check provider status after tests
    console.log('\n📊 Provider Status After Tests:');
    const finalStatus = llmService.getProviderStatus();
    finalStatus.forEach(provider => {
      console.log(`- ${provider.name}: Rate Limited: ${provider.rateLimited}`);
    });

    // Test comprehensive generation (this is what's failing in production)
    console.log('\n🧪 Test 3: Testing Problematic Comprehensive Generation');
    try {
      const comprehensiveResult = await llmService.generateComprehensiveDentalContent(
        'Test Dental Service',
        'general-dentistry',
        ['test', 'dental'],
        {
          websiteName: 'Test Clinic',
          maxTokens: 200 // Reduced tokens for faster testing
        }
      );
      console.log(`✅ Comprehensive generation successful: ${comprehensiveResult.sectionsGenerated}/${comprehensiveResult.totalSections} sections`);
      console.log(`Total tokens used: ${comprehensiveResult.totalTokensUsed}`);
    } catch (error) {
      console.error(`❌ Comprehensive generation failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Debug test FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run debug test
testRateLimitingDebug();