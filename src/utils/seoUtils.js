/**
 * SEO Utilities for generating optimized metadata
 */

/**
 * Generate SEO data for a dental service
 * @param {string} serviceName - Name of the service
 * @param {string} description - Service description
 * @param {string} category - Service category
 * @returns {Object} SEO data object
 */
function generateServiceSEO(serviceName, description, category) {
  // Clean and format the service name for URLs
  const slug = serviceName.toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();

  // Generate meta title (recommended length: 50-60 characters)
  const metaTitle = `${serviceName} | Professional Dental Care`;

  // Generate meta description (recommended length: 150-160 characters)
  let metaDescription = description;
  if (metaDescription.length > 160) {
    metaDescription = metaDescription.substring(0, 157) + '...';
  }

  // Generate keywords based on service and category
  const keywords = [
    serviceName.toLowerCase(),
    category.replace('-', ' '),
    'dental care',
    'dentist',
    'oral health',
    'dental treatment',
    'professional dentistry'
  ];

  // Generate Open Graph data
  const openGraph = {
    title: metaTitle,
    description: metaDescription,
    type: 'website',
    image: '/images/dental-services-og.jpg' // You can customize this
  };

  // Generate Twitter Card data
  const twitterCard = {
    card: 'summary_large_image',
    title: metaTitle,
    description: metaDescription,
    image: '/images/dental-services-twitter.jpg' // You can customize this
  };

  // Generate JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalProcedure",
    "name": serviceName,
    "description": description,
    "category": category,
    "provider": {
      "@type": "Dentist",
      "name": "Dr. [Doctor Name]", // This can be dynamically populated
      "url": "https://yourdentalpractice.com"
    },
    "offers": {
      "@type": "Offer",
      "description": `Professional ${serviceName} services`
    }
  };

  return {
    slug,
    metaTitle,
    metaDescription,
    keywords,
    openGraph,
    twitterCard,
    structuredData,
    canonicalUrl: `/services/${slug}`,
    robots: 'index, follow'
  };
}

/**
 * Generate complete SEO package for a service page
 * @param {Object} serviceData - Service information
 * @returns {Object} Complete SEO package
 */
function generateCompleteSEOPackage(serviceData) {
  const basicSEO = generateServiceSEO(
    serviceData.name,
    serviceData.description,
    serviceData.category
  );

  // Add additional SEO elements
  const completeSEO = {
    ...basicSEO,
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Services', url: '/services' },
      { name: serviceData.category.replace('-', ' '), url: `/services/category/${serviceData.category}` },
      { name: serviceData.name, url: `/services/${basicSEO.slug}` }
    ],
    alternativeUrls: [
      `/services/${basicSEO.slug}`,
      `/dental-services/${basicSEO.slug}`,
      `/${serviceData.category}/${basicSEO.slug}`
    ],
    priority: serviceData.isPopular ? 0.8 : 0.6,
    changeFreq: 'monthly'
  };

  return completeSEO;
}

/**
 * Generate meta tags HTML for a service
 * @param {Object} seoData - SEO data object
 * @returns {string} HTML meta tags
 */
function generateMetaTagsHTML(seoData) {
  return `
    <!-- Basic Meta Tags -->
    <title>${seoData.metaTitle}</title>
    <meta name="description" content="${seoData.metaDescription}">
    <meta name="keywords" content="${seoData.keywords.join(', ')}">
    <meta name="robots" content="${seoData.robots}">
    <link rel="canonical" href="${seoData.canonicalUrl}">

    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="${seoData.openGraph.title}">
    <meta property="og:description" content="${seoData.openGraph.description}">
    <meta property="og:type" content="${seoData.openGraph.type}">
    <meta property="og:image" content="${seoData.openGraph.image}">

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="${seoData.twitterCard.card}">
    <meta name="twitter:title" content="${seoData.twitterCard.title}">
    <meta name="twitter:description" content="${seoData.twitterCard.description}">
    <meta name="twitter:image" content="${seoData.twitterCard.image}">

    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
      ${JSON.stringify(seoData.structuredData, null, 2)}
    </script>
  `.trim();
}

module.exports = {
  generateServiceSEO,
  generateCompleteSEOPackage,
  generateMetaTagsHTML
};