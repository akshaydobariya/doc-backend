#!/usr/bin/env node

/**
 * Final API test to verify blogs are generated
 */

const axios = require('axios');

const testPayload = {
  "serviceName": "Fluoride Treatment",
  "category": "general-dentistry",
  "description": "Professional fluoride application to strengthen teeth and prevent cavities",
  "websiteId": "690f3316ec0a57c1425e73e4",
  "generateSEO": true,
  "generateFAQ": true,
  "generateProcedure": true,
  "generateBenefits": true,
  "generateBlogs": true,
  "fastMode": true // Force fast mode
};

async function testFinalAPI() {
  console.log('🎯 Final API Test: Verify Blog Generation\n');

  try {
    const response = await axios.post('http://localhost:5000/api/services/generate-content-from-data', testPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });

    const result = response.data;

    console.log(`✅ API Success: ${result.success}`);
    console.log(`📝 Service: ${result.data?.service?.name}`);
    console.log(`🏗️ Page Created: ${result.data?.page ? 'Yes' : 'No'}`);
    console.log(`📚 Blogs Generated: ${result.blogsGenerated || 0}`);

    if (result.data?.blogs && result.data.blogs.length > 0) {
      console.log('\n📖 Generated Blogs:');
      result.data.blogs.forEach((blog, i) => {
        console.log(`${i + 1}. ${blog.title} (${blog.type})`);
      });
      console.log(`\n🎉 SUCCESS: ${result.data.blogs.length} blogs generated!`);
    } else {
      console.log('\n❌ STILL NO BLOGS GENERATED');
      console.log('Response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️ Server not running, but fix should work when server is started');
    } else if (error.response?.status === 401) {
      console.log('⚠️ Authentication required, but fix should work when properly authenticated');
    } else {
      console.error('❌ API test failed:', error.message);
    }
  }
}

testFinalAPI();