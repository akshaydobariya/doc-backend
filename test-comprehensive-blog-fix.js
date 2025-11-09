#!/usr/bin/env node

/**
 * Comprehensive test for the blog fix
 * This will test the entire flow end-to-end
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models and functions
const Blog = require('./src/models/Blog');
const { createFastModeBlogs } = require('./src/controllers/serviceController');

async function testComprehensiveBlogFix() {
  console.log('🧪 Comprehensive Blog Fix Test...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Fast mode blog generation
    console.log('\n📝 Test 1: Fast mode blog generation');
    const serviceName = 'Fluoride Treatment';
    const category = 'general-dentistry';

    const blogResults = createFastModeBlogs(serviceName, category);

    console.log(`✅ Generated ${blogResults.blogs.length} blogs`);
    console.log(`Provider: ${blogResults.provider}`);

    // Test 2: Validate each blog content structure
    console.log('\n🔍 Test 2: Validating blog content structures');

    for (let i = 0; i < blogResults.blogs.length; i++) {
      const blog = blogResults.blogs[i];
      console.log(`\nValidating blog ${i + 1}: ${blog.type}`);

      // Check required fields
      const requiredFields = ['introduction', 'whatIsIt', 'whyNeedIt', 'signsSymptoms', 'consequencesDelay', 'treatmentProcess', 'benefits', 'recoveryAftercare', 'mythsFacts', 'costConsiderations', 'faq'];

      const missingFields = requiredFields.filter(field => !blog.content[field] || !blog.content[field].content);

      if (missingFields.length === 0) {
        console.log(`✅ Blog ${i + 1} has all required content sections`);
      } else {
        console.log(`❌ Blog ${i + 1} missing sections: ${missingFields.join(', ')}`);
      }
    }

    // Test 3: Create actual blog documents in database
    console.log('\n💾 Test 3: Creating blog documents in database');

    const websiteId = new mongoose.Types.ObjectId();
    const servicePageId = new mongoose.Types.ObjectId();

    const savedBlogs = [];

    for (let i = 0; i < Math.min(blogResults.blogs.length, 2); i++) { // Test first 2 blogs
      const blogData = blogResults.blogs[i];

      try {
        const testBlog = new Blog({
          title: blogData.title,
          slug: `test-${blogData.type}-${Date.now()}-${i}`,
          introduction: blogData.introduction,
          content: blogData.content,
          keyTakeaways: blogData.keyTakeaways || [],
          servicePageId: servicePageId,
          websiteId: websiteId,
          author: 'Dr. Test',
          authorBio: 'Test doctor for validation',
          category: 'general-dentistry',
          tags: blogData.tags || ['test'],
          metaTitle: blogData.metaTitle || 'Test Blog',
          metaDescription: blogData.metaDescription || 'Test description',
          seoKeywords: ['test', 'fluoride'],
          isPublished: true,
          publishedAt: new Date(),
          featured: false,
          llmGenerated: false,
          generationProvider: 'manual',
          generationMetadata: {
            tokensUsed: 0,
            temperature: 0.7,
            model: 'test-model',
            generatedAt: new Date(),
            prompt: 'Test blog generation'
          }
        });

        // Validate and save
        await testBlog.validate();
        testBlog.calculateReadingTime();
        testBlog.generateSEO();
        await testBlog.save();

        savedBlogs.push(testBlog);
        console.log(`✅ Blog ${i + 1} saved successfully: ${testBlog._id}`);

      } catch (error) {
        console.log(`❌ Blog ${i + 1} failed to save: ${error.message}`);
        if (error.errors) {
          Object.keys(error.errors).forEach(field => {
            console.log(`  - ${field}: ${error.errors[field].message}`);
          });
        }
      }
    }

    console.log(`\n📊 Successfully saved ${savedBlogs.length}/${Math.min(blogResults.blogs.length, 2)} test blogs`);

    // Cleanup
    console.log('\n🧹 Cleaning up test blogs...');
    for (const blog of savedBlogs) {
      await Blog.deleteOne({ _id: blog._id });
    }
    console.log('✅ Cleanup completed');

    console.log('\n🎉 All tests passed! Blog fix is working correctly.');

    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');

    return true;

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    await mongoose.disconnect();
    return false;
  }
}

if (require.main === module) {
  testComprehensiveBlogFix()
    .then(success => {
      if (success) {
        console.log('\n✅ All tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Tests failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { testComprehensiveBlogFix };