#!/usr/bin/env node

/**
 * Test script to verify meta title length fix
 */

// Helper function to generate safe meta titles within 60 character limit
function generateSafeMetaTitle(serviceName) {
  // Ensure total length stays under 60 characters
  const suffix = ' | Dental Care';
  const maxServiceNameLength = 60 - suffix.length;

  let shortServiceName = serviceName;
  if (serviceName.length > maxServiceNameLength) {
    shortServiceName = serviceName.substring(0, maxServiceNameLength - 3) + '...';
  }

  const title = `${shortServiceName}${suffix}`;
  return title.substring(0, 60); // Final safety check
}

// Test various service names
const testCases = [
  'Root Canal Treatment',
  'Fixed Partial Denture (Crowns and Bridges)',
  'Comprehensive Orthodontic Treatment with Advanced Braces',
  'X',
  'Panoramic Dental X-Ray',
  'Dental Implant Placement and Restoration Surgery',
  'Periodontal Deep Cleaning and Gum Disease Treatment'
];

console.log('🧪 Testing Meta Title Length Fix...\n');

testCases.forEach((serviceName, index) => {
  const metaTitle = generateSafeMetaTitle(serviceName);
  const isValid = metaTitle.length <= 60;

  console.log(`Test ${index + 1}: ${serviceName}`);
  console.log(`  Original Length: ${serviceName.length}`);
  console.log(`  Meta Title: "${metaTitle}"`);
  console.log(`  Meta Title Length: ${metaTitle.length}`);
  console.log(`  Valid (≤60 chars): ${isValid ? '✅' : '❌'}`);
  console.log('');
});

// Test blog titles too
const blogTypes = ['Guide', 'Benefits', 'Procedure', 'Recovery', 'Cost', 'Facts'];
console.log('📝 Testing Blog Meta Titles...\n');

const longServiceName = 'Fixed Partial Denture (Crowns and Bridges)';
blogTypes.forEach((type, index) => {
  const blogTitle = `${longServiceName} ${type}`;
  const metaTitle = generateSafeMetaTitle(blogTitle);
  const isValid = metaTitle.length <= 60;

  console.log(`Blog Test ${index + 1}: ${blogTitle}`);
  console.log(`  Meta Title: "${metaTitle}"`);
  console.log(`  Length: ${metaTitle.length}`);
  console.log(`  Valid: ${isValid ? '✅' : '❌'}`);
  console.log('');
});

console.log('🎉 Meta title length fix test completed!');