const Website = require('../models/Website');
const User = require('../models/User');
const staticSiteGenerator = require('../services/staticSiteGenerator');
const vercelDeploymentService = require('../services/vercelDeploymentService');
const path = require('path');
const fs = require('fs');

/**
 * Website Controller
 * Handles all website CRUD operations, versioning, and deployment management
 */

// Get all websites for a doctor
const getWebsites = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const websites = await Website.findByDoctor(doctorId);

    res.json({
      success: true,
      count: websites.length,
      websites
    });
  } catch (error) {
    console.error('Get websites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching websites',
      error: error.message
    });
  }
};

// Get a specific website by ID
const getWebsiteById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    const website = await Website.findOne({ _id: id, doctorId });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    res.json({
      success: true,
      website
    });
  } catch (error) {
    console.error('Get website error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching website',
      error: error.message
    });
  }
};

// Create a new website
const createWebsite = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { name, description, subdomain, template, customDomain } = req.body;

    // Validate required fields
    if (!name || !subdomain) {
      return res.status(400).json({
        success: false,
        message: 'Name and subdomain are required'
      });
    }

    // Check if subdomain is available
    const isAvailable = await Website.isSubdomainAvailable(subdomain);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain is already taken'
      });
    }

    // Create default home page
    const defaultHomePage = {
      name: 'Home',
      slug: 'home',
      title: `${name} - Home`,
      description: `Welcome to ${name}`,
      components: [],
      seoSettings: {
        metaTitle: `${name} - Professional Medical Services`,
        metaDescription: description || `Welcome to ${name} - providing professional medical services`,
        keywords: ['medical', 'healthcare', 'doctor', name.toLowerCase()]
      },
      isPublished: false
    };

    // Create initial version
    const initialVersion = {
      versionNumber: '1.0.0',
      pages: [defaultHomePage],
      globalSettings: {
        siteName: name,
        siteDescription: description || '',
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        fontFamily: 'Inter, sans-serif'
      },
      createdBy: doctorId,
      changeLog: 'Initial website creation'
    };

    // Create website
    const website = new Website({
      name,
      description,
      subdomain,
      customDomain,
      template: template || 'dental-modern',
      doctorId,
      currentVersion: '1.0.0',
      versions: [initialVersion],
      deployment: {
        provider: 'vercel',
        deploymentStatus: 'pending'
      }
    });

    await website.save();

    res.status(201).json({
      success: true,
      message: 'Website created successfully',
      website
    });
  } catch (error) {
    console.error('Create website error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating website',
      error: error.message
    });
  }
};

// Update website metadata
const updateWebsite = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;
    const { name, description, customDomain, template } = req.body;

    const website = await Website.findOne({ _id: id, doctorId });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Update fields
    if (name) website.name = name;
    if (description) website.description = description;
    if (customDomain !== undefined) website.customDomain = customDomain;
    if (template) website.template = template;

    await website.save();

    res.json({
      success: true,
      message: 'Website updated successfully',
      website
    });
  } catch (error) {
    console.error('Update website error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating website',
      error: error.message
    });
  }
};

// Save website content (create new version)
const saveWebsiteContent = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;
    const { pages, globalSettings, changeLog } = req.body;

    const website = await Website.findOne({ _id: id, doctorId });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Create new version
    const newVersion = website.createNewVersion(pages, globalSettings, changeLog, doctorId);
    await website.save();

    res.json({
      success: true,
      message: 'Website content saved successfully',
      version: newVersion.versionNumber,
      website
    });
  } catch (error) {
    console.error('Save website content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving website content',
      error: error.message
    });
  }
};

// Get website versions
const getWebsiteVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    const website = await Website.findOne({ _id: id, doctorId });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    res.json({
      success: true,
      currentVersion: website.currentVersion,
      versions: website.versions.map(v => ({
        versionNumber: v.versionNumber,
        createdAt: v.createdAt,
        changeLog: v.changeLog,
        createdBy: v.createdBy
      }))
    });
  } catch (error) {
    console.error('Get website versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching website versions',
      error: error.message
    });
  }
};

// Restore website to a specific version
const restoreWebsiteVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { versionNumber } = req.body;
    const doctorId = req.user.id;

    const website = await Website.findOne({ _id: id, doctorId });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    const targetVersion = website.versions.find(v => v.versionNumber === versionNumber);
    if (!targetVersion) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    // Create new version based on target version
    const restoredVersion = website.createNewVersion(
      targetVersion.pages,
      targetVersion.globalSettings,
      `Restored from version ${versionNumber}`,
      doctorId
    );

    await website.save();

    res.json({
      success: true,
      message: `Website restored to version ${versionNumber}`,
      newVersion: restoredVersion.versionNumber,
      website
    });
  } catch (error) {
    console.error('Restore website version error:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring website version',
      error: error.message
    });
  }
};

