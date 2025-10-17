const Page = require('../models/Page');

/**
 * Page Controller for Destack Integration
 *
 * Handles CRUD operations for pages created with Destack page builder.
 */

/**
 * Get all pages
 */
exports.getAllPages = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const pages = await Page.find(filter)
      .sort({ updatedAt: -1 })
      .select('slug title status meta createdAt updatedAt version');

    res.json({
      success: true,
      pages,
      count: pages.length,
    });
  } catch (error) {
    console.error('Get all pages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pages',
      error: error.message,
    });
  }
};

/**
 * Get page by slug
 */
exports.getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = await Page.findOne({ slug });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    res.json({
      success: true,
      page,
    });
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve page',
      error: error.message,
    });
  }
};

/**
 * Create new page
 */
exports.createPage = async (req, res) => {
  try {
    const { slug, title, content, status, meta } = req.body;
    const userId = req.session?.user?.id || 'anonymous';

    // Check if slug already exists
    const existingPage = await Page.findOne({ slug });
    if (existingPage) {
      return res.status(400).json({
        success: false,
        message: 'Page with this slug already exists',
      });
    }

    const page = new Page({
      slug,
      title,
      content: content || {},
      status: status || 'draft',
      meta: meta || {},
      createdBy: userId,
      updatedBy: userId,
    });

    await page.save();

    res.status(201).json({
      success: true,
      message: 'Page created successfully',
      page,
    });
  } catch (error) {
    console.error('Create page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create page',
      error: error.message,
    });
  }
};

/**
 * Update page
 */
exports.updatePage = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, content, status, meta } = req.body;
    const userId = req.session?.user?.id || 'anonymous';

    const page = await Page.findOne({ slug });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    // Update fields
    if (title) page.title = title;
    if (content) page.content = content;
    if (status) {
      page.status = status;
      if (status === 'published' && !page.publishedAt) {
        page.publishedAt = new Date();
      }
    }
    if (meta) page.meta = { ...page.meta, ...meta };
    page.updatedBy = userId;

    await page.save();

    res.json({
      success: true,
      message: 'Page updated successfully',
      page,
    });
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update page',
      error: error.message,
    });
  }
};

/**
 * Delete page
 */
exports.deletePage = async (req, res) => {
  try {
    const { slug } = req.params;

    const page = await Page.findOneAndDelete({ slug });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    res.json({
      success: true,
      message: 'Page deleted successfully',
    });
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete page',
      error: error.message,
    });
  }
};

/**
 * Get Destack handle request (for Destack integration)
 * This handles the core Destack API endpoint /api/builder/handle
 */
