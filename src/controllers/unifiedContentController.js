const UnifiedContent = require('../models/UnifiedContent');
const ServicePage = require('../models/ServicePage');
const ContentTransformationService = require('../services/contentTransformationService');

/**
 * Unified Content Controller
 *
 * Handles all operations related to the unified content model
 * that bridges AI-generated content and visual editing
 */

/**
 * Get unified content for a service page
 */
exports.getUnifiedContent = async (req, res) => {
  try {
    const { servicePageId } = req.params;

    let unifiedContent = await UnifiedContent.findOne({ servicePageId })
      .populate('servicePageId')
      .populate('websiteId');

    if (!unifiedContent) {
      // Create unified content from existing ServicePage
      unifiedContent = await ContentTransformationService.transformServicePageToUnified(servicePageId);
    }

    res.json({
      success: true,
      data: unifiedContent,
      message: 'Unified content retrieved successfully'
    });
  } catch (error) {
    console.error('Get unified content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve unified content',
      error: error.message
    });
  }
};

/**
 * Update unified content components (from visual editor)
 */
exports.updateComponents = async (req, res) => {
  try {
    const { servicePageId } = req.params;
    const { components, editingContext } = req.body;
    const userId = req.session?.user?.id || req.user?.id;

    let unifiedContent = await UnifiedContent.findOne({ servicePageId });

    if (!unifiedContent) {
      unifiedContent = await ContentTransformationService.transformServicePageToUnified(servicePageId);
    }

    // Update components
    unifiedContent.components = components;

    // Update editing context if provided
    if (editingContext) {
      unifiedContent.editingContext = { ...unifiedContent.editingContext, ...editingContext };
    }

    // Generate structured content from updated components
    const structuredContent = ContentTransformationService.generateStructuredContentFromComponents(components);
    unifiedContent.structuredContent = { ...unifiedContent.structuredContent, ...structuredContent };

    // Update content structure mapping
    unifiedContent.contentStructure = ContentTransformationService.mapContentToStructure(
      unifiedContent.structuredContent,
      components
    );

    // Create version snapshot
    unifiedContent.createVersionSnapshot(
      'visual_edit',
      'Updated components from visual editor',
      userId
    );

    await unifiedContent.save();

    // Sync back to ServicePage
    await ContentTransformationService.syncToServicePage(unifiedContent._id);

    res.json({
      success: true,
      data: unifiedContent,
      message: 'Components updated successfully'
    });
  } catch (error) {
    console.error('Update components error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update components',
      error: error.message
    });
  }
};

/**
 * Update structured content (from AI generation or content editor)
 */
exports.updateStructuredContent = async (req, res) => {
  try {
    const { servicePageId } = req.params;
    const { structuredContent, sections } = req.body;
    const userId = req.session?.user?.id || req.user?.id;

    let unifiedContent = await UnifiedContent.findOne({ servicePageId });

    if (!unifiedContent) {
      unifiedContent = await ContentTransformationService.transformServicePageToUnified(servicePageId);
    }

    // Update structured content (full or partial)
    if (sections && Array.isArray(sections)) {
      // Selective update of specific sections
      sections.forEach(section => {
        if (structuredContent[section]) {
          unifiedContent.structuredContent[section] = structuredContent[section];
        }
      });
    } else {
      // Full update
      unifiedContent.structuredContent = { ...unifiedContent.structuredContent, ...structuredContent };
    }

    // Regenerate components from updated structured content
    const components = ContentTransformationService.generateComponentsFromStructuredContent(
      unifiedContent.structuredContent
    );
    unifiedContent.components = components;

    // Update content structure mapping
    unifiedContent.contentStructure = ContentTransformationService.mapContentToStructure(
      unifiedContent.structuredContent,
      components
    );

    // Create version snapshot
    unifiedContent.createVersionSnapshot(
      'content_edit',
      sections ? `Updated sections: ${sections.join(', ')}` : 'Updated structured content',
      userId
    );

    await unifiedContent.save();

    // Sync back to ServicePage
    await ContentTransformationService.syncToServicePage(unifiedContent._id);

    res.json({
      success: true,
      data: unifiedContent,
      message: 'Structured content updated successfully'
    });
  } catch (error) {
    console.error('Update structured content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update structured content',
      error: error.message
    });
  }
};

/**
 * Sync with AI-generated content
 */
