/**
 * Debug Website Workflow
 * This script helps identify issues in the website creation → publishing workflow
 */

const mongoose = require('mongoose');
const Website = require('./src/models/Website');
const staticSiteGenerator = require('./src/services/staticSiteGenerator');
const path = require('path');
const fs = require('fs');

async function debugWorkflow() {
  try {
    console.log('🔍 DEBUGGING WEBSITE WORKFLOW...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://akshay:akshay7775@cluster0.hzgzpjq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('📚 Connected to MongoDB');

    // 1. Check existing websites
    console.log('\n1. 📋 CHECKING EXISTING WEBSITES:');
    const websites = await Website.find().sort({ updatedAt: -1 }).limit(5);

    if (websites.length === 0) {
      console.log('   ❌ No websites found in database');
    } else {
      websites.forEach((site, index) => {
        console.log(`   ${index + 1}. ${site.name} (${site.subdomain})`);
        console.log(`      Status: ${site.status}`);
        console.log(`      Template: ${site.template}`);
        console.log(`      Versions: ${site.versions.length}`);
        console.log(`      Last Updated: ${site.updatedAt}`);
        if (site.status === 'published') {
          console.log(`      🌐 Should be accessible at: http://localhost:5000/api/websites/public/${site.subdomain}`);
        }
        console.log('');
      });
    }

    // 2. Check published websites
    console.log('\n2. 🌍 CHECKING PUBLISHED WEBSITES:');
    const publishedSites = await Website.find({ status: 'published' });

    if (publishedSites.length === 0) {
      console.log('   ❌ No published websites found');
    } else {
      for (const site of publishedSites) {
        console.log(`   ✅ ${site.name} (${site.subdomain})`);
        console.log(`      Published: ${site.publishedAt}`);
        console.log(`      Deployment Status: ${site.deployment?.deploymentStatus || 'Not set'}`);

        // Check if static files exist
        const sitePath = path.join(__dirname, 'generated-sites', site.subdomain);
        const indexPath = path.join(sitePath, 'index.html');

        if (fs.existsSync(indexPath)) {
          console.log(`      📁 Static files: ✅ Generated`);
          const stats = fs.statSync(indexPath);
          console.log(`      📅 Generated: ${stats.mtime}`);

          // Check file size
          const fileSize = stats.size;
          console.log(`      📏 File size: ${fileSize} bytes`);

          if (fileSize < 500) {
            console.log(`      ⚠️  File seems small - might be empty`);
          }
        } else {
          console.log(`      📁 Static files: ❌ Missing`);
        }
        console.log('');
      }
    }

    // 3. Check latest website in detail
    if (websites.length > 0) {
      const latestSite = websites[0];
      console.log(`\n3. 🔍 DETAILED CHECK OF LATEST WEBSITE: ${latestSite.name}`);

      const currentVersion = latestSite.getCurrentVersion();
      if (currentVersion) {
        console.log(`   Version: ${currentVersion.versionNumber}`);
        console.log(`   Pages: ${currentVersion.pages.length}`);

        currentVersion.pages.forEach((page, index) => {
          console.log(`   Page ${index + 1}: ${page.name} (${page.slug})`);
          console.log(`     Components: ${page.components ? page.components.length : 0}`);

          if (page.components && page.components.length > 0) {
            const firstComponent = page.components[0];
            console.log(`     First component type: ${typeof firstComponent}`);

            if (typeof firstComponent === 'string') {
              console.log(`     Content preview: ${firstComponent.substring(0, 100)}...`);
            } else if (firstComponent.component) {
              console.log(`     Component HTML preview: ${firstComponent.component.substring(0, 100)}...`);
            } else {
              console.log(`     Component structure: ${JSON.stringify(firstComponent).substring(0, 100)}...`);
            }
          } else {
            console.log(`     ⚠️  No components found`);
          }
        });
      } else {
        console.log(`   ❌ No current version found`);
      }

      // 4. Test static site generation
      console.log(`\n4. 🏗️  TESTING STATIC SITE GENERATION:`);
      try {
        const result = await staticSiteGenerator.generateSite(latestSite._id);
        console.log(`   ✅ Static site generated successfully`);
        console.log(`   📁 Output directory: ${result.siteDir}`);
        console.log(`   📄 Files generated: ${result.files.length}`);

        result.files.forEach(file => {
          console.log(`     - ${file.fileName} (${file.type})`);
        });

        // Check generated file content
        const indexPath = path.join(result.siteDir, 'index.html');
        if (fs.existsSync(indexPath)) {
          const content = fs.readFileSync(indexPath, 'utf8');
          console.log(`   📏 Index.html size: ${content.length} characters`);

          // Check for Destack content
          if (content.includes('Welcome to') && content.includes('ready for content')) {
            console.log(`   ⚠️  Using fallback content - no Destack content found`);
          } else {
            console.log(`   ✅ Custom content detected`);
          }
        }

      } catch (error) {
        console.log(`   ❌ Static site generation failed: ${error.message}`);
      }
    }

    // 5. Provide recommendations
    console.log(`\n5. 💡 RECOMMENDATIONS:`);

    if (publishedSites.length === 0) {
      console.log(`   📝 Create and publish a website to test the workflow:`);
      console.log(`   1. Go to frontend: http://localhost:3000`);
      console.log(`   2. Login as doctor`);
      console.log(`   3. Create new website`);
      console.log(`   4. Edit with Destack`);
      console.log(`   5. Save content`);
      console.log(`   6. Publish website`);
    } else {
      console.log(`   🧪 Test published websites:`);
      publishedSites.forEach(site => {
        console.log(`   curl "http://localhost:5000/api/websites/public/${site.subdomain}"`);
      });
    }

    console.log(`\n✅ DEBUG COMPLETE!`);

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the debug
debugWorkflow();