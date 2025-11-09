#!/usr/bin/env node

/**
 * Test API endpoint to verify blog cards are working
 */

const axios = require('axios');

async function testAPIEndpoint() {
  try {
    console.log('🧪 Testing API endpoint...');

    const url = 'http://localhost:5000/api/services/public/page/69103410398dfc78ad0f716d/root-canal-treatment';
    console.log(`📡 Making request to: ${url}`);

    const response = await axios.get(url);
    console.log('✅ Response Status:', response.status);

    // Check if blogs field exists
    const hasBlogs = response.data && response.data.data && response.data.data.blogs;
    console.log(`📝 Has blogs field: ${!!hasBlogs}`);

    if (hasBlogs) {
      const blogCount = response.data.data.blogs.length;
      console.log(`🎉 SUCCESS! Found ${blogCount} blog cards`);

      if (blogCount > 0) {
        console.log('\n📋 Blog Cards:');
        response.data.data.blogs.forEach((blog, index) => {
          console.log(`  ${index + 1}. ${blog.title}`);
          console.log(`     Slug: ${blog.slug}`);
        });
      }
    } else {
      console.log('❌ No blogs field found in response');

      // Show what fields we do have
      if (response.data && response.data.data) {
        const fields = Object.keys(response.data.data);
        console.log('Available fields:', fields.slice(0, 10).join(', '));
      }
    }

  } catch (error) {
    console.error('💥 Error:', error.message);

    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAPIEndpoint();