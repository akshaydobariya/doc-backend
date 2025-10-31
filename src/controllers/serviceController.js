const mongoose = require('mongoose');
const DentalService = require('../models/DentalService');
const ServicePage = require('../models/ServicePage');
const ContentTemplate = require('../models/ContentTemplate');
const Website = require('../models/Website');
const llmService = require('../services/llmService');

/**
 * Service Controller
 * Handles CRUD operations for dental services, service pages, and content generation
 */

/**
 * Get all dental services
 * GET /api/services
 */
const getAllServices = async (req, res) => {
  try {
    const {
      category,
      search,
      isActive = 'true', // Default to showing active services
      isPopular,
      page = 1,
      limit = 50
    } = req.query;

    // Build query
    const query = {};

    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true' || isActive === true;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (isPopular !== undefined) {
      query.isPopular = isPopular === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { 'seo.keywords': { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;

    console.log('DEBUG - Query object:', JSON.stringify(query));
    console.log('DEBUG - isActive value:', isActive, typeof isActive);

    const services = await DentalService.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('relatedServices', 'name slug category');

    const total = await DentalService.countDocuments(query);

    console.log('DEBUG - Services found:', services.length);
    console.log('DEBUG - Total count:', total);

    res.json({
      success: true,
      data: services,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
};

/**
 * Get services by category
 * GET /api/services/category/:category
 */
const getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { activeOnly = true } = req.query;

    const services = await DentalService.findByCategory(category, activeOnly === 'true');

    res.json({
      success: true,
      data: services,
      category
    });

  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services by category',
      error: error.message
    });
  }
};

/**
 * Get service categories
 * GET /api/services/categories
 */
const getCategories = async (req, res) => {
  try {
    // Get distinct categories from dental services
    const categories = await DentalService.distinct('category');

    // Map to category objects with names
    const categoryList = categories.map(category => {
      const categoryMap = {
        'general-dentistry': { id: 'general-dentistry', name: 'General Dentistry', icon: '🦷' },
        'cosmetic-dentistry': { id: 'cosmetic-dentistry', name: 'Cosmetic Dentistry', icon: '✨' },
        'orthodontics': { id: 'orthodontics', name: 'Orthodontics', icon: '📐' },
        'oral-surgery': { id: 'oral-surgery', name: 'Oral Surgery', icon: '⚕️' },
        'pediatric-dentistry': { id: 'pediatric-dentistry', name: 'Pediatric Dentistry', icon: '👶' },
        'emergency-dentistry': { id: 'emergency-dentistry', name: 'Emergency Dentistry', icon: '🚨' },
        'periodontics': { id: 'periodontics', name: 'Periodontics', icon: '🦷' },
        'endodontics': { id: 'endodontics', name: 'Endodontics', icon: '🔬' },
        'prosthodontics': { id: 'prosthodontics', name: 'Prosthodontics', icon: '👑' },
        'oral-pathology': { id: 'oral-pathology', name: 'Oral Pathology', icon: '🔍' }
      };

      return categoryMap[category] || { id: category, name: category.replace('-', ' '), icon: '🦷' };
    });

    res.json({
      success: true,
      data: categoryList
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

/**
 * Get popular services
 * GET /api/services/popular
 */
const getPopularServices = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const services = await DentalService.findPopular(parseInt(limit));

    res.json({
      success: true,
      data: services
    });

  } catch (error) {
    console.error('Get popular services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular services',
      error: error.message
    });
  }
};

/**
 * Get single service by ID or slug
 * GET /api/services/:identifier
 */
const getService = async (req, res) => {
  try {
    const { identifier } = req.params;

    // Try to find by ID first, then by slug
    let service = await DentalService.findById(identifier).populate('relatedServices');

    if (!service) {
      service = await DentalService.findOne({ slug: identifier }).populate('relatedServices');
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Increment view count
    await service.incrementViewCount();

    res.json({
      success: true,
      data: service
    });

  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
      error: error.message
    });
  }
};

/**
 * Create new dental service
 * POST /api/services
 */
const createService = async (req, res) => {
  try {
    const serviceData = req.body;

    // Check if slug already exists
    if (serviceData.slug) {
      const existingService = await DentalService.findOne({ slug: serviceData.slug });
      if (existingService) {
        return res.status(400).json({
          success: false,
          message: 'Service with this slug already exists'
        });
      }
    }

    const service = new DentalService(serviceData);
    await service.save();

    res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully'
    });

  } catch (error) {
    console.error('Create service error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Service with this name or slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: error.message
    });
  }
};

/**
 * Update dental service
 * PUT /api/services/:id
 */
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if slug is being changed and if it conflicts
    if (updateData.slug) {
      const existingService = await DentalService.findOne({
        slug: updateData.slug,
        _id: { $ne: id }
      });
      if (existingService) {
        return res.status(400).json({
          success: false,
          message: 'Service with this slug already exists'
        });
      }
    }

    const service = await DentalService.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('relatedServices');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service,
      message: 'Service updated successfully'
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
};

/**
 * Delete dental service
 * DELETE /api/services/:id
 */
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;

    if (permanent === 'true') {
      // Permanently delete the service
      const service = await DentalService.findByIdAndDelete(id);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Also delete all related service pages
      await ServicePage.deleteMany({ serviceId: id });

    } else {
      // Soft delete (mark as inactive)
      const service = await DentalService.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Mark related service pages as archived
      await ServicePage.updateMany(
        { serviceId: id },
        { status: 'archived' }
      );
    }

    res.json({
      success: true,
      message: permanent === 'true' ? 'Service permanently deleted' : 'Service deactivated'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message
    });
  }
};

/**
 * Generate content for a service using LLM
 * POST /api/services/:id/generate-content
 */
const generateServiceContent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      contentType, // 'serviceOverview', 'serviceBenefits', 'procedureSteps', etc.
      provider = 'auto',
      temperature = 0.7,
      keywords = [],
      customPrompt = null
    } = req.body;

    // Get the service
    const service = await DentalService.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (contentType === 'full-page') {
      // Generate complete service page content
      const result = await llmService.generateServicePageContent({
        serviceName: service.name,
        category: service.category,
        keywords: keywords.length > 0 ? keywords : service.seo.keywords
      }, {
        provider,
        temperature
      });

      res.json({
        success: true,
        data: result,
        service: {
          id: service._id,
          name: service.name,
          category: service.category
        }
      });

    } else {
      // Generate specific content type
      const result = await llmService.generateDentalServiceContent(
        service.name,
        contentType,
        {
          keywords: keywords.length > 0 ? keywords : service.seo.keywords,
          category: service.category,
          provider,
          temperature,
          customPrompt
        }
      );

      // Update service with generation info
      service.contentGeneration.lastGenerated = new Date();
      service.contentGeneration.generatedBy = result.provider;
      if (customPrompt) {
        service.contentGeneration.customPrompt = customPrompt;
      }
      await service.save();

      res.json({
        success: true,
        data: result,
        contentType,
        service: {
          id: service._id,
          name: service.name,
          category: service.category
        }
      });
    }

  } catch (error) {
    console.error('Generate service content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate content',
      error: error.message
    });
  }
};

/**
 * Generate content from service data (without requiring existing service)
 * POST /api/services/generate-content-from-data
 */
