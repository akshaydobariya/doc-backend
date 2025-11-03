const axios = require('axios');

/**
 * LLM Service for content generation
 * Supports multiple providers: Google AI Studio (Gemini), DeepSeek
 * Provides fallback mechanisms and specialized dental content generation
 */
class LLMService {
  constructor() {
    this.providers = {
      'google-ai': {
        name: 'Google AI Studio',
        apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        model: 'gemini-2.0-flash-001',
        apiKey: process.env.GOOGLE_AI_API_KEY,
        enabled: !!process.env.GOOGLE_AI_API_KEY && process.env.GOOGLE_AI_API_KEY.startsWith('AIzaSy')
      },
      'deepseek': {
        name: 'DeepSeek',
        apiUrl: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat',
        apiKey: process.env.DEEPSEEK_API_KEY,
        enabled: !!process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.startsWith('sk-') && !process.env.DEEPSEEK_API_KEY.includes('1234567890')
      },
      'mock': {
        name: 'Mock Provider (for testing)',
        model: 'mock-dental-content',
        apiKey: 'mock',
        enabled: true // Always enabled as fallback
      }
    };

    // Default provider order (primary to fallback)
    this.providerOrder = ['google-ai', 'deepseek', 'mock'];

    // Rate limiting and caching
    this.requestCounts = new Map();
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

    // Dental-specific prompts and templates
    this.dentalPrompts = {
      serviceOverview: {
        system: "You are a professional dental copywriter creating patient-friendly, SEO-optimized content for dental practice websites. Your writing should be informative, reassuring, and encourage patients to book appointments.",
        user: "Write a comprehensive overview for {{serviceName}} dental service. Include: what it is, who needs it, why it's important for oral health. Target keywords: {{keywords}}. Keep it professional but accessible, around 150-200 words."
      },

      serviceBenefits: {
        system: "You are a dental marketing expert writing benefit-focused content that converts visitors into patients. Focus on patient outcomes and quality of life improvements.",
        user: "List 5-7 key benefits of {{serviceName}} for patients. Use this EXACT format:\n• Title (4-6 words): Description (20-30 words)\n• Title (4-6 words): Description (20-30 words)\nFocus on: improved health, aesthetics, comfort, long-term value, and patient experience."
      },

      procedureSteps: {
        system: "You are a dental educator explaining procedures in simple, non-intimidating language that reduces patient anxiety while building confidence in the practice.",
        user: "Outline the step-by-step process for {{serviceName}}. Use this EXACT format:\n1. Step Title (3-8 words): Brief description (15-25 words)\n2. Step Title (3-8 words): Brief description (15-25 words)\nInclude 4-6 main steps. Emphasize comfort, safety, and professionalism. Avoid medical jargon."
      },

      faqGeneration: {
        system: "You are a dental practice manager who answers the most common patient questions with empathy, clarity, and expertise. Anticipate patient concerns and provide reassuring, informative answers.",
        user: "Generate 6-8 frequently asked questions and answers about {{serviceName}}. Cover: cost concerns, pain/discomfort, recovery time, candidacy, insurance, and effectiveness. Keep answers concise but thorough."
      },

      aftercareInstructions: {
        system: "You are a dental hygienist providing clear, actionable aftercare instructions that promote healing and prevent complications. Be specific and organized.",
        user: "Create aftercare instructions for {{serviceName}}. Use this EXACT format:\n• Instruction (5-12 words): Detailed explanation (20-30 words)\n• Instruction (5-12 words): Detailed explanation (20-30 words)\nInclude immediate care (first 24 hours), short-term care (1-7 days), and long-term maintenance."
      },

      seoContent: {
        system: "You are an SEO specialist creating dental content that ranks well while serving patients. Balance keyword optimization with natural, helpful content.",
        user: "Generate SEO metadata for {{serviceName}} page: 1) Meta title (50-60 chars), 2) Meta description (150-160 chars), 3) 5-8 related keywords. Focus on location + service combinations and patient intent keywords."
      }
    };
  }

