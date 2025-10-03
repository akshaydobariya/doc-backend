const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/webhookController');
const WebhookMiddleware = require('../middleware/webhook');
const { isAuthenticated, hasRole } = require('../middleware/auth');

// Apply rate limiter to all webhook routes
router.use(WebhookMiddleware.rateLimiter);

// Setup webhook for a doctor's calendar
router.post('/setup',
  isAuthenticated,
  hasRole(['doctor']),
  WebhookController.setupWebhook
);

// Handle webhook notifications from Google Calendar
router.post('/notify',
  WebhookMiddleware.preserveRawBody,
  WebhookMiddleware.validateWebhook,
  WebhookController.handleWebhook
);

// Renew webhook subscription
router.post('/renew',
  isAuthenticated,
  hasRole(['doctor']),
  WebhookController.renewWebhook
);

// Stop webhook subscription
router.post('/stop',
  isAuthenticated,
  hasRole(['doctor']),
  WebhookController.stopWebhook
);

// Error handler for webhook routes
router.use(WebhookMiddleware.errorHandler);

module.exports = router;