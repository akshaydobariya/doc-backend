/**
 * Direct test to check blog creation with minimal content
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Blog = require('./src/models/Blog');

async function testDirectBlogCreation() {
  console.log('🧪 Testing Direct Blog Creation...');

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');

  // Create a test blog with minimal data
  const testBlogData = {
    title: 'Direct Test Blog Creation',
    type: 'comprehensive',
    websiteId: new mongoose.Types.ObjectId('691218ffae08290a9428c27e'),
    createdBy: new mongoose.Types.ObjectId('69121f9d461d563a7cbe64a0'),
    generationProvider: 'azure-openai',
    content: {
      introduction: {
        content: 'This is a test introduction for direct blog creation.'
      },
      sections: [
        {
          heading: 'Test Section 1',
          content: 'This is the first test section content.'
        },
        {
          heading: 'Test Section 2',
          content: 'This is the second test section content.'
        }
      ],
      benefits: [
        {
          title: 'Benefit 1',
          content: 'First benefit description.'
        }
      ],
      faqs: [
        {
          question: 'What is this test?',
          answer: 'This is a test FAQ answer.'
        }
      ]
    },
    metaTitle: 'Direct Test Blog Creation - Test Clinic',
    metaDescription: 'This is a test meta description for the direct blog creation test.',
    tags: ['test', 'direct-creation'],
    isPublished: true
  };

  try {
    console.log('📝 Creating blog with data structure:');
    console.log('- Title:', testBlogData.title);
    console.log('- Type:', testBlogData.type);
    console.log('- Provider:', testBlogData.generationProvider);
    console.log('- Content structure:', Object.keys(testBlogData.content));

    const blog = new Blog(testBlogData);

    console.log('💾 Attempting to save blog...');
    const savedBlog = await blog.save();

    console.log('✅ Blog saved successfully!');
    console.log('Blog ID:', savedBlog._id);
    console.log('Title:', savedBlog.title);

    // Verify the blog was saved
    const foundBlog = await Blog.findById(savedBlog._id);
    if (foundBlog) {
      console.log('✅ Blog verification: Found in database');
      console.log('Published:', foundBlog.isPublished);
    } else {
      console.log('❌ Blog verification: NOT found in database');
    }

    console.log('🎉 Direct blog creation test PASSED!');
    return savedBlog;

  } catch (error) {
    console.error('❌ Direct blog creation FAILED:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      for (const field in error.errors) {
        console.error(`- ${field}: ${error.errors[field].message}`);
      }
    }

    console.error('Full error:', error);
    throw error;

  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
}

testDirectBlogCreation().catch(console.error);