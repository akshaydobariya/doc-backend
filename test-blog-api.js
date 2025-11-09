const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing the exact API route logic...');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Simulate the exact API logic
    const websiteId = '69103410398dfc78ad0f716d';
    const serviceSlug = 'root-canal-treatment';

    const DentalService = require('./src/models/DentalService');
    const ServicePage = require('./src/models/ServicePage');

    // Find the service first
    const service = await DentalService.findOne({ slug: serviceSlug, isActive: true });
    if (!service) {
      console.log('❌ Service not found');
      process.exit(1);
    }
    console.log('✅ Service found:', service.name, service._id);

    // Find the service page
    const servicePage = await ServicePage.findOne({
      websiteId,
      serviceId: service._id,
      $or: [
        { status: 'published' },
        { isIntegrated: true }
      ]
    }).populate('serviceId');

    if (!servicePage) {
      console.log('❌ Service page not found');
      process.exit(1);
    }
    console.log('✅ Service page found:', servicePage._id);

    // Fetch blog cards for this service
    let blogCards = [];
    try {
      const Blog = require('./src/models/Blog');
      console.log('🔍 Searching for blogs with criteria:');
      console.log('- serviceId:', service._id);
      console.log('- websiteId:', websiteId);
      console.log('- isPublished: true');

      const blogs = await Blog.find({
        serviceId: service._id,
        websiteId: websiteId,
        isPublished: true
      })
      .select('_id title slug introduction readingTime wordCount url publishedAt featured')
      .sort({ publishedAt: -1 })
      .limit(6)
      .lean();

      console.log('📝 Raw blogs found:', blogs.length);

      if (blogs.length > 0) {
        console.log('First blog:', JSON.stringify(blogs[0], null, 2));

        // Format blogs as cards
        blogCards = blogs.map(blog => ({
          id: blog._id,
          title: blog.title,
          slug: blog.slug,
          summary: blog.introduction || 'Read this comprehensive guide about the treatment.',
          readingTime: blog.readingTime || 5,
          wordCount: blog.wordCount || 500,
          url: blog.url || `/blog/${blog.slug}`,
          publishedAt: blog.publishedAt,
          featured: blog.featured || false
        }));

        console.log('🎯 Formatted blog cards:', blogCards.length);
        console.log('First blog card:', JSON.stringify(blogCards[0], null, 2));
      }

    } catch (blogError) {
      console.error('❌ Error fetching blog cards:', blogError.message);
    }

    console.log('\n🏁 FINAL RESULT:');
    console.log('Service page data includes', Object.keys(servicePage.toObject()).length, 'properties');
    console.log('Blog cards count:', blogCards.length);

    const responseData = {
      ...servicePage.toObject(),
      blogs: blogCards
    };

    console.log('Response data includes blogs:', 'blogs' in responseData);
    console.log('Response blogs length:', responseData.blogs.length);

    process.exit(0);
  })
  .catch(err => {
    console.error('Database error:', err);
    process.exit(1);
  });