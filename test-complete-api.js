#!/usr/bin/env node

/**
 * Test the complete API endpoint with Complete Denture
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/services';

const testPayload = {
  "serviceName": "Complete Denture",
  "category": "prosthodontics",
  "description": "Full dentures for complete tooth replacement and restoration of oral function",
  "websiteId": "690f3316ec0a57c1425e73e4",
  "generateSEO": true,
  "generateFAQ": true,
  "generateProcedure": true,
  "generateBenefits": true,
  "generateBlogs": true,
  "fastMode": true // Use fast mode for quick testing
};

async function testCompleteAPI() {
  console.log('🧪 Testing Complete Denture API...');
  console.log('📝 Payload:', JSON.stringify(testPayload, null, 2));

  try {
    const response = await axios.post(`${API_BASE}/generate-content-from-data`, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout for fast mode
    });

    const result = response.data;

    console.log('\n✅ API Response Success:', result.success);
    console.log('📊 Response Summary:');
    console.log(`   - Service Name: ${result.data?.service?.name}`);
    console.log(`   - Service ID: ${result.data?.service?._id}`);
    console.log(`   - Service Page Created: ${result.data?.page ? 'Yes' : 'No'}`);
    console.log(`   - Service Page ID: ${result.data?.page?._id}`);
    console.log(`   - Blogs Generated: ${result.blogsGenerated || 0}`);
    console.log(`   - Message: ${result.message}`);

    if (result.data?.blogs && result.data.blogs.length > 0) {
      console.log('\n📚 Generated Blogs:');
      result.data.blogs.forEach((blog, index) => {
        console.log(`   ${index + 1}. ${blog.title}`);
        console.log(`      - Type: ${blog.type}`);
        console.log(`      - Slug: ${blog.slug}`);
        console.log(`      - ID: ${blog.id}`);
        console.log(`      - Word Count: ${blog.wordCount || 'Unknown'}`);
        console.log(`      - Reading Time: ${blog.readingTime || 'Unknown'}`);
        console.log('');
      });
    } else {
      console.log('\n❌ NO BLOGS GENERATED!');
      console.log('Raw blogs data:', result.data?.blogs);
    }

    // Test the 11 sections
    if (result.data?.llmContent) {
      console.log('\n📋 Generated Content Sections:');
      const sections = Object.keys(result.data.llmContent);
      sections.forEach((section, index) => {
        console.log(`   ${index + 1}. ${section}`);
      });
      console.log(`\n📊 Total Sections: ${sections.length}`);
    }

    return result;
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.response?.data) {
      console.error('📄 Error Details:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testCompleteAPI()
    .then(() => {
      console.log('\n🎉 Complete Denture API test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Complete Denture API test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testCompleteAPI };