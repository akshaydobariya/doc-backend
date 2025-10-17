const fs = require('fs').promises;
const path = require('path');
const Website = require('../models/Website');

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
      const sitemapContent = this.generateSitemap(currentVersion.pages, website);
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
   * @param {Object} website - Website object
   * @returns {string} Sitemap XML
   */
  generateSitemap(pages, website) {
    const baseUrl = website.getPublicUrl();
    const urls = pages.map(page => {
      const url = page.slug === 'home' ? baseUrl : `${baseUrl}/${page.slug}`;
      const lastmod = page.lastModified ? new Date(page.lastModified).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.slug === 'home' ? '1.0' : '0.8'}</priority>
  </url>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
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
}

module.exports = new StaticSiteGenerator();