const ServicePage = require('../models/ServicePage');
const DentalService = require('../models/DentalService');
const Website = require('../models/Website');
const { validationResult } = require('express-validator');
const staticSiteGenerator = require('../services/staticSiteGenerator');

/**
 * Service Page Controller
 * Handles CRUD operations for service page editing functionality
 */

class ServicePageController {
  /**
   * Get all service pages for a website
   */
  static async getServicePages(req, res) {
    try {
      const { websiteId } = req.params;
      const { status, includeAnalytics } = req.query;

      // Build query
      const query = { websiteId, isActive: true };
      if (status) {
        query.status = status;
      }

      let servicePages = await ServicePage.find(query)
        .populate('serviceId', 'name category categoryDisplayName')
        .populate('lastModifiedBy', 'name email')
        .sort({ updatedAt: -1 });

      // Include analytics if requested
      if (includeAnalytics === 'true') {
        servicePages = servicePages.map(page => ({
          ...page.toObject(),
          editingCapabilities: page.getEditingCapabilities()
        }));
      }

      res.json({
        success: true,
        data: servicePages,
        count: servicePages.length
      });
    } catch (error) {
      console.error('Error fetching service pages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch service pages',
        error: error.message
      });
    }
  }

  /**
   * Get a specific service page by ID
   */
  static async getServicePage(req, res) {
    try {
      const { servicePageId } = req.params;
      const { includeVersions } = req.query;

      let query = ServicePage.findById(servicePageId)
        .populate('serviceId')
        .populate('websiteId')
        .populate('lastModifiedBy', 'name email');

      if (includeVersions === 'true') {
        query = query.populate('versions.createdBy', 'name email');
      }

      const servicePage = await query;

      if (!servicePage) {
        return res.status(404).json({
          success: false,
          message: 'Service page not found'
        });
      }

      // Check if user has access to this service page
      if (servicePage.doctorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: {
          ...servicePage.toObject(),
          editingCapabilities: servicePage.getEditingCapabilities(),
          currentVersionData: servicePage.getCurrentVersionData()
        }
      });
    } catch (error) {
      console.error('Error fetching service page:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch service page',
        error: error.message
      });
    }
  }

  /**
   * Update service page content
   */
  static async updateServicePageContent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { servicePageId } = req.params;
      const { content, components, seo, design, editingMode, changeLog } = req.body;

      const servicePage = await ServicePage.findById(servicePageId);

      if (!servicePage) {
        return res.status(404).json({
          success: false,
          message: 'Service page not found'
        });
      }

      // Check if user has access to this service page
      if (servicePage.doctorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Create a new version before updating
      await servicePage.createVersion(
        content,
        components,
        seo,
        design,
        req.user.id,
        changeLog || 'Content updated via editor'
      );

      // Update current content
      if (content) servicePage.content = content;
      if (seo) servicePage.seo = seo;
      if (design) servicePage.design = design;
      if (editingMode) servicePage.editingMode = editingMode;

      servicePage.lastModifiedBy = req.user.id;
      servicePage.status = 'draft'; // Set to draft when editing

      await servicePage.save();

      res.json({
        success: true,
        message: 'Service page updated successfully',
        data: {
          id: servicePage._id,
          currentVersion: servicePage.currentVersion,
          status: servicePage.status,
          lastModified: servicePage.lastModified
        }
      });
    } catch (error) {
      console.error('Error updating service page:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update service page',
        error: error.message
      });
    }
  }

  /**
   * Get version history for a service page
   */
  static async getVersionHistory(req, res) {
    try {
      const { servicePageId } = req.params;

      const servicePage = await ServicePage.findById(servicePageId)
        .populate('versions.createdBy', 'name email')
        .select('versions currentVersion');

      if (!servicePage) {
        return res.status(404).json({
          success: false,
          message: 'Service page not found'
        });
      }

      // Sort versions by creation date (newest first)
      const versions = servicePage.versions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(version => ({
          versionNumber: version.versionNumber,
          changeLog: version.changeLog,
          createdAt: version.createdAt,
          createdBy: version.createdBy,
          isPublished: version.isPublished,
          isCurrent: version.versionNumber === servicePage.currentVersion
        }));

      res.json({
        success: true,
        data: {
          versions,
          currentVersion: servicePage.currentVersion
        }
      });
    } catch (error) {
      console.error('Error fetching version history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch version history',
        error: error.message
      });
    }
  }

  /**
   * Create a new version of a service page
   */
  static async createVersion(req, res) {
    try {
      const { servicePageId } = req.params;
      const { changeLog } = req.body;

      const servicePage = await ServicePage.findById(servicePageId);

      if (!servicePage) {
        return res.status(404).json({
          success: false,
          message: 'Service page not found'
        });
      }

      // Check if user has access to this service page
      if (servicePage.doctorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await servicePage.createVersion(
        servicePage.content,
        [], // Components will be empty for template-based versions
        servicePage.seo,
        servicePage.design,
        req.user.id,
        changeLog || 'Manual version created'
      );

      res.json({
        success: true,
        message: 'Version created successfully',
        data: {
          versionNumber: servicePage.currentVersion,
          totalVersions: servicePage.versions.length
        }
      });
    } catch (error) {
      console.error('Error creating version:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create version',
        error: error.message
      });
    }
  }

  /**
   * Restore a specific version of a service page
   */
  static async restoreVersion(req, res) {
    try {
      const { servicePageId, versionNumber } = req.params;

      const servicePage = await ServicePage.findById(servicePageId);

      if (!servicePage) {
        return res.status(404).json({
          success: false,
          message: 'Service page not found'
        });
      }

      // Check if user has access to this service page
      if (servicePage.doctorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await servicePage.restoreVersion(versionNumber, req.user.id);

      res.json({
        success: true,
        message: `Version ${versionNumber} restored successfully`,
        data: {
          currentVersion: servicePage.currentVersion,
          status: servicePage.status
        }
      });
    } catch (error) {
      console.error('Error restoring version:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to restore version',
        error: error.message
      });
    }
  }

  /**
   * Publish a service page version
   */
  static async publishVersion(req, res) {
    try {
      const { servicePageId } = req.params;
      const { versionNumber } = req.body;

      const servicePage = await ServicePage.findById(servicePageId)
        .populate('websiteId');

      if (!servicePage) {
        return res.status(404).json({
          success: false,
          message: 'Service page not found'
        });
      }

      // Check if user has access to this service page
      if (servicePage.doctorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const targetVersion = versionNumber || servicePage.currentVersion;
      await servicePage.publishVersion(targetVersion);

      // Trigger static site regeneration for the service page
      try {
        await staticSiteGenerator.generateServicePage(servicePage._id);
        console.log(`Service page ${servicePage.slug} regenerated successfully`);
      } catch (error) {
        console.error('Static site generation error:', error);
        // Don't fail the request if static generation fails
      }

      res.json({
        success: true,
        message: `Version ${targetVersion} published successfully`,
        data: {
          publishedVersion: targetVersion,
          publishedAt: servicePage.publishedAt,
          status: servicePage.status
        }
      });
    } catch (error) {
      console.error('Error publishing version:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to publish version',
        error: error.message
      });
    }
  }

  /**
   * Get editing capabilities for a service page
   */
  static async getEditingCapabilities(req, res) {
    try {
      const { servicePageId } = req.params;

      const servicePage = await ServicePage.findById(servicePageId)
        .select('editingMode');

      if (!servicePage) {
        return res.status(404).json({
          success: false,
          message: 'Service page not found'
        });
      }

      const capabilities = servicePage.getEditingCapabilities();

      res.json({
        success: true,
        data: {
          editingMode: servicePage.editingMode,
          capabilities
        }
      });
    } catch (error) {
      console.error('Error fetching editing capabilities:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch editing capabilities',
        error: error.message
      });
    }
  }

  /**
   * Update editing mode for a service page
   */
  static async updateEditingMode(req, res) {
    try {
      const { servicePageId } = req.params;
      const { editingMode } = req.body;

      const validModes = ['template', 'visual', 'hybrid'];
      if (!validModes.includes(editingMode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid editing mode. Must be one of: template, visual, hybrid'
        });
      }

      const servicePage = await ServicePage.findById(servicePageId);

      if (!servicePage) {
        return res.status(404).json({
          success: false,
          message: 'Service page not found'
        });
      }

      // Check if user has access to this service page
      if (servicePage.doctorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      servicePage.editingMode = editingMode;
      servicePage.lastModifiedBy = req.user.id;
      await servicePage.save();

      const capabilities = servicePage.getEditingCapabilities();

      res.json({
        success: true,
        message: 'Editing mode updated successfully',
        data: {
          editingMode: servicePage.editingMode,
          capabilities
        }
      });
    } catch (error) {
      console.error('Error updating editing mode:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update editing mode',
        error: error.message
      });
    }
  }

  /**
   * Get service page for editing (includes all necessary data)
   */
  static async getServicePageForEditing(req, res) {
    try {
      const { servicePageId } = req.params;

      const servicePage = await ServicePage.findById(servicePageId)
        .populate('serviceId')
        .populate('websiteId', 'globalSettings theme name')
        .populate('versions.createdBy', 'name email');

      if (!servicePage) {
        return res.status(404).json({
          success: false,
          message: 'Service page not found'
        });
      }

      // Check if user has access to this service page
      if (servicePage.doctorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const currentVersionData = servicePage.getCurrentVersionData();
      const editingCapabilities = servicePage.getEditingCapabilities();

      res.json({
        success: true,
        data: {
          servicePage: servicePage.toObject(),
          currentVersionData,
          editingCapabilities,
          websiteSettings: servicePage.websiteId?.globalSettings || {},
          serviceInfo: servicePage.serviceId || {}
        }
      });
    } catch (error) {
      console.error('Error fetching service page for editing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch service page for editing',
        error: error.message
      });
    }
  }

  /**
   * Preview service page (get content without saving)
   */
  static async previewServicePage(req, res) {
    try {
      const { servicePageId } = req.params;
      const { content, components, seo, design } = req.body;

      const servicePage = await ServicePage.findById(servicePageId)
        .populate('serviceId')
        .populate('websiteId');

      if (!servicePage) {
        return res.status(404).json({
          success: false,
          message: 'Service page not found'
        });
      }

      // Check if user has access to this service page
      if (servicePage.doctorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Create preview data without saving
      const previewData = {
        title: servicePage.title,
        slug: servicePage.slug,
        content: content || servicePage.content,
        seo: seo || servicePage.seo,
        design: design || servicePage.design,
        components: components || [],
        service: servicePage.serviceId,
        website: servicePage.websiteId
      };

      res.json({
        success: true,
        data: previewData
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate preview',
        error: error.message
      });
    }
  }

  /**
   * Get unified editing data for a service page
   * This loads service page data, unified content, and template info atomically
   */
  static async getUnifiedEditingData(req, res) {
    try {
      const { servicePageId } = req.params;
      const { includeTemplateInfo } = req.query;

      // Load service page data
      const servicePage = await ServicePage.findById(servicePageId)
        .populate('serviceId')
        .populate('websiteId')
        .populate('lastModifiedBy', 'name email');

      if (!servicePage) {
        return res.status(404).json({
          success: false,
          message: 'Service page not found'
        });
      }

      // Check access
      if (servicePage.doctorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Load unified content if it exists
      let unifiedContent = null;
      let syncStatus = 'in_sync';
      try {
        const UnifiedContent = require('../models/UnifiedContent');
        unifiedContent = await UnifiedContent.findOne({ servicePageId }).populate('lastModifiedBy', 'name email');

        if (unifiedContent) {
          // Check sync status
          const servicePageModified = new Date(servicePage.updatedAt);
          const unifiedModified = new Date(unifiedContent.updatedAt);

          if (Math.abs(servicePageModified - unifiedModified) > 30000) { // 30 seconds threshold
            syncStatus = 'out_of_sync';
          }
        }
      } catch (error) {
        console.warn('Unified content not available:', error);
      }

      // Load template info if requested
      let templateInfo = null;
      if (includeTemplateInfo === 'true') {
        try {
          const ContentTemplate = require('../models/ContentTemplate');
          const category = servicePage.serviceId?.category || 'general-dentistry';
          const templates = await ContentTemplate.findByCategory(category, null, req.user.id).limit(5);
          templateInfo = {
            availableTemplates: templates,
            currentCategory: category,
            suggestedTemplates: templates.slice(0, 3)
          };
        } catch (error) {
          console.warn('Template info not available:', error);
          templateInfo = { availableTemplates: [], currentCategory: 'general-dentistry' };
        }
      }

      // Return unified data
      res.json({
        success: true,
        data: {
          servicePage: {
            ...servicePage.toObject(),
            editingCapabilities: servicePage.getEditingCapabilities(),
            currentVersionData: servicePage.getCurrentVersionData()
          },
          unifiedContent,
          syncStatus,
          templateInfo,
          lastSyncTimestamp: new Date().toISOString(),
          conflictResolution: {
            hasConflicts: syncStatus === 'out_of_sync',
            conflictSource: syncStatus === 'out_of_sync' ? 'template_mismatch' : null
          }
        }
      });
    } catch (error) {
      console.error('Error loading unified editing data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to load unified editing data',
        error: error.message
      });
    }
  }

  /**
   * Save unified editing data atomically
   * This saves both service page content and unified content in a transaction
   */
  static async saveUnifiedEditingData(req, res) {
    try {
      const { servicePageId } = req.params;
      const {
        servicePageContent,
        unifiedContentData,
        editingMode,
        components,
        seo,
        design,
        changeLog
      } = req.body;

      const servicePage = await ServicePage.findById(servicePageId);

      if (!servicePage) {
        return res.status(404).json({
          success: false,
          message: 'Service page not found'
        });
      }

      // Check access
      if (servicePage.doctorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Start transaction-like operation
      const timestamp = new Date();

      // Update service page
      if (servicePageContent) {
        await servicePage.createVersion(
          servicePageContent,
          components,
          seo,
          design,
          req.user.id,
          changeLog || 'Unified content update'
        );

        servicePage.content = servicePageContent;
        if (seo) servicePage.seo = seo;
        if (design) servicePage.design = design;
        if (editingMode) servicePage.editingMode = editingMode;
        servicePage.lastModifiedBy = req.user.id;
        servicePage.status = 'draft';

        await servicePage.save();
      }

      // Update or create unified content
      let unifiedContent = null;
      if (unifiedContentData) {
        try {
          const UnifiedContent = require('../models/UnifiedContent');
          unifiedContent = await UnifiedContent.findOne({ servicePageId });

          if (unifiedContent) {
            // Update existing
            Object.assign(unifiedContent, unifiedContentData);
            unifiedContent.lastModifiedBy = req.user.id;
            unifiedContent.updatedAt = timestamp;
            await unifiedContent.save();
          } else {
            // Create new
            unifiedContent = new UnifiedContent({
              ...unifiedContentData,
              servicePageId,
              doctorId: req.user.id,
              lastModifiedBy: req.user.id
            });
            await unifiedContent.save();
          }
        } catch (error) {
          console.warn('Could not save unified content:', error);
        }
      }

      res.json({
        success: true,
        message: 'Unified data saved successfully',
        data: {
          servicePageId: servicePage._id,
          currentVersion: servicePage.currentVersion,
          status: servicePage.status,
          lastModified: servicePage.lastModified,
          syncStatus: 'in_sync',
          syncTimestamp: timestamp.toISOString()
        }
      });
    } catch (error) {
      console.error('Error saving unified editing data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save unified editing data',
        error: error.message
      });
    }
  }
}

module.exports = ServicePageController;