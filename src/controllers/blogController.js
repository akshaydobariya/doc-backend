const Blog = require('../models/Blog');
const ServicePage = require('../models/ServicePage');
const Website = require('../models/Website');
const { validationResult } = require('express-validator');
const llmService = require('../services/llmService');

/**
 * Blog Controller
 * Handles CRUD operations for dental blog content with Clove Dental style structure
 */
class BlogController {

  /**
   * Get all blogs with filtering and pagination
   * @route GET /api/blogs
   */
  static async getAllBlogs(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        featured,
        websiteId,
        servicePageId,
        published = true,
        search
      } = req.query;

      // Build query
      const query = {};

      if (published === 'true') query.isPublished = true;
      if (category) query.category = category;
      if (featured === 'true') query.featured = true;
      if (websiteId) query.websiteId = websiteId;
      if (servicePageId) query.servicePageId = servicePageId;

      if (search) {
        query.$text = { $search: search };
      }

      // Execute query with pagination
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { publishedAt: -1, createdAt: -1 },
        populate: [
          { path: 'servicePageId', select: 'title slug category' },
          { path: 'websiteId', select: 'name subdomain' }
        ]
      };

      const blogs = await Blog.paginate(query, options);

      res.json({
        success: true,
        data: blogs.docs,
        pagination: {
          currentPage: blogs.page,
          totalPages: blogs.totalPages,
          totalDocs: blogs.totalDocs,
          hasNext: blogs.hasNextPage,
          hasPrev: blogs.hasPrevPage
        }
      });
    } catch (error) {
      console.error('Get blogs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blogs',
        error: error.message
      });
    }
  }

  /**
   * Get single blog by slug
   * @route GET /api/blogs/slug/:slug
   */
  static async getBlogBySlug(req, res) {
    try {
      const { slug } = req.params;
      const { incrementView } = req.query;

      const blog = await Blog.findOne({ slug, isPublished: true })
        .populate('servicePageId', 'title slug category description')
        .populate('websiteId', 'name subdomain');

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      // Increment view count if requested
      if (incrementView === 'true') {
        await blog.incrementViews();
      }

      res.json({
        success: true,
        data: {
          blog: blog
        }
      });
    } catch (error) {
      console.error('Get blog by slug error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog',
        error: error.message
      });
    }
  }

  /**
   * Get blogs by service page
   * @route GET /api/blogs/service/:servicePageId
   */
  static async getBlogsByService(req, res) {
    try {
      const { servicePageId } = req.params;
      const { limit = 6 } = req.query;

      const blogs = await Blog.findByService(servicePageId)
        .limit(parseInt(limit))
        .select('title slug introduction readingTime featuredImage tags publishedAt author');

      res.json({
        success: true,
        data: blogs,
        count: blogs.length
      });
    } catch (error) {
      console.error('Get blogs by service error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch service blogs',
        error: error.message
      });
    }
  }

  /**
   * Get featured blogs
   * @route GET /api/blogs/featured
   */
  static async getFeaturedBlogs(req, res) {
    try {
      const { limit = 6, websiteId } = req.query;

      let query = { featured: true, isPublished: true };
      if (websiteId) query.websiteId = websiteId;

      const blogs = await Blog.find(query)
        .sort({ publishedAt: -1 })
        .limit(parseInt(limit))
        .select('title slug introduction readingTime featuredImage tags publishedAt author category')
        .populate('servicePageId', 'title slug');

      res.json({
        success: true,
        data: blogs,
        count: blogs.length
      });
    } catch (error) {
      console.error('Get featured blogs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch featured blogs',
        error: error.message
      });
    }
  }

  /**
   * Get related blogs based on category and tags
   * @route GET /api/blogs/related/:blogId
   */
  static async getRelatedBlogs(req, res) {
    try {
      const { blogId } = req.params;
      const { limit = 3 } = req.query;

      const currentBlog = await Blog.findById(blogId);
      if (!currentBlog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      // Find related blogs based on category and tags
      const relatedBlogs = await Blog.find({
        _id: { $ne: blogId },
        isPublished: true,
        $or: [
          { category: currentBlog.category },
          { tags: { $in: currentBlog.tags } },
          { servicePageId: currentBlog.servicePageId }
        ]
      })
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit))
      .select('title slug introduction readingTime featuredImage tags publishedAt author category');

      res.json({
        success: true,
        data: relatedBlogs,
        count: relatedBlogs.length
      });
    } catch (error) {
      console.error('Get related blogs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch related blogs',
        error: error.message
      });
    }
  }

  /**
   * Create new blog (Admin only)
   * @route POST /api/blogs
   */
  static async createBlog(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const blogData = {
        ...req.body,
        author: req.user?.name || 'Dr. Professional'
      };

      const blog = new Blog(blogData);
      await blog.save();

      await blog.populate([
        { path: 'servicePageId', select: 'title slug category' },
        { path: 'websiteId', select: 'name subdomain' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Blog created successfully',
        data: blog
      });
    } catch (error) {
      console.error('Create blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create blog',
        error: error.message
      });
    }
  }

  /**
   * Generate blog using LLM
   * @route POST /api/blogs/generate
   */
  static async generateBlog(req, res) {
    try {
      const {
        serviceName,
        servicePageId,
        websiteId,
        category,
        keywords = [],
        blogType = 'comprehensive',
        customPrompt = null,
        autoPublish = false
      } = req.body;

      if (!serviceName || !servicePageId || !websiteId) {
        return res.status(400).json({
          success: false,
          message: 'Service name, service page ID, and website ID are required'
        });
      }

      console.log(`🎨 Generating blog for: ${serviceName}`);

      // Get service page and website info
      const [servicePage, website] = await Promise.all([
        ServicePage.findById(servicePageId),
        Website.findById(websiteId)
      ]);

      if (!servicePage) {
        return res.status(404).json({
          success: false,
          message: 'Service page not found'
        });
      }

      // Generate blog content using LLM service
      const blogOptions = {
        serviceName,
        serviceCategory: category || servicePage.category,
        websiteName: website?.name || 'Our Practice',
        doctorName: req.user?.name || 'Dr. Professional',
        targetKeywords: keywords,
        blogType,
        customPrompt
      };

      const blogResult = await llmService.generateSingleBlogContent(serviceName, blogType, {
        websiteName: website?.name || 'Our Practice',
        doctorName: req.user?.name || 'Dr. Professional',
        practiceLocation: website?.location || 'Our Practice',
        targetKeywords: keywords
      });

      if (!blogResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate blog content',
          error: blogResult.error
        });
      }

      // Create blog slug from title
      const slug = serviceName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-')
        + '-comprehensive-guide';

      // Structure blog content according to our model
      const blogContent = {
        introduction: {
          title: 'Introduction',
          content: blogResult.content.introduction || `Complete guide to ${serviceName}`,
          anchor: 'introduction'
        },
        whatIsIt: {
          title: `What is ${serviceName}?`,
          content: blogResult.content.sections?.find(s => s.heading.includes('What is'))?.content || '',
          anchor: 'what-is-it'
        },
        whyNeedIt: {
          title: `Why Do You Need ${serviceName}?`,
          content: blogResult.content.sections?.find(s => s.heading.includes('Why') || s.heading.includes('Need'))?.content || '',
          anchor: 'why-need-it'
        },
        signsSymptoms: {
          title: 'Signs and Symptoms',
          content: blogResult.content.sections?.find(s => s.heading.includes('Signs') || s.heading.includes('Symptoms'))?.content || '',
          anchor: 'signs-symptoms'
        },
        consequencesDelay: {
          title: 'What Happens If Treatment Is Delayed?',
          content: blogResult.content.sections?.find(s => s.heading.includes('Delay') || s.heading.includes('Consequences'))?.content || '',
          anchor: 'consequences-delay'
        },
        treatmentProcess: {
          title: `${serviceName} Procedure: Step by Step`,
          content: blogResult.content.sections?.find(s => s.heading.includes('Procedure') || s.heading.includes('Process'))?.content || '',
          anchor: 'treatment-process'
        },
        benefits: {
          title: `Benefits of ${serviceName}`,
          content: blogResult.content.sections?.find(s => s.heading.includes('Benefits'))?.content || '',
          anchor: 'benefits'
        },
        recoveryAftercare: {
          title: 'Recovery and Aftercare',
          content: blogResult.content.sections?.find(s => s.heading.includes('Recovery') || s.heading.includes('Aftercare'))?.content || '',
          anchor: 'recovery-aftercare'
        },
        mythsFacts: {
          title: `${serviceName}: Myths vs Facts`,
          content: blogResult.content.sections?.find(s => s.heading.includes('Myths') || s.heading.includes('Facts'))?.content || '',
          anchor: 'myths-facts'
        },
        costConsiderations: {
          title: 'Cost Considerations',
          content: blogResult.content.sections?.find(s => s.heading.includes('Cost'))?.content || 'Cost varies based on individual needs. Contact us for a personalized consultation.',
          anchor: 'cost-considerations'
        },
        faq: {
          title: 'Frequently Asked Questions',
          questions: blogResult.content.faq || [],
          anchor: 'faq'
        }
      };

      // Create blog
      const blogData = {
        title: `Complete Guide to ${serviceName}: Expert Insights and Patient Care`,
        slug: slug,
        introduction: blogResult.content.introduction || `Comprehensive guide to ${serviceName}`,
        content: blogContent,
        keyTakeaways: blogResult.content.keyTakeaways || [],
        servicePageId: servicePageId,
        websiteId: websiteId,
        author: req.user?.name || 'Dr. Professional',
        category: category || servicePage.category || 'general-dentistry',
        tags: keywords.length > 0 ? keywords : [serviceName.toLowerCase(), category || 'dental-care'],
        seoKeywords: keywords,
        featured: true,
        isPublished: autoPublish,
        llmGenerated: true,
        generationProvider: blogResult.metadata?.provider || 'google-ai',
        generationMetadata: {
          tokensUsed: blogResult.metadata?.tokensUsed || 0,
          temperature: 0.7,
          model: blogResult.metadata?.model || 'gemini-2.0-flash-001',
          generatedAt: new Date()
        }
      };

      const blog = new Blog(blogData);
      await blog.save();

      await blog.populate([
        { path: 'servicePageId', select: 'title slug category' },
        { path: 'websiteId', select: 'name subdomain' }
      ]);

      console.log(`✅ Blog generated successfully: ${blog.title}`);

      res.status(201).json({
        success: true,
        message: 'Blog generated and created successfully',
        data: {
          blog: blog,
          metadata: blogResult.metadata
        }
      });
    } catch (error) {
      console.error('Generate blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate blog',
        error: error.message
      });
    }
  }

  /**
   * Update blog
   * @route PUT /api/blogs/:id
   */
  static async updateBlog(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const blog = await Blog.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      }).populate([
        { path: 'servicePageId', select: 'title slug category' },
        { path: 'websiteId', select: 'name subdomain' }
      ]);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      res.json({
        success: true,
        message: 'Blog updated successfully',
        data: blog
      });
    } catch (error) {
      console.error('Update blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update blog',
        error: error.message
      });
    }
  }

  /**
   * Publish/Unpublish blog
   * @route PATCH /api/blogs/:id/publish
   */
  static async togglePublish(req, res) {
    try {
      const { id } = req.params;
      const { publish } = req.body;

      const blog = await Blog.findById(id);
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      if (publish) {
        await blog.publish();
      } else {
        await blog.unpublish();
      }

      res.json({
        success: true,
        message: `Blog ${publish ? 'published' : 'unpublished'} successfully`,
        data: blog
      });
    } catch (error) {
      console.error('Toggle publish error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update blog status',
        error: error.message
      });
    }
  }

  /**
   * Delete blog
   * @route DELETE /api/blogs/:id
   */
  static async deleteBlog(req, res) {
    try {
      const { id } = req.params;

      const blog = await Blog.findByIdAndDelete(id);
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      res.json({
        success: true,
        message: 'Blog deleted successfully'
      });
    } catch (error) {
      console.error('Delete blog error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete blog',
        error: error.message
      });
    }
  }

  /**
   * Get blog analytics
   * @route GET /api/blogs/:id/analytics
   */
  static async getBlogAnalytics(req, res) {
    try {
      const { id } = req.params;

      const blog = await Blog.findById(id).select('views likes shares readingTime wordCount qualityScore publishedAt');
      if (!blog) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }

      res.json({
        success: true,
        data: {
          analytics: {
            views: blog.views,
            likes: blog.likes,
            shares: blog.shares,
            readingTime: blog.readingTime,
            wordCount: blog.wordCount,
            qualityScore: blog.qualityScore,
            publishedAt: blog.publishedAt
          }
        }
      });
    } catch (error) {
      console.error('Get blog analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog analytics',
        error: error.message
      });
    }
  }

  /**
   * Search blogs
   * @route GET /api/blogs/search
   */
  static async searchBlogs(req, res) {
    try {
      const { q, category, limit = 10 } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      let query = {
        $text: { $search: q },
        isPublished: true
      };

      if (category) {
        query.category = category;
      }

      const blogs = await Blog.find(query)
        .sort({ score: { $meta: 'textScore' }, publishedAt: -1 })
        .limit(parseInt(limit))
        .select('title slug introduction readingTime featuredImage tags publishedAt author category');

      res.json({
        success: true,
        data: blogs,
        count: blogs.length
      });
    } catch (error) {
      console.error('Search blogs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search blogs',
        error: error.message
      });
    }
  }
}

module.exports = BlogController;