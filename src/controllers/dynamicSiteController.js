const DynamicSiteGenerationService = require('../services/dynamicSiteGenerationService');
const Website = require('../models/Website');
const UnifiedContent = require('../models/UnifiedContent');

/**
 * Dynamic Site Controller
 *
 * Handles serving dynamic websites generated from unified content.
 * This replaces static site generation with real-time content rendering.
 */

/**
 * Serve dynamic website homepage
 */
exports.serveHomepage = async (req, res) => {
  try {
    const { subdomain } = req.params;

    // Find website by subdomain
    const website = await Website.findOne({
      'deployment.subdomain': subdomain,
      status: 'published'
    }).populate('doctorId');

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Generate dynamic site data
    const siteData = await DynamicSiteGenerationService.generateDynamicSite(website._id);

    // Find homepage
    const homepage = siteData.pages.find(page => page.id === 'homepage');

    if (!homepage) {
      return res.status(404).json({
        success: false,
        message: 'Homepage not found'
      });
    }

    // Check if client wants JSON data or HTML
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        page: homepage,
        navigation: siteData.navigation,
        globalSettings: siteData.globalSettings
      });
    }

    // Render as HTML
    const html = await DynamicSiteGenerationService.renderPageAsHTML(
      homepage,
      siteData.globalSettings
    );

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('Error serving dynamic homepage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve homepage',
      error: error.message
    });
  }
};

/**
 * Serve dynamic service page
 */
exports.serveServicePage = async (req, res) => {
  try {
    const { subdomain, slug } = req.params;

    // Find website by subdomain
    const website = await Website.findOne({
      'deployment.subdomain': subdomain,
      status: 'published'
    }).populate('doctorId');

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Generate dynamic site data
    const siteData = await DynamicSiteGenerationService.generateDynamicSite(website._id);

    // Find service page by slug
    const servicePage = siteData.pages.find(page => page.slug === slug);

    if (!servicePage) {
      return res.status(404).json({
        success: false,
        message: 'Service page not found'
      });
    }

    // Check if client wants JSON data or HTML
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        page: servicePage,
        navigation: siteData.navigation,
        globalSettings: siteData.globalSettings
      });
    }

    // Render as HTML
    const html = await DynamicSiteGenerationService.renderPageAsHTML(
      servicePage,
      siteData.globalSettings
    );

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('Error serving dynamic service page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve service page',
      error: error.message
    });
  }
};

/**
 * Serve dynamic about page
 */
exports.serveAboutPage = async (req, res) => {
  try {
    const { subdomain } = req.params;

    const website = await Website.findOne({
      'deployment.subdomain': subdomain,
      status: 'published'
    }).populate('doctorId');

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    const siteData = await DynamicSiteGenerationService.generateDynamicSite(website._id);
    const aboutPage = siteData.pages.find(page => page.id === 'about');

    if (!aboutPage) {
      return res.status(404).json({
        success: false,
        message: 'About page not found'
      });
    }

    // Check if client wants JSON data or HTML
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        page: aboutPage,
        navigation: siteData.navigation,
        globalSettings: siteData.globalSettings
      });
    }

    const html = await DynamicSiteGenerationService.renderPageAsHTML(
      aboutPage,
      siteData.globalSettings
    );

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('Error serving dynamic about page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve about page',
      error: error.message
    });
  }
};

/**
 * Serve dynamic contact page
 */
exports.serveContactPage = async (req, res) => {
  try {
    const { subdomain } = req.params;

    const website = await Website.findOne({
      'deployment.subdomain': subdomain,
      status: 'published'
    }).populate('doctorId');

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    const siteData = await DynamicSiteGenerationService.generateDynamicSite(website._id);
    const contactPage = siteData.pages.find(page => page.id === 'contact');

    if (!contactPage) {
      return res.status(404).json({
        success: false,
        message: 'Contact page not found'
      });
    }

    // Check if client wants JSON data or HTML
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        page: contactPage,
        navigation: siteData.navigation,
        globalSettings: siteData.globalSettings
      });
    }

    const html = await DynamicSiteGenerationService.renderPageAsHTML(
      contactPage,
      siteData.globalSettings
    );

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('Error serving dynamic contact page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve contact page',
      error: error.message
    });
  }
};

/**
 * Get site navigation
 */