// Check subdomain availability
const checkSubdomainAvailability = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { excludeId } = req.query;

    const isAvailable = await Website.isSubdomainAvailable(subdomain, excludeId);

    res.json({
      success: true,
      available: isAvailable,
      subdomain
    });
  } catch (error) {
    console.error('Check subdomain availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subdomain availability',
      error: error.message
    });
  }
};

// Delete website
const deleteWebsite = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    const website = await Website.findOne({ _id: id, doctorId });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Soft delete - change status to archived
    website.status = 'archived';
    await website.save();

    res.json({
      success: true,
      message: 'Website archived successfully'
    });
  } catch (error) {
    console.error('Delete website error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting website',
      error: error.message
    });
  }
};

// Permanently delete website
const permanentDeleteWebsite = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    const website = await Website.findOneAndDelete({ _id: id, doctorId });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    res.json({
      success: true,
      message: 'Website permanently deleted'
    });
  } catch (error) {
    console.error('Permanent delete website error:', error);
    res.status(500).json({
      success: false,
      message: 'Error permanently deleting website',
      error: error.message
    });
  }
};

// Update website status
const updateWebsiteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const doctorId = req.user.id;

    const validStatuses = ['draft', 'preview', 'published', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const website = await Website.findOne({ _id: id, doctorId });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    website.status = status;
    if (status === 'published') {
      website.publishedAt = new Date();
    }

    await website.save();

    res.json({
      success: true,
      message: `Website status updated to ${status}`,
      website
    });
  } catch (error) {
    console.error('Update website status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating website status',
      error: error.message
    });
  }
};

// Generate static site
const generateStaticSite = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    const website = await Website.findOne({ _id: id, doctorId });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    // Update deployment status to building
    website.deployment.deploymentStatus = 'building';
    website.deployment.buildLogs = ['Starting static site generation...'];
    await website.save();

    // Generate static site
    const result = await staticSiteGenerator.generateSite(id);

    // Update deployment status to ready
    website.deployment.deploymentStatus = 'ready';
    website.deployment.buildLogs.push('Static site generation completed');
    website.deployment.lastDeployedAt = new Date();
    await website.save();

    res.json({
      success: true,
      message: 'Static site generated successfully',
      result,
      website
    });
  } catch (error) {
    console.error('Generate static site error:', error);

    // Update deployment status to error
    try {
      const website = await Website.findById(req.params.id);
      if (website) {
        website.deployment.deploymentStatus = 'error';
        website.deployment.buildLogs.push(`Error: ${error.message}`);
        await website.save();
      }
    } catch (updateError) {
      console.error('Error updating deployment status:', updateError);
    }

    res.status(500).json({
      success: false,
      message: 'Error generating static site',
      error: error.message
    });
  }
};

// Deploy website to Vercel (REAL GLOBAL DEPLOYMENT)
const deployWebsite = async (req, res) => {
  try {
    const { id } = req.params;
    const { provider = 'vercel' } = req.body;
    const doctorId = req.user.id;

    const website = await Website.findOne({ _id: id, doctorId });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    console.log(`🚀 Starting global deployment for: ${website.name} (${website.subdomain})`);

    // Update deployment status to building
    website.deployment.provider = provider;
    website.deployment.deploymentStatus = 'building';
    website.deployment.buildLogs = ['Starting deployment process...'];
    await website.save();

    // Step 1: Generate static site files
    console.log('📦 Generating static site files...');
    website.deployment.buildLogs.push('Generating static site files...');
    await website.save();

    const siteResult = await staticSiteGenerator.generateSite(id);
    const sitePath = path.join(__dirname, '../../generated-sites', website.subdomain);

    console.log('✅ Static site generated at:', sitePath);
    website.deployment.buildLogs.push('Static site files generated successfully');
    await website.save();

    // Step 2: Deploy to Vercel for global access
    console.log('🌍 Deploying to Vercel for worldwide access...');
    website.deployment.buildLogs.push('Deploying to Vercel...');
    await website.save();

    const deploymentResult = await vercelDeploymentService.deployWebsite(website, sitePath);

    if (deploymentResult.success) {
      // Successful deployment
      website.deployment.deploymentId = deploymentResult.deploymentId;
      website.deployment.url = deploymentResult.url;
      website.deployment.previewUrl = deploymentResult.url; // Vercel URL is the public URL
      website.deployment.deploymentStatus = 'ready';
      website.deployment.lastDeployedAt = new Date();
      website.deployment.buildLogs.push(`✅ Successfully deployed to: ${deploymentResult.url}`);

      // Update website status to published
      website.status = 'published';
      website.publishedAt = new Date();

      await website.save();

      console.log(`🎉 Website successfully deployed to: ${deploymentResult.url}`);

      res.json({
        success: true,
        message: 'Website deployed globally to Vercel!',
        deploymentUrl: deploymentResult.url,
        publicUrl: deploymentResult.url,
        isGloballyAccessible: true,
        website,
        note: 'Your website is now accessible worldwide!'
      });

    } else {
      // Deployment failed
      website.deployment.deploymentStatus = 'error';
      website.deployment.buildLogs.push(`❌ Deployment failed: ${deploymentResult.error}`);
      await website.save();

      console.error('❌ Deployment failed:', deploymentResult.error);

      res.status(500).json({
        success: false,
        message: 'Deployment failed',
        error: deploymentResult.error,
        website
      });
    }

  } catch (error) {
    console.error('❌ Deploy website error:', error);

    // Update deployment status to error
    try {
      const website = await Website.findById(req.params.id);
      if (website) {
        website.deployment.deploymentStatus = 'error';
        website.deployment.buildLogs.push(`❌ Error: ${error.message}`);
        await website.save();
      }
    } catch (updateError) {
      console.error('Error updating deployment status:', updateError);
    }

    res.status(500).json({
      success: false,
      message: 'Error deploying website',
      error: error.message
    });
  }
};

