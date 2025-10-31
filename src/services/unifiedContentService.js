const UnifiedContent = require('../models/UnifiedContent');
const ServicePage = require('../models/ServicePage');
const Website = require('../models/Website');
const ContentTransformationService = require('./contentTransformationService');

/**
 * Unified Content Service
 *
 * This service provides backend functionality for the unified content system,
 * handling the synchronization between AI-generated content and visual editing,
 * conflict resolution, and content transformation operations.
 */

class UnifiedContentService {
  /**
   * Create new unified content
   */
  static async create(contentData) {
    try {
      const {
        title,
        servicePageId,
        websiteId,
        structuredContent = {},
        components = [],
        status = 'draft'
      } = contentData;

      // Validate required fields
      if (!servicePageId && !websiteId) {
        throw new Error('Either servicePageId or websiteId is required');
      }

      // Check if unified content already exists
      let existingContent = null;
      if (servicePageId) {
        existingContent = await UnifiedContent.findOne({ servicePageId });
      } else if (websiteId) {
        existingContent = await UnifiedContent.findOne({ websiteId, servicePageId: null });
      }

      if (existingContent) {
        throw new Error('Unified content already exists for this resource');
      }

      // Create new unified content
      const unifiedContent = new UnifiedContent({
        title: title || 'Untitled Content',
        servicePageId,
        websiteId,
        structuredContent,
        components,
        status,
        syncStatus: {
          contentToVisual: { status: 'synced', lastSync: new Date() },
          visualToContent: { status: 'synced', lastSync: new Date() }
        },
        assets: [],
        aiSuggestions: [],
        conflicts: [],
        versions: [],
        lastModified: new Date()
      });

      await unifiedContent.save();

      console.log('Created unified content:', unifiedContent._id);
      return unifiedContent;
    } catch (error) {
      console.error('Error creating unified content:', error);
      throw error;
    }
  }

  /**
   * Get unified content by ID
   */
  static async getById(contentId) {
    try {
      if (!contentId || !/^[0-9a-fA-F]{24}$/.test(contentId)) {
        throw new Error('Invalid content ID format');
      }

      const unifiedContent = await UnifiedContent.findById(contentId)
        .populate('servicePageId')
        .populate('websiteId')
        .lean();

      if (!unifiedContent) {
        throw new Error('Unified content not found');
      }

      return unifiedContent;
    } catch (error) {
      console.error('Error getting unified content by ID:', error);
      throw error;
    }
  }

  /**
   * Get unified content by service page ID
   */
  static async getByServicePage(servicePageId) {
    try {
      if (!servicePageId || !/^[0-9a-fA-F]{24}$/.test(servicePageId)) {
        throw new Error('Invalid service page ID format');
      }

      let unifiedContent = await UnifiedContent.findOne({ servicePageId })
        .populate('servicePageId')
        .populate('websiteId')
        .lean();

      // If not found, try to create from existing ServicePage
      if (!unifiedContent) {
        console.log('Unified content not found, attempting to create from ServicePage');
        const servicePageData = await ServicePage.findById(servicePageId);

        if (!servicePageData) {
          throw new Error('Service page not found');
        }

        unifiedContent = await ContentTransformationService.transformServicePageToUnified(servicePageId);
      }

      return unifiedContent;
    } catch (error) {
      console.error('Error getting unified content by service page:', error);
      throw error;
    }
  }

  /**
   * Get all unified content for a website
   */
  static async getByWebsite(websiteId) {
    try {
      if (!websiteId || !/^[0-9a-fA-F]{24}$/.test(websiteId)) {
        throw new Error('Invalid website ID format');
      }

      const unifiedContents = await UnifiedContent.find({ websiteId })
        .populate('servicePageId')
        .sort({ lastModified: -1 })
        .lean();

      return unifiedContents;
    } catch (error) {
      console.error('Error getting unified content by website:', error);
      throw error;
    }
  }

