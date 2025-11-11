/**
 * Test the complete API workflow that matches production usage
 * 1. Create or find a website
 * 2. Generate content using the website ID
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function testCompleteAPIWorkflow() {
  try {
    console.log('🧪 Testing Complete API Workflow (Production Simulation)...');

    // Connect to database
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    // Import models
    const Website = require('./src/models/Website');
    const ServiceController = require('./src/controllers/serviceController');

    // Step 1: Create or find a test website
    console.log('\n📋 Step 1: Setting up test website...');

    let testWebsite = await Website.findOne({ subdomain: 'test-azure-clinic' });

    if (!testWebsite) {
      // Create a test doctor ID
      const testDoctorId = new mongoose.Types.ObjectId();

      testWebsite = new Website({
        subdomain: 'test-azure-clinic',
        name: 'Azure Test Dental Clinic',
        doctorId: testDoctorId,
        domain: 'test-azure-clinic.com',
        settings: {
          businessName: 'Azure Test Dental Clinic',
          ownerName: 'Dr. Test Azure',
          phone: '+1-555-TEST',
          email: 'test@azureclinicdemo.com',
          address: '123 Azure Street, Test City, TC 12345',
          theme: 'modern'
        }
      });
      await testWebsite.save();
      console.log('✅ Test website created:', testWebsite._id);
    } else {
      console.log('✅ Using existing test website:', testWebsite._id);
    }

    // Step 2: Test the content generation API with proper data
    console.log('\n📋 Step 2: Testing content generation...');

    // Mock Express request and response objects
    const req = {
      body: {
        serviceName: 'Azure OpenAI Dental Implants',
        category: 'oral-surgery',
        description: 'Professional dental implant services using Azure OpenAI for content generation',
        websiteId: testWebsite._id.toString(),
        keywords: ['dental implants', 'azure openai', 'oral surgery', 'tooth replacement'],
        generateSEO: true,
        generateFAQ: true,
        generateProcedure: true,
        generateBenefits: true,
        generateBlogs: true,
        fastMode: true,
        provider: 'auto',
        temperature: 0.7
      },
      user: { _id: new mongoose.Types.ObjectId() } // Mock authenticated user
    };

    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.responseData = data;
        return this;
      }
    };

    console.log('📤 Calling generateContentFromServiceData...');
    console.log('🔧 Request data:', {
      serviceName: req.body.serviceName,
      websiteId: req.body.websiteId,
      category: req.body.category,
      provider: req.body.provider
    });

    // Call the actual controller method
    await ServiceController.generateContentFromServiceData(req, res);

    // Check results
    console.log('\n📊 API Response Analysis:');
    console.log('Status Code:', res.statusCode);

    if (res.responseData) {
      const data = res.responseData;
      console.log('Success:', data.success);
      console.log('Message:', data.message);

      if (data.success) {
        console.log('✅ Content generation successful!');
        console.log('📝 Generated data:', {
          servicePageId: data.data?.servicePageId,
          sectionsGenerated: data.data?.sectionsGenerated,
          totalTokensUsed: data.data?.totalTokensUsed,
          generationProvider: data.data?.generationProvider,
          blogsGenerated: data.data?.blogsGenerated?.length || 0
        });
        console.log('🎉 Complete API workflow test PASSED!');
      } else {
        console.error('❌ Content generation failed:', data.message);
        console.error('Error code:', data.code);
      }
    } else {
      console.error('❌ No response data received');
    }

  } catch (error) {
    console.error('❌ Complete workflow test FAILED:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
  }
}

// Run complete workflow test
testCompleteAPIWorkflow();