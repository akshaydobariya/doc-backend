const UnifiedContent = require('../models/UnifiedContent');
const ServicePage = require('../models/ServicePage');

/**
 * Content Transformation Service
 *
 * Handles bidirectional transformation between:
 * 1. AI-generated structured content (ServicePage format)
 * 2. Visual components (Destack format)
 * 3. Unified content model
 */

class ContentTransformationService {
  /**
   * Transform ServicePage content to UnifiedContent
   */
  static async transformServicePageToUnified(servicePageId) {
    try {
      const servicePage = await ServicePage.findById(servicePageId);
      if (!servicePage) {
        throw new Error('ServicePage not found');
      }

      // Check if UnifiedContent already exists
      let unifiedContent = await UnifiedContent.findOne({ servicePageId });

      if (!unifiedContent) {
        // Create new unified content
        unifiedContent = new UnifiedContent({
          servicePageId: servicePage._id,
          websiteId: servicePage.websiteId,
          doctorId: servicePage.doctorId,
          structuredContent: servicePage.content,
          components: [],
          contentStructure: this.initializeContentStructure()
        });
      } else {
        // Update existing unified content
        unifiedContent.structuredContent = servicePage.content;
      }

      // Generate visual components from structured content
      const components = this.generateComponentsFromStructuredContent(servicePage.content);
      unifiedContent.components = components;

      // Update content structure mapping
      unifiedContent.contentStructure = this.mapContentToStructure(servicePage.content, components);

      // Create version snapshot
      unifiedContent.createVersionSnapshot(
        'ai_generation',
        'Transformed from ServicePage content',
        servicePage.lastModifiedBy
      );

      await unifiedContent.save();

      return unifiedContent;
    } catch (error) {
      console.error('Error transforming ServicePage to Unified:', error);
      throw error;
    }
  }

  /**
   * Transform Destack components to UnifiedContent
   */
  static async transformDestackToUnified(servicePageId, destackData) {
    try {
      let unifiedContent = await UnifiedContent.findOne({ servicePageId });

      if (!unifiedContent) {
        const servicePage = await ServicePage.findById(servicePageId);
        if (!servicePage) {
          throw new Error('ServicePage not found');
        }

        unifiedContent = new UnifiedContent({
          servicePageId: servicePage._id,
          websiteId: servicePage.websiteId,
          doctorId: servicePage.doctorId,
          structuredContent: servicePage.content || {},
          components: [],
          contentStructure: this.initializeContentStructure()
        });
      }

      // Convert Destack format to unified components
      const components = this.convertDestackToComponents(destackData);
      unifiedContent.components = components;

      // Update structured content from components
      const structuredContent = this.generateStructuredContentFromComponents(components);
      unifiedContent.structuredContent = { ...unifiedContent.structuredContent, ...structuredContent };

      // Update content structure mapping
      unifiedContent.contentStructure = this.mapContentToStructure(unifiedContent.structuredContent, components);

      // Create version snapshot
      unifiedContent.createVersionSnapshot(
        'visual_edit',
        'Updated from visual editor',
        unifiedContent.doctorId
      );

      await unifiedContent.save();

      return unifiedContent;
    } catch (error) {
      console.error('Error transforming Destack to Unified:', error);
      throw error;
    }
  }

  /**
   * Sync unified content back to ServicePage
   */
  static async syncToServicePage(unifiedContentId) {
    try {
      const unifiedContent = await UnifiedContent.findById(unifiedContentId);
      if (!unifiedContent) {
        throw new Error('UnifiedContent not found');
      }

      const servicePage = await ServicePage.findById(unifiedContent.servicePageId);
      if (!servicePage) {
        throw new Error('ServicePage not found');
      }

      // Update ServicePage content with structured content
      servicePage.content = unifiedContent.structuredContent;
      servicePage.lastModified = new Date();
      servicePage.lastModifiedBy = unifiedContent.doctorId;

      // Update editing mode based on unified content context
      servicePage.editingMode = unifiedContent.editingContext.mode;

      await servicePage.save();

      // Update sync status
      unifiedContent.syncStatus.visualToContent.lastSync = new Date();
      unifiedContent.syncStatus.visualToContent.status = 'synced';
      await unifiedContent.save();

      return servicePage;
    } catch (error) {
      console.error('Error syncing to ServicePage:', error);
      throw error;
    }
  }

