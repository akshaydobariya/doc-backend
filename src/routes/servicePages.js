const express = require('express');
const { body, param, query } = require('express-validator');
const ServicePageController = require('../controllers/servicePageController');
const { authMiddleware, requireDoctor } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Service Pages Routes
 * Handles all endpoints for service page editing functionality
 */

// Validation middleware
const validateServicePageId = [
  param('servicePageId').isMongoId().withMessage('Invalid service page ID')
];

const validateWebsiteId = [
  param('websiteId').isMongoId().withMessage('Invalid website ID')
];

const validateVersionNumber = [
  param('versionNumber').matches(/^\d+\.\d+$/).withMessage('Invalid version number format (expected: major.minor)')
];

const validateUpdateContent = [
  body('content').optional().isObject().withMessage('Content must be an object'),
  body('components').optional().isArray().withMessage('Components must be an array'),
  body('seo').optional().isObject().withMessage('SEO must be an object'),
  body('design').optional().isObject().withMessage('Design must be an object'),
  body('editingMode').optional().isIn(['template', 'visual', 'hybrid']).withMessage('Invalid editing mode'),
  body('changeLog').optional().isString().isLength({ max: 500 }).withMessage('Change log must be a string with max 500 characters')
];

const validateEditingMode = [
  body('editingMode').isIn(['template', 'visual', 'hybrid']).withMessage('Invalid editing mode')
];

const validatePublishVersion = [
  body('versionNumber').optional().matches(/^\d+\.\d+$/).withMessage('Invalid version number format')
];

const validateCreateVersion = [
  body('changeLog').optional().isString().isLength({ max: 500 }).withMessage('Change log must be a string with max 500 characters')
];

const validatePreview = [
  body('content').optional().isObject().withMessage('Content must be an object'),
  body('components').optional().isArray().withMessage('Components must be an array'),
  body('seo').optional().isObject().withMessage('SEO must be an object'),
  body('design').optional().isObject().withMessage('Design must be an object')
];

// Apply authentication to all routes
router.use(authMiddleware);
router.use(requireDoctor);

/**
 * @route   GET /api/service-pages/website/:websiteId
 * @desc    Get all service pages for a website
 * @access  Private (Doctor only)
 * @query   status - Filter by status (draft, published, archived)
 * @query   includeAnalytics - Include analytics and editing capabilities (true/false)
 */
router.get('/website/:websiteId',
  validateWebsiteId,
  query('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  query('includeAnalytics').optional().isBoolean().withMessage('includeAnalytics must be a boolean'),
  ServicePageController.getServicePages
);

/**
 * @route   GET /api/service-pages/:servicePageId
 * @desc    Get a specific service page by ID
 * @access  Private (Doctor only)
 * @query   includeVersions - Include version history (true/false)
 */
router.get('/:servicePageId',
  validateServicePageId,
  query('includeVersions').optional().isBoolean().withMessage('includeVersions must be a boolean'),
  ServicePageController.getServicePage
);

/**
 * @route   GET /api/service-pages/:servicePageId/edit
 * @desc    Get service page data formatted for editing
 * @access  Private (Doctor only)
 */
router.get('/:servicePageId/edit',
  validateServicePageId,
  ServicePageController.getServicePageForEditing
);

/**
 * @route   PUT /api/service-pages/:servicePageId/content
 * @desc    Update service page content (creates new version)
 * @access  Private (Doctor only)
 */
router.put('/:servicePageId/content',
  validateServicePageId,
  validateUpdateContent,
  ServicePageController.updateServicePageContent
);

/**
 * @route   GET /api/service-pages/:servicePageId/versions
 * @desc    Get version history for a service page
 * @access  Private (Doctor only)
 */
router.get('/:servicePageId/versions',
  validateServicePageId,
  ServicePageController.getVersionHistory
);

/**
 * @route   POST /api/service-pages/:servicePageId/versions
 * @desc    Create a new version of a service page
 * @access  Private (Doctor only)
 */
router.post('/:servicePageId/versions',
  validateServicePageId,
  validateCreateVersion,
  ServicePageController.createVersion
);

/**
 * @route   PUT /api/service-pages/:servicePageId/restore/:versionNumber
 * @desc    Restore a specific version of a service page
 * @access  Private (Doctor only)
 */
router.put('/:servicePageId/restore/:versionNumber',
  validateServicePageId,
  validateVersionNumber,
  ServicePageController.restoreVersion
);

/**
 * @route   POST /api/service-pages/:servicePageId/publish
 * @desc    Publish a service page version
 * @access  Private (Doctor only)
 */
router.post('/:servicePageId/publish',
  validateServicePageId,
  validatePublishVersion,
  ServicePageController.publishVersion
);

/**
 * @route   GET /api/service-pages/:servicePageId/capabilities
 * @desc    Get editing capabilities for a service page
 * @access  Private (Doctor only)
 */
router.get('/:servicePageId/capabilities',
  validateServicePageId,
  ServicePageController.getEditingCapabilities
);

/**
 * @route   PUT /api/service-pages/:servicePageId/editing-mode
 * @desc    Update editing mode for a service page
 * @access  Private (Doctor only)
 */
router.put('/:servicePageId/editing-mode',
  validateServicePageId,
  validateEditingMode,
  ServicePageController.updateEditingMode
);

/**
 * @route   POST /api/service-pages/:servicePageId/preview
 * @desc    Preview service page content without saving
 * @access  Private (Doctor only)
 */
router.post('/:servicePageId/preview',
  validateServicePageId,
  validatePreview,
  ServicePageController.previewServicePage
);

/**
 * @route   GET /api/service-pages/:servicePageId/unified-data
 * @desc    Get unified editing data (service page + unified content + template info)
 * @access  Private (Doctor only)
 */
router.get('/:servicePageId/unified-data',
  validateServicePageId,
  ServicePageController.getUnifiedEditingData
);

/**
 * @route   PUT /api/service-pages/:servicePageId/unified-data
 * @desc    Save unified editing data atomically
 * @access  Private (Doctor only)
 */
router.put('/:servicePageId/unified-data',
  validateServicePageId,
  [
    body('servicePageContent').optional().isObject().withMessage('Service page content must be an object'),
    body('unifiedContentData').optional().isObject().withMessage('Unified content data must be an object'),
    body('editingMode').optional().isIn(['template', 'visual', 'hybrid']).withMessage('Invalid editing mode'),
    body('components').optional().isArray().withMessage('Components must be an array'),
    body('seo').optional().isObject().withMessage('SEO must be an object'),
    body('design').optional().isObject().withMessage('Design must be an object'),
    body('changeLog').optional().isString().isLength({ max: 500 }).withMessage('Change log must be a string with max 500 characters')
  ],
  ServicePageController.saveUnifiedEditingData
);

module.exports = router;