exports.syncWithAI = async (req, res) => {
  try {
    const { servicePageId } = req.params;
    const { generatedContent, options = {} } = req.body;
    const userId = req.session?.user?.id || req.user?.id;

    let unifiedContent = await UnifiedContent.findOne({ servicePageId });

    if (!unifiedContent) {
      unifiedContent = await ContentTransformationService.transformServicePageToUnified(servicePageId);
    }

    // Store current state for conflict detection
    const previousContent = { ...unifiedContent.structuredContent };
    const previousComponents = [...unifiedContent.components];

    // Update AI interaction tracking
    unifiedContent.aiInteraction.lastGeneration = new Date();
    unifiedContent.aiInteraction.generationCount += 1;

    if (options.replaceAll) {
      // Replace all content with AI-generated content
      unifiedContent.structuredContent = generatedContent;
      const components = ContentTransformationService.generateComponentsFromStructuredContent(generatedContent);
      unifiedContent.components = components;

      // Create version snapshot
      unifiedContent.createVersionSnapshot(
        'ai_generation',
        'AI content regeneration (replace all)',
        userId
      );
    } else {
      // Generate suggestions for each section
      const suggestions = exports.generateAISuggestions(
        previousContent,
        generatedContent,
        previousComponents
      );

      // Apply suggestions based on confidence and auto-accept settings
      const autoAcceptThreshold = unifiedContent.aiInteraction.autoAcceptThreshold;
      let appliedSuggestions = 0;

      suggestions.forEach(suggestion => {
        if (suggestion.confidence >= autoAcceptThreshold) {
          const applied = exports.applySuggestion(unifiedContent, suggestion);
          if (applied) appliedSuggestions++;
        } else {
          // Store as pending suggestion
          exports.addPendingSuggestion(unifiedContent, suggestion);
        }
      });

      // Create version snapshot if any suggestions were applied
      if (appliedSuggestions > 0) {
        unifiedContent.createVersionSnapshot(
          'ai_generation',
          `AI suggestions applied: ${appliedSuggestions}/${suggestions.length}`,
          userId
        );
      }
    }

    await unifiedContent.save();

    // Sync back to ServicePage
    await ContentTransformationService.syncToServicePage(unifiedContent._id);

    res.json({
      success: true,
      data: unifiedContent,
      suggestions: unifiedContent.aiInteraction.pendingSuggestions,
      message: 'AI content synced successfully'
    });
  } catch (error) {
    console.error('Sync with AI error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync with AI content',
      error: error.message
    });
  }
};

/**
 * Get AI suggestions for review
 */
exports.getAISuggestions = async (req, res) => {
  try {
    const { servicePageId } = req.params;

    const unifiedContent = await UnifiedContent.findOne({ servicePageId });
    if (!unifiedContent) {
      return res.status(404).json({
        success: false,
        message: 'Unified content not found'
      });
    }

    // Collect all pending suggestions from components
    const suggestions = [];
    unifiedContent.components.forEach(component => {
      const pendingSuggestions = component.aiSuggestions.filter(s => s.status === 'pending');
      pendingSuggestions.forEach(suggestion => {
        suggestions.push({
          componentId: component.id,
          componentType: component.type,
          section: component.contentBinding?.section,
          ...suggestion
        });
      });
    });

    res.json({
      success: true,
      suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
      count: suggestions.length
    });
  } catch (error) {
    console.error('Get AI suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI suggestions',
      error: error.message
    });
  }
};

/**
 * Apply or reject AI suggestion
 */
exports.handleAISuggestion = async (req, res) => {
  try {
    const { servicePageId } = req.params;
    const { suggestionId, action, componentId } = req.body; // action: 'accept' | 'reject'
    const userId = req.session?.user?.id || req.user?.id;

    const unifiedContent = await UnifiedContent.findOne({ servicePageId });
    if (!unifiedContent) {
      return res.status(404).json({
        success: false,
        message: 'Unified content not found'
      });
    }

    // Apply the suggestion
    unifiedContent.applyAISuggestion(componentId, suggestionId, action);

    // If accepted, sync the changes
    if (action === 'accepted') {
      const component = unifiedContent.components.find(c => c.id === componentId);
      if (component && component.contentBinding) {
        // Update structured content from component changes
        const section = component.contentBinding.section;
        const contentData = ContentTransformationService.mapPropsToContent(component.type, component.props);

        if (!unifiedContent.structuredContent[section]) {
          unifiedContent.structuredContent[section] = {};
        }

        Object.assign(unifiedContent.structuredContent[section], contentData);
      }

      // Create version snapshot
      unifiedContent.createVersionSnapshot(
        'ai_suggestion',
        `Applied AI suggestion: ${suggestionId}`,
        userId
      );
    }

    await unifiedContent.save();

    // Sync back to ServicePage if suggestion was accepted
    if (action === 'accepted') {
      await ContentTransformationService.syncToServicePage(unifiedContent._id);
    }

    res.json({
      success: true,
      data: unifiedContent,
      message: `AI suggestion ${action} successfully`
    });
  } catch (error) {
    console.error('Handle AI suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle AI suggestion',
      error: error.message
    });
  }
};

/**
 * Export to Destack format for visual editor
 */
exports.exportToDestack = async (req, res) => {
  try {
    const { servicePageId } = req.params;

    const unifiedContent = await UnifiedContent.findOne({ servicePageId });
    if (!unifiedContent) {
      return res.status(404).json({
        success: false,
        message: 'Unified content not found'
      });
    }

    const destackFormat = unifiedContent.toDestackFormat();

    res.json({
      success: true,
      data: destackFormat,
      message: 'Content exported to Destack format successfully'
    });
  } catch (error) {
    console.error('Export to Destack error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export to Destack format',
      error: error.message
    });
  }
};

/**
 * Import from Destack format
 */
exports.importFromDestack = async (req, res) => {
  try {
    const { servicePageId } = req.params;
    const { destackData } = req.body;
    const userId = req.session?.user?.id || req.user?.id;

    // Transform Destack data to unified content
    const unifiedContent = await ContentTransformationService.transformDestackToUnified(
      servicePageId,
      destackData
    );

    res.json({
      success: true,
      data: unifiedContent,
      message: 'Content imported from Destack successfully'
    });
  } catch (error) {
    console.error('Import from Destack error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import from Destack',
      error: error.message
    });
  }
};

/**
 * Detect and resolve conflicts
 */
exports.detectConflicts = async (req, res) => {
  try {
    const { servicePageId } = req.params;

    const unifiedContent = await UnifiedContent.findOne({ servicePageId });
    if (!unifiedContent) {
      return res.status(404).json({
        success: false,
        message: 'Unified content not found'
      });
    }

    const conflicts = await ContentTransformationService.detectConflicts(unifiedContent._id);

    res.json({
      success: true,
      conflicts,
      count: conflicts.length,
      syncHealth: unifiedContent.syncHealth
    });
  } catch (error) {
    console.error('Detect conflicts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect conflicts',
      error: error.message
    });
  }
};

/**
 * Resolve conflicts
 */
exports.resolveConflicts = async (req, res) => {
  try {
    const { servicePageId } = req.params;
    const { resolutions } = req.body;
    const userId = req.session?.user?.id || req.user?.id;

    const unifiedContent = await UnifiedContent.findOne({ servicePageId });
    if (!unifiedContent) {
      return res.status(404).json({
        success: false,
        message: 'Unified content not found'
      });
    }

    const resolvedContent = await ContentTransformationService.resolveConflicts(
      unifiedContent._id,
      resolutions
    );

    // Create version snapshot
    resolvedContent.createVersionSnapshot(
      'conflict_resolution',
      `Resolved ${resolutions.length} conflicts`,
      userId
    );

    await resolvedContent.save();

    // Sync back to ServicePage
    await ContentTransformationService.syncToServicePage(resolvedContent._id);

    res.json({
      success: true,
      data: resolvedContent,
      message: 'Conflicts resolved successfully'
    });
  } catch (error) {
    console.error('Resolve conflicts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve conflicts',
      error: error.message
    });
  }
};

/**
 * Get version history
 */
exports.getVersionHistory = async (req, res) => {
  try {
    const { servicePageId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const unifiedContent = await UnifiedContent.findOne({ servicePageId })
      .populate('version.history.createdBy', 'name email');

    if (!unifiedContent) {
      return res.status(404).json({
        success: false,
        message: 'Unified content not found'
      });
    }

    const history = unifiedContent.version.history
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      success: true,
      history,
      currentVersion: unifiedContent.version.current,
      totalVersions: unifiedContent.version.history.length
    });
  } catch (error) {
    console.error('Get version history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve version history',
      error: error.message
    });
  }
};

/**
 * Restore version
 */
