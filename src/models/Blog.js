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

  // Content Structure - Enhanced 11 Sections (Updated for new format requirements)
  content: {
    // Section 1: Introduction (100 words exactly)
    introduction: {
      title: { type: String, default: 'Introduction' },
      content: { type: String, required: true, maxLength: 800 }, // ~100 words
      wordCount: { type: Number, default: 0 },
      anchor: { type: String, default: 'introduction' }
    },

    // Section 2: What does it entail (500 words in 5 bullet points)
    whatIsIt: {
      title: { type: String, default: 'What Does This Treatment Entail?' },
      bulletPoints: [{
        title: { type: String, maxLength: 100 },
        content: { type: String, maxLength: 800 }, // ~100 words per bullet
        wordCount: { type: Number, default: 0 },
        _id: false
      }],
      totalWordCount: { type: Number, default: 0 },
      anchor: { type: String, default: 'what-is-it' }
    },

    // Section 3: Why does one need to undergo this treatment (500 words in 5 bullet points)
    whyNeedIt: {
      title: { type: String, default: 'Why Do You Need This Treatment?' },
      bulletPoints: [{
        title: { type: String, maxLength: 100 },
        content: { type: String, maxLength: 800 }, // ~100 words per bullet
        wordCount: { type: Number, default: 0 },
        _id: false
      }],
      totalWordCount: { type: Number, default: 0 },
      anchor: { type: String, default: 'why-need-it' }
    },

    // Section 4: Symptoms requiring treatment (500 words in 5 bullet points)
    signsSymptoms: {
      title: { type: String, default: 'Signs and Symptoms' },
      bulletPoints: [{
        title: { type: String, maxLength: 100 },
        content: { type: String, maxLength: 800 }, // ~100 words per bullet
        wordCount: { type: Number, default: 0 },
        _id: false
      }],
      totalWordCount: { type: Number, default: 0 },
      anchor: { type: String, default: 'signs-symptoms' }
    },

    // Section 5: Consequences when treatment is not performed (500 words in 5 bullet points)
    consequencesDelay: {
      title: { type: String, default: 'What Happens If Treatment Is Delayed?' },
      bulletPoints: [{
        title: { type: String, maxLength: 100 },
        content: { type: String, maxLength: 800 }, // ~100 words per bullet
        wordCount: { type: Number, default: 0 },
        _id: false
      }],
      totalWordCount: { type: Number, default: 0 },
      anchor: { type: String, default: 'consequences-delay' }
    },

    // Section 6: Procedure steps (500 words in 5 steps)
    treatmentProcess: {
      title: { type: String, default: 'Treatment Procedure: Step by Step' },
      steps: [{
        stepNumber: { type: Number, required: true },
        title: { type: String, maxLength: 100 },
        description: { type: String, maxLength: 800 }, // ~100 words per step
        wordCount: { type: Number, default: 0 },
        _id: false
      }],
      totalWordCount: { type: Number, default: 0 },
      anchor: { type: String, default: 'treatment-process' }
    },

    // Section 7: Benefits of the procedure (500 words in 5 bullet points)
    benefits: {
      title: { type: String, default: 'Benefits of This Treatment' },
      bulletPoints: [{
        title: { type: String, maxLength: 100 },
        content: { type: String, maxLength: 800 }, // ~100 words per bullet
        wordCount: { type: Number, default: 0 },
        _id: false
      }],
      totalWordCount: { type: Number, default: 0 },
      anchor: { type: String, default: 'benefits' }
    },

    // Section 8: Post-treatment care (500 words in 5 bullet points)
    recoveryAftercare: {
      title: { type: String, default: 'Post-Treatment Care' },
      bulletPoints: [{
        title: { type: String, maxLength: 100 },
        content: { type: String, maxLength: 800 }, // ~100 words per bullet
        wordCount: { type: Number, default: 0 },
        _id: false
      }],
      totalWordCount: { type: Number, default: 0 },
      anchor: { type: String, default: 'recovery-aftercare' }
    },

    // Section 9: Side effects (500 words in 5 bullet points)
    sideEffects: {
      title: { type: String, default: 'Potential Side Effects' },
      bulletPoints: [{
        title: { type: String, maxLength: 100 },
        content: { type: String, maxLength: 800 }, // ~100 words per bullet
        wordCount: { type: Number, default: 0 },
        _id: false
      }],
      totalWordCount: { type: Number, default: 0 },
      anchor: { type: String, default: 'side-effects' }
    },

    // Section 10: Myths and facts (500 words - 5 myths and facts)
    mythsFacts: {
      title: { type: String, default: 'Myths vs Facts' },
      items: [{
        mythNumber: { type: Number, required: true },
        myth: { type: String, maxLength: 400 }, // ~50 words
        fact: { type: String, maxLength: 400 }, // ~50 words
        mythWordCount: { type: Number, default: 0 },
        factWordCount: { type: Number, default: 0 },
        _id: false
      }],
      totalWordCount: { type: Number, default: 0 },
      anchor: { type: String, default: 'myths-facts' }
    },

    // Section 11: Comprehensive FAQ (25 FAQs with 100-word answers)
    faq: {
      title: { type: String, default: 'Frequently Asked Questions' },
      questions: [{
        questionNumber: { type: Number, required: true },
        question: { type: String, required: true, maxLength: 300 }, // SEO-friendly questions
        answer: { type: String, required: true, maxLength: 800 }, // ~100 words per answer
        category: {
          type: String,
          enum: ['procedure', 'cost', 'pain', 'recovery', 'candidacy', 'risks', 'alternatives', 'results', 'maintenance', 'general'],
          default: 'general'
        },
        order: { type: Number, default: 0 },
        wordCount: { type: Number, default: 0 },
        seoFriendly: { type: Boolean, default: true },
        _id: false
      }],
      totalQuestions: { type: Number, default: 0 },
      totalWordCount: { type: Number, default: 0 },
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
    enum: ['google-ai', 'manual'],
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