const fs = require('fs').promises;
const path = require('path');
const Website = require('../models/Website');
const ServicePage = require('../models/ServicePage');

/**
 * Static Site Generator Service
 * Converts website data into deployable static HTML/CSS/JS files
 */

class StaticSiteGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '../../generated-sites');
  }

  /**
   * Generate static site for a website
   * @param {string} websiteId - Website ID
   * @returns {Object} Generation result with file paths
   */
  async generateSite(websiteId) {
    try {
      const website = await Website.findById(websiteId);
      if (!website) {
        throw new Error('Website not found');
      }

      const currentVersion = website.getCurrentVersion();
      if (!currentVersion) {
        throw new Error('No website version found');
      }

      // Create output directory
      const siteDir = path.join(this.outputDir, website.subdomain);
      await this.ensureDir(siteDir);

      // Generate files
      const result = {
        websiteId,
        subdomain: website.subdomain,
        files: [],
        generatedAt: new Date(),
        siteDir
      };

      // Generate HTML files for each page
      for (const page of currentVersion.pages) {
        const htmlContent = await this.generatePageHTML(page, currentVersion.globalSettings, website);
        const fileName = page.slug === 'home' ? 'index.html' : `${page.slug}.html`;
        const filePath = path.join(siteDir, fileName);

        await fs.writeFile(filePath, htmlContent);
        result.files.push({
          type: 'html',
          page: page.slug,
          path: filePath,
          fileName
        });
      }

      // Generate service pages
      const servicePages = await ServicePage.find({
        websiteId: websiteId,
        status: 'published',
        isActive: true
      }).populate('serviceId');

      // Create services directory
      const servicesDir = path.join(siteDir, 'services');
      await this.ensureDir(servicesDir);

      for (const servicePage of servicePages) {
        const htmlContent = await this.generateServicePageHTML(servicePage, currentVersion.globalSettings, website);
        const fileName = `${servicePage.slug}.html`;
        const filePath = path.join(servicesDir, fileName);

        await fs.writeFile(filePath, htmlContent);
        result.files.push({
          type: 'service-page',
          page: servicePage.slug,
          title: servicePage.title,
          path: filePath,
          fileName,
          serviceId: servicePage.serviceId._id
        });
      }

      // Generate CSS file
      const cssContent = this.generateCSS(currentVersion.globalSettings);
      const cssPath = path.join(siteDir, 'styles.css');
      await fs.writeFile(cssPath, cssContent);
      result.files.push({
        type: 'css',
        path: cssPath,
        fileName: 'styles.css'
      });

      // Generate sitemap.xml
      const sitemapContent = this.generateSitemap(currentVersion.pages, servicePages, website);
      const sitemapPath = path.join(siteDir, 'sitemap.xml');
      await fs.writeFile(sitemapPath, sitemapContent);
      result.files.push({
        type: 'sitemap',
        path: sitemapPath,
        fileName: 'sitemap.xml'
      });

      // Generate robots.txt
      const robotsContent = this.generateRobotsTxt(website);
      const robotsPath = path.join(siteDir, 'robots.txt');
      await fs.writeFile(robotsPath, robotsContent);
      result.files.push({
        type: 'robots',
        path: robotsPath,
        fileName: 'robots.txt'
      });

      // Generate manifest.json for PWA
      const manifestContent = this.generateManifest(currentVersion.globalSettings, website);
      const manifestPath = path.join(siteDir, 'manifest.json');
      await fs.writeFile(manifestPath, manifestContent);
      result.files.push({
        type: 'manifest',
        path: manifestPath,
        fileName: 'manifest.json'
      });

      return result;
    } catch (error) {
      console.error('Static site generation error:', error);
      throw error;
    }
  }

  /**
   * Generate HTML for a single page
   * @param {Object} page - Page data
   * @param {Object} globalSettings - Global website settings
   * @param {Object} website - Website object
   * @returns {string} HTML content
   */
  async generatePageHTML(page, globalSettings, website) {
    // Handle different content formats (Destack vs traditional components)
    let componentsHTML = '';

    if (page.components && Array.isArray(page.components)) {
      if (page.components.length > 0) {
        // Check if it's Destack format (direct HTML content) or component format
        const firstComponent = page.components[0];

        if (typeof firstComponent === 'string') {
          // Direct HTML content from Destack
          componentsHTML = page.components.join('\n');
        } else if (firstComponent && firstComponent.component) {
          // Traditional component format
          componentsHTML = page.components.map(component => component.component).join('\n');
        } else if (firstComponent && firstComponent.html) {
          // HTML property format
          componentsHTML = page.components.map(component => component.html).join('\n');
        } else {
          // Fallback: convert to string
          componentsHTML = page.components.map(component =>
            typeof component === 'string' ? component : JSON.stringify(component)
          ).join('\n');
        }
      }
    } else if (page.content) {
      // Handle content stored in a single content field
      if (typeof page.content === 'string') {
        componentsHTML = page.content;
      } else if (page.content.html) {
        componentsHTML = page.content.html;
      } else if (page.content.sections) {
        // Handle sections-based content
        componentsHTML = page.content.sections.map(section => section.html || section.content).join('\n');
      }
    }

    // If no content found, provide a default message
    if (!componentsHTML || componentsHTML.trim() === '') {
      componentsHTML = `
        <div style="padding: 2rem; text-align: center; background: #f8f9fa; margin: 2rem 0; border-radius: 8px;">
          <h2>Welcome to ${page.title || page.name}</h2>
          <p>This page is ready for content. Use the website builder to add your content.</p>
        </div>
      `;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.seoSettings?.metaTitle || page.title || globalSettings.siteName}</title>
  <meta name="description" content="${page.seoSettings?.metaDescription || page.description || globalSettings.siteDescription}">
  ${page.seoSettings?.keywords?.length ? `<meta name="keywords" content="${page.seoSettings.keywords.join(', ')}">` : ''}

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${website.getPublicUrl()}/${page.slug === 'home' ? '' : page.slug}">
  <meta property="og:title" content="${page.seoSettings?.metaTitle || page.title}">
  <meta property="og:description" content="${page.seoSettings?.metaDescription || page.description}">
  ${page.seoSettings?.ogImage ? `<meta property="og:image" content="${page.seoSettings.ogImage}">` : ''}

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${website.getPublicUrl()}/${page.slug === 'home' ? '' : page.slug}">
  <meta property="twitter:title" content="${page.seoSettings?.metaTitle || page.title}">
  <meta property="twitter:description" content="${page.seoSettings?.metaDescription || page.description}">
  ${page.seoSettings?.ogImage ? `<meta property="twitter:image" content="${page.seoSettings.ogImage}">` : ''}

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="manifest" href="/manifest.json">

  <!-- Styles -->
  <link rel="stylesheet" href="/styles.css">
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Analytics -->
  ${globalSettings.googleAnalytics ? this.generateGoogleAnalytics(globalSettings.googleAnalytics) : ''}
  ${globalSettings.facebookPixel ? this.generateFacebookPixel(globalSettings.facebookPixel) : ''}

  <!-- Custom CSS -->
  ${globalSettings.customCSS ? `<style>${globalSettings.customCSS}</style>` : ''}

  <style>
    :root {
      --primary-color: ${globalSettings.primaryColor || '#2563eb'};
      --secondary-color: ${globalSettings.secondaryColor || '#64748b'};
      --font-family: ${globalSettings.fontFamily || 'Inter, sans-serif'};
    }

    body {
      font-family: var(--font-family);
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }

    * {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <!-- Navigation -->
  ${this.generateNavigation(page, globalSettings, website)}

  <!-- Main Content -->
  <main>
    ${componentsHTML}
  </main>

  <!-- Footer -->
  ${this.generateFooter(globalSettings, website)}

  <!-- Scripts -->
  <script>
    // Basic interactivity
    document.addEventListener('DOMContentLoaded', function() {
      // Mobile menu toggle
      const mobileMenuButton = document.querySelector('[data-mobile-menu-button]');
      const mobileMenu = document.querySelector('[data-mobile-menu]');

      if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
          mobileMenu.classList.toggle('hidden');
        });
      }

      // Smooth scrolling for anchor links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth'
            });
          }
        });
      });
    });
  </script>
