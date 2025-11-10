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
      enum: ['google-ai', 'manual', 'template'],
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

// Helper method to parse bullet points from LLM content (Updated for new 500-word, 5-bullet format)
servicePageSchema.methods.parseBulletPoints = function(content) {
  const bulletPoints = [];

  try {
    // Updated parsing for new format: 5 bullet points, 100 words each
    // First try to match the exact format from our LLM prompts
    const bulletRegex = /•\s*(?:Point|Reason|Symptom|Consequence|Care Point|Benefit|Side Effect)\s*\d+:\s*(.*?)(?=•\s*(?:Point|Reason|Symptom|Consequence|Care Point|Benefit|Side Effect)\s*\d+:|$)/gs;
    let matches = [...content.matchAll(bulletRegex)];

    let pointNumber = 1;
    for (const match of matches) {
      const pointContent = match[1].trim();
      if (pointContent) {
        bulletPoints.push({
          title: `Point ${pointNumber}`, // Auto-generated title for SEO
          content: this.cleanContent(pointContent),
          wordCount: this.countWords(pointContent)
        });
        pointNumber++;
      }
    }

    // Fallback: If the above pattern doesn't match, try standard bullet points
    if (bulletPoints.length === 0) {
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

          // Start new point - extract full content (100 words per bullet point)
          const contentMatch = trimmedLine.replace(/^[•\-\*\d\.\s]+/, '');
          currentPoint = {
            title: `Point ${bulletPoints.length + 1}`, // SEO-friendly auto title
            content: this.cleanContent(contentMatch),
            wordCount: this.countWords(contentMatch)
          };
        } else if (currentPoint && trimmedLine) {
          // Add to current point content (allowing up to ~100 words per bullet)
          currentPoint.content += ' ' + this.cleanContent(trimmedLine);
          currentPoint.wordCount = this.countWords(currentPoint.content);
        }
      }

      // Add last point
      if (currentPoint) {
        bulletPoints.push(currentPoint);
      }
    }

    // Third fallback: If still no structured content, try to split by paragraph/sentences
    if (bulletPoints.length === 0 && content.length > 0) {
      const paragraphs = content.split(/\n\s*\n/);
      const totalWords = this.countWords(content);
      const wordsPerPoint = Math.ceil(totalWords / 5);

      let currentWords = 0;
      let currentContent = '';
      let pointCount = 0;

      for (const paragraph of paragraphs) {
        const paragraphWords = this.countWords(paragraph);

        if (currentWords + paragraphWords <= wordsPerPoint || pointCount === 4) {
          currentContent += (currentContent ? ' ' : '') + paragraph.trim();
          currentWords += paragraphWords;
        } else {
          // Save current point
          if (currentContent) {
            bulletPoints.push({
              title: `Point ${pointCount + 1}`,
              content: this.cleanContent(currentContent),
              wordCount: currentWords
            });
            pointCount++;
          }

          // Start new point
          currentContent = paragraph.trim();
          currentWords = paragraphWords;
        }
      }

      // Add last point
      if (currentContent && pointCount < 5) {
        bulletPoints.push({
          title: `Point ${pointCount + 1}`,
          content: this.cleanContent(currentContent),
          wordCount: currentWords
        });
      }
    }

    // Ensure exactly 5 points for consistency
    const finalPoints = bulletPoints.slice(0, 5);

    // Fill to exactly 5 if needed with default content
    while (finalPoints.length < 5) {
      finalPoints.push({
        title: `Important Point ${finalPoints.length + 1}`,
        content: 'Additional information about this treatment is available during your consultation. Our dental professionals will provide detailed explanations tailored to your specific needs and circumstances.',
        wordCount: 25
      });
    }

    return finalPoints.map(point => ({
      title: point.title || `Point ${finalPoints.indexOf(point) + 1}`,
      content: point.content || 'Information available during consultation.',
      wordCount: point.wordCount || this.countWords(point.content)
    }));

  } catch (error) {
    console.error('Error parsing bullet points:', error);
    // Return default 5 bullet points with patient-friendly content
    return Array(5).fill().map((_, i) => ({
      title: `Important Information ${i + 1}`,
      content: 'Detailed information about this aspect of the treatment will be discussed during your consultation with our dental professionals.',
      wordCount: 20
    }));
  }
};

