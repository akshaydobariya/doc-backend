const UnifiedContent = require('../models/UnifiedContent');
const ServicePage = require('../models/ServicePage');
const Website = require('../models/Website');

/**
 * Dynamic Site Generation Service
 *
 * Generates dynamic websites from unified content instead of static HTML.
 * This allows real-time content updates and maintains synchronization
 * between the CMS and live sites.
 */

class DynamicSiteGenerationService {
  /**
   * Generate a complete dynamic website from unified content
   */
  static async generateDynamicSite(websiteId) {
    try {
      const website = await Website.findById(websiteId)
        .populate('doctorId')
        .populate('services');

      if (!website) {
        throw new Error('Website not found');
      }

      // Get all service pages for this website
      const servicePages = await ServicePage.find({
        websiteId,
        status: 'published',
        isActive: true
      }).populate('serviceId');

      // Get unified content for each service page
      const unifiedContents = await Promise.all(
        servicePages.map(async (servicePage) => {
          const unifiedContent = await UnifiedContent.findOne({
            servicePageId: servicePage._id
          });
          return { servicePage, unifiedContent };
        })
      );

      // Generate the dynamic site structure
      const siteData = {
        website,
        pages: await this.generateDynamicPages(unifiedContents, website),
        navigation: this.generateNavigation(servicePages, website),
        globalSettings: this.extractGlobalSettings(website),
        assets: await this.collectAssets(unifiedContents),
        seo: this.generateGlobalSEO(website, servicePages)
      };

      return siteData;
    } catch (error) {
      console.error('Error generating dynamic site:', error);
      throw error;
    }
  }

  /**
   * Generate dynamic pages from unified content
   */
  static async generateDynamicPages(unifiedContents, website) {
    const pages = [];

    // Generate homepage
    pages.push(await this.generateHomepage(website, unifiedContents));

    // Generate service pages
    for (const { servicePage, unifiedContent } of unifiedContents) {
      if (unifiedContent) {
        pages.push(await this.generateServicePage(servicePage, unifiedContent, website));
      }
    }

    // Generate additional pages (about, contact, etc.)
    pages.push(await this.generateAboutPage(website));
    pages.push(await this.generateContactPage(website));

    return pages;
  }

  /**
   * Generate homepage with service overview
   */
  static async generateHomepage(website, unifiedContents) {
    const heroContent = this.extractBestHeroContent(unifiedContents);
    const featuredServices = this.selectFeaturedServices(unifiedContents, 6);

    return {
      id: 'homepage',
      slug: '',
      path: '/',
      title: website.name || 'Dental Practice',
      template: 'homepage',
      content: {
        hero: {
          title: website.settings?.hero?.title || `Welcome to ${website.name}`,
          subtitle: website.settings?.hero?.subtitle || 'Professional Dental Care',
          description: website.settings?.hero?.description || 'Experience exceptional dental care with our expert team',
          ctaText: 'Book Appointment',
          backgroundImage: heroContent?.backgroundImage || this.getDefaultHeroImage(),
          overlayOpacity: 0.4
        },
        services: {
          title: 'Our Services',
          subtitle: 'Comprehensive dental care for your whole family',
          featured: featuredServices
        },
        about: {
          title: `About ${website.name}`,
          content: website.settings?.about?.summary || 'We provide exceptional dental care with a focus on patient comfort and satisfaction.',
          image: website.settings?.about?.image || this.getDefaultAboutImage(),
          highlights: [
            'Experienced dental professionals',
            'State-of-the-art technology',
            'Comfortable environment',
            'Personalized care'
          ]
        },
        contact: {
          title: 'Visit Our Practice',
          address: website.settings?.contact?.address || '',
          phone: website.settings?.contact?.phone || '',
          email: website.settings?.contact?.email || '',
          hours: website.settings?.contact?.hours || []
        },
        cta: {
          title: 'Ready to Schedule Your Appointment?',
          subtitle: 'Contact us today to book your visit',
          buttonText: 'Book Now',
          backgroundColor: website.design?.colorScheme?.primary || '#2563eb'
        }
      },
      seo: {
        metaTitle: `${website.name} - Professional Dental Care`,
        metaDescription: `Experience exceptional dental care at ${website.name}. Our expert team provides comprehensive dental services in a comfortable environment.`,
        keywords: ['dental care', 'dentist', website.name, 'oral health'],
        canonicalUrl: website.deployment?.url || '/'
      },
      lastModified: new Date()
    };
  }

  /**
   * Generate individual service page
   */
  static async generateServicePage(servicePage, unifiedContent, website) {
    const structuredContent = unifiedContent.structuredContent;
    const components = unifiedContent.components;

    return {
      id: servicePage._id.toString(),
      slug: servicePage.slug,
      path: `/services/${servicePage.slug}`,
      title: servicePage.title,
      template: 'service-page',
      content: {
        ...structuredContent,
        // Add dynamic elements
        booking: {
          enabled: true,
          ctaText: structuredContent.cta?.buttonText || 'Book Appointment',
          phone: website.settings?.contact?.phone || '',
          email: website.settings?.contact?.email || ''
        },
        relatedServices: await this.getRelatedServices(servicePage, website),
        breadcrumbs: [
          { text: 'Home', url: '/' },
          { text: 'Services', url: '/services' },
          { text: servicePage.title, url: `/services/${servicePage.slug}` }
        ]
      },
      components: this.transformComponentsForRendering(components, website),
      seo: {
        metaTitle: servicePage.seo?.metaTitle || servicePage.title,
        metaDescription: servicePage.seo?.metaDescription || structuredContent.overview?.content,
        keywords: servicePage.seo?.keywords || [],
        canonicalUrl: `${website.deployment?.url || ''}/services/${servicePage.slug}`,
        structuredData: servicePage.generateStructuredData()
      },
      lastModified: servicePage.lastModified || new Date(),
      analytics: {
        views: servicePage.analytics?.views || 0,
        readingTime: servicePage.readingTimeMinutes || 5
      }
    };
  }

