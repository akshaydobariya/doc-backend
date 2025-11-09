const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

/**
 * Blog Schema - Optimized for Clove Dental style dental content
 * Supports 11-section blog structure with comprehensive dental information
 */
const blogSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9-]+$/
  },
  introduction: {
    type: String,
    required: true,
    maxLength: 500,
    trim: true
  },

  // Content Structure - 11 Sections (Clove Dental Format)
  content: {
    // Section 1: Introduction with hook
    introduction: {
      title: { type: String, default: 'Introduction' },
      content: { type: String, required: true },
      anchor: { type: String, default: 'introduction' }
    },

    // Section 2: What is this treatment?
    whatIsIt: {
      title: { type: String, default: 'What is this treatment?' },
      content: { type: String, required: true },
      anchor: { type: String, default: 'what-is-it' }
    },

    // Section 3: Why do you need this treatment?
    whyNeedIt: {
      title: { type: String, default: 'Why do you need this treatment?' },
      content: { type: String, required: true },
      anchor: { type: String, default: 'why-need-it' }
    },

    // Section 4: Signs and symptoms
    signsSymptoms: {
      title: { type: String, default: 'Signs and Symptoms' },
      content: { type: String, required: true },
      anchor: { type: String, default: 'signs-symptoms' }
    },

    // Section 5: Consequences of delay
    consequencesDelay: {
      title: { type: String, default: 'What happens if treatment is delayed?' },
      content: { type: String, required: true },
      anchor: { type: String, default: 'consequences-delay' }
    },

    // Section 6: Treatment process
    treatmentProcess: {
      title: { type: String, default: 'Treatment Process' },
      content: { type: String, required: true },
      anchor: { type: String, default: 'treatment-process' }
    },

    // Section 7: Benefits
    benefits: {
      title: { type: String, default: 'Benefits of the Treatment' },
      content: { type: String, required: true },
      anchor: { type: String, default: 'benefits' }
    },

    // Section 8: Recovery and aftercare
    recoveryAftercare: {
      title: { type: String, default: 'Recovery and Aftercare' },
      content: { type: String, required: true },
      anchor: { type: String, default: 'recovery-aftercare' }
    },

    // Section 9: Myths vs Facts
    mythsFacts: {
      title: { type: String, default: 'Myths vs Facts' },
      content: { type: String, required: true },
      anchor: { type: String, default: 'myths-facts' }
    },

    // Section 10: Cost considerations
    costConsiderations: {
      title: { type: String, default: 'Cost Considerations' },
      content: { type: String, required: true },
      anchor: { type: String, default: 'cost-considerations' }
    },

    // Section 11: Comprehensive FAQ
    faq: {
      title: { type: String, default: 'Frequently Asked Questions' },
      questions: [{
        question: { type: String, required: true, maxLength: 200 },
        answer: { type: String, required: true, maxLength: 800 },
        _id: false
      }],
      anchor: { type: String, default: 'faq' }
    }
  },

  // Key Takeaways (for summary cards)
  keyTakeaways: [{
    type: String,
    maxLength: 150,
    _id: false
  }],

  // Relationships
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DentalService',
    required: true,
    index: true
  },
  servicePageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServicePage',
    required: false, // Made optional - blogs can be linked directly to services
    index: true
  },
  websiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: true,
    index: true
  },

  // Author Information
  author: {
    type: String,
    required: true,
    default: 'Dr. Professional'
  },
  authorBio: {
    type: String,
    maxLength: 300
  },

  // Categorization
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
    ],
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxLength: 50,
    _id: false
  }],

  // SEO and Meta Information
  metaTitle: {
    type: String,
    maxLength: 60
  },
  metaDescription: {
    type: String,
    maxLength: 160
  },
  seoKeywords: [{
    type: String,
    trim: true,
    _id: false
  }],
  canonicalUrl: String,

  // Featured Image
  featuredImage: {
    url: String,
    alt: String,
    caption: String
  },

  // Content Analytics
  readingTime: {
    type: Number,
    default: 0, // in minutes
    min: 0,
    max: 30
  },
  wordCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Publication Status
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  publishedAt: Date,
  featured: {
    type: Boolean,
    default: false,
    index: true
  },

  // Content Quality
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Generation Metadata
  llmGenerated: {
    type: Boolean,
    default: true
  },
  generationProvider: {
    type: String,
    enum: ['google-ai', 'deepseek', 'manual'],
    default: 'google-ai'
  },
  generationMetadata: {
    tokensUsed: Number,
    temperature: Number,
    model: String,
    generatedAt: { type: Date, default: Date.now },
    prompt: String
  },

  // Analytics
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  shares: {
    type: Number,
    default: 0,
    min: 0
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastPublishedAt: Date
}, {
  timestamps: true,
  collection: 'blogs'
});

