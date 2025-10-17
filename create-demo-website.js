/**
 * Create Demo Website Script
 * This script creates a sample website to demonstrate the global publishing system
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-calendar';

async function createDemoWebsite() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('📚 Connected to MongoDB');

    // Import the Website model
    const Website = require('./backend/src/models/Website');

    // Check if demo website already exists
    const existingWebsite = await Website.findOne({ subdomain: 'demo' });
    if (existingWebsite) {
      console.log('✅ Demo website already exists with subdomain "demo"');
      console.log('🌐 Website URL:', `http://localhost:5000/api/websites/public/demo`);
      process.exit(0);
    }

    // Create a sample website document
    const demoWebsite = new Website({
      name: 'Dr. Demo Clinic',
      description: 'Professional dental care with cutting-edge technology',
      subdomain: 'demo',
      template: 'dental-modern',
      doctorId: new mongoose.Types.ObjectId(), // Fake doctor ID for demo
      status: 'published',
      publishedAt: new Date(),

      // Website content
      pages: [
        {
          slug: 'home',
          title: 'Welcome to Dr. Demo Clinic',
          content: {
            sections: [
              {
                type: 'hero',
                title: 'Professional Dental Care',
                subtitle: 'Experience the best in modern dentistry',
                buttonText: 'Book Appointment',
                backgroundImage: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56'
              },
              {
                type: 'services',
                title: 'Our Services',
                services: [
                  { name: 'General Dentistry', description: 'Comprehensive oral health care' },
                  { name: 'Cosmetic Dentistry', description: 'Beautiful, confident smiles' },
                  { name: 'Dental Implants', description: 'Permanent tooth replacement' }
                ]
              }
            ]
          },
          isHomePage: true
        }
      ],

      // Global settings
      globalSettings: {
        siteName: 'Dr. Demo Clinic',
        tagline: 'Your trusted dental care provider',
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af',
        fontFamily: 'Inter',
        logo: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=200',
        favicon: '/favicon.ico',

        // Contact information
        contact: {
          phone: '+1 (555) 123-4567',
          email: 'info@demodental.com',
          address: '123 Main Street, City, State 12345'
        },

        // Social media
        social: {
          facebook: 'https://facebook.com/demodental',
          twitter: 'https://twitter.com/demodental',
          instagram: 'https://instagram.com/demodental'
        }
      },

      // Deployment info
      deployment: {
        provider: 'vercel-simulated',
        deploymentStatus: 'ready',
        deploymentId: `demo_${Date.now()}`,
        url: 'https://demo-clinic-abc123.vercel.app',
        previewUrl: 'https://demo-clinic-abc123.vercel.app',
        lastDeployedAt: new Date(),
        buildLogs: [
          'Starting deployment process...',
          'Generating static site files...',
          'Static site files generated successfully',
          'Deploying to Vercel...',
          '✅ Successfully deployed to: https://demo-clinic-abc123.vercel.app'
        ]
      }
    });

    // Save the website to database
    await demoWebsite.save();
    console.log('✅ Demo website created in database');

    // Create the generated site directory
    const sitePath = path.join(__dirname, 'backend', 'generated-sites', 'demo');
    if (!fs.existsSync(sitePath)) {
      fs.mkdirSync(sitePath, { recursive: true });
    }

    // Create the index.html file
    const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dr. Demo Clinic - Professional Dental Care</title>
  <meta name="description" content="Professional dental care with cutting-edge technology">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f8fafc;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Header */
    header {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: white;
      padding: 1rem 0;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 700;
    }

    nav ul {
      display: flex;
      list-style: none;
      gap: 2rem;
    }

    nav a {
      color: white;
      text-decoration: none;
      transition: opacity 0.3s;
    }

    nav a:hover {
      opacity: 0.8;
    }

    /* Hero Section */
    .hero {
      background: linear-gradient(rgba(37, 99, 235, 0.9), rgba(30, 64, 175, 0.9)),
                  url('https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200') center/cover;
      color: white;
      padding: 4rem 0;
      text-align: center;
    }

    .hero h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .hero p {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .btn {
      display: inline-block;
      background: white;
      color: #2563eb;
      padding: 1rem 2rem;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 600;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }

    /* Services Section */
    .services {
      padding: 4rem 0;
      background: white;
    }

    .services h2 {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 3rem;
      color: #1f2937;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .service-card {
      background: #f8fafc;
      padding: 2rem;
      border-radius: 15px;
      text-align: center;
      border: 2px solid #e2e8f0;
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .service-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0,0,0,0.1);
      border-color: #2563eb;
    }

    .service-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .service-card h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #1f2937;
    }

    /* Status Banner */
    .status-banner {
      background: linear-gradient(45deg, #10b981, #059669);
      color: white;
      text-align: center;
      padding: 1rem;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }

    .status-banner strong {
      font-size: 1.1rem;
    }

    /* Footer */
    footer {
      background: #1f2937;
      color: white;
      padding: 3rem 0;
      margin-top: 4rem;
    }

    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .footer-section h3 {
      margin-bottom: 1rem;
      color: #f3f4f6;
    }

    .footer-section p, .footer-section a {
      color: #d1d5db;
      text-decoration: none;
      margin-bottom: 0.5rem;
      display: block;
    }

    .footer-section a:hover {
      color: #60a5fa;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
      }

      nav ul {
        gap: 1rem;
      }
    }
  </style>