const generateContentFromServiceData = async (req, res) => {
  try {
    const {
      serviceName,
      category,
      description,
      websiteId,
      generateSEO = true,
      generateFAQ = true,
      generateProcedure = true,
      generateBenefits = true,
      provider = 'auto',
      temperature = 0.7,
      keywords = []
    } = req.body;

    // Validate required fields
    if (!serviceName) {
      return res.status(400).json({
        success: false,
        message: 'Service name is required'
      });
    }

    if (!websiteId) {
      return res.status(400).json({
        success: false,
        message: 'Website ID is required. Please create a website first before generating service content.',
        code: 'WEBSITE_ID_REQUIRED'
      });
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(websiteId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid website ID format. Please check your website configuration.',
        code: 'INVALID_WEBSITE_ID'
      });
    }

    // Verify website exists
    const website = await Website.findById(websiteId);
    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found. Please create a website first before generating service content.',
        code: 'WEBSITE_NOT_FOUND'
      });
    }

    // Generate complete service page content using LLM
    const llmResult = await llmService.generateServicePageContent({
      serviceName,
      category: category || 'general-dentistry',
      keywords: keywords.length > 0 ? keywords : []
    }, {
      provider,
      temperature
    });

    // Create service slug
    const slug = serviceName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Create or find the service
    let service = await DentalService.findOne({ slug });
    if (!service) {
      service = new DentalService({
        name: serviceName,
        slug: slug,
        category: category || 'general-dentistry',
        shortDescription: description || `Professional ${serviceName} services`,
        isActive: true,
        isPopular: false,
        contentGeneration: {
          lastGenerated: new Date(),
          generatedBy: llmResult.content.serviceOverview?.provider || provider,
          isGenerated: true
        },
        seo: {
          keywords: keywords.length > 0 ? keywords : [serviceName.toLowerCase(), category]
        }
      });
      await service.save();
    }

    // Check if service page already exists for this website and service
    let servicePage = await ServicePage.findOne({
      websiteId,
      serviceId: service._id
    });

    const pageData = {
      websiteId,
      serviceId: service._id,
      doctorId: website.doctorId, // Get doctorId from website
      title: serviceName,
      slug: slug, // Use the same slug as the service
      content: {
        overview: {
          title: 'Overview',
          content: llmResult.content.serviceOverview?.content || `Professional ${serviceName} services`
        },
        benefits: generateBenefits && llmResult.content.serviceBenefits ? {
          title: 'Benefits',
          introduction: 'Key benefits of this service:',
          list: parseBenefitsFromLLM(llmResult.content.serviceBenefits.content)
        } : undefined,
        procedure: generateProcedure && llmResult.content.procedureSteps ? {
          title: 'The Procedure',
          introduction: 'What to expect:',
          steps: parseStepsFromLLM(llmResult.content.procedureSteps.content)
        } : undefined,
        faq: generateFAQ && llmResult.content.faqGeneration ? {
          title: 'Frequently Asked Questions',
          introduction: 'Common questions about this service:',
          questions: parseFAQFromLLM(llmResult.content.faqGeneration.content)
        } : undefined,
        aftercare: llmResult.content.aftercareInstructions ? {
          title: 'Recovery & Aftercare',
          introduction: 'Important aftercare instructions:',
          instructions: parseAfterCareFromLLM(llmResult.content.aftercareInstructions.content),
          showSection: true
        } : undefined,
        cta: {
          title: `Ready for ${serviceName}?`,
          subtitle: `Schedule your ${serviceName} consultation today.`,
          buttonText: 'Book Consultation',
          phoneNumber: '(555) 123-4567',
          backgroundColor: '#1976d2'
        }
      },
      seo: generateSEO && llmResult.content.seoContent ? {
        metaTitle: parseSEOTitle(llmResult.content.seoContent.content, serviceName),
        metaDescription: parseSEODescription(llmResult.content.seoContent.content),
        keywords: parseSEOKeywords(llmResult.content.seoContent.content)
      } : {
        metaTitle: `${serviceName} | Professional Dental Care`,
        metaDescription: `Professional ${serviceName} services. Schedule your consultation today.`,
        keywords: keywords.length > 0 ? keywords : [serviceName.toLowerCase()]
      },
      status: 'draft',
      isIntegrated: true, // Auto-integrate generated services
      createdBy: req.user ? req.user.id : null,
      updatedBy: req.user ? req.user.id : null
    };

    let isUpdate = false;
    if (servicePage) {
      // Update existing service page
      Object.assign(servicePage, pageData);
      servicePage.updatedAt = new Date();
      await servicePage.save();
      isUpdate = true;
    } else {
      // Create new service page
      servicePage = new ServicePage(pageData);
      await servicePage.save();
      isUpdate = false;
    }

    res.json({
      success: true,
      data: {
        service: service,
        page: servicePage,
        llmContent: llmResult.content,
        tokensUsed: llmResult.totalTokensUsed
      },
      message: isUpdate ? 'Service content updated successfully' : 'Service content generated successfully'
    });

  } catch (error) {
    console.error('Generate content from service data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate content from service data',
      error: error.message
    });
  }
};

