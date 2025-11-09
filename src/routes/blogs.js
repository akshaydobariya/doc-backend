const express = require('express');
const { body, param, query } = require('express-validator');
const BlogController = require('../controllers/blogController');
const { authMiddleware, requireDoctor } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Blog Routes
 * Supports both public blog viewing and admin blog management
 */

// Validation middleware
const validateBlogId = [
  param('blogId').isMongoId().withMessage('Invalid blog ID')
];

const validateSlug = [
  param('slug').matches(/^[a-z0-9-]+$/).withMessage('Invalid slug format')
];

const validateBlogCreation = [
  body('title').isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('slug').matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('introduction').isLength({ min: 50, max: 500 }).withMessage('Introduction must be 50-500 characters'),
  body('servicePageId').isMongoId().withMessage('Valid service page ID required'),
  body('websiteId').isMongoId().withMessage('Valid website ID required'),
  body('category').isIn([
    'general-dentistry',
    'cosmetic-dentistry',
    'orthodontics',
    'oral-surgery',
    'pediatric-dentistry',
    'emergency-dentistry',
    'periodontics',
    'endodontics',
    'prosthodontics',
    'oral-pathology'
  ]).withMessage('Invalid category'),
  body('content').isObject().withMessage('Content must be an object'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
];

const validateBlogGeneration = [
  body('serviceName').isLength({ min: 3, max: 100 }).withMessage('Service name must be 3-100 characters'),
  body('servicePageId').isMongoId().withMessage('Valid service page ID required'),
  body('websiteId').isMongoId().withMessage('Valid website ID required'),
  body('category').optional().isIn([
    'general-dentistry',
    'cosmetic-dentistry',
    'orthodontics',
    'oral-surgery',
    'pediatric-dentistry',
    'emergency-dentistry',
    'periodontics',
    'endodontics',
    'prosthodontics',
    'oral-pathology'
  ]).withMessage('Invalid category'),
  body('keywords').optional().isArray().withMessage('Keywords must be an array'),
  body('blogType').optional().isIn(['comprehensive', 'guide', 'benefits', 'procedure', 'cost', 'recovery']).withMessage('Invalid blog type'),
  body('autoPublish').optional().isBoolean().withMessage('AutoPublish must be a boolean')
];

// =====================
// PUBLIC ROUTES (No Authentication Required)
// =====================

/**
 * @route   GET /api/blogs
 * @desc    Get all published blogs with filtering and pagination
 * @access  Public
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 10)
 * @query   category - Filter by category
 * @query   featured - Filter featured blogs (true/false)
 * @query   websiteId - Filter by website
 * @query   servicePageId - Filter by service page
 * @query   search - Text search
 */
router.get('/',
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('category').optional().isIn([
    'general-dentistry', 'cosmetic-dentistry', 'orthodontics', 'oral-surgery',
    'pediatric-dentistry', 'emergency-dentistry', 'periodontics', 'endodontics',
    'prosthodontics', 'oral-pathology'
  ]).withMessage('Invalid category'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  query('websiteId').optional().isMongoId().withMessage('Invalid website ID'),
  query('servicePageId').optional().isMongoId().withMessage('Invalid service page ID'),
  BlogController.getAllBlogs
);

/**
 * @route   GET /api/blogs/slug/:slug
 * @desc    Get single blog by slug (public access)
 * @access  Public
 * @query   incrementView - Increment view count (true/false)
 */
router.get('/slug/:slug',
  validateSlug,
  query('incrementView').optional().isBoolean().withMessage('IncrementView must be a boolean'),
  BlogController.getBlogBySlug
);

/**
 * @route   GET /api/blogs/service/:servicePageId
 * @desc    Get blogs for a specific service page
 * @access  Public
 * @query   limit - Number of blogs to return (default: 6)
 */
router.get('/service/:servicePageId',
  param('servicePageId').isMongoId().withMessage('Invalid service page ID'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be 1-20'),
  BlogController.getBlogsByService
);

/**
 * @route   GET /api/blogs/featured
 * @desc    Get featured blogs
 * @access  Public
 * @query   limit - Number of blogs to return (default: 6)
 * @query   websiteId - Filter by website
 */
router.get('/featured',
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be 1-20'),
  query('websiteId').optional().isMongoId().withMessage('Invalid website ID'),
  BlogController.getFeaturedBlogs
);

/**
 * @route   GET /api/blogs/related/:blogId
 * @desc    Get related blogs based on category and tags
 * @access  Public
 * @query   limit - Number of blogs to return (default: 3)
 */
router.get('/related/:blogId',
  param('blogId').isMongoId().withMessage('Invalid blog ID'),
  query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be 1-10'),
  BlogController.getRelatedBlogs
);

/**
 * @route   GET /api/blogs/search
 * @desc    Search blogs by text
 * @access  Public
 * @query   q - Search query (required)
 * @query   category - Filter by category
 * @query   limit - Number of results (default: 10)
 */
router.get('/search',
  query('q').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('category').optional().isIn([
    'general-dentistry', 'cosmetic-dentistry', 'orthodontics', 'oral-surgery',
    'pediatric-dentistry', 'emergency-dentistry', 'periodontics', 'endodontics',
    'prosthodontics', 'oral-pathology'
  ]).withMessage('Invalid category'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  BlogController.searchBlogs
);

// =====================
// ADMIN ROUTES (Authentication Required)
// =====================

// Apply authentication to all admin routes below this point
router.use(authMiddleware);
router.use(requireDoctor);

/**
 * @route   POST /api/blogs
 * @desc    Create new blog (Admin only)
 * @access  Private (Doctor only)
 */
router.post('/',
  validateBlogCreation,
  BlogController.createBlog
);

/**
 * @route   POST /api/blogs/generate
 * @desc    Generate blog using LLM (Admin only)
 * @access  Private (Doctor only)
 */
router.post('/generate',
  validateBlogGeneration,
  BlogController.generateBlog
);

/**
 * @route   PUT /api/blogs/:blogId
 * @desc    Update blog (Admin only)
 * @access  Private (Doctor only)
 */
router.put('/:blogId',
  validateBlogId,
  [
    body('title').optional().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
    body('slug').optional().matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
    body('introduction').optional().isLength({ min: 50, max: 500 }).withMessage('Introduction must be 50-500 characters'),
    body('category').optional().isIn([
      'general-dentistry', 'cosmetic-dentistry', 'orthodontics', 'oral-surgery',
      'pediatric-dentistry', 'emergency-dentistry', 'periodontics', 'endodontics',
      'prosthodontics', 'oral-pathology'
    ]).withMessage('Invalid category'),
    body('content').optional().isObject().withMessage('Content must be an object'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('featured').optional().isBoolean().withMessage('Featured must be a boolean')
  ],
  BlogController.updateBlog
);

/**
 * @route   PATCH /api/blogs/:blogId/publish
 * @desc    Publish or unpublish blog (Admin only)
 * @access  Private (Doctor only)
 */
router.patch('/:blogId/publish',
  validateBlogId,
  body('publish').isBoolean().withMessage('Publish must be a boolean'),
  BlogController.togglePublish
);

/**
 * @route   DELETE /api/blogs/:blogId
 * @desc    Delete blog (Admin only)
 * @access  Private (Doctor only)
 */
router.delete('/:blogId',
  validateBlogId,
  BlogController.deleteBlog
);

/**
 * @route   GET /api/blogs/:blogId/analytics
 * @desc    Get blog analytics (Admin only)
 * @access  Private (Doctor only)
 */
router.get('/:blogId/analytics',
  validateBlogId,
  BlogController.getBlogAnalytics
);

module.exports = router;