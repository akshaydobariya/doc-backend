/**
 * Quick test to verify blog generation and inclusion in API response
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { generateContentFromServiceData } = require('./src/controllers/serviceController');

// Mock request and response objects
function createMockReq(body) {
  return {
    body,
    user: { id: new mongoose.Types.ObjectId('69121f9d461d563a7cbe64a0') }
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    responseData: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.responseData = data;
      console.log('📋 API Response Structure:');
      console.log('Success:', data.success);
      console.log('Blogs included:', data.data?.blogs ? 'YES' : 'NO');
      console.log('Blog count:', data.blogsGenerated || 0);

      if (data.data?.blogs) {
        console.log('🎉 BLOG DATA FOUND IN RESPONSE!');
        console.log('Blog titles:', data.data.blogs.map(b => b.title));
      } else {
        console.log('❌ NO BLOG DATA IN RESPONSE');
        console.log('Available data keys:', Object.keys(data.data || {}));
      }

      return this;
    }
  };
  return res;
}

async function testBlogGeneration() {
  console.log('🧪 Testing Blog Generation Fix...');

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');

  const req = createMockReq({
    serviceName: 'Test Blog Generation',
    websiteId: '691218ffae08290a9428c27e',
    category: 'general-dentistry',
    provider: 'azure-openai',
    fastMode: true
  });

  const res = createMockRes();

  try {
    await generateContentFromServiceData(req, res);
    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
}

testBlogGeneration().catch(console.error);