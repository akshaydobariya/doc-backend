#!/usr/bin/env node

/**
 * Test createFastModeBlogs function directly
 */

// Import the controller functions
const { createFastModeBlogs } = require('./src/controllers/serviceController');

function testCreateFastModeBlogs() {
  console.log('🧪 Testing createFastModeBlogs function...\n');

  try {
    const serviceName = 'Fluoride Treatment';
    const category = 'general-dentistry';

    console.log(`Testing with: ${serviceName} (${category})`);

    const result = createFastModeBlogs(serviceName, category);

    console.log('\n📋 Function result:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📊 Provider: ${result.provider}`);
    console.log(`🔧 Model: ${result.model}`);
    console.log(`📝 Blog count: ${result.blogs ? result.blogs.length : 0}`);

    if (result.blogs && result.blogs.length > 0) {
      console.log('\n📚 Generated blogs:');
      result.blogs.forEach((blog, index) => {
        console.log(`\n${index + 1}. ${blog.title}`);
        console.log(`   Type: ${blog.type}`);
        console.log(`   Slug: ${blog.slug}`);
        console.log(`   Introduction length: ${blog.introduction ? blog.introduction.length : 0} chars`);
        console.log(`   Has content: ${blog.content ? 'Yes' : 'No'}`);

        if (blog.content) {
          console.log(`   Content sections: ${Object.keys(blog.content).length}`);
          console.log(`   Sections: ${Object.keys(blog.content).join(', ')}`);
        }

        console.log(`   Key takeaways: ${blog.keyTakeaways ? blog.keyTakeaways.length : 0}`);
        console.log(`   Tags: ${blog.tags ? blog.tags.join(', ') : 'None'}`);
        console.log(`   Meta title: ${blog.metaTitle || 'None'}`);
      });
    } else {
      console.log('\n❌ NO BLOGS GENERATED!');
    }

    // Test the first blog's content structure
    if (result.blogs && result.blogs[0]) {
      const firstBlog = result.blogs[0];
      console.log('\n🔍 Detailed content analysis of first blog:');
      console.log(JSON.stringify(firstBlog.content, null, 2));
    }

    console.log('\n🎉 createFastModeBlogs test completed successfully!');

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testCreateFastModeBlogs();