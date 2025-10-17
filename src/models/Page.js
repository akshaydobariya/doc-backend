const mongoose = require('mongoose');

/**
 * Page Model for Destack
 *
 * Stores page templates and content created with the Destack page builder.
 * Each page has a unique slug and contains the page data in JSON format.
 */
const pageSchema = new mongoose.Schema({
  // Page identifier (URL slug)
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },

  // Page title
  title: {
    type: String,
    required: true,
    trim: true,
  },

  // Page content (Destack JSON data)
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Page status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  },

  // Meta information for SEO
  meta: {
    description: { type: String, default: '' },
    keywords: [String],
    image: { type: String, default: '' },
  },

  // Creator information
  createdBy: {
    type: String,
    ref: 'User',
  },

  // Last editor
  updatedBy: {
    type: String,
    ref: 'User',
  },

  // Version control
  version: {
    type: Number,
    default: 1,
  },

  // Publish date
  publishedAt: {
    type: Date,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Indexes for performance
pageSchema.index({ slug: 1 });
pageSchema.index({ status: 1 });
pageSchema.index({ createdAt: -1 });

// Pre-save middleware to update version
pageSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.version += 1;
  }
  next();
});

module.exports = mongoose.model('Page', pageSchema);