exports.getSiteNavigation = async (req, res) => {
  try {
    const { subdomain } = req.params;

    const website = await Website.findOne({
      'deployment.subdomain': subdomain,
      status: 'published'
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    const siteData = await DynamicSiteGenerationService.generateDynamicSite(website._id);

    res.json({
      success: true,
      navigation: siteData.navigation,
      globalSettings: siteData.globalSettings
    });

  } catch (error) {
    console.error('Error getting site navigation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get navigation',
      error: error.message
    });
  }
};

/**
 * Get site map
 */
exports.getSitemap = async (req, res) => {
  try {
    const { subdomain } = req.params;

    const website = await Website.findOne({
      'deployment.subdomain': subdomain,
      status: 'published'
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    const siteData = await DynamicSiteGenerationService.generateDynamicSite(website._id);

    // Generate XML sitemap
    const urls = siteData.seo.sitemapUrls;
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    urls.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${url.loc}</loc>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      if (url.lastmod) {
        xml += `    <lastmod>${url.lastmod.toISOString().split('T')[0]}</lastmod>\n`;
      }
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);

  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sitemap',
      error: error.message
    });
  }
};

/**
 * Get robots.txt
 */
exports.getRobotsTxt = async (req, res) => {
  try {
    const { subdomain } = req.params;

    const website = await Website.findOne({
      'deployment.subdomain': subdomain,
      status: 'published'
    });

    if (!website) {
      return res.status(404).text('User-agent: *\nDisallow: /');
    }

    const siteData = await DynamicSiteGenerationService.generateDynamicSite(website._id);
    const robotsPolicy = siteData.seo.robotsPolicy;

    let robotsTxt = 'User-agent: *\n';

    if (robotsPolicy.index && robotsPolicy.follow) {
      robotsTxt += 'Allow: /\n';
    } else {
      robotsTxt += 'Disallow: /\n';
    }

    if (robotsPolicy.sitemapUrl) {
      robotsTxt += `\nSitemap: ${robotsPolicy.sitemapUrl}\n`;
    }

    res.setHeader('Content-Type', 'text/plain');
    res.send(robotsTxt);

  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.status(500).text('User-agent: *\nDisallow: /');
  }
};

/**
 * Handle contact form submissions
 */
exports.handleContactForm = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const formData = req.body;

    const website = await Website.findOne({
      'deployment.subdomain': subdomain,
      status: 'published'
    }).populate('doctorId');

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Validate form data
    const requiredFields = ['name', 'email', 'message'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields
      });
    }

    // Process form submission
    try {
      const formSubmission = {
        websiteId: website._id,
        websiteName: website.name,
        doctorId: website.doctorId,
        formData: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          service: formData.service || '',
          message: formData.message,
          preferredDate: formData.preferredDate || null,
          preferredTime: formData.preferredTime || null
        },
        submittedAt: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        source: 'website_contact_form',
        status: 'new'
      };

      // Save to database (you'll need to create a ContactSubmission model)
      await this.saveContactSubmission(formSubmission);

      // Send email notification to practice
      await this.sendPracticeNotification(website, formSubmission);

      // Send auto-response to user
      await this.sendUserAutoResponse(formData.email, formData.name, website);

      // Log for analytics
      console.log('Contact form submission processed:', {
        website: website.name,
        submissionId: formSubmission._id || 'temp',
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: 'Thank you for your message. We will get back to you soon!',
        submissionId: formSubmission._id || null
      });

    } catch (processingError) {
      console.error('Error processing contact form:', processingError);

      // Still save basic data even if email fails
      try {
        await this.saveContactSubmission({
          websiteId: website._id,
          formData,
          submittedAt: new Date(),
          status: 'processing_failed',
          error: processingError.message
        });
      } catch (saveError) {
        console.error('Failed to save contact submission:', saveError);
      }

      res.json({
        success: true,
        message: 'Thank you for your message. We will get back to you soon!',
        note: 'Your message was received but there may be a delay in processing.'
      });
    }

  } catch (error) {
    console.error('Error handling contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process form submission',
      error: error.message
    });
  }
};

/**
 * Get page preview (for editors)
 */
exports.getPagePreview = async (req, res) => {
  try {
    const { servicePageId } = req.params;
    const { viewMode = 'desktop' } = req.query;

    // Get unified content
    const unifiedContent = await UnifiedContent.findOne({ servicePageId })
      .populate('servicePageId')
      .populate('websiteId');

    if (!unifiedContent) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Generate preview data
    const website = unifiedContent.websiteId;
    const servicePage = unifiedContent.servicePageId;

    const previewData = {
      page: {
        id: servicePage._id.toString(),
        slug: servicePage.slug,
        title: servicePage.title,
        content: unifiedContent.structuredContent,
        components: unifiedContent.components
      },
      globalSettings: {
        site: { name: website.name },
        design: website.design || {},
        integrations: website.settings || {}
      },
      viewMode,
      isPreview: true
    };

    res.json({
      success: true,
      preview: previewData
    });

  } catch (error) {
    console.error('Error generating page preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate preview',
      error: error.message
    });
  }
};

/**
 * Invalidate site cache (for when content is updated)
 */
