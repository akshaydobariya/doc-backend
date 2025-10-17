const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');

/**
 * Page Routes for Destack Integration
 *
 * API endpoints for managing pages created with Destack page builder
 */

// Destack-specific endpoints (used by the page builder)
// Note: These handle redirected requests from :12785 to our backend
router.get('/builder/handle', pageController.getPageContent);
router.post('/builder/handle', pageController.savePageContent);
router.post('/builder/asset', pageController.uploadAsset);

// Component library endpoints
router.get('/builder/components/full', pageController.getFullComponentLibrary);

// Standard CRUD endpoints
router.get('/pages', pageController.getAllPages);
router.get('/pages/:slug', pageController.getPageBySlug);
router.post('/pages', pageController.createPage);
router.put('/pages/:slug', pageController.updatePage);
router.delete('/pages/:slug', pageController.deletePage);

module.exports = router;
