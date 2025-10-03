const WebhookUtils = require('../utils/WebhookUtils');

/**
 * Middleware for handling webhook requests
 */
class WebhookMiddleware {
  /**
   * Validate webhook request headers and signature
   */
  static validateWebhook(req, res, next) {
    try {
      // Get raw body from request
      const rawBody = req.rawBody;
      
      if (!WebhookUtils.validateHeaders(req.headers)) {
        return res.status(400).json({
          error: 'Invalid webhook headers'
        });
      }

      // Verify signature if present
      const signature = req.headers['x-goog-signature'] || 
                       req.headers['x-goog-signature'.toLowerCase()];
      
      if (signature && !WebhookUtils.verifySignature(
        signature,
        rawBody,
        process.env.WEBHOOK_SECRET
      )) {
        return res.status(401).json({
          error: 'Invalid webhook signature'
        });
      }

      // Add webhook metadata to request
      req.webhook = {
        channelId: req.headers['x-goog-channel-id'] || 
                  req.headers['x-goog-channel-id'.toLowerCase()],
        resourceId: req.headers['x-goog-resource-id'] || 
                   req.headers['x-goog-resource-id'.toLowerCase()],
        resourceState: req.headers['x-goog-resource-state'] || 
                      req.headers['x-goog-resource-state'.toLowerCase()],
        messageNumber: parseInt(
          req.headers['x-goog-message-number'] || 
          req.headers['x-goog-message-number'.toLowerCase()]
        ),
        type: WebhookUtils.getNotificationType(req.headers)
      };

      next();
    } catch (error) {
      console.error('Webhook validation error:', error);
      res.status(500).json({
        error: 'Webhook validation failed'
      });
    }
  }

  /**
   * Preserve raw body for signature verification
   */
  static preserveRawBody(req, res, next) {
    let data = '';
    req.setEncoding('utf8');

    req.on('data', chunk => {
      data += chunk;
    });

    req.on('end', () => {
      req.rawBody = data;
      next();
    });
  }

  /**
   * Rate limiting for webhook endpoints
   */
  static rateLimiter(req, res, next) {
    // Implement rate limiting logic here
    // This is a simple example - in production, use Redis or similar
    const maxRequests = 100; // Max requests per minute
    const currentTime = Math.floor(Date.now() / 60000); // Current minute
    const key = `${req.ip}-${currentTime}`;

    // In production, use Redis to store and check rate limits
    if (global.webhookRateLimit && global.webhookRateLimit[key] > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests'
      });
    }

    // Update rate limit counter
    global.webhookRateLimit = global.webhookRateLimit || {};
    global.webhookRateLimit[key] = (global.webhookRateLimit[key] || 0) + 1;

    next();
  }

  /**
   * Error handling for webhook endpoints
   */
  static errorHandler(err, req, res, next) {
    console.error('Webhook error:', err);
    res.status(500).json({
      error: 'Internal webhook error',
      message: err.message
    });
  }
}

module.exports = WebhookMiddleware;