// Get deployment status
const getDeploymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    const website = await Website.findOne({ _id: id, doctorId });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    res.json({
      success: true,
      deployment: website.deployment,
      status: website.status,
      publishedAt: website.publishedAt
    });
  } catch (error) {
    console.error('Get deployment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting deployment status',
      error: error.message
    });
  }
};

// PUBLIC WEBSITE SERVING FUNCTIONS

// Serve published website by subdomain (PUBLIC - No authentication required)
const servePublishedWebsite = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const requestedPath = req.params.path || ''; // Get the path after subdomain

    console.log(`Serving public website: ${subdomain}, path: ${requestedPath}`);

    // Find the website by subdomain
    const website = await Website.findOne({ subdomain, status: 'published' });

    if (!website) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Website Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>Website Not Found</h1>
          <p>The website "${subdomain}" is not published or does not exist.</p>
        </body>
        </html>
      `);
    }

    // Determine which file to serve
    let fileName = 'index.html';
    if (requestedPath && requestedPath !== '') {
      if (requestedPath.endsWith('.html') || requestedPath.endsWith('.css') || requestedPath.endsWith('.js')) {
        fileName = requestedPath;
      } else {
        fileName = `${requestedPath}.html`;
      }
    }

    // Construct file path
    const sitePath = path.join(__dirname, '../../generated-sites', subdomain);
    const filePath = path.join(sitePath, fileName);

    console.log(`Looking for file: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      // If specific file not found and it's not index.html, try index.html
      if (fileName !== 'index.html') {
        const indexPath = path.join(sitePath, 'index.html');
        if (fs.existsSync(indexPath)) {
          return res.sendFile(indexPath);
        }
      }

      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Page Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>Page Not Found</h1>
          <p>The requested page could not be found.</p>
          <a href="/">&larr; Back to Home</a>
        </body>
        </html>
      `);
    }

    // Set appropriate content type
    if (fileName.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    } else if (fileName.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    } else {
      res.set('Content-Type', 'text/html');
    }

    // Serve the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Serve published website error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Server Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>Server Error</h1>
        <p>An error occurred while serving the website.</p>
      </body>
      </html>
    `);
  }
};

// Get published website info (PUBLIC - No authentication required)
const getPublishedWebsiteInfo = async (req, res) => {
  try {
    const { subdomain } = req.params;

    const website = await Website.findOne({ subdomain, status: 'published' });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found or not published'
      });
    }

    // Return basic public info (no sensitive data)
    res.json({
      success: true,
      website: {
        name: website.name,
        description: website.description,
        subdomain: website.subdomain,
        template: website.template,
        publishedAt: website.publishedAt,
        lastUpdated: website.updatedAt
      }
    });
  } catch (error) {
    console.error('Get published website info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching website info'
    });
  }
};

module.exports = {
  getWebsites,
  getWebsiteById,
  createWebsite,
  updateWebsite,
  saveWebsiteContent,
  getWebsiteVersions,
  restoreWebsiteVersion,
  checkSubdomainAvailability,
  deleteWebsite,
  permanentDeleteWebsite,
  updateWebsiteStatus,
  generateStaticSite,
  deployWebsite,
  getDeploymentStatus,
  // Public serving functions
  servePublishedWebsite,
  getPublishedWebsiteInfo
};