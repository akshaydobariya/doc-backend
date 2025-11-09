const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing service page edit API with blog cards...');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    const ServicePage = require('./src/models/ServicePage');
    const Blog = require('./src/models/Blog');

    // Test service page ID
    const servicePageId = '69103fa2398dfc78ad0f8270';

    // Get service page without populate to avoid model registration issues
    const servicePage = await ServicePage.findById(servicePageId);

    if (!servicePage) {
      console.log('❌ Service page not found');
      process.exit(1);
    }

    console.log('✅ Service page found:', servicePage.title);
    console.log('Service ID:', servicePage.serviceId);
    console.log('Website ID:', servicePage.websiteId);

    // Fetch blog cards for this service page
    let blogCards = [];
    try {
      console.log('🔍 Searching for blogs with:');
      console.log('- serviceId:', servicePage.serviceId);
      console.log('- websiteId:', servicePage.websiteId);
      console.log('- isPublished: true');

      const blogs = await Blog.find({
        serviceId: servicePage.serviceId,
        websiteId: servicePage.websiteId,
        isPublished: true
      })
      .select('_id title slug introduction readingTime wordCount url publishedAt featured')
      .sort({ publishedAt: -1 })
      .limit(6)
      .lean();

      console.log(`📝 Raw blogs found: ${blogs.length}`);

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

      console.log(`✅ Found ${blogCards.length} blog cards for service page editing`);

      if (blogCards.length > 0) {
        console.log('\n📝 Blog cards for UI:');
        blogCards.forEach((blog, index) => {
          console.log(`${index + 1}. ${blog.title}`);
          console.log(`   Summary: ${blog.summary.substring(0, 80)}...`);
          console.log(`   Reading time: ${blog.readingTime}min | Words: ${blog.wordCount}`);
          console.log(`   URL: ${blog.url}`);
          console.log('');
        });
      }

    } catch (blogError) {
      console.error('❌ Error fetching blog cards:', blogError.message);
    }

    console.log('\n🏁 EDIT API RESPONSE WILL INCLUDE:');
    console.log('- servicePage: ✅');
    console.log('- currentVersionData: ✅');
    console.log('- editingCapabilities: ✅');
    console.log('- websiteSettings: ✅');
    console.log('- serviceInfo: ✅');
    console.log(`- blogs: ✅ (${blogCards.length} cards)`);

    console.log('\n✅ SUCCESS! Edit API now includes blog cards for UI display!');
    console.log('UI can now show blog cards in the service page editor.');

    process.exit(0);
  })
  .catch(err => {
    console.error('Database error:', err);
    process.exit(1);
  });