const mongoose = require('mongoose');

/**
 * Content Template Schema
 * Stores reusable content patterns and templates for service page generation
 * Allows doctors to create and reuse custom content templates across services
 */
const contentTemplateSchema = new mongoose.Schema({
  // Template identification
  name: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },

  description: {
    type: String,
    maxlength: 300,
    trim: true
  },

  // Template type and category
  type: {
    type: String,
    required: true,
    enum: [
      'service-page', // Full service page template
      'section', // Individual section template
      'prompt', // LLM prompt template
      'seo', // SEO metadata template
      'content-block' // Reusable content block
    ]
  },

  category: {
    type: String,
    enum: [
      'general-dentistry',
      'cosmetic-dentistry',
      'orthodontics',
      'oral-surgery',
      'pediatric-dentistry',
      'emergency-dentistry',
      'periodontics',
      'endodontics',
      'prosthodontics',
      'oral-pathology',
      'universal' // Can be used for any service type
    ],
    default: 'universal'
  },

  // Template ownership and sharing
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  isPublic: {
    type: Boolean,
    default: false // Private by default
  },

  isSystemTemplate: {
    type: Boolean,
    default: false // Created by system vs user
  },

  // Template content structure
  template: {
    // For service-page type templates
    servicePage: {
      // Hero section template
      hero: {
        titlePattern: {
          type: String,
          maxlength: 300
        },
        subtitlePattern: {
          type: String,
          maxlength: 500
        },
        descriptionPattern: {
          type: String,
          maxlength: 800
        },
        ctaText: {
          type: String,
          maxlength: 50
        }
      },

      // Overview section template
      overview: {
        titlePattern: {
          type: String,
          maxlength: 200
        },
        contentPattern: {
          type: String,
          maxlength: 2000
        },
        highlightsPattern: [{
          type: String,
          maxlength: 300
        }]
      },

      // Benefits section template
      benefits: {
        titlePattern: {
          type: String,
          maxlength: 200
        },
        introductionPattern: {
          type: String,
          maxlength: 500
        },
        benefitTemplates: [{
          titlePattern: {
            type: String,
            maxlength: 150
          },
          descriptionPattern: {
            type: String,
            maxlength: 400
          },
          iconSuggestion: {
            type: String,
            maxlength: 100
          }
        }]
      },

      // Procedure section template
      procedure: {
        titlePattern: {
          type: String,
          maxlength: 200
        },
        introductionPattern: {
          type: String,
          maxlength: 500
        },
        stepTemplates: [{
          titlePattern: {
            type: String,
            maxlength: 150
          },
          descriptionPattern: {
            type: String,
            maxlength: 500
          },
          durationPattern: {
            type: String,
            maxlength: 100
          }
        }]
      },

      // FAQ section template
      faq: {
        titlePattern: {
          type: String,
          maxlength: 200
        },
        introductionPattern: {
          type: String,
          maxlength: 500
        },
        questionTemplates: [{
          questionPattern: {
            type: String,
            maxlength: 300
          },
          answerPattern: {
            type: String,
            maxlength: 1000
          }
        }]
      },

      // Aftercare section template
      aftercare: {
        titlePattern: {
          type: String,
          maxlength: 200
        },
        introductionPattern: {
          type: String,
          maxlength: 500
        },
        instructionTemplates: [{
          titlePattern: {
            type: String,
            maxlength: 150
          },
          descriptionPattern: {
            type: String,
            maxlength: 500
          },
          timeframePattern: {
            type: String,
            maxlength: 100
          }
        }]
      },

      // CTA section template
      cta: {
        titlePattern: {
          type: String,
          maxlength: 200
        },
        subtitlePattern: {
          type: String,
          maxlength: 300
        },
        buttonText: {
          type: String,
          maxlength: 50
        }
      }
    },

    // For individual section templates
    section: {
      sectionType: {
        type: String,
        enum: ['hero', 'overview', 'benefits', 'procedure', 'faq', 'aftercare', 'cta', 'custom']
      },
      content: {
        type: mongoose.Schema.Types.Mixed // Flexible structure for any section type
      }
    },

    // For LLM prompt templates
    prompt: {
      systemPrompt: {
        type: String,
        maxlength: 2000
      },
      userPromptTemplate: {
        type: String,
        maxlength: 2000
      },
      expectedOutput: {
        type: String,
        enum: ['text', 'json', 'html', 'markdown']
      },
      variables: [{
        name: {
          type: String,
          required: true
        },
        description: {
          type: String
        },
        type: {
          type: String,
          enum: ['string', 'number', 'boolean', 'array']
        },
        required: {
          type: Boolean,
          default: false
        }
      }]
    },

    // For SEO templates
    seo: {
      metaTitlePattern: {
        type: String,
        maxlength: 100
      },
      metaDescriptionPattern: {
        type: String,
        maxlength: 200
      },
      keywordTemplates: [{
        type: String,
        maxlength: 100
      }],
      structuredDataTemplate: {
        type: mongoose.Schema.Types.Mixed
      }
    },

    // For content block templates
    contentBlock: {
      htmlTemplate: {
        type: String,
        maxlength: 5000
      },
      cssStyles: {
        type: String,
        maxlength: 2000
      },
      variables: [{
        name: {
          type: String,
          required: true
        },
        placeholder: {
          type: String
        },
        type: {
          type: String,
          enum: ['text', 'image', 'link', 'number']
        }
      }]
    }
  },

  // Template variables and placeholders
  variables: [{
    name: {
      type: String,
      required: true,
      maxlength: 50
    },
    description: {
      type: String,
      maxlength: 200
    },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'array', 'object'],
      default: 'text'
    },
    required: {
      type: Boolean,
      default: false
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed
    },
    placeholder: {
      type: String,
      maxlength: 100
    }
  }],

  // LLM generation settings
  llmSettings: {
    provider: {
      type: String,
      enum: ['google-ai', 'deepseek', 'openai', 'manual'],
      default: 'google-ai'
    },
    model: {
      type: String,
      maxlength: 100
    },
    temperature: {
      type: Number,
      min: 0,
      max: 2,
      default: 0.7
    },
    maxTokens: {
      type: Number,
      min: 1,
      max: 4000,
      default: 1000
    },
    systemPrompt: {
      type: String,
      maxlength: 2000
    },
    userPromptTemplate: {
      type: String,
      maxlength: 2000
    }
  },

  // Template usage and analytics
  usage: {
    useCount: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0
    }
  },

  // Template status
  status: {
    type: String,
    enum: ['active', 'archived', 'draft'],
    default: 'active'
  },

  // Version control
  version: {
    type: Number,
    default: 1
  },

  parentTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentTemplate'
  },

  tags: [{
    type: String,
    maxlength: 50
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
contentTemplateSchema.index({ doctorId: 1, type: 1, status: 1 });
contentTemplateSchema.index({ category: 1, isPublic: 1, status: 1 });
contentTemplateSchema.index({ isSystemTemplate: 1, type: 1 });
contentTemplateSchema.index({ tags: 1 });

// Virtual for popularity score
contentTemplateSchema.virtual('popularityScore').get(function() {
  const useWeight = 0.7;
  const ratingWeight = 0.3;

  const normalizedUseCount = Math.log10(this.usage.useCount + 1);
  const normalizedRating = (this.usage.rating || 0) / 5;

  return (normalizedUseCount * useWeight) + (normalizedRating * ratingWeight);
});

// Static method to find templates by category
contentTemplateSchema.statics.findByCategory = function(category, type = null, doctorId = null) {
  const query = {
    $or: [
      { category: category },
      { category: 'universal' }
    ],
    status: 'active'
  };

  if (type) {
    query.type = type;
  }

  if (doctorId) {
    query.$or = [
      { doctorId: doctorId },
      { isPublic: true },
      { isSystemTemplate: true }
    ];
  } else {
    query.$or = [
      { isPublic: true },
      { isSystemTemplate: true }
    ];
  }

  return this.find(query).sort({ 'usage.useCount': -1, 'usage.rating': -1 });
};

// Static method to find public templates
contentTemplateSchema.statics.findPublic = function(type = null, category = null) {
  const query = {
    $or: [
      { isPublic: true },
      { isSystemTemplate: true }
    ],
    status: 'active'
  };

  if (type) {
    query.type = type;
  }

  if (category) {
    query.category = { $in: [category, 'universal'] };
  }

  return this.find(query).sort({ 'usage.useCount': -1, createdAt: -1 });
};

// Static method to find doctor's templates
contentTemplateSchema.statics.findByDoctor = function(doctorId, type = null) {
  const query = { doctorId, status: 'active' };

  if (type) {
    query.type = type;
  }

  return this.find(query).sort({ updatedAt: -1 });
};

// Method to increment usage count
contentTemplateSchema.methods.incrementUsage = function() {
  this.usage.useCount += 1;
  this.usage.lastUsed = new Date();
  return this.save();
};

// Method to add rating
contentTemplateSchema.methods.addRating = function(rating) {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const currentTotal = (this.usage.rating || 0) * (this.usage.ratingCount || 0);
  this.usage.ratingCount += 1;
  this.usage.rating = (currentTotal + rating) / this.usage.ratingCount;

  return this.save();
};

// Method to render template with variables
contentTemplateSchema.methods.render = function(variables = {}) {
  let renderedTemplate = JSON.parse(JSON.stringify(this.template));

  // Replace variables in template
  const replaceVariables = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return variables[varName] || match;
      });
    } else if (Array.isArray(obj)) {
      return obj.map(replaceVariables);
    } else if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = replaceVariables(value);
      }
      return result;
    }
    return obj;
  };

  return replaceVariables(renderedTemplate);
};

// Method to validate required variables
contentTemplateSchema.methods.validateVariables = function(variables = {}) {
  const requiredVars = this.variables.filter(v => v.required);
  const missingVars = requiredVars.filter(v => !variables.hasOwnProperty(v.name));

  if (missingVars.length > 0) {
    throw new Error(`Missing required variables: ${missingVars.map(v => v.name).join(', ')}`);
  }

  return true;
};

// Method to clone template
contentTemplateSchema.methods.clone = function(newName, doctorId) {
  const clonedData = {
    name: newName,
    description: `Copy of ${this.name}`,
    type: this.type,
    category: this.category,
    doctorId: doctorId,
    template: JSON.parse(JSON.stringify(this.template)),
    variables: JSON.parse(JSON.stringify(this.variables)),
    llmSettings: JSON.parse(JSON.stringify(this.llmSettings)),
    parentTemplate: this._id,
    version: 1
  };

  return new this.constructor(clonedData);
};

const ContentTemplate = mongoose.model('ContentTemplate', contentTemplateSchema);

module.exports = ContentTemplate;