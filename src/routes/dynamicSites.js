const express = require('express');
const router = express.Router();
const dynamicSiteController = require('../controllers/dynamicSiteController');

/**
 * Dynamic Site Routes
 *
 * These routes handle serving dynamic websites generated from unified content.
 * This replaces static site generation with real-time content rendering.
 */

/**
 * Dynamic site serving routes (subdomain-based)
 */

// Homepage
router.get('/site/:subdomain', dynamicSiteController.serveHomepage);
router.get('/site/:subdomain/', dynamicSiteController.serveHomepage);

// Service pages
router.get('/site/:subdomain/services/:slug', dynamicSiteController.serveServicePage);

// Standard pages
router.get('/site/:subdomain/about', dynamicSiteController.serveAboutPage);
router.get('/site/:subdomain/contact', dynamicSiteController.serveContactPage);

// API endpoints for dynamic content
router.get('/site/:subdomain/api/navigation', dynamicSiteController.getSiteNavigation);

// SEO and crawling support
router.get('/site/:subdomain/sitemap.xml', dynamicSiteController.getSitemap);
router.get('/site/:subdomain/robots.txt', dynamicSiteController.getRobotsTxt);

// Form handling
router.post('/site/:subdomain/contact', dynamicSiteController.handleContactForm);

/**
 * Preview and management routes
 */

// Preview specific page content (for editors)
router.get('/preview/:servicePageId', dynamicSiteController.getPagePreview);

// Cache management
router.post('/cache/invalidate/:websiteId', dynamicSiteController.invalidateCache);

/**
 * Alternative routing patterns for different deployment scenarios
 */

// Path-based routing (alternative to subdomain)
router.get('/websites/:websiteId', dynamicSiteController.serveHomepage);
router.get('/websites/:websiteId/services/:slug', dynamicSiteController.serveServicePage);
router.get('/websites/:websiteId/about', dynamicSiteController.serveAboutPage);
router.get('/websites/:websiteId/contact', dynamicSiteController.serveContactPage);

// Custom domain routing (when sites have their own domains)
// This would be handled at the proxy/load balancer level in production
// but included here for completeness
router.get('/custom/:domain', dynamicSiteController.serveHomepage);
router.get('/custom/:domain/services/:slug', dynamicSiteController.serveServicePage);
router.get('/custom/:domain/about', dynamicSiteController.serveAboutPage);
router.get('/custom/:domain/contact', dynamicSiteController.serveContactPage);

module.exports = router;