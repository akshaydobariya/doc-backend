require('dotenv').config();
const llmService = require('./src/services/llmService');

async function testLLM() {
  console.log('Testing LLM Service...');

  try {
    // Test provider status
    console.log('\n--- Provider Status ---');
    const status = llmService.getProviderStatus();
    console.log(JSON.stringify(status, null, 2));

    // Test basic content generation
    console.log('\n--- Testing Basic Content Generation ---');
    const testPrompt = 'Briefly explain what dental cleaning is (1-2 sentences):';

    const result = await llmService.generateContent(testPrompt, {
      provider: 'auto',
      temperature: 0.7,
      maxTokens: 100
    });

    console.log('Generated content:', result.content);
    console.log('Provider used:', result.provider);
    console.log('Tokens used:', result.tokensUsed);

    // Test dental service content generation
    console.log('\n--- Testing Dental Service Content ---');
    const dentalResult = await llmService.generateDentalServiceContent(
      'Teeth Cleaning',
      'serviceOverview',
      {
        keywords: ['dental cleaning', 'oral hygiene'],
        category: 'general-dentistry'
      }
    );

    console.log('Dental content:', dentalResult.content.substring(0, 200) + '...');
    console.log('Provider used:', dentalResult.provider);

  } catch (error) {
    console.error('LLM Test Error:', error.message);
    process.exit(1);
  }
}

testLLM();