// Helper method to parse procedure steps (Updated for new 500-word, 5-step format)
servicePageSchema.methods.parseSteps = function(content) {
  const steps = [];

  try {
    // Updated parsing for new format: 5 steps, 100 words each
    // First try to match the exact format from our LLM prompts
    const stepRegex = /Step\s*(\d+):\s*(.*?)(?=Step\s*\d+:|$)/gs;
    let matches = [...content.matchAll(stepRegex)];

    for (const match of matches) {
      const stepNumber = parseInt(match[1]);
      const stepContent = match[2].trim();

      if (stepContent) {
        steps.push({
          stepNumber: stepNumber,
          title: `Step ${stepNumber}`, // SEO-friendly title
          description: this.cleanContent(stepContent),
          wordCount: this.countWords(stepContent)
        });
      }
    }

    // Fallback: If the above pattern doesn't match, try standard numbered steps
    if (steps.length === 0) {
      const lines = content.split(/[\n\r]+/);
      let currentStep = null;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Look for numbered steps with various formats
        const stepMatch = trimmedLine.match(/^(\d+)\s*[.\-:\s]*(.+)/) ||
                         trimmedLine.match(/^Step\s*(\d+)[:\-\s]*(.+)/i);

        if (stepMatch) {
          // Save previous step if exists
          if (currentStep) {
            steps.push(currentStep);
          }

          // Start new step with full content (100 words per step)
          const stepNumber = parseInt(stepMatch[1]) || steps.length + 1;
          const stepContent = stepMatch[2] || '';

          currentStep = {
            stepNumber: stepNumber,
            title: `Step ${stepNumber}`, // SEO-friendly title
            description: this.cleanContent(stepContent),
            wordCount: this.countWords(stepContent)
          };
        } else if (currentStep && trimmedLine) {
          // Add to current step content (allowing up to ~100 words per step)
          currentStep.description += ' ' + this.cleanContent(trimmedLine);
          currentStep.wordCount = this.countWords(currentStep.description);
        }
      }

      // Add last step
      if (currentStep) {
        steps.push(currentStep);
      }
    }

    // Third fallback: If still no structured content, try to split by paragraph/sentences
    if (steps.length === 0 && content.length > 0) {
      const paragraphs = content.split(/\n\s*\n/);
      const totalWords = this.countWords(content);
      const wordsPerStep = Math.ceil(totalWords / 5);

      let currentWords = 0;
      let currentContent = '';
      let stepCount = 0;

      for (const paragraph of paragraphs) {
        const paragraphWords = this.countWords(paragraph);

        if (currentWords + paragraphWords <= wordsPerStep || stepCount === 4) {
          currentContent += (currentContent ? ' ' : '') + paragraph.trim();
          currentWords += paragraphWords;
        } else {
          // Save current step
          if (currentContent) {
            steps.push({
              stepNumber: stepCount + 1,
              title: `Step ${stepCount + 1}`,
              description: this.cleanContent(currentContent),
              wordCount: currentWords
            });
            stepCount++;
          }

          // Start new step
          currentContent = paragraph.trim();
          currentWords = paragraphWords;
        }
      }

      // Add last step
      if (currentContent && stepCount < 5) {
        steps.push({
          stepNumber: stepCount + 1,
          title: `Step ${stepCount + 1}`,
          description: this.cleanContent(currentContent),
          wordCount: currentWords
        });
      }
    }

    // Ensure exactly 5 steps for consistency
    const finalSteps = steps.slice(0, 5);

    // Fill to exactly 5 if needed with patient-friendly content
    while (finalSteps.length < 5) {
      finalSteps.push({
        stepNumber: finalSteps.length + 1,
        title: `Step ${finalSteps.length + 1}`,
        description: 'Our dental professionals will explain this step in detail during your treatment consultation, ensuring you understand each part of the procedure.',
        wordCount: 22
      });
    }

    // Return properly formatted steps with enhanced descriptions
    return finalSteps.map(step => ({
      stepNumber: step.stepNumber || finalSteps.indexOf(step) + 1,
      title: step.title || `Step ${step.stepNumber}`,
      description: step.description || 'Detailed procedure information will be provided during consultation.',
      wordCount: step.wordCount || this.countWords(step.description)
    }));

  } catch (error) {
    console.error('Error parsing steps:', error);
    // Return default 5 steps with patient-friendly content
    return Array(5).fill().map((_, i) => ({
      stepNumber: i + 1,
      title: `Step ${i + 1}`,
      description: 'Your dental professional will guide you through this step of the treatment process with detailed explanations and comfortable care.',
      wordCount: 20
    }));
  }
};

