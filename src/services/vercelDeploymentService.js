const axios = require('axios');
const FormData = require('form-data');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

/**
 * Vercel Deployment Service
 * Handles real deployment of websites to Vercel for global access
 */

class VercelDeploymentService {
  constructor() {
    this.vercelToken = process.env.VERCEL_TOKEN;
    this.teamId = process.env.VERCEL_TEAM_ID;
    this.baseURL = 'https://api.vercel.com';

    if (!this.vercelToken) {
      console.warn('⚠️  VERCEL_TOKEN not set - deployments will be simulated');
    }
  }

  /**
   * Deploy website to Vercel
   * @param {Object} website - Website document from MongoDB
   * @param {string} sitePath - Path to generated site files
   * @returns {Object} Deployment result
   */
  async deployWebsite(website, sitePath) {
    try {
      if (!this.vercelToken) {
        return this.simulateDeployment(website);
      }

      console.log(`🚀 Starting Vercel deployment for: ${website.subdomain}`);

      // Step 1: Create deployment files
      const deploymentFiles = await this.prepareDeploymentFiles(sitePath);

      // Step 2: Create Vercel deployment
      const deployment = await this.createVercelDeployment(website, deploymentFiles);

      // Step 3: Wait for deployment to complete
      const finalDeployment = await this.waitForDeployment(deployment.id);

      console.log(`✅ Deployment successful: ${finalDeployment.url}`);

      return {
        success: true,
        deploymentId: finalDeployment.id,
        url: finalDeployment.url,
        alias: finalDeployment.alias,
        status: 'ready',
        provider: 'vercel',
        deployedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Vercel deployment failed:', error.message);
      return {
        success: false,
        error: error.message,
        status: 'failed',
        provider: 'vercel'
      };
    }
  }

  /**
   * Prepare files for deployment
   */
  async prepareDeploymentFiles(sitePath) {
    const files = [];

    // Read all files in the site directory
    const fileNames = fs.readdirSync(sitePath);

    for (const fileName of fileNames) {
      const filePath = path.join(sitePath, fileName);
      const stats = fs.statSync(filePath);

      if (stats.isFile()) {
        const content = fs.readFileSync(filePath, 'utf8');
        files.push({
          file: fileName,
          data: content
        });
      }
    }

    // Add Vercel configuration
    files.push({
      file: 'vercel.json',
      data: JSON.stringify({
        version: 2,
        builds: [
          {
            src: "*.html",
            use: "@vercel/static"
          }
        ],
        routes: [
          {
            src: "/(.*)",
            dest: "/index.html"
          }
        ]
      }, null, 2)
    });

    return files;
  }

  /**
   * Create deployment on Vercel
   */
  async createVercelDeployment(website, files) {
    const deploymentData = {
      name: website.subdomain,
      files: files,
      projectSettings: {
        framework: "other"
      },
      target: "production"
    };

    if (this.teamId) {
      deploymentData.teamId = this.teamId;
    }

    const response = await axios.post(`${this.baseURL}/v13/deployments`, deploymentData, {
      headers: {
        'Authorization': `Bearer ${this.vercelToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  /**
   * Wait for deployment to complete
   */
  async waitForDeployment(deploymentId, maxWaitTime = 300000) { // 5 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const response = await axios.get(`${this.baseURL}/v13/deployments/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`
        }
      });

      const deployment = response.data;

      if (deployment.readyState === 'READY') {
        return deployment;
      } else if (deployment.readyState === 'ERROR') {
        throw new Error(`Deployment failed: ${deployment.errorMessage || 'Unknown error'}`);
      }

      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Deployment timeout - took longer than 5 minutes');
  }

  /**
   * Set up custom domain/subdomain
   */
  async setupCustomDomain(deploymentUrl, customDomain) {
    try {
      if (!this.vercelToken) {
        console.log('⚠️  Cannot setup custom domain - Vercel token not configured');
        return { success: false, message: 'Token not configured' };
      }

      // Add domain to Vercel project
      const response = await axios.post(`${this.baseURL}/v9/projects/${projectId}/domains`, {
        name: customDomain
      }, {
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`
        }
      });

      return {
        success: true,
        domain: response.data
      };

    } catch (error) {
      console.error('❌ Custom domain setup failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Simulate deployment when Vercel token is not available
   */
  simulateDeployment(website) {
    console.log(`🔧 Simulating deployment for: ${website.subdomain}`);

    return {
      success: true,
      deploymentId: `sim_${Date.now()}`,
      url: `https://${website.subdomain}-${Math.random().toString(36).substring(7)}.vercel.app`,
      alias: [`${website.subdomain}.vercel.app`],
      status: 'ready',
      provider: 'vercel-simulated',
      deployedAt: new Date(),
      note: 'This is a simulated deployment. Configure VERCEL_TOKEN for real deployments.'
    };
  }

  /**
   * Delete deployment
   */
  async deleteDeployment(deploymentId) {
    try {
      if (!this.vercelToken) {
        console.log('⚠️  Cannot delete deployment - Vercel token not configured');
        return { success: false, message: 'Token not configured' };
      }

      await axios.delete(`${this.baseURL}/v13/deployments/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`
        }
      });

      return { success: true };

    } catch (error) {
      console.error('❌ Delete deployment failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId) {
    try {
      if (!this.vercelToken) {
        return {
          status: 'simulated',
          message: 'Vercel token not configured'
        };
      }

      const response = await axios.get(`${this.baseURL}/v13/deployments/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`
        }
      });

      return {
        status: response.data.readyState,
        url: response.data.url,
        alias: response.data.alias
      };

    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

module.exports = new VercelDeploymentService();