// Helper functions to parse LLM content
function parseBenefitsFromLLM(content) {
  try {
    // Try to extract benefits from LLM response
    const lines = content.split('\n').filter(line => line.trim());
    const benefits = [];

    for (const line of lines) {
      if (line.includes('•') || line.includes('-') || line.includes('*')) {
        const benefit = line.replace(/[•\-*]\s*/, '').trim();
        if (benefit) {
          const parts = benefit.split(':');
          let title = parts[0]?.trim() || benefit;
          // Remove markdown formatting and truncate title if needed
          title = title.replace(/\*\*/g, '').replace(/\*/g, '').trim();
          if (title.length > 95) {
            title = title.substring(0, 95) + '...';
          }
          benefits.push({
            title: title,
            description: parts[1]?.trim() || ''
          });
        }
      }
    }

    return benefits.length > 0 ? benefits : [{
      title: 'Professional Treatment',
      description: 'High-quality dental care'
    }];
  } catch (error) {
    return [{
      title: 'Professional Treatment',
      description: 'High-quality dental care'
    }];
  }
}

function parseStepsFromLLM(content) {
  try {
    const lines = content.split('\n').filter(line => line.trim());
    const steps = [];
    let stepNumber = 1;

    for (const line of lines) {
      if (line.match(/^\d+\./) || line.includes('Step') || line.includes('•') || line.includes('-')) {
        const step = line.replace(/^\d+\.\s*/, '').replace(/Step\s*\d+\s*[:\-]?\s*/i, '').replace(/[•\-]\s*/, '').trim();
        if (step) {
          const parts = step.split(':');
          let title = parts[0]?.trim() || `Step ${stepNumber}`;
          // Remove markdown formatting and truncate title if needed
          title = title.replace(/\*\*/g, '').replace(/\*/g, '').trim();
          if (title.length > 95) {
            title = title.substring(0, 95) + '...';
          }
          steps.push({
            stepNumber: stepNumber++,
            title: title,
            description: parts[1]?.trim() || step
          });
        }
      }
    }

    return steps.length > 0 ? steps : [{
      stepNumber: 1,
      title: 'Consultation',
      description: 'Initial consultation and examination'
    }];
  } catch (error) {
    return [{
      stepNumber: 1,
      title: 'Consultation',
      description: 'Initial consultation and examination'
    }];
  }
}

function parseFAQFromLLM(content) {
  try {
    const lines = content.split('\n').filter(line => line.trim());
    const faqs = [];
    let currentQuestion = '';
    let currentAnswer = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.includes('?') || line.toLowerCase().includes('q:') || line.toLowerCase().includes('question')) {
        if (currentQuestion && currentAnswer) {
          faqs.push({
            question: currentQuestion,
            answer: currentAnswer
          });
        }
        currentQuestion = line.replace(/^q:\s*/i, '').replace(/^\d+\.\s*/, '').trim();
        currentAnswer = '';
      } else if (line && currentQuestion) {
        currentAnswer += (currentAnswer ? ' ' : '') + line.replace(/^a:\s*/i, '').trim();
      }
    }

    if (currentQuestion && currentAnswer) {
      faqs.push({
        question: currentQuestion,
        answer: currentAnswer
      });
    }

    return faqs.length > 0 ? faqs : [{
      question: 'How long does the procedure take?',
      answer: 'The duration varies depending on your specific needs. We will discuss timing during your consultation.'
    }];
  } catch (error) {
    return [{
      question: 'How long does the procedure take?',
      answer: 'The duration varies depending on your specific needs. We will discuss timing during your consultation.'
    }];
  }
}

