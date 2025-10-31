const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const enhancedPageController = require('../controllers/enhancedPageController');

/**
 * Page Routes for Destack Integration
 *
 * API endpoints for managing pages created with Destack page builder
 */

// Enhanced Destack-specific endpoints (used by the page builder with unified content)
// Note: These handle redirected requests from :12785 to our backend
router.get('/builder/handle', enhancedPageController.getPageContentUnified);
router.post('/builder/handle', enhancedPageController.savePageContentUnified);
router.post('/builder/asset', enhancedPageController.uploadAssetEnhanced);

// Legacy endpoints (fallback for compatibility)
router.get('/builder/handle/legacy', pageController.getPageContent);
router.post('/builder/handle/legacy', pageController.savePageContent);
router.post('/builder/asset/legacy', pageController.uploadAsset);

// Component library endpoints
router.get('/builder/components/full', pageController.getFullComponentLibrary);

// Standard CRUD endpoints
router.get('/pages', pageController.getAllPages);
router.get('/pages/:slug', pageController.getPageBySlug);
router.post('/pages', pageController.createPage);
router.put('/pages/:slug', pageController.updatePage);
router.delete('/pages/:slug', pageController.deletePage);

module.exports = router;
