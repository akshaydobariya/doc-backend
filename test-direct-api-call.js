#!/usr/bin/env node

/**
 * Test Direct API Call
 * Call generateContentFromServiceData directly to test blog generation
 */

const mongoose = require('mongoose');
require('dotenv').config();

const { generateContentFromServiceData } = require('./src/controllers/serviceController');

async function testDirectAPICall() {
  try {
    console.log('🧪 Testing Direct API Call for Blog Generation...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create mock req and res objects
    const mockReq = {
      body: {
        serviceName: "Composite Fillings",
        category: "general-dentistry",
        description: "Tooth-colored composite resin fillings for cavities and minor tooth damage restoration",
        websiteId: "690f194cec0a57c1425e592c",
        generateSEO: true,
        generateFAQ: true,
        generateProcedure: true,
        generateBenefits: true,
        generateBlogs: true
      },
      user: null // No user for testing public access
    };

    let responseData = null;
    let statusCode = 200;

    const mockRes = {
      status: (code) => {
        statusCode = code;
        return mockRes;
      },
      json: (data) => {
        responseData = data;
        return mockRes;
      }
    };

    console.log('📝 Calling generateContentFromServiceData directly...');
    console.log('Request payload:', JSON.stringify(mockReq.body, null, 2));

    // Call the function directly
    await generateContentFromServiceData(mockReq, mockRes);

    console.log(`\n📊 Response Status: ${statusCode}`);

    if (responseData) {
      console.log('\n🎯 Response received:');
      console.log('Success:', responseData.success);

      if (responseData.success) {
        console.log('Service created:', responseData.data?.service ? 'YES' : 'NO');
        console.log('Service page created:', responseData.data?.page ? 'YES' : 'NO');
        console.log('Blogs generated:', responseData.data?.blogs ? responseData.data.blogs.length : 0);
        console.log('Blogs field exists:', 'blogs' in (responseData.data || {}));

        if (responseData.data?.blogs && responseData.data.blogs.length > 0) {
          console.log('\n📝 Generated Blogs:');
          responseData.data.blogs.forEach((blog, index) => {
            console.log(`  ${index + 1}. ${blog.title} (${blog.slug})`);
          });
        }
      } else {
        console.log('Error:', responseData.message);
        console.log('Error code:', responseData.code);
      }
    } else {
      console.log('❌ No response received');
    }

    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    if (error.stack) {
      console.log('\nStack trace:', error.stack);
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

testDirectAPICall();