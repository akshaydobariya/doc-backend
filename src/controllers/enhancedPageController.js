const Page = require('../models/Page');
const UnifiedContent = require('../models/UnifiedContent');
const ContentTransformationService = require('../services/contentTransformationService');

/**
 * Enhanced Page Controller for Unified Destack Integration
 *
 * This controller enhances the existing Destack integration by connecting it
 * with the unified content system for seamless AI-content and visual editing sync
 */

/**
 * Input validation helper
 */
const validateInput = {
  /**
   * Validate request parameters with schema
   */
  validateRequest: (req, schema) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.query[field] || req.body[field] || req.params[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
        }

        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters long`);
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }

        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
        }
      }
    }

    return errors;
  },

  /**
   * Sanitize string input
   */
  sanitizeString: (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
  },

  /**
   * Validate MongoDB ObjectId
   */
  isValidObjectId: (id) => {
    return id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  }
};

/**
 * Enhanced Destack handle request that works with unified content
 */
exports.getPageContentUnified = async (req, res) => {
  try {
    // Input validation schema
    const validationSchema = {
      name: { type: 'string', maxLength: 100 },
      type: { type: 'string', enum: ['theme', 'data'] },
      path: { type: 'string', maxLength: 200 },
      servicePageId: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ }
    };

    const validationErrors = validateInput.validateRequest(req, validationSchema);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    const { name, type, path, servicePageId } = req.query;

    // Sanitize inputs
    const sanitizedName = validateInput.sanitizeString(name);
    const sanitizedPath = validateInput.sanitizeString(path);

    console.log('Enhanced Destack handle GET request:', {
      name: sanitizedName,
      type,
      path: sanitizedPath,
      servicePageId
    });

    // Handle theme requests (for drag & drop components)
    if (type === 'theme') {
      return await exports.getEnhancedThemeComponents(req, res, sanitizedName);
    }

    // Handle data requests with unified content integration
    if (type === 'data') {
      return await exports.getUnifiedPageData(req, res, sanitizedPath, servicePageId);
    }

    // Handle service page requests with unified content
    if (servicePageId) {
      if (!validateInput.isValidObjectId(servicePageId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid servicePageId format'
        });
      }
      return await exports.getServicePageContent(req, res, servicePageId);
    }

    // Fallback to regular page handling
    const slug = sanitizedName || 'page-builder';
    const page = await Page.findOne({ slug }).lean();

    if (!page) {
      console.log('Page not found, returning empty content for new page');
      return res.json({});
    }

    console.log('Page found, returning content');
    res.json(page.content || {});
  } catch (error) {
    console.error('Enhanced get page content error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get page content'
    });
  }
};

/**
 * Enhanced save page content that syncs with unified content
 */
exports.savePageContentUnified = async (req, res) => {
  try {
    // Input validation schema
    const validationSchema = {
      name: { type: 'string', maxLength: 100 },
      servicePageId: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ }
    };

    const validationErrors = validateInput.validateRequest(req, validationSchema);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Validate content body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Content body is required and must be a valid object'
      });
    }

    const { name, servicePageId } = req.query;
    const content = req.body;
    const userId = validateInput.sanitizeString(req.session?.user?.id || 'anonymous');

    console.log('Enhanced Destack save request:', {
      name: validateInput.sanitizeString(name),
      servicePageId,
      hasContent: !!content,
      userId
    });

    // If this is a service page, sync with unified content
    if (servicePageId) {
      if (!validateInput.isValidObjectId(servicePageId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid servicePageId format'
        });
      }
      return await exports.saveServicePageContent(req, res, servicePageId, content, userId);
    }

    // Regular page save (fallback)
    const slug = validateInput.sanitizeString(name) || 'default';

    // Validate slug format
    if (!/^[a-zA-Z0-9\-_]+$/.test(slug)) {
      return res.status(400).json({
        success: false,
        error: 'Page name can only contain letters, numbers, hyphens, and underscores'
      });
    }

    let page = await Page.findOne({ slug });

    if (page) {
      page.content = content;
      page.updatedBy = userId;
      page.lastModified = new Date();
      await page.save();
    } else {
      page = new Page({
        slug,
        title: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/[-_]/g, ' '),
        content,
        status: 'draft',
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        lastModified: new Date()
      });
      await page.save();
    }

    res.json({
      success: true,
      message: 'Page saved successfully',
      pageId: page._id,
      slug: page.slug
    });
  } catch (error) {
    console.error('Enhanced save page content error:', error);

    // Return more specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Data validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Page with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to save page content',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get service page content in Destack format from unified content
 */
exports.getServicePageContent = async (req, res, servicePageId) => {
  try {
    // Validate servicePageId
    if (!validateInput.isValidObjectId(servicePageId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid servicePageId format'
      });
    }

    let unifiedContent = await UnifiedContent.findOne({ servicePageId }).lean();

    if (!unifiedContent) {
      // Create unified content from existing ServicePage
      try {
        unifiedContent = await ContentTransformationService.transformServicePageToUnified(servicePageId);
      } catch (transformError) {
        console.error('Error transforming service page to unified content:', transformError);
        return res.status(404).json({
          success: false,
          error: 'Service page not found or could not be transformed'
        });
      }
    }

    // Export to Destack format
    let destackContent;
    try {
      if (typeof unifiedContent.toDestackFormat === 'function') {
        destackContent = unifiedContent.toDestackFormat();
      } else {
        // Fallback manual transformation
        destackContent = {
          type: 'body',
          props: {},
          children: unifiedContent.components || []
        };
      }
    } catch (formatError) {
      console.error('Error formatting to Destack format:', formatError);
      destackContent = { type: 'body', props: {}, children: [] };
    }

    console.log('Returning unified content in Destack format for service page:', servicePageId);
    res.json(destackContent);
  } catch (error) {
    console.error('Error getting service page content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get service page content',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Save service page content and sync with unified content
 */
exports.saveServicePageContent = async (req, res, servicePageId, content, userId) => {
  try {
    // Validate inputs
    if (!validateInput.isValidObjectId(servicePageId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid servicePageId format'
      });
    }

    if (!content || typeof content !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Content is required and must be a valid object'
      });
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid userId is required'
      });
    }

    // Transform Destack content to unified content
    let unifiedContent;
    try {
      unifiedContent = await ContentTransformationService.transformDestackToUnified(
        servicePageId,
        content
      );
    } catch (transformError) {
      console.error('Error transforming Destack content to unified format:', transformError);
      return res.status(400).json({
        success: false,
        error: 'Failed to transform content to unified format',
        details: transformError.message
      });
    }

    // Create version snapshot
    try {
      if (typeof unifiedContent.createVersionSnapshot === 'function') {
        unifiedContent.createVersionSnapshot(
          'visual_edit',
          'Updated from Destack visual editor',
          validateInput.sanitizeString(userId)
        );
      }
    } catch (snapshotError) {
      console.warn('Error creating version snapshot:', snapshotError);
      // Continue execution as this is not critical
    }

    await unifiedContent.save();

    // Sync back to ServicePage
    try {
      await ContentTransformationService.syncToServicePage(unifiedContent._id);
    } catch (syncError) {
      console.error('Error syncing to service page:', syncError);
      // This is important but not critical enough to fail the entire operation
      // The unified content has been saved successfully
    }

    console.log('Service page content saved and synced with unified content');

    res.json({
      success: true,
      message: 'Service page content saved successfully',
      unifiedContentId: unifiedContent._id,
      lastModified: unifiedContent.lastModified || new Date()
    });
  } catch (error) {
    console.error('Error saving service page content:', error);

    // Return more specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Data validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format provided'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to save service page content',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get enhanced theme components with AI-generated content awareness
 */
exports.getEnhancedThemeComponents = async (req, res, themeName) => {
  try {
    console.log('Handling enhanced theme request for:', themeName);

    // Enhanced dental-themed components with AI content integration
    const componentData = {
      basic: [
        {
          id: 'ai-text-block',
          name: 'AI Text Block',
          category: 'Basic',
          folder: 'basic',
          component: '<div class="p-6 bg-white rounded-lg shadow-sm border border-gray-200" data-ai-content="true" data-content-section="overview"><h2 class="text-3xl font-bold text-gray-900 mb-4" data-ai-field="title">Professional Dental Care</h2><p class="text-gray-600 leading-relaxed" data-ai-field="content">Experience world-class dental care with our state-of-the-art facilities and expert dental professionals. We provide comprehensive dental services to keep your smile healthy and beautiful.</p></div>',
          image: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=150&h=100&fit=crop&crop=center',
          css: '',
          source: '<div class="p-6 bg-white rounded-lg shadow-sm border border-gray-200" data-ai-content="true" data-content-section="overview"><h2 class="text-3xl font-bold text-gray-900 mb-4" data-ai-field="title">Professional Dental Care</h2><p class="text-gray-600 leading-relaxed" data-ai-field="content">Experience world-class dental care with our state-of-the-art facilities and expert dental professionals. We provide comprehensive dental services to keep your smile healthy and beautiful.</p></div>',
          aiIntegrated: true
        },
        {
          id: 'smart-cta-button',
          name: 'Smart CTA Button',
          category: 'Basic',
          folder: 'basic',
          component: '<button class="inline-block rounded-md bg-blue-600 px-8 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300" data-ai-content="true" data-content-section="cta" data-ai-field="buttonText">Book Appointment</button>',
          image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=150&h=100&fit=crop&crop=center',
          css: '',
          source: '<button class="inline-block rounded-md bg-blue-600 px-8 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300" data-ai-content="true" data-content-section="cta" data-ai-field="buttonText">Book Appointment</button>',
          aiIntegrated: true
        },
        {
          id: 'dynamic-image',
          name: 'Dynamic Image',
          category: 'Basic',
          folder: 'basic',
          component: '<div class="relative" data-ai-content="true" data-content-section="hero"><img src="https://images.unsplash.com/photo-1609840112855-9ab5ad8f66e4?w=600&h=400&fit=crop&crop=center" alt="Modern dental office" class="w-full h-64 object-cover rounded-lg shadow-lg" data-ai-field="backgroundImage"><div class="absolute inset-0 bg-black bg-opacity-20 rounded-lg"></div><button class="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition" onclick="openImageSelector()"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></button></div>',
          image: 'https://images.unsplash.com/photo-1609840112855-9ab5ad8f66e4?w=150&h=100&fit=crop&crop=center',
          css: '',
          source: '<div class="relative" data-ai-content="true" data-content-section="hero"><img src="https://images.unsplash.com/photo-1609840112855-9ab5ad8f66e4?w=600&h=400&fit=crop&crop=center" alt="Modern dental office" class="w-full h-64 object-cover rounded-lg shadow-lg" data-ai-field="backgroundImage"><div class="absolute inset-0 bg-black bg-opacity-20 rounded-lg"></div><button class="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition" onclick="openImageSelector()"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></button></div>',
          aiIntegrated: true
        }
      ],
      'ai-sections': [
        {
          id: 'service-hero-ai',
          name: 'Service Hero (AI)',
          category: 'AI Sections',
          folder: 'ai-sections',
          component: '<section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20" data-ai-content="true" data-content-section="hero"><div class="container mx-auto px-4 text-center"><h1 class="text-5xl font-bold mb-6" data-ai-field="title">Your Perfect Smile Starts Here</h1><p class="text-xl mb-4 opacity-90" data-ai-field="subtitle">Professional dental care you can trust</p><p class="text-lg mb-8 opacity-80" data-ai-field="description">Experience exceptional dental care with our team of expert dentists using the latest technology and techniques for optimal oral health.</p><button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition" data-ai-field="ctaText">Book Appointment</button><div class="absolute top-4 right-4"><div class="bg-white bg-opacity-20 rounded-lg p-2"><span class="text-xs">AI Generated</span></div></div></div></section>',
          image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=150&h=100&fit=crop&crop=center',
          css: '',
          source: '<section class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20" data-ai-content="true" data-content-section="hero"><div class="container mx-auto px-4 text-center"><h1 class="text-5xl font-bold mb-6" data-ai-field="title">Your Perfect Smile Starts Here</h1><p class="text-xl mb-4 opacity-90" data-ai-field="subtitle">Professional dental care you can trust</p><p class="text-lg mb-8 opacity-80" data-ai-field="description">Experience exceptional dental care with our team of expert dentists using the latest technology and techniques for optimal oral health.</p><button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition" data-ai-field="ctaText">Book Appointment</button><div class="absolute top-4 right-4"><div class="bg-white bg-opacity-20 rounded-lg p-2"><span class="text-xs">AI Generated</span></div></div></div></section>',
          aiIntegrated: true
        },
        {
          id: 'service-benefits-ai',
          name: 'Service Benefits (AI)',
          category: 'AI Sections',
          folder: 'ai-sections',
          component: '<section class="py-16 bg-gray-50" data-ai-content="true" data-content-section="benefits"><div class="container mx-auto px-4"><h2 class="text-3xl font-bold text-center mb-4" data-ai-field="title">Benefits</h2><p class="text-lg text-gray-600 text-center mb-12" data-ai-field="introduction">Discover the advantages of our professional service</p><div class="grid grid-cols-1 md:grid-cols-3 gap-8" data-ai-field="list"><div class="bg-white p-6 rounded-lg shadow-md text-center" data-ai-list-item="true"><div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><span class="text-blue-600 text-2xl" data-ai-field="icon">✨</span></div><h3 class="text-xl font-semibold mb-3" data-ai-field="title">Professional Care</h3><p class="text-gray-600" data-ai-field="description">Expert treatment with personalized attention</p></div></div><div class="absolute top-4 right-4"><div class="bg-blue-100 rounded-lg p-2"><span class="text-xs text-blue-700">AI Content</span></div></div></div></section>',
          image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=150&h=100&fit=crop&crop=center',
          css: '',
          source: '<section class="py-16 bg-gray-50" data-ai-content="true" data-content-section="benefits"><div class="container mx-auto px-4"><h2 class="text-3xl font-bold text-center mb-4" data-ai-field="title">Benefits</h2><p class="text-lg text-gray-600 text-center mb-12" data-ai-field="introduction">Discover the advantages of our professional service</p><div class="grid grid-cols-1 md:grid-cols-3 gap-8" data-ai-field="list"><div class="bg-white p-6 rounded-lg shadow-md text-center" data-ai-list-item="true"><div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><span class="text-blue-600 text-2xl" data-ai-field="icon">✨</span></div><h3 class="text-xl font-semibold mb-3" data-ai-field="title">Professional Care</h3><p class="text-gray-600" data-ai-field="description">Expert treatment with personalized attention</p></div></div><div class="absolute top-4 right-4"><div class="bg-blue-100 rounded-lg p-2"><span class="text-xs text-blue-700">AI Content</span></div></div></div></section>',
          aiIntegrated: true
        },
        {
          id: 'service-faq-ai',
          name: 'Service FAQ (AI)',
          category: 'AI Sections',
          folder: 'ai-sections',
          component: '<section class="py-16 bg-white" data-ai-content="true" data-content-section="faq"><div class="container mx-auto px-4"><h2 class="text-3xl font-bold text-center mb-4" data-ai-field="title">Frequently Asked Questions</h2><p class="text-lg text-gray-600 text-center mb-12" data-ai-field="introduction">Get answers to common questions about our service</p><div class="max-w-3xl mx-auto space-y-4" data-ai-field="questions"><div class="border border-gray-200 rounded-lg" data-ai-list-item="true"><details class="group"><summary class="flex cursor-pointer items-center justify-between p-6"><h5 class="text-lg font-medium text-gray-900" data-ai-field="question">How often should I visit?</h5><span class="relative ml-1.5 h-5 w-5 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="absolute inset-0 h-5 w-5 opacity-100 group-open:opacity-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span></summary><p class="px-6 pb-6 leading-relaxed text-gray-700" data-ai-field="answer">We recommend regular visits every six months for optimal health and preventive care.</p></details></div></div><div class="absolute top-4 right-4"><div class="bg-green-100 rounded-lg p-2"><span class="text-xs text-green-700">AI FAQ</span></div></div></div></section>',
          image: 'https://images.unsplash.com/photo-1612277795421-9bc7706a4a34?w=150&h=100&fit=crop&crop=center',
          css: '',
          source: '<section class="py-16 bg-white" data-ai-content="true" data-content-section="faq"><div class="container mx-auto px-4"><h2 class="text-3xl font-bold text-center mb-4" data-ai-field="title">Frequently Asked Questions</h2><p class="text-lg text-gray-600 text-center mb-12" data-ai-field="introduction">Get answers to common questions about our service</p><div class="max-w-3xl mx-auto space-y-4" data-ai-field="questions"><div class="border border-gray-200 rounded-lg" data-ai-list-item="true"><details class="group"><summary class="flex cursor-pointer items-center justify-between p-6"><h5 class="text-lg font-medium text-gray-900" data-ai-field="question">How often should I visit?</h5><span class="relative ml-1.5 h-5 w-5 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="absolute inset-0 h-5 w-5 opacity-100 group-open:opacity-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span></summary><p class="px-6 pb-6 leading-relaxed text-gray-700" data-ai-field="answer">We recommend regular visits every six months for optimal health and preventive care.</p></details></div></div><div class="absolute top-4 right-4"><div class="bg-green-100 rounded-lg p-2"><span class="text-xs text-green-700">AI FAQ</span></div></div></div></section>',
          aiIntegrated: true
        }
      ],
      layout: [
        // Include existing layout components
        {
          id: 'dental-header',
          name: 'Professional Header',
          category: 'Layout',
          folder: 'layout',
          component: '<header class="bg-white shadow-sm"><div class="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8"><a class="block text-blue-600 cursor-pointer"><svg class="h-8" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.41 10.3847C1.14777 7.4194 2.85643 4.7861 5.2639 2.90424C7.6714 1.02234 10.6393 0 13.695 0C16.7507 0 19.7186 1.02234 22.1261 2.90424C24.5336 4.7861 26.2422 7.4194 26.98 10.3847H25.78C23.7557 10.3549 21.7729 10.9599 20.11 12.1147C20.014 12.1842 19.9138 12.2477 19.81 12.3047H19.67C19.5662 12.2477 19.466 12.1842 19.37 12.1147C17.6924 10.9866 15.7166 10.3841 13.695 10.3841C11.6734 10.3841 9.6976 10.9866 8.02 12.1147C7.924 12.1842 7.8238 12.2477 7.72 12.3047H7.58C7.4762 12.2477 7.376 12.1842 7.28 12.1147C5.6171 10.9599 3.6343 10.3549 1.61 10.3847H0.41Z" fill="currentColor"></path></svg></a><div class="flex flex-1 items-center justify-end md:justify-between"><nav class="hidden md:block"><ul class="flex items-center gap-6 text-sm"><li><a class="text-gray-500 transition hover:text-gray-500/75 cursor-pointer">Services</a></li><li><a class="text-gray-500 transition hover:text-gray-500/75 cursor-pointer">About</a></li><li><a class="text-gray-500 transition hover:text-gray-500/75 cursor-pointer">Contact</a></li></ul></nav><div class="flex items-center gap-4"><a class="block rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 cursor-pointer">Book Now</a></div></div></div></header>',
          image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=150&h=100&fit=crop&crop=center',
          css: '',
          source: '<header class="bg-white shadow-sm"><div class="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8"><a class="block text-blue-600 cursor-pointer"><svg class="h-8" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.41 10.3847C1.14777 7.4194 2.85643 4.7861 5.2639 2.90424C7.6714 1.02234 10.6393 0 13.695 0C16.7507 0 19.7186 1.02234 22.1261 2.90424C24.5336 4.7861 26.2422 7.4194 26.98 10.3847H25.78C23.7557 10.3549 21.7729 10.9599 20.11 12.1147C20.014 12.1842 19.9138 12.2477 19.81 12.3047H19.67C19.5662 12.2477 19.466 12.1842 19.37 12.1147C17.6924 10.9866 15.7166 10.3841 13.695 10.3841C11.6734 10.3841 9.6976 10.9866 8.02 12.1147C7.924 12.1842 7.8238 12.2477 7.72 12.3047H7.58C7.4762 12.2477 7.376 12.1842 7.28 12.1147C5.6171 10.9599 3.6343 10.3549 1.61 10.3847H0.41Z" fill="currentColor"></path></svg></a><div class="flex flex-1 items-center justify-end md:justify-between"><nav class="hidden md:block"><ul class="flex items-center gap-6 text-sm"><li><a class="text-gray-500 transition hover:text-gray-500/75 cursor-pointer">Services</a></li><li><a class="text-gray-500 transition hover:text-gray-500/75 cursor-pointer">About</a></li><li><a class="text-gray-500 transition hover:text-gray-500/75 cursor-pointer">Contact</a></li></ul></nav><div class="flex items-center gap-4"><a class="block rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 cursor-pointer">Book Now</a></div></div></div></header>'
        }
      ],
      content: [], // Additional content components can be added here
      forms: [] // Additional form components can be added here
    };

    // Return the folder data requested by Destack
    console.log('Theme name requested:', themeName);

    // Check if a specific folder is being requested
    if (componentData[themeName]) {
      console.log(`Returning ${componentData[themeName].length} enhanced components for folder: ${themeName}`);
      return res.json(componentData[themeName]);
    }

    // Handle legacy theme names - return all components organized by category
    if (themeName === 'hyperui' || themeName === 'tailblocks' || !themeName) {
      const allComponents = {
        basic: componentData.basic,
        'ai-sections': componentData['ai-sections'],
        layout: componentData.layout,
        content: componentData.content,
        forms: componentData.forms
      };
      console.log('Returning all enhanced components organized by category');
      return res.json(allComponents);
    }

    // Fallback to basic components
    console.log(`Returning ${componentData.basic.length} basic components as fallback`);
    return res.json(componentData.basic);

  } catch (error) {
    console.error('Error handling enhanced theme request:', error);
    // Return minimal fallback components
    return res.json([
      {
        id: 'fallback-text',
        name: 'Text',
        category: 'Basic',
        folder: 'basic',
        component: '<div class="p-4 border"><p>Sample text</p></div>',
        image: 'https://via.placeholder.com/150x100/f8fafc/374151?text=Text',
        css: '',
        source: '<div class="p-4 border"><p>Sample text</p></div>'
      }
    ]);
  }
}

/**
 * Get unified page data for specific paths
 */
exports.getUnifiedPageData = async (req, res, path, servicePageId) => {
  try {
    console.log('Handling unified data request for path:', path, 'servicePageId:', servicePageId);

    if (path === '/page-builder' || servicePageId) {
      // Get unified content if service page is specified
      if (servicePageId) {
        let unifiedContent = await UnifiedContent.findOne({ servicePageId });

        if (!unifiedContent) {
          // Create unified content from existing ServicePage
          unifiedContent = await ContentTransformationService.transformServicePageToUnified(servicePageId);
        }

        // Return Destack format
        const destackContent = unifiedContent.toDestackFormat();
        return res.json(destackContent);
      }

      // Try to find existing page for regular page builder
      const page = await Page.findOne({ slug: 'page-builder' });

      if (!page) {
        console.log('Page not found, returning default enhanced page structure');
        const defaultPageStructure = {
          type: 'body',
          props: {},
          children: [
            {
              type: 'section',
              props: {
                style: {
                  padding: '40px 20px',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc'
                }
              },
              children: [
                {
                  type: 'h1',
                  props: {
                    style: {
                      fontSize: '2rem',
                      marginBottom: '1rem',
                      color: '#1f2937'
                    }
                  },
                  children: ['Enhanced Page Builder with AI Integration']
                },
                {
                  type: 'p',
                  props: {
                    style: {
                      color: '#6b7280',
                      marginBottom: '2rem'
                    }
                  },
                  children: ['Drag and drop AI-powered components to build your service page.']
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      backgroundColor: '#dbeafe',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      color: '#1e40af'
                    }
                  },
                  children: ['Use AI Sections from the component library for intelligent content generation!']
                }
              ]
            }
          ]
        };
        return res.json(defaultPageStructure);
      }

      console.log('Page found, returning enhanced content');
      return res.json(page.content || {});
    }

    // For other data requests, return empty
    return res.json({});
  } catch (error) {
    console.error('Error getting unified page data:', error);
    return res.json({});
  }
}

/**
 * Enhanced asset upload with AI-powered stock image integration
 */
exports.uploadAssetEnhanced = async (req, res) => {
  try {
    const { file, type, searchQuery, source, servicePageId } = req.body;

    console.log('Enhanced asset upload request:', { type, searchQuery, source });

    // If this is a stock image request, integrate with stock APIs
    if (source === 'stock' && searchQuery) {
      return await exports.getStockImage(req, res, searchQuery);
    }

    // Handle file upload
    if (file && file.data) {
      return await exports.handleFileUpload(req, res, file, type, servicePageId);
    }

    // Handle URL-based uploads
    if (req.body.url) {
      return await exports.handleUrlUpload(req, res, req.body.url, type, servicePageId);
    }

    return res.status(400).json({
      success: false,
      error: 'No file, URL, or stock image query provided'
    });

  } catch (error) {
    console.error('Enhanced upload asset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload asset',
      message: error.message
    });
  }
};

/**
 * Handle actual file upload
 */
exports.handleFileUpload = async (req, res, fileData, type, servicePageId) => {
  try {
    // Validate file type and size
    const validation = exports.validateUploadedFile(fileData, type);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Generate unique filename
    const filename = exports.generateUniqueFilename(fileData.name, type);

    // TODO: Implement actual cloud storage upload
    // For now, simulate upload and return placeholder URL
    const uploadResult = await exports.uploadToCloudStorage(fileData, filename);

    // Save asset metadata to unified content if servicePageId provided
    if (servicePageId) {
      await exports.saveAssetToUnifiedContent(servicePageId, uploadResult);
    }

    res.json({
      success: true,
      url: uploadResult.url,
      metadata: {
        filename: uploadResult.filename,
        size: fileData.size,
        type: type || 'image',
        source: 'upload',
        uploadedAt: new Date(),
        cloudProvider: uploadResult.provider || 'local'
      }
    });

  } catch (error) {
    console.error('Error handling file upload:', error);
    throw error;
  }
};

/**
 * Handle URL-based upload (for images from URLs)
 */
exports.handleUrlUpload = async (req, res, imageUrl, type, servicePageId) => {
  try {
    // Validate URL
    if (!exports.isValidImageUrl(imageUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image URL'
      });
    }

    // Download and re-upload to our storage
    const downloadResult = await exports.downloadAndUploadImage(imageUrl);

    // Save asset metadata if servicePageId provided
    if (servicePageId) {
      await exports.saveAssetToUnifiedContent(servicePageId, downloadResult);
    }

    res.json({
      success: true,
      url: downloadResult.url,
      metadata: {
        originalUrl: imageUrl,
        filename: downloadResult.filename,
        type: type || 'image',
        source: 'url',
        uploadedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error handling URL upload:', error);
    throw error;
  }
};

/**
 * Validate uploaded file
 */
exports.validateUploadedFile = (fileData, type) => {
  const maxSizes = {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    document: 5 * 1024 * 1024 // 5MB
  };

  const allowedTypes = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    video: ['mp4', 'webm', 'ogg'],
    document: ['pdf', 'doc', 'docx']
  };

  // Check file size
  const maxSize = maxSizes[type] || maxSizes.image;
  if (fileData.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`
    };
  }

  // Check file type
  const fileExtension = fileData.name.split('.').pop().toLowerCase();
  const allowedExtensions = allowedTypes[type] || allowedTypes.image;
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `File type .${fileExtension} not allowed. Allowed types: ${allowedExtensions.join(', ')}`
    };
  }

  return { valid: true };
};

/**
 * Generate unique filename
 */
exports.generateUniqueFilename = (originalName, type) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '-');

  return `${type}/${baseName}-${timestamp}-${random}.${extension}`;
};

/**
 * Upload to cloud storage (placeholder implementation)
 */
exports.uploadToCloudStorage = async (fileData, filename) => {
  try {
    // TODO: Implement actual cloud storage upload (AWS S3, Google Cloud, etc.)
    // For now, return placeholder data
    console.log('Uploading to cloud storage:', filename);

    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      url: `/uploads/${filename}`,
      filename: filename,
      provider: 'local', // Would be 'aws-s3', 'google-cloud', etc.
      bucket: 'dental-assets',
      key: filename
    };
  } catch (error) {
    console.error('Error uploading to cloud storage:', error);
    throw error;
  }
};

/**
 * Download and upload image from URL
 */
exports.downloadAndUploadImage = async (imageUrl) => {
  try {
    // TODO: Implement actual image download and upload
    console.log('Downloading image from URL:', imageUrl);

    // Generate filename from URL
    const urlParts = imageUrl.split('/');
    const originalName = urlParts[urlParts.length - 1] || 'downloaded-image.jpg';
    const filename = exports.generateUniqueFilename(originalName, 'image');

    // Simulate download and upload
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      url: `/uploads/${filename}`,
      filename: filename,
      originalUrl: imageUrl
    };
  } catch (error) {
    console.error('Error downloading and uploading image:', error);
    throw error;
  }
};

/**
 * Save asset to unified content
 */
exports.saveAssetToUnifiedContent = async (servicePageId, assetData) => {
  try {
    const UnifiedContent = require('../models/UnifiedContent');

    const unifiedContent = await UnifiedContent.findOne({ servicePageId });
    if (!unifiedContent) {
      console.warn('Unified content not found for servicePageId:', servicePageId);
      return;
    }

    const asset = {
      id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: assetData.type || 'image',
      url: assetData.url,
      alt: assetData.alt || '',
      title: assetData.title || '',
      metadata: {
        filename: assetData.filename,
        size: assetData.size,
        format: assetData.format,
        source: assetData.source || 'upload'
      },
      usedInComponents: []
    };

    unifiedContent.assets.push(asset);
    await unifiedContent.save();

    console.log('Asset saved to unified content:', asset.id);
    return asset;
  } catch (error) {
    console.error('Error saving asset to unified content:', error);
    throw error;
  }
};

/**
 * Validate image URL
 */
exports.isValidImageUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const validDomains = [
      'images.unsplash.com',
      'images.pexels.com',
      'cdn.pixabay.com',
      'source.unsplash.com'
    ];

    // Allow any HTTPS URL for now, or specific trusted domains
    return urlObj.protocol === 'https:' || validDomains.includes(urlObj.hostname);
  } catch (error) {
    return false;
  }
};

/**
 * Get stock image from AI-powered APIs
 */
exports.getStockImage = async (req, res, searchQuery) => {
  try {
    // For now, return Unsplash images with search
    // In production, this would integrate with actual stock photo APIs
    const unsplashUrl = `https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&h=600&fit=crop&crop=center&q=${encodeURIComponent(searchQuery)}`;

    res.json({
      url: unsplashUrl,
      metadata: {
        type: 'image',
        source: 'unsplash',
        searchQuery: searchQuery,
        alt: `Stock image for ${searchQuery}`,
        title: searchQuery
      }
    });
  } catch (error) {
    console.error('Error getting stock image:', error);
    res.status(500).json({
      error: 'Failed to get stock image'
    });
  }
}

module.exports = exports;