function parseAfterCareFromLLM(content) {
  try {
    const lines = content.split('\n').filter(line => line.trim());
    const instructions = [];

    for (const line of lines) {
      if (line.includes('•') || line.includes('-') || line.includes('*') || line.match(/^\d+\./)) {
        const instruction = line.replace(/[•\-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        if (instruction) {
          let title = instruction.split('.')[0] || instruction;
          // Remove markdown formatting and truncate title if needed
          title = title.replace(/\*\*/g, '').replace(/\*/g, '').trim();
          if (title.length > 95) {
            title = title.substring(0, 95) + '...';
          }
          instructions.push({
            title: title,
            description: instruction,
            timeframe: extractTimeframe(instruction)
          });
        }
      }
    }

    return instructions.length > 0 ? instructions : [{
      title: 'Follow post-treatment instructions',
      description: 'Follow all post-treatment care instructions provided.',
      timeframe: 'First 24 hours'
    }];
  } catch (error) {
    return [{
      title: 'Follow post-treatment instructions',
      description: 'Follow all post-treatment care instructions provided.',
      timeframe: 'First 24 hours'
    }];
  }
}

function extractTimeframe(text) {
  const timeframes = ['24 hours', '48 hours', '1 week', '2 weeks', 'first day', 'first week'];
  for (const timeframe of timeframes) {
    if (text.toLowerCase().includes(timeframe)) {
      return timeframe;
    }
  }
  return null;
}

function parseSEOTitle(content, serviceName) {
  try {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('title') && line.length < 60) {
        return line.replace(/.*title\s*[:=]\s*/i, '').trim();
      }
    }
  } catch (error) {
    // Fall back to default
  }
  return `${serviceName} | Professional Dental Care`;
}

function parseSEODescription(content) {
  try {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('description') && line.length > 50 && line.length < 160) {
        return line.replace(/.*description\s*[:=]\s*/i, '').trim();
      }
    }
  } catch (error) {
    // Fall back to default
  }
  return 'Professional dental services with expert care and modern technology.';
}

function parseSEOKeywords(content) {
  try {
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('keywords')) {
        const keywordString = line.replace(/.*keywords\s*[:=]\s*/i, '').trim();
        return keywordString.split(',').map(k => k.trim()).filter(k => k);
      }
    }
  } catch (error) {
    // Fall back to default
  }
  return [];
}

/**
 * Get service pages for a website
 * GET /api/services/pages
 */
