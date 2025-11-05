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

    // Comprehensive content sections for detailed dental service information
    comprehensiveContent: {
      // 1. Introduction (100 words in simple patient terms)
      introduction: {
        content: {
          type: String,
          maxlength: 1000
        },
        wordCount: {
          type: Number,
          default: 0
        }
      },

      // 2. What does it entail - Detailed explanation (500 words in 5 bullet points)
      detailedExplanation: {
        title: {
          type: String,
          maxlength: 200,
          default: 'What Does This Treatment Entail?'
        },
        bulletPoints: [{
          title: {
            type: String,
            maxlength: 150
          },
          content: {
            type: String,
            maxlength: 800
          }
        }],
        totalWordCount: {
          type: Number,
          default: 0
        }
      },

      // 3. Why does one need to undergo this treatment (500 words in 5 bullet points)
      treatmentNeed: {
        title: {
          type: String,
          maxlength: 200,
          default: 'Why Do You Need This Treatment?'
        },
        bulletPoints: [{
          title: {
            type: String,
            maxlength: 150
          },
          content: {
            type: String,
            maxlength: 800
          }
        }],
        totalWordCount: {
          type: Number,
          default: 0
        }
      },

      // 4. Symptoms for which this treatment is required (500 words in 5 bullet points)
      symptoms: {
        title: {
          type: String,
          maxlength: 200,
          default: 'Signs You May Need This Treatment'
        },
        bulletPoints: [{
          title: {
            type: String,
            maxlength: 150
          },
          content: {
            type: String,
            maxlength: 800
          }
        }],
        totalWordCount: {
          type: Number,
          default: 0
        }
      },

      // 5. Consequences when this treatment is not performed (500 words in 5 bullet points)
      consequences: {
        title: {
          type: String,
          maxlength: 200,
          default: 'What Happens If Treatment Is Delayed?'
        },
        bulletPoints: [{
          title: {
            type: String,
            maxlength: 150
          },
          content: {
            type: String,
            maxlength: 800
          }
        }],
        totalWordCount: {
          type: Number,
          default: 0
        }
      },

      // 6. What is the procedure for this treatment - 5 steps (500 words)
      procedureDetails: {
        title: {
          type: String,
          maxlength: 200,
          default: 'Step-by-Step Procedure'
        },
        steps: [{
          stepNumber: {
            type: Number,
            required: true
          },
          title: {
            type: String,
            maxlength: 150,
            required: true
          },
          description: {
            type: String,
            maxlength: 800,
            required: true
          }
        }],
        totalWordCount: {
          type: Number,
          default: 0
        }
      },

      // 7. Post-treatment care (500 words in 5 bullet points)
      postTreatmentCare: {
        title: {
          type: String,
          maxlength: 200,
          default: 'Post-Treatment Care Instructions'
        },
        bulletPoints: [{
          title: {
            type: String,
            maxlength: 150
          },
          content: {
            type: String,
            maxlength: 800
          }
        }],
        totalWordCount: {
          type: Number,
          default: 0
        }
      },

      // 8. Benefits of this procedure (500 words in 5 bullet points)
      detailedBenefits: {
        title: {
          type: String,
          maxlength: 200,
          default: 'Benefits of This Treatment'
        },
        bulletPoints: [{
          title: {
            type: String,
            maxlength: 150
          },
          content: {
            type: String,
            maxlength: 800
          }
        }],
        totalWordCount: {
          type: Number,
          default: 0
        }
      },

      // 9. Side effects (500 words in 5 bullet points)
      sideEffects: {
        title: {
          type: String,
          maxlength: 200,
          default: 'Potential Side Effects'
        },
        bulletPoints: [{
          title: {
            type: String,
            maxlength: 150
          },
          content: {
            type: String,
            maxlength: 800
          }
        }],
        totalWordCount: {
          type: Number,
          default: 0
        }
      },

      // 10. Myths and facts (500 words - 5 myths and facts)
      mythsAndFacts: {
        title: {
          type: String,
          maxlength: 200,
          default: 'Common Myths and Facts'
        },
        items: [{
          myth: {
            type: String,
            maxlength: 500,
            required: true
          },
          fact: {
            type: String,
            maxlength: 500,
            required: true
          }
        }],
        totalWordCount: {
          type: Number,
          default: 0
        }
      },

      // 11. Comprehensive FAQs (25 FAQs with 100-word answers)
      comprehensiveFAQ: {
        title: {
          type: String,
          maxlength: 200,
          default: 'Comprehensive FAQ'
        },
        questions: [{
          question: {
            type: String,
            required: true,
            maxlength: 300
          },
          answer: {
            type: String,
            required: true,
            maxlength: 1000
          },
          category: {
            type: String,
            enum: ['procedure', 'cost', 'pain', 'recovery', 'candidacy', 'risks', 'alternatives', 'results', 'maintenance', 'general'],
            default: 'general'
          },
          order: {
            type: Number,
            default: 0
          },
          wordCount: {
            type: Number,
            default: 0
          }
        }],
        totalQuestions: {
          type: Number,
          default: 0
        }
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

// Helper method to clean content formatting
servicePageSchema.methods.cleanContent = function(content) {
  if (!content || typeof content !== 'string') return '';

  return content
    .replace(/\*\*Answer:\*\*\s*/gi, '') // Remove "**Answer:**" patterns
    .replace(/\*\*Question:\*\*\s*/gi, '') // Remove "**Question:**" patterns
    .replace(/\*\*/g, '') // Remove markdown bold markers
    .replace(/\*/g, '') // Remove markdown italic markers
    .replace(/#{1,6}\s*/g, '') // Remove markdown headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace markdown links with text
    .replace(/`([^`]+)`/g, '$1') // Remove code blocks
    .replace(/Answer:\s*/gi, '') // Remove "Answer:" prefixes
    .replace(/Question:\s*/gi, '') // Remove "Question:" prefixes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
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

// Method to parse and store comprehensive content generated by LLM
servicePageSchema.methods.parseAndStoreComprehensiveContent = function(generatedContent) {
  try {
    const comprehensiveContent = {};

    // Parse each section of generated content
    const sectionMappings = {
      introduction: 'introduction',
      detailedExplanation: 'detailedExplanation',
      treatmentNeed: 'treatmentNeed',
      symptoms: 'symptoms',
      consequences: 'consequences',
      procedureSteps: 'procedureDetails',
      postTreatmentCare: 'postTreatmentCare',
      procedureBenefits: 'detailedBenefits',
      sideEffects: 'sideEffects',
      mythsAndFacts: 'mythsAndFacts',
      comprehensiveFAQ: 'comprehensiveFAQ'
    };

    Object.keys(sectionMappings).forEach(generatedKey => {
      const modelKey = sectionMappings[generatedKey];
      const generatedData = generatedContent[generatedKey];

      if (generatedData && generatedData.content) {
        const content = generatedData.content;

        switch (generatedKey) {
          case 'introduction':
            comprehensiveContent.introduction = {
              content: content,
              wordCount: this.countWords(content)
            };
            break;

          case 'detailedExplanation':
          case 'treatmentNeed':
          case 'symptoms':
          case 'consequences':
          case 'postTreatmentCare':
          case 'procedureBenefits':
          case 'sideEffects':
            const bulletPoints = this.parseBulletPoints(content);
            comprehensiveContent[modelKey] = {
              title: this.getDefaultTitle(modelKey),
              bulletPoints: bulletPoints,
              totalWordCount: this.countWords(content)
            };
            break;

          case 'procedureSteps':
            const steps = this.parseSteps(content);
            comprehensiveContent.procedureDetails = {
              title: 'Step-by-Step Procedure',
              steps: steps,
              totalWordCount: this.countWords(content)
            };
            break;

          case 'mythsAndFacts':
            const mythsAndFacts = this.parseMythsAndFacts(content);
            comprehensiveContent.mythsAndFacts = {
              title: 'Common Myths and Facts',
              items: mythsAndFacts,
              totalWordCount: this.countWords(content)
            };
            break;

          case 'comprehensiveFAQ':
            const faqs = this.parseFAQs(content);
            comprehensiveContent.comprehensiveFAQ = {
              title: 'Comprehensive FAQ',
              questions: faqs,
              totalQuestions: faqs.length
            };
            break;
        }
      }
    });

    // Update the model with parsed content
    this.content.comprehensiveContent = comprehensiveContent;

    // Mark as comprehensive content generated
    this.generation.lastGenerated = new Date();
    this.generation.generatedBy = generatedContent.provider || 'llm';

    return comprehensiveContent;
  } catch (error) {
    throw new Error(`Failed to parse comprehensive content: ${error.message}`);
  }
};

// Helper method to count words
servicePageSchema.methods.countWords = function(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};

// Helper method to get default titles
servicePageSchema.methods.getDefaultTitle = function(section) {
  const titles = {
    detailedExplanation: 'What Does This Treatment Entail?',
    treatmentNeed: 'Why Do You Need This Treatment?',
    symptoms: 'Signs You May Need This Treatment',
    consequences: 'What Happens If Treatment Is Delayed?',
    postTreatmentCare: 'Post-Treatment Care Instructions',
    detailedBenefits: 'Benefits of This Treatment',
    sideEffects: 'Potential Side Effects'
  };
  return titles[section] || 'Information';
};

// Helper method to parse bullet points from LLM content
servicePageSchema.methods.parseBulletPoints = function(content) {
  const bulletPoints = [];

  try {
    // Split content by bullet points or numbered lists
    const lines = content.split(/[\n\r]+/);
    let currentPoint = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if line starts with bullet point or number
      if (trimmedLine.match(/^[•\-\*]\s+/) || trimmedLine.match(/^\d+\.\s+/)) {
        // Save previous point if exists
        if (currentPoint) {
          bulletPoints.push(currentPoint);
        }

        // Start new point
        const titleMatch = trimmedLine.match(/^[•\-\*\d\.\s]*(.+?):\s*(.*)/) ||
                          trimmedLine.match(/^[•\-\*\d\.\s]*(.{1,150}?)\s*-\s*(.*)/) ||
                          trimmedLine.match(/^[•\-\*\d\.\s]*(.+)/);

        if (titleMatch) {
          currentPoint = {
            title: this.cleanContent(titleMatch[1] || titleMatch[0]).substring(0, 60), // Super aggressive: 60 for 100 limit
            content: this.cleanContent(titleMatch[2] || '').substring(0, 200) // Super aggressive: 200 for 300 limit
          };
        }
      } else if (currentPoint && trimmedLine) {
        // Add to current point content with super aggressive limit
        const additionalContent = (currentPoint.content ? ' ' : '') + this.cleanContent(trimmedLine);
        if (currentPoint.content.length + additionalContent.length <= 200) { // Super aggressive: 200 for 300 limit
          currentPoint.content += additionalContent;
        }
      }
    }

    // Add last point
    if (currentPoint) {
      bulletPoints.push(currentPoint);
    }

    // Ensure we have exactly 5 bullet points by splitting or combining if needed
    while (bulletPoints.length < 5 && bulletPoints.length > 0) {
      const longestPoint = bulletPoints.reduce((longest, current) =>
        current.content.length > longest.content.length ? current : longest
      );

      const splitIndex = bulletPoints.indexOf(longestPoint);
      const splitContent = longestPoint.content;
      const midPoint = Math.floor(splitContent.length / 2);
      const splitAt = splitContent.indexOf(' ', midPoint);

      if (splitAt > 0) {
        bulletPoints[splitIndex] = {
          title: longestPoint.title + ' (Part 1)',
          content: splitContent.substring(0, splitAt).trim()
        };
        bulletPoints.splice(splitIndex + 1, 0, {
          title: longestPoint.title + ' (Part 2)',
          content: splitContent.substring(splitAt).trim()
        });
      } else {
        break;
      }
    }

    // Ensure exactly 5 points and force truncation for safety
    const finalPoints = bulletPoints.slice(0, 5).map(point => ({
      title: this.cleanContent(point.title || '').substring(0, 60), // Force 60 chars max
      content: this.cleanContent(point.content || '').substring(0, 200) // Force 200 chars max
    }));

    // Fill to exactly 5 if needed
    while (finalPoints.length < 5) {
      finalPoints.push({
        title: `Benefit ${finalPoints.length + 1}`,
        content: 'Additional benefit information available during consultation.'
      });
    }

    return finalPoints;
  } catch (error) {
    console.error('Error parsing bullet points:', error);
    return Array(5).fill().map((_, i) => ({
      title: `Benefit ${i + 1}`,
      content: 'Content available during consultation.'
    }));
  }
};

// Helper method to parse procedure steps
servicePageSchema.methods.parseSteps = function(content) {
  const steps = [];

  try {
    const lines = content.split(/[\n\r]+/);
    let stepNumber = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Look for numbered steps
      const stepMatch = trimmedLine.match(/^(\d+)\.\s*(.+?):\s*(.*)/) ||
                       trimmedLine.match(/^Step\s*(\d+)[:\-\s]*(.+?):\s*(.*)/) ||
                       trimmedLine.match(/^(\d+)\.\s*(.+)/);

      if (stepMatch) {
        const title = stepMatch[2] || `Step ${stepNumber}`;
        const description = stepMatch[3] || stepMatch[2] || stepMatch[0];

        steps.push({
          stepNumber: parseInt(stepMatch[1]) || stepNumber,
          title: this.cleanContent(title).substring(0, 150),
          description: this.cleanContent(description).substring(0, 500) // Schema limit is 500
        });

        stepNumber++;
      }
    }

    // Ensure we have exactly 5 steps
    while (steps.length < 5) {
      steps.push({
        stepNumber: steps.length + 1,
        title: `Additional Step ${steps.length + 1}`,
        description: 'Details will be provided during consultation.'
      });
    }

    // Force truncation for safety - ensure exactly 5 steps with safe limits
    const finalSteps = steps.slice(0, 5).map(step => ({
      stepNumber: step.stepNumber,
      title: this.cleanContent(step.title || '').substring(0, 120), // Force 120 chars max for 150 limit
      description: this.cleanContent(step.description || '').substring(0, 400) // Force 400 chars max for 500 limit
    }));

    // Fill to exactly 5 if needed
    while (finalSteps.length < 5) {
      finalSteps.push({
        stepNumber: finalSteps.length + 1,
        title: `Step ${finalSteps.length + 1}`,
        description: 'Details will be provided during consultation.'
      });
    }

    return finalSteps;
  } catch (error) {
    console.error('Error parsing steps:', error);
    return [];
  }
};

// Helper method to parse myths and facts
servicePageSchema.methods.parseMythsAndFacts = function(content) {
  const items = [];

  try {
    const lines = content.split(/[\n\r]+/);
    let currentMyth = null;
    let currentFact = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.match(/^Myth\s*\d*[:]*\s*/i)) {
        if (currentMyth && currentFact) {
          items.push({ myth: currentMyth, fact: currentFact });
        }
        currentMyth = trimmedLine.replace(/^Myth\s*\d*[:]*\s*/i, '');
        currentFact = null;
      } else if (trimmedLine.match(/^Fact\s*\d*[:]*\s*/i)) {
        currentFact = trimmedLine.replace(/^Fact\s*\d*[:]*\s*/i, '');
      } else if (currentMyth && !currentFact && trimmedLine) {
        currentMyth += ' ' + trimmedLine;
      } else if (currentFact && trimmedLine) {
        currentFact += ' ' + trimmedLine;
      }
    }

    // Add last pair
    if (currentMyth && currentFact) {
      items.push({ myth: currentMyth, fact: currentFact });
    }

    return items.slice(0, 5);
  } catch (error) {
    console.error('Error parsing myths and facts:', error);
    return [];
  }
};

// Helper method to parse FAQs
servicePageSchema.methods.parseFAQs = function(content) {
  const questions = [];

  try {
    const lines = content.split(/[\n\r]+/);
    let currentQ = null;
    let currentA = null;
    let questionNumber = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.match(/^Q\d*[:]*\s*/i) || trimmedLine.match(/^Question\s*\d*[:]*\s*/i)) {
        if (currentQ && currentA) {
          questions.push({
            question: this.cleanContent(currentQ).substring(0, 150), // Super aggressive: 150 for 200 limit
            answer: this.cleanContent(currentA).substring(0, 700), // Super aggressive: 700 for 1000 limit
            category: this.categorizeFAQ(currentQ),
            order: questionNumber++,
            wordCount: this.countWords(currentA)
          });
        }
        currentQ = this.cleanContent(trimmedLine.replace(/^(Q\d*|Question\s*\d*)[:]*\s*/i, '')).substring(0, 150);
        currentA = null;
      } else if (trimmedLine.match(/^A\d*[:]*\s*/i) || trimmedLine.match(/^Answer\s*\d*[:]*\s*/i)) {
        currentA = this.cleanContent(trimmedLine.replace(/^(A\d*|Answer\s*\d*)[:]*\s*/i, '')).substring(0, 700);
      } else if (currentQ && !currentA && trimmedLine) {
        const additionalQ = ' ' + this.cleanContent(trimmedLine);
        if (currentQ.length + additionalQ.length <= 150) { // Super aggressive: 150 for 200 limit
          currentQ += additionalQ;
        }
      } else if (currentA && trimmedLine) {
        const additionalA = ' ' + this.cleanContent(trimmedLine);
        if (currentA.length + additionalA.length <= 700) { // Super aggressive: 700 for 1000 limit
          currentA += additionalA;
        }
      }
    }

    // Add last pair
    if (currentQ && currentA) {
      questions.push({
        question: this.cleanContent(currentQ).substring(0, 150), // Super aggressive: 150 for 200 limit
        answer: this.cleanContent(currentA).substring(0, 700), // Super aggressive: 700 for 1000 limit
        category: this.categorizeFAQ(currentQ),
        order: questionNumber,
        wordCount: this.countWords(currentA)
      });
    }

    return questions.slice(0, 25);
  } catch (error) {
    console.error('Error parsing FAQs:', error);
    return [];
  }
};

// Helper method to categorize FAQ questions
servicePageSchema.methods.categorizeFAQ = function(question) {
  const q = question.toLowerCase();

  if (q.includes('cost') || q.includes('price') || q.includes('insurance') || q.includes('expensive')) {
    return 'cost';
  } else if (q.includes('pain') || q.includes('hurt') || q.includes('discomfort') || q.includes('anesthesia')) {
    return 'pain';
  } else if (q.includes('recovery') || q.includes('heal') || q.includes('after') || q.includes('care')) {
    return 'recovery';
  } else if (q.includes('candidate') || q.includes('eligible') || q.includes('suitable') || q.includes('right for')) {
    return 'candidacy';
  } else if (q.includes('risk') || q.includes('danger') || q.includes('side effect') || q.includes('complication')) {
    return 'risks';
  } else if (q.includes('alternative') || q.includes('option') || q.includes('instead') || q.includes('other')) {
    return 'alternatives';
  } else if (q.includes('result') || q.includes('outcome') || q.includes('last') || q.includes('permanent')) {
    return 'results';
  } else if (q.includes('maintain') || q.includes('care') || q.includes('clean') || q.includes('upkeep')) {
    return 'maintenance';
  } else if (q.includes('procedure') || q.includes('process') || q.includes('how') || q.includes('what happens')) {
    return 'procedure';
  } else {
    return 'general';
  }
};

const ServicePage = mongoose.model('ServicePage', servicePageSchema);

module.exports = ServicePage;