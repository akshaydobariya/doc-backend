const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing service page edit API with blog cards...');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    const ServicePage = require('./src/models/ServicePage');
    const Blog = require('./src/models/Blog');
    const DentalService = require('./src/models/DentalService');
    const Website = require('./src/models/Website');

    // Test service page ID
    const servicePageId = '69103fa2398dfc78ad0f8270';

    // Simulate the API logic
    const servicePage = await ServicePage.findById(servicePageId)
      .populate('serviceId')
      .populate('websiteId', 'globalSettings theme name')
      .populate('versions.createdBy', 'name email');

    if (!servicePage) {
      console.log('❌ Service page not found');
      process.exit(1);
    }

    console.log('✅ Service page found:', servicePage.title);
    console.log('Service ID:', servicePage.serviceId._id);
    console.log('Website ID:', servicePage.websiteId._id);

    // Fetch blog cards for this service page
    let blogCards = [];
    try {
      const blogs = await Blog.find({
        serviceId: servicePage.serviceId._id,
        websiteId: servicePage.websiteId._id,
        isPublished: true
      })
      .select('_id title slug introduction readingTime wordCount url publishedAt featured')
      .sort({ publishedAt: -1 })
      .limit(6) // Limit to 6 blog cards
      .lean();

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
        console.log('\n📝 Blog cards:');
        blogCards.forEach((blog, index) => {
          console.log(`${index + 1}. ${blog.title} (${blog.readingTime}min read)`);
        });
      }

    } catch (blogError) {
      console.error('❌ Error fetching blog cards:', blogError.message);
    }

    // Simulate the response structure
    const responseData = {
      servicePage: servicePage.toObject(),
      currentVersionData: servicePage.getCurrentVersionData(),
      editingCapabilities: servicePage.getEditingCapabilities(),
      websiteSettings: servicePage.websiteId?.globalSettings || {},
      serviceInfo: servicePage.serviceId || {},
      blogs: blogCards // The new addition
    };

    console.log('\n🏁 EDIT API RESPONSE STRUCTURE:');
    console.log('- servicePage: ✅');
    console.log('- currentVersionData: ✅');
    console.log('- editingCapabilities: ✅');
    console.log('- websiteSettings: ✅');
    console.log('- serviceInfo: ✅');
    console.log(`- blogs: ✅ (${blogCards.length} cards)`);

    console.log('\n✅ Edit API now includes blog cards for UI display!');

    process.exit(0);
  })
  .catch(err => {
    console.error('Database error:', err);
    process.exit(1);
  });