// Helper method to parse myths and facts (Updated for new 500-word format: 5 myths + 5 facts, 50 words each)
servicePageSchema.methods.parseMythsAndFacts = function(content) {
  const items = [];

  try {
    // Updated parsing for new format: 5 myths and facts, 50 words each (500 words total)
    // First try to match the exact format from our LLM prompts
    const mythFactRegex = /Myth\s*(\d+):\s*(.*?)(?:\n|\r\n?)Fact\s*\1:\s*(.*?)(?=Myth\s*\d+:|$)/gs;
    let matches = [...content.matchAll(mythFactRegex)];

    for (const match of matches) {
      const mythNumber = parseInt(match[1]);
      const mythContent = match[2].trim();
      const factContent = match[3].trim();

      if (mythContent && factContent) {
        items.push({
          mythNumber: mythNumber,
          myth: this.cleanContent(mythContent),
          fact: this.cleanContent(factContent),
          mythWordCount: this.countWords(mythContent),
          factWordCount: this.countWords(factContent)
        });
      }
    }

    // Fallback: If the above pattern doesn't match, try standard myth/fact format
    if (items.length === 0) {
      const lines = content.split(/[\n\r]+/);
      let currentMyth = null;
      let currentFact = null;

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.match(/^Myth\s*\d*[:]*\s*/i)) {
          if (currentMyth && currentFact) {
            items.push({
              myth: this.cleanContent(currentMyth),
              fact: this.cleanContent(currentFact),
              mythWordCount: this.countWords(currentMyth),
              factWordCount: this.countWords(currentFact)
            });
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
        items.push({
          myth: this.cleanContent(currentMyth),
          fact: this.cleanContent(currentFact),
          mythWordCount: this.countWords(currentMyth),
          factWordCount: this.countWords(currentFact)
        });
      }
    }

    // Ensure exactly 5 myth-fact pairs
    const finalItems = items.slice(0, 5);

    // Fill to exactly 5 if needed with default patient-friendly content
    while (finalItems.length < 5) {
      const itemNumber = finalItems.length + 1;
      finalItems.push({
        mythNumber: itemNumber,
        myth: `This treatment is more complicated than other dental procedures.`,
        fact: `Modern dental techniques make this treatment comfortable and straightforward for patients.`,
        mythWordCount: 11,
        factWordCount: 11
      });
    }

    return finalItems.map((item, index) => ({
      mythNumber: item.mythNumber || index + 1,
      myth: item.myth || `Common misconception about this treatment.`,
      fact: item.fact || `Evidence-based information about the treatment.`,
      mythWordCount: item.mythWordCount || this.countWords(item.myth),
      factWordCount: item.factWordCount || this.countWords(item.fact)
    }));

  } catch (error) {
    console.error('Error parsing myths and facts:', error);
    // Return default 5 myth-fact pairs with patient-friendly content
    return Array(5).fill().map((_, i) => ({
      mythNumber: i + 1,
      myth: `Common misconception ${i + 1} about this dental treatment.`,
      fact: `Accurate, evidence-based information correcting the misconception about this treatment.`,
      mythWordCount: 8,
      factWordCount: 10
    }));
  }
};

