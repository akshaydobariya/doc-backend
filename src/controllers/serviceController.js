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
      customPrompt = null,
      websiteId = null // Optional website context for unique content generation
    } = req.body;

    // Get the service
    const service = await DentalService.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Get website context if provided
    let websiteContext = {};
    if (websiteId) {
      const website = await Website.findById(websiteId);
      if (website) {
        websiteContext = {
          websiteId: website._id,
          websiteName: website.name,
          doctorName: website.doctorName || 'Dr. Smith',
          practiceLocation: website.location || 'Our Practice'
        };
      }
    }

    if (contentType === 'full-page') {
      // Generate complete service page content
      const result = await llmService.generateServicePageContent({
        serviceName: service.name,
        category: service.category,
        keywords: keywords.length > 0 ? keywords : service.seo.keywords
      }, {
        provider,
        temperature,
        ...websiteContext
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
          customPrompt,
          ...websiteContext
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

    // Generate comprehensive 11-section content using LLM with website context
    console.log(`🎨 Generating comprehensive 11-section content for: ${serviceName} (Website: ${website.name})`);
    const llmResult = await llmService.generateComprehensiveDentalContent({
      serviceName,
      category: category || 'general-dentistry',
      keywords: keywords.length > 0 ? keywords : []
    }, {
      provider,
      temperature,
      comprehensive: true,
      // Pass website context for unique content generation
      websiteId: website._id,
      websiteName: website.name,
      doctorName: website.doctorName || 'Dr. Smith',
      practiceLocation: website.location || 'Our Practice'
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
        // 1. Introduction (100 words in simple patient terms)
        overview: {
          title: 'What is ' + serviceName + '?',
          content: llmResult.content.introduction?.content || `Professional ${serviceName} services with expert care and modern technology.`,
          highlights: []
        },

        // 2. What does it entail (500 words in 5 bullet points)
        benefits: {
          title: 'What Does ' + serviceName + ' Entail?',
          introduction: 'Here\'s what this treatment involves:',
          list: parseLLMContentToBulletPoints(llmResult.content.detailedExplanation?.content, 'What this treatment entails', 5)
        },

        // 3. Why undergo this treatment (500 words in 5 bullet points)
        procedure: {
          title: 'Why Do You Need ' + serviceName + '?',
          introduction: 'Reasons you may need this treatment:',
          steps: parseLLMContentToSteps(llmResult.content.treatmentNeed?.content, 'Treatment needs', 5)
        },

        // 4. Symptoms requiring treatment (500 words in 5 bullet points)
        symptoms: {
          title: 'Symptoms That Require ' + serviceName,
          introduction: 'Watch for these signs:',
          bulletPoints: parseLLMContentToBulletPoints(llmResult.content.symptoms?.content, 'Symptoms', 5)
        },

        // 5. Consequences if not performed (500 words in 5 bullet points)
        consequences: {
          title: 'Consequences of Delaying ' + serviceName,
          introduction: 'What happens if you delay treatment:',
          bulletPoints: parseLLMContentToBulletPoints(llmResult.content.consequences?.content, 'Consequences', 5)
        },

        // 6. Treatment procedure (500 words in 5 steps)
        procedureDetails: {
          title: serviceName + ' Procedure - Step by Step',
          steps: parseLLMContentToSteps(llmResult.content.procedureSteps?.content, serviceName + ' procedure', 5),
          totalWordCount: llmResult.content.procedureSteps?.wordCount || 0
        },

        // 7. Post-treatment care (500 words in 5 bullet points)
        aftercare: {
          title: 'Post-Treatment Care for ' + serviceName,
          showSection: true,
          introduction: 'Important aftercare instructions:',
          instructions: parseAfterCareFromLLM(llmResult.content.postTreatmentCare?.content || 'Follow standard aftercare procedures.'),
          warnings: []
        },

        // 8. Benefits (500 words in 5 bullet points)
        detailedBenefits: {
          title: 'Benefits of ' + serviceName,
          introduction: 'Key advantages of this treatment:',
          bulletPoints: parseLLMContentToBulletPoints(llmResult.content.procedureBenefits?.content, 'Benefits', 5)
        },

        // 9. Side effects (500 words in 5 bullet points)
        sideEffects: {
          title: 'Potential Side Effects of ' + serviceName,
          introduction: 'What to expect and watch for:',
          bulletPoints: parseLLMContentToBulletPoints(llmResult.content.sideEffects?.content, 'Side effects', 5)
        },

        // 10. Myths and facts (500 words - 5 myths/facts)
        mythsAndFacts: {
          title: serviceName + ': Myths vs Facts',
          introduction: 'Common misconceptions and truths:',
          items: parseLLMContentToMythsAndFacts(llmResult.content.mythsAndFacts?.content, serviceName, 5),
          totalWordCount: llmResult.content.mythsAndFacts?.wordCount || 0
        },

        // 11. Comprehensive FAQ (25 questions with 100-word answers)
        faq: {
          title: 'Frequently Asked Questions About ' + serviceName,
          introduction: 'Comprehensive answers to your questions:',
          questions: parseLLMContentToFAQ(llmResult.content.comprehensiveFAQ?.content, serviceName, 25)
        },

        // Call-to-action section
        cta: {
          title: `Ready for ${serviceName}?`,
          subtitle: `Schedule your ${serviceName} consultation today.`,
          buttonText: 'Book Consultation',
          phoneNumber: '(555) 123-4567',
          backgroundColor: '#1976d2'
        },

        // Hero section
        hero: {
          ctaText: 'Book Appointment'
        },

        // Pricing section (hidden by default)
        pricing: {
          title: 'Pricing',
          showPricing: false,
          plans: []
        },

        // Before & After section (hidden by default)
        beforeAfter: {
          title: 'Before & After',
          showSection: false,
          gallery: []
        },

        // Custom sections (empty by default)
        customSections: [],

        // Comprehensive content sections for detailed dental service information
        comprehensiveContent: {
          // 1. Introduction (100 words in simple patient terms)
          introduction: {
            content: llmResult.content.introduction?.content || `Professional ${serviceName} services with expert care and modern technology.`,
            wordCount: llmResult.content.introduction?.wordCount || 0
          },

          // 2. What does it entail - Detailed explanation (500 words in 5 bullet points)
          detailedExplanation: {
            title: 'What Does This Treatment Entail?',
            bulletPoints: parseLLMContentToBulletPoints(llmResult.content.detailedExplanation?.content, 'What this treatment entails', 5),
            totalWordCount: llmResult.content.detailedExplanation?.wordCount || 0
          },

          // 3. Why does one need to undergo this treatment (500 words in 5 bullet points)
          treatmentNeed: {
            title: 'Why Do You Need This Treatment?',
            bulletPoints: parseLLMContentToBulletPoints(llmResult.content.treatmentNeed?.content, 'Treatment needs', 5),
            totalWordCount: llmResult.content.treatmentNeed?.wordCount || 0
          },

          // 4. Symptoms for which this treatment is required (500 words in 5 bullet points)
          symptoms: {
            title: 'Signs You May Need This Treatment',
            bulletPoints: parseLLMContentToBulletPoints(llmResult.content.symptoms?.content, 'Symptoms', 5),
            totalWordCount: llmResult.content.symptoms?.wordCount || 0
          },

          // 5. Consequences when this treatment is not performed (500 words in 5 bullet points)
          consequences: {
            title: 'What Happens If Treatment Is Delayed?',
            bulletPoints: parseLLMContentToBulletPoints(llmResult.content.consequences?.content, 'Consequences', 5),
            totalWordCount: llmResult.content.consequences?.wordCount || 0
          },

          // 6. What is the procedure for this treatment - 5 steps (500 words)
          procedureDetails: {
            title: 'Step-by-Step Procedure',
            steps: parseLLMContentToSteps(llmResult.content.procedureSteps?.content, serviceName + ' procedure', 5),
            totalWordCount: llmResult.content.procedureSteps?.wordCount || 0
          },

          // 7. Post-treatment care (500 words in 5 bullet points)
          postTreatmentCare: {
            title: 'Post-Treatment Care Instructions',
            bulletPoints: parseLLMContentToBulletPoints(llmResult.content.postTreatmentCare?.content, 'Aftercare', 5),
            totalWordCount: llmResult.content.postTreatmentCare?.wordCount || 0
          },

          // 8. Benefits of this procedure (500 words in 5 bullet points)
          detailedBenefits: {
            title: 'Benefits of This Treatment',
            bulletPoints: parseLLMContentToBulletPoints(llmResult.content.procedureBenefits?.content, 'Benefits', 5),
            totalWordCount: llmResult.content.procedureBenefits?.wordCount || 0
          },

          // 9. Side effects (500 words in 5 bullet points)
          sideEffects: {
            title: 'Potential Side Effects',
            bulletPoints: parseLLMContentToBulletPoints(llmResult.content.sideEffects?.content, 'Side effects', 5),
            totalWordCount: llmResult.content.sideEffects?.wordCount || 0
          },

          // 10. Myths and facts (500 words - 5 myths and facts)
          mythsAndFacts: {
            title: 'Common Myths and Facts',
            items: parseLLMContentToMythsAndFacts(llmResult.content.mythsAndFacts?.content, serviceName, 5),
            totalWordCount: llmResult.content.mythsAndFacts?.wordCount || 0
          },

          // 11. Comprehensive FAQs (25 FAQs with 100-word answers)
          comprehensiveFAQ: {
            title: 'Comprehensive FAQ',
            questions: parseLLMContentToFAQ(llmResult.content.comprehensiveFAQ?.content, serviceName, 25),
            totalQuestions: llmResult.content.comprehensiveFAQ?.questions?.length || 0
          }
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
    // Clean content first
    const cleanedContent = content
      .replace(/\*\*Answer:\*\*\s*/gi, '')
      .replace(/\*\*Question:\*\*\s*/gi, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/Answer:\s*/gi, '')
      .replace(/Question:\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const lines = cleanedContent.split('\n').filter(line => line.trim());
    const benefits = [];

    for (const line of lines) {
      if ((line.includes('•') || line.includes('-') || line.includes('*')) && benefits.length < 5) {
        const benefit = line.replace(/[•\-*]\s*/, '').trim();
        if (benefit) {
          const parts = benefit.split(':');
          let title = parts[0]?.trim() || benefit;
          let description = parts[1]?.trim() || '';

          // Super aggressive limits
          title = title.substring(0, 60); // Force 60 chars max for 100 schema limit
          description = description.substring(0, 200); // Force 200 chars max for 300 schema limit

          benefits.push({
            title: title,
            description: description
          });
        }
      }
    }

    // Ensure exactly 5 benefits
    while (benefits.length < 5) {
      benefits.push({
        title: `Benefit ${benefits.length + 1}`,
        description: 'Professional dental care benefit.'
      });
    }

    return benefits.slice(0, 5); // Force exactly 5
  } catch (error) {
    return Array(5).fill().map((_, i) => ({
      title: `Benefit ${i + 1}`,
      description: 'Professional dental care benefit.'
    }));
  }
}

function parseStepsFromLLM(content) {
  try {
    // Clean content first
    const cleanedContent = content
      .replace(/\*\*Answer:\*\*\s*/gi, '')
      .replace(/\*\*Question:\*\*\s*/gi, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/Answer:\s*/gi, '')
      .replace(/Question:\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const lines = cleanedContent.split('\n').filter(line => line.trim());
    const steps = [];
    let stepNumber = 1;

    for (const line of lines) {
      if ((line.match(/^\d+\./) || line.includes('Step') || line.includes('•') || line.includes('-')) && steps.length < 5) {
        const step = line.replace(/^\d+\.\s*/, '').replace(/Step\s*\d+\s*[:\-]?\s*/i, '').replace(/[•\-]\s*/, '').trim();
        if (step) {
          const parts = step.split(':');
          let title = parts[0]?.trim() || `Step ${stepNumber}`;
          let description = parts[1]?.trim() || step;

          // ULTRA AGGRESSIVE LIMITS (schema shows 100/500 limits, not 150/500)
          title = title.substring(0, 80); // Force 80 chars max for 100 schema limit
          description = description.substring(0, 400); // Force 400 chars max for 500 schema limit

          steps.push({
            stepNumber: stepNumber++,
            title: title,
            description: description
          });
        }
      }
    }

    // Ensure exactly 5 steps
    while (steps.length < 5) {
      steps.push({
        stepNumber: steps.length + 1,
        title: `Step ${steps.length + 1}`,
        description: 'Additional procedure details.'
      });
    }

    return steps.slice(0, 5); // Force exactly 5
  } catch (error) {
    return Array(5).fill().map((_, i) => ({
      stepNumber: i + 1,
      title: `Step ${i + 1}`,
      description: 'Procedure step details.'
    }));
  }
}

function parseFAQFromLLM(content) {
  try {
    // Clean content first - SUPER AGGRESSIVE
    const cleanedContent = content
      .replace(/\*\*Answer:\*\*\s*/gi, '')
      .replace(/\*\*Question:\*\*\s*/gi, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/Answer:\s*/gi, '')
      .replace(/Question:\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const lines = cleanedContent.split('\n').filter(line => line.trim());
    const faqs = [];
    let currentQuestion = '';
    let currentAnswer = '';

    for (let i = 0; i < lines.length && faqs.length < 10; i++) { // Limit to 10 FAQs max
      const line = lines[i].trim();

      if (line.includes('?') || line.toLowerCase().includes('q:') || line.toLowerCase().includes('question')) {
        if (currentQuestion && currentAnswer) {
          faqs.push({
            question: currentQuestion.substring(0, 150), // Super aggressive: 150 for 200 limit
            answer: currentAnswer.substring(0, 700) // Super aggressive: 700 for 1000 limit
          });
        }
        currentQuestion = line.replace(/^q:\s*/i, '').replace(/^\d+\.\s*/, '').trim();
        currentAnswer = '';
      } else if (line && currentQuestion) {
        const additionalAnswer = line.replace(/^a:\s*/i, '').trim();
        if (currentAnswer.length + additionalAnswer.length <= 700) {
          currentAnswer += (currentAnswer ? ' ' : '') + additionalAnswer;
        }
      }
    }

    if (currentQuestion && currentAnswer && faqs.length < 10) {
      faqs.push({
        question: currentQuestion.substring(0, 150), // Super aggressive: 150 for 200 limit
        answer: currentAnswer.substring(0, 700) // Super aggressive: 700 for 1000 limit
      });
    }

    // Ensure we have at least 1 FAQ but not more than 10
    if (faqs.length === 0) {
      faqs.push({
        question: 'How long does the procedure take?',
        answer: 'Duration varies by individual needs. We discuss timing during consultation.'
      });
    }

    return faqs.slice(0, 10); // Force max 10 FAQs
  } catch (error) {
    return [{
      question: 'How long does the procedure take?',
      answer: 'Duration varies by individual needs. We discuss timing during consultation.'
    }];
  }
}

function parseAfterCareFromLLM(content) {
  try {
    // Enhanced content cleaning to remove formatting patterns
    const cleanedContent = content
      .replace(/\*\*Answer:\*\*\s*/gi, '')
      .replace(/\*\*Question:\*\*\s*/gi, '')
      .replace(/\*\*Instruction:\*\*\s*/gi, '')
      .replace(/\*\*Step:\*\*\s*/gi, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .trim();

    const lines = cleanedContent.split('\n').filter(line => line.trim());
    const instructions = [];

    // SUPER AGGRESSIVE LIMIT: Maximum 8 aftercare instructions (vs potential 50+ from LLM)
    for (const line of lines) {
      if ((line.includes('•') || line.includes('-') || line.includes('*') || line.match(/^\d+\./)) && instructions.length < 8) {
        const instruction = line.replace(/[•\-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        if (instruction && instruction.length > 3) { // Ensure meaningful content
          let title = instruction.split('.')[0] || instruction.split(':')[0] || instruction;
          let description = instruction;

          // Super aggressive content cleaning
          title = title.replace(/\*\*/g, '').replace(/\*/g, '').trim();
          description = description.replace(/\*\*/g, '').replace(/\*/g, '').trim();

          // SUPER AGGRESSIVE LIMITS (vs schema limits of 100/250)
          title = title.substring(0, 80).trim(); // 80 chars for 100 schema limit
          description = description.substring(0, 200).trim(); // 200 chars for 250 schema limit

          // Ensure title is not empty after cleaning
          if (!title || title.length < 3) {
            title = `Aftercare Step ${instructions.length + 1}`;
          }

          // Ensure description is not empty
          if (!description || description.length < 10) {
            description = 'Follow the recommended aftercare procedures for optimal healing.';
          }

          instructions.push({
            title: title,
            description: description,
            timeframe: extractTimeframe(instruction) || 'First 24 hours'
          });
        }
      }
    }

    // FORCE EXACTLY 5 INSTRUCTIONS (prevent instruction #42 errors)
    if (instructions.length === 0) {
      // Default instructions if none parsed
      instructions.push(
        {
          title: 'Follow post-treatment instructions',
          description: 'Follow all post-treatment care instructions provided by your dentist.',
          timeframe: 'First 24 hours'
        },
        {
          title: 'Take prescribed medications',
          description: 'Take any prescribed medications as directed for optimal recovery.',
          timeframe: 'As prescribed'
        },
        {
          title: 'Apply ice if recommended',
          description: 'Apply ice packs as recommended to reduce swelling and discomfort.',
          timeframe: 'First 24 hours'
        },
        {
          title: 'Avoid hard foods',
          description: 'Stick to soft foods and avoid hard or crunchy items initially.',
          timeframe: 'First 48 hours'
        },
        {
          title: 'Schedule follow-up',
          description: 'Schedule and attend your follow-up appointment as recommended.',
          timeframe: '1-2 weeks'
        }
      );
    }

    // ENSURE EXACTLY 5 INSTRUCTIONS (no more instruction #42 errors)
    const finalInstructions = instructions.slice(0, 5);

    // Fill to exactly 5 if needed
    while (finalInstructions.length < 5) {
      finalInstructions.push({
        title: `Care Step ${finalInstructions.length + 1}`,
        description: 'Follow additional care instructions as provided by your dental professional.',
        timeframe: 'As needed'
      });
    }

    return finalInstructions;
  } catch (error) {
    // Safety fallback: always return exactly 5 instructions
    return [
      {
        title: 'Follow post-treatment instructions',
        description: 'Follow all post-treatment care instructions provided by your dentist.',
        timeframe: 'First 24 hours'
      },
      {
        title: 'Take prescribed medications',
        description: 'Take any prescribed medications as directed for optimal recovery.',
        timeframe: 'As prescribed'
      },
      {
        title: 'Apply ice if recommended',
        description: 'Apply ice packs as recommended to reduce swelling and discomfort.',
        timeframe: 'First 24 hours'
      },
      {
        title: 'Avoid hard foods',
        description: 'Stick to soft foods and avoid hard or crunchy items initially.',
        timeframe: 'First 48 hours'
      },
      {
        title: 'Schedule follow-up',
        description: 'Schedule and attend your follow-up appointment as recommended.',
        timeframe: '1-2 weeks'
      }
    ];
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

// Helper functions for default content generation
function generateDefaultBulletPoints(topic, count = 5) {
  const points = [];
  for (let i = 1; i <= count; i++) {
    points.push({
      title: `${topic} Point ${i}`,
      content: `Important information about ${topic.toLowerCase()} that helps patients understand this aspect of treatment.`
    });
  }
  return points;
}

function generateDefaultSteps(serviceName, count = 5) {
  const steps = [];
  for (let i = 1; i <= count; i++) {
    steps.push({
      stepNumber: i,
      title: `Step ${i}`,
      description: `Professional ${serviceName} procedure step performed by your dental team.`
    });
  }
  return steps;
}

function generateDefaultMythsAndFacts(serviceName, count = 5) {
  const items = [];
  for (let i = 1; i <= count; i++) {
    items.push({
      myth: `Common myth about ${serviceName} that patients often believe.`,
      fact: `The actual truth about ${serviceName} based on current dental science and practice.`
    });
  }
  return items;
}

function generateDefaultFAQ(serviceName, count = 25) {
  const questions = [];
  const topics = [
    'procedure duration', 'cost and insurance', 'pain and discomfort', 'recovery time',
    'candidacy requirements', 'preparation needed', 'follow-up care', 'results timeline',
    'alternative treatments', 'risks and complications', 'success rates', 'maintenance',
    'lifestyle changes', 'age considerations', 'medical history', 'technology used',
    'aftercare instructions', 'appointment scheduling', 'emergency procedures', 'long-term effects',
    'preventive measures', 'treatment comparison', 'specialist referrals', 'insurance coverage',
    'second opinions'
  ];

  for (let i = 0; i < Math.min(count, topics.length); i++) {
    questions.push({
      question: `What should I know about ${topics[i]} for ${serviceName}?`,
      answer: `This is important information about ${topics[i]} related to ${serviceName}. Your dental professional will provide detailed guidance specific to your individual needs and circumstances during your consultation.`
    });
  }

  // Fill remaining slots if needed
  while (questions.length < count) {
    const index = questions.length + 1;
    questions.push({
      question: `What is question ${index} about ${serviceName}?`,
      answer: `This is comprehensive information about ${serviceName} that addresses common patient concerns and provides helpful guidance for treatment decisions.`
    });
  }

  return questions;
}

// Parse LLM text content into structured bullet points
function parseLLMContentToBulletPoints(content, fallbackTopic = 'treatment', count = 5) {
  if (!content || typeof content !== 'string') {
    return generateDefaultBulletPoints(fallbackTopic, count);
  }

  const bulletPoints = [];

  // Try to extract bullet points from LLM content
  // Look for patterns like "* **Title:** Description" or "1. **Title:** Description"
  const bulletRegex = /(?:^\s*[\*\-\+\d\.]\s*)?[\*\*]*([^:*\n]+?)[\*\*]*:\s*([^\n]+)/gm;
  let match;

  while ((match = bulletRegex.exec(content)) && bulletPoints.length < count) {
    const title = match[1].trim().replace(/^\d+\.\s*/, '').replace(/^\*+\s*/, '');
    const contentText = match[2].trim();

    if (title && contentText) {
      bulletPoints.push({
        title: title.substring(0, 60), // Limit title to 60 chars
        content: contentText.substring(0, 200) // Limit content to 200 chars
      });
    }
  }

  // If we couldn't parse enough bullet points, try alternative patterns
  if (bulletPoints.length < 3) {
    const lines = content.split('\n').filter(line => line.trim());
    for (const line of lines) {
      if (bulletPoints.length >= count) break;

      // Look for lines that start with numbers, bullets, or asterisks
      if (/^\s*[\*\-\+\d\.]\s/.test(line)) {
        const cleanLine = line.replace(/^\s*[\*\-\+\d\.]\s*/, '').trim();
        if (cleanLine.length > 10) {
          // Split on first colon or use first part as title
          const colonIndex = cleanLine.indexOf(':');
          if (colonIndex > 0) {
            const title = cleanLine.substring(0, colonIndex).trim().substring(0, 60);
            const content = cleanLine.substring(colonIndex + 1).trim().substring(0, 200);
            bulletPoints.push({ title, content });
          } else {
            // Use whole line as content with generic title
            bulletPoints.push({
              title: `${fallbackTopic} Point ${bulletPoints.length + 1}`,
              content: cleanLine.substring(0, 200)
            });
          }
        }
      }
    }
  }

  // Fill remaining slots with defaults if needed
  while (bulletPoints.length < count) {
    bulletPoints.push({
      title: `${fallbackTopic} Point ${bulletPoints.length + 1}`,
      content: `Important information about ${fallbackTopic.toLowerCase()} that helps patients understand this aspect of treatment.`
    });
  }

  return bulletPoints.slice(0, count);
}

// Parse LLM content into procedure steps
function parseLLMContentToSteps(content, fallbackTopic = 'Treatment', count = 5) {
  const bulletPoints = parseLLMContentToBulletPoints(content, fallbackTopic, count);
  return convertBulletPointsToSteps(bulletPoints);
}

// Parse LLM content into FAQ format
function parseLLMContentToFAQ(content, serviceName, maxQuestions = 25) {
  if (!content || typeof content !== 'string') {
    return generateDefaultFAQ(serviceName, maxQuestions);
  }

  const questions = [];

  // Look for Q: and A: patterns
  const qaPairs = content.split(/Q:|(?=Q:)/).filter(part => part.trim());

  for (const pair of qaPairs) {
    if (questions.length >= maxQuestions) break;

    const qMatch = pair.match(/^[:\s]*([^A:]+?)A:\s*(.+?)(?=Q:|$)/s);
    if (qMatch) {
      const question = qMatch[1].trim().replace(/\n/g, ' ').substring(0, 150);
      const answer = qMatch[2].trim().replace(/\n/g, ' ').substring(0, 700);

      if (question && answer) {
        questions.push({
          question: question,
          answer: answer,
          order: questions.length
        });
      }
    }
  }

  // If we couldn't parse enough questions, fill with defaults
  while (questions.length < Math.min(maxQuestions, 10)) {
    const defaultQuestions = generateDefaultFAQ(serviceName, maxQuestions);
    questions.push(...defaultQuestions.slice(questions.length));
  }

  return questions.slice(0, maxQuestions);
}

// Parse LLM content into myths and facts format
function parseLLMContentToMythsAndFacts(content, serviceName, count = 5) {
  if (!content || typeof content !== 'string') {
    return generateDefaultMythsAndFacts(serviceName, count);
  }

  const items = [];

  // Look for "Myth X:" and "Fact X:" patterns
  const mythFactPattern = /Myth\s*\d*:\s*([^\n]+)\s*Fact\s*\d*:\s*([^\n]+)/gi;
  let match;

  while ((match = mythFactPattern.exec(content)) && items.length < count) {
    const myth = match[1].trim();
    const fact = match[2].trim();

    if (myth && fact) {
      items.push({
        myth: myth.substring(0, 150),
        fact: fact.substring(0, 150)
      });
    }
  }

  // If we couldn't parse enough myths/facts, try alternative patterns
  if (items.length < 3) {
    const sections = content.split(/myth|fact/i).filter(s => s.trim());
    for (let i = 0; i < sections.length - 1 && items.length < count; i += 2) {
      if (sections[i] && sections[i + 1]) {
        items.push({
          myth: sections[i].replace(/^\d+:?\s*/, '').trim().substring(0, 150),
          fact: sections[i + 1].replace(/^\d+:?\s*/, '').trim().substring(0, 150)
        });
      }
    }
  }

  // Fill remaining slots with defaults if needed
  while (items.length < count) {
    items.push({
      myth: `Common myth about ${serviceName} that patients often believe.`,
      fact: `The actual truth about ${serviceName} based on current dental science and practice.`
    });
  }

  return items.slice(0, count);
}

// Parse LLM content into aftercare instructions format
function parseAfterCareFromLLM(content) {
  if (!content || typeof content !== 'string') {
    return [
      {
        title: 'Follow Standard Care',
        description: 'Follow standard aftercare procedures.',
        timeframe: 'First 24 hours'
      }
    ];
  }

  const instructions = [];

  // Look for numbered or bullet point instructions
  const instructionRegex = /(?:^\s*[\*\-\+\d\.]\s*)?[\*\*]*([^:*\n]+?)[\*\*]*:\s*([^\n]+)/gm;
  let match;

  while ((match = instructionRegex.exec(content)) && instructions.length < 5) {
    const title = match[1].trim().replace(/^\d+\.\s*/, '').substring(0, 80);
    const description = match[2].trim().substring(0, 200);

    if (title && description) {
      instructions.push({
        title: title,
        description: description,
        timeframe: 'First 24 hours'
      });
    }
  }

  // If we couldn't parse enough instructions, try line-by-line
  if (instructions.length < 3) {
    const lines = content.split('\n').filter(line => line.trim());
    for (const line of lines) {
      if (instructions.length >= 5) break;

      if (/^\s*[\*\-\+\d\.]\s/.test(line)) {
        const cleanLine = line.replace(/^\s*[\*\-\+\d\.]\s*/, '').trim();
        if (cleanLine.length > 10) {
          const colonIndex = cleanLine.indexOf(':');
          if (colonIndex > 0) {
            instructions.push({
              title: cleanLine.substring(0, colonIndex).trim().substring(0, 80),
              description: cleanLine.substring(colonIndex + 1).trim().substring(0, 200),
              timeframe: 'First 24 hours'
            });
          } else {
            instructions.push({
              title: cleanLine.substring(0, 80),
              description: cleanLine.substring(0, 200),
              timeframe: 'First 24 hours'
            });
          }
        }
      }
    }
  }

  // Ensure we have at least one instruction
  if (instructions.length === 0) {
    instructions.push({
      title: 'Follow Care Instructions',
      description: 'Follow the care instructions provided by your dental professional.',
      timeframe: 'First 24 hours'
    });
  }

  return instructions.slice(0, 5);
}

// Convert bullet points to steps format (with required stepNumber field)
function convertBulletPointsToSteps(bulletPoints) {
  if (!bulletPoints || !Array.isArray(bulletPoints)) {
    return generateDefaultSteps('Treatment', 5);
  }

  return bulletPoints.map((point, index) => ({
    stepNumber: index + 1,
    title: point.title || `Step ${index + 1}`,
    description: point.content || point.description || 'Important treatment information.'
  }));
}

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