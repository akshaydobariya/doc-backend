#!/usr/bin/env node

/**
 * Test Blog Schema Fix
 * Verify that the blog creation works with the fixed schema
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Blog = require('./src/models/Blog');
const { createFastModeBlogs } = require('./src/controllers/serviceController');

async function testBlogSchemaFix() {
  try {
    console.log('🧪 Testing Blog Schema Fix...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test fast mode blog generation
    console.log('\n📝 Testing createFastModeBlogs function...');
    const blogResults = createFastModeBlogs('Composite Fillings', 'general-dentistry');

    console.log(`✅ Blog generation function returned ${blogResults.blogs.length} blogs`);
    console.log(`Provider: ${blogResults.provider}`);

    // Test creating actual blog document
    console.log('\n🏗️ Testing Blog document creation...');

    const blogData = blogResults.blogs[0];
    const testBlog = new Blog({
      title: blogData.title,
      slug: 'test-composite-fillings-blog',
      introduction: blogData.introduction,
      content: blogData.content,
      keyTakeaways: blogData.keyTakeaways || [],
      servicePageId: new mongoose.Types.ObjectId('690f194cec0a57c1425e592c'), // Test service page ID
      websiteId: new mongoose.Types.ObjectId('690f194cec0a57c1425e592c'), // Test website ID
      author: 'Dr. Test',
      authorBio: 'Test doctor',
      category: 'general-dentistry',
      tags: blogData.tags || ['test'],
      metaTitle: blogData.metaTitle || blogData.title,
      metaDescription: blogData.metaDescription || 'Test description',
      seoKeywords: ['test'],
      isPublished: true,
      publishedAt: new Date(),
      featured: false,
      llmGenerated: true,
      generationProvider: blogResults.provider || 'manual',
      generationMetadata: {
        tokensUsed: 0,
        temperature: 0.7,
        model: 'test-model',
        generatedAt: new Date(),
        prompt: 'Test blog generation'
      }
    });

    // Calculate reading time and generate SEO
    testBlog.calculateReadingTime();
    testBlog.generateSEO();

    // Validate the blog without saving
    await testBlog.validate();
    console.log('✅ Blog validation successful!');

    // Clean up - delete test blog if it exists
    await Blog.deleteOne({ slug: 'test-composite-fillings-blog' });

    // Actually save the test blog
    await testBlog.save();
    console.log(`✅ Blog saved successfully with ID: ${testBlog._id}`);

    // Verify we can read it back
    const savedBlog = await Blog.findById(testBlog._id);
    console.log(`✅ Blog retrieved: "${savedBlog.title}"`);

    // Clean up
    await Blog.deleteOne({ _id: testBlog._id });
    console.log('✅ Test blog cleaned up');

    console.log('\n🎉 All tests passed! Blog schema fix is working correctly.');

    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    if (error.errors) {
      console.log('\nValidation errors:');
      Object.keys(error.errors).forEach(field => {
        console.log(`  - ${field}: ${error.errors[field].message}`);
      });
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

testBlogSchemaFix();