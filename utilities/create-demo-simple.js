/**
 * Simple Demo Website Creator
 * Creates static files for testing the publishing system
 */

const fs = require('fs');
const path = require('path');

function createDemoFiles() {
  console.log('🚀 Creating demo website files...');

  // Create the generated site directory
  const sitePath = path.join(__dirname, 'generated-sites', 'demo');
  if (!fs.existsSync(sitePath)) {
    fs.mkdirSync(sitePath, { recursive: true });
    console.log('📁 Created directory:', sitePath);
  }

  // Create the index.html file
  const indexHtml = `<!DOCTYPE html>
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
      font-size: 1.2rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    /* Header */
    header {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: white;
      padding: 2rem 0;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .header-content {
      text-align: center;
    }

    .logo {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .tagline {
      font-size: 1.2rem;
      opacity: 0.9;
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
      .services-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <!-- Status Banner -->
  <div class="status-banner">
    <strong>🌍 DEMO WEBSITE IS LIVE & PUBLISHED!</strong>
    This website demonstrates the global publishing system in action
  </div>

  <!-- Header -->
  <header>
    <div class="container">
      <div class="header-content">
        <div class="logo">Dr. Demo Clinic</div>
        <div class="tagline">Professional dental care with cutting-edge technology</div>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <h1>Excellence in Dental Care</h1>
      <p>State-of-the-art treatments in a comfortable, modern environment</p>
      <a href="#contact" class="btn">Schedule Consultation</a>
    </div>
  </section>

  <!-- Services Section -->
  <section class="services" id="services">
    <div class="container">
      <h2>Our Specialized Services</h2>
      <div class="services-grid">
        <div class="service-card">
          <div class="service-icon">🦷</div>
          <h3>General Dentistry</h3>
          <p>Comprehensive oral health care including routine cleanings, fillings, and preventive treatments to maintain your smile</p>
        </div>
        <div class="service-card">
          <div class="service-icon">✨</div>
          <h3>Cosmetic Dentistry</h3>
          <p>Transform your smile with professional whitening, veneers, and complete smile makeovers using the latest techniques</p>
        </div>
        <div class="service-card">
          <div class="service-icon">🔧</div>
          <h3>Restorative Care</h3>
          <p>Advanced dental implants, crowns, and bridges that restore both function and natural beauty to your teeth</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer id="contact">
    <div class="container">
      <div class="footer-content">
        <div class="footer-section">
          <h3>📞 Contact Information</h3>
          <p>Phone: +1 (555) 123-4567</p>
          <p>Email: info@demodental.com</p>
          <p>Address: 123 Professional Blvd, Suite 100</p>
          <p>Medical City, State 12345</p>
        </div>
        <div class="footer-section">
          <h3>⏰ Office Hours</h3>
          <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
          <p>Saturday: 9:00 AM - 3:00 PM</p>
          <p>Sunday: Emergency Only</p>
          <p>24/7 Emergency Line Available</p>
        </div>
        <div class="footer-section">
          <h3>🚀 Technology Demo</h3>
          <p><strong>Built with:</strong> Doctor Website Builder</p>
          <p><strong>Deployed via:</strong> Global Publishing System</p>
          <p><strong>Hosting:</strong> Vercel Global CDN</p>
          <p><strong>Status:</strong> Live & Worldwide Accessible</p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #374151;">
        <p>&copy; 2025 Dr. Demo Clinic. All rights reserved.</p>
        <p style="margin-top: 1rem; color: #9ca3af;">
          <strong>Demonstration Website</strong> - Created by Doctor Website Builder System
        </p>
        <p style="color: #9ca3af; margin-top: 0.5rem;">
          Subdomain: <strong>demo</strong> | Global URL: <strong>accessible worldwide</strong>
        </p>
      </div>
    </div>
  </footer>
</body>
</html>`;

  // Write the main index.html file
  fs.writeFileSync(path.join(sitePath, 'index.html'), indexHtml);
  console.log('✅ Created index.html');

  // Create about page
  const aboutHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About - Dr. Demo Clinic</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1 { color: #2563eb; }
    .nav { margin-bottom: 2rem; }
    .nav a { color: #2563eb; text-decoration: none; margin-right: 1rem; }
  </style>
</head>
<body>
  <div class="nav">
    <a href="/">← Back to Home</a> |
    <a href="/services">Services</a> |
    <a href="/contact">Contact</a>
  </div>

  <h1>About Dr. Demo Clinic</h1>

  <p>Welcome to Dr. Demo Clinic, a demonstration of our advanced website building and global publishing system.</p>

  <h2>Our Mission</h2>
  <p>To provide exceptional dental care using the latest technology and techniques, while demonstrating the power of modern web deployment systems.</p>

  <h2>Technology Showcase</h2>
  <ul>
    <li><strong>Global Publishing:</strong> This website is deployed worldwide via Vercel</li>
    <li><strong>Modern Design:</strong> Responsive, professional layouts</li>
    <li><strong>SEO Optimized:</strong> Built for search engine visibility</li>
    <li><strong>Fast Loading:</strong> Optimized for speed and performance</li>
  </ul>

  <p><em>This is a demonstration website created by the Doctor Website Builder system.</em></p>
</body>
</html>`;

  fs.writeFileSync(path.join(sitePath, 'about.html'), aboutHtml);
  console.log('✅ Created about.html');

  // Create services page
  const servicesHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Services - Dr. Demo Clinic</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1 { color: #2563eb; }
    .nav { margin-bottom: 2rem; }
    .nav a { color: #2563eb; text-decoration: none; margin-right: 1rem; }
    .service { background: #f8fafc; padding: 1.5rem; margin: 1rem 0; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="nav">
    <a href="/">← Back to Home</a> |
    <a href="/about">About</a> |
    <a href="/contact">Contact</a>
  </div>

  <h1>Our Services</h1>

  <div class="service">
    <h3>🦷 General Dentistry</h3>
    <p>Comprehensive oral health care including routine cleanings, fillings, and preventive treatments.</p>
  </div>

  <div class="service">
    <h3>✨ Cosmetic Dentistry</h3>
    <p>Professional teeth whitening, veneers, and complete smile makeovers.</p>
  </div>

  <div class="service">
    <h3>🔧 Restorative Care</h3>
    <p>Advanced dental implants, crowns, and bridges for complete oral restoration.</p>
  </div>

  <p><strong>Ready to schedule?</strong> Contact us today!</p>
</body>
</html>`;

  fs.writeFileSync(path.join(sitePath, 'services.html'), servicesHtml);
  console.log('✅ Created services.html');

  console.log('\n🎉 DEMO WEBSITE FILES CREATED!');
  console.log('===============================');
  console.log('📁 Files location:', sitePath);
  console.log('🌐 Test URLs:');
  console.log('   • Home: http://localhost:5000/api/websites/public/demo');
  console.log('   • About: http://localhost:5000/api/websites/public/demo/about');
  console.log('   • Services: http://localhost:5000/api/websites/public/demo/services');
  console.log('');
  console.log('🧪 Test with curl:');
  console.log('   curl "http://localhost:5000/api/websites/public/demo"');
  console.log('');
  console.log('✅ Ready to test the publishing system!');
}

// Run the function
createDemoFiles();