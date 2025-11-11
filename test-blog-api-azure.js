/**
 * Test existing blog generation API with Azure OpenAI
 */
const axios = require('axios');

async function testBlogGeneration() {
  try {
    console.log('🧪 Testing Blog Generation API with Azure OpenAI...');

    const testData = {
      serviceName: 'Dental Implants',
      servicePageId: '674b7f2e4b9f8c2a3b1e9d5f', // Sample ObjectId
      websiteId: '674b7f2e4b9f8c2a3b1e9d5e'     // Sample ObjectId
    };

    console.log('📤 Sending request to:', 'http://localhost:5000/api/blogs/generate');
    console.log('📋 Request data:', testData);

    const response = await axios.post('http://localhost:5000/api/blogs/generate', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minutes timeout for content generation
    });

    console.log('\n✅ Blog generation successful!');
    console.log('📊 Response status:', response.status);
    console.log('📝 Blog created:', {
      id: response.data.data?._id,
      title: response.data.data?.title,
      provider: response.data.data?.generationProvider || 'Unknown',
      tokensUsed: response.data.data?.generationMetadata?.tokensUsed,
      contentLength: response.data.data?.content?.length,
      sections: Object.keys(response.data.data?.content || {}),
      message: response.data.message
    });

    console.log('\n🎉 Existing API functionality test PASSED with Azure OpenAI!');

  } catch (error) {
    console.error('❌ Test FAILED:', error.message);
    if (error.response) {
      console.error('📋 Response status:', error.response.status);
      console.error('📋 Response data:', error.response.data);
    }
    console.error('📋 Stack:', error.stack);
  }
}

// Run test
testBlogGeneration();