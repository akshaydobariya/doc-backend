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
      // In production, allow for now to diagnose issues
      callback(null, true);
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
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  console.log('Cookies:', req.headers.cookie);
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    // Initialize webhook monitor after MongoDB connection
    // Only in non-test and non-Vercel environments (Vercel uses serverless)
    if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
      try {
        const webhookMonitor = require('./services/webhookMonitor.enhanced');
        webhookMonitor.start();
        console.log('✅ Webhook monitor initialized - auto-renewal enabled');
        console.log('   📅 Checks every 6 hours for expiring webhooks');
      } catch (error) {
        console.error('⚠️  Webhook monitor failed to start:', error.message);
        console.error('   Continuing without automatic webhook renewal');
        console.error('   Manual renewal will be required via API endpoint');
      }
    } else {
      console.log('ℹ️  Webhook monitor skipped (Vercel serverless environment)');
      console.log('   Use API endpoint /api/webhook/check-and-renew for manual renewal');
    }
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calendar');
const appointmentRoutes = require('./routes/appointments');
const usersRoutes = require('./routes/users');
const availabilityRoutes = require('./routes/availability');

// Use enhanced webhook routes with optimizations
let webhookRoutes;
try {
  webhookRoutes = require('./routes/webhook.enhanced');
  console.log('✅ Using enhanced webhook routes (optimized)');
} catch (error) {
  console.warn('⚠️  Enhanced webhook routes not found, using standard routes');
  webhookRoutes = require('./routes/webhook');
}

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/availability', availabilityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic route for testing
app.get('/', (req, res) => {
  res.json({
    message: 'Dental Appointment Booking API - Optimized Version',
    version: '2.0.0',
    optimizations: {
      lazyCalendarSync: true,
      incrementalWebhookSync: true,
      autoWebhookRenewal: !process.env.VERCEL
    }
  });
});

const PORT = process.env.PORT || 5000;

// Only start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base: http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
