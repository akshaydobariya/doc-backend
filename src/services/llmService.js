const axios = require('axios');

/**
 * LLM Service for content generation
 * Supports Google AI Studio (Gemini) for dental content generation
 * Strict error handling - fails fast without fallbacks
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
      }
    };

    // Default provider order - Google AI only
    this.providerOrder = ['google-ai'];

    // Rate limiting and caching
    this.requestCounts = new Map();
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

    // Enhanced dental content prompts based on your specific 11-section format requirements
    this.dentalPrompts = {
      // 1. Introduction - Simple patient terms (100 words exactly)
      introduction: {
        system: "You are a professional dental copywriter creating patient-friendly, SEO-optimized content. Write in simple, reassuring language that patients can easily understand. Use a friendly and patient-facing tone suitable for a clinic website or brochure.",
        user: "Write a brief introduction for {{serviceName}} in simple patient terms. Explain what it is and why patients might need it. REQUIREMENTS:\n- EXACTLY 100 words\n- Use friendly, patient-facing tone\n- SEO-friendly language\n- Professional but accessible\n- Include practice name: {{websiteName}}\n- Target keywords: {{keywords}}\n\nMake it welcoming and reassuring for potential patients visiting a dental clinic website."
      },

      // 2. What does it entail - Detailed explanation (500 words in 5 bullet points)
      detailedExplanation: {
        system: "You are a dental educator creating detailed yet accessible content for patients. Write in friendly, patient-facing tone suitable for clinic websites. Focus on being informative while remaining approachable.",
        user: "Explain what {{serviceName}} entails in EXACTLY 5 detailed bullet points. REQUIREMENTS:\n- Total content: EXACTLY 500 words (100 words per bullet point)\n- Each bullet point: comprehensive explanation\n- Friendly, patient-facing tone\n- SEO-friendly content\n- Include: procedure details, techniques, technology, materials, expected outcomes\n\nFormat as:\n• Point 1: [100 words explaining first aspect]\n• Point 2: [100 words explaining second aspect]\n• Point 3: [100 words explaining third aspect]\n• Point 4: [100 words explaining fourth aspect]\n• Point 5: [100 words explaining fifth aspect]"
      },

      // 3. Why does one need to undergo this treatment (500 words in 5 bullet points)
      treatmentNeed: {
        system: "You are a dental expert explaining treatment necessity to patients in a friendly, reassuring manner. Focus on health benefits and quality of life improvements.",
        user: "Explain why patients need {{serviceName}} in EXACTLY 5 bullet points. REQUIREMENTS:\n- Total content: EXACTLY 500 words (100 words per bullet point)\n- Friendly, patient-facing tone for clinic websites\n- SEO-friendly content\n- Include: health benefits, functional improvements, aesthetic benefits, prevention aspects, long-term oral health\n\nFormat as:\n• Reason 1: [100 words explaining first necessity]\n• Reason 2: [100 words explaining second necessity]\n• Reason 3: [100 words explaining third necessity]\n• Reason 4: [100 words explaining fourth necessity]\n• Reason 5: [100 words explaining fifth necessity]"
      },

      // 4. Symptoms requiring this treatment (500 words in 5 bullet points)
      symptoms: {
        system: "You are a dental diagnostician helping patients recognize when they need treatment. Use friendly, non-alarming language while being informative.",
        user: "List symptoms indicating need for {{serviceName}} in EXACTLY 5 bullet points. REQUIREMENTS:\n- Total content: EXACTLY 500 words (100 words per bullet point)\n- Friendly, patient-facing tone\n- SEO-friendly content\n- Include: visible signs, pain indicators, functional problems, aesthetic concerns, early warning signs\n\nFormat as:\n• Symptom 1: [100 words explaining first symptom]\n• Symptom 2: [100 words explaining second symptom]\n• Symptom 3: [100 words explaining third symptom]\n• Symptom 4: [100 words explaining fourth symptom]\n• Symptom 5: [100 words explaining fifth symptom]"
      },

      // 5. Consequences when treatment is not performed (500 words in 5 bullet points)
      consequences: {
        system: "You are a dental health educator explaining potential consequences of delayed treatment. Use caring, informative tone that motivates without frightening patients.",
        user: "Explain consequences of delaying {{serviceName}} in EXACTLY 5 bullet points. REQUIREMENTS:\n- Total content: EXACTLY 500 words (100 words per bullet point)\n- Friendly but serious tone\n- SEO-friendly content\n- Include: problem progression, increased complications, functional impact, aesthetic changes, overall health effects\n\nFormat as:\n• Consequence 1: [100 words explaining first consequence]\n• Consequence 2: [100 words explaining second consequence]\n• Consequence 3: [100 words explaining third consequence]\n• Consequence 4: [100 words explaining fourth consequence]\n• Consequence 5: [100 words explaining fifth consequence]"
      },

      // 6. Treatment procedure in 5 steps (500 words total)
      procedureSteps: {
        system: "You are a dental educator explaining procedures to patients in a reassuring, step-by-step manner. Focus on comfort, safety, and modern techniques.",
        user: "Explain the {{serviceName}} procedure in EXACTLY 5 steps. REQUIREMENTS:\n- Total content: EXACTLY 500 words (100 words per step)\n- Friendly, reassuring tone for patients\n- SEO-friendly content\n- Include: preparation, actual procedure steps, comfort measures, modern techniques, safety protocols\n\nFormat as:\nStep 1: [100 words explaining first step]\nStep 2: [100 words explaining second step]\nStep 3: [100 words explaining third step]\nStep 4: [100 words explaining fourth step]\nStep 5: [100 words explaining fifth step]"
      },

      // 7. Post-treatment care (500 words in 5 bullet points)
      postTreatmentCare: {
        system: "You are a dental hygienist providing comprehensive aftercare instructions. Use clear, actionable language that patients can easily follow.",
        user: "Provide post-treatment care instructions for {{serviceName}} in EXACTLY 5 bullet points. REQUIREMENTS:\n- Total content: EXACTLY 500 words (100 words per bullet point)\n- Friendly, instructional tone\n- SEO-friendly content\n- Include: immediate care, diet guidelines, oral hygiene, activity restrictions, follow-up care\n\nFormat as:\n• Care Point 1: [100 words explaining first care instruction]\n• Care Point 2: [100 words explaining second care instruction]\n• Care Point 3: [100 words explaining third care instruction]\n• Care Point 4: [100 words explaining fourth care instruction]\n• Care Point 5: [100 words explaining fifth care instruction]"
      },

      // 8. Benefits of this procedure (500 words in 5 bullet points)
      procedureBenefits: {
        system: "You are a dental marketing expert writing benefit-focused content in a friendly, patient-centered manner. Highlight positive outcomes and life improvements.",
        user: "List benefits of {{serviceName}} in EXACTLY 5 bullet points. REQUIREMENTS:\n- Total content: EXACTLY 500 words (100 words per bullet point)\n- Friendly, encouraging tone\n- SEO-friendly content\n- Include: health improvements, aesthetic benefits, functional advantages, comfort enhancements, long-term value\n\nFormat as:\n• Benefit 1: [100 words explaining first benefit]\n• Benefit 2: [100 words explaining second benefit]\n• Benefit 3: [100 words explaining third benefit]\n• Benefit 4: [100 words explaining fourth benefit]\n• Benefit 5: [100 words explaining fifth benefit]"
      },

      // 9. Side effects (500 words in 5 bullet points)
      sideEffects: {
        system: "You are a dental professional providing honest, balanced information about potential side effects. Use reassuring tone while being thorough and accurate.",
        user: "Explain potential side effects of {{serviceName}} in EXACTLY 5 bullet points. REQUIREMENTS:\n- Total content: EXACTLY 500 words (100 words per bullet point)\n- Honest but reassuring tone\n- SEO-friendly content\n- Include: common temporary effects, rare complications, normal healing responses, when to contact doctor, prevention tips\n\nFormat as:\n• Side Effect 1: [100 words explaining first potential side effect]\n• Side Effect 2: [100 words explaining second potential side effect]\n• Side Effect 3: [100 words explaining third potential side effect]\n• Side Effect 4: [100 words explaining fourth potential side effect]\n• Side Effect 5: [100 words explaining fifth potential side effect]"
      },

      // 10. Myths and facts (500 words - 5 myths and facts)
      mythsAndFacts: {
        system: "You are a dental expert debunking common misconceptions about dental treatments while providing accurate, evidence-based information. Use friendly, educational tone suitable for patient websites.",
        user: "Present 5 common myths and facts about {{serviceName}}. REQUIREMENTS:\n- Total content: EXACTLY 500 words\n- 50 words per myth statement + 50 words per fact explanation\n- Friendly, educational tone for clinic websites\n- SEO-friendly content\n- Address common patient concerns and misconceptions with evidence-based facts\n\nFormat as:\nMyth 1: [50 words stating common misconception]\nFact 1: [50 words providing accurate information]\nMyth 2: [50 words stating common misconception]\nFact 2: [50 words providing accurate information]\n... continue for all 5 myths and facts"
      },

      // 11. FAQs (25 FAQs with 100-word answers)
      comprehensiveFAQ: {
        system: "You are a dental practice manager creating comprehensive FAQ content for patients. Write in friendly, informative tone suitable for clinic websites and brochures.",
        user: "Generate EXACTLY 25 FAQs about {{serviceName}} with detailed answers. REQUIREMENTS:\n- EXACTLY 25 questions and answers\n- Each answer: EXACTLY 100 words\n- Total content: 2500 words\n- Friendly, patient-facing tone for clinic websites\n- SEO-friendly questions and answers\n- Cover: procedure details, cost considerations, pain management, recovery time, candidacy, risks, alternatives, results, maintenance, insurance\n\nFormat as:\nQ1: [SEO-friendly question]\nA1: [100 words comprehensive answer]\nQ2: [SEO-friendly question]\nA2: [100 words comprehensive answer]\n... continue for all 25 FAQs"
      },

      // Legacy prompts for backward compatibility
      serviceOverview: {
        system: "You are a professional dental copywriter creating patient-friendly, SEO-optimized content for dental practice websites.",
        user: "Write a comprehensive overview for {{serviceName}} dental service. Include: what it is, who needs it, why it's important for oral health. Target keywords: {{keywords}}. Keep it professional but accessible, around 150-200 words."
      },

      serviceBenefits: {
        system: "You are a dental marketing expert writing benefit-focused content that converts visitors into patients.",
        user: "List 5-7 key benefits of {{serviceName}} for patients. Focus on: improved health, aesthetics, comfort, long-term value, and patient experience."
      },

      faqGeneration: {
        system: "You are a dental practice manager who answers the most common patient questions with empathy, clarity, and expertise.",
        user: "Generate 6-8 frequently asked questions and answers about {{serviceName}}. Cover: cost concerns, pain/discomfort, recovery time, candidacy, insurance, and effectiveness."
      },

      aftercareInstructions: {
        system: "You are a dental hygienist providing clear, actionable aftercare instructions that promote healing and prevent complications.",
        user: "Create aftercare instructions for {{serviceName}}. Include immediate care (first 24 hours), short-term care (1-7 days), and long-term maintenance."
      },

      seoContent: {
        system: "You are an SEO specialist creating dental content that ranks well while serving patients.",
        user: "Generate SEO metadata for {{serviceName}} page: 1) Meta title (50-60 chars), 2) Meta description (150-160 chars), 3) 5-8 related keywords."
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
      default:
        throw new Error(`Unsupported provider: ${providerKey}. Only 'google-ai' is supported.`);
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

    const maxRetries = 2;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Google AI attempt ${attempt}/${maxRetries} for content generation...`);

        const response = await axios.post(
          `${provider.apiUrl}/${provider.model}:generateContent?key=${provider.apiKey}`,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 60000
          }
        );

        if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error('Invalid response format from Google AI');
        }

        const content = response.data.candidates[0].content.parts[0].text;
        const tokensUsed = this.estimateTokens(processedPrompt + content);

        // Update rate limiting
        this.updateRateLimit('google-ai');

        console.log(`✅ Google AI succeeded on attempt ${attempt}`);
        return {
          content: content.trim(),
          tokensUsed,
          model: provider.model
        };

      } catch (error) {
        lastError = error;

        // Don't retry for rate limits or quota exceeded
        if (error.response?.status === 429) {
          throw new Error('Google AI rate limit exceeded');
        }

        // Don't retry for authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error('Google AI authentication error');
        }

        // For timeout or network errors, retry if we have attempts left
        if ((error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' ||
             error.message.includes('timeout') || error.message.includes('network')) &&
            attempt < maxRetries) {
          console.log(`⏳ Google AI attempt ${attempt} failed (${error.message}), retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
          continue;
        }

        // For other errors or last attempt, throw immediately
        throw new Error(`Google AI error: ${error.message}`);
      }
    }
  }



  /**
   * Generate dental service content using predefined prompts
   */
  async generateDentalServiceContent(serviceName, contentType, options = {}) {
    const {
      keywords = [],
      category = 'general-dentistry',
      customPrompt = null,
      websiteId = null,
      websiteName = null,
      doctorName = null,
      practiceLocation = null,
      ...generateOptions
    } = options;

    if (!this.dentalPrompts[contentType]) {
      throw new Error(`Unknown dental content type: ${contentType}`);
    }

    const promptTemplate = customPrompt || this.dentalPrompts[contentType];

    // Enhanced variables with website context for unique content generation
    const variables = {
      serviceName,
      keywords: keywords.join(', '),
      category,
      websiteName: websiteName || 'Professional Dental Practice',
      doctorName: doctorName || 'Our Expert Team',
      practiceLocation: practiceLocation || 'our clinic',
      ...options.variables
    };

    // Combine system and user prompts with website-specific context
    let fullPrompt = `${promptTemplate.system}\n\n${promptTemplate.user}`;

    // Add website-specific customization to the prompt for unique content
    if (websiteId || websiteName) {
      const websiteContext = `\n\nIMPORTANT: Generate unique content specifically for "${variables.websiteName}" practice. ` +
                             `Mention "${variables.doctorName}" and customize the content to reflect this specific dental practice's expertise. ` +
                             `Make the content unique and personalized for this practice, not generic. ` +
                             `Reference "${variables.practiceLocation}" when appropriate.`;
      fullPrompt += websiteContext;
    }

    // FIXED: Include website context in cache key for unique content per website
    const cacheKey = websiteId
      ? `dental_${contentType}_${serviceName}_${websiteId}_${JSON.stringify(variables)}`
      : `dental_${contentType}_${serviceName}_generic_${JSON.stringify(variables)}`;

    return await this.generateContent(fullPrompt, {
      ...generateOptions,
      variables,
      cacheKey
    });
  }

  /**
   * Generate comprehensive dental service content based on detailed requirements
   */
  async generateComprehensiveDentalContent(serviceData, options = {}) {
    const { serviceName, category, keywords = [] } = serviceData;
    const results = {};

    try {
      // All 11 comprehensive content sections as per requirements
      const comprehensiveSections = [
        'introduction',           // 1. Introduction (100 words)
        'detailedExplanation',    // 2. What does it entail (500 words, 5 bullet points)
        'treatmentNeed',          // 3. Why undergo treatment (500 words, 5 bullet points)
        'symptoms',               // 4. Symptoms requiring treatment (500 words, 5 bullet points)
        'consequences',           // 5. Consequences if not performed (500 words, 5 bullet points)
        'procedureSteps',         // 6. Procedure steps (500 words, 5 steps)
        'postTreatmentCare',      // 7. Post-treatment care (500 words, 5 bullet points)
        'procedureBenefits',      // 8. Benefits (500 words, 5 bullet points)
        'sideEffects',           // 9. Side effects (500 words, 5 bullet points)
        'mythsAndFacts',         // 10. Myths and facts (500 words, 5 myths/facts)
        'comprehensiveFAQ'       // 11. FAQs (25 questions with 100-word answers)
      ];

      console.log(`Generating comprehensive content for ${serviceName} with ${comprehensiveSections.length} sections`);

      // Generate sections in smaller batches to avoid rate limits
      const batchSize = 3;
      const batches = [];
      for (let i = 0; i < comprehensiveSections.length; i += batchSize) {
        batches.push(comprehensiveSections.slice(i, i + batchSize));
      }

      for (const [batchIndex, batch] of batches.entries()) {
        console.log(`Processing batch ${batchIndex + 1}/${batches.length} for ${serviceName}`);

        // Generate all sections in batch - fail immediately if any section fails
        for (const section of batch) {
          try {
            const result = await this.generateDentalServiceContent(serviceName, section, {
              keywords,
              category,
              maxTokens: section === 'comprehensiveFAQ' ? 3000 : 800, // More tokens for comprehensive FAQ
              temperature: 0.7,
              ...options
            });
            console.log(`✓ Generated ${section} for ${serviceName}`);
            results[section] = result;
          } catch (error) {
            console.error(`✗ Failed to generate ${section} for ${serviceName}:`, error.message);
            // STRICT ERROR HANDLING: Throw immediately when any section fails
            throw new Error(`Content generation failed for section "${section}": ${error.message}`);
          }
        }

        // Add delay between batches to respect rate limits
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const totalTokensUsed = Object.values(results).reduce((sum, r) => sum + (r.tokensUsed || 0), 0);
      const successfulSections = Object.keys(results).filter(key => !results[key].error).length;

      console.log(`Comprehensive content generation completed for ${serviceName}: ${successfulSections}/${comprehensiveSections.length} sections successful, ${totalTokensUsed} tokens used`);

      return {
        success: true,
        content: results,
        generatedAt: new Date(),
        serviceName,
        category,
        keywords,
        sectionsGenerated: successfulSections,
        totalSections: comprehensiveSections.length,
        totalTokensUsed,
        comprehensive: true
      };

    } catch (error) {
      throw new Error(`Failed to generate comprehensive dental content: ${error.message}`);
    }
  }

  /**
   * Generate complete service page content (legacy method for backward compatibility)
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
      'google-ai': 15  // Google AI Studio free tier
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

  /**
   * Generate multiple blogs for a service automatically
   * @param {Object} serviceData - Service information
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Array of generated blogs
   */
  async generateServiceBlogs(serviceData, options = {}) {
    const {
      websiteName = 'Our Practice',
      doctorName = 'Dr. Professional',
      blogCount = 6,
      autoPublish = false,
      ...generateOptions
    } = options;

    const blogTypes = [
      { type: 'comprehensive', title: `Complete Guide to ${serviceData.serviceName}` },
      { type: 'benefits', title: `Benefits of ${serviceData.serviceName}` },
      { type: 'procedure', title: `${serviceData.serviceName} Procedure: What to Expect` },
      { type: 'recovery', title: `Recovery and Aftercare for ${serviceData.serviceName}` },
      { type: 'cost', title: `${serviceData.serviceName} Cost: Investment in Your Health` },
      { type: 'myths', title: `${serviceData.serviceName}: Myths vs Facts` }
    ];

    const results = [];

    try {
      // Generate blogs sequentially to respect rate limits
      for (let i = 0; i < Math.min(blogCount, blogTypes.length); i++) {
        const blogType = blogTypes[i];

        console.log(`🎨 Generating blog ${i + 1}/${blogCount}: ${blogType.type} for ${serviceData.serviceName}`);

        try {
          const blogResult = await this.generateSingleBlogContent(serviceData.serviceName, blogType.type, {
            websiteName,
            doctorName,
            category: serviceData.category,
            keywords: serviceData.keywords || [],
            customTitle: blogType.title,
            ...generateOptions
          });

          if (blogResult.success) {
            results.push({
              type: blogType.type,
              title: blogType.title,
              content: blogResult.content,
              metadata: blogResult.metadata,
              success: true
            });
            console.log(`✅ Blog generated: ${blogType.title}`);
          } else {
            results.push({
              type: blogType.type,
              title: blogType.title,
              success: false,
              error: blogResult.error
            });
            console.log(`❌ Blog generation failed: ${blogType.title}`);
          }
        } catch (error) {
          results.push({
            type: blogType.type,
            title: blogType.title,
            success: false,
            error: error.message
          });
          console.log(`❌ Blog generation error: ${blogType.title} - ${error.message}`);
        }

        // Enhanced delay between blog generations to handle rate limits
        if (i < Math.min(blogCount, blogTypes.length) - 1) {
          console.log('⏳ Waiting 8 seconds before next blog...');
          await new Promise(resolve => setTimeout(resolve, 8000));
        }
      }

      const successfulBlogs = results.filter(r => r.success);
      const totalTokensUsed = successfulBlogs.reduce((sum, r) => sum + (r.metadata?.tokensUsed || 0), 0);

      console.log(`Blog generation completed: ${successfulBlogs.length}/${blogCount} successful, ${totalTokensUsed} tokens used`);

      return {
        success: true,
        blogs: results,
        statistics: {
          total: blogCount,
          successful: successfulBlogs.length,
          failed: results.length - successfulBlogs.length,
          totalTokensUsed
        }
      };

    } catch (error) {
      console.error('Service blogs generation error:', error);
      return {
        success: false,
        error: error.message,
        blogs: results
      };
    }
  }

  /**
   * Generate single blog content following Clove Dental format
   * @param {string} serviceName - Service name
   * @param {string} blogType - Type of blog (comprehensive, benefits, etc.)
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated blog content
   */
  async generateSingleBlogContent(serviceName, blogType, options = {}) {
    const {
      websiteName = 'Our Practice',
      doctorName = 'Dr. Professional',
      category = 'general-dentistry',
      keywords = [],
      customTitle = null,
      ...generateOptions
    } = options;

    try {
      const blogPrompts = this.getBlogPrompts(serviceName, blogType, websiteName, doctorName, category, keywords, customTitle);

      const results = {};

      // Generate each section following Clove Dental structure
      const sections = Object.keys(blogPrompts);

      for (const [index, sectionKey] of sections.entries()) {
        console.log(`Generating ${sectionKey} for ${serviceName} blog (${blogType})`);

        let retryCount = 0;
        let maxRetries = 2;
        let sectionGenerated = false;

        while (!sectionGenerated && retryCount < maxRetries) {
          try {
            const result = await this.generateContent(blogPrompts[sectionKey], {
              maxTokens: sectionKey === 'faq' ? 2000 : 800,
              temperature: 0.7,
              ...generateOptions
            });

            if (result.content) {
              results[sectionKey] = {
                content: result.content,
                tokensUsed: result.tokensUsed || 0
              };
              sectionGenerated = true;
            }
          } catch (error) {
            retryCount++;
            console.error(`Failed to generate ${sectionKey} (attempt ${retryCount}):`, error.message);

            // If rate limited, wait longer before retry
            if (error.message.includes('rate limit') && retryCount < maxRetries) {
              console.log(`⏳ Rate limit hit, waiting 15 seconds before retry...`);
              await new Promise(resolve => setTimeout(resolve, 15000));
            } else {
              results[sectionKey] = { error: error.message };
              break;
            }
          }
        }

        // Enhanced delay between sections to prevent rate limits
        if (index < sections.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 4000));
        }
      }

      // Structure the blog content
      const blogContent = this.structureBlogContent(results, serviceName, blogType);
      const totalTokensUsed = Object.values(results).reduce((sum, r) => sum + (r.tokensUsed || 0), 0);

      return {
        success: true,
        content: blogContent,
        metadata: {
          type: blogType,
          tokensUsed: totalTokensUsed,
          sectionsGenerated: Object.keys(results).filter(k => !results[k].error).length,
          totalSections: sections.length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get blog prompts based on Clove Dental format analysis
   * @param {string} serviceName - Service name
   * @param {string} blogType - Blog type
   * @param {string} websiteName - Website name
   * @param {string} doctorName - Doctor name
   * @param {string} category - Service category
   * @param {Array} keywords - SEO keywords
   * @param {string} customTitle - Custom blog title
   * @returns {Object} Blog section prompts
   */
  getBlogPrompts(serviceName, blogType, websiteName, doctorName, category, keywords, customTitle) {
    const keywordString = keywords.join(', ');

    const basePrompts = {
      // 1. Introduction - Hook addressing patient anxieties
      introduction: `Write an engaging blog introduction for "${serviceName}" following Clove Dental's style.

      Start with a rhetorical question that mirrors patient fears (e.g., "Does ${serviceName} hurt?").
      Acknowledge legitimate concerns, then provide immediate reassurance.
      Use conversational yet authoritative tone.
      Include ${websiteName} and ${doctorName} naturally.
      End with a preview of what the article will cover.
      Target: 300-400 words.
      Keywords: ${keywordString}`,

      // 2. What is this treatment? - Educational foundation
      whatIsIt: `Explain "${serviceName}" in simple, patient-friendly terms following Clove Dental's educational approach.

      Cover:
      - Basic definition in non-technical language
      - When and why it's recommended
      - How it differs from similar treatments
      - Modern techniques used at ${websiteName}

      Use affirming language and avoid dental jargon.
      Target: 400-500 words.`,

      // 3. Why need this treatment? - Problem-solution framework
      whyNeedIt: `Explain why patients need "${serviceName}" using Clove Dental's problem-solution approach.

      Structure:
      - Common dental problems that require this treatment
      - How these problems develop and progress
      - Why early intervention matters
      - What ${doctorName} looks for during evaluation

      Use empathetic tone addressing patient concerns.
      Target: 400-500 words.`,

      // 4. Signs and symptoms - Recognition and validation
      signsSymptoms: `Describe signs and symptoms indicating need for "${serviceName}" following Clove Dental's validation approach.

      Cover:
      - Early warning signs patients notice
      - Progressive symptoms that worsen over time
      - When symptoms require immediate attention
      - How ${websiteName} evaluates these symptoms

      Validate patient experiences and encourage seeking help.
      Target: 400-500 words.`,

      // 5. Consequences of delay - Motivational urgency
      consequencesDelay: `Explain consequences of delaying "${serviceName}" using Clove Dental's motivational approach.

      Address:
      - How problems worsen without treatment
      - Increased complexity and cost over time
      - Impact on overall oral health
      - Quality of life effects
      - Why ${doctorName} recommends timely treatment

      Balance urgency with reassurance.
      Target: 300-400 words.`,

      // 6. Treatment process - Procedural transparency
      treatmentProcess: `Describe the "${serviceName}" procedure following Clove Dental's transparency approach.

      Break down:
      - Pre-treatment consultation at ${websiteName}
      - Step-by-step procedure explanation
      - Modern techniques and technology used
      - Comfort measures and pain management
      - What patients experience during treatment

      Emphasize ${doctorName}'s expertise and patient care.
      Target: 500-600 words.`,

      // 7. Benefits - Positive outcomes focus
      benefits: `Highlight benefits of "${serviceName}" using Clove Dental's positive outcomes approach.

      Cover:
      - Immediate improvements patients notice
      - Long-term oral health benefits
      - Functional improvements (eating, speaking)
      - Aesthetic enhancements
      - Quality of life improvements
      - Success stories from ${websiteName}

      Use affirmative, encouraging language.
      Target: 400-500 words.`,

      // 8. Recovery and aftercare - Practical guidance
      recoveryAftercare: `Provide recovery and aftercare guidance for "${serviceName}" following Clove Dental's practical approach.

      Include:
      - What to expect immediately after treatment
      - Day-by-day recovery timeline
      - Pain management strategies
      - Diet and activity guidelines
      - Oral hygiene modifications
      - When to contact ${doctorName}

      Be specific and actionable.
      Target: 400-500 words.`,

      // 9. Myths vs facts - Misconception correction
      mythsFacts: `Address common myths about "${serviceName}" following Clove Dental's myth-busting approach.

      Format as Myth vs. Fact pairs:
      - 5-6 common misconceptions patients have
      - Clear, factual corrections for each myth
      - Why these myths persist
      - What modern ${serviceName} actually involves at ${websiteName}

      Use "Myth:" and "Fact:" format for clarity.
      Target: 500-600 words.`,

      // 10. Cost considerations - Value-focused discussion
      costConsiderations: `Discuss cost considerations for "${serviceName}" following Clove Dental's value approach.

      Address:
      - Factors that affect treatment cost
      - Value of investing in oral health
      - Comparison with cost of not treating
      - Insurance and payment options at ${websiteName}
      - Why quality care is worth the investment

      Focus on value rather than specific prices.
      Target: 300-400 words.`,

      // 11. FAQ - Patient-focused Q&A
      faq: `Create a comprehensive FAQ section for "${serviceName}" following Clove Dental's patient-focused approach.

      Generate 15-20 questions covering:
      - Procedure details and experience
      - Pain and discomfort concerns
      - Recovery and healing
      - Cost and insurance
      - Results and expectations
      - Comparison with alternatives

      Questions should mirror actual patient searches.
      Answers should be 50-100 words each, empathetic and informative.
      Include ${websiteName} and ${doctorName} references naturally.`
    };

    // Customize prompts based on blog type
    if (blogType === 'benefits') {
      // Focus more on benefits and outcomes
      return {
        introduction: basePrompts.introduction.replace('Start with a rhetorical question', 'Start with the positive outcomes patients achieve'),
        benefits: basePrompts.benefits,
        whatIsIt: basePrompts.whatIsIt,
        treatmentProcess: basePrompts.treatmentProcess,
        recoveryAftercare: basePrompts.recoveryAftercare,
        faq: basePrompts.faq
      };
    } else if (blogType === 'procedure') {
      // Focus on procedure details
      return {
        introduction: basePrompts.introduction,
        whatIsIt: basePrompts.whatIsIt,
        treatmentProcess: basePrompts.treatmentProcess,
        recoveryAftercare: basePrompts.recoveryAftercare,
        mythsFacts: basePrompts.mythsFacts,
        faq: basePrompts.faq
      };
    } else if (blogType === 'recovery') {
      // Focus on recovery and aftercare
      return {
        introduction: basePrompts.introduction,
        treatmentProcess: basePrompts.treatmentProcess,
        recoveryAftercare: basePrompts.recoveryAftercare,
        benefits: basePrompts.benefits,
        faq: basePrompts.faq
      };
    } else if (blogType === 'cost') {
      // Focus on value and investment
      return {
        introduction: basePrompts.introduction,
        benefits: basePrompts.benefits,
        costConsiderations: basePrompts.costConsiderations,
        consequencesDelay: basePrompts.consequencesDelay,
        faq: basePrompts.faq
      };
    } else if (blogType === 'myths') {
      // Focus on myth-busting
      return {
        introduction: basePrompts.introduction,
        mythsFacts: basePrompts.mythsFacts,
        whatIsIt: basePrompts.whatIsIt,
        benefits: basePrompts.benefits,
        faq: basePrompts.faq
      };
    } else {
      // Comprehensive - all sections
      return basePrompts;
    }
  }

  /**
   * Structure blog content into final format
   * @param {Object} results - Generated section results
   * @param {string} serviceName - Service name
   * @param {string} blogType - Blog type
   * @returns {Object} Structured blog content
   */
  structureBlogContent(results, serviceName, blogType) {
    const content = {
      introduction: results.introduction?.content || `Complete guide to ${serviceName}`,
      sections: [],
      faq: [],
      keyTakeaways: []
    };

    // Map sections to blog structure
    const sectionMapping = {
      whatIsIt: { title: `What is ${serviceName}?`, level: 2 },
      whyNeedIt: { title: `Why Do You Need ${serviceName}?`, level: 2 },
      signsSymptoms: { title: 'Signs and Symptoms', level: 2 },
      consequencesDelay: { title: 'What Happens If Treatment Is Delayed?', level: 2 },
      treatmentProcess: { title: `${serviceName} Procedure: Step by Step`, level: 2 },
      benefits: { title: `Benefits of ${serviceName}`, level: 2 },
      recoveryAftercare: { title: 'Recovery and Aftercare', level: 2 },
      mythsFacts: { title: `${serviceName}: Myths vs Facts`, level: 2 },
      costConsiderations: { title: 'Cost Considerations', level: 2 }
    };

    // Add main content sections
    Object.keys(sectionMapping).forEach(key => {
      if (results[key] && results[key].content) {
        const mapping = sectionMapping[key];
        content.sections.push({
          heading: mapping.title,
          content: results[key].content,
          level: mapping.level,
          anchor: key.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()
        });
      }
    });

    // Process FAQ section
    if (results.faq && results.faq.content) {
      const faqContent = results.faq.content;
      content.faq = this.parseFAQContent(faqContent);
    }

    // Generate key takeaways
    content.keyTakeaways = [
      `${serviceName} is a safe and effective treatment when performed by qualified professionals`,
      'Modern techniques significantly reduce discomfort and improve outcomes',
      'Early treatment prevents more complex problems and reduces overall costs',
      'Proper aftercare ensures optimal healing and long-term success',
      'Regular dental checkups help identify issues before they become serious'
    ];

    return content;
  }

  // Parse FAQ content for blog generation
  parseFAQContent(content, maxQuestions = 10) {
    if (!content || typeof content !== 'string') {
      return [];
    }

    const questions = [];

    // Look for Q1: A1: or Q: A: patterns (numbered or unnumbered)
    const qaPatterns = [
      // First try numbered format: Q1: ... A1:
      /Q(\d+):\s*([^\n]+(?:\n(?!A\d+:)[^\n]*)*)\s*A\1:\s*([^\n]+(?:\n(?!Q\d+:)[^\n]*)*)/g,
      // Then try simple format: Q: ... A:
      /Q:\s*([^\n]+(?:\n(?!A:)[^\n]*)*)\s*A:\s*([^\n]+(?:\n(?!Q:)[^\n]*)*)/g
    ];

    let foundQuestions = false;

    for (const pattern of qaPatterns) {
      pattern.lastIndex = 0; // Reset regex
      let match;

      while ((match = pattern.exec(content)) && questions.length < maxQuestions) {
        foundQuestions = true;
        let questionText, answerText;

        if (pattern.source.includes('\\d+')) {
          // Numbered format: match[1] = number, match[2] = question, match[3] = answer
          questionText = match[2];
          answerText = match[3];
        } else {
          // Simple format: match[1] = question, match[2] = answer
          questionText = match[1];
          answerText = match[2];
        }

        const question = questionText.trim().replace(/\n/g, ' ').substring(0, 200);
        const answer = answerText.trim().replace(/\n/g, ' ').substring(0, 800);

        if (question && answer && question.length > 10 && answer.length > 20) {
          questions.push({
            question: question,
            answer: answer,
            order: questions.length
          });
        }
      }

      // If we found questions with this pattern, stop trying other patterns
      if (foundQuestions && questions.length > 0) {
        break;
      }
    }

    return questions.slice(0, maxQuestions);
  }
}

// Export singleton instance
const llmService = new LLMService();
module.exports = llmService;