const mongoose = require('mongoose');

// Page schema for individual pages within a website
const PageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  components: [{
    type: mongoose.Schema.Types.Mixed,
    default: []
  }],
  seoSettings: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    ogImage: String,
    canonicalUrl: String
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  lastModified: {
    type: Date,
    default: Date.now
  }
});

// Website version schema for version control
const VersionSchema = new mongoose.Schema({
  versionNumber: {
    type: String,
    required: true
  },
  pages: [PageSchema],
  globalSettings: {
    siteName: String,
    siteDescription: String,
    logo: String,
    favicon: String,
    primaryColor: {
      type: String,
      default: '#2563eb'
    },
    secondaryColor: {
      type: String,
      default: '#64748b'
    },
    fontFamily: {
      type: String,
      default: 'Inter, sans-serif'
    },
    customCSS: String,
    googleAnalytics: String,
    facebookPixel: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changeLog: String
});

// Main Website schema
const WebsiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  subdomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/
  },
  customDomain: {
    type: String,
    trim: true,
    lowercase: true
  },
  template: {
    type: String,
    required: true,
    enum: ['dental-modern', 'medical-classic', 'healthcare-minimal', 'custom'],
    default: 'dental-modern'
  },
  status: {
    type: String,
    enum: ['draft', 'preview', 'published', 'archived'],
    default: 'draft'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentVersion: {
    type: String,
    default: '1.0.0'
  },
  versions: [VersionSchema],

  // Deployment information
  deployment: {
    provider: {
      type: String,
      enum: ['vercel', 'netlify', 'custom'],
      default: 'vercel'
    },
    deploymentId: String,
    url: String,
    previewUrl: String,
    lastDeployedAt: Date,
    deploymentStatus: {
      type: String,
      enum: ['pending', 'building', 'ready', 'error'],
      default: 'pending'
    },
    buildLogs: [String]
  },

  // Analytics and monitoring
  analytics: {
    googleAnalyticsId: String,
    facebookPixelId: String,
    enableAnalytics: {
      type: Boolean,
      default: false
    }
  },

  // SEO and performance
  seo: {
    sitemap: {
      enabled: {
        type: Boolean,
        default: true
      },
      lastGenerated: Date
    },
    robotsTxt: String,
    structuredData: mongoose.Schema.Types.Mixed
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
  publishedAt: Date,
  lastBackup: Date
});

// Indexes for performance
WebsiteSchema.index({ doctorId: 1, status: 1 });
// Note: subdomain index is already created by unique: true
WebsiteSchema.index({ customDomain: 1 });
WebsiteSchema.index({ 'deployment.deploymentId': 1 });

// Pre-save middleware
WebsiteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Ensure subdomain is valid
  if (this.subdomain) {
    this.subdomain = this.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  next();
});

// Instance methods
WebsiteSchema.methods.createNewVersion = function(pages, globalSettings, changeLog, userId) {
  const versionNumbers = this.versions.map(v => v.versionNumber);
  const latestVersion = versionNumbers.length > 0
    ? Math.max(...versionNumbers.map(v => parseFloat(v)))
    : 0;

  const newVersion = {
    versionNumber: (latestVersion + 0.1).toFixed(1),
    pages: pages || [],
    globalSettings: globalSettings || {},
    createdBy: userId,
    changeLog: changeLog || 'New version created'
  };

  this.versions.push(newVersion);
  this.currentVersion = newVersion.versionNumber;

  return newVersion;
};

WebsiteSchema.methods.getCurrentVersion = function() {
  return this.versions.find(v => v.versionNumber === this.currentVersion) || this.versions[0];
};

WebsiteSchema.methods.getPublicUrl = function() {
  if (this.customDomain) {
    return `https://${this.customDomain}`;
  }
  return `https://${this.subdomain}.docwebsite.app`;
};

WebsiteSchema.methods.getPreviewUrl = function() {
  return this.deployment.previewUrl || `https://preview-${this.subdomain}.docwebsite.app`;
};

// Static methods
WebsiteSchema.statics.findByDoctor = function(doctorId) {
  return this.find({ doctorId, status: { $ne: 'archived' } }).sort({ updatedAt: -1 });
};

WebsiteSchema.statics.findBySubdomain = function(subdomain) {
  return this.findOne({ subdomain: subdomain.toLowerCase() });
};

WebsiteSchema.statics.isSubdomainAvailable = async function(subdomain, excludeId = null) {
  const query = { subdomain: subdomain.toLowerCase() };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await this.findOne(query);
  return !existing;
};

module.exports = mongoose.model('Website', WebsiteSchema);