exports.invalidateCache = async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { cacheType = 'all' } = req.query; // all, pages, navigation, assets

    if (!websiteId) {
      return res.status(400).json({
        success: false,
        message: 'Website ID is required'
      });
    }

    // Find the website to get subdomain
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    const cacheKeys = this.generateCacheKeys(website, cacheType);
    const invalidatedKeys = await this.clearCacheKeys(cacheKeys);

    // Log cache invalidation for monitoring
    console.log('Cache invalidated for website:', {
      websiteId,
      subdomain: website.deployment?.subdomain,
      cacheType,
      keysInvalidated: invalidatedKeys.length,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Cache invalidated successfully',
      details: {
        websiteId,
        cacheType,
        keysInvalidated: invalidatedKeys.length,
        keys: invalidatedKeys
      }
    });

  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invalidate cache',
      error: error.message
    });
  }
};

/**
 * Generate cache keys for a website
 */
exports.generateCacheKeys = (website, cacheType) => {
  const subdomain = website.deployment?.subdomain;
  const baseKeys = [
    `site:${subdomain}:homepage`,
    `site:${subdomain}:about`,
    `site:${subdomain}:contact`,
    `site:${subdomain}:navigation`,
    `site:${subdomain}:sitemap`,
    `site:${subdomain}:robots`
  ];

  if (cacheType === 'all' || cacheType === 'pages') {
    // Add service page cache keys
    // TODO: Get actual service page slugs from database
    baseKeys.push(`site:${subdomain}:services:*`);
  }

  if (cacheType === 'all' || cacheType === 'navigation') {
    baseKeys.push(`site:${subdomain}:navigation`);
  }

  if (cacheType === 'all' || cacheType === 'assets') {
    baseKeys.push(`site:${subdomain}:assets:*`);
  }

  return baseKeys;
};

/**
 * Clear cache keys from cache store
 */
exports.clearCacheKeys = async (cacheKeys) => {
  try {
    const clearedKeys = [];

    // TODO: Integrate with actual cache store (Redis, Memcached, etc.)
    // For now, simulate cache clearing
    for (const key of cacheKeys) {
      // Simulate cache deletion
      console.log('Clearing cache key:', key);
      clearedKeys.push(key);

      // Example Redis integration:
      // if (redisClient) {
      //   if (key.includes('*')) {
      //     const keys = await redisClient.keys(key);
      //     if (keys.length > 0) {
      //       await redisClient.del(keys);
      //       clearedKeys.push(...keys);
      //     }
      //   } else {
      //     await redisClient.del(key);
      //     clearedKeys.push(key);
      //   }
      // }
    }

    return clearedKeys;
  } catch (error) {
    console.error('Error clearing cache keys:', error);
    throw error;
  }
};

/**
 * Helper methods for contact form processing
 */

/**
 * Save contact form submission to database
 */
exports.saveContactSubmission = async (submissionData) => {
  try {
    // Create ContactSubmission model if it doesn't exist
    // For now, log the data - in production, save to database
    console.log('Contact submission data:', JSON.stringify(submissionData, null, 2));

    // TODO: Create ContactSubmission model and implement proper database save
    // const ContactSubmission = require('../models/ContactSubmission');
    // const submission = new ContactSubmission(submissionData);
    // await submission.save();
    // return submission;

    return { _id: 'temp_' + Date.now(), ...submissionData };
  } catch (error) {
    console.error('Error saving contact submission:', error);
    throw error;
  }
};

/**
 * Send email notification to practice
 */
exports.sendPracticeNotification = async (website, submission) => {
  try {
    const emailContent = {
      to: website.settings?.contact?.email || website.doctorId?.email,
      subject: `New Contact Form Submission - ${website.name}`,
      template: 'practice_notification',
      data: {
        websiteName: website.name,
        submissionData: submission.formData,
        submittedAt: submission.submittedAt,
        ipAddress: submission.ipAddress
      }
    };

    console.log('Practice notification email:', JSON.stringify(emailContent, null, 2));

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    // await emailService.send(emailContent);

    return { status: 'sent', emailId: 'temp_' + Date.now() };
  } catch (error) {
    console.error('Error sending practice notification:', error);
    throw error;
  }
};

/**
 * Send auto-response to user
 */
exports.sendUserAutoResponse = async (userEmail, userName, website) => {
  try {
    const emailContent = {
      to: userEmail,
      subject: `Thank you for contacting ${website.name}`,
      template: 'user_auto_response',
      data: {
        userName,
        websiteName: website.name,
        practicePhone: website.settings?.contact?.phone,
        practiceEmail: website.settings?.contact?.email,
        expectedResponseTime: '24-48 hours'
      }
    };

    console.log('User auto-response email:', JSON.stringify(emailContent, null, 2));

    // TODO: Integrate with email service
    // await emailService.send(emailContent);

    return { status: 'sent', emailId: 'temp_' + Date.now() };
  } catch (error) {
    console.error('Error sending user auto-response:', error);
    throw error;
  }
};

module.exports = exports;