  /**
   * Generate visual components from structured content
   */
  static generateComponentsFromStructuredContent(structuredContent) {
    const components = [];
    let order = 0;

    // Hero section
    if (structuredContent.hero) {
      components.push(this.createComponent('ServiceHero', structuredContent.hero, {
        section: 'hero',
        order: order++
      }));
    }

    // Overview section
    if (structuredContent.overview) {
      components.push(this.createComponent('ServiceOverview', structuredContent.overview, {
        section: 'overview',
        order: order++
      }));
    }

    // Benefits section
    if (structuredContent.benefits && structuredContent.benefits.list?.length > 0) {
      components.push(this.createComponent('ServiceBenefits', structuredContent.benefits, {
        section: 'benefits',
        order: order++
      }));
    }

    // Procedure section
    if (structuredContent.procedure && structuredContent.procedure.steps?.length > 0) {
      components.push(this.createComponent('ServiceProcedure', structuredContent.procedure, {
        section: 'procedure',
        order: order++
      }));
    }

    // FAQ section
    if (structuredContent.faq && structuredContent.faq.questions?.length > 0) {
      components.push(this.createComponent('ServiceFAQ', structuredContent.faq, {
        section: 'faq',
        order: order++
      }));
    }

    // Pricing section
    if (structuredContent.pricing && structuredContent.pricing.showPricing) {
      components.push(this.createComponent('ServicePricing', structuredContent.pricing, {
        section: 'pricing',
        order: order++
      }));
    }

    // Before/After section
    if (structuredContent.beforeAfter && structuredContent.beforeAfter.showSection) {
      components.push(this.createComponent('ServiceBeforeAfter', structuredContent.beforeAfter, {
        section: 'beforeAfter',
        order: order++
      }));
    }

    // Aftercare section
    if (structuredContent.aftercare && structuredContent.aftercare.showSection) {
      components.push(this.createComponent('ServiceAftercareInstructions', structuredContent.aftercare, {
        section: 'aftercare',
        order: order++
      }));
    }

    // CTA section
    if (structuredContent.cta) {
      components.push(this.createComponent('ServiceCTA', structuredContent.cta, {
        section: 'cta',
        order: order++
      }));
    }

    // Custom sections
    if (structuredContent.customSections) {
      structuredContent.customSections.forEach((customSection, index) => {
        components.push(this.createComponent('Container', {
          title: customSection.title,
          content: customSection.content,
          showSection: customSection.showSection
        }, {
          section: 'custom',
          order: customSection.order || order++,
          customId: customSection.id
        }));
      });
    }

    return components.sort((a, b) => a.layout.order - b.layout.order);
  }