</head>
<body>
  <!-- Status Banner -->
  <div class="status-banner">
    <strong>🌍 WEBSITE IS LIVE & PUBLISHED!</strong>
    This website is now accessible worldwide via global deployment system
  </div>

  <!-- Header -->
  <header>
    <div class="container">
      <div class="header-content">
        <div class="logo">Dr. Demo Clinic</div>
        <nav>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero" id="home">
    <div class="container">
      <h1>Professional Dental Care</h1>
      <p>Experience the best in modern dentistry with cutting-edge technology</p>
      <a href="#contact" class="btn">Book Appointment</a>
    </div>
  </section>

  <!-- Services Section -->
  <section class="services" id="services">
    <div class="container">
      <h2>Our Services</h2>
      <div class="services-grid">
        <div class="service-card">
          <div class="service-icon">🦷</div>
          <h3>General Dentistry</h3>
          <p>Comprehensive oral health care including cleanings, fillings, and preventive treatments</p>
        </div>
        <div class="service-card">
          <div class="service-icon">✨</div>
          <h3>Cosmetic Dentistry</h3>
          <p>Beautiful, confident smiles through whitening, veneers, and smile makeovers</p>
        </div>
        <div class="service-card">
          <div class="service-icon">🔧</div>
          <h3>Dental Implants</h3>
          <p>Permanent tooth replacement solutions that look and feel like natural teeth</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer id="contact">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Contact Information</h3>
          <p>📞 +1 (555) 123-4567</p>
          <p>✉️ info@demodental.com</p>
          <p>📍 123 Main Street, City, State 12345</p>
        </div>
        <div class="footer-section">
          <h3>Office Hours</h3>
          <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
          <p>Saturday: 9:00 AM - 3:00 PM</p>
          <p>Sunday: Closed</p>
        </div>
        <div class="footer-section">
          <h3>About This Website</h3>
          <p>🚀 Built with Doctor Website Builder</p>
          <p>🌍 Deployed globally via Vercel</p>
          <p>⚡ Powered by modern web technologies</p>
          <p><strong>Subdomain:</strong> demo.docwebsite.app</p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #374151;">
        <p>&copy; 2025 Dr. Demo Clinic. All rights reserved.</p>
        <p style="margin-top: 1rem; color: #9ca3af;">
          This is a demonstration website created by the Doctor Website Builder system.
        </p>
      </div>
    </div>
  </footer>
</body>
</html>`;

    // Write the HTML file
    fs.writeFileSync(path.join(sitePath, 'index.html'), indexHtml);
    console.log('✅ Generated static website files');

    // Create additional files
    const aboutHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About - Dr. Demo Clinic</title>
</head>
<body>
  <h1>About Dr. Demo Clinic</h1>
  <p>This is the about page for our demo dental clinic.</p>
  <a href="/">← Back to Home</a>
</body>
</html>`;

    fs.writeFileSync(path.join(sitePath, 'about.html'), aboutHtml);

    console.log('\n🎉 DEMO WEBSITE CREATED SUCCESSFULLY!');
    console.log('================================');
    console.log('📋 Website Details:');
    console.log(`   • Name: ${demoWebsite.name}`);
    console.log(`   • Subdomain: ${demoWebsite.subdomain}`);
    console.log(`   • Status: ${demoWebsite.status}`);
    console.log(`   • Template: ${demoWebsite.template}`);
    console.log('');
    console.log('🌐 Access URLs:');
    console.log(`   • Local: http://localhost:5000/api/websites/public/demo`);
    console.log(`   • Global (simulated): ${demoWebsite.deployment.url}`);
    console.log('');
    console.log('📁 Files Created:');
    console.log(`   • ${sitePath}/index.html`);
    console.log(`   • ${sitePath}/about.html`);
    console.log('');
    console.log('🧪 Test Commands:');
    console.log('   curl "http://localhost:5000/api/websites/public/demo"');
    console.log('   curl "http://localhost:5000/api/websites/public/demo/about"');
    console.log('');
    console.log('✅ The website is now published and accessible!');

  } catch (error) {
    console.error('❌ Error creating demo website:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📚 Disconnected from MongoDB');
  }
}

// Run the script
createDemoWebsite();