/**
 * Test the exact API endpoint that's failing in production
 * URL: /api/services/generate-content-from-data
 */
require('dotenv').config();
const axios = require('axios');

async function testActualAPIEndpoint() {
  try {
    console.log('🧪 Testing Actual API Endpoint that Failed...');

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // The exact request that's failing in production
    const testData = {
      serviceName: 'Test Dental Service',
      category: 'general-dentistry',
      keywords: ['dental care', 'oral health'],
      // Add any other required fields
    };

    console.log('📤 Sending request to: http://localhost:5000/api/services/generate-content-from-data');
    console.log('📋 Request data:', testData);

    const response = await axios.post('http://localhost:5000/api/services/generate-content-from-data', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 300000 // 5 minutes timeout for comprehensive generation
    });

    console.log('✅ API endpoint test successful!');
    console.log('📊 Response status:', response.status);
    console.log('📝 Response summary:', {
      success: response.data.success,
      message: response.data.message,
      sectionsGenerated: response.data.data?.sectionsGenerated || 'N/A',
      totalTokensUsed: response.data.data?.totalTokensUsed || 'N/A',
      provider: response.data.data?.generationProvider || 'N/A'
    });

    console.log('🎉 API endpoint test PASSED!');

  } catch (error) {
    console.error('❌ API endpoint test FAILED:', error.message);
    if (error.response) {
      console.error('📋 Response status:', error.response.status);
      console.error('📋 Response data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('📋 Stack:', error.stack);

    // If it's a 404, let's check what endpoints are available
    if (error.response?.status === 404) {
      console.log('\n🔍 Let me check what endpoints are available...');
      try {
        // Try to get available routes (this might not work but worth trying)
        const healthCheck = await axios.get('http://localhost:5000/api/services', {
          timeout: 5000
        });
        console.log('📋 Services endpoint response:', healthCheck.status);
      } catch (e) {
        console.log('❌ Services endpoint not accessible:', e.message);
      }
    }

    // If it's a 401, authentication issue
    if (error.response?.status === 401) {
      console.log('\n🔐 Authentication required - this explains the production error!');
      console.log('🔧 The API endpoint requires authentication but the test has no auth token');
    }
  }
}

// Run test
testActualAPIEndpoint();