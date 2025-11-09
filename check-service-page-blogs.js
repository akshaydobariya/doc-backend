#!/usr/bin/env node

/**
 * Check if there are blogs for the specific service page
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Blog = require('./src/models/Blog');
const ServicePage = require('./src/models/ServicePage');

async function checkServicePageBlogs() {
  try {
    console.log('🔍 Checking blogs for Complete Denture service page...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the service page for complete-denture
    const servicePage = await ServicePage.findOne({
      slug: 'complete-denture',
      websiteId: '690f194cec0a57c1425e592c'
    }).select('_id title slug websiteId serviceId');

    if (!servicePage) {
      console.log('❌ Service page not found for complete-denture');
      return;
    }

    console.log('✅ Found service page:', {
      id: servicePage._id,
      title: servicePage.title,
      slug: servicePage.slug
    });

    // Find blogs for this service page
    const blogs = await Blog.find({
      servicePageId: servicePage._id,
      websiteId: '690f194cec0a57c1425e592c',
      isPublished: true
    }).select('_id title slug introduction servicePageId websiteId isPublished createdAt');

    console.log(`\n📝 Found ${blogs.length} blogs for this service page:`);

    if (blogs.length === 0) {
      console.log('❌ No blogs found for this service page!');

      // Check if there are any blogs with service name "Complete Denture"
      const relatedBlogs = await Blog.find({
        title: { $regex: /complete.*denture/i },
        isPublished: true
      }).select('_id title slug servicePageId');

      console.log(`\n🔍 Found ${relatedBlogs.length} blogs with "Complete Denture" in title:`);
      relatedBlogs.forEach((blog, index) => {
        console.log(`${index + 1}. "${blog.title}"`);
        console.log(`   ServicePageId: ${blog.servicePageId}`);
        console.log(`   Matches current page: ${blog.servicePageId?.toString() === servicePage._id.toString()}`);
        console.log('');
      });

    } else {
      blogs.forEach((blog, index) => {
        console.log(`${index + 1}. "${blog.title}"`);
        console.log(`   Slug: ${blog.slug}`);
        console.log(`   Published: ${blog.isPublished}`);
        console.log(`   Created: ${blog.createdAt}`);
        console.log('');
      });
    }

    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');

  } catch (error) {
    console.error('\n💥 Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkServicePageBlogs();