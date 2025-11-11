/**
 * Test blog generation functionality directly using the controller and LLM service
 * This bypasses authentication to verify Azure OpenAI integration works
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Mock Express request/response objects
function createMockReq(body = {}) {
  return {
    body,
    user: { _id: new mongoose.Types.ObjectId() } // Mock authenticated user
  };
}

function createMockRes() {
  const res = {};
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function(data) {
    this.responseData = data;
    return this;
  };
  return res;
}

async function testBlogGenerationDirect() {
  try {
    console.log('🧪 Testing Blog Generation Functionality Directly...');
    console.log('🔗 Connecting to MongoDB...');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    // Import the blog controller
    const BlogController = require('./src/controllers/blogController');

    console.log('✅ Blog controller loaded');

    // Test data
    const testData = {
      serviceName: 'Teeth Whitening',
      servicePageId: new mongoose.Types.ObjectId().toString(),
      websiteId: new mongoose.Types.ObjectId().toString(),
      category: 'cosmetic-dentistry',
      keywords: ['teeth whitening', 'dental care', 'cosmetic dentistry'],
      blogType: 'comprehensive'
    };

    console.log('📤 Testing blog generation with data:', testData);

    // Create mock request and response
    const req = createMockReq(testData);
    const res = createMockRes();

    // Call the generate blog function directly
    await BlogController.generateBlog(req, res);

    console.log('📊 Response status:', res.statusCode);
    console.log('📝 Response data:');

    if (res.responseData) {
      const responseData = res.responseData;
      console.log({
        success: responseData.success,
        message: responseData.message,
        blogId: responseData.data?._id,
        title: responseData.data?.title,
        provider: responseData.data?.generationProvider,
        tokensUsed: responseData.data?.generationMetadata?.tokensUsed,
        contentSections: Object.keys(responseData.data?.content || {}),
        contentLength: JSON.stringify(responseData.data?.content || {}).length
      });

      if (responseData.success) {
        console.log('\n🎉 Blog generation test PASSED with Azure OpenAI!');
        console.log('✅ Existing functionality confirmed working with new Azure OpenAI integration');
      } else {
        console.log('\n❌ Blog generation test FAILED');
        console.error('Error details:', responseData.message);
      }
    } else {
      console.log('❌ No response data received');
    }

  } catch (error) {
    console.error('❌ Test FAILED:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run test
testBlogGenerationDirect();