  /**
   * Generate about page
   */
  static async generateAboutPage(website) {
    return {
      id: 'about',
      slug: 'about',
      path: '/about',
      title: `About ${website.name}`,
      template: 'about-page',
      content: {
        hero: {
          title: `About ${website.name}`,
          subtitle: 'Your trusted dental care partner',
          backgroundImage: this.getDefaultAboutImage()
        },
        story: {
          title: 'Our Story',
          content: website.settings?.about?.story || 'We are dedicated to providing exceptional dental care with a focus on patient comfort and satisfaction.',
          image: website.settings?.about?.teamImage || this.getDefaultTeamImage()
        },
        mission: {
          title: 'Our Mission',
          content: website.settings?.about?.mission || 'To provide the highest quality dental care in a comfortable and caring environment.',
          values: website.settings?.about?.values || [
            'Patient-centered care',
            'Clinical excellence',
            'Continuous improvement',
            'Community commitment'
          ]
        },
        team: {
          title: 'Meet Our Team',
          members: website.settings?.team || []
        },
        facility: {
          title: 'Our Facility',
          description: website.settings?.facility?.description || 'Our modern facility features state-of-the-art equipment and a comfortable environment.',
          images: website.settings?.facility?.images || []
        }
      },
      seo: {
        metaTitle: `About ${website.name} - Professional Dental Team`,
        metaDescription: `Learn about ${website.name} and our commitment to providing exceptional dental care. Meet our experienced team and modern facility.`,
        keywords: ['about', website.name, 'dental team', 'dental practice'],
        canonicalUrl: `${website.deployment?.url || ''}/about`
      },
      lastModified: new Date()
    };
  }

  /**
   * Generate contact page
   */
  static async generateContactPage(website) {
    return {
      id: 'contact',
      slug: 'contact',
      path: '/contact',
      title: 'Contact Us',
      template: 'contact-page',
      content: {
        hero: {
          title: 'Contact Us',
          subtitle: 'We\'re here to help with all your dental needs',
          backgroundImage: this.getDefaultContactImage()
        },
        contact: {
          title: 'Get in Touch',
          address: website.settings?.contact?.address || '',
          phone: website.settings?.contact?.phone || '',
          email: website.settings?.contact?.email || '',
          hours: website.settings?.contact?.hours || [],
          emergencyPhone: website.settings?.contact?.emergencyPhone || ''
        },
        form: {
          title: 'Send us a Message',
          fields: [
            { name: 'name', label: 'Full Name', type: 'text', required: true },
            { name: 'email', label: 'Email Address', type: 'email', required: true },
            { name: 'phone', label: 'Phone Number', type: 'tel', required: false },
            { name: 'service', label: 'Service Interest', type: 'select', required: false },
            { name: 'message', label: 'Message', type: 'textarea', required: true }
          ]
        },
        map: {
          enabled: !!website.settings?.contact?.coordinates,
          coordinates: website.settings?.contact?.coordinates || null,
          zoom: 15
        },
        directions: {
          title: 'Directions & Parking',
          content: website.settings?.contact?.directions || '',
          parking: website.settings?.contact?.parking || ''
        }
      },
      seo: {
        metaTitle: `Contact ${website.name} - Schedule Your Appointment`,
        metaDescription: `Contact ${website.name} to schedule your dental appointment. Find our location, hours, and contact information.`,
        keywords: ['contact', website.name, 'appointment', 'dental office'],
        canonicalUrl: `${website.deployment?.url || ''}/contact`
      },
      lastModified: new Date()
    };
  }

  /**
   * Generate navigation structure
   */
  static generateNavigation(servicePages, website) {
    const serviceCategories = this.groupServicesByCategory(servicePages);

    return {
      main: [
        { text: 'Home', url: '/', active: true },
        {
          text: 'Services',
          url: '/services',
          children: serviceCategories.map(category => ({
            text: category.name,
            children: category.services.map(service => ({
              text: service.title,
              url: `/services/${service.slug}`,
              description: service.serviceId?.shortDescription || ''
            }))
          }))
        },
        { text: 'About', url: '/about' },
        { text: 'Contact', url: '/contact' }
      ],
      footer: [
        {
          title: 'Services',
          links: servicePages.slice(0, 6).map(page => ({
            text: page.title,
            url: `/services/${page.slug}`
          }))
        },
        {
          title: 'Practice',
          links: [
            { text: 'About Us', url: '/about' },
            { text: 'Our Team', url: '/about#team' },
            { text: 'Facility', url: '/about#facility' },
            { text: 'Insurance', url: '/insurance' }
          ]
        },
        {
          title: 'Patient Info',
          links: [
            { text: 'New Patients', url: '/new-patients' },
            { text: 'Patient Forms', url: '/forms' },
            { text: 'Financial Options', url: '/financing' },
            { text: 'Emergency Care', url: '/emergency' }
          ]
        },
        {
          title: 'Contact',
          links: [
            { text: 'Schedule Appointment', url: '/contact' },
            { text: 'Contact Info', url: '/contact' },
            { text: 'Directions', url: '/contact#directions' }
          ]
        }
      ],
      cta: {
        text: 'Book Appointment',
        url: '/contact',
        phone: website.settings?.contact?.phone || ''
      }
    };
  }

  /**
   * Extract global settings for the site
   */
  static extractGlobalSettings(website) {
    return {
      site: {
        name: website.name,
        tagline: website.settings?.tagline || '',
        logo: website.settings?.logo || '',
        favicon: website.settings?.favicon || '',
        language: website.settings?.language || 'en',
        timezone: website.settings?.timezone || 'UTC'
      },
      design: {
        colorScheme: website.design?.colorScheme || {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#10b981'
        },
        typography: website.design?.typography || {
          fontFamily: 'Inter, sans-serif',
          headingFont: 'Inter, sans-serif'
        },
        layout: website.design?.layout || {
          containerWidth: '1200px',
          headerHeight: '80px',
          footerStyle: 'standard'
        }
      },
      integrations: {
        analytics: website.settings?.analytics || {},
        booking: website.settings?.booking || {},
        chat: website.settings?.chat || {},
        social: website.settings?.social || {}
      },
      seo: {
        globalTitle: website.seo?.title || website.name,
        globalDescription: website.seo?.description || '',
        globalKeywords: website.seo?.keywords || [],
        ogImage: website.seo?.ogImage || '',
        twitterHandle: website.settings?.social?.twitter || ''
      }
    };
  }

