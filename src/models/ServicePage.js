const mongoose = require('mongoose');

/**
 * Service Page Schema
 * Stores LLM-generated and customized content for dental service pages
 * Links to websites and dental services for dynamic page generation
 */
const servicePageSchema = new mongoose.Schema({
  // Reference to the website this service page belongs to
  websiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: true
  },

  // Reference to the dental service this page is for
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DentalService',
    required: true
  },

  // Doctor who owns this service page
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Page identification
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },

  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  // Page status and visibility
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // Page content sections
  content: {
    // Hero section
    hero: {
      title: {
        type: String,
        maxlength: 200
      },
      subtitle: {
        type: String,
        maxlength: 300
      },
      description: {
        type: String,
        maxlength: 500
      },
      ctaText: {
        type: String,
        maxlength: 50,
        default: 'Book Appointment'
      },
      backgroundImage: {
        type: String,
        maxlength: 500
      }
    },

    // Overview section
    overview: {
      title: {
        type: String,
        maxlength: 200,
        default: 'Overview'
      },
      content: {
        type: String,
        maxlength: 2000
      },
      highlights: [{
        type: String,
        maxlength: 200
      }]
    },

    // Benefits section
    benefits: {
      title: {
        type: String,
        maxlength: 200,
        default: 'Benefits'
      },
      introduction: {
        type: String,
        maxlength: 500
      },
      list: [{
        title: {
          type: String,
          required: true,
          maxlength: 100
        },
        description: {
          type: String,
          maxlength: 300
        },
        icon: {
          type: String,
          maxlength: 100
        }
      }]
    },

    // Procedure section
    procedure: {
      title: {
        type: String,
        maxlength: 200,
        default: 'The Procedure'
      },
      introduction: {
        type: String,
        maxlength: 500
      },
      steps: [{
        stepNumber: {
          type: Number,
          required: true
        },
        title: {
          type: String,
          required: true,
          maxlength: 100
        },
        description: {
          type: String,
          maxlength: 500
        },
        duration: {
          type: String,
          maxlength: 100
        }
      }],
      additionalInfo: {
        type: String,
        maxlength: 1000
      }
    },

    // FAQ section
    faq: {
      title: {
        type: String,
        maxlength: 200,
        default: 'Frequently Asked Questions'
      },
      introduction: {
        type: String,
        maxlength: 500
      },
      questions: [{
        question: {
          type: String,
          required: true,
          maxlength: 200
        },
        answer: {
          type: String,
          required: true,
          maxlength: 1000
        },
        order: {
          type: Number,
          default: 0
        }
      }]
    },

    // Pricing section
    pricing: {
      title: {
        type: String,
        maxlength: 200,
        default: 'Pricing'
      },
      showPricing: {
        type: Boolean,
        default: false
      },
      introduction: {
        type: String,
        maxlength: 500
      },
      plans: [{
        name: {
          type: String,
          required: true,
          maxlength: 100
        },
        price: {
          type: Number,
          min: 0
        },
        priceNote: {
          type: String,
          maxlength: 100
        },
        features: [{
          type: String,
          maxlength: 200
        }],
        isPopular: {
          type: Boolean,
          default: false
        }
      }],
      disclaimer: {
        type: String,
        maxlength: 500
      }
    },

    // Before/After section
    beforeAfter: {
      title: {
        type: String,
        maxlength: 200,
        default: 'Before & After'
      },
      showSection: {
        type: Boolean,
        default: false
      },
      introduction: {
        type: String,
        maxlength: 500
      },
      gallery: [{
        beforeImage: {
          type: String,
          maxlength: 500
        },
        afterImage: {
          type: String,
          maxlength: 500
        },
        title: {
          type: String,
          maxlength: 100
        },
        description: {
          type: String,
          maxlength: 300
        }
      }]
    },

    // Recovery and aftercare section
    aftercare: {
      title: {
        type: String,
        maxlength: 200,
        default: 'Recovery & Aftercare'
      },
      showSection: {
        type: Boolean,
        default: true
      },
      introduction: {
        type: String,
        maxlength: 500
      },
      instructions: [{
        title: {
          type: String,
          required: true,
          maxlength: 100
        },
        description: {
          type: String,
          maxlength: 500
        },
        timeframe: {
          type: String,
          maxlength: 100
        }
      }],
      warnings: [{
        type: String,
        maxlength: 300
      }]
    },

    // Call-to-action section
    cta: {
      title: {
        type: String,
        maxlength: 200,
        default: 'Ready to Schedule Your Appointment?'
      },
      subtitle: {
        type: String,
        maxlength: 300
      },
      buttonText: {
        type: String,
        maxlength: 50,
        default: 'Book Now'
      },
      phoneNumber: {
        type: String,
        maxlength: 20
      },
      email: {
        type: String,
        maxlength: 100
      },
      backgroundColor: {
        type: String,
        maxlength: 20,
        default: '#2563eb'
      }
    },

    // Custom sections for additional content
    customSections: [{
      id: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true,
        maxlength: 200
      },
      content: {
        type: String,
        required: true,
        maxlength: 3000
      },
      order: {
        type: Number,
        default: 0
      },
      showSection: {
        type: Boolean,
        default: true
      }
    }]
  },

  // SEO and metadata
  seo: {
    metaTitle: {
      type: String,
      maxlength: 60,
      trim: true
    },
    metaDescription: {
      type: String,
      maxlength: 160,
      trim: true
    },
    keywords: [{
      type: String,
      maxlength: 50
    }],
    focusKeyword: {
      type: String,
      maxlength: 100
    },
    canonicalUrl: {
      type: String,
      maxlength: 500
    },
    ogImage: {
      type: String,
      maxlength: 500
    },
    structuredData: {
      type: mongoose.Schema.Types.Mixed
    }
  },

  // Content generation tracking
  generation: {
    lastGenerated: {
      type: Date
    },
    generatedBy: {
      type: String,
      enum: ['google-ai', 'deepseek', 'manual', 'template'],
      default: 'manual'
    },
    promptUsed: {
      type: String,
      maxlength: 1000
    },
    llmModel: {
      type: String,
      maxlength: 100
    },
    tokensUsed: {
      type: Number,
      min: 0
    },
    generationTime: {
      type: Number, // milliseconds
      min: 0
    },
    autoRegenerate: {
      type: Boolean,
      default: false
    }
  },

  // Page customization
  design: {
    template: {
      type: String,
      enum: ['standard', 'detailed', 'minimal', 'premium'],
      default: 'standard'
    },
    colorScheme: {
      primary: {
        type: String,
        maxlength: 20,
        default: '#2563eb'
      },
      secondary: {
        type: String,
        maxlength: 20,
        default: '#64748b'
      },
      accent: {
        type: String,
        maxlength: 20,
        default: '#10b981'
      }
    },
    layout: {
      showSidebar: {
        type: Boolean,
        default: false
      },
      sidebarContent: {
        type: String,
        enum: ['related-services', 'contact-info', 'testimonials', 'none'],
        default: 'related-services'
      }
    }
  },

  // Performance and analytics
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    bookings: {
      type: Number,
      default: 0
    },
    lastViewed: {
      type: Date
    },
    averageTimeOnPage: {
      type: Number, // seconds
      default: 0
    },
    bounceRate: {
      type: Number, // percentage
      default: 0
    },
    conversionRate: {
      type: Number, // percentage
      default: 0
    }
  },

  // Version control system
  versions: [{
    versionNumber: {
      type: String,
      required: true
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    components: [{
      type: {
        type: String,
        required: true
      },
      props: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      children: {
        type: mongoose.Schema.Types.Mixed,
        default: []
      },
      id: {
        type: String,
        required: true
      }
    }],
    seo: {
      type: mongoose.Schema.Types.Mixed
    },
    design: {
      type: mongoose.Schema.Types.Mixed
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changeLog: {
      type: String,
      maxlength: 500
    },
    isPublished: {
      type: Boolean,
      default: false
    }
  }],

  currentVersion: {
    type: String,
    default: '1.0'
  },

  editingMode: {
    type: String,
    enum: ['template', 'visual', 'hybrid'],
    default: 'template'
  },

  // Version control
  version: {
    type: Number,
    default: 1
  },

  publishedAt: {
    type: Date
  },

  // Integration with website (for LLM workflow)
  isIntegrated: {
    type: Boolean,
    default: false
  },

  integratedAt: {
    type: Date
  },

  lastModified: {
    type: Date,
    default: Date.now
  },

  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
servicePageSchema.index({ websiteId: 1, serviceId: 1 }, { unique: true });
servicePageSchema.index({ doctorId: 1, status: 1 });
servicePageSchema.index({ slug: 1 });
servicePageSchema.index({ status: 1, isActive: 1 });

// Pre-save middleware
servicePageSchema.pre('save', function(next) {
  this.lastModified = new Date();

  // Auto-generate slug if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Update published date when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

// Virtual for full URL
servicePageSchema.virtual('fullUrl').get(function() {
  return `/services/${this.slug}`;
});

// Virtual for reading time estimate
servicePageSchema.virtual('readingTimeMinutes').get(function() {
  const wordsPerMinute = 200;
  let totalWords = 0;

  // Count words in all content sections
  const content = this.content;
  if (content.overview?.content) totalWords += content.overview.content.split(' ').length;
  if (content.procedure?.introduction) totalWords += content.procedure.introduction.split(' ').length;
  if (content.benefits?.introduction) totalWords += content.benefits.introduction.split(' ').length;

  // Add words from FAQ answers
  if (content.faq?.questions) {
    content.faq.questions.forEach(q => {
      totalWords += q.answer.split(' ').length;
    });
  }

  return Math.ceil(totalWords / wordsPerMinute) || 1;
});

// Static method to find pages by website
servicePageSchema.statics.findByWebsite = function(websiteId, publishedOnly = false) {
  const query = { websiteId, isActive: true };
  if (publishedOnly) {
    query.status = 'published';
  }
  return this.find(query).populate('serviceId').sort({ 'serviceId.name': 1 });
};

// Static method to find page by slug
servicePageSchema.statics.findBySlug = function(slug, websiteId) {
  return this.findOne({ slug, websiteId, isActive: true, status: 'published' })
    .populate('serviceId')
    .populate('websiteId');
};

// Method to increment view count
servicePageSchema.methods.incrementView = function(isUnique = false) {
  this.analytics.views += 1;
  if (isUnique) {
    this.analytics.uniqueViews += 1;
  }
  this.analytics.lastViewed = new Date();
  return this.save();
};

// Method to record booking conversion
servicePageSchema.methods.recordBooking = function() {
  this.analytics.bookings += 1;
  // Update conversion rate
  if (this.analytics.uniqueViews > 0) {
    this.analytics.conversionRate = (this.analytics.bookings / this.analytics.uniqueViews) * 100;
  }
  return this.save();
};

// Method to generate structured data for SEO
servicePageSchema.methods.generateStructuredData = function() {
  const service = this.serviceId;
  const website = this.websiteId;

  return {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    "name": this.title,
    "description": this.content.overview?.content || this.seo.metaDescription,
    "procedureType": service?.categoryDisplayName,
    "bodyLocation": "Mouth",
    "preparation": this.content.procedure?.introduction,
    "followup": this.content.aftercare?.introduction,
    "provider": {
      "@type": "Dentist",
      "name": website?.name || "Dental Practice",
      "url": website?.deployment?.url
    },
    "offers": this.content.pricing?.showPricing && this.content.pricing.plans.length > 0 ? {
      "@type": "Offer",
      "price": this.content.pricing.plans[0]?.price,
      "priceCurrency": "USD"
    } : undefined
  };
};

// Method to export content for static site generation
servicePageSchema.methods.exportForStaticSite = function() {
  return {
    title: this.title,
    slug: this.slug,
    content: this.content,
    seo: this.seo,
    analytics: {
      views: this.analytics.views,
      readingTime: this.readingTimeMinutes
    },
    service: this.serviceId,
    structuredData: this.generateStructuredData()
  };
};

// Method to create a new version
servicePageSchema.methods.createVersion = function(content, components, seo, design, userId, changeLog) {
  const versionNumber = this.getNextVersionNumber();

  const newVersion = {
    versionNumber,
    content: content || this.content,
    components: components || [],
    seo: seo || this.seo,
    design: design || this.design,
    createdBy: userId,
    changeLog: changeLog || `Version ${versionNumber} created`,
    isPublished: false
  };

  this.versions.push(newVersion);
  this.currentVersion = versionNumber;
  return this.save();
};

// Method to get next version number
servicePageSchema.methods.getNextVersionNumber = function() {
  if (this.versions.length === 0) {
    return '1.0';
  }

  const lastVersion = this.versions[this.versions.length - 1];
  const [major, minor] = lastVersion.versionNumber.split('.').map(Number);
  return `${major}.${minor + 1}`;
};

// Method to restore a specific version
servicePageSchema.methods.restoreVersion = function(versionNumber, userId) {
  const version = this.versions.find(v => v.versionNumber === versionNumber);
  if (!version) {
    throw new Error('Version not found');
  }

  // Update current content with version data
  this.content = version.content;
  this.seo = version.seo;
  this.design = version.design;
  this.currentVersion = versionNumber;
  this.lastModifiedBy = userId;

  return this.save();
};

// Method to get current version data
servicePageSchema.methods.getCurrentVersionData = function() {
  const currentVersion = this.versions.find(v => v.versionNumber === this.currentVersion);
  return currentVersion || null;
};

// Method to publish a version
servicePageSchema.methods.publishVersion = function(versionNumber) {
  const version = this.versions.find(v => v.versionNumber === versionNumber);
  if (!version) {
    throw new Error('Version not found');
  }

  // Mark all other versions as unpublished
  this.versions.forEach(v => v.isPublished = false);

  // Publish the selected version
  version.isPublished = true;
  this.status = 'published';
  this.publishedAt = new Date();
  this.currentVersion = versionNumber;

  return this.save();
};

// Method to get editing capabilities based on mode
servicePageSchema.methods.getEditingCapabilities = function() {
  const capabilities = {
    template: {
      canEditContent: true,
      canEditComponents: false,
      canEditLayout: false,
      canEditSEO: true,
      canEditDesign: true
    },
    visual: {
      canEditContent: true,
      canEditComponents: true,
      canEditLayout: true,
      canEditSEO: true,
      canEditDesign: true
    },
    hybrid: {
      canEditContent: true,
      canEditComponents: true,
      canEditLayout: false,
      canEditSEO: true,
      canEditDesign: true
    }
  };

  return capabilities[this.editingMode] || capabilities.template;
};

const ServicePage = mongoose.model('ServicePage', servicePageSchema);

module.exports = ServicePage;