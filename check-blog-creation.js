#!/usr/bin/env node

/**
 * Check if blogs are being created in database
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Blog = require('./src/models/Blog');

async function checkBlogCreation() {
  try {
    console.log('🔍 Checking blog creation in database...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find recent blogs
    const recentBlogs = await Blog.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title slug serviceName createdAt isPublished')
      .lean();

    console.log(`\n📝 Found ${recentBlogs.length} recent blogs:`);

    if (recentBlogs.length === 0) {
      console.log('❌ No blogs found in database!');
    } else {
      recentBlogs.forEach((blog, index) => {
        console.log(`${index + 1}. "${blog.title}"`);
        console.log(`   Slug: ${blog.slug}`);
        console.log(`   Published: ${blog.isPublished}`);
        console.log(`   Created: ${blog.createdAt}`);
        console.log('');
      });
    }

    // Check blogs for specific test services
    console.log('🔍 Checking blogs for test services...');

    const testServiceBlogs = await Blog.find({
      $or: [
        { title: { $regex: /API Test Service|Blog Test/i } },
        { slug: { $regex: /api-test-service|blog-test/i } }
      ]
    }).select('title slug servicePageId isPublished').lean();

    if (testServiceBlogs.length > 0) {
      console.log(`\n✅ Found ${testServiceBlogs.length} blogs for test services:`);
      testServiceBlogs.forEach((blog, index) => {
        console.log(`${index + 1}. "${blog.title}" (${blog.slug}) - Published: ${blog.isPublished}`);
      });
    } else {
      console.log('\n❌ No blogs found for test services!');
    }

    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');

  } catch (error) {
    console.error('\n💥 Error checking blogs:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkBlogCreation();