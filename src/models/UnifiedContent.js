const mongoose = require('mongoose');

/**
 * Unified Content Model
 *
 * This model bridges the gap between AI-generated structured content (ServicePage)
 * and visual component data (Destack/Page). It provides a single source of truth
 * that supports both content formats while maintaining synchronization.
 */

// Component definition for visual editing
const componentSchema = new mongoose.Schema({
  // Unique identifier for the component
  id: {
    type: String,
    required: true
  },

  // Component type (matches Destack component types)
  type: {
    type: String,
    required: true,
    enum: [
      'ServiceHero', 'ServiceOverview', 'ServiceBenefits', 'ServiceProcedure',
      'ServiceFAQ', 'ServiceCTA', 'ServicePricing', 'ServiceBeforeAfter',
      'ServiceAftercareInstructions', 'Container', 'Text', 'Image', 'Button',
      'Grid', 'Section', 'Header', 'Footer', 'Form', 'Testimonial', 'Gallery'
    ]
  },

  // Component properties and configuration
  props: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Child components (for nested structures)
  children: [{
    type: mongoose.Schema.Types.Mixed,
    default: []
  }],

  // Layout and positioning
  layout: {
    order: {
      type: Number,
      default: 0
    },
    grid: {
      columns: {
        type: Number,
        min: 1,
        max: 12,
        default: 12
      },
      span: {
        type: Number,
        min: 1,
        max: 12,
        default: 12
      }
    },
    responsive: {
      mobile: {
        hidden: { type: Boolean, default: false },
        span: { type: Number, min: 1, max: 12, default: 12 }
      },
      tablet: {
        hidden: { type: Boolean, default: false },
        span: { type: Number, min: 1, max: 12, default: 12 }
      },
      desktop: {
        hidden: { type: Boolean, default: false },
        span: { type: Number, min: 1, max: 12, default: 12 }
      }
    }
  },

  // Styling and design options
  styling: {
    className: {
      type: String,
      default: ''
    },
    customCSS: {
      type: String,
      default: ''
    },
    theme: {
      primary: { type: String, default: '#2563eb' },
      secondary: { type: String, default: '#64748b' },
      accent: { type: String, default: '#10b981' }
    }
  },

  // Content binding to structured data
  contentBinding: {
    // Maps to ServicePage content sections
    section: {
      type: String,
      enum: ['hero', 'overview', 'benefits', 'procedure', 'faq', 'pricing', 'beforeAfter', 'aftercare', 'cta', 'custom']
    },
    field: {
      type: String // e.g., 'title', 'content', 'list', etc.
    },
    subfield: {
      type: String // for nested fields like 'benefits.list[0].title'
    },
    index: {
      type: Number // for array items
    }
  },

  // AI suggestions and modifications
  aiSuggestions: [{
    suggestionId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['content', 'style', 'layout', 'new_component'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'applied'],
      default: 'pending'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Component state and metadata
  isVisible: {
    type: Boolean,
    default: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  lastModifiedBy: {
    type: String,
    enum: ['user', 'ai', 'system'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Main unified content schema
const unifiedContentSchema = new mongoose.Schema({
  // Reference to the service page
  servicePageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServicePage',
    required: true
  },

  // Reference to the website
  websiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: true
  },

  // Reference to the doctor/user
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Content structure mapping
  contentStructure: {
    // Maps structured content sections to component IDs
    hero: {
      componentIds: [String],
      lastSync: Date
    },
    overview: {
      componentIds: [String],
      lastSync: Date
    },
    benefits: {
      componentIds: [String],
      lastSync: Date
    },
    procedure: {
      componentIds: [String],
      lastSync: Date
    },
    faq: {
      componentIds: [String],
      lastSync: Date
    },
    pricing: {
      componentIds: [String],
      lastSync: Date
    },
    beforeAfter: {
      componentIds: [String],
      lastSync: Date
    },
    aftercare: {
      componentIds: [String],
      lastSync: Date
    },
    cta: {
      componentIds: [String],
      lastSync: Date
    },
    custom: {
      componentIds: [String],
      lastSync: Date
    }
  },

  // Visual components array (Destack format)
  components: [componentSchema],

  // Structured content (ServicePage format)
  structuredContent: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Synchronization status
  syncStatus: {
    lastFullSync: {
      type: Date
    },
    contentToVisual: {
      lastSync: Date,
      status: {
        type: String,
        enum: ['synced', 'pending', 'conflict', 'error'],
        default: 'synced'
      },
      conflicts: [{
        field: String,
        contentValue: mongoose.Schema.Types.Mixed,
        visualValue: mongoose.Schema.Types.Mixed,
        resolution: {
          type: String,
          enum: ['use_content', 'use_visual', 'merge', 'manual'],
          default: 'manual'
        }
      }]
    },
    visualToContent: {
      lastSync: Date,
      status: {
        type: String,
        enum: ['synced', 'pending', 'conflict', 'error'],
        default: 'synced'
      },
      conflicts: [{
        componentId: String,
        field: String,
        contentValue: mongoose.Schema.Types.Mixed,
        visualValue: mongoose.Schema.Types.Mixed,
        resolution: {
          type: String,
          enum: ['use_content', 'use_visual', 'merge', 'manual'],
          default: 'manual'
        }
      }]
    }
  },

  // AI interaction and suggestions
  aiInteraction: {
    lastGeneration: {
      type: Date
    },
    generationCount: {
      type: Number,
      default: 0
    },
    pendingSuggestions: {
      type: Number,
      default: 0
    },
    acceptedSuggestions: {
      type: Number,
      default: 0
    },
    rejectedSuggestions: {
      type: Number,
      default: 0
    },
    autoAcceptThreshold: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.9
    }
  },

  // Editing context and preferences
  editingContext: {
    mode: {
      type: String,
      enum: ['visual', 'content', 'hybrid'],
      default: 'hybrid'
    },
    activeSection: {
      type: String
    },
    selectedComponents: [String],
    viewMode: {
      type: String,
      enum: ['edit', 'preview', 'mobile', 'tablet', 'desktop'],
      default: 'edit'
    }
  },

  // Asset management
  assets: [{
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'icon'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String
    },
    title: {
      type: String
    },
    caption: {
      type: String
    },
    metadata: {
      width: Number,
      height: Number,
      fileSize: Number,
      format: String,
      source: {
        type: String,
        enum: ['upload', 'unsplash', 'pexels', 'stock', 'ai_generated']
      }
    },
    usedInComponents: [String]
  }],

  // Version control and history
  version: {
    current: {
      type: String,
      default: '1.0'
    },
    history: [{
      version: {
        type: String,
        required: true
      },
      changes: {
        type: String,
        required: true
      },
      changeType: {
        type: String,
        enum: ['ai_generation', 'visual_edit', 'content_edit', 'sync', 'merge'],
        required: true
      },
      snapshot: {
        components: [mongoose.Schema.Types.Mixed],
        structuredContent: mongoose.Schema.Types.Mixed
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },

  // Performance and analytics
  analytics: {
    editingSessions: {
      type: Number,
      default: 0
    },
    totalEdits: {
      type: Number,
      default: 0
    },
    aiSuggestionsUsed: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    averageEditDuration: {
      type: Number, // in minutes
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
unifiedContentSchema.index({ servicePageId: 1 });
unifiedContentSchema.index({ websiteId: 1 });
unifiedContentSchema.index({ doctorId: 1 });
unifiedContentSchema.index({ 'syncStatus.contentToVisual.status': 1 });
unifiedContentSchema.index({ 'syncStatus.visualToContent.status': 1 });
unifiedContentSchema.index({ 'components.id': 1 });

// Virtual for conflict count
unifiedContentSchema.virtual('conflictCount').get(function() {
  const contentConflicts = this.syncStatus.contentToVisual.conflicts?.length || 0;
  const visualConflicts = this.syncStatus.visualToContent.conflicts?.length || 0;
  return contentConflicts + visualConflicts;
});

// Virtual for sync health
unifiedContentSchema.virtual('syncHealth').get(function() {
  const contentStatus = this.syncStatus.contentToVisual.status;
  const visualStatus = this.syncStatus.visualToContent.status;

  if (contentStatus === 'synced' && visualStatus === 'synced') {
    return 'healthy';
  } else if (contentStatus === 'conflict' || visualStatus === 'conflict') {
    return 'conflicts';
  } else if (contentStatus === 'error' || visualStatus === 'error') {
    return 'error';
  } else {
    return 'pending';
  }
});

// Pre-save middleware
unifiedContentSchema.pre('save', function(next) {
  // Update analytics
  this.analytics.lastActivity = new Date();

  // Auto-increment edit count if components changed
  if (this.isModified('components')) {
    this.analytics.totalEdits += 1;
  }

  // Update version if significant changes
  if (this.isModified('components') || this.isModified('structuredContent')) {
    this.version.current = this.getNextVersion();
  }

  next();
});

// Instance methods

// Get next version number
unifiedContentSchema.methods.getNextVersion = function() {
  const current = this.version.current;
  const [major, minor] = current.split('.').map(Number);
  return `${major}.${minor + 1}`;
};

// Sync content to visual components
unifiedContentSchema.methods.syncContentToVisual = function() {
  try {
    const structuredContent = this.structuredContent;
    const updatedComponents = [];

    // Sync each content section to its corresponding components
    Object.keys(this.contentStructure).forEach(section => {
      const sectionData = structuredContent[section];
      const componentIds = this.contentStructure[section].componentIds || [];

      componentIds.forEach(componentId => {
        const component = this.components.find(c => c.id === componentId);
        if (component && sectionData) {
          // Update component props with content data
          component.props = this.mapContentToProps(section, sectionData, component.type);
          component.lastModified = new Date();
          component.lastModifiedBy = 'system';
          updatedComponents.push(component);
        }
      });
    });

    // Update sync status
    this.syncStatus.contentToVisual.lastSync = new Date();
    this.syncStatus.contentToVisual.status = 'synced';

    return updatedComponents;
  } catch (error) {
    this.syncStatus.contentToVisual.status = 'error';
    throw error;
  }
};

// Sync visual components to content
unifiedContentSchema.methods.syncVisualToContent = function() {
  try {
    const updatedContent = { ...this.structuredContent };

    // Sync each component back to structured content
    this.components.forEach(component => {
      if (component.contentBinding && component.contentBinding.section) {
        const section = component.contentBinding.section;
        const field = component.contentBinding.field;

        // Extract content from component props
        const contentData = this.mapPropsToContent(component.props, component.type);

        if (!updatedContent[section]) {
          updatedContent[section] = {};
        }

        if (field) {
          updatedContent[section][field] = contentData[field] || updatedContent[section][field];
        } else {
          Object.assign(updatedContent[section], contentData);
        }
      }
    });

    this.structuredContent = updatedContent;

    // Update sync status
    this.syncStatus.visualToContent.lastSync = new Date();
    this.syncStatus.visualToContent.status = 'synced';

    return updatedContent;
  } catch (error) {
    this.syncStatus.visualToContent.status = 'error';
    throw error;
  }
};

// Map structured content to component props
unifiedContentSchema.methods.mapContentToProps = function(section, contentData, componentType) {
  const mapping = {
    ServiceHero: {
      title: contentData.title,
      subtitle: contentData.subtitle,
      description: contentData.description,
      ctaText: contentData.ctaText,
      backgroundImage: contentData.backgroundImage
    },
    ServiceOverview: {
      title: contentData.title,
      content: contentData.content,
      highlights: contentData.highlights
    },
    ServiceBenefits: {
      title: contentData.title,
      introduction: contentData.introduction,
      benefits: contentData.list
    },
    ServiceProcedure: {
      title: contentData.title,
      introduction: contentData.introduction,
      steps: contentData.steps,
      additionalInfo: contentData.additionalInfo
    },
    ServiceFAQ: {
      title: contentData.title,
      introduction: contentData.introduction,
      questions: contentData.questions
    },
    ServiceCTA: {
      title: contentData.title,
      subtitle: contentData.subtitle,
      buttonText: contentData.buttonText,
      phoneNumber: contentData.phoneNumber,
      email: contentData.email,
      backgroundColor: contentData.backgroundColor
    }
  };

  return mapping[componentType] || contentData;
};

// Map component props to structured content
unifiedContentSchema.methods.mapPropsToContent = function(props, componentType) {
  return props; // For now, direct mapping. Can be enhanced for specific component types
};

// Add AI suggestion
unifiedContentSchema.methods.addAISuggestion = function(componentId, suggestion) {
  const component = this.components.find(c => c.id === componentId);
  if (component) {
    component.aiSuggestions.push({
      suggestionId: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...suggestion
    });
    this.aiInteraction.pendingSuggestions += 1;
  }
};

// Apply AI suggestion
unifiedContentSchema.methods.applyAISuggestion = function(componentId, suggestionId, resolution = 'accepted') {
  const component = this.components.find(c => c.id === componentId);
  if (component) {
    const suggestion = component.aiSuggestions.find(s => s.suggestionId === suggestionId);
    if (suggestion) {
      suggestion.status = resolution === 'accepted' ? 'applied' : 'rejected';

      if (resolution === 'accepted') {
        // Apply the suggested changes
        Object.assign(component.props, suggestion.changes);
        component.lastModified = new Date();
        component.lastModifiedBy = 'ai';
        this.aiInteraction.acceptedSuggestions += 1;
      } else {
        this.aiInteraction.rejectedSuggestions += 1;
      }

      this.aiInteraction.pendingSuggestions -= 1;
    }
  }
};

// Create version snapshot
unifiedContentSchema.methods.createVersionSnapshot = function(changeType, changes, userId) {
  const snapshot = {
    version: this.getNextVersion(),
    changes,
    changeType,
    snapshot: {
      components: this.components,
      structuredContent: this.structuredContent
    },
    createdBy: userId
  };

  this.version.history.push(snapshot);
  this.version.current = snapshot.version;

  return snapshot;
};

// Export to Destack format
unifiedContentSchema.methods.toDestackFormat = function() {
  return {
    type: 'body',
    props: {},
    children: this.components.map(component => ({
      type: component.type,
      props: component.props,
      children: component.children,
      id: component.id
    }))
  };
};

// Export to ServicePage format
unifiedContentSchema.methods.toServicePageFormat = function() {
  return this.structuredContent;
};

const UnifiedContent = mongoose.model('UnifiedContent', unifiedContentSchema);

module.exports = UnifiedContent;