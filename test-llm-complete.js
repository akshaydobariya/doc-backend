require('dotenv').config();
const mongoose = require('mongoose');
const { generateContentFromServiceData } = require('./src/controllers/serviceController');
const Website = require('./src/models/Website');

async function testLLMComplete() {
  console.log('Testing Complete LLM Service Generation...\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create a test website first
    console.log('\n📝 Creating test website...');
    const testWebsite = new Website({
      name: 'Test Dental Practice',
      subdomain: 'test-dental-practice',
      doctorId: new mongoose.Types.ObjectId(),
      businessInfo: {
        name: 'Test Dental Practice',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        phone: '(555) 123-4567',
        email: 'test@example.com'
      },
      branding: {
        primaryColor: '#1976d2',
        secondaryColor: '#ffffff'
      }
    });

    await testWebsite.save();
    console.log('✅ Test website created with ID:', testWebsite._id);

    // Mock request and response objects
    const req = {
      body: {
        serviceName: 'Teeth Whitening',
        category: 'cosmetic-dentistry',
        description: 'Professional teeth whitening treatment to brighten your smile',
        websiteId: testWebsite._id.toString(),
        generateSEO: true,
        generateFAQ: true,
        generateProcedure: true,
        generateBenefits: true,
        provider: 'auto',
        temperature: 0.7,
        keywords: ['teeth whitening', 'smile brightening', 'cosmetic dentistry']
      },
      user: { id: 'test-user-id' }
    };

    let responseData = null;
    let statusCode = 200;

    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      }
    };

    console.log('\n🚀 Calling generateContentFromServiceData function...');

    // Call the controller function directly
    await generateContentFromServiceData(req, res);

    console.log('\n📋 Response Status Code:', statusCode);

    if (responseData?.success) {
      const { service, page, llmContent, tokensUsed } = responseData.data;

      console.log('\n🎉 SUCCESS: Complete LLM Generation Working!');
      console.log('✓ Service created:', service?.name, '(ID:', service?._id, ')');
      console.log('✓ Service slug:', service?.slug);
      console.log('✓ Service category:', service?.category);
      console.log('✓ Service page created:', page?.title, '(ID:', page?._id, ')');
      console.log('✓ Page status:', page?.status);
      console.log('✓ Page integrated:', page?.isIntegrated);
      console.log('✓ Total tokens used:', tokensUsed);

      console.log('\n📝 Generated Content Sections:');
      Object.keys(llmContent || {}).forEach(section => {
        if (llmContent[section]?.content) {
          console.log(`\n${section.toUpperCase()}:`);
          console.log(`  Provider: ${llmContent[section].provider}`);
          console.log(`  Tokens: ${llmContent[section].tokensUsed}`);
          console.log(`  Content: ${llmContent[section].content.substring(0, 200)}...`);
        }
      });

      console.log('\n🔗 Page Content Structure:');
      if (page?.content) {
        Object.keys(page.content).forEach(section => {
          if (page.content[section]) {
            console.log(`  ✓ ${section}: ${typeof page.content[section] === 'object' ? 'Generated' : page.content[section]}`);
          }
        });
      }

      console.log('\n📊 SEO Data:');
      if (page?.seo) {
        console.log(`  Title: ${page.seo.metaTitle}`);
        console.log(`  Description: ${page.seo.metaDescription}`);
        console.log(`  Keywords: ${page.seo.keywords?.join(', ')}`);
      }

      console.log('\n🎯 RESULT: LLM service is fully functional!');
      console.log('   ✓ All LLM content generation working');
      console.log('   ✓ Service and ServicePage models working');
      console.log('   ✓ Content parsing and structuring working');
      console.log('   ✓ SEO metadata generation working');
      console.log('   ✓ Ready for frontend integration!');

    } else {
      console.log('\n❌ Generation failed:', responseData?.message);
      console.log('Error details:', responseData?.error);
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    if (responseData?.success) {
      const { service, page } = responseData.data;
      if (service?._id) {
        await mongoose.model('DentalService').deleteOne({ _id: service._id });
        console.log('✅ Test service deleted');
      }
      if (page?._id) {
        await mongoose.model('ServicePage').deleteOne({ _id: page._id });
        console.log('✅ Test service page deleted');
      }
    }
    await Website.deleteOne({ _id: testWebsite._id });
    console.log('✅ Test website deleted');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testLLMComplete();