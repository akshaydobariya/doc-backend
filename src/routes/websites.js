const express = require('express');
const router = express.Router();
const { authMiddleware, requireDoctor } = require('../middleware/authMiddleware');
const {
  getWebsites,
  getWebsiteById,
  createWebsite,
  updateWebsite,
  saveWebsiteContent,
  getWebsiteVersions,
  restoreWebsiteVersion,
  checkSubdomainAvailability,
  deleteWebsite,
  permanentDeleteWebsite,
  updateWebsiteStatus,
  generateStaticSite,
  deployWebsite,
  getDeploymentStatus,
  servePublishedWebsite,
  getPublishedWebsiteInfo
} = require('../controllers/websiteController');

/**
 * Public Website Routes (No authentication required)
 */

// GET /api/websites/subdomain/:subdomain/available - Check subdomain availability (PUBLIC)
router.get('/subdomain/:subdomain/available', checkSubdomainAvailability);

// GET /api/websites/public/:subdomain/* - Serve published website files (PUBLIC)
router.get('/public/:subdomain/*path', servePublishedWebsite);

// GET /api/websites/public/:subdomain - Serve published website homepage (PUBLIC)
router.get('/public/:subdomain', servePublishedWebsite);

// GET /api/websites/info/:subdomain - Get published website info (PUBLIC)
router.get('/info/:subdomain', getPublishedWebsiteInfo);

/**
 * Protected Website Routes (Authentication required)
 */

// Apply authentication middleware to remaining routes
router.use(authMiddleware);
router.use(requireDoctor);

// GET /api/websites - Get all websites for the authenticated doctor
router.get('/', getWebsites);

// GET /api/websites/:id - Get specific website by ID
router.get('/:id', getWebsiteById);

// POST /api/websites - Create new website
router.post('/', createWebsite);

// PUT /api/websites/:id - Update website metadata
router.put('/:id', updateWebsite);

// POST /api/websites/:id/content - Save website content (create new version)
router.post('/:id/content', saveWebsiteContent);

// GET /api/websites/:id/versions - Get website version history
router.get('/:id/versions', getWebsiteVersions);

// POST /api/websites/:id/restore - Restore website to specific version
router.post('/:id/restore', restoreWebsiteVersion);

// PATCH /api/websites/:id/status - Update website status (draft, preview, published, archived)
router.patch('/:id/status', updateWebsiteStatus);

// DELETE /api/websites/:id - Soft delete website (archive)
router.delete('/:id', deleteWebsite);

// DELETE /api/websites/:id/permanent - Permanently delete website
router.delete('/:id/permanent', permanentDeleteWebsite);

// POST /api/websites/:id/generate - Generate static site
router.post('/:id/generate', generateStaticSite);

// POST /api/websites/:id/deploy - Deploy website
router.post('/:id/deploy', deployWebsite);

// GET /api/websites/:id/deployment - Get deployment status
router.get('/:id/deployment', getDeploymentStatus);

module.exports = router;