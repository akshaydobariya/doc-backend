/**
 * Test Azure OpenAI GPT-4o integration
 */
require('dotenv').config();

async function testOpenAIIntegration() {
  try {
    console.log('🧪 Testing OpenAI GPT-4o Integration...');

    // Import LLM Service (singleton instance)
    const llmService = require('./src/services/llmService');

    console.log('✅ LLM Service loaded');

    // Check provider configuration
    console.log('\n📊 Provider Configuration:');
    console.log('- Azure OpenAI Endpoint:', process.env.AZURE_OPENAI_API_ENDPOINT);
    console.log('- Azure OpenAI Key configured:', !!process.env.AZURE_OPENAI_API_KEY);
    console.log('- Azure OpenAI Deployment:', process.env.AZURE_OPENAI_API_DEPLOYMENT);
    console.log('- Azure OpenAI API Version:', process.env.AZURE_OPENAI_API_VERSION);
    console.log('- Regular OpenAI Key configured:', !!process.env.OPENAI_API_KEY);
    console.log('- Google AI Key configured:', !!process.env.GOOGLE_AI_API_KEY);
    console.log('- Provider order:', llmService.providerOrder);

    // Test simple content generation
    console.log('\n🚀 Testing content generation...');

    const testResult = await llmService.generateDentalServiceContent(
      'Teeth Whitening',
      'introduction',
      {
        websiteName: 'Test Dental Clinic',
        keywords: ['teeth whitening', 'dental care', 'cosmetic dentistry'],
        maxTokens: 200
      }
    );

    console.log('\n✅ Content generated successfully!');
    console.log('📝 Result:', {
      provider: testResult.provider,
      model: testResult.model,
      tokensUsed: testResult.tokensUsed,
      contentLength: testResult.content.length,
      contentPreview: testResult.content.substring(0, 200) + '...'
    });

    console.log('\n🎉 Azure OpenAI GPT-4o integration test PASSED!');

  } catch (error) {
    console.error('❌ Test FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testOpenAIIntegration();