const getServicePages = async (req, res) => {
  try {
    const {
      websiteId,
      status = 'published',
      isIntegrated,
      page = 1,
      limit = 20
    } = req.query;

    if (!websiteId) {
      return res.status(400).json({
        success: false,
        message: 'Website ID is required'
      });
    }

    // Verify website belongs to the authenticated doctor
    const website = await Website.findOne({
      _id: websiteId,
      doctorId: req.user.id
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    const query = { websiteId, isActive: true };

    // Handle status filter
    if (status !== 'all') {
      query.status = status;
    }

    // Handle isIntegrated filter
    if (isIntegrated !== undefined) {
      if (isIntegrated === 'true') {
        query.isIntegrated = true;
      } else if (isIntegrated === 'false') {
        query.isIntegrated = false;
      }
    }

    const skip = (page - 1) * limit;
    const servicePages = await ServicePage.find(query)
      .populate('serviceId', 'name slug category')
      .sort({ 'serviceId.name': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ServicePage.countDocuments(query);

    res.json({
      success: true,
      data: servicePages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get service pages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service pages',
      error: error.message
    });
  }
};

/**
 * Create or update service page
 * POST /api/services/pages
 */
const createServicePage = async (req, res) => {
  try {
    const {
      websiteId,
      serviceId,
      content,
      seo,
      design,
      autoGenerate = false,
      isIntegrated = true
    } = req.body;

    // Verify website belongs to the authenticated doctor
    const website = await Website.findOne({
      _id: websiteId,
      doctorId: req.user.id
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Verify service exists
    const service = await DentalService.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check if service page already exists
    let servicePage = await ServicePage.findOne({ websiteId, serviceId });

    if (servicePage) {
      // Update existing page
      servicePage.content = content || servicePage.content;
      servicePage.seo = seo || servicePage.seo;
      servicePage.design = design || servicePage.design;
      servicePage.isIntegrated = isIntegrated;
      servicePage.lastModifiedBy = req.user.id;

      if (autoGenerate) {
        servicePage.generation.lastGenerated = new Date();
        servicePage.generation.generatedBy = 'google-ai'; // Default provider
      }

      await servicePage.save();

    } else {
      // Create new page
      const pageData = {
        websiteId,
        serviceId,
        doctorId: req.user.id,
        title: service.name,
        slug: service.slug,
        content: content || {},
        seo: seo || {
          metaTitle: service.seo.metaTitle,
          metaDescription: service.seo.metaDescription,
          keywords: service.seo.keywords
        },
        design: design || {},
        isIntegrated: isIntegrated,
        lastModifiedBy: req.user.id
      };

      if (autoGenerate) {
        pageData.generation = {
          lastGenerated: new Date(),
          generatedBy: 'google-ai'
        };
      }

      servicePage = new ServicePage(pageData);
      await servicePage.save();
    }

    // Populate service data for response
    await servicePage.populate('serviceId', 'name slug category');

    res.status(servicePage.isNew ? 201 : 200).json({
      success: true,
      data: servicePage,
      message: servicePage.isNew ? 'Service page created' : 'Service page updated'
    });

  } catch (error) {
    console.error('Create/update service page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update service page',
      error: error.message
    });
  }
};

/**
 * Get specific service page
 * GET /api/services/pages/:id
 */
const getServicePage = async (req, res) => {
  try {
    const { id } = req.params;

    const servicePage = await ServicePage.findById(id)
      .populate('serviceId')
      .populate('websiteId', 'name subdomain');

    if (!servicePage) {
      return res.status(404).json({
        success: false,
        message: 'Service page not found'
      });
    }

    // Increment view count
    await servicePage.incrementView();

    res.json({
      success: true,
      data: servicePage
    });

  } catch (error) {
    console.error('Get service page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service page',
      error: error.message
    });
  }
};

/**
 * Update service page
 * PUT /api/services/pages/:id
 */
const updateServicePage = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the service page
    const servicePage = await ServicePage.findById(id);

    if (!servicePage) {
      return res.status(404).json({
        success: false,
        message: 'Service page not found'
      });
    }

    // Check if user owns this service page (through website ownership)
    const website = await Website.findById(servicePage.websiteId);
    if (!website || website.doctorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this service page'
      });
    }

    // Update the service page
    Object.assign(servicePage, updateData);
    servicePage.updatedAt = new Date();
    servicePage.updatedBy = req.user.id;

    await servicePage.save();

    // Populate related data for response
    await servicePage.populate('serviceId', 'name slug category');

    res.json({
      success: true,
      data: servicePage,
      message: 'Service page updated successfully'
    });

  } catch (error) {
    console.error('Update service page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service page',
      error: error.message
    });
  }
};

/**
 * Get LLM provider status
 * GET /api/services/llm/status
 */
const getLLMStatus = async (req, res) => {
  try {
    const status = llmService.getProviderStatus();
    const cacheStats = llmService.getCacheStats();

    res.json({
      success: true,
      data: {
        providers: status,
        cache: cacheStats
      }
    });

  } catch (error) {
    console.error('Get LLM status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get LLM status',
      error: error.message
    });
  }
};

/**
 * Search services
 * GET /api/services/search
 */
const searchServices = async (req, res) => {
  try {
    const { q: searchTerm, categories, limit = 20 } = req.query;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters'
      });
    }

    const categoryArray = categories ? categories.split(',') : null;
    const services = await DentalService.search(searchTerm.trim(), categoryArray);

    res.json({
      success: true,
      data: services.slice(0, parseInt(limit)),
      searchTerm,
      categories: categoryArray
    });

  } catch (error) {
    console.error('Search services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search services',
      error: error.message
    });
  }
};

module.exports = {
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
};