</body>
</html>`;

    return html;
  }

  /**
   * Generate HTML for a service page
   * @param {Object} servicePage - Service page data
   * @param {Object} globalSettings - Global website settings
   * @param {Object} website - Website object
   * @returns {string} HTML content
   */
  async generateServicePageHTML(servicePage, globalSettings, website) {
    const content = servicePage.content;
    let componentsHTML = '';

    // Check if service page has custom components (visual editing mode)
    const currentVersionData = servicePage.getCurrentVersionData();
    if (currentVersionData && currentVersionData.components && currentVersionData.components.length > 0) {
      // Use components from visual editor
      componentsHTML = this.generateServicePageComponentsHTML(currentVersionData.components, content);
    } else {
      // Generate HTML from template content structure
      componentsHTML = this.generateServicePageTemplateHTML(content);
    }

    const structuredData = servicePage.generateStructuredData();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${servicePage.seo?.metaTitle || servicePage.title}</title>
  <meta name="description" content="${servicePage.seo?.metaDescription || content.overview?.content?.substring(0, 160) || ''}">
  ${servicePage.seo?.keywords?.length ? `<meta name="keywords" content="${servicePage.seo.keywords.join(', ')}">` : ''}

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${website.getPublicUrl()}/services/${servicePage.slug}">
  <meta property="og:title" content="${servicePage.seo?.metaTitle || servicePage.title}">
  <meta property="og:description" content="${servicePage.seo?.metaDescription || ''}">
  ${servicePage.seo?.ogImage ? `<meta property="og:image" content="${servicePage.seo.ogImage}">` : ''}

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${website.getPublicUrl()}/services/${servicePage.slug}">
  <meta property="twitter:title" content="${servicePage.seo?.metaTitle || servicePage.title}">
  <meta property="twitter:description" content="${servicePage.seo?.metaDescription || ''}">
  ${servicePage.seo?.ogImage ? `<meta property="twitter:image" content="${servicePage.seo.ogImage}">` : ''}

  <!-- Structured Data -->
  <script type="application/ld+json">
    ${JSON.stringify(structuredData, null, 2)}
  </script>

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="manifest" href="/manifest.json">

  <!-- Styles -->
  <link rel="stylesheet" href="/styles.css">
  <script src="https://cdn.tailwindcss.com"></script>

  <!-- Analytics -->
  ${globalSettings.googleAnalytics ? this.generateGoogleAnalytics(globalSettings.googleAnalytics) : ''}
  ${globalSettings.facebookPixel ? this.generateFacebookPixel(globalSettings.facebookPixel) : ''}

  <!-- Custom CSS -->
  ${globalSettings.customCSS ? `<style>${globalSettings.customCSS}</style>` : ''}

  <style>
    :root {
      --primary-color: ${servicePage.design?.colorScheme?.primary || globalSettings.primaryColor || '#2563eb'};
      --secondary-color: ${servicePage.design?.colorScheme?.secondary || globalSettings.secondaryColor || '#64748b'};
      --accent-color: ${servicePage.design?.colorScheme?.accent || '#10b981'};
      --font-family: ${globalSettings.fontFamily || 'Inter, sans-serif'};
    }

    body {
      font-family: var(--font-family);
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }

    * {
      box-sizing: border-box;
    }

    /* Service page specific styles */
    .service-hero {
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      color: white;
      text-align: center;
      padding: 4rem 2rem;
    }

    .service-section {
      padding: 3rem 0;
    }

    .service-benefits {
      background: #f8f9fa;
    }

    .service-procedure {
      background: white;
    }

    .service-faq {
      background: #f8f9fa;
    }

    .service-cta {
      background: var(--primary-color);
      color: white;
      text-align: center;
      padding: 4rem 2rem;
    }
  </style>
</head>
<body>
  <!-- Navigation -->
  ${this.generateServicePageNavigation(servicePage, globalSettings, website)}

  <!-- Service Page Content -->
  <main>
    ${componentsHTML}
  </main>

  <!-- Footer -->
  ${this.generateFooter(globalSettings, website)}

  <script>
    // Enhanced functionality for service pages
    document.addEventListener('DOMContentLoaded', function() {
      // FAQ toggle functionality
      const faqItems = document.querySelectorAll('.faq-item');
      faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (question && answer) {
          question.addEventListener('click', function() {
            const isOpen = answer.style.display === 'block';
            answer.style.display = isOpen ? 'none' : 'block';
            question.classList.toggle('active');
          });
        }
      });

      // Appointment booking tracking
      const ctaButtons = document.querySelectorAll('.cta-button, .book-appointment');
      ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
          // Track conversion
          if (window.gtag) {
            gtag('event', 'appointment_booking_clicked', {
              service_page: '${servicePage.slug}',
              service_name: '${servicePage.title}'
            });
          }
        });
      });

      // Smooth scrolling for anchor links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth'
            });
          }
        });
      });
    });
  </script>
</body>
</html>`;

    return html;
  }

  /**
   * Generate HTML from service page template structure
   * @param {Object} content - Service page content
   * @returns {string} HTML content
   */
  generateServicePageTemplateHTML(content) {
    let html = '';

    // Hero section
    if (content.hero) {
      html += `
        <section class="service-hero">
          <div class="container mx-auto max-w-4xl">
            <h1 class="text-4xl md:text-5xl font-bold mb-4">${content.hero.title || ''}</h1>
            ${content.hero.subtitle ? `<p class="text-xl mb-6">${content.hero.subtitle}</p>` : ''}
            ${content.hero.description ? `<p class="mb-8">${content.hero.description}</p>` : ''}
            <a href="#contact" class="cta-button bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              ${content.hero.ctaText || 'Book Appointment'}
            </a>
          </div>
        </section>
      `;
    }

    // Overview section
    if (content.overview) {
      html += `
        <section class="service-section">
          <div class="container mx-auto max-w-4xl px-4">
            <h2 class="text-3xl font-bold mb-6">${content.overview.title || 'Overview'}</h2>
            ${content.overview.content ? `<p class="text-lg text-gray-600 mb-6">${content.overview.content}</p>` : ''}
            ${content.overview.highlights && content.overview.highlights.length > 0 ? `
              <ul class="list-disc list-inside space-y-2">
                ${content.overview.highlights.map(highlight => `<li class="text-gray-700">${highlight}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        </section>
      `;
    }

    // Benefits section
    if (content.benefits && content.benefits.list && content.benefits.list.length > 0) {
      html += `
        <section class="service-section service-benefits">
          <div class="container mx-auto max-w-6xl px-4">
            <h2 class="text-3xl font-bold text-center mb-6">${content.benefits.title || 'Benefits'}</h2>
            ${content.benefits.introduction ? `<p class="text-lg text-gray-600 text-center mb-12">${content.benefits.introduction}</p>` : ''}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              ${content.benefits.list.map(benefit => `
                <div class="text-center">
                  <div class="text-4xl mb-4">${benefit.icon || '✅'}</div>
                  <h3 class="text-xl font-semibold mb-3">${benefit.title}</h3>
                  <p class="text-gray-600">${benefit.description}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;
    }

    // Procedure section
    if (content.procedure && content.procedure.steps && content.procedure.steps.length > 0) {
      html += `
        <section class="service-section service-procedure">
          <div class="container mx-auto max-w-4xl px-4">
            <h2 class="text-3xl font-bold mb-6">${content.procedure.title || 'The Procedure'}</h2>
            ${content.procedure.introduction ? `<p class="text-lg text-gray-600 mb-8">${content.procedure.introduction}</p>` : ''}
            <div class="space-y-6">
              ${content.procedure.steps.map(step => `
                <div class="flex items-start space-x-6 p-6 bg-gray-50 rounded-lg">
                  <div class="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    ${step.stepNumber}
                  </div>
                  <div>
                    <h3 class="text-xl font-semibold mb-2">${step.title}</h3>
                    <p class="text-gray-600 mb-2">${step.description}</p>
                    ${step.duration ? `<span class="text-sm text-blue-600 font-medium">Duration: ${step.duration}</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
            ${content.procedure.additionalInfo ? `<div class="mt-8 p-6 bg-blue-50 rounded-lg"><p class="text-gray-700">${content.procedure.additionalInfo}</p></div>` : ''}
          </div>
        </section>
      `;
    }

    // FAQ section
    if (content.faq && content.faq.questions && content.faq.questions.length > 0) {
      html += `
        <section class="service-section service-faq">
          <div class="container mx-auto max-w-4xl px-4">
            <h2 class="text-3xl font-bold mb-6">${content.faq.title || 'Frequently Asked Questions'}</h2>
            ${content.faq.introduction ? `<p class="text-lg text-gray-600 mb-8">${content.faq.introduction}</p>` : ''}
            <div class="space-y-4">
              ${content.faq.questions.map(faq => `
                <div class="faq-item border border-gray-200 rounded-lg">
                  <button class="faq-question w-full text-left p-6 font-semibold hover:bg-gray-50 transition">
                    ${faq.question}
                  </button>
                  <div class="faq-answer hidden p-6 pt-0 text-gray-600">
                    ${faq.answer}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      `;
    }

    // CTA section
    if (content.cta) {
      html += `
        <section class="service-cta" id="contact">
          <div class="container mx-auto max-w-4xl">
            <h2 class="text-3xl font-bold mb-4">${content.cta.title || 'Ready to Schedule Your Appointment?'}</h2>
            ${content.cta.subtitle ? `<p class="text-xl mb-8">${content.cta.subtitle}</p>` : ''}
            <div class="space-y-4">
              <a href="tel:${content.cta.phoneNumber || ''}" class="book-appointment bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition mr-4">
                ${content.cta.buttonText || 'Book Now'}
              </a>
              ${content.cta.phoneNumber ? `<p class="text-lg">Call us: <a href="tel:${content.cta.phoneNumber}" class="font-semibold">${content.cta.phoneNumber}</a></p>` : ''}
              ${content.cta.email ? `<p class="text-lg">Email: <a href="mailto:${content.cta.email}" class="font-semibold">${content.cta.email}</a></p>` : ''}
            </div>
          </div>
        </section>
      `;
    }

    return html;
  }

  /**
   * Generate HTML from service page components (visual editing mode)
   * @param {Array} components - Service page components
   * @param {Object} content - Fallback content
   * @returns {string} HTML content
   */
  generateServicePageComponentsHTML(components, content) {
    // This would generate HTML from the visual editor components
    // For now, fall back to template HTML generation
    return this.generateServicePageTemplateHTML(content);
  }

  /**
   * Generate navigation for service pages
   * @param {Object} servicePage - Service page
   * @param {Object} globalSettings - Global settings
   * @param {Object} website - Website object
   * @returns {string} Navigation HTML
   */
  generateServicePageNavigation(servicePage, globalSettings, website) {
    // Generate navigation with back to home link
    return `
    <nav class="nav-primary">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <a href="/" class="text-xl font-bold">${globalSettings.siteName || website.name}</a>
          </div>
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-4">
              <a href="/" class="nav-link">Home</a>
              <a href="/services" class="nav-link">Services</a>
              <a href="/#contact" class="nav-link">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </nav>`;
  }

  /**
   * Generate CSS for the website
   * @param {Object} globalSettings - Global website settings
   * @returns {string} CSS content
   */
  generateCSS(globalSettings) {
    return `/* Generated CSS for website */
:root {
  --primary-color: ${globalSettings.primaryColor || '#2563eb'};
  --secondary-color: ${globalSettings.secondaryColor || '#64748b'};
  --font-family: ${globalSettings.fontFamily || 'Inter, sans-serif'};
}

/* Base styles */
body {
  font-family: var(--font-family);
  margin: 0;
  padding: 0;
  line-height: 1.6;
  color: #333;
}

/* Navigation styles */
.nav-primary {
  background-color: var(--primary-color);
  color: white;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  display: inline-block;
  transition: background-color 0.3s ease;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Button styles */
.btn-primary {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background-color: var(--secondary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: background-color 0.3s ease;
}

.btn-secondary:hover {
  opacity: 0.9;
}

/* Footer styles */
.footer {
  background-color: #f8f9fa;
  padding: 2rem 0;
  margin-top: 4rem;
  border-top: 1px solid #e9ecef;
}

/* Responsive utilities */
@media (max-width: 768px) {
  .mobile-hidden {
    display: none;
  }

  .mobile-menu {
    display: block;
  }
}

@media (min-width: 769px) {
  .desktop-hidden {
    display: none;
  }

  .mobile-menu {
    display: none;
  }
}

/* Custom component styles */
${globalSettings.customCSS || ''}
`;
  }

  /**
   * Generate navigation HTML
   * @param {Object} currentPage - Current page
   * @param {Object} globalSettings - Global settings
   * @param {Object} website - Website object
   * @returns {string} Navigation HTML
   */
  generateNavigation(currentPage, globalSettings, website) {
    // Extract all pages for navigation
    const website_current = website.getCurrentVersion ? website.getCurrentVersion() : website.versions[0];
    const pages = website_current?.pages || [];

    const navItems = pages
      .filter(page => page.isPublished !== false) // Show published pages
      .map(page => {
        const href = page.slug === 'home' ? '/' : `/${page.slug}`;
        const isActive = page.slug === currentPage.slug;
        return `<a href="${href}" class="nav-link ${isActive ? 'active' : ''}">${page.name}</a>`;
      })
      .join('');

    return `
    <nav class="nav-primary">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <a href="/" class="text-xl font-bold">
              ${globalSettings.siteName || website.name}
            </a>
          </div>
          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-4">
              ${navItems}
            </div>
          </div>
          <div class="md:hidden">
            <button data-mobile-menu-button class="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        <div data-mobile-menu class="md:hidden hidden">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            ${navItems}
          </div>
        </div>
      </div>
    </nav>`;
  }

  /**
   * Generate footer HTML
   * @param {Object} globalSettings - Global settings
   * @param {Object} website - Website object
   * @returns {string} Footer HTML
   */
  generateFooter(globalSettings, website) {
    return `
    <footer class="footer">
      <div class="container mx-auto px-4">
        <div class="text-center">
          <p>&copy; ${new Date().getFullYear()} ${globalSettings.siteName || website.name}. All rights reserved.</p>
          <p class="text-sm text-gray-600 mt-2">
            Professional website powered by DocWebsite
          </p>
        </div>
      </div>
    </footer>`;
  }

  /**
   * Generate sitemap.xml
   * @param {Array} pages - Website pages
   * @param {Array} servicePages - Service pages
   * @param {Object} website - Website object
   * @returns {string} Sitemap XML
   */
  generateSitemap(pages, servicePages, website) {
    const baseUrl = website.getPublicUrl();

    // Main website pages
    const pageUrls = pages.map(page => {
      const url = page.slug === 'home' ? baseUrl : `${baseUrl}/${page.slug}`;
      const lastmod = page.lastModified ? new Date(page.lastModified).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.slug === 'home' ? '1.0' : '0.8'}</priority>
  </url>`;
    }).join('\n');

    // Service pages
    const serviceUrls = servicePages.map(servicePage => {
      const url = `${baseUrl}/services/${servicePage.slug}`;
      const lastmod = servicePage.lastModified ? new Date(servicePage.lastModified).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }).join('\n');

    const allUrls = [pageUrls, serviceUrls].filter(Boolean).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls}
</urlset>`;
  }

  /**
   * Generate robots.txt
   * @param {Object} website - Website object
   * @returns {string} Robots.txt content
   */
  generateRobotsTxt(website) {
    const baseUrl = website.getPublicUrl();

    return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
  }

  /**
   * Generate PWA manifest.json
   * @param {Object} globalSettings - Global settings
   * @param {Object} website - Website object
   * @returns {string} Manifest JSON
   */
  generateManifest(globalSettings, website) {
    const manifest = {
      name: globalSettings.siteName || website.name,
      short_name: (globalSettings.siteName || website.name).substring(0, 12),
      description: globalSettings.siteDescription || website.description,
      start_url: "/",
      display: "standalone",
      background_color: globalSettings.primaryColor || "#2563eb",
      theme_color: globalSettings.primaryColor || "#2563eb",
      icons: [
        {
          src: "/favicon.ico",
          sizes: "32x32",
          type: "image/x-icon"
        }
      ]
    };

    return JSON.stringify(manifest, null, 2);
  }

  /**
   * Generate Google Analytics code
   * @param {string} analyticsId - Google Analytics ID
   * @returns {string} Analytics HTML
   */
  generateGoogleAnalytics(analyticsId) {
    return `
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${analyticsId}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${analyticsId}');
    </script>`;
  }

  /**
   * Generate Facebook Pixel code
   * @param {string} pixelId - Facebook Pixel ID
   * @returns {string} Pixel HTML
   */
  generateFacebookPixel(pixelId) {
    return `
    <!-- Facebook Pixel Code -->
    <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    </script>
    <noscript><img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
    /></noscript>`;
  }

  /**
   * Ensure directory exists
   * @param {string} dirPath - Directory path
   */
  async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Clean up generated files for a website
   * @param {string} subdomain - Website subdomain
   */
  async cleanupSite(subdomain) {
    const siteDir = path.join(this.outputDir, subdomain);
    try {
      await fs.rm(siteDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Generate a single service page
   * @param {string} servicePageId - Service page ID
   * @returns {Object} Generation result
   */
  async generateServicePage(servicePageId) {
    try {
      const servicePage = await ServicePage.findById(servicePageId)
        .populate('serviceId')
        .populate('websiteId');

      if (!servicePage) {
        throw new Error('Service page not found');
      }

      const website = servicePage.websiteId;
      const currentVersion = website.getCurrentVersion();

      if (!currentVersion) {
        throw new Error('No website version found');
      }

      // Create services directory
      const siteDir = path.join(this.outputDir, website.subdomain);
      const servicesDir = path.join(siteDir, 'services');
      await this.ensureDir(servicesDir);

      // Generate service page HTML
      const htmlContent = await this.generateServicePageHTML(servicePage, currentVersion.globalSettings, website);
      const fileName = `${servicePage.slug}.html`;
      const filePath = path.join(servicesDir, fileName);

      await fs.writeFile(filePath, htmlContent);

      return {
        servicePageId,
        slug: servicePage.slug,
        title: servicePage.title,
        filePath,
        fileName,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Service page generation error:', error);
      throw error;
    }
  }

  /**
   * Delete a service page file
   * @param {string} websiteSubdomain - Website subdomain
   * @param {string} serviceSlug - Service slug
   */
  async deleteServicePage(websiteSubdomain, serviceSlug) {
    const siteDir = path.join(this.outputDir, websiteSubdomain);
    const servicesDir = path.join(siteDir, 'services');
    const filePath = path.join(servicesDir, `${serviceSlug}.html`);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Service page deletion error:', error);
      // Don't throw error if file doesn't exist
    }
  }
}

module.exports = new StaticSiteGenerator();