exports.restoreVersion = async (req, res) => {
  try {
    const { servicePageId } = req.params;
    const { version } = req.body;
    const userId = req.session?.user?.id || req.user?.id;

    const unifiedContent = await UnifiedContent.findOne({ servicePageId });
    if (!unifiedContent) {
      return res.status(404).json({
        success: false,
        message: 'Unified content not found'
      });
    }

    const versionData = unifiedContent.version.history.find(v => v.version === version);
    if (!versionData) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    // Restore from snapshot
    unifiedContent.components = versionData.snapshot.components;
    unifiedContent.structuredContent = versionData.snapshot.structuredContent;

    // Update content structure mapping
    unifiedContent.contentStructure = ContentTransformationService.mapContentToStructure(
      unifiedContent.structuredContent,
      unifiedContent.components
    );

    // Create new version snapshot for the restoration
    unifiedContent.createVersionSnapshot(
      'version_restore',
      `Restored to version ${version}`,
      userId
    );

    await unifiedContent.save();

    // Sync back to ServicePage
    await ContentTransformationService.syncToServicePage(unifiedContent._id);

    res.json({
      success: true,
      data: unifiedContent,
      message: `Version ${version} restored successfully`
    });
  } catch (error) {
    console.error('Restore version error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore version',
      error: error.message
    });
  }
};

/**
 * Helper methods for AI suggestions
 */

/**
 * Generate AI suggestions by comparing old and new content
 */
exports.generateAISuggestions = (oldContent, newContent, oldComponents) => {
  const suggestions = [];

  Object.keys(newContent).forEach(section => {
    const oldSectionData = oldContent[section] || {};
    const newSectionData = newContent[section] || {};

    // Find components for this section
    const sectionComponents = oldComponents.filter(c =>
      c.contentBinding && c.contentBinding.section === section
    );

    sectionComponents.forEach(component => {
      const differences = ContentTransformationService.compareObjects(oldSectionData, newSectionData);

      differences.forEach(diff => {
        suggestions.push({
          componentId: component.id,
          suggestionId: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'content',
          description: `AI suggests updating ${diff.field} in ${section}`,
          changes: {
            [diff.field]: diff.contentValue
          },
          confidence: 0.8, // Default confidence
          field: diff.field,
          oldValue: diff.visualValue,
          newValue: diff.contentValue
        });
      });
    });
  });

  return suggestions;
};

/**
 * Apply a suggestion to unified content
 */
exports.applySuggestion = (unifiedContent, suggestion) => {
  try {
    const component = unifiedContent.components.find(c => c.id === suggestion.componentId);
    if (!component) {
      throw new Error(`Component ${suggestion.componentId} not found`);
    }

    // Validate suggestion changes
    if (!suggestion.changes || typeof suggestion.changes !== 'object') {
      throw new Error('Invalid suggestion changes format');
    }

    Object.assign(component.props, suggestion.changes);
    component.lastModified = new Date();
    component.lastModifiedBy = 'ai';

    // Update structured content as well
    if (component.contentBinding) {
      const section = component.contentBinding.section;
      if (!unifiedContent.structuredContent[section]) {
        unifiedContent.structuredContent[section] = {};
      }
      Object.assign(unifiedContent.structuredContent[section], suggestion.changes);
    }

    unifiedContent.aiInteraction.acceptedSuggestions += 1;
    return true;
  } catch (error) {
    console.error('Error applying suggestion:', error);
    return false;
  }
};

/**
 * Add a pending suggestion to the component
 */
exports.addPendingSuggestion = (unifiedContent, suggestion) => {
  try {
    const component = unifiedContent.components.find(c => c.id === suggestion.componentId);
    if (!component) {
      throw new Error(`Component ${suggestion.componentId} not found`);
    }

    // Check for duplicate suggestions
    const existingSuggestion = component.aiSuggestions.find(s =>
      s.suggestionId === suggestion.suggestionId
    );
    if (existingSuggestion) {
      console.warn('Suggestion already exists:', suggestion.suggestionId);
      return false;
    }

    // Validate suggestion structure
    if (!suggestion.suggestionId || !suggestion.type || !suggestion.description) {
      throw new Error('Invalid suggestion structure');
    }

    component.aiSuggestions.push({
      suggestionId: suggestion.suggestionId,
      type: suggestion.type,
      description: suggestion.description,
      changes: suggestion.changes,
      status: 'pending',
      confidence: suggestion.confidence || 0.5
    });

    unifiedContent.aiInteraction.pendingSuggestions += 1;
    return true;
  } catch (error) {
    console.error('Error adding pending suggestion:', error);
    return false;
  }
};

module.exports = exports;