  /**
   * Collect all assets used across the site
   */
  static async collectAssets(unifiedContents) {
    const assets = new Map();

    // Collect assets from each unified content
    for (const { unifiedContent } of unifiedContents) {
      if (unifiedContent && unifiedContent.assets) {
        unifiedContent.assets.forEach(asset => {
          assets.set(asset.id, {
            id: asset.id,
            type: asset.type,
            url: asset.url,
            alt: asset.alt,
            title: asset.title,
            metadata: asset.metadata,
            usedIn: asset.usedInComponents || []
          });
        });
      }
    }

    return Array.from(assets.values());
  }

  /**
   * Generate global SEO configuration
   */
  static generateGlobalSEO(website, servicePages) {
    const services = servicePages.map(page => page.title);

    return {
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Dentist',
        'name': website.name,
        'description': `Professional dental practice offering ${services.join(', ')}`,
        'url': website.deployment?.url || '',
        'telephone': website.settings?.contact?.phone || '',
        'email': website.settings?.contact?.email || '',
        'address': website.settings?.contact?.address ? {
          '@type': 'PostalAddress',
          'streetAddress': website.settings.contact.address
        } : undefined,
        'openingHours': website.settings?.contact?.hours || [],
        'medicalSpecialty': 'Dentistry',
        'hasOfferCatalog': {
          '@type': 'OfferCatalog',
          'name': 'Dental Services',
          'itemListElement': servicePages.map((page, index) => ({
            '@type': 'Offer',
            'position': index + 1,
            'name': page.title,
            'description': page.content?.overview?.content || '',
            'url': `${website.deployment?.url || ''}/services/${page.slug}`
          }))
        }
      },
      sitemapUrls: this.generateSitemapUrls(website, servicePages),
      robotsPolicy: {
        index: true,
        follow: true,
        sitemapUrl: `${website.deployment?.url || ''}/sitemap.xml`
      }
    };
  }

  /**
   * Helper methods
   */

  static extractBestHeroContent(unifiedContents) {
    // Find the best hero content from available service pages
    for (const { unifiedContent } of unifiedContents) {
      if (unifiedContent?.structuredContent?.hero?.backgroundImage) {
        return unifiedContent.structuredContent.hero;
      }
    }
    return null;
  }

  static selectFeaturedServices(unifiedContents, limit = 6) {
    return unifiedContents
      .filter(({ servicePage, unifiedContent }) =>
        servicePage && unifiedContent?.structuredContent
      )
      .slice(0, limit)
      .map(({ servicePage, unifiedContent }) => ({
        id: servicePage._id,
        title: servicePage.title,
        slug: servicePage.slug,
        description: unifiedContent.structuredContent.overview?.content || '',
        image: unifiedContent.structuredContent.hero?.backgroundImage || this.getDefaultServiceImage(),
        category: servicePage.serviceId?.categoryDisplayName || 'General',
        highlights: unifiedContent.structuredContent.overview?.highlights || []
      }));
  }

  static async getRelatedServices(currentService, website, limit = 3) {
    const relatedPages = await ServicePage.find({
      websiteId: website._id,
      _id: { $ne: currentService._id },
      status: 'published',
      isActive: true
    })
    .populate('serviceId')
    .limit(limit);

    return relatedPages.map(page => ({
      id: page._id,
      title: page.title,
      slug: page.slug,
      description: page.content?.overview?.content || '',
      category: page.serviceId?.categoryDisplayName || 'General'
    }));
  }

  static groupServicesByCategory(servicePages) {
    const categories = new Map();

    servicePages.forEach(page => {
      const categoryName = page.serviceId?.categoryDisplayName || 'General';
      if (!categories.has(categoryName)) {
        categories.set(categoryName, { name: categoryName, services: [] });
      }
      categories.get(categoryName).services.push(page);
    });

    return Array.from(categories.values());
  }

  static transformComponentsForRendering(components, website) {
    return components.map(component => ({
      ...component,
      // Inject global settings into component props
      props: {
        ...component.props,
        globalSettings: {
          colorScheme: website.design?.colorScheme,
          contactInfo: website.settings?.contact,
          bookingUrl: website.settings?.booking?.url
        }
      }
    }));
  }

  static generateSitemapUrls(website, servicePages) {
    const baseUrl = website.deployment?.url || '';
    const urls = [
      { loc: baseUrl, changefreq: 'weekly', priority: 1.0 },
      { loc: `${baseUrl}/about`, changefreq: 'monthly', priority: 0.8 },
      { loc: `${baseUrl}/contact`, changefreq: 'monthly', priority: 0.8 },
      { loc: `${baseUrl}/services`, changefreq: 'weekly', priority: 0.9 }
    ];

    servicePages.forEach(page => {
      urls.push({
        loc: `${baseUrl}/services/${page.slug}`,
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: page.lastModified || new Date()
      });
    });

    return urls;
  }

  // Default image helpers
  static getDefaultHeroImage() {
    return 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1920&h=1080&fit=crop&crop=center';
  }

  static getDefaultAboutImage() {
    return 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=center';
  }

  static getDefaultTeamImage() {
    return 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&h=600&fit=crop&crop=center';
  }

  static getDefaultContactImage() {
    return 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&h=600&fit=crop&crop=center';
  }

  static getDefaultServiceImage() {
    return 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&h=300&fit=crop&crop=center';
  }

  /**
   * Render dynamic page as HTML with proper template engine
   */
  static async renderPageAsHTML(pageData, globalSettings, navigationData = null) {
    try {
      // Escape content for security
      const escapeHtml = this.escapeHtml;
      const safePageData = this.sanitizePageData(pageData);
      const safeGlobalSettings = this.sanitizeGlobalSettings(globalSettings);

      // Build complete HTML document
      const htmlDocument = this.buildHTMLDocument({
        pageData: safePageData,
        globalSettings: safeGlobalSettings,
        navigationData,
        escapeHtml
      });

      return htmlDocument;
    } catch (error) {
      console.error('Error rendering page as HTML:', error);
      return this.renderErrorPage(error, globalSettings);
    }
  }

  /**
   * Build complete HTML document with proper structure
   */
  static buildHTMLDocument({ pageData, globalSettings, navigationData, escapeHtml }) {
    const head = this.renderHTMLHead(pageData, globalSettings, escapeHtml);
    const header = this.renderHeader(globalSettings, navigationData, escapeHtml);
    const main = this.renderMainContent(pageData, globalSettings, escapeHtml);
    const footer = this.renderFooter(globalSettings, navigationData, escapeHtml);
    const scripts = this.renderScripts(pageData, globalSettings);

    return `<!DOCTYPE html>
<html lang="${escapeHtml(globalSettings.site.language || 'en')}" class="h-full">
<head>
${head}
</head>
<body class="h-full flex flex-col bg-gray-50">
${header}
${main}
${footer}
${scripts}
</body>
</html>`;
  }

  /**
   * Render HTML head section with SEO and metadata
   */
  static renderHTMLHead(pageData, globalSettings, escapeHtml) {
    const seo = pageData.seo || {};
    const site = globalSettings.site || {};
    const design = globalSettings.design || {};

    return `    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="index, follow">

    <!-- Primary Meta Tags -->
    <title>${escapeHtml(seo.metaTitle || pageData.title || site.name)}</title>
    <meta name="title" content="${escapeHtml(seo.metaTitle || pageData.title)}">
    <meta name="description" content="${escapeHtml(seo.metaDescription || '')}">
    <meta name="keywords" content="${escapeHtml((seo.keywords || []).join(', '))}">
    ${seo.canonicalUrl ? `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}">` : ''}

    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${escapeHtml(seo.canonicalUrl || '')}">
    <meta property="og:title" content="${escapeHtml(seo.metaTitle || pageData.title)}">
    <meta property="og:description" content="${escapeHtml(seo.metaDescription || '')}">
    <meta property="og:image" content="${escapeHtml(globalSettings.seo?.ogImage || '')}">
    <meta property="og:site_name" content="${escapeHtml(site.name || '')}">

    <!-- Twitter Meta Tags -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${escapeHtml(seo.canonicalUrl || '')}">
    <meta property="twitter:title" content="${escapeHtml(seo.metaTitle || pageData.title)}">
    <meta property="twitter:description" content="${escapeHtml(seo.metaDescription || '')}">
    <meta property="twitter:image" content="${escapeHtml(globalSettings.seo?.ogImage || '')}">
    ${globalSettings.seo?.twitterHandle ? `<meta name="twitter:site" content="@${escapeHtml(globalSettings.seo.twitterHandle)}">` : ''}

    <!-- Favicon -->
    ${site.favicon ? `<link rel="icon" type="image/x-icon" href="${escapeHtml(site.favicon)}">` : ''}

    <!-- Preconnect for performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <!-- Styles -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <style>
        :root {
            --primary-color: ${escapeHtml(design.colorScheme?.primary || '#2563eb')};
            --secondary-color: ${escapeHtml(design.colorScheme?.secondary || '#64748b')};
            --accent-color: ${escapeHtml(design.colorScheme?.accent || '#10b981')};
            --container-width: ${escapeHtml(design.layout?.containerWidth || '1200px')};
            --header-height: ${escapeHtml(design.layout?.headerHeight || '80px')};
        }

        body {
            font-family: ${escapeHtml(design.typography?.fontFamily || 'Inter, sans-serif')};
        }

        .primary-bg { background-color: var(--primary-color); }
        .primary-text { color: var(--primary-color); }
        .secondary-bg { background-color: var(--secondary-color); }
        .secondary-text { color: var(--secondary-color); }
        .accent-bg { background-color: var(--accent-color); }
        .accent-text { color: var(--accent-color); }

        .btn-primary {
            background-color: var(--primary-color);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 500;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
        }

        .btn-primary:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        .container-custom {
            max-width: var(--container-width);
            margin: 0 auto;
            padding: 0 1rem;
        }

        @media (min-width: 768px) {
            .container-custom {
                padding: 0 2rem;
            }
        }
    </style>`;
  }

  /**
   * Render header with navigation
   */
  static renderHeader(globalSettings, navigationData, escapeHtml) {
    const site = globalSettings.site || {};
    const contact = globalSettings.integrations?.booking || globalSettings.site?.contact || {};

    return `    <header class="bg-white shadow-sm sticky top-0 z-50" style="height: var(--header-height);">
        <div class="container-custom">
            <div class="flex justify-between items-center h-full">
                <!-- Logo/Brand -->
                <div class="flex items-center">
                    ${site.logo ?
                        `<img src="${escapeHtml(site.logo)}" alt="${escapeHtml(site.name)}" class="h-10 w-auto mr-3">` :
                        ''
                    }
                    <h1 class="text-xl font-bold primary-text">
                        ${escapeHtml(site.name || 'Dental Practice')}
                    </h1>
                </div>

                <!-- Navigation -->
                <nav class="hidden md:flex items-center space-x-8">
                    ${this.renderNavigation(navigationData, escapeHtml)}
                </nav>

                <!-- CTA Button -->
                <div class="flex items-center space-x-4">
                    ${contact.phone ?
                        `<a href="tel:${escapeHtml(contact.phone)}" class="text-sm font-medium primary-text hidden sm:block">
                            ${escapeHtml(contact.phone)}
                        </a>` :
                        ''
                    }
                    <a href="/contact" class="btn-primary">
                        Book Appointment
                    </a>
                </div>

                <!-- Mobile menu button -->
                <button class="md:hidden p-2" onclick="toggleMobileMenu()">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Mobile Navigation -->
        <div id="mobile-menu" class="hidden md:hidden bg-white border-t">
            <div class="container-custom py-4">
                ${this.renderMobileNavigation(navigationData, escapeHtml)}
            </div>
        </div>
    </header>`;
  }

  /**
   * Render main content based on page template
   */
  static renderMainContent(pageData, globalSettings, escapeHtml) {
    const template = pageData.template || 'default';

    switch (template) {
      case 'homepage':
        return this.renderHomepageContent(pageData, globalSettings, escapeHtml);
      case 'service-page':
        return this.renderServicePageContent(pageData, globalSettings, escapeHtml);
      case 'about-page':
        return this.renderAboutPageContent(pageData, globalSettings, escapeHtml);
      case 'contact-page':
        return this.renderContactPageContent(pageData, globalSettings, escapeHtml);
      default:
        return this.renderDefaultPageContent(pageData, globalSettings, escapeHtml);
    }
  }

  /**
   * Render homepage content
   */
  static renderHomepageContent(pageData, globalSettings, escapeHtml) {
    const content = pageData.content || {};
    const hero = content.hero || {};
    const services = content.services || {};
    const about = content.about || {};

    return `    <main class="flex-1">
        <!-- Hero Section -->
        <section class="relative h-96 md:h-[500px] flex items-center justify-center text-white"
                 style="background-image: linear-gradient(rgba(0,0,0,${hero.overlayOpacity || 0.4}), rgba(0,0,0,${hero.overlayOpacity || 0.4})), url('${escapeHtml(hero.backgroundImage || '')}');
                        background-size: cover; background-position: center;">
            <div class="container-custom text-center">
                <h1 class="text-4xl md:text-6xl font-bold mb-4">
                    ${escapeHtml(hero.title || 'Welcome to Our Practice')}
                </h1>
                <p class="text-xl md:text-2xl mb-6 opacity-90">
                    ${escapeHtml(hero.subtitle || 'Professional Dental Care')}
                </p>
                <p class="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
                    ${escapeHtml(hero.description || '')}
                </p>
                <a href="/contact" class="btn-primary text-lg px-8 py-3">
                    ${escapeHtml(hero.ctaText || 'Book Appointment')}
                </a>
            </div>
        </section>

        <!-- Services Section -->
        ${services.featured && services.featured.length > 0 ? `
        <section class="py-16 bg-white">
            <div class="container-custom">
                <div class="text-center mb-12">
                    <h2 class="text-3xl md:text-4xl font-bold mb-4">
                        ${escapeHtml(services.title || 'Our Services')}
                    </h2>
                    <p class="text-lg text-gray-600 max-w-2xl mx-auto">
                        ${escapeHtml(services.subtitle || '')}
                    </p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    ${services.featured.map(service => `
                        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                            <img src="${escapeHtml(service.image || '')}"
                                 alt="${escapeHtml(service.title)}"
                                 class="w-full h-48 object-cover">
                            <div class="p-6">
                                <div class="text-sm font-medium primary-text mb-2">
                                    ${escapeHtml(service.category || '')}
                                </div>
                                <h3 class="text-xl font-semibold mb-3">
                                    ${escapeHtml(service.title)}
                                </h3>
                                <p class="text-gray-600 mb-4">
                                    ${escapeHtml(service.description || '')}
                                </p>
                                <a href="/services/${escapeHtml(service.slug)}"
                                   class="primary-text font-medium hover:underline">
                                    Learn More →
                                </a>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
        ` : ''}

        <!-- About Section -->
        <section class="py-16 bg-gray-50">
            <div class="container-custom">
                <div class="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 class="text-3xl md:text-4xl font-bold mb-6">
                            ${escapeHtml(about.title || 'About Our Practice')}
                        </h2>
                        <p class="text-lg text-gray-600 mb-6">
                            ${escapeHtml(about.content || '')}
                        </p>
                        ${about.highlights && about.highlights.length > 0 ? `
                        <ul class="space-y-3">
                            ${about.highlights.map(highlight => `
                                <li class="flex items-center">
                                    <svg class="w-5 h-5 accent-text mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                    </svg>
                                    ${escapeHtml(highlight)}
                                </li>
                            `).join('')}
                        </ul>
                        ` : ''}
                    </div>
                    <div>
                        ${about.image ? `
                        <img src="${escapeHtml(about.image)}"
                             alt="About ${escapeHtml(globalSettings.site?.name || '')}"
                             class="w-full h-64 md:h-80 object-cover rounded-lg shadow-md">
                        ` : ''}
                    </div>
                </div>
            </div>
        </section>
    </main>`;
  }

  /**
   * Render service page content
   */
  static renderServicePageContent(pageData, globalSettings, escapeHtml) {
    const content = pageData.content || {};
    const components = pageData.components || [];

    return `    <main class="flex-1">
        <!-- Breadcrumbs -->
        ${content.breadcrumbs ? `
        <nav class="bg-gray-50 py-4">
            <div class="container-custom">
                <ol class="flex items-center space-x-2 text-sm">
                    ${content.breadcrumbs.map((crumb, index) => `
                        <li class="flex items-center">
                            ${index > 0 ? '<span class="text-gray-400 mr-2">/</span>' : ''}
                            ${index === content.breadcrumbs.length - 1 ?
                                `<span class="text-gray-500">${escapeHtml(crumb.text)}</span>` :
                                `<a href="${escapeHtml(crumb.url)}" class="primary-text hover:underline">${escapeHtml(crumb.text)}</a>`
                            }
                        </li>
                    `).join('')}
                </ol>
            </div>
        </nav>
        ` : ''}

        <!-- Service Content -->
        <section class="py-12">
            <div class="container-custom">
                <div class="max-w-4xl mx-auto">
                    <!-- Hero/Header -->
                    ${content.hero ? `
                    <div class="text-center mb-12">
                        <h1 class="text-4xl md:text-5xl font-bold mb-6">
                            ${escapeHtml(content.hero.title || pageData.title)}
                        </h1>
                        ${content.hero.subtitle ? `
                        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                            ${escapeHtml(content.hero.subtitle)}
                        </p>
                        ` : ''}
                    </div>
                    ` : `
                    <div class="text-center mb-12">
                        <h1 class="text-4xl md:text-5xl font-bold mb-6">
                            ${escapeHtml(pageData.title)}
                        </h1>
                    </div>
                    `}

                    <!-- Dynamic Components -->
                    ${this.renderComponents(components, escapeHtml)}

                    <!-- Booking CTA -->
                    ${content.booking?.enabled ? `
                    <div class="bg-primary-bg text-white p-8 rounded-lg text-center mt-12">
                        <h3 class="text-2xl font-bold mb-4">Ready to Schedule?</h3>
                        <p class="text-lg mb-6 opacity-90">Contact us today to book your appointment</p>
                        <div class="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="/contact" class="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                                ${escapeHtml(content.booking.ctaText || 'Book Appointment')}
                            </a>
                            ${content.booking.phone ? `
                            <a href="tel:${escapeHtml(content.booking.phone)}" class="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-gray-900 transition-colors">
                                Call ${escapeHtml(content.booking.phone)}
                            </a>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </section>

        <!-- Related Services -->
        ${content.relatedServices && content.relatedServices.length > 0 ? `
        <section class="py-16 bg-gray-50">
            <div class="container-custom">
                <h2 class="text-3xl font-bold text-center mb-12">Related Services</h2>
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    ${content.relatedServices.map(service => `
                        <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <div class="text-sm font-medium primary-text mb-2">
                                ${escapeHtml(service.category || '')}
                            </div>
                            <h3 class="text-xl font-semibold mb-3">
                                ${escapeHtml(service.title)}
                            </h3>
                            <p class="text-gray-600 mb-4">
                                ${escapeHtml(service.description || '')}
                            </p>
                            <a href="/services/${escapeHtml(service.slug)}" class="primary-text font-medium hover:underline">
                                Learn More →
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
        ` : ''}
    </main>`;
  }

  /**
   * Render contact page content
   */
  static renderContactPageContent(pageData, globalSettings, escapeHtml) {
    const content = pageData.content || {};

    return `    <main class="flex-1">
        <section class="py-12">
            <div class="container-custom">
                <div class="text-center mb-12">
                    <h1 class="text-4xl md:text-5xl font-bold mb-6">
                        ${escapeHtml(content.hero?.title || 'Contact Us')}
                    </h1>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto">
                        ${escapeHtml(content.hero?.subtitle || 'Get in touch with our team')}
                    </p>
                </div>

                <div class="grid lg:grid-cols-2 gap-12">
                    <!-- Contact Information -->
                    <div>
                        <h2 class="text-2xl font-bold mb-6">Contact Information</h2>

                        ${content.contact ? `
                        <div class="space-y-6">
                            ${content.contact.address ? `
                            <div class="flex items-start">
                                <svg class="w-6 h-6 primary-text mt-1 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <div>
                                    <h3 class="font-semibold mb-1">Address</h3>
                                    <p class="text-gray-600">${escapeHtml(content.contact.address)}</p>
                                </div>
                            </div>
                            ` : ''}

                            ${content.contact.phone ? `
                            <div class="flex items-start">
                                <svg class="w-6 h-6 primary-text mt-1 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                </svg>
                                <div>
                                    <h3 class="font-semibold mb-1">Phone</h3>
                                    <a href="tel:${escapeHtml(content.contact.phone)}" class="text-gray-600 hover:primary-text">
                                        ${escapeHtml(content.contact.phone)}
                                    </a>
                                </div>
                            </div>
                            ` : ''}

                            ${content.contact.email ? `
                            <div class="flex items-start">
                                <svg class="w-6 h-6 primary-text mt-1 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                                <div>
                                    <h3 class="font-semibold mb-1">Email</h3>
                                    <a href="mailto:${escapeHtml(content.contact.email)}" class="text-gray-600 hover:primary-text">
                                        ${escapeHtml(content.contact.email)}
                                    </a>
                                </div>
                            </div>
                            ` : ''}

                            ${content.contact.hours && content.contact.hours.length > 0 ? `
                            <div class="flex items-start">
                                <svg class="w-6 h-6 primary-text mt-1 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <div>
                                    <h3 class="font-semibold mb-1">Hours</h3>
                                    <div class="text-gray-600">
                                        ${content.contact.hours.map(hour => `
                                            <div>${escapeHtml(hour)}</div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                        ` : ''}
                    </div>

                    <!-- Contact Form -->
                    <div>
                        <h2 class="text-2xl font-bold mb-6">Send us a Message</h2>
                        <form action="/contact" method="POST" class="space-y-6">
                            ${content.form?.fields ? content.form.fields.map(field => {
                                switch (field.type) {
                                    case 'textarea':
                                        return `
                                        <div>
                                            <label for="${escapeHtml(field.name)}" class="block text-sm font-medium text-gray-700 mb-2">
                                                ${escapeHtml(field.label)}${field.required ? ' *' : ''}
                                            </label>
                                            <textarea
                                                id="${escapeHtml(field.name)}"
                                                name="${escapeHtml(field.name)}"
                                                rows="4"
                                                ${field.required ? 'required' : ''}
                                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            ></textarea>
                                        </div>`;
                                    case 'select':
                                        return `
                                        <div>
                                            <label for="${escapeHtml(field.name)}" class="block text-sm font-medium text-gray-700 mb-2">
                                                ${escapeHtml(field.label)}${field.required ? ' *' : ''}
                                            </label>
                                            <select
                                                id="${escapeHtml(field.name)}"
                                                name="${escapeHtml(field.name)}"
                                                ${field.required ? 'required' : ''}
                                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select a service</option>
                                                <option value="general">General Dentistry</option>
                                                <option value="cleaning">Cleaning</option>
                                                <option value="cosmetic">Cosmetic Dentistry</option>
                                                <option value="orthodontics">Orthodontics</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>`;
                                    default:
                                        return `
                                        <div>
                                            <label for="${escapeHtml(field.name)}" class="block text-sm font-medium text-gray-700 mb-2">
                                                ${escapeHtml(field.label)}${field.required ? ' *' : ''}
                                            </label>
                                            <input
                                                type="${escapeHtml(field.type)}"
                                                id="${escapeHtml(field.name)}"
                                                name="${escapeHtml(field.name)}"
                                                ${field.required ? 'required' : ''}
                                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                        </div>`;
                                }
                            }).join('') : ''}

                            <button type="submit" class="w-full btn-primary text-center">
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    </main>`;
  }

  /**
   * Render footer
   */
  static renderFooter(globalSettings, navigationData, escapeHtml) {
    const site = globalSettings.site || {};
    const social = globalSettings.integrations?.social || {};

    return `    <footer class="bg-gray-800 text-white py-12">
        <div class="container-custom">
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                <!-- Practice Info -->
                <div>
                    <h3 class="text-lg font-semibold mb-4">${escapeHtml(site.name || 'Dental Practice')}</h3>
                    ${site.tagline ? `<p class="text-gray-300 mb-4">${escapeHtml(site.tagline)}</p>` : ''}
                    ${social.facebook || social.twitter || social.instagram ? `
                    <div class="flex space-x-4">
                        ${social.facebook ? `<a href="${escapeHtml(social.facebook)}" class="text-gray-300 hover:text-white">Facebook</a>` : ''}
                        ${social.twitter ? `<a href="${escapeHtml(social.twitter)}" class="text-gray-300 hover:text-white">Twitter</a>` : ''}
                        ${social.instagram ? `<a href="${escapeHtml(social.instagram)}" class="text-gray-300 hover:text-white">Instagram</a>` : ''}
                    </div>
                    ` : ''}
                </div>

                <!-- Quick Links -->
                ${navigationData?.footer ? navigationData.footer.slice(0, 3).map(section => `
                <div>
                    <h3 class="text-lg font-semibold mb-4">${escapeHtml(section.title)}</h3>
                    <ul class="space-y-2">
                        ${section.links.map(link => `
                            <li><a href="${escapeHtml(link.url)}" class="text-gray-300 hover:text-white">${escapeHtml(link.text)}</a></li>
                        `).join('')}
                    </ul>
                </div>
                `).join('') : ''}
            </div>

            <div class="border-t border-gray-700 pt-8 text-center text-gray-300">
                <p>&copy; ${new Date().getFullYear()} ${escapeHtml(site.name || 'Dental Practice')}. All rights reserved.</p>
            </div>
        </div>
    </footer>`;
  }

  /**
   * Render scripts section
   */
  static renderScripts(pageData, globalSettings) {
    const analytics = globalSettings.integrations?.analytics || {};

    return `    <!-- Page Data -->
    <script>
        window.pageData = ${JSON.stringify(pageData)};
        window.globalSettings = ${JSON.stringify(globalSettings)};

        // Mobile menu toggle
        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            menu.classList.toggle('hidden');
        }

        // Form submission handling
        document.addEventListener('DOMContentLoaded', function() {
            const forms = document.querySelectorAll('form[action="/contact"]');
            forms.forEach(form => {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();

                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData);

                    fetch(window.location.origin + '/api/dynamic/site/' + window.location.pathname.split('/')[2] + '/contact', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            alert('Thank you! Your message has been sent.');
                            form.reset();
                        } else {
                            alert('Sorry, there was an error sending your message. Please try again.');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Sorry, there was an error sending your message. Please try again.');
                    });
                });
            });
        });
    </script>

    <!-- Analytics -->
    ${this.renderAnalyticsScript(analytics)}`;
  }

  /**
   * Helper rendering methods
   */
  static renderNavigation(navigationData, escapeHtml) {
    if (!navigationData?.main) return '';

    return navigationData.main.map(item => {
      if (item.children) {
        return `
        <div class="relative group">
            <a href="${escapeHtml(item.url)}" class="text-gray-700 hover:primary-text font-medium">
                ${escapeHtml(item.text)}
            </a>
            <div class="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                ${item.children.map(child => `
                    <a href="${escapeHtml(child.url)}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        ${escapeHtml(child.text)}
                    </a>
                `).join('')}
            </div>
        </div>`;
      } else {
        return `<a href="${escapeHtml(item.url)}" class="text-gray-700 hover:primary-text font-medium">${escapeHtml(item.text)}</a>`;
      }
    }).join('');
  }

  static renderMobileNavigation(navigationData, escapeHtml) {
    if (!navigationData?.main) return '';

    return `
    <div class="space-y-4">
        ${navigationData.main.map(item => `
            <div>
                <a href="${escapeHtml(item.url)}" class="block text-gray-700 font-medium py-2">
                    ${escapeHtml(item.text)}
                </a>
                ${item.children ? `
                <div class="ml-4 mt-2 space-y-2">
                    ${item.children.map(child => `
                        <a href="${escapeHtml(child.url)}" class="block text-sm text-gray-600 py-1">
                            ${escapeHtml(child.text)}
                        </a>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `).join('')}
    </div>`;
  }

  static renderComponents(components, escapeHtml) {
    if (!components || components.length === 0) return '';

    return components.map(component => {
      const props = component.props || {};

      switch (component.type) {
        case 'hero':
          return this.renderHeroComponent(props, escapeHtml);
        case 'text':
        case 'content':
          return this.renderTextComponent(props, escapeHtml);
        case 'image':
          return this.renderImageComponent(props, escapeHtml);
        case 'list':
          return this.renderListComponent(props, escapeHtml);
        case 'cta':
          return this.renderCTAComponent(props, escapeHtml);
        default:
          return this.renderGenericComponent(component, escapeHtml);
      }
    }).join('');
  }

  static renderHeroComponent(props, escapeHtml) {
    return `
    <div class="relative mb-12 rounded-lg overflow-hidden">
        ${props.backgroundImage ? `
        <div class="h-64 bg-cover bg-center" style="background-image: url('${escapeHtml(props.backgroundImage)}')"></div>
        ` : ''}
        <div class="p-8 text-center">
            ${props.title ? `<h2 class="text-3xl font-bold mb-4">${escapeHtml(props.title)}</h2>` : ''}
            ${props.subtitle ? `<p class="text-lg text-gray-600">${escapeHtml(props.subtitle)}</p>` : ''}
        </div>
    </div>`;
  }

  static renderTextComponent(props, escapeHtml) {
    return `
    <div class="mb-8">
        ${props.heading ? `<h2 class="text-2xl font-bold mb-4">${escapeHtml(props.heading)}</h2>` : ''}
        ${props.content ? `<div class="prose max-w-none">${escapeHtml(props.content)}</div>` : ''}
    </div>`;
  }

  static renderImageComponent(props, escapeHtml) {
    return `
    <div class="mb-8">
        <img src="${escapeHtml(props.src || '')}"
             alt="${escapeHtml(props.alt || '')}"
             class="w-full h-auto rounded-lg shadow-md">
        ${props.caption ? `<p class="text-sm text-gray-600 mt-2 text-center">${escapeHtml(props.caption)}</p>` : ''}
    </div>`;
  }

  static renderListComponent(props, escapeHtml) {
    const items = props.items || [];
    return `
    <div class="mb-8">
        ${props.title ? `<h3 class="text-xl font-semibold mb-4">${escapeHtml(props.title)}</h3>` : ''}
        <ul class="space-y-2">
            ${items.map(item => `
                <li class="flex items-start">
                    <span class="w-2 h-2 primary-bg rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>${escapeHtml(item)}</span>
                </li>
            `).join('')}
        </ul>
    </div>`;
  }

  static renderCTAComponent(props, escapeHtml) {
    return `
    <div class="mb-8 p-6 primary-bg text-white rounded-lg text-center">
        ${props.title ? `<h3 class="text-xl font-bold mb-4">${escapeHtml(props.title)}</h3>` : ''}
        ${props.description ? `<p class="mb-6 opacity-90">${escapeHtml(props.description)}</p>` : ''}
        ${props.buttonText && props.buttonUrl ? `
        <a href="${escapeHtml(props.buttonUrl)}" class="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            ${escapeHtml(props.buttonText)}
        </a>
        ` : ''}
    </div>`;
  }

  static renderGenericComponent(component, escapeHtml) {
    return `
    <div class="mb-8 p-4 border border-gray-200 rounded-lg">
        <div class="text-sm text-gray-500 mb-2">Component: ${escapeHtml(component.type)}</div>
        <pre class="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto">${escapeHtml(JSON.stringify(component.props, null, 2))}</pre>
    </div>`;
  }

  static renderDefaultPageContent(pageData, globalSettings, escapeHtml) {
    return `    <main class="flex-1">
        <section class="py-12">
            <div class="container-custom">
                <div class="max-w-4xl mx-auto">
                    <h1 class="text-4xl font-bold mb-8">${escapeHtml(pageData.title)}</h1>
                    <div class="prose max-w-none">
                        <p>This page is under construction.</p>
                    </div>
                </div>
            </div>
        </section>
    </main>`;
  }

  static renderAboutPageContent(pageData, globalSettings, escapeHtml) {
    const content = pageData.content || {};

    return `    <main class="flex-1">
        <section class="py-12">
            <div class="container-custom">
                <div class="text-center mb-12">
                    <h1 class="text-4xl md:text-5xl font-bold mb-6">${escapeHtml(pageData.title)}</h1>
                </div>

                ${content.story ? `
                <div class="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div>
                        <h2 class="text-3xl font-bold mb-6">${escapeHtml(content.story.title)}</h2>
                        <p class="text-lg text-gray-600">${escapeHtml(content.story.content)}</p>
                    </div>
                    ${content.story.image ? `
                    <div>
                        <img src="${escapeHtml(content.story.image)}" alt="Our Story" class="w-full h-80 object-cover rounded-lg shadow-md">
                    </div>
                    ` : ''}
                </div>
                ` : ''}

                ${content.mission ? `
                <div class="text-center mb-16">
                    <h2 class="text-3xl font-bold mb-6">${escapeHtml(content.mission.title)}</h2>
                    <p class="text-lg text-gray-600 max-w-3xl mx-auto mb-8">${escapeHtml(content.mission.content)}</p>

                    ${content.mission.values && content.mission.values.length > 0 ? `
                    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        ${content.mission.values.map(value => `
                            <div class="bg-white p-6 rounded-lg shadow-md">
                                <h3 class="font-semibold text-center">${escapeHtml(value)}</h3>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
                ` : ''}
            </div>
        </section>
    </main>`;
  }

  static renderErrorPage(error, globalSettings) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - ${globalSettings?.site?.name || 'Website'}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 flex items-center justify-center min-h-screen">
    <div class="max-w-md mx-auto text-center">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
        <p class="text-gray-600 mb-6">We're sorry, but there was an error loading this page.</p>
        <a href="/" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Go Home
        </a>
    </div>
</body>
</html>`;
  }

  /**
   * Security and utility methods
   */
  static escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = { innerHTML: '' };
    div.textContent = text;
    return div.innerHTML || text.replace(/[&<>"']/g, function(match) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[match];
    });
  }

  static sanitizePageData(pageData) {
    // Deep clone and sanitize page data
    return JSON.parse(JSON.stringify(pageData));
  }

  static sanitizeGlobalSettings(globalSettings) {
    // Deep clone and sanitize global settings
    return JSON.parse(JSON.stringify(globalSettings));
  }

  static renderAnalyticsScript(analyticsSettings) {
    if (!analyticsSettings || !analyticsSettings.googleAnalytics) {
      return '';
    }

    const gaId = this.escapeHtml(analyticsSettings.googleAnalytics);
    return `
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
    </script>`;
  }
}

module.exports = DynamicSiteGenerationService;