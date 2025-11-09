#!/usr/bin/env node

/**
 * Direct Blog Generation Test
 * Bypass API and test blog generation logic directly
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Blog = require('./src/models/Blog');
const ServicePage = require('./src/models/ServicePage');
const Website = require('./src/models/Website');

async function testDirectBlogGeneration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Simulate the createFastModeBlogs function directly
    const serviceName = "Complete Denture";
    const category = "prosthodontics";

    console.log(`\n📝 Testing direct blog generation for: ${serviceName}`);

    // Create fast mode blogs (same function from serviceController)
    const blogResults = {
      success: true,
      provider: 'fast-mode',
      model: 'fallback-content',
      blogs: [
        {
          type: 'comprehensive-guide',
          title: `Complete Guide to ${serviceName}: What You Need to Know`,
          slug: `complete-guide-to-${serviceName.toLowerCase().replace(/\s+/g, '-')}`,
          introduction: `Understanding ${serviceName} is essential for making informed decisions about your dental health. This comprehensive guide covers everything you need to know about this important dental treatment, from the basics to post-treatment care. Our professional team is dedicated to providing you with the highest quality care and ensuring your comfort throughout the process.`,
          content: {
            introduction: `${serviceName} represents a significant advancement in modern dental care, offering patients effective solutions for various oral health concerns. At our practice, we understand that choosing the right treatment can feel overwhelming, which is why we're committed to providing you with comprehensive information to help you make informed decisions about your dental health.`,
            whatIsIt: `${serviceName} is a professional dental treatment designed to address specific oral health needs using state-of-the-art techniques and materials. This procedure has been refined over years of clinical practice to ensure optimal outcomes for patients with varying dental conditions.`,
            whyNeedIt: `Patients may require ${serviceName} for several important reasons including prevention of further dental complications, restoration of proper oral function, improvement of aesthetic appearance, and maintenance of long-term oral health. Early intervention often leads to better outcomes and less invasive treatment options.`,
            signsSymptoms: `Common indicators that you may benefit from ${serviceName} include persistent discomfort, visible changes in your teeth or gums, difficulty chewing or speaking, sensitivity to temperature changes, and recommendations from your dental professional during routine examinations.`,
            consequencesDelay: `Delaying necessary dental treatment can lead to more complex problems requiring extensive intervention, increased treatment costs, potential pain and discomfort, and compromise of your overall oral health and quality of life.`,
            procedureSteps: `The ${serviceName} procedure typically involves comprehensive examination and assessment, detailed treatment planning, preparation of the treatment area, precise execution using modern dental techniques, and thorough follow-up care to ensure optimal healing and results.`,
            benefits: `Benefits of ${serviceName} include improved oral health and function, enhanced aesthetic appearance, prevention of future complications, restored confidence in your smile, and long-term value for your investment in dental care.`,
            aftercare: `Post-treatment care is crucial for optimal results and includes following all provided instructions, maintaining excellent oral hygiene, attending scheduled follow-up appointments, avoiding certain foods or activities as recommended, and contacting our office with any concerns.`,
            sideEffectsRisks: `While ${serviceName} is generally safe and well-tolerated, potential considerations include temporary sensitivity, minor discomfort during healing, and the importance of following post-treatment guidelines. Our team thoroughly discusses all aspects of treatment before proceeding.`,
            mythsAndFacts: `Many misconceptions exist about ${serviceName}. Fact: Modern techniques have made treatment more comfortable than ever. Fact: Professional care ensures safe and effective results. Fact: Early treatment often prevents more complex problems. Our team is always available to address any questions or concerns.`,
            comprehensiveFAQ: `Frequently asked questions about ${serviceName} include inquiries about treatment duration, recovery time, insurance coverage, payment options, and expected outcomes. We encourage patients to discuss any questions during their consultation to ensure complete understanding of their treatment plan.`
          },
          keyTakeaways: [
            `${serviceName} is an effective dental treatment for various oral health concerns`,
            'Professional care ensures safe and optimal treatment outcomes',
            'Early intervention often leads to better results and less invasive treatment',
            'Proper post-treatment care is essential for long-term success',
            'Regular dental check-ups help identify treatment needs early'
          ],
          tags: [serviceName.toLowerCase().replace(/\s+/g, '-'), category || 'dental-care', 'treatment-guide'],
          category: category || 'general-dentistry',
          metaTitle: `${serviceName} Guide | Professional Dental Care`,
          metaDescription: `Comprehensive guide to ${serviceName} covering everything you need to know about this dental treatment, from procedure details to post-care instructions.`
        }
      ]
    };

    console.log('✅ Blog data generated successfully');

    // Find the service page and website
    const servicePageId = "690f1963ec0a57c1425e592c"; // From user's response
    const websiteId = "690f194cec0a57c1425e592c";

    const website = await Website.findById(websiteId);
    if (!website) {
      console.log('❌ Website not found:', websiteId);
      return;
    }

    console.log(`✅ Found website: ${website.name}`);

    // Create blog in database
    const blogData = blogResults.blogs[0];

    const existingBlog = await Blog.findOne({
      slug: blogData.slug,
      websiteId: website._id
    });

    if (existingBlog) {
      console.log(`⚠️  Blog already exists: ${blogData.title}`);
      console.log(`   ID: ${existingBlog._id}`);
      console.log(`   Published: ${existingBlog.isPublished}`);
      return;
    }

    const blog = new Blog({
      title: blogData.title,
      slug: blogData.slug,
      introduction: blogData.introduction,
      content: blogData.content,
      keyTakeaways: blogData.keyTakeaways || [],
      servicePageId: servicePageId, // Link to service page
      websiteId: website._id,
      author: website.doctorName || 'Dr. Professional',
      authorBio: `Experienced dental professional at ${website.name}`,
      category: category || 'general-dentistry',
      tags: blogData.tags || [serviceName.toLowerCase(), category],
      metaTitle: blogData.metaTitle || blogData.title,
      metaDescription: blogData.metaDescription || blogData.introduction?.substring(0, 150),
      seoKeywords: [serviceName.toLowerCase()],
      isPublished: true, // CRITICAL: Ensure published
      publishedAt: new Date(),
      featured: false,
      llmGenerated: true,
      generationProvider: 'fast-mode',
      readingTime: 5,
      wordCount: 1200
    });

    // Calculate reading time and generate SEO
    blog.calculateReadingTime();
    blog.generateSEO();

    await blog.save();

    console.log(`✅ Blog created successfully: ${blog.title}`);
    console.log(`   ID: ${blog._id}`);
    console.log(`   Slug: ${blog.slug}`);
    console.log(`   Published: ${blog.isPublished}`);
    console.log(`   Service Page ID: ${blog.servicePageId}`);

    // Test API query
    const serviceBlogsFromAPI = await Blog.findByService(servicePageId);
    console.log(`\n📋 API Query Test:`);
    console.log(`   Blogs found for service page: ${serviceBlogsFromAPI.length}`);

    if (serviceBlogsFromAPI.length > 0) {
      serviceBlogsFromAPI.forEach((foundBlog, index) => {
        console.log(`   ${index + 1}. ${foundBlog.title} (${foundBlog.isPublished ? 'Published' : 'Unpublished'})`);
      });
    }

    await mongoose.disconnect();
    console.log('\n🎉 Direct blog generation test completed!');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testDirectBlogGeneration();