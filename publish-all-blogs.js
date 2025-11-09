const mongoose = require('mongoose');
require('dotenv').config();

const Blog = require('./src/models/Blog');

async function publishAllBlogs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await Blog.updateMany(
      { isPublished: false },
      {
        $set: {
          isPublished: true,
          publishedAt: new Date(),
          status: 'published'
        }
      }
    );

    console.log(`Published ${result.modifiedCount} blogs`);

    const total = await Blog.countDocuments();
    const published = await Blog.countDocuments({ isPublished: true });

    console.log(`Total blogs: ${total}`);
    console.log(`Published blogs: ${published}`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

publishAllBlogs();