exports.getPageContent = async (req, res) => {
  try {
    const { name, type, path } = req.query;

    console.log('Destack handle GET request:', { name, type, path });

    // Handle theme requests (for drag & drop components)
    if (type === 'theme') {
      console.log('Handling theme request for:', name);

      try {

      // Professional dental-themed components based on dental-website-nextjs structure
      const componentData = {
        basic: [
          {
            id: 'dental-text-block',
            name: 'Text Block',
            category: 'Basic',
            folder: 'basic',
            component: '<div class="p-6 bg-white rounded-lg shadow-sm border border-gray-200"><h2 class="text-3xl font-bold text-gray-900 mb-4">Professional Dental Care</h2><p class="text-gray-600 leading-relaxed">Experience world-class dental care with our state-of-the-art facilities and expert dental professionals. We provide comprehensive dental services to keep your smile healthy and beautiful.</p></div>',
            image: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=150&h=100&fit=crop&crop=center',
            css: '',
            source: '<div class="p-6 bg-white rounded-lg shadow-sm border border-gray-200"><h2 class="text-3xl font-bold text-gray-900 mb-4">Professional Dental Care</h2><p class="text-gray-600 leading-relaxed">Experience world-class dental care with our state-of-the-art facilities and expert dental professionals. We provide comprehensive dental services to keep your smile healthy and beautiful.</p></div>'
          },
          {
            id: 'dental-cta-button',
            name: 'CTA Button',
            category: 'Basic',
            folder: 'basic',
            component: '<button class="inline-block rounded-md bg-blue-600 px-8 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300">Book Appointment</button>',
            image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=150&h=100&fit=crop&crop=center',
            css: '',
            source: '<button class="inline-block rounded-md bg-blue-600 px-8 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300">Book Appointment</button>'
          },
          {
            id: 'dental-image',
            name: 'Dental Image',
            category: 'Basic',
            folder: 'basic',
            component: '<img src="https://images.unsplash.com/photo-1609840112855-9ab5ad8f66e4?w=600&h=400&fit=crop&crop=center" alt="Modern dental office" class="w-full h-64 object-cover rounded-lg shadow-lg">',
            image: 'https://images.unsplash.com/photo-1609840112855-9ab5ad8f66e4?w=150&h=100&fit=crop&crop=center',
            css: '',
            source: '<img src="https://images.unsplash.com/photo-1609840112855-9ab5ad8f66e4?w=600&h=400&fit=crop&crop=center" alt="Modern dental office" class="w-full h-64 object-cover rounded-lg shadow-lg">'
          },
          {
            id: 'dental-stats',
            name: 'Stats Row',
            category: 'Basic',
            folder: 'basic',
            component: '<div class="grid grid-cols-1 md:grid-cols-3 gap-6 py-8"><div class="text-center"><div class="text-3xl font-bold text-blue-600 mb-2">15+</div><div class="text-gray-600">Years Experience</div></div><div class="text-center"><div class="text-3xl font-bold text-blue-600 mb-2">5000+</div><div class="text-gray-600">Happy Patients</div></div><div class="text-center"><div class="text-3xl font-bold text-blue-600 mb-2">10+</div><div class="text-gray-600">Expert Dentists</div></div></div>',
            image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=150&h=100&fit=crop&crop=center',
            css: '',
            source: '<div class="grid grid-cols-1 md:grid-cols-3 gap-6 py-8"><div class="text-center"><div class="text-3xl font-bold text-blue-600 mb-2">15+</div><div class="text-gray-600">Years Experience</div></div><div class="text-center"><div class="text-3xl font-bold text-blue-600 mb-2">5000+</div><div class="text-gray-600">Happy Patients</div></div><div class="text-center"><div class="text-3xl font-bold text-blue-600 mb-2">10+</div><div class="text-gray-600">Expert Dentists</div></div></div>'
          }
        ],
        layout: [
          {
            id: 'dental-header',
            name: 'Professional Header',
            category: 'Layout',
            folder: 'layout',
            component: '<header class="bg-white shadow-sm"><div class="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8"><a class="block text-blue-600 cursor-pointer"><svg class="h-8" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.41 10.3847C1.14777 7.4194 2.85643 4.7861 5.2639 2.90424C7.6714 1.02234 10.6393 0 13.695 0C16.7507 0 19.7186 1.02234 22.1261 2.90424C24.5336 4.7861 26.2422 7.4194 26.98 10.3847H25.78C23.7557 10.3549 21.7729 10.9599 20.11 12.1147C20.014 12.1842 19.9138 12.2477 19.81 12.3047H19.67C19.5662 12.2477 19.466 12.1842 19.37 12.1147C17.6924 10.9866 15.7166 10.3841 13.695 10.3841C11.6734 10.3841 9.6976 10.9866 8.02 12.1147C7.924 12.1842 7.8238 12.2477 7.72 12.3047H7.58C7.4762 12.2477 7.376 12.1842 7.28 12.1147C5.6171 10.9599 3.6343 10.3549 1.61 10.3847H0.41Z" fill="currentColor"></path></svg></a><div class="flex flex-1 items-center justify-end md:justify-between"><nav class="hidden md:block"><ul class="flex items-center gap-6 text-sm"><li><a class="text-gray-500 transition hover:text-gray-500/75 cursor-pointer">Services</a></li><li><a class="text-gray-500 transition hover:text-gray-500/75 cursor-pointer">About</a></li><li><a class="text-gray-500 transition hover:text-gray-500/75 cursor-pointer">Contact</a></li></ul></nav><div class="flex items-center gap-4"><a class="block rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 cursor-pointer">Book Now</a></div></div></div></header>',
            image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=150&h=100&fit=crop&crop=center',
            css: '',
            source: '<header class="bg-white shadow-sm"><div class="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8"><a class="block text-blue-600 cursor-pointer"><svg class="h-8" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.41 10.3847C1.14777 7.4194 2.85643 4.7861 5.2639 2.90424C7.6714 1.02234 10.6393 0 13.695 0C16.7507 0 19.7186 1.02234 22.1261 2.90424C24.5336 4.7861 26.2422 7.4194 26.98 10.3847H25.78C23.7557 10.3549 21.7729 10.9599 20.11 12.1147C20.014 12.1842 19.9138 12.2477 19.81 12.3047H19.67C19.5662 12.2477 19.466 12.1842 19.37 12.1147C17.6924 10.9866 15.7166 10.3841 13.695 10.3841C11.6734 10.3841 9.6976 10.9866 8.02 12.1147C7.924 12.1842 7.8238 12.2477 7.72 12.3047H7.58C7.4762 12.2477 7.376 12.1842 7.28 12.1147C5.6171 10.9599 3.6343 10.3549 1.61 10.3847H0.41Z" fill="currentColor"></path></svg></a><div class="flex flex-1 items-center justify-end md:justify-between"><nav class="hidden md:block"><ul class="flex items-center gap-6 text-sm"><li><a class="text-gray-500 transition hover:text-gray-500/75 cursor-pointer">Services</a></li><li><a class="text-gray-500 transition hover:text-gray-500/75 cursor-pointer">About</a></li><li><a class="text-gray-500 transition hover:text-gray-500/75 cursor-pointer">Contact</a></li></ul></nav><div class="flex items-center gap-4"><a class="block rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 cursor-pointer">Book Now</a></div></div></div></header>'
          },
          {
            id: 'dental-service-card',
            name: 'Service Card',
            category: 'Layout',
            folder: 'layout',
            component: '<div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300"><div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4"><svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg></div><h3 class="text-xl font-semibold text-gray-900 mb-3">General Dentistry</h3><p class="text-gray-600 mb-4 leading-relaxed">Comprehensive dental care including cleanings, fillings, and preventive treatments to maintain optimal oral health.</p><div class="flex items-center text-blue-600 font-medium"><span>Learn More</span><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></div></div>',
            image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=150&h=100&fit=crop&crop=center',
            css: '',
            source: '<div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300"><div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4"><svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg></div><h3 class="text-xl font-semibold text-gray-900 mb-3">General Dentistry</h3><p class="text-gray-600 mb-4 leading-relaxed">Comprehensive dental care including cleanings, fillings, and preventive treatments to maintain optimal oral health.</p><div class="flex items-center text-blue-600 font-medium"><span>Learn More</span><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></div></div>'
          },
          {
            id: 'dental-feature-section',
            name: 'Feature Section',
            category: 'Layout',
            folder: 'layout',
            component: '<aside class="overflow-hidden bg-gray-50 sm:grid sm:grid-cols-2 sm:items-center"><div class="p-8 md:p-12 lg:px-16 lg:py-24"><div class="mx-auto max-w-xl text-center sm:text-left"><h2 class="text-2xl font-bold text-gray-900 md:text-3xl">Advanced Dental Technology</h2><p class="hidden text-gray-500 md:mt-4 md:block">Experience the latest in dental technology with our state-of-the-art equipment and modern treatment methods for optimal patient comfort and care.</p><div class="mt-4 md:mt-8"><a class="inline-block rounded bg-blue-600 px-12 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300">Schedule Consultation</a></div></div></div><img alt="Modern Dental Office" src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=center" class="h-56 w-full object-cover sm:h-full"></aside>',
            image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=150&h=100&fit=crop&crop=center',
            css: '',
            source: '<aside class="overflow-hidden bg-gray-50 sm:grid sm:grid-cols-2 sm:items-center"><div class="p-8 md:p-12 lg:px-16 lg:py-24"><div class="mx-auto max-w-xl text-center sm:text-left"><h2 class="text-2xl font-bold text-gray-900 md:text-3xl">Advanced Dental Technology</h2><p class="hidden text-gray-500 md:mt-4 md:block">Experience the latest in dental technology with our state-of-the-art equipment and modern treatment methods for optimal patient comfort and care.</p><div class="mt-4 md:mt-8"><a class="inline-block rounded bg-blue-600 px-12 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300">Schedule Consultation</a></div></div></div><img alt="Modern Dental Office" src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=center" class="h-56 w-full object-cover sm:h-full"></aside>'
          }
        ],
        content: [
          {
            id: 'dental-hero',
            name: 'Dental Hero',
            category: 'Content',
            folder: 'content',
            component: '<section class="bg-gray-50"><div class="mx-auto max-w-screen-xl px-4 py-32 lg:flex lg:h-screen lg:items-center"><div class="mx-auto max-w-xl text-center"><h1 class="text-3xl font-extrabold sm:text-5xl">Your Perfect Smile<strong class="font-extrabold text-blue-700 sm:block">Starts Here.</strong></h1><p class="mt-4 sm:text-xl sm:leading-relaxed">Experience exceptional dental care with our team of expert dentists using the latest technology and techniques for optimal oral health.</p><div class="mt-8 flex flex-wrap justify-center gap-4"><a class="block w-full rounded bg-blue-600 px-12 py-3 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring active:bg-blue-500 sm:w-auto cursor-pointer">Book Appointment</a><a class="block w-full rounded px-12 py-3 text-sm font-medium text-blue-600 shadow hover:text-blue-700 focus:outline-none focus:ring active:text-blue-500 sm:w-auto cursor-pointer">Our Services</a></div></div></div></section>',
            image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=150&h=100&fit=crop&crop=center',
            css: '',
            source: '<section class="bg-gray-50"><div class="mx-auto max-w-screen-xl px-4 py-32 lg:flex lg:h-screen lg:items-center"><div class="mx-auto max-w-xl text-center"><h1 class="text-3xl font-extrabold sm:text-5xl">Your Perfect Smile<strong class="font-extrabold text-blue-700 sm:block">Starts Here.</strong></h1><p class="mt-4 sm:text-xl sm:leading-relaxed">Experience exceptional dental care with our team of expert dentists using the latest technology and techniques for optimal oral health.</p><div class="mt-8 flex flex-wrap justify-center gap-4"><a class="block w-full rounded bg-blue-600 px-12 py-3 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring active:bg-blue-500 sm:w-auto cursor-pointer">Book Appointment</a><a class="block w-full rounded px-12 py-3 text-sm font-medium text-blue-600 shadow hover:text-blue-700 focus:outline-none focus:ring active:text-blue-500 sm:w-auto cursor-pointer">Our Services</a></div></div></div></section>'
          },
          {
            id: 'dental-faq',
            name: 'FAQ Section',
            category: 'Content',
            folder: 'content',
            component: '<div class="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white"><details class="group p-6" open><summary class="flex cursor-pointer items-center justify-between"><h5 class="text-lg font-medium text-gray-900">How often should I visit the dentist?</h5><span class="relative ml-1.5 h-5 w-5 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="absolute inset-0 h-5 w-5 opacity-100 group-open:opacity-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><svg xmlns="http://www.w3.org/2000/svg" class="absolute inset-0 h-5 w-5 opacity-0 group-open:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span></summary><p class="mt-4 leading-relaxed text-gray-700">We recommend visiting the dentist every six months for routine cleanings and check-ups. However, some patients may need more frequent visits based on their oral health needs.</p></details><details class="group p-6"><summary class="flex cursor-pointer items-center justify-between"><h5 class="text-lg font-medium text-gray-900">Do you accept insurance?</h5><span class="relative ml-1.5 h-5 w-5 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="absolute inset-0 h-5 w-5 opacity-100 group-open:opacity-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><svg xmlns="http://www.w3.org/2000/svg" class="absolute inset-0 h-5 w-5 opacity-0 group-open:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span></summary><p class="mt-4 leading-relaxed text-gray-700">Yes, we accept most major dental insurance plans. Our team will help verify your benefits and maximize your coverage for treatments.</p></details></div>',
            image: 'https://images.unsplash.com/photo-1612277795421-9bc7706a4a34?w=150&h=100&fit=crop&crop=center',
            css: '',
            source: '<div class="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white"><details class="group p-6" open><summary class="flex cursor-pointer items-center justify-between"><h5 class="text-lg font-medium text-gray-900">How often should I visit the dentist?</h5><span class="relative ml-1.5 h-5 w-5 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="absolute inset-0 h-5 w-5 opacity-100 group-open:opacity-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><svg xmlns="http://www.w3.org/2000/svg" class="absolute inset-0 h-5 w-5 opacity-0 group-open:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span></summary><p class="mt-4 leading-relaxed text-gray-700">We recommend visiting the dentist every six months for routine cleanings and check-ups. However, some patients may need more frequent visits based on their oral health needs.</p></details><details class="group p-6"><summary class="flex cursor-pointer items-center justify-between"><h5 class="text-lg font-medium text-gray-900">Do you accept insurance?</h5><span class="relative ml-1.5 h-5 w-5 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="absolute inset-0 h-5 w-5 opacity-100 group-open:opacity-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><svg xmlns="http://www.w3.org/2000/svg" class="absolute inset-0 h-5 w-5 opacity-0 group-open:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span></summary><p class="mt-4 leading-relaxed text-gray-700">Yes, we accept most major dental insurance plans. Our team will help verify your benefits and maximize your coverage for treatments.</p></details></div>'
          }
        ],
        forms: [
          {
            id: 'dental-appointment-form',
            name: 'Appointment Form',
            category: 'Forms',
            folder: 'forms',
            component: '<div class="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-lg"><div class="text-center mb-8"><div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><h3 class="text-2xl font-bold text-gray-900 mb-2">Book Your Appointment</h3><p class="text-gray-600">Schedule your visit with our expert dental team</p></div><form class="space-y-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-2">First Name *</label><input type="text" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="John"></div><div><label class="block text-sm font-medium text-gray-700 mb-2">Last Name *</label><input type="text" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Smith"></div></div><div><label class="block text-sm font-medium text-gray-700 mb-2">Email Address *</label><input type="email" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="john@example.com"></div><div><label class="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label><input type="tel" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="(555) 123-4567"></div><div><label class="block text-sm font-medium text-gray-700 mb-2">Service Type</label><select class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option>General Cleaning</option><option>Dental Examination</option><option>Teeth Whitening</option><option>Root Canal</option><option>Dental Implants</option><option>Emergency Care</option></select></div><div><label class="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label><input type="date" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div><div><label class="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label><textarea class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none" placeholder="Any specific concerns or requests..."></textarea></div><button type="submit" class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200">Schedule Appointment</button></form></div>',
            image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=150&h=100&fit=crop&crop=center',
            css: '',
            source: '<div class="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-lg"><div class="text-center mb-8"><div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><h3 class="text-2xl font-bold text-gray-900 mb-2">Book Your Appointment</h3><p class="text-gray-600">Schedule your visit with our expert dental team</p></div><form class="space-y-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label class="block text-sm font-medium text-gray-700 mb-2">First Name *</label><input type="text" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="John"></div><div><label class="block text-sm font-medium text-gray-700 mb-2">Last Name *</label><input type="text" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Smith"></div></div><div><label class="block text-sm font-medium text-gray-700 mb-2">Email Address *</label><input type="email" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="john@example.com"></div><div><label class="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label><input type="tel" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="(555) 123-4567"></div><div><label class="block text-sm font-medium text-gray-700 mb-2">Service Type</label><select class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option>General Cleaning</option><option>Dental Examination</option><option>Teeth Whitening</option><option>Root Canal</option><option>Dental Implants</option><option>Emergency Care</option></select></div><div><label class="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label><input type="date" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div><div><label class="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label><textarea class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none" placeholder="Any specific concerns or requests..."></textarea></div><button type="submit" class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200">Schedule Appointment</button></form></div>'
          },
          {
            id: 'dental-contact-form',
            name: 'Contact Form',
            category: 'Forms',
            folder: 'forms',
            component: '<section class="bg-gray-50 py-16"><div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div class="mx-auto max-w-2xl text-center"><h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Get in Touch</h2><p class="mt-2 text-lg leading-8 text-gray-600">Have questions about our dental services? Wed love to hear from you.</p></div><div class="mx-auto mt-16 max-w-xl sm:mt-20"><div class="bg-white rounded-2xl shadow-xl p-8"><form class="space-y-6"><div class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2"><div><label class="block text-sm font-semibold leading-6 text-gray-900">First name</label><div class="mt-2.5"><input type="text" class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="John"></div></div><div><label class="block text-sm font-semibold leading-6 text-gray-900">Last name</label><div class="mt-2.5"><input type="text" class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="Smith"></div></div><div class="sm:col-span-2"><label class="block text-sm font-semibold leading-6 text-gray-900">Email</label><div class="mt-2.5"><input type="email" class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="john@example.com"></div></div><div class="sm:col-span-2"><label class="block text-sm font-semibold leading-6 text-gray-900">Phone number</label><div class="relative mt-2.5"><input type="tel" class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="(555) 123-4567"></div></div><div class="sm:col-span-2"><label class="block text-sm font-semibold leading-6 text-gray-900">Message</label><div class="mt-2.5"><textarea rows="4" class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="Tell us about your dental needs..."></textarea></div></div></div><div class="mt-10"><button type="submit" class="block w-full rounded-md bg-blue-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Send Message</button></div></form></div></div></div></section>',
            image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=150&h=100&fit=crop&crop=center',
            css: '',
            source: '<section class="bg-gray-50 py-16"><div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div class="mx-auto max-w-2xl text-center"><h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Get in Touch</h2><p class="mt-2 text-lg leading-8 text-gray-600">Have questions about our dental services? Wed love to hear from you.</p></div><div class="mx-auto mt-16 max-w-xl sm:mt-20"><div class="bg-white rounded-2xl shadow-xl p-8"><form class="space-y-6"><div class="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2"><div><label class="block text-sm font-semibold leading-6 text-gray-900">First name</label><div class="mt-2.5"><input type="text" class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="John"></div></div><div><label class="block text-sm font-semibold leading-6 text-gray-900">Last name</label><div class="mt-2.5"><input type="text" class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="Smith"></div></div><div class="sm:col-span-2"><label class="block text-sm font-semibold leading-6 text-gray-900">Email</label><div class="mt-2.5"><input type="email" class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="john@example.com"></div></div><div class="sm:col-span-2"><label class="block text-sm font-semibold leading-6 text-gray-900">Phone number</label><div class="relative mt-2.5"><input type="tel" class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="(555) 123-4567"></div></div><div class="sm:col-span-2"><label class="block text-sm font-semibold leading-6 text-gray-900">Message</label><div class="mt-2.5"><textarea rows="4" class="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="Tell us about your dental needs..."></textarea></div></div></div><div class="mt-10"><button type="submit" class="block w-full rounded-md bg-blue-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Send Message</button></div></form></div></div></div></section>'
          },
          {
            id: 'dental-newsletter-signup',
            name: 'Newsletter Signup',
            category: 'Forms',
            folder: 'forms',
            component: '<div class="bg-blue-600"><div class="px-6 py-24 sm:px-6 sm:py-32 lg:px-8"><div class="mx-auto max-w-2xl text-center"><h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">Stay Updated with Dental Health Tips</h2><p class="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">Get the latest dental health advice, appointment reminders, and exclusive offers delivered to your inbox.</p><div class="mt-10 flex items-center justify-center gap-x-6"><div class="flex gap-x-4"><label class="sr-only">Email address</label><input type="email" required class="min-w-0 flex-auto rounded-md border-0 bg-white/10 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-white/70 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6" placeholder="Enter your email"><button type="submit" class="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Subscribe</button></div></div></div></div></div>',
            image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=150&h=100&fit=crop&crop=center',
            css: '',
            source: '<div class="bg-blue-600"><div class="px-6 py-24 sm:px-6 sm:py-32 lg:px-8"><div class="mx-auto max-w-2xl text-center"><h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">Stay Updated with Dental Health Tips</h2><p class="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">Get the latest dental health advice, appointment reminders, and exclusive offers delivered to your inbox.</p><div class="mt-10 flex items-center justify-center gap-x-6"><div class="flex gap-x-4"><label class="sr-only">Email address</label><input type="email" required class="min-w-0 flex-auto rounded-md border-0 bg-white/10 px-3.5 py-2 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-white/70 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6" placeholder="Enter your email"><button type="submit" class="flex-none rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Subscribe</button></div></div></div></div></div>'
          },
          {
            id: 'dental-input-field',
            name: 'Input Field',
            category: 'Forms',
            folder: 'forms',
            component: '<div class="space-y-2"><label class="block text-sm font-medium text-gray-700">Email Address</label><input type="email" class="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm" placeholder="Enter your email address"></div>',
            image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=150&h=100&fit=crop&crop=center',
            css: '',
            source: '<div class="space-y-2"><label class="block text-sm font-medium text-gray-700">Email Address</label><input type="email" class="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm" placeholder="Enter your email address"></div>'
          }
        ]
      };

      // Return the folder data requested by Destack
      // Handle different theme names and folder requests
      console.log('Theme name requested:', name);

      // Check if a specific folder is being requested
      if (componentData[name]) {
        console.log(`Returning ${componentData[name].length} components for folder: ${name}`);
        return res.json(componentData[name]);
      }

      // Handle legacy theme names (hyperui, tailblocks, etc.) - return all components organized by category
      if (name === 'hyperui' || name === 'tailblocks' || !name) {
        // Return a combined object with all categories for the initial theme load
        const allComponents = {
          basic: componentData.basic,
          layout: componentData.layout,
          content: componentData.content,
          forms: componentData.forms
        };
        console.log('Returning all components organized by category');
        return res.json(allComponents);
      }

      // Fallback to basic components
      console.log(`Returning ${componentData.basic.length} basic components as fallback`);
      return res.json(componentData.basic);

      } catch (themeError) {
        console.error('Error handling theme request:', themeError);
        // Return minimal fallback components
        return res.json([
          {
            id: 'fallback-text',
            name: 'Text',
            category: 'Basic',
            folder: 'basic',
            component: '<div class="p-4 border"><p>Sample text</p></div>',
            image: 'https://via.placeholder.com/150x100/f8fafc/374151?text=Text',
            css: '',
            source: '<div class="p-4 border"><p>Sample text</p></div>'
          }
        ]);
      }
    }

    // Handle data requests (for page content)
    if (type === 'data') {
      console.log('Handling data request for path:', path);

      if (path === '/page-builder') {
        // Try to find existing page
        const page = await Page.findOne({ slug: 'page-builder' });

        if (!page) {
          console.log('Page not found, returning default page structure for page builder');
          // Return a default page structure for the page builder
          const defaultPageStructure = {
            type: 'body',
            props: {},
            children: [
              {
                type: 'section',
                props: {
                  style: {
                    padding: '40px 20px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc'
                  }
                },
                children: [
                  {
                    type: 'h1',
                    props: {
                      style: {
                        fontSize: '2rem',
                        marginBottom: '1rem',
                        color: '#1f2937'
                      }
                    },
                    children: ['Welcome to Page Builder']
                  },
                  {
                    type: 'p',
                    props: {
                      style: {
                        color: '#6b7280',
                        marginBottom: '2rem'
                      }
                    },
                    children: ['Drag and drop components from the left panel to build your page.']
                  }
                ]
              }
            ]
          };
          return res.json(defaultPageStructure);
        }

        console.log('Page found, returning content');
        return res.json(page.content || {});
      }

      // For other data requests, return empty
      return res.json({});
    }

    // Default page content handling (for regular handle requests)
    const slug = name || 'page-builder';

    console.log('Destack handle GET request for slug:', slug);

    // Try to find existing page
    const page = await Page.findOne({ slug });

    if (!page) {
      console.log('Page not found, returning empty content for new page');
      // Return empty content for new pages - this allows Destack to start fresh
      return res.json({});
    }

    console.log('Page found, returning content');
    // Return the page content (Destack format)
    res.json(page.content || {});
  } catch (error) {
    console.error('Get page content error:', error);
    // Return empty content instead of error to allow Destack to work
    res.json({});
  }
};

