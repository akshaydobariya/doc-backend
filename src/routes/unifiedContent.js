const express = require('express');
const router = express.Router();
const unifiedContentController = require('../controllers/unifiedContentController');

/**
 * Unified Content Routes
 *
 * These routes handle the unified content system that bridges
 * AI-generated content and visual editing capabilities
 */

/**
 * @route   GET /api/unified-content/:servicePageId
 * @desc    Get unified content for a service page
 * @access  Private
 */
router.get('/:servicePageId', unifiedContentController.getUnifiedContent);

/**
 * @route   PUT /api/unified-content/:servicePageId/components
 * @desc    Update visual components (from Destack editor)
 * @access  Private
 */
router.put('/:servicePageId/components', unifiedContentController.updateComponents);

/**
 * @route   PUT /api/unified-content/:servicePageId/content
 * @desc    Update structured content (from AI or content editor)
 * @access  Private
 */
router.put('/:servicePageId/content', unifiedContentController.updateStructuredContent);

/**
 * @route   POST /api/unified-content/:servicePageId/sync-ai
 * @desc    Sync with AI-generated content and create suggestions
 * @access  Private
 */
router.post('/:servicePageId/sync-ai', unifiedContentController.syncWithAI);

/**
 * @route   GET /api/unified-content/:servicePageId/suggestions
 * @desc    Get pending AI suggestions for review
 * @access  Private
 */
router.get('/:servicePageId/suggestions', unifiedContentController.getAISuggestions);

/**
 * @route   POST /api/unified-content/:servicePageId/suggestions/handle
 * @desc    Accept or reject AI suggestion
 * @access  Private
 */
router.post('/:servicePageId/suggestions/handle', unifiedContentController.handleAISuggestion);

/**
 * @route   GET /api/unified-content/:servicePageId/export/destack
 * @desc    Export content in Destack format for visual editor
 * @access  Private
 */
router.get('/:servicePageId/export/destack', unifiedContentController.exportToDestack);

/**
 * @route   POST /api/unified-content/:servicePageId/import/destack
 * @desc    Import content from Destack format
 * @access  Private
 */
router.post('/:servicePageId/import/destack', unifiedContentController.importFromDestack);

/**
 * @route   GET /api/unified-content/:servicePageId/conflicts
 * @desc    Detect conflicts between content and visual changes
 * @access  Private
 */
router.get('/:servicePageId/conflicts', unifiedContentController.detectConflicts);

/**
 * @route   POST /api/unified-content/:servicePageId/conflicts/resolve
 * @desc    Resolve conflicts with specified resolution strategy
 * @access  Private
 */
router.post('/:servicePageId/conflicts/resolve', unifiedContentController.resolveConflicts);

/**
 * @route   GET /api/unified-content/:servicePageId/versions
 * @desc    Get version history
 * @access  Private
 */
router.get('/:servicePageId/versions', unifiedContentController.getVersionHistory);

/**
 * @route   POST /api/unified-content/:servicePageId/versions/restore
 * @desc    Restore to a specific version
 * @access  Private
 */
router.post('/:servicePageId/versions/restore', unifiedContentController.restoreVersion);

module.exports = router;