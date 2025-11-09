const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
require('dotenv').config();

console.log('Testing service page edit endpoint directly...');

// Create a simple Express app to simulate the request
const app = express();

// Setup session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'test-secret',
  resave: false,
  saveUninitialized: false
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Import the route
    const servicePageRoutes = require('./src/routes/servicePages');

    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = { id: '673fc6c87ba6fe3b9e5c44c4', role: 'doctor' }; // Mock user
      next();
    });

    // Use the service page routes
    app.use('/api/service-pages', servicePageRoutes);

    // Start server
    const server = app.listen(3001, () => {
      console.log('Test server started on port 3001');

      // Make the API call
      setTimeout(async () => {
        try {
          const response = await fetch('http://localhost:3001/api/service-pages/69103fa2398dfc78ad0f8270/edit');
          const data = await response.json();

          console.log('\n📊 API Response Analysis:');
          console.log('Success:', data.success);

          if (data.success && data.data) {
            console.log('Response includes:');
            console.log('- servicePage:', !!data.data.servicePage);
            console.log('- currentVersionData:', !!data.data.currentVersionData);
            console.log('- editingCapabilities:', !!data.data.editingCapabilities);
            console.log('- websiteSettings:', !!data.data.websiteSettings);
            console.log('- serviceInfo:', !!data.data.serviceInfo);
            console.log('- blogs:', !!data.data.blogs);

            if (data.data.blogs) {
              console.log(`✅ Found ${data.data.blogs.length} blog cards!`);
              data.data.blogs.forEach((blog, index) => {
                console.log(`${index + 1}. ${blog.title} (${blog.readingTime}min read)`);
              });
            } else {
              console.log('❌ No blogs field in response');
            }
          } else {
            console.log('❌ API call failed:', data.message);
          }

          server.close();
          process.exit(0);
        } catch (error) {
          console.error('❌ Error calling API:', error.message);
          server.close();
          process.exit(1);
        }
      }, 1000);
    });

  })
  .catch(err => {
    console.error('Database error:', err);
    process.exit(1);
  });