/**
 * Save page content (for Destack)
 * This endpoint is used by Destack to save page data
 */
exports.savePageContent = async (req, res) => {
  try {
    const { name } = req.query;
    const slug = name || 'default';
    const content = req.body;
    const userId = req.session?.user?.id || 'anonymous';

    let page = await Page.findOne({ slug });

    if (page) {
      // Update existing page
      page.content = content;
      page.updatedBy = userId;
      await page.save();
    } else {
      // Create new page
      page = new Page({
        slug,
        title: slug.charAt(0).toUpperCase() + slug.slice(1),
        content,
        status: 'draft',
        createdBy: userId,
        updatedBy: userId,
      });
      await page.save();
    }

    res.json({
      success: true,
      message: 'Page saved successfully',
    });
  } catch (error) {
    console.error('Save page content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save page content',
    });
  }
};

/**
 * Upload asset (for Destack)
 * This endpoint is used by Destack to upload images and other assets
 */
exports.uploadAsset = async (req, res) => {
  try {
    // For now, we'll return a placeholder URL
    // In production, you should implement actual file upload to a service like AWS S3, Cloudinary, etc.
    const { file } = req.body;

    // Placeholder response
    res.json({
      url: '/uploads/placeholder-image.jpg',
    });
  } catch (error) {
    console.error('Upload asset error:', error);
    res.status(500).json({
      error: 'Failed to upload asset',
    });
  }
};

