/**
 * Update Service Page with Comprehensive Content
 * Updates an existing service page to demonstrate all 11 sections working
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import the ServicePage model
const ServicePage = require('./src/models/ServicePage');

async function updateServicePageWithComprehensiveContent() {
  console.log('🔧 UPDATING SERVICE PAGE WITH COMPREHENSIVE CONTENT\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Find the laser dentistry service page
    const servicePageId = '6909f2fe54a45fdf6084091b';
    console.log(`📋 Finding service page: ${servicePageId}`);

    const servicePage = await ServicePage.findById(servicePageId);

    if (!servicePage) {
      console.log('❌ Service page not found');
      return;
    }

    console.log('✅ Service page found');
    console.log(`   Title: ${servicePage.title}`);
    console.log(`   Status: ${servicePage.status}`);
    console.log(`   Created: ${servicePage.createdAt}`);

    // Update the comprehensive content sections with sample data
    console.log('\n🔄 Updating comprehensive content sections...');

    servicePage.content.comprehensiveContent = {
      // 1. Introduction
      introduction: {
        content: "Laser dentistry represents a revolutionary approach to dental care, utilizing focused light energy to perform precise treatments with minimal discomfort and faster healing times.",
        wordCount: 25
      },

      // 2. Detailed explanation
      detailedExplanation: {
        title: 'What Does This Treatment Entail?',
        bulletPoints: [
          { title: 'Assessment and Planning', content: 'Comprehensive evaluation and treatment planning for optimal laser therapy results.' },
          { title: 'Precision Treatment', content: 'Advanced laser technology targets specific areas with remarkable accuracy.' },
          { title: 'Minimally Invasive Procedure', content: 'Focused energy beam allows for precise treatment without traditional instruments.' },
          { title: 'Real-time Monitoring', content: 'Continuous monitoring ensures optimal comfort and results throughout treatment.' },
          { title: 'Immediate Benefits', content: 'Reduced bleeding, swelling, and discomfort compared to traditional procedures.' }
        ],
        totalWordCount: 500
      },

      // 3. Treatment need
      treatmentNeed: {
        title: 'Why Do You Need This Treatment?',
        bulletPoints: [
          { title: 'Advanced Gum Disease', content: 'When traditional treatments haven\'t effectively controlled periodontal disease.' },
          { title: 'Precision Requirements', content: 'Procedures requiring extreme accuracy to preserve healthy tissue.' },
          { title: 'Comfort Preferences', content: 'When minimal discomfort and faster healing are priorities.' },
          { title: 'Complex Cases', content: 'Challenging conditions that benefit from laser technology\'s precision.' },
          { title: 'Aesthetic Concerns', content: 'Cosmetic procedures requiring precise tissue management.' }
        ],
        totalWordCount: 500
      },

      // 4. Symptoms
      symptoms: {
        title: 'Signs You May Need This Treatment',
        bulletPoints: [
          { title: 'Gum Disease Indicators', content: 'Persistent bleeding, swelling, or tenderness in gums.' },
          { title: 'Tooth Sensitivity Issues', content: 'Increased sensitivity affecting daily eating and drinking.' },
          { title: 'Oral Lesion Concerns', content: 'Unusual growths or sores persisting for more than two weeks.' },
          { title: 'Cosmetic Enhancement Needs', content: 'Desire to improve smile appearance through gum contouring.' },
          { title: 'Treatment Limitations', content: 'When conventional procedures haven\'t provided desired results.' }
        ],
        totalWordCount: 500
      },

      // 5. Consequences
      consequences: {
        title: 'What Happens If Treatment Is Delayed?',
        bulletPoints: [
          { title: 'Progressive Gum Disease', content: 'Condition may advance to more severe stages requiring extensive treatment.' },
          { title: 'Increased Complexity', content: 'Delaying treatment may result in need for more invasive procedures.' },
          { title: 'Compromised Oral Health', content: 'Untreated conditions may spread affecting multiple teeth.' },
          { title: 'Systemic Health Risks', content: 'Advanced gum disease linked to heart disease and diabetes complications.' },
          { title: 'Reduced Success', content: 'Longer delays make it more challenging to achieve optimal results.' }
        ],
        totalWordCount: 500
      },

      // 6. Procedure details
      procedureDetails: {
        title: 'Step-by-Step Procedure',
        steps: [
          { stepNumber: 1, title: 'Initial Consultation', description: 'Comprehensive oral examination and diagnostic evaluation.' },
          { stepNumber: 2, title: 'Treatment Planning', description: 'Customized treatment plan development and preparation.' },
          { stepNumber: 3, title: 'Laser Calibration', description: 'Equipment calibration for optimal precision and safety.' },
          { stepNumber: 4, title: 'Precise Treatment', description: 'Focused laser application with remarkable accuracy.' },
          { stepNumber: 5, title: 'Post-Treatment Care', description: 'Detailed aftercare instructions and follow-up scheduling.' }
        ],
        totalWordCount: 500
      },

      // 7. Post-treatment care
      postTreatmentCare: {
        title: 'Post-Treatment Care Instructions',
        bulletPoints: [
          { title: 'Immediate Care', content: 'Apply ice packs and take prescribed medications as directed.' },
          { title: 'Oral Hygiene', content: 'Use soft-bristled toothbrush and gentle technique.' },
          { title: 'Dietary Restrictions', content: 'Stick to soft foods and lukewarm liquids initially.' },
          { title: 'Activity Limitations', content: 'Avoid strenuous activity and smoking for 48 hours.' },
          { title: 'Follow-up Compliance', content: 'Attend all scheduled visits to monitor healing progress.' }
        ],
        totalWordCount: 500
      },

      // 8. Detailed benefits
      detailedBenefits: {
        title: 'Benefits of This Treatment',
        bulletPoints: [
          { title: 'Minimal Discomfort', content: 'Significantly less pain compared to traditional dental procedures.' },
          { title: 'Faster Healing', content: 'Precision treatment promotes faster tissue regeneration.' },
          { title: 'Reduced Bleeding', content: 'Laser seals blood vessels resulting in minimal bleeding.' },
          { title: 'Enhanced Precision', content: 'Extremely precise treatment preserving healthy tissue.' },
          { title: 'Lower Infection Risk', content: 'Sterilizing effect reduces bacterial infection risk.' }
        ],
        totalWordCount: 500
      },

      // 9. Side effects
      sideEffects: {
        title: 'Potential Side Effects',
        bulletPoints: [
          { title: 'Temporary Sensitivity', content: 'Mild sensitivity to temperature changes for a few days.' },
          { title: 'Minor Swelling', content: 'Some patients experience mild swelling manageable with medication.' },
          { title: 'Taste Changes', content: 'Slight metallic taste may be present for 24-48 hours.' },
          { title: 'Tissue Irritation', content: 'Rare cases of temporary tissue irritation or redness.' },
          { title: 'Eating Modifications', content: 'Temporary diet modifications avoiding very hot or cold foods.' }
        ],
        totalWordCount: 500
      },

      // 10. Myths and facts
      mythsAndFacts: {
        title: 'Common Myths and Facts',
        items: [
          { myth: 'Laser dentistry is painful and scary', fact: 'Actually one of the most comfortable dental procedures available' },
          { myth: 'Laser treatments are experimental and unsafe', fact: 'FDA-approved with decades of safe use and extensive research' },
          { myth: 'Laser dentistry is only for cosmetic procedures', fact: 'Used for wide range including gum disease and oral surgery' },
          { myth: 'Laser dental treatments are extremely expensive', fact: 'Often cost-effective long-term due to reduced treatment time' },
          { myth: 'Laser dentistry takes much longer than traditional methods', fact: 'Many procedures are actually faster due to precision' }
        ],
        totalWordCount: 500
      },

      // 11. Comprehensive FAQ
      comprehensiveFAQ: {
        title: 'Comprehensive FAQ',
        questions: [
          { question: 'Is laser dentistry painful?', answer: 'Most patients experience minimal to no pain during laser dental procedures. The precision often eliminates need for anesthesia.' },
          { question: 'How long does treatment take?', answer: 'Treatment time varies but many laser procedures are completed more quickly than conventional methods due to precision.' },
          { question: 'Are there any side effects?', answer: 'Side effects are generally minimal and may include temporary sensitivity or mild swelling.' },
          { question: 'How much does it cost?', answer: 'Costs vary but often reduce overall treatment time and follow-up visits making them cost-effective.' },
          { question: 'Is it safe for everyone?', answer: 'Safe for most patients though pregnant women and certain medical conditions require discussion.' }
        ],
        totalQuestions: 5
      }
    };

    // Update generation info to show this was updated
    servicePage.generation = {
      lastGenerated: new Date(),
      generatedBy: 'manual',
      promptUsed: 'Comprehensive 11-section content update for testing',
      llmModel: 'manual-update',
      tokensUsed: 0,
      generationTime: 0,
      autoRegenerate: false
    };

    // Save the updated service page
    await servicePage.save();

    console.log('✅ Service page updated successfully!');
    console.log('\n📊 Updated sections:');
    console.log('   ✅ introduction - sample content added');
    console.log('   ✅ detailedExplanation - 5 bullet points');
    console.log('   ✅ treatmentNeed - 5 bullet points');
    console.log('   ✅ symptoms - 5 bullet points');
    console.log('   ✅ consequences - 5 bullet points');
    console.log('   ✅ procedureDetails - 5 steps');
    console.log('   ✅ postTreatmentCare - 5 bullet points');
    console.log('   ✅ detailedBenefits - 5 bullet points');
    console.log('   ✅ sideEffects - 5 bullet points');
    console.log('   ✅ mythsAndFacts - 5 myth/fact pairs');
    console.log('   ✅ comprehensiveFAQ - 5 questions');

    console.log('\n🎯 All 11 sections now have sample content!');
    console.log('🧪 Run the test again to verify all sections are visible.');

  } catch (error) {
    console.error('❌ Error updating service page:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the update
if (require.main === module) {
  updateServicePageWithComprehensiveContent();
}

module.exports = { updateServicePageWithComprehensiveContent };