// Indexes for performance
blogSchema.index({ websiteId: 1, isPublished: 1, publishedAt: -1 });
blogSchema.index({ servicePageId: 1, isPublished: 1 });
blogSchema.index({ category: 1, isPublished: 1, publishedAt: -1 });
blogSchema.index({ featured: 1, isPublished: 1, publishedAt: -1 });
blogSchema.index({ slug: 1, websiteId: 1 }, { unique: true });
blogSchema.index({ tags: 1, isPublished: 1 });
blogSchema.index({ 'content.faq.question': 'text', title: 'text', introduction: 'text' });

// Add pagination plugin
blogSchema.plugin(mongoosePaginate);

// Virtual for URL generation
blogSchema.virtual('url').get(function() {
  return `/blog/${this.slug}`;
});

blogSchema.virtual('serviceUrl').get(function() {
  return `/services/${this.serviceSlug}/blog/${this.slug}`;
});

// Methods
blogSchema.methods.publish = function() {
  this.isPublished = true;
  this.publishedAt = new Date();
  this.lastPublishedAt = new Date();
  return this.save();
};

blogSchema.methods.unpublish = function() {
  this.isPublished = false;
  return this.save();
};

blogSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

blogSchema.methods.calculateReadingTime = function() {
  // Calculate based on content sections
  let totalWords = 0;

  if (this.content) {
    Object.keys(this.content).forEach(section => {
      if (section === 'faq') {
        // Count FAQ questions and answers
        if (this.content.faq.questions) {
          this.content.faq.questions.forEach(qa => {
            totalWords += (qa.question + ' ' + qa.answer).split(' ').length;
          });
        }
      } else if (this.content[section] && this.content[section].content) {
        totalWords += this.content[section].content.split(' ').length;
      }
    });
  }

  // Add introduction words
  if (this.introduction) {
    totalWords += this.introduction.split(' ').length;
  }

  this.wordCount = totalWords;
  this.readingTime = Math.ceil(totalWords / 200); // 200 words per minute
  return this.readingTime;
};

blogSchema.methods.generateSEO = function() {
  if (!this.metaTitle) {
    this.metaTitle = this.title.length > 55 ?
      this.title.substring(0, 52) + '...' :
      this.title;
  }

  if (!this.metaDescription) {
    this.metaDescription = this.introduction.length > 155 ?
      this.introduction.substring(0, 152) + '...' :
      this.introduction;
  }
};

// Static methods
blogSchema.statics.findPublished = function() {
  return this.find({ isPublished: true });
};

blogSchema.statics.findByService = function(servicePageId) {
  return this.find({ servicePageId, isPublished: true })
    .sort({ publishedAt: -1 });
};

blogSchema.statics.findFeatured = function(limit = 6) {
  return this.find({ featured: true, isPublished: true })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

blogSchema.statics.findByCategory = function(category, limit = 10) {
  return this.find({ category, isPublished: true })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// Pre-save middleware
blogSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  // Calculate reading time
  this.calculateReadingTime();

  // Generate SEO if not provided
  this.generateSEO();

  // Set publishedAt if publishing for first time
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
    this.lastPublishedAt = new Date();
  }

  next();
});

// Post-save middleware for analytics
blogSchema.post('save', function(doc) {
  // Can be used for triggering analytics updates
  if (doc.isPublished) {
    console.log(`Blog published: ${doc.title}`);
  }
});

module.exports = mongoose.model('Blog', blogSchema);