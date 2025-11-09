const mongoose = require('mongoose');
require('dotenv').config();

const Blog = require('./src/models/Blog');

async function checkBlogFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const blogs = await Blog.find({}, {
      title: 1,
      slug: 1,
      isPublished: 1,
      status: 1,
      servicePageId: 1,
      publishedAt: 1
    }).limit(3);

    console.log('Sample blog documents:');
    blogs.forEach((blog, index) => {
      console.log(`\n${index + 1}. ${blog.title}`);
      console.log(`   isPublished: ${blog.isPublished}`);
      console.log(`   status: ${blog.status}`);
      console.log(`   publishedAt: ${blog.publishedAt}`);
      console.log(`   servicePageId: ${blog.servicePageId}`);
    });

    // Check what fields exist in the schema
    console.log('\n=== Blog Schema Info ===');
    const schema = Blog.schema;
    console.log('isPublished field exists:', schema.paths.isPublished ? 'YES' : 'NO');
    console.log('status field exists:', schema.paths.status ? 'YES' : 'NO');

    // Update all blogs to be published
    console.log('\n=== Updating all blogs to published ===');
    const updateResult = await Blog.updateMany(
      {},
      {
        $set: {
          isPublished: true,
          status: 'published',
          publishedAt: new Date()
        }
      }
    );

    console.log(`Updated ${updateResult.modifiedCount} blogs`);

    // Verify the update
    const publishedCount = await Blog.countDocuments({ isPublished: true });
    console.log(`Published blogs after update: ${publishedCount}`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBlogFields();