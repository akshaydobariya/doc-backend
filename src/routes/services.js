const express = require('express');
const router = express.Router();
const DentalService = require('../models/DentalService');
const ServicePage = require('../models/ServicePage');
const {
  getAllServices,
  getServicesByCategory,
  getCategories,
  getPopularServices,
  getService,
  createService,
  updateService,
  deleteService,
  generateServiceContent,
  generateContentFromServiceData,
  getServicePages,
  createServicePage,
  getServicePage,
  updateServicePage,
  getLLMStatus,
  searchServices
} = require('../controllers/serviceController');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  req.user = req.session.user;
  next();
};

// Middleware to check if user is a doctor
const requireDoctor = (req, res, next) => {
  if (!req.user || req.user.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Doctor access required'
    });
  }
  next();
};

// Public routes (no authentication required)

/**
 * Get all dental services (public)
 * GET /api/services
 * Query params: category, search, isActive, isPopular, page, limit
 */
router.get('/', getAllServices);

/**
 * Search services (public)
 * GET /api/services/search?q=searchTerm&categories=cat1,cat2&limit=20
 */
router.get('/search', searchServices);

/**
 * Get popular services (public)
 * GET /api/services/popular?limit=6
 */
router.get('/popular', getPopularServices);

/**
 * Get service categories (public)
 * GET /api/services/categories
 */
router.get('/categories', getCategories);

/**
 * Get services by category (public)
 * GET /api/services/category/:category?activeOnly=true
 */
router.get('/category/:category', getServicesByCategory);

// Protected routes (authentication required)

/**
 * Get LLM provider status (authenticated)
 * GET /api/services/llm/status
 */
router.get('/llm/status', requireAuth, getLLMStatus);

/**
 * Get service pages for a website (doctor only)
 * GET /api/services/pages?websiteId=...&status=published&page=1&limit=20
 */
router.get('/pages', requireAuth, requireDoctor, getServicePages);

/**
 * Get single service by ID or slug (public)
 * GET /api/services/:identifier
 */
router.get('/:identifier', getService);

/**
 * Get specific service page (authenticated)
 * GET /api/services/pages/:id
 */
router.get('/pages/:id', requireAuth, getServicePage);

/**
 * Update service page (doctor only)
 * PUT /api/services/pages/:id
 * Body: { content, seo, design, status, isIntegrated, etc. }
 */
router.put('/pages/:id', requireAuth, requireDoctor, updateServicePage);

/**
 * Create or update service page (doctor only)
 * POST /api/services/pages
 * Body: { websiteId, serviceId, content, seo, design, autoGenerate }
 */
router.post('/pages', requireAuth, requireDoctor, createServicePage);

/**
 * Generate content for a service using LLM (doctor only)
 * POST /api/services/:id/generate-content
 * Body: { contentType, provider, temperature, keywords, customPrompt }
 */
router.post('/:id/generate-content', requireAuth, requireDoctor, generateServiceContent);

/**
 * Generate content from service data (doctor only)
 * POST /api/services/generate-content-from-data
 * Body: { serviceName, category, description, websiteId, provider, temperature, generateSEO, generateFAQ }
 */
/**
 * Get service by slug (public)
 * GET /api/services/slug/:slug
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const service = await DentalService.findOne({ slug, isActive: true });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service'
    });
  }
});

/**
 * Track service page view (public)
 * POST /api/services/:id/view
 */
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await DentalService.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await service.incrementViewCount();

    res.json({
      success: true,
      message: 'View tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track view'
    });
  }
});

/**
 * Get published service page by website and service slug (public)
 * GET /api/services/public/page/:websiteId/:serviceSlug
 */
router.get('/public/page/:websiteId/:serviceSlug', async (req, res) => {
  try {
    const { websiteId, serviceSlug } = req.params;

    // Find the service first
    const service = await DentalService.findOne({ slug: serviceSlug, isActive: true });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Find the service page
    const servicePage = await ServicePage.findOne({
      websiteId,
      serviceId: service._id,
      $or: [
        { status: 'published' },
        { isIntegrated: true } // Allow integrated draft pages to be publicly viewable
      ]
    }).populate('serviceId');

    if (!servicePage) {
      return res.status(404).json({
        success: false,
        message: 'Service page not found'
      });
    }

    res.json({
      success: true,
      data: servicePage
    });
  } catch (error) {
    console.error('Get public service page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service page',
      error: error.message
    });
  }
});