  /**
   * Create a component with proper structure
   */
  static createComponent(type, contentData, options = {}) {
    const componentId = `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: componentId,
      type,
      props: this.mapContentToProps(type, contentData),
      children: [],
      layout: {
        order: options.order || 0,
        grid: {
          columns: 12,
          span: 12
        },
        responsive: {
          mobile: { hidden: false, span: 12 },
          tablet: { hidden: false, span: 12 },
          desktop: { hidden: false, span: 12 }
        }
      },
      styling: {
        className: this.getDefaultClassName(type),
        customCSS: '',
        theme: {
          primary: '#2563eb',
          secondary: '#64748b',
          accent: '#10b981'
        }
      },
      contentBinding: {
        section: options.section,
        field: options.field,
        subfield: options.subfield,
        index: options.index
      },
      aiSuggestions: [],
      isVisible: contentData.showSection !== false,
      isLocked: false,
      isAIGenerated: true,
      lastModified: new Date(),
      lastModifiedBy: 'ai'
    };
  }

  /**
   * Map structured content to component props
   */
  static mapContentToProps(componentType, contentData) {
    const mappings = {
      ServiceHero: {
        title: contentData.title || '',
        subtitle: contentData.subtitle || '',
        description: contentData.description || '',
        ctaText: contentData.ctaText || 'Book Appointment',
        backgroundImage: contentData.backgroundImage || ''
      },
      ServiceOverview: {
        title: contentData.title || 'Overview',
        content: contentData.content || '',
        highlights: contentData.highlights || []
      },
      ServiceBenefits: {
        title: contentData.title || 'Benefits',
        introduction: contentData.introduction || '',
        benefits: contentData.list || []
      },
      ServiceProcedure: {
        title: contentData.title || 'The Procedure',
        introduction: contentData.introduction || '',
        steps: contentData.steps || [],
        additionalInfo: contentData.additionalInfo || ''
      },
      ServiceFAQ: {
        title: contentData.title || 'Frequently Asked Questions',
        introduction: contentData.introduction || '',
        questions: contentData.questions || []
      },
      ServicePricing: {
        title: contentData.title || 'Pricing',
        introduction: contentData.introduction || '',
        plans: contentData.plans || [],
        disclaimer: contentData.disclaimer || '',
        showPricing: contentData.showPricing || false
      },
      ServiceBeforeAfter: {
        title: contentData.title || 'Before & After',
        introduction: contentData.introduction || '',
        gallery: contentData.gallery || [],
        showSection: contentData.showSection || false
      },
      ServiceAftercareInstructions: {
        title: contentData.title || 'Recovery & Aftercare',
        introduction: contentData.introduction || '',
        instructions: contentData.instructions || [],
        warnings: contentData.warnings || [],
        showSection: contentData.showSection !== false
      },
      ServiceCTA: {
        title: contentData.title || 'Ready to Schedule Your Appointment?',
        subtitle: contentData.subtitle || '',
        buttonText: contentData.buttonText || 'Book Now',
        phoneNumber: contentData.phoneNumber || '',
        email: contentData.email || '',
        backgroundColor: contentData.backgroundColor || '#2563eb'
      },
      Container: {
        title: contentData.title || '',
        content: contentData.content || '',
        showSection: contentData.showSection !== false
      }
    };

    return mappings[componentType] || contentData;
  }

  /**
   * Convert Destack format to unified components
   */
  static convertDestackToComponents(destackData) {
    const components = [];

    if (destackData && destackData.children) {
      this.traverseDestackChildren(destackData.children, components);
    }

    return components;
  }

  /**
   * Recursively traverse Destack children and convert to components
   */
  static traverseDestackChildren(children, components, parentOrder = 0) {
    if (!Array.isArray(children)) return;

    children.forEach((child, index) => {
      if (child.type && child.type.startsWith('Service')) {
        const component = {
          id: child.id || `${child.type.toLowerCase()}-${Date.now()}-${index}`,
          type: child.type,
          props: child.props || {},
          children: child.children || [],
          layout: {
            order: parentOrder + index,
            grid: { columns: 12, span: 12 },
            responsive: {
              mobile: { hidden: false, span: 12 },
              tablet: { hidden: false, span: 12 },
              desktop: { hidden: false, span: 12 }
            }
          },
          styling: {
            className: '',
            customCSS: '',
            theme: { primary: '#2563eb', secondary: '#64748b', accent: '#10b981' }
          },
          contentBinding: this.inferContentBinding(child.type, child.props),
          aiSuggestions: [],
          isVisible: true,
          isLocked: false,
          isAIGenerated: false,
          lastModified: new Date(),
          lastModifiedBy: 'user'
        };

        components.push(component);
      }

      // Recursively process children
      if (child.children) {
        this.traverseDestackChildren(child.children, components, (parentOrder + index + 1) * 10);
      }
    });
  }

  /**
   * Infer content binding from component type and props
   */
  static inferContentBinding(componentType, props) {
    const bindings = {
      ServiceHero: { section: 'hero' },
      ServiceOverview: { section: 'overview' },
      ServiceBenefits: { section: 'benefits' },
      ServiceProcedure: { section: 'procedure' },
      ServiceFAQ: { section: 'faq' },
      ServicePricing: { section: 'pricing' },
      ServiceBeforeAfter: { section: 'beforeAfter' },
      ServiceAftercareInstructions: { section: 'aftercare' },
      ServiceCTA: { section: 'cta' }
    };

    return bindings[componentType] || { section: 'custom' };
  }

  /**
   * Generate structured content from components
   */
  static generateStructuredContentFromComponents(components) {
    const structuredContent = {};

    components.forEach(component => {
      const binding = component.contentBinding;
      if (binding && binding.section) {
        const section = binding.section;

        if (!structuredContent[section]) {
          structuredContent[section] = {};
        }

        // Map component props back to structured content
        const contentData = this.mapPropsToContent(component.type, component.props);
        Object.assign(structuredContent[section], contentData);
      }
    });

    return structuredContent;
  }

  /**
   * Map component props back to structured content format
   */
  static mapPropsToContent(componentType, props) {
    const mappings = {
      ServiceHero: {
        title: props.title,
        subtitle: props.subtitle,
        description: props.description,
        ctaText: props.ctaText,
        backgroundImage: props.backgroundImage
      },
      ServiceOverview: {
        title: props.title,
        content: props.content,
        highlights: props.highlights
      },
      ServiceBenefits: {
        title: props.title,
        introduction: props.introduction,
        list: props.benefits
      },
      ServiceProcedure: {
        title: props.title,
        introduction: props.introduction,
        steps: props.steps,
        additionalInfo: props.additionalInfo
      },
      ServiceFAQ: {
        title: props.title,
        introduction: props.introduction,
        questions: props.questions
      },
      ServicePricing: {
        title: props.title,
        introduction: props.introduction,
        plans: props.plans,
        disclaimer: props.disclaimer,
        showPricing: props.showPricing
      },
      ServiceBeforeAfter: {
        title: props.title,
        introduction: props.introduction,
        gallery: props.gallery,
        showSection: props.showSection
      },
      ServiceAftercareInstructions: {
        title: props.title,
        introduction: props.introduction,
        instructions: props.instructions,
        warnings: props.warnings,
        showSection: props.showSection
      },
      ServiceCTA: {
        title: props.title,
        subtitle: props.subtitle,
        buttonText: props.buttonText,
        phoneNumber: props.phoneNumber,
        email: props.email,
        backgroundColor: props.backgroundColor
      }
    };

    return mappings[componentType] || props;
  }

  /**
   * Initialize content structure mapping
   */
  static initializeContentStructure() {
    const sections = ['hero', 'overview', 'benefits', 'procedure', 'faq', 'pricing', 'beforeAfter', 'aftercare', 'cta', 'custom'];
    const structure = {};

    sections.forEach(section => {
      structure[section] = {
        componentIds: [],
        lastSync: new Date()
      };
    });

    return structure;
  }

  /**
   * Map content to structure with component IDs
   */
  static mapContentToStructure(structuredContent, components) {
    const structure = this.initializeContentStructure();

    components.forEach(component => {
      const binding = component.contentBinding;
      if (binding && binding.section && structure[binding.section]) {
        structure[binding.section].componentIds.push(component.id);
        structure[binding.section].lastSync = new Date();
      }
    });

    return structure;
  }

  /**
   * Get default CSS class for component type
   */
  static getDefaultClassName(componentType) {
    const classNames = {
      ServiceHero: 'service-hero-section',
      ServiceOverview: 'service-overview-section',
      ServiceBenefits: 'service-benefits-section',
      ServiceProcedure: 'service-procedure-section',
      ServiceFAQ: 'service-faq-section',
      ServicePricing: 'service-pricing-section',
      ServiceBeforeAfter: 'service-before-after-section',
      ServiceAftercareInstructions: 'service-aftercare-section',
      ServiceCTA: 'service-cta-section',
      Container: 'custom-content-section'
    };

    return classNames[componentType] || 'component-section';
  }

  /**
   * Detect conflicts between content and visual changes
   */
  static async detectConflicts(unifiedContentId) {
    try {
      const unifiedContent = await UnifiedContent.findById(unifiedContentId);
      if (!unifiedContent) {
        throw new Error('UnifiedContent not found');
      }

      const conflicts = [];

      // Check for content-to-visual conflicts
      Object.keys(unifiedContent.contentStructure).forEach(section => {
        const componentIds = unifiedContent.contentStructure[section].componentIds;
        const sectionContent = unifiedContent.structuredContent[section];

        componentIds.forEach(componentId => {
          const component = unifiedContent.components.find(c => c.id === componentId);
          if (component && sectionContent) {
            const expectedProps = this.mapContentToProps(component.type, sectionContent);
            const differences = this.compareObjects(expectedProps, component.props);

            if (differences.length > 0) {
              conflicts.push({
                type: 'content_to_visual',
                componentId,
                section,
                differences
              });
            }
          }
        });
      });

      return conflicts;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      throw error;
    }
  }

  /**
   * Compare two objects and return differences
   */
  static compareObjects(obj1, obj2, path = '') {
    const differences = [];

    Object.keys(obj1).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;

      if (!(key in obj2)) {
        differences.push({
          field: currentPath,
          contentValue: obj1[key],
          visualValue: undefined,
          type: 'missing_in_visual'
        });
      } else if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
        differences.push(...this.compareObjects(obj1[key], obj2[key], currentPath));
      } else if (obj1[key] !== obj2[key]) {
        differences.push({
          field: currentPath,
          contentValue: obj1[key],
          visualValue: obj2[key],
          type: 'value_mismatch'
        });
      }
    });

    Object.keys(obj2).forEach(key => {
      if (!(key in obj1)) {
        const currentPath = path ? `${path}.${key}` : key;
        differences.push({
          field: currentPath,
          contentValue: undefined,
          visualValue: obj2[key],
          type: 'missing_in_content'
        });
      }
    });

    return differences;
  }

  /**
   * Resolve conflicts by applying resolution strategy
   */
  static async resolveConflicts(unifiedContentId, resolutions) {
    try {
      const unifiedContent = await UnifiedContent.findById(unifiedContentId);
      if (!unifiedContent) {
        throw new Error('UnifiedContent not found');
      }

      resolutions.forEach(resolution => {
        const { conflictId, strategy, field, componentId } = resolution;

        switch (strategy) {
          case 'use_content':
            this.applyContentToVisual(unifiedContent, componentId, field);
            break;
          case 'use_visual':
            this.applyVisualToContent(unifiedContent, componentId, field);
            break;
          case 'merge':
            this.mergeConflict(unifiedContent, componentId, field, resolution.mergeData);
            break;
        }
      });

      // Update sync status
      unifiedContent.syncStatus.lastFullSync = new Date();
      unifiedContent.syncStatus.contentToVisual.status = 'synced';
      unifiedContent.syncStatus.visualToContent.status = 'synced';

      await unifiedContent.save();

      return unifiedContent;
    } catch (error) {
      console.error('Error resolving conflicts:', error);
      throw error;
    }
  }

  /**
   * Apply content value to visual component
   */
  static applyContentToVisual(unifiedContent, componentId, field) {
    const component = unifiedContent.components.find(c => c.id === componentId);
    if (component && component.contentBinding) {
      const section = component.contentBinding.section;
      const sectionContent = unifiedContent.structuredContent[section];

      if (sectionContent) {
        const expectedProps = this.mapContentToProps(component.type, sectionContent);
        if (field) {
          component.props[field] = expectedProps[field];
        } else {
          component.props = { ...component.props, ...expectedProps };
        }
        component.lastModified = new Date();
        component.lastModifiedBy = 'system';
      }
    }
  }

  /**
   * Apply visual component value to content
   */
  static applyVisualToContent(unifiedContent, componentId, field) {
    const component = unifiedContent.components.find(c => c.id === componentId);
    if (component && component.contentBinding) {
      const section = component.contentBinding.section;

      if (!unifiedContent.structuredContent[section]) {
        unifiedContent.structuredContent[section] = {};
      }

      const contentData = this.mapPropsToContent(component.type, component.props);
      if (field) {
        unifiedContent.structuredContent[section][field] = contentData[field];
      } else {
        Object.assign(unifiedContent.structuredContent[section], contentData);
      }
    }
  }

  /**
   * Merge conflicting values
   */
  static mergeConflict(unifiedContent, componentId, field, mergeData) {
    const component = unifiedContent.components.find(c => c.id === componentId);
    if (component && mergeData) {
      // Apply merged value to both component and content
      component.props[field] = mergeData.mergedValue;

      if (component.contentBinding) {
        const section = component.contentBinding.section;
        if (!unifiedContent.structuredContent[section]) {
          unifiedContent.structuredContent[section] = {};
        }
        unifiedContent.structuredContent[section][field] = mergeData.mergedValue;
      }

      component.lastModified = new Date();
      component.lastModifiedBy = 'system';
    }
  }
}

module.exports = ContentTransformationService;