/**
 * Get full component library for enhanced Destack editor
 * This provides a comprehensive set of medical/dental themed components
 */
exports.getFullComponentLibrary = async (req, res) => {
  try {
    console.log('Providing full component library for enhanced Destack editor');

    // Return comprehensive components with enhanced metadata for filtering
    const componentLibrary = [
      // Layout Components
      {
        id: 'container',
        name: 'Container',
        category: 'layout',
        description: 'Responsive container for content',
        tags: ['responsive', 'layout', 'basic'],
        component: '<div class="container mx-auto px-4"><div class="p-8 text-center bg-gray-50 rounded-lg"><h3 class="text-lg font-semibold">Container</h3><p class="text-gray-600">Drag content here</p></div></div>'
      },
      {
        id: 'grid-2col',
        name: '2 Column Grid',
        category: 'layout',
        description: 'Two column responsive grid',
        tags: ['responsive', 'grid', 'layout'],
        component: '<div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="p-6 bg-gray-50 rounded-lg text-center"><h4 class="font-semibold">Column 1</h4><p class="text-gray-600">Content here</p></div><div class="p-6 bg-gray-50 rounded-lg text-center"><h4 class="font-semibold">Column 2</h4><p class="text-gray-600">Content here</p></div></div>'
      },
      {
        id: 'grid-3col',
        name: '3 Column Grid',
        category: 'layout',
        description: 'Three column responsive grid',
        tags: ['responsive', 'grid', 'layout'],
        component: '<div class="grid grid-cols-1 md:grid-cols-3 gap-6"><div class="p-6 bg-gray-50 rounded-lg text-center"><h4 class="font-semibold">Column 1</h4></div><div class="p-6 bg-gray-50 rounded-lg text-center"><h4 class="font-semibold">Column 2</h4></div><div class="p-6 bg-gray-50 rounded-lg text-center"><h4 class="font-semibold">Column 3</h4></div></div>'
      },

      // Content Components
      {
        id: 'hero-section',
        name: 'Hero Section',
        category: 'content',
        description: 'Eye-catching hero section with CTA',
        tags: ['hero', 'banner', 'modern', 'professional'],
        component: '<div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20"><div class="container mx-auto px-4 text-center"><h1 class="text-5xl font-bold mb-6">Welcome to Our Practice</h1><p class="text-xl mb-8 opacity-90">Providing exceptional healthcare services with compassion and expertise</p><button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">Book Appointment</button></div></div>'
      },
      {
        id: 'about-section',
        name: 'About Section',
        category: 'content',
        description: 'Professional about section',
        tags: ['about', 'professional', 'medical'],
        component: '<div class="py-16 bg-white"><div class="container mx-auto px-4"><div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"><div><h2 class="text-3xl font-bold mb-6">About Our Practice</h2><p class="text-gray-600 mb-4">We are dedicated to providing exceptional healthcare services with a focus on patient care and comfort.</p><p class="text-gray-600">Our team of experienced professionals uses the latest technology and techniques to ensure the best outcomes for our patients.</p></div><div class="bg-gray-200 rounded-lg h-64 flex items-center justify-center"><span class="text-gray-500">Image Placeholder</span></div></div></div></div>'
      },
      {
        id: 'services-grid',
        name: 'Services Grid',
        category: 'content',
        description: 'Grid layout for services',
        tags: ['services', 'grid', 'medical', 'professional'],
        component: '<div class="py-16 bg-gray-50"><div class="container mx-auto px-4"><h2 class="text-3xl font-bold text-center mb-12">Our Services</h2><div class="grid grid-cols-1 md:grid-cols-3 gap-8"><div class="bg-white p-6 rounded-lg shadow-md text-center"><div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><span class="text-blue-600 text-2xl">🏥</span></div><h3 class="text-xl font-semibold mb-3">General Medicine</h3><p class="text-gray-600">Comprehensive primary care services</p></div><div class="bg-white p-6 rounded-lg shadow-md text-center"><div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><span class="text-green-600 text-2xl">💊</span></div><h3 class="text-xl font-semibold mb-3">Specialized Care</h3><p class="text-gray-600">Expert specialized treatments</p></div><div class="bg-white p-6 rounded-lg shadow-md text-center"><div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"><span class="text-purple-600 text-2xl">🔬</span></div><h3 class="text-xl font-semibold mb-3">Diagnostics</h3><p class="text-gray-600">Advanced diagnostic services</p></div></div></div></div>'
      },

      // Forms Components
      {
        id: 'contact-form',
        name: 'Contact Form',
        category: 'forms',
        description: 'Professional contact form',
        tags: ['contact', 'form', 'professional'],
        component: '<div class="py-16 bg-white"><div class="container mx-auto px-4 max-w-2xl"><h2 class="text-3xl font-bold text-center mb-8">Contact Us</h2><form class="space-y-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label class="block text-sm font-medium mb-2">First Name</label><input type="text" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div><div><label class="block text-sm font-medium mb-2">Last Name</label><input type="text" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div></div><div><label class="block text-sm font-medium mb-2">Email</label><input type="email" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div><div><label class="block text-sm font-medium mb-2">Message</label><textarea rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea></div><button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Send Message</button></form></div></div>'
      },
      {
        id: 'appointment-form',
        name: 'Appointment Form',
        category: 'forms',
        description: 'Medical appointment booking form',
        tags: ['appointment', 'medical', 'booking', 'form'],
        component: '<div class="py-16 bg-gradient-to-br from-blue-50 to-indigo-100"><div class="container mx-auto px-4 max-w-2xl"><div class="bg-white rounded-xl shadow-lg p-8"><h2 class="text-3xl font-bold text-center mb-8 text-gray-800">Book an Appointment</h2><form class="space-y-6"><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label class="block text-sm font-medium mb-2 text-gray-700">Patient Name</label><input type="text" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div><div><label class="block text-sm font-medium mb-2 text-gray-700">Phone Number</label><input type="tel" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div></div><div><label class="block text-sm font-medium mb-2 text-gray-700">Email</label><input type="email" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label class="block text-sm font-medium mb-2 text-gray-700">Preferred Date</label><input type="date" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></div><div><label class="block text-sm font-medium mb-2 text-gray-700">Preferred Time</label><select class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"><option>9:00 AM</option><option>10:00 AM</option><option>11:00 AM</option><option>2:00 PM</option><option>3:00 PM</option><option>4:00 PM</option></select></div></div><div><label class="block text-sm font-medium mb-2 text-gray-700">Reason for Visit</label><textarea rows="3" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Brief description of your concern..."></textarea></div><button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105">Book Appointment</button></form></div></div></div>'
      },

      // Navigation Components
      {
        id: 'navbar-modern',
        name: 'Modern Navbar',
        category: 'navigation',
        description: 'Clean modern navigation bar',
        tags: ['navigation', 'modern', 'responsive'],
        component: '<nav class="bg-white shadow-lg"><div class="container mx-auto px-4"><div class="flex justify-between items-center py-4"><div class="flex items-center"><h1 class="text-2xl font-bold text-blue-600">MediCare</h1></div><div class="hidden md:flex space-x-8"><a href="#" class="text-gray-700 hover:text-blue-600 transition">Home</a><a href="#" class="text-gray-700 hover:text-blue-600 transition">About</a><a href="#" class="text-gray-700 hover:text-blue-600 transition">Services</a><a href="#" class="text-gray-700 hover:text-blue-600 transition">Contact</a></div><button class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">Book Now</button></div></div></nav>'
      },
      {
        id: 'footer-medical',
        name: 'Medical Footer',
        category: 'navigation',
        description: 'Professional medical practice footer',
        tags: ['footer', 'medical', 'professional'],
        component: '<footer class="bg-gray-900 text-white py-12"><div class="container mx-auto px-4"><div class="grid grid-cols-1 md:grid-cols-4 gap-8"><div><h3 class="text-xl font-bold mb-4">MediCare Practice</h3><p class="text-gray-400 mb-4">Providing quality healthcare services with compassion and expertise.</p><div class="flex space-x-4"><a href="#" class="text-gray-400 hover:text-white transition">📘</a><a href="#" class="text-gray-400 hover:text-white transition">🐦</a><a href="#" class="text-gray-400 hover:text-white transition">📷</a></div></div><div><h4 class="text-lg font-semibold mb-4">Quick Links</h4><ul class="space-y-2"><li><a href="#" class="text-gray-400 hover:text-white transition">About Us</a></li><li><a href="#" class="text-gray-400 hover:text-white transition">Services</a></li><li><a href="#" class="text-gray-400 hover:text-white transition">Appointments</a></li><li><a href="#" class="text-gray-400 hover:text-white transition">Contact</a></li></ul></div><div><h4 class="text-lg font-semibold mb-4">Services</h4><ul class="space-y-2"><li><a href="#" class="text-gray-400 hover:text-white transition">General Medicine</a></li><li><a href="#" class="text-gray-400 hover:text-white transition">Cardiology</a></li><li><a href="#" class="text-gray-400 hover:text-white transition">Orthopedics</a></li><li><a href="#" class="text-gray-400 hover:text-white transition">Pediatrics</a></li></ul></div><div><h4 class="text-lg font-semibold mb-4">Contact Info</h4><div class="space-y-2 text-gray-400"><p>📍 123 Medical Center Dr.</p><p>📞 (555) 123-4567</p><p>✉️ info@medicare.com</p><p>🕒 Mon-Fri: 8AM-6PM</p></div></div></div><div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400"><p>&copy; 2024 MediCare Practice. All rights reserved.</p></div></div></footer>'
      },

      // Media Components
      {
        id: 'image-gallery',
        name: 'Image Gallery',
        category: 'media',
        description: 'Responsive image gallery',
        tags: ['gallery', 'images', 'responsive'],
        component: '<div class="py-16 bg-white"><div class="container mx-auto px-4"><h2 class="text-3xl font-bold text-center mb-12">Our Facility</h2><div class="grid grid-cols-1 md:grid-cols-3 gap-6"><div class="bg-gray-200 rounded-lg h-64 flex items-center justify-center hover:bg-gray-300 transition cursor-pointer"><span class="text-gray-500">Gallery Image 1</span></div><div class="bg-gray-200 rounded-lg h-64 flex items-center justify-center hover:bg-gray-300 transition cursor-pointer"><span class="text-gray-500">Gallery Image 2</span></div><div class="bg-gray-200 rounded-lg h-64 flex items-center justify-center hover:bg-gray-300 transition cursor-pointer"><span class="text-gray-500">Gallery Image 3</span></div></div></div></div>'
      },

      // Social Components
      {
        id: 'testimonials',
        name: 'Testimonials',
        category: 'social',
        description: 'Patient testimonials section',
        tags: ['testimonials', 'reviews', 'social', 'medical'],
        component: '<div class="py-16 bg-gray-50"><div class="container mx-auto px-4"><h2 class="text-3xl font-bold text-center mb-12">What Our Patients Say</h2><div class="grid grid-cols-1 md:grid-cols-3 gap-8"><div class="bg-white p-6 rounded-lg shadow-md"><div class="flex items-center mb-4"><div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4"><span class="text-blue-600 font-bold">JD</span></div><div><h4 class="font-semibold">John Doe</h4><div class="text-yellow-400">★★★★★</div></div></div><p class="text-gray-600 italic">"Excellent care and professional service. The staff is amazing and really cares about patients."</p></div><div class="bg-white p-6 rounded-lg shadow-md"><div class="flex items-center mb-4"><div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4"><span class="text-green-600 font-bold">SM</span></div><div><h4 class="font-semibold">Sarah Miller</h4><div class="text-yellow-400">★★★★★</div></div></div><p class="text-gray-600 italic">"Best medical practice in town. Always on time, thorough, and compassionate."</p></div><div class="bg-white p-6 rounded-lg shadow-md"><div class="flex items-center mb-4"><div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4"><span class="text-purple-600 font-bold">RJ</span></div><div><h4 class="font-semibold">Robert Johnson</h4><div class="text-yellow-400">★★★★★</div></div></div><p class="text-gray-600 italic">"Highly recommend! Modern facility with state-of-the-art equipment and caring staff."</p></div></div></div></div>'
      }
    ];

    res.json({
      success: true,
      components: componentLibrary,
      count: componentLibrary.length
    });

  } catch (error) {
    console.error('Get full component library error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load component library',
      error: error.message
    });
  }
};
