const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Trust proxy for production (Vercel, Heroku, etc.)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.includes('/public/page/')) {
    console.log(`🌐 PUBLIC PAGE REQUEST: ${req.method} ${req.path}`);
    console.log(`🔍 Path parts:`, req.path.split('/'));
  }
  next();
});

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://doc-fronted-psi.vercel.app',
      'https://patient-flow-delta.vercel.app', // Patient booking widget
      'http://localhost:3000',
      'http://localhost:3001'
    ].filter(Boolean);

    console.log('Request from origin:', origin);
    console.log('Allowed origins:', allowedOrigins);

    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('Origin not in whitelist:', origin);
      // Block unauthorized origins in production
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours cache for preflight
};

app.use(cors(corsOptions));

// Session configuration - CRITICAL for production cross-domain cookies
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 7 * 24 * 60 * 60, // 7 days
    touchAfter: 24 * 3600, // Lazy session update
    crypto: {
      secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production'
    }
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for production, 'lax' for localhost
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
    // Do NOT set domain - let browser handle it automatically
  },
  name: 'sessionId', // Custom session cookie name
  proxy: true, // Trust the reverse proxy
  rolling: true // Reset maxAge on every request
}));

// Session debugging middleware
app.use((req, res, next) => {
  if (req.path.includes('public/page')) {
    console.log(`🔥 REQUEST TO PUBLIC PAGE: ${req.method} ${req.path}`);
    console.log(`🔥 Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  }
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calendar');
const appointmentRoutes = require('./routes/appointments');
const webhookRoutes = require('./routes/webhook');
const usersRoutes = require('./routes/users');
const availabilityRoutes = require('./routes/availability');
const pageRoutes = require('./routes/pages');
const websiteRoutes = require('./routes/websites');
const servicesRoutes = require('./routes/services');
const servicePagesRoutes = require('./routes/servicePages');
const blogsRoutes = require('./routes/blogs');
const unifiedContentRoutes = require('./routes/unifiedContent');
const dynamicSitesRoutes = require('./routes/dynamicSites');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/services', servicesRoutes); // Move services route BEFORE pageRoutes
app.use('/api/service-pages', servicePagesRoutes); // Service page editing routes
app.use('/api/blogs', blogsRoutes); // Blog management and public access routes
app.use('/api/unified-content', unifiedContentRoutes); // Unified content management routes
app.use('/api/websites', websiteRoutes); // Website management routes
app.use('/api/dynamic', dynamicSitesRoutes); // Dynamic site serving routes

// Blog cards injection middleware - adds blog cards to service page responses
app.use((req, res, next) => {
  if (req.path.includes('/public/page/') && req.method === 'GET') {
    const originalSend = res.json;
    res.json = function(data) {
      if (data && data.success && data.data && data.data.serviceId && !data.data.blogs) {
        console.log('🔧 Injecting blog cards into service page response');

        // Dynamically add blogs to the response
        (async () => {
          try {
            const Blog = require('./src/models/Blog');
            const pathParts = req.path.split('/');
            const websiteId = pathParts[pathParts.length - 2];

            const blogs = await Blog.find({
              serviceId: data.data.serviceId._id || data.data.serviceId,
              websiteId: websiteId,
              isPublished: true
            })
            .select('_id title slug introduction readingTime wordCount url publishedAt featured')
            .sort({ publishedAt: -1 })
            .limit(6)
            .lean();

            const blogCards = blogs.map(blog => ({
              id: blog._id,
              title: blog.title,
              slug: blog.slug,
              summary: blog.introduction || 'Read this comprehensive guide about the treatment.',
              readingTime: blog.readingTime || 5,
              wordCount: blog.wordCount || 500,
              url: blog.url || `/blog/${blog.slug}`,
              publishedAt: blog.publishedAt,
              featured: blog.featured || false
            }));

            console.log(`✅ Added ${blogCards.length} blog cards to service page response`);
            data.data.blogs = blogCards;
            originalSend.call(this, data);
          } catch (error) {
            console.error('❌ Error injecting blog cards:', error.message);
            originalSend.call(this, data);
          }
        })();
        return;
      }
      originalSend.call(this, data);
    };
  }
  next();
});

app.use('/api', pageRoutes); // Destack page builder routes (catch-all should be last)

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Dental Appointment Booking API' });
});

const PORT = process.env.PORT || 5000;

// Only start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;