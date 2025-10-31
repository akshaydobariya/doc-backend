const mongoose = require('mongoose');

/**
 * Dental Service Schema
 * Defines the structure for dental services that can be selected by doctors
 * and used to generate service pages with LLM-generated content
 */
const dentalServiceSchema = new mongoose.Schema({
  // Basic service information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    // Auto-generated from name if not provided
    default: function() {
      return this.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '';
    }
  },

  // Service categorization
  category: {
    type: String,
    required: true,
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
      'oral-pathology'
    ]
  },

  subcategory: {
    type: String,
    trim: true,
    maxlength: 50
  },

  // Service content
  shortDescription: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },

  fullDescription: {
    type: String,
    maxlength: 2000,
    trim: true
  },

  // Procedure details
  procedureSteps: [{
    step: {
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
    }
  }],

  // Benefits and features
  benefits: [{
    type: String,
    maxlength: 200
  }],

  // Common concerns and FAQs
  faqs: [{
    question: {
      type: String,
      required: true,
      maxlength: 200
    },
    answer: {
      type: String,
      required: true,
      maxlength: 1000
    }
  }],

  // Pricing information (optional)
  pricing: {
    hasFixedPrice: {
      type: Boolean,
      default: false
    },
    basePrice: {
      type: Number,
      min: 0
    },
    priceRange: {
      min: {
        type: Number,
        min: 0
      },
      max: {
        type: Number,
        min: 0
      }
    },
    currency: {
      type: String,
      default: 'USD',
      maxlength: 3
    },
    priceNote: {
      type: String,
      maxlength: 300
    }
  },

  // Treatment duration and recovery
  duration: {
    consultation: {
      type: Number, // minutes
      min: 0
    },
    procedure: {
      type: Number, // minutes
      min: 0
    },
    recovery: {
      type: String,
      maxlength: 200
    }
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
      maxlength: 100,
      trim: true
    }
  },

  // Content generation settings
  contentGeneration: {
    lastGenerated: {
      type: Date
    },
    generatedBy: {
      type: String,
      enum: ['google-ai', 'deepseek', 'mock', 'manual', 'template']
    },
    promptUsed: {
      type: String,
      maxlength: 1000
    },
    customPrompt: {
      type: String,
      maxlength: 1000
    }
  },

  // Media and assets
  media: {
    featuredImage: {
      type: String,
      maxlength: 500
    },
    beforeAfterImages: [{
      before: {
        type: String,
        maxlength: 500
      },
      after: {
        type: String,
        maxlength: 500
      },
      description: {
        type: String,
        maxlength: 200
      }
    }],
    videoUrl: {
      type: String,
      maxlength: 500
    }
  },

  // Service settings and flags
  isActive: {
    type: Boolean,
    default: true
  },

  isPopular: {
    type: Boolean,
    default: false
  },

  isPremium: {
    type: Boolean,
    default: false
  },

  requiresConsultation: {
    type: Boolean,
    default: false
  },

  // Related services
  relatedServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DentalService'
  }],

  // Template and customization options
  pageTemplate: {
    type: String,
    enum: ['standard', 'detailed', 'minimal', 'premium'],
    default: 'standard'
  },

  customSections: [{
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000
    },
    order: {
      type: Number,
      default: 0
    }
  }],

  // Analytics and tracking
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    bookingCount: {
      type: Number,
      default: 0
    },
    lastViewed: {
      type: Date
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  // Add virtual fields for computed properties
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
// Note: slug index is already created by unique: true
dentalServiceSchema.index({ category: 1, isActive: 1 });
dentalServiceSchema.index({ isActive: 1, isPopular: 1 });
dentalServiceSchema.index({ 'seo.keywords': 1 });

// Pre-save middleware to auto-generate slug if not provided
dentalServiceSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Auto-generate SEO meta title if not provided
  if (!this.seo.metaTitle && this.name) {
    this.seo.metaTitle = `${this.name} | Professional Dental Care`;
  }

  // Auto-generate SEO meta description if not provided
  if (!this.seo.metaDescription && this.shortDescription) {
    this.seo.metaDescription = this.shortDescription;
  }

  next();
});

// Virtual for full URL path
dentalServiceSchema.virtual('urlPath').get(function() {
  return `/services/${this.slug}`;
});

// Virtual for category display name
dentalServiceSchema.virtual('categoryDisplayName').get(function() {
  const categoryMap = {
    'general-dentistry': 'General Dentistry',
    'cosmetic-dentistry': 'Cosmetic Dentistry',
    'orthodontics': 'Orthodontics',
    'oral-surgery': 'Oral Surgery',
    'pediatric-dentistry': 'Pediatric Dentistry',
    'emergency-dentistry': 'Emergency Dentistry',
    'periodontics': 'Periodontics',
    'endodontics': 'Endodontics',
    'prosthodontics': 'Prosthodontics',
    'oral-pathology': 'Oral Pathology'
  };
  return categoryMap[this.category] || this.category;
});

// Virtual for price display
dentalServiceSchema.virtual('priceDisplay').get(function() {
  if (this.pricing.hasFixedPrice && this.pricing.basePrice) {
    return `$${this.pricing.basePrice}`;
  } else if (this.pricing.priceRange && this.pricing.priceRange.min && this.pricing.priceRange.max) {
    return `$${this.pricing.priceRange.min} - $${this.pricing.priceRange.max}`;
  } else if (this.pricing.priceRange && this.pricing.priceRange.min) {
    return `Starting at $${this.pricing.priceRange.min}`;
  }
  return 'Contact for pricing';
});

// Static method to get services by category
dentalServiceSchema.statics.findByCategory = function(category, activeOnly = true) {
  const query = { category };
  if (activeOnly) {
    query.isActive = true;
  }
  return this.find(query).sort({ name: 1 });
};

// Static method to get popular services
dentalServiceSchema.statics.findPopular = function(limit = 6) {
  return this.find({ isActive: true, isPopular: true })
    .sort({ 'analytics.viewCount': -1, name: 1 })
    .limit(limit);
};

// Static method to search services
dentalServiceSchema.statics.search = function(searchTerm, categories = null) {
  const query = {
    isActive: true,
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { shortDescription: { $regex: searchTerm, $options: 'i' } },
      { 'seo.keywords': { $regex: searchTerm, $options: 'i' } }
    ]
  };

  if (categories && categories.length > 0) {
    query.category = { $in: categories };
  }

  return this.find(query).sort({ name: 1 });
};

// Method to increment view count
dentalServiceSchema.methods.incrementViewCount = function() {
  this.analytics.viewCount += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

// Method to increment booking count
dentalServiceSchema.methods.incrementBookingCount = function() {
  this.analytics.bookingCount += 1;
  return this.save();
};

const DentalService = mongoose.model('DentalService', dentalServiceSchema);

module.exports = DentalService;