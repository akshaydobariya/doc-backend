require('dotenv').config();
const mongoose = require('mongoose');
const { generateContentFromServiceData } = require('./src/controllers/serviceController');

async function testControllerDirect() {
  console.log('Testing generateContentFromServiceData Controller Function Directly...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Mock request and response objects
    const req = {
      body: {
        serviceName: 'Teeth Whitening',
        category: 'cosmetic-dentistry',
        description: 'Professional teeth whitening treatment to brighten your smile',
        websiteId: '507f1f77bcf86cd799439011', // This will be created if website doesn't exist
        generateSEO: true,
        generateFAQ: true,
        generateProcedure: true,
        generateBenefits: true,
        provider: 'auto',
        temperature: 0.7,
        keywords: ['teeth whitening', 'smile brightening', 'cosmetic dentistry']
      },
      user: { id: 'test-user-id' } // Mock user for auth
    };

    let responseData = null;
    let statusCode = 200;

    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      }
    };

    console.log('📝 Test Request Data:');
    console.log(JSON.stringify(req.body, null, 2));

    console.log('\n🚀 Calling generateContentFromServiceData function...');

    // Call the controller function directly
    await generateContentFromServiceData(req, res);

    console.log('\n📋 Response Status Code:', statusCode);
    console.log('📋 Response Data:');
    console.log(JSON.stringify(responseData, null, 2));

    if (responseData?.success) {
      const { service, page, llmContent, tokensUsed } = responseData.data;

      console.log('\n🎉 SUCCESS: LLM Content Generation Working!');
      console.log('✓ Service created:', service?.name);
      console.log('✓ Service page created:', page?.title);
      console.log('✓ Content sections:', Object.keys(llmContent || {}));
      console.log('✓ Total tokens used:', tokensUsed);

      console.log('\n📝 Sample Generated Content:');
      if (llmContent?.serviceOverview?.content) {
        console.log('Overview:', llmContent.serviceOverview.content.substring(0, 150) + '...');
      }
    } else {
      console.log('\n❌ Generation failed:', responseData?.message);
      console.log('Error details:', responseData?.error);
    }

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testControllerDirect();