  /**
   * Generate content using the best available provider
   */
  async generateContent(prompt, options = {}) {
    const {
      provider = 'auto',
      temperature = 0.7,
      maxTokens = 1000,
      format = 'text',
      variables = {},
      cacheKey = null
    } = options;

    // Check cache first
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return {
          content: cached.content,
          provider: cached.provider,
          cached: true,
          tokensUsed: 0
        };
      }
    }

    // Determine which providers to try
    const providersToTry = provider === 'auto'
      ? this.providerOrder.filter(p => this.providers[p].enabled)
      : [provider].filter(p => this.providers[p]?.enabled);

    if (providersToTry.length === 0) {
      throw new Error('No LLM providers are configured or available');
    }

    let lastError = null;

    // Try each provider in order
    for (const providerKey of providersToTry) {
      try {
        const result = await this.callProvider(providerKey, prompt, {
          temperature,
          maxTokens,
          format,
          variables
        });

        // Cache successful result
        if (cacheKey) {
          this.cache.set(cacheKey, {
            content: result.content,
            provider: providerKey,
            timestamp: Date.now()
          });
        }

        return {
          ...result,
          provider: providerKey,
          cached: false
        };

      } catch (error) {
        console.error(`LLM Provider ${providerKey} failed:`, error.message);
        lastError = error;

        // If this is a rate limit error, try next provider immediately
        if (error.message.includes('rate limit') || error.message.includes('quota')) {
          continue;
        }

        // For other errors, still try next provider but log the error
        continue;
      }
    }

    // If all providers failed, throw the last error
    throw new Error(`All LLM providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Call a specific LLM provider
   */
  async callProvider(providerKey, prompt, options = {}) {
    const provider = this.providers[providerKey];
    if (!provider || !provider.enabled) {
      throw new Error(`Provider ${providerKey} is not available`);
    }

    // Check rate limits
    if (this.isRateLimited(providerKey)) {
      throw new Error(`Rate limit exceeded for provider ${providerKey}`);
    }

    switch (providerKey) {
      case 'google-ai':
        return await this.callGoogleAI(prompt, options);
      case 'deepseek':
        return await this.callDeepSeek(prompt, options);
      case 'mock':
        return await this.callMockProvider(prompt, options);
      default:
        throw new Error(`Unsupported provider: ${providerKey}`);
    }
  }

  /**
   * Call Google AI Studio (Gemini)
   */
  async callGoogleAI(prompt, options = {}) {
    const { temperature = 0.7, maxTokens = 1000, variables = {} } = options;
    const provider = this.providers['google-ai'];

    // Replace variables in prompt
    const processedPrompt = this.replaceVariables(prompt, variables);

    const requestData = {
      contents: [{
        parts: [{
          text: processedPrompt
        }]
      }],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: maxTokens,
        topK: 40,
        topP: 0.95
      }
    };

    try {
      const response = await axios.post(
        `${provider.apiUrl}/${provider.model}:generateContent?key=${provider.apiKey}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Google AI');
      }

      const content = response.data.candidates[0].content.parts[0].text;
      const tokensUsed = this.estimateTokens(processedPrompt + content);

      // Update rate limiting
      this.updateRateLimit('google-ai');

      return {
        content: content.trim(),
        tokensUsed,
        model: provider.model
      };

    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Google AI rate limit exceeded');
      }
      throw new Error(`Google AI error: ${error.message}`);
    }
  }

  /**
   * Call DeepSeek API
   */
  async callDeepSeek(prompt, options = {}) {
    const { temperature = 0.7, maxTokens = 1000, variables = {} } = options;
    const provider = this.providers['deepseek'];

    // Replace variables in prompt
    const processedPrompt = this.replaceVariables(prompt, variables);

    const requestData = {
      model: provider.model,
      messages: [
        {
          role: 'user',
          content: processedPrompt
        }
      ],
      temperature: temperature,
      max_tokens: maxTokens,
      stream: false
    };

    try {
      const response = await axios.post(
        provider.apiUrl,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`
          },
          timeout: 30000
        }
      );

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from DeepSeek');
      }

      const content = response.data.choices[0].message.content;
      const tokensUsed = response.data.usage?.total_tokens || this.estimateTokens(processedPrompt + content);

      // Update rate limiting
      this.updateRateLimit('deepseek');

      return {
        content: content.trim(),
        tokensUsed,
        model: provider.model
      };

    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('DeepSeek rate limit exceeded');
      }
      throw new Error(`DeepSeek error: ${error.message}`);
    }
  }

  /**
   * Call Mock Provider (for testing when real APIs are not available)
   */
  async callMockProvider(prompt, options = {}) {
    const { variables = {} } = options;
    const serviceName = variables.serviceName || 'Dental Service';
    const category = variables.category || 'general-dentistry';

    // Generate realistic mock content based on service data and prompt type
    let content = '';

    // Generate service-specific content based on category using database templates
    const getServiceSpecificTemplate = async (serviceName, category, contentType, serviceData = {}) => {
      try {
        // Import ContentTemplate model
        const ContentTemplate = require('../models/ContentTemplate');

        // Try to find a matching template from database
        const templates = await ContentTemplate.findByCategory(category, 'prompt');
        let template = null;

        if (templates.length > 0) {
          // Use the most popular template for this category
          template = templates[0];
          await template.incrementUsage();
        }

        if (template && template.template.prompt) {
          // Use database template with variable substitution
          const variables = {
            serviceName,
            category,
            contentType,
            ...serviceData
          };

          template.validateVariables(variables);
          const renderedTemplate = template.render(variables);

          if (renderedTemplate.prompt && renderedTemplate.prompt.userPromptTemplate) {
            return renderedTemplate.prompt.userPromptTemplate;
          }
        }

        // Fallback to basic dynamic templates (no hardcoded content)
        const fallbackTemplates = {
          overview: `${serviceName} is a professional dental treatment that provides comprehensive care for your oral health. Our experienced dental team uses modern techniques and technology to deliver effective results tailored to your individual needs.`,
          benefits: [
            `Improved oral health with ${serviceName} treatment`,
            'Professional care using advanced techniques',
            'Personalized treatment approach',
            'Long-lasting results and enhanced quality of life',
            'Expert dental care from qualified professionals'
          ],
          procedures: [
            'Initial consultation and examination',
            'Treatment planning and preparation',
            `${serviceName} procedure execution`,
            'Quality assessment and adjustments',
            'Post-treatment care and follow-up'
          ]
        };

        return fallbackTemplates[contentType] || fallbackTemplates.overview;

      } catch (error) {
        console.warn('Error loading template from database, using fallback:', error);

        // Simple fallback without hardcoded service names
        const simpleFallback = {
          overview: `${serviceName} is a dental treatment designed to improve your oral health and provide professional care.`,
          benefits: [`Professional ${serviceName} treatment`, 'Expert dental care', 'Improved oral health outcomes'],
          procedures: ['Consultation', 'Treatment planning', 'Procedure execution', 'Follow-up care']
        };

        return simpleFallback[contentType] || simpleFallback.overview;
      }
    };

    if (prompt.includes('overview') || prompt.includes('comprehensive')) {
      content = await getServiceSpecificTemplate(serviceName, category, 'overview', variables);
    } else if (prompt.includes('benefits') || prompt.includes('advantages')) {
      const benefits = await getServiceSpecificTemplate(serviceName, category, 'benefits', variables);
      content = Array.isArray(benefits)
        ? benefits.map(benefit => `• ${benefit}`).join('\n')
        : `• Improved oral health with ${serviceName} treatment\n• Professional care using advanced techniques\n• Long-lasting results and enhanced quality of life`;
    } else if (prompt.includes('steps') || prompt.includes('procedure')) {
      const procedures = await getServiceSpecificTemplate(serviceName, category, 'procedures', variables);
      content = Array.isArray(procedures)
        ? procedures.map((step, index) => `${index + 1}. ${step}`).join('\n')
        : `1. Initial consultation and examination\n2. Treatment planning and preparation\n3. ${serviceName} procedure execution\n4. Quality assessment and adjustments\n5. Post-treatment care and follow-up`;
    } else if (prompt.includes('FAQ') || prompt.includes('questions')) {
      const categoryFAQs = {
        'cosmetic-dentistry': [
          { q: `How long does ${serviceName} take?`, a: 'Most cosmetic procedures are completed in 1-3 visits, depending on complexity.' },
          { q: 'Will the results look natural?', a: 'Yes, we use advanced techniques to ensure natural-looking, beautiful results.' },
          { q: 'How long do the results last?', a: 'With proper care, cosmetic dental work can last 10-15 years or more.' },
          { q: 'Is the procedure painful?', a: 'We use effective pain management to ensure your comfort throughout treatment.' }
        ],
        'general-dentistry': [
          { q: `How often do I need ${serviceName}?`, a: 'Regular treatments are typically recommended every 6 months for optimal oral health.' },
          { q: 'Is the treatment covered by insurance?', a: 'Most general dental treatments are covered by dental insurance plans.' },
          { q: 'What should I expect during treatment?', a: 'We will explain each step and ensure your comfort throughout the procedure.' },
          { q: 'How can I maintain results?', a: 'Good oral hygiene and regular dental visits are key to maintaining results.' }
        ],
        'oral-surgery': [
          { q: `How long is recovery after ${serviceName}?`, a: 'Recovery varies but most patients return to normal activities within 3-7 days.' },
          { q: 'Will I need pain medication?', a: 'We provide comprehensive pain management including prescription medications as needed.' },
          { q: 'What are the risks?', a: 'We discuss all risks and benefits during consultation. Complications are rare with proper care.' },
          { q: 'When can I eat normally?', a: 'Dietary restrictions are temporary, usually lasting 24-48 hours post-surgery.' }
        ]
      };

      const faqs = categoryFAQs[category] || categoryFAQs['general-dentistry'];
      content = faqs.map(faq => `Q: ${faq.q}\nA: ${faq.a}`).join('\n\n');
    } else if (prompt.includes('aftercare') || prompt.includes('recovery')) {
      const categoryAftercare = {
        'cosmetic-dentistry': [
          'First 24 Hours: Avoid staining foods and beverages',
          'First Week: Use soft-bristled toothbrush and gentle brushing',
          'Ongoing: Maintain excellent oral hygiene to preserve results',
          'Long-term: Regular dental cleanings and checkups every 6 months'
        ],
        'general-dentistry': [
          'Follow prescribed oral hygiene routine',
          'Take any prescribed medications as directed',
          'Avoid hard or sticky foods for 24 hours',
          'Schedule follow-up appointment as recommended'
        ],
        'oral-surgery': [
          'First 24 Hours: Apply ice packs and rest',
          'Days 1-3: Take prescribed pain medication and antibiotics',
          'Week 1: Soft food diet and gentle oral care',
          'Follow-up: Attend all scheduled post-operative appointments'
        ]
      };

      const aftercare = categoryAftercare[category] || categoryAftercare['general-dentistry'];
      content = aftercare.map((instruction, index) => `• ${instruction}`).join('\n');
    } else if (prompt.includes('SEO') || prompt.includes('meta')) {
      const categoryKeywords = {
        'cosmetic-dentistry': ['cosmetic dentist', 'smile makeover', 'aesthetic dentistry', 'beautiful smile'],
        'general-dentistry': ['general dentist', 'dental care', 'oral health', 'preventive dentistry'],
        'oral-surgery': ['oral surgeon', 'dental surgery', 'surgical dentistry', 'oral maxillofacial']
      };

      const keywords = categoryKeywords[category] || categoryKeywords['general-dentistry'];
      content = `Meta Title: ${serviceName} | Expert Dental Care | [Practice Name]
Meta Description: Professional ${serviceName} services with advanced technology and experienced dentists. Schedule your consultation today for optimal oral health.
Keywords: ${serviceName.toLowerCase()}, ${keywords.join(', ')}, dental treatment, oral health`;
    } else {
      // Generic content based on service data
      content = getServiceSpecificTemplate(serviceName, category, 'overview');
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      content: content.trim(),
      tokensUsed: this.estimateTokens(content),
      model: 'mock-dental-content'
    };
  }

  /**
   * Generate dental service content using predefined prompts
   */
  async generateDentalServiceContent(serviceName, contentType, options = {}) {
    const {
      keywords = [],
      category = 'general-dentistry',
      customPrompt = null,
      ...generateOptions
    } = options;

    if (!this.dentalPrompts[contentType]) {
      throw new Error(`Unknown dental content type: ${contentType}`);
    }

    const promptTemplate = customPrompt || this.dentalPrompts[contentType];
    const variables = {
      serviceName,
      keywords: keywords.join(', '),
      category,
      ...options.variables
    };

    // Combine system and user prompts
    const fullPrompt = `${promptTemplate.system}\n\n${promptTemplate.user}`;

    const cacheKey = `dental_${contentType}_${serviceName}_${JSON.stringify(variables)}`;

    return await this.generateContent(fullPrompt, {
      ...generateOptions,
      variables,
      cacheKey
    });
  }

  /**
   * Generate complete service page content
   */
  async generateServicePageContent(serviceData, options = {}) {
    const { serviceName, category, keywords = [] } = serviceData;
    const results = {};

    try {
      // Generate different sections in parallel for efficiency
      const sections = [
        'serviceOverview',
        'serviceBenefits',
        'procedureSteps',
        'faqGeneration',
        'aftercareInstructions',
        'seoContent'
      ];

      const promises = sections.map(async (section) => {
        try {
          const result = await this.generateDentalServiceContent(serviceName, section, {
            keywords,
            category,
            ...options
          });
          return { section, result };
        } catch (error) {
          console.error(`Failed to generate ${section} for ${serviceName}:`, error.message);
          return { section, error: error.message };
        }
      });

      const sectionResults = await Promise.allSettled(promises);

      // Process results
      sectionResults.forEach((promiseResult) => {
        if (promiseResult.status === 'fulfilled') {
          const { section, result, error } = promiseResult.value;
          if (result) {
            results[section] = result;
          } else if (error) {
            results[section] = { error };
          }
        }
      });

      return {
        success: true,
        content: results,
        generatedAt: new Date(),
        serviceName,
        totalTokensUsed: Object.values(results).reduce((sum, r) => sum + (r.tokensUsed || 0), 0)
      };

    } catch (error) {
      throw new Error(`Failed to generate service page content: ${error.message}`);
    }
  }

  /**
   * Helper methods
   */

  replaceVariables(text, variables) {
    let processed = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(regex, value);
    }
    return processed;
  }

  estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  isRateLimited(provider) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${provider}_${minute}`;

    const count = this.requestCounts.get(key) || 0;

    // Conservative rate limits per minute
    const limits = {
      'google-ai': 15, // Google AI Studio free tier
      'deepseek': 20   // Conservative limit for DeepSeek
    };

    return count >= (limits[provider] || 10);
  }

  updateRateLimit(provider) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${provider}_${minute}`;

    const count = this.requestCounts.get(key) || 0;
    this.requestCounts.set(key, count + 1);

    // Clean up old entries (keep only last 5 minutes)
    for (const [k] of this.requestCounts) {
      const keyMinute = parseInt(k.split('_')[1]);
      if (minute - keyMinute > 5) {
        this.requestCounts.delete(k);
      }
    }
  }

  /**
   * Get provider status and capabilities
   */
  getProviderStatus() {
    return Object.entries(this.providers).map(([key, provider]) => ({
      key,
      name: provider.name,
      enabled: provider.enabled,
      configured: !!provider.apiKey,
      model: provider.model,
      rateLimited: this.isRateLimited(key)
    }));
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    return true;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
const llmService = new LLMService();
module.exports = llmService;