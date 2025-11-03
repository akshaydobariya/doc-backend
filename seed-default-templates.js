/**
 * Seed Default System Templates
 * This replaces the hardcoded templates in the LLM service with database-driven templates
 */

const mongoose = require('mongoose');
const ContentTemplate = require('./src/models/ContentTemplate');

async function seedDefaultTemplates() {
  try {
    console.log('🌱 Seeding default system templates...');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-appointment', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Default template configurations
    const defaultTemplates = [
      {
        name: 'General Dentistry Content Template',
        description: 'Standard template for general dental treatments',
        type: 'prompt',
        category: 'general-dentistry',
        isSystemTemplate: true,
        template: {
          prompt: {
            systemPrompt: 'You are a professional dental content writer. Generate comprehensive, accurate, and patient-friendly content for dental services.',
            userPromptTemplate: 'Create {{contentType}} content for {{serviceName}} service. The content should be professional, informative, and patient-focused.',
            expectedOutput: 'text',
            variables: [
              { name: 'serviceName', description: 'Name of the dental service', type: 'string', required: true },
              { name: 'contentType', description: 'Type of content (overview, benefits, procedures)', type: 'string', required: true },
              { name: 'category', description: 'Service category', type: 'string', required: false }
            ]
          }
        },
        variables: [
          { name: 'serviceName', description: 'Name of the dental service', type: 'text', required: true },
          { name: 'contentType', description: 'Type of content to generate', type: 'text', required: true },
          { name: 'category', description: 'Service category', type: 'text', required: false }
        ],
        llmSettings: {
          provider: 'google-ai',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: 'You are a professional dental content writer specializing in patient education and service descriptions.',
          userPromptTemplate: 'Generate {{contentType}} content for the dental service "{{serviceName}}". Focus on patient benefits, professional expertise, and clear explanations. The content should be informative yet accessible to patients.'
        }
      },

      {
        name: 'Cosmetic Dentistry Content Template',
        description: 'Specialized template for cosmetic dental procedures',
        type: 'prompt',
        category: 'cosmetic-dentistry',
        isSystemTemplate: true,
        template: {
          prompt: {
            systemPrompt: 'You are a cosmetic dental content specialist. Focus on aesthetic outcomes, confidence building, and modern techniques.',
            userPromptTemplate: 'Create {{contentType}} content for {{serviceName}}, emphasizing aesthetic benefits, confidence enhancement, and modern cosmetic techniques.',
            expectedOutput: 'text',
            variables: [
              { name: 'serviceName', description: 'Name of the cosmetic service', type: 'string', required: true },
              { name: 'contentType', description: 'Type of content (overview, benefits, procedures)', type: 'string', required: true }
            ]
          }
        },
        variables: [
          { name: 'serviceName', description: 'Name of the cosmetic service', type: 'text', required: true },
          { name: 'contentType', description: 'Type of content to generate', type: 'text', required: true }
        ],
        llmSettings: {
          provider: 'google-ai',
          temperature: 0.8,
          maxTokens: 1200,
          systemPrompt: 'You are a cosmetic dentistry content expert. Emphasize aesthetic transformation, confidence building, and advanced cosmetic techniques.',
          userPromptTemplate: 'Generate {{contentType}} content for "{{serviceName}}" cosmetic dental service. Highlight aesthetic improvements, confidence enhancement, natural-looking results, and modern cosmetic dentistry techniques.'
        }
      },

      {
        name: 'Oral Surgery Content Template',
        description: 'Specialized template for oral surgery procedures',
        type: 'prompt',
        category: 'oral-surgery',
        isSystemTemplate: true,
        template: {
          prompt: {
            systemPrompt: 'You are an oral surgery content specialist. Focus on surgical expertise, patient comfort, and safety protocols.',
            userPromptTemplate: 'Create {{contentType}} content for {{serviceName}}, emphasizing surgical expertise, patient comfort, safety measures, and recovery outcomes.',
            expectedOutput: 'text',
            variables: [
              { name: 'serviceName', description: 'Name of the surgical procedure', type: 'string', required: true },
              { name: 'contentType', description: 'Type of content (overview, benefits, procedures)', type: 'string', required: true }
            ]
          }
        },
        variables: [
          { name: 'serviceName', description: 'Name of the surgical procedure', type: 'text', required: true },
          { name: 'contentType', description: 'Type of content to generate', type: 'text', required: true }
        ],
        llmSettings: {
          provider: 'google-ai',
          temperature: 0.6,
          maxTokens: 1000,
          systemPrompt: 'You are an oral surgery content specialist. Focus on surgical precision, patient safety, comfort measures, and professional expertise.',
          userPromptTemplate: 'Generate {{contentType}} content for "{{serviceName}}" oral surgery procedure. Emphasize surgical expertise, patient safety protocols, comfort measures, and successful outcomes.'
        }
      },

      {
        name: 'Universal Service Page Template',
        description: 'Flexible template for any type of dental service',
        type: 'service-page',
        category: 'universal',
        isSystemTemplate: true,
        template: {
          servicePage: {
            hero: {
              titlePattern: '{{serviceName}} - Professional Dental Care',
              subtitlePattern: 'Expert {{serviceName}} services for optimal oral health',
              descriptionPattern: 'Experience professional {{serviceName}} treatment with our skilled dental team using modern techniques and personalized care.',
              ctaText: 'Schedule Consultation'
            },
            overview: {
              titlePattern: 'About {{serviceName}}',
              contentPattern: '{{serviceName}} is a professional dental treatment designed to improve your oral health and provide comprehensive care. Our experienced dental team uses modern techniques and technology to deliver effective results.',
              highlightsPattern: ['Professional dental care', 'Modern techniques', 'Personalized treatment', 'Experienced team']
            },
            benefits: {
              titlePattern: 'Benefits of {{serviceName}}',
              introductionPattern: 'Choosing {{serviceName}} provides numerous advantages for your oral health and overall well-being.',
              benefitTemplates: [
                {
                  titlePattern: 'Professional Expertise',
                  descriptionPattern: 'Expert dental care from qualified professionals',
                  iconSuggestion: 'expertise'
                },
                {
                  titlePattern: 'Modern Techniques',
                  descriptionPattern: 'Advanced dental technology and proven methods',
                  iconSuggestion: 'technology'
                },
                {
                  titlePattern: 'Personalized Care',
                  descriptionPattern: 'Treatment plans tailored to your specific needs',
                  iconSuggestion: 'personalized'
                }
              ]
            },
            procedure: {
              titlePattern: 'The {{serviceName}} Process',
              introductionPattern: 'Our {{serviceName}} procedure follows a systematic approach to ensure optimal results.',
              stepTemplates: [
                {
                  titlePattern: 'Initial Consultation',
                  descriptionPattern: 'Comprehensive examination and treatment planning',
                  durationPattern: '30-45 minutes'
                },
                {
                  titlePattern: 'Treatment Preparation',
                  descriptionPattern: 'Preparation and setup for the procedure',
                  durationPattern: '15-30 minutes'
                },
                {
                  titlePattern: 'Procedure Execution',
                  descriptionPattern: 'Professional {{serviceName}} treatment',
                  durationPattern: 'Varies by case'
                },
                {
                  titlePattern: 'Follow-up Care',
                  descriptionPattern: 'Post-treatment monitoring and care instructions',
                  durationPattern: '15-30 minutes'
                }
              ]
            },
            cta: {
              titlePattern: 'Ready for {{serviceName}}?',
              subtitlePattern: 'Schedule your {{serviceName}} consultation today',
              buttonText: 'Book Appointment'
            }
          }
        },
        variables: [
          { name: 'serviceName', description: 'Name of the dental service', type: 'text', required: true },
          { name: 'category', description: 'Service category', type: 'text', required: false },
          { name: 'duration', description: 'Treatment duration', type: 'text', required: false }
        ]
      }
    ];

    // Create a dummy doctor ID for system templates
    const User = require('./src/models/User');
    let systemDoctor = await User.findOne({ role: 'doctor', isSystemUser: true });

    if (!systemDoctor) {
      systemDoctor = new User({
        name: 'System Administrator',
        email: 'system@dentalcare.com',
        role: 'doctor',
        isSystemUser: true,
        password: 'system-placeholder' // This won't be used for login
      });
      await systemDoctor.save();
      console.log('Created system user for templates');
    }

    // Seed templates
    for (const templateData of defaultTemplates) {
      const existingTemplate = await ContentTemplate.findOne({
        name: templateData.name,
        isSystemTemplate: true
      });

      if (!existingTemplate) {
        const template = new ContentTemplate({
          ...templateData,
          doctorId: systemDoctor._id
        });

        await template.save();
        console.log(`✅ Created template: ${templateData.name}`);
      } else {
        console.log(`⏭️  Template already exists: ${templateData.name}`);
      }
    }

    console.log('🎉 Default templates seeded successfully!');
    console.log('\nNext steps:');
    console.log('1. Templates are now available in the database');
    console.log('2. LLM service will automatically use these templates');
    console.log('3. No more hardcoded content in the application');

  } catch (error) {
    console.error('❌ Error seeding templates:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  seedDefaultTemplates();
}

module.exports = seedDefaultTemplates;