/**
 * Update service page status (doctor only)
 * PATCH /api/services/pages/:id/status
 * Body: { status: 'draft' | 'published' }
 */
router.patch('/pages/:id/status', requireAuth, requireDoctor, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "draft" or "published"'
      });
    }

    const servicePage = await ServicePage.findById(id);
    if (!servicePage) {
      return res.status(404).json({
        success: false,
        message: 'Service page not found'
      });
    }

    // Check if user owns this service page
    if (servicePage.doctorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this service page'
      });
    }

    servicePage.status = status;
    if (status === 'published') {
      servicePage.publishedAt = new Date();
    }

    await servicePage.save();

    res.json({
      success: true,
      data: servicePage
    });
  } catch (error) {
    console.error('Error updating service page status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service page status'
    });
  }
});

router.post('/generate-content-from-data', requireAuth, requireDoctor, generateContentFromServiceData);

// Admin routes (doctor only - for managing services)

/**
 * Create new dental service (doctor only)
 * POST /api/services
 * Body: Service data object
 */
router.post('/', requireAuth, requireDoctor, createService);

/**
 * Update dental service (doctor only)
 * PUT /api/services/:id
 * Body: Updated service data
 */
router.put('/:id', requireAuth, requireDoctor, updateService);

/**
 * Delete dental service (doctor only)
 * DELETE /api/services/:id?permanent=false
 */
router.delete('/:id', requireAuth, requireDoctor, deleteService);

// Content Template routes

/**
 * Get content templates (authenticated)
 * GET /api/services/templates?type=service-page&category=general-dentistry
 */
router.get('/templates', requireAuth, async (req, res) => {
  try {
    const ContentTemplate = require('../models/ContentTemplate');
    const { type, category, isPublic } = req.query;

    let templates;

    if (isPublic === 'true') {
      // Get public templates
      templates = await ContentTemplate.findPublic(type, category);
    } else {
      // Get doctor's templates + public templates
      templates = await ContentTemplate.findByCategory(category, type, req.user.id);
    }

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
});

/**
 * Create content template (doctor only)
 * POST /api/services/templates
 */
router.post('/templates', requireAuth, requireDoctor, async (req, res) => {
  try {
    const ContentTemplate = require('../models/ContentTemplate');
    const templateData = {
      ...req.body,
      doctorId: req.user.id
    };

    const template = new ContentTemplate(templateData);
    await template.save();

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully'
    });

  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message
    });
  }
});

/**
 * Update content template (doctor only)
 * PUT /api/services/templates/:id
 */
router.put('/templates/:id', requireAuth, requireDoctor, async (req, res) => {
  try {
    const ContentTemplate = require('../models/ContentTemplate');
    const { id } = req.params;

    const template = await ContentTemplate.findOneAndUpdate(
      { _id: id, doctorId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    });

  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
});

/**
 * Delete content template (doctor only)
 * DELETE /api/services/templates/:id
 */
router.delete('/templates/:id', requireAuth, requireDoctor, async (req, res) => {
  try {
    const ContentTemplate = require('../models/ContentTemplate');
    const { id } = req.params;

    const template = await ContentTemplate.findOneAndDelete({
      _id: id,
      doctorId: req.user.id
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message
    });
  }
});

/**
 * Use template (increment usage count)
 * POST /api/services/templates/:id/use
 */
router.post('/templates/:id/use', requireAuth, async (req, res) => {
  try {
    const ContentTemplate = require('../models/ContentTemplate');
    const { id } = req.params;
    const { variables = {} } = req.body;

    const template = await ContentTemplate.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Validate required variables
    template.validateVariables(variables);

    // Render template with variables
    const renderedContent = template.render(variables);

    // Increment usage count
    await template.incrementUsage();

    res.json({
      success: true,
      data: {
        template: template,
        renderedContent: renderedContent
      }
    });

  } catch (error) {
    console.error('Use template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to use template',
      error: error.message
    });
  }
});

/**
 * Rate template
 * POST /api/services/templates/:id/rate
 * Body: { rating: 1-5 }
 */
router.post('/templates/:id/rate', requireAuth, async (req, res) => {
  try {
    const ContentTemplate = require('../models/ContentTemplate');
    const { id } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const template = await ContentTemplate.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    await template.addRating(rating);

    res.json({
      success: true,
      message: 'Rating added successfully',
      data: {
        averageRating: template.usage.rating,
        ratingCount: template.usage.ratingCount
      }
    });

  } catch (error) {
    console.error('Rate template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate template',
      error: error.message
    });
  }
});


// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Services route error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;