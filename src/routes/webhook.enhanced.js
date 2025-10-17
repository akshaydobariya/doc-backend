const express = require('express');
const router = express.Router();
const EnhancedWebhookController = require('../controllers/webhookController.enhanced');
const WebhookMiddleware = require('../middleware/webhook');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Apply rate limiter to all webhook routes
router.use(WebhookMiddleware.rateLimiter);

// Setup webhook for a doctor's calendar
router.post('/setup',
  isAuthenticated,
  hasRole(['doctor']),
  EnhancedWebhookController.setupWebhook
);

// Handle webhook notifications from Google Calendar
router.post('/notify',
  WebhookMiddleware.preserveRawBody,
  WebhookMiddleware.validateWebhook,
  EnhancedWebhookController.handleWebhook
);

// Renew webhook subscription
router.post('/renew',
  isAuthenticated,
  hasRole(['doctor']),
  EnhancedWebhookController.renewWebhook
);

// Stop webhook subscription
router.post('/stop',
  isAuthenticated,
  hasRole(['doctor']),
  EnhancedWebhookController.stopWebhook
);

// Check webhook status
router.get('/status',
  isAuthenticated,
  hasRole(['doctor']),
  EnhancedWebhookController.checkWebhookStatus
);

// Check and renew expiring webhooks (admin/cron)
router.post('/check-and-renew',
  EnhancedWebhookController.checkAndRenewExpiring
);

// Error handler for webhook routes
router.use(WebhookMiddleware.errorHandler);

module.exports = router;
