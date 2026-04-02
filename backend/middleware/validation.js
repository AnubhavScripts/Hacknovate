import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for message analysis endpoints
 * Prevents API spam and abuse
 */
export const analyzeMessageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP
  message: 'Too many requests to message analysis. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip auth'd requests (allow more for authenticated users)
  skip: (req) => !!req.user || req.headers['x-api-key'],
});

/**
 * Rate limiter for logs retrieval
 */
export const logsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // More lenient for read operations
  message: 'Too many requests to logs endpoint.',
});

/**
 * Rate limiter for webhook endpoints
 * Stricter to prevent abuse
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Allow higher volume for webhooks
  message: 'Too many webhook requests.',
  skip: (req) => {
    // Skip rate limiting for valid Pub/Sub/Twilio requests
    const hasTwilioSig = !!req.headers['x-twilio-signature'];
    const hasAuthToken = !!req.headers['authorization'];
    return hasTwilioSig || hasAuthToken;
  },
});

/**
 * Validate message payload
 */
export const validateMessage = (req, res, next) => {
  const { message, userId } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required and must be a string' });
  }

  // Check message length
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  if (trimmed.length > 10000) {
    return res.status(400).json({ error: 'Message is too long (max 10000 characters)' });
  }

  // Validate userId if provided
  if (userId && !/^[0-9a-f]{24}$/i.test(userId)) {
    return res.status(400).json({ error: 'Invalid userId format' });
  }

  // Add to request for later use
  req.validatedMessage = trimmed;
  req.validatedUserId = userId || 'demo_user';

  next();
};

/**
 * Validate automation parameters
 */
export const validateAutomationId = (req, res, next) => {
  const { automationId } = req.params;

  if (!automationId || !/^[0-9a-f]{24}$/i.test(automationId)) {
    return res.status(400).json({ error: 'Invalid automationId format' });
  }

  next();
};