  /**
   * Update unified content
   */
  static async update(contentId, updateData) {
    try {
      if (!contentId || !/^[0-9a-fA-F]{24}$/.test(contentId)) {
        throw new Error('Invalid content ID format');
      }

      const unifiedContent = await UnifiedContent.findById(contentId);
      if (!unifiedContent) {
        throw new Error('Unified content not found');
      }

      // Create version snapshot before updating
      unifiedContent.createVersionSnapshot(
        'manual_update',
        'Updated via API',
        updateData.updatedBy || 'system'
      );

      // Update fields
      const allowedFields = [
        'title', 'structuredContent', 'components', 'status', 'assets'
      ];

      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          unifiedContent[field] = updateData[field];
        }
      });

      unifiedContent.lastModified = new Date();
      await unifiedContent.save();

      console.log('Updated unified content:', contentId);
      return unifiedContent;
    } catch (error) {
      console.error('Error updating unified content:', error);
      throw error;
    }
  }

  /**
   * Delete unified content
   */
  static async delete(contentId) {
    try {
      if (!contentId || !/^[0-9a-fA-F]{24}$/.test(contentId)) {
        throw new Error('Invalid content ID format');
      }

      const unifiedContent = await UnifiedContent.findById(contentId);
      if (!unifiedContent) {
        throw new Error('Unified content not found');
      }

      await UnifiedContent.findByIdAndDelete(contentId);
      console.log('Deleted unified content:', contentId);

      return { success: true, message: 'Unified content deleted successfully' };
    } catch (error) {
      console.error('Error deleting unified content:', error);
      throw error;
    }
  }

  /**
   * Sync content between AI and visual formats
   */
  static async syncContent(contentId, direction = 'bidirectional') {
    try {
      if (!contentId || !/^[0-9a-fA-F]{24}$/.test(contentId)) {
        throw new Error('Invalid content ID format');
      }

      const validDirections = ['bidirectional', 'contentToVisual', 'visualToContent'];
      if (!validDirections.includes(direction)) {
        throw new Error('Invalid sync direction');
      }

      const unifiedContent = await UnifiedContent.findById(contentId);
      if (!unifiedContent) {
        throw new Error('Unified content not found');
      }

      let syncResults = {};

      if (direction === 'bidirectional' || direction === 'contentToVisual') {
        // Sync structured content to visual components
        syncResults.contentToVisual = await unifiedContent.syncContentToVisual();
      }

      if (direction === 'bidirectional' || direction === 'visualToContent') {
        // Sync visual components to structured content
        syncResults.visualToContent = await unifiedContent.syncVisualToContent();
      }

      await unifiedContent.save();

      console.log('Synced unified content:', contentId, 'direction:', direction);
      return {
        success: true,
        syncResults,
        conflicts: unifiedContent.conflicts || []
      };
    } catch (error) {
      console.error('Error syncing unified content:', error);
      throw error;
    }
  }

  /**
   * Generate AI suggestions for content improvement
   */
  static async generateAISuggestions(contentId, options = {}) {
    try {
      if (!contentId || !/^[0-9a-fA-F]{24}$/.test(contentId)) {
        throw new Error('Invalid content ID format');
      }

      const unifiedContent = await UnifiedContent.findById(contentId);
      if (!unifiedContent) {
        throw new Error('Unified content not found');
      }

      // Generate suggestions based on current content
      const suggestions = await this.generateContentSuggestions(unifiedContent, options);

      // Add suggestions to unified content
      unifiedContent.aiSuggestions = unifiedContent.aiSuggestions || [];
      suggestions.forEach(suggestion => {
        unifiedContent.aiSuggestions.push({
          id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: suggestion.type,
          title: suggestion.title,
          description: suggestion.description,
          confidence: suggestion.confidence,
          preview: suggestion.preview,
          data: suggestion.data,
          status: 'pending',
          createdAt: new Date()
        });
      });

      await unifiedContent.save();

      console.log('Generated AI suggestions for content:', contentId);
      return {
        success: true,
        suggestions: suggestions,
        totalSuggestions: suggestions.length
      };
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      throw error;
    }
  }

  /**
   * Get AI suggestions for content
   */
  static async getAISuggestions(contentId, status = 'pending') {
    try {
      if (!contentId || !/^[0-9a-fA-F]{24}$/.test(contentId)) {
        throw new Error('Invalid content ID format');
      }

      const unifiedContent = await UnifiedContent.findById(contentId).lean();
      if (!unifiedContent) {
        throw new Error('Unified content not found');
      }

      const suggestions = (unifiedContent.aiSuggestions || [])
        .filter(suggestion => !status || suggestion.status === status)
        .sort((a, b) => b.confidence - a.confidence);

      return {
        suggestions,
        totalCount: suggestions.length,
        pendingCount: unifiedContent.aiSuggestions?.filter(s => s.status === 'pending').length || 0
      };
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      throw error;
    }
  }

  /**
   * Apply an AI suggestion
   */
  static async applySuggestion(contentId, suggestionId) {
    try {
      if (!contentId || !/^[0-9a-fA-F]{24}$/.test(contentId)) {
        throw new Error('Invalid content ID format');
      }

      const unifiedContent = await UnifiedContent.findById(contentId);
      if (!unifiedContent) {
        throw new Error('Unified content not found');
      }

      const suggestion = unifiedContent.aiSuggestions?.find(s => s.id === suggestionId);
      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      if (suggestion.status !== 'pending') {
        throw new Error('Suggestion is not in pending status');
      }

      // Apply the suggestion based on its type
      const applied = await this.applySuggestionToContent(unifiedContent, suggestion);

      if (applied) {
        suggestion.status = 'applied';
        suggestion.appliedAt = new Date();

        // Create version snapshot
        unifiedContent.createVersionSnapshot(
          'ai_suggestion',
          `Applied AI suggestion: ${suggestion.title}`,
          'ai-system'
        );

        await unifiedContent.save();

        console.log('Applied AI suggestion:', suggestionId, 'to content:', contentId);
        return { success: true, message: 'Suggestion applied successfully' };
      } else {
        throw new Error('Failed to apply suggestion');
      }
    } catch (error) {
      console.error('Error applying AI suggestion:', error);
      throw error;
    }
  }

  /**
   * Reject an AI suggestion
   */
  static async rejectSuggestion(contentId, suggestionId) {
    try {
      if (!contentId || !/^[0-9a-fA-F]{24}$/.test(contentId)) {
        throw new Error('Invalid content ID format');
      }

      const unifiedContent = await UnifiedContent.findById(contentId);
      if (!unifiedContent) {
        throw new Error('Unified content not found');
      }

      const suggestion = unifiedContent.aiSuggestions?.find(s => s.id === suggestionId);
      if (!suggestion) {
        throw new Error('Suggestion not found');
      }

      suggestion.status = 'rejected';
      suggestion.rejectedAt = new Date();

      await unifiedContent.save();

      console.log('Rejected AI suggestion:', suggestionId, 'for content:', contentId);
      return { success: true, message: 'Suggestion rejected successfully' };
    } catch (error) {
      console.error('Error rejecting AI suggestion:', error);
      throw error;
    }
  }

  /**
   * Get preview URL for content
   */
  static async getPreviewUrl(contentId) {
    try {
      if (!contentId || !/^[0-9a-fA-F]{24}$/.test(contentId)) {
        throw new Error('Invalid content ID format');
      }

      const unifiedContent = await UnifiedContent.findById(contentId);
      if (!unifiedContent) {
        throw new Error('Unified content not found');
      }

      // Generate preview URL
      const previewUrl = `/api/unified-content/${contentId}/preview`;

      return previewUrl;
    } catch (error) {
      console.error('Error getting preview URL:', error);
      throw error;
    }
  }

  /**
   * Generate shareable link with expiration
   */
  static async generateShareableLink(contentId, options = {}) {
    try {
      if (!contentId || !/^[0-9a-fA-F]{24}$/.test(contentId)) {
        throw new Error('Invalid content ID format');
      }

      const { expiresIn = '24h', password = false } = options;

      // Generate unique token
      const token = this.generateSecureToken();

      // Store token with expiration (in a real implementation, you'd store this in cache/database)
      const expirationTime = this.parseExpirationTime(expiresIn);

      const shareableLink = `/api/unified-content/shared/${token}`;

      console.log('Generated shareable link for content:', contentId);
      return shareableLink;
    } catch (error) {
      console.error('Error generating shareable link:', error);
      throw error;
    }
  }

  /**
   * Resolve synchronization conflict
   */
  static async resolveConflict(contentId, conflictId, resolution) {
    try {
      if (!contentId || !/^[0-9a-fA-F]{24}$/.test(contentId)) {
        throw new Error('Invalid content ID format');
      }

      const unifiedContent = await UnifiedContent.findById(contentId);
      if (!unifiedContent) {
        throw new Error('Unified content not found');
      }

      const conflicts = unifiedContent.conflicts || [];
      const conflictIndex = conflicts.findIndex(c => c.id === conflictId);

      if (conflictIndex === -1) {
        throw new Error('Conflict not found');
      }

      const conflict = conflicts[conflictIndex];

      // Apply resolution based on strategy
      switch (resolution.strategy) {
        case 'ai':
          // Use AI version
          this.applyConflictResolution(unifiedContent, conflict, conflict.aiVersion);
          break;
        case 'visual':
          // Use visual version
          this.applyConflictResolution(unifiedContent, conflict, conflict.visualVersion);
          break;
        case 'merge':
          // Smart merge
          const merged = this.mergeConflictVersions(conflict.aiVersion, conflict.visualVersion);
          this.applyConflictResolution(unifiedContent, conflict, merged);
          break;
        case 'custom':
          // Use custom resolution
          if (resolution.customMerge) {
            this.applyConflictResolution(unifiedContent, conflict, resolution.customMerge);
          } else {
            throw new Error('Custom merge data required');
          }
          break;
        default:
          throw new Error('Invalid resolution strategy');
      }

      // Remove the resolved conflict
      conflicts.splice(conflictIndex, 1);
      unifiedContent.conflicts = conflicts;

      // Update sync status
      unifiedContent.syncStatus.contentToVisual.status = 'synced';
      unifiedContent.syncStatus.visualToContent.status = 'synced';

      await unifiedContent.save();

      console.log('Resolved conflict:', conflictId, 'for content:', contentId);
      return { success: true, message: 'Conflict resolved successfully' };
    } catch (error) {
      console.error('Error resolving conflict:', error);
      throw error;
    }
  }

  /**
   * Auto-resolve conflicts using AI
   */
  static async autoResolveConflicts(contentId) {
    try {
      if (!contentId || !/^[0-9a-fA-F]{24}$/.test(contentId)) {
        throw new Error('Invalid content ID format');
      }

      const unifiedContent = await UnifiedContent.findById(contentId);
      if (!unifiedContent) {
        throw new Error('Unified content not found');
      }

      const conflicts = unifiedContent.conflicts || [];
      const resolutions = [];

      for (const conflict of conflicts) {
        // Use AI to determine best resolution strategy
        const strategy = this.determineAutoResolutionStrategy(conflict);

        const resolution = {
          conflictId: conflict.id,
          strategy: strategy,
          confidence: this.calculateResolutionConfidence(conflict, strategy),
          autoResolved: true
        };

        // Apply the resolution
        await this.resolveConflict(contentId, conflict.id, resolution);
        resolutions.push(resolution);
      }

      console.log('Auto-resolved conflicts for content:', contentId);
      return resolutions;
    } catch (error) {
      console.error('Error auto-resolving conflicts:', error);
      throw error;
    }
  }

  /**
   * Helper methods for content suggestions
   */
  static async generateContentSuggestions(unifiedContent, options) {
    const suggestions = [];

    // Content improvement suggestions
    if (options.suggestionTypes?.content !== false) {
      suggestions.push(...this.generateContentImprovementSuggestions(unifiedContent));
    }

    // Image suggestions
    if (options.suggestionTypes?.images !== false) {
      suggestions.push(...this.generateImageSuggestions(unifiedContent));
    }

    // SEO suggestions
    if (options.suggestionTypes?.seo !== false) {
      suggestions.push(...this.generateSEOSuggestions(unifiedContent));
    }

    return suggestions.filter(s => s.confidence >= (options.minimumConfidence || 0.5));
  }

  static generateContentImprovementSuggestions(unifiedContent) {
    const suggestions = [];
    const content = unifiedContent.structuredContent;

    // Suggest better headings
    if (content.overview?.title && content.overview.title.length < 30) {
      suggestions.push({
        type: 'content',
        title: 'Improve Main Heading',
        description: 'Your main heading could be more descriptive and engaging',
        confidence: 0.7,
        preview: `${content.overview.title} - Professional & Comprehensive Care`,
        data: {
          field: 'overview.title',
          newValue: `${content.overview.title} - Professional & Comprehensive Care`
        }
      });
    }

    // Suggest call-to-action improvements
    if (content.cta?.buttonText === 'Click here') {
      suggestions.push({
        type: 'content',
        title: 'Improve Call-to-Action',
        description: 'Generic CTA buttons perform poorly. Make it more specific.',
        confidence: 0.9,
        preview: 'Schedule Your Consultation',
        data: {
          field: 'cta.buttonText',
          newValue: 'Schedule Your Consultation'
        }
      });
    }

    return suggestions;
  }

  static generateImageSuggestions(unifiedContent) {
    const suggestions = [];

    // Suggest hero image if missing
    if (!unifiedContent.structuredContent.hero?.backgroundImage) {
      suggestions.push({
        type: 'image',
        title: 'Add Hero Background Image',
        description: 'A professional hero image would make this page more engaging',
        confidence: 0.8,
        preview: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&h=400',
        data: {
          field: 'hero.backgroundImage',
          newValue: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&h=400'
        }
      });
    }

    return suggestions;
  }

  static generateSEOSuggestions(unifiedContent) {
    const suggestions = [];
    const content = unifiedContent.structuredContent;

    // Suggest meta description
    if (!content.seo?.metaDescription) {
      suggestions.push({
        type: 'seo',
        title: 'Add Meta Description',
        description: 'Meta descriptions help improve search engine rankings',
        confidence: 0.85,
        preview: 'Professional dental care with modern techniques and personalized treatment plans.',
        data: {
          field: 'seo.metaDescription',
          newValue: 'Professional dental care with modern techniques and personalized treatment plans.'
        }
      });
    }

    return suggestions;
  }

  static async applySuggestionToContent(unifiedContent, suggestion) {
    try {
      if (suggestion.type === 'content' || suggestion.type === 'image' || suggestion.type === 'seo') {
        const fieldPath = suggestion.data.field;
        const newValue = suggestion.data.newValue;

        // Apply the change to structured content
        this.setNestedProperty(unifiedContent.structuredContent, fieldPath, newValue);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error applying suggestion to content:', error);
      return false;
    }
  }

  static setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
  }

  static applyConflictResolution(unifiedContent, conflict, resolvedValue) {
    // Apply the resolved value to the appropriate field
    if (conflict.field) {
      this.setNestedProperty(unifiedContent.structuredContent, conflict.field, resolvedValue);
    }
  }

  static mergeConflictVersions(aiVersion, visualVersion) {
    // Simple merge strategy - in production, this would be more sophisticated
    return {
      ...aiVersion,
      ...visualVersion
    };
  }

  static determineAutoResolutionStrategy(conflict) {
    // Auto-resolution logic based on conflict type and confidence
    if (conflict.type === 'content' && conflict.confidence > 0.8) {
      return 'ai';
    }
    if (conflict.type === 'visual') {
      return 'visual';
    }
    return 'merge';
  }

  static calculateResolutionConfidence(conflict, strategy) {
    // Calculate confidence based on conflict type and chosen strategy
    const baseConfidence = conflict.confidence || 0.5;

    if (strategy === 'merge') {
      return Math.min(baseConfidence + 0.2, 1.0);
    }

    return baseConfidence;
  }

  static generateSecureToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  static parseExpirationTime(expiresIn) {
    const units = {
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'm': 60 * 1000
    };

    const match = expiresIn.match(/^(\d+)([hdm])$/);
    if (!match) return 24 * 60 * 60 * 1000; // Default 24 hours

    const [, amount, unit] = match;
    return parseInt(amount) * units[unit];
  }
}

module.exports = UnifiedContentService;