// Helper method to parse FAQs (Updated for new 25 FAQs with 100-word answers format)
servicePageSchema.methods.parseFAQs = function(content) {
  const questions = [];

  try {
    // Updated parsing for new format: 25 FAQs with 100-word answers each (2500 words total)
    // First try to match the exact format from our LLM prompts
    const faqRegex = /Q(\d+):\s*(.*?)(?:\n|\r\n?)A\1:\s*(.*?)(?=Q\d+:|$)/gs;
    let matches = [...content.matchAll(faqRegex)];

    for (const match of matches) {
      const questionNumber = parseInt(match[1]);
      const questionText = match[2].trim();
      const answerText = match[3].trim();

      if (questionText && answerText) {
        questions.push({
          questionNumber: questionNumber,
          question: this.cleanContent(questionText),
          answer: this.cleanContent(answerText),
          category: this.categorizeFAQ(questionText),
          order: questionNumber,
          wordCount: this.countWords(answerText),
          seoFriendly: true
        });
      }
    }

    // Fallback: If the above pattern doesn't match, try standard Q&A format
    if (questions.length === 0) {
      const lines = content.split(/[\n\r]+/);
      let currentQ = null;
      let currentA = null;
      let questionNumber = 1;

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.match(/^Q\d*[:]*\s*/i) || trimmedLine.match(/^Question\s*\d*[:]*\s*/i)) {
          if (currentQ && currentA) {
            questions.push({
              questionNumber: questionNumber,
              question: this.cleanContent(currentQ),
              answer: this.cleanContent(currentA),
              category: this.categorizeFAQ(currentQ),
              order: questionNumber,
              wordCount: this.countWords(currentA),
              seoFriendly: true
            });
            questionNumber++;
          }
          currentQ = this.cleanContent(trimmedLine.replace(/^(Q\d*|Question\s*\d*)[:]*\s*/i, ''));
          currentA = null;
        } else if (trimmedLine.match(/^A\d*[:]*\s*/i) || trimmedLine.match(/^Answer\s*\d*[:]*\s*/i)) {
          currentA = this.cleanContent(trimmedLine.replace(/^(A\d*|Answer\s*\d*)[:]*\s*/i, ''));
        } else if (currentQ && !currentA && trimmedLine) {
          currentQ += ' ' + this.cleanContent(trimmedLine);
        } else if (currentA && trimmedLine) {
          currentA += ' ' + this.cleanContent(trimmedLine);
        }
      }

      // Add last pair
      if (currentQ && currentA) {
        questions.push({
          questionNumber: questionNumber,
          question: this.cleanContent(currentQ),
          answer: this.cleanContent(currentA),
          category: this.categorizeFAQ(currentQ),
          order: questionNumber,
          wordCount: this.countWords(currentA),
          seoFriendly: true
        });
      }
    }

    // Ensure exactly 25 FAQs for consistency
    const finalQuestions = questions.slice(0, 25);

    // Fill to exactly 25 if needed with default patient-friendly FAQs
    const defaultFAQs = [
      { q: "How long does this dental treatment take?", a: "Treatment duration varies based on your specific needs and the complexity of your case. During your consultation, our dental professionals will provide a detailed timeline tailored to your situation. Most procedures are completed efficiently while ensuring your comfort and optimal results. We'll discuss scheduling options that work best for your lifestyle and treatment requirements." },
      { q: "Is this treatment covered by dental insurance?", a: "Insurance coverage varies by plan and provider. We recommend checking with your insurance company about your specific benefits for this treatment. Our office staff can help verify your coverage and explain any out-of-pocket costs. We also offer flexible payment options and financing plans to make quality dental care accessible and affordable for all our patients." },
      { q: "What should I expect during the recovery period?", a: "Recovery experiences vary among patients, but most people return to normal activities within a few days. We'll provide detailed aftercare instructions to ensure smooth healing and optimal results. Our team monitors your progress and is available to answer questions throughout your recovery. Following post-treatment guidelines helps minimize discomfort and promotes faster healing." },
      { q: "Are there any side effects I should be aware of?", a: "Like all medical procedures, this treatment may have some temporary side effects. Common experiences include mild swelling, sensitivity, or discomfort that typically resolves within a few days. Serious complications are rare with proper care and follow-up. We'll discuss potential side effects specific to your case and provide strategies to minimize any discomfort during healing." },
      { q: "How do I know if I'm a good candidate for this treatment?", a: "Candidacy depends on various factors including your oral health, medical history, and treatment goals. During your comprehensive consultation, we'll evaluate your specific situation and discuss whether this treatment is right for you. We consider factors like bone health, gum condition, and overall dental wellness to ensure the best possible outcomes for your individual needs." }
    ];

    let questionCount = finalQuestions.length;
    for (const defaultFAQ of defaultFAQs) {
      if (questionCount >= 25) break;

      finalQuestions.push({
        questionNumber: questionCount + 1,
        question: defaultFAQ.q,
        answer: defaultFAQ.a,
        category: this.categorizeFAQ(defaultFAQ.q),
        order: questionCount + 1,
        wordCount: this.countWords(defaultFAQ.a),
        seoFriendly: true
      });
      questionCount++;
    }

    // Fill remaining slots with generic questions if needed
    while (finalQuestions.length < 25) {
      const qNum = finalQuestions.length + 1;
      finalQuestions.push({
        questionNumber: qNum,
        question: `What other information should I know about this dental treatment?`,
        answer: `Additional details about this treatment will be thoroughly discussed during your personal consultation. Our dental professionals will address all your questions and concerns, explaining every aspect of the procedure to ensure you feel confident and informed about your dental care decisions.`,
        category: 'general',
        order: qNum,
        wordCount: 35,
        seoFriendly: true
      });
    }

    return finalQuestions.map((faq, index) => ({
      questionNumber: faq.questionNumber || index + 1,
      question: faq.question || `Question ${index + 1} about this treatment?`,
      answer: faq.answer || `Detailed information will be provided during your consultation.`,
      category: faq.category || 'general',
      order: faq.order || index + 1,
      wordCount: faq.wordCount || this.countWords(faq.answer),
      seoFriendly: faq.seoFriendly || true
    }));

  } catch (error) {
    console.error('Error parsing FAQs:', error);
    // Return default 25 FAQs with patient-friendly content
    return Array(25).fill().map((_, i) => ({
      questionNumber: i + 1,
      question: `What should I know about this dental treatment (Question ${i + 1})?`,
      answer: `Our dental professionals will provide comprehensive information about all aspects of this treatment during your consultation, ensuring you have everything you need to make informed decisions about your oral health care.`,
      category: 'general',
      order: i + 1,
      wordCount: 28,
      seoFriendly: true
    }));
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