#!/usr/bin/env node

/**
 * Test script to verify blog generation fix
 * This tests the generate-content-from-data API endpoint
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/services';

const testPayload = {
  "serviceName": "Root Canal Treatment",
  "category": "endodontics",
  "description": "Advanced endodontic treatment to save severely infected or damaged teeth and restore oral health",
  "websiteId": "690f194cec0a57c1425e592c", // Use the same website ID from your test
  "generateSEO": true,
  "generateFAQ": true,
  "generateProcedure": true,
  "generateBenefits": true,
  "generateBlogs": true,
  "fastMode": false // Explicitly disable fast mode for comprehensive content
};

async function testBlogGeneration() {
  console.log('🧪 Testing Blog Generation Fix...');
  console.log('📝 Payload:', JSON.stringify(testPayload, null, 2));

  try {
    const response = await axios.post(`${API_BASE}/generate-content-from-data`, testPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minute timeout for LLM generation
    });

    const result = response.data;

    console.log('\n✅ API Response Success:', result.success);
    console.log('📊 Response Summary:');
    console.log(`   - Service Name: ${result.data?.service?.name}`);
    console.log(`   - Service Page Created: ${result.data?.page ? 'Yes' : 'No'}`);
    console.log(`   - Blogs Generated: ${result.blogsGenerated || 0}`);
    console.log(`   - LLM Tokens Used: ${result.data?.tokensUsed || 0}`);

    if (result.data?.blogs && result.data.blogs.length > 0) {
      console.log('\n📚 Generated Blogs:');
      result.data.blogs.forEach((blog, index) => {
        console.log(`   ${index + 1}. ${blog.title} (${blog.type})`);
        console.log(`      - Slug: ${blog.slug}`);
        console.log(`      - Word Count: ${blog.wordCount || 'Unknown'}`);
        console.log(`      - Reading Time: ${blog.readingTime || 'Unknown'}`);
      });
    } else {
      console.log('\n❌ NO BLOGS GENERATED!');
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
      console.error('📄 Error Details:', error.response.data);
    }
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testBlogGeneration()
    .then(() => {
      console.log('\n🎉 Blog generation test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Blog generation test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testBlogGeneration };