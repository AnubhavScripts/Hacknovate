/**
 * API Key Authentication Middleware
 * Validates API key in Authorization header or x-api-key header
 */
export const verifyApiKey = (req, res, next) => {
  // Skip auth for localhost development
  const isDev = process.env.NODE_ENV === 'development' && req.hostname.includes('localhost');
  
  // Allow unauthenticated for OAuth endpoints
  const noAuthPaths = ['/auth/google', '/auth/gmail', '/auth/logout'];
  if (noAuthPaths.some(path => req.path.includes(path))) {
    return next();
  }

  // For authenticated endpoints, check API key if in production or if user provides one
  const apiKey = req.headers['x-api-key'] || 
                 req.headers['authorization']?.replace('Bearer ', '');
  
  const expectedKey = process.env.API_KEY;

  // In dev mode, skip API key validation entirely (localhost only)
  if (isDev) {
    return next();
  }

  // In production, require valid API key
  if (!expectedKey || expectedKey === 'your-secret-api-key-32-chars-min-generated') {
    console.error('❌ API_KEY not configured in production mode!');
    return res.status(401).json({ 
      error: 'API_KEY not configured',
      message: 'Set API_KEY environment variable in production'
    });
  }

  // If key is configured in production, validate it
  if (expectedKey && expectedKey !== 'your-secret-api-key-32-chars-min-generated') {
    if (!apiKey || apiKey !== expectedKey) {
      console.warn(`🚨 Unauthorized API request from ${req.ip}`);
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or missing API key. Include x-api-key header or Authorization: Bearer <key>'
      });
    }
  }

  next();
};

/**
 * Validate Twilio Webhook Request Signature
 * Ensures request came from Twilio, not a spoofed source
 */
export const validateTwilioSignature = async (req, res, next) => {
  const signature = req.headers['x-twilio-signature'] || '';
  const url = `${process.env.TWILIO_WEBHOOK_URL || 'http://localhost:8000'}${req.originalUrl}`;
  
  const { validateTwilioRequest } = await import('../services/whatsappService.js');
  
  if (validateTwilioRequest(url, req.body, signature)) {
    return next();
  }

  console.warn(`🚨 Invalid Twilio signature from ${req.ip}`);
  res.status(403).json({ error: 'Invalid Twilio signature' });
};

/**
 * Validate Pub/Sub Webhook Request
 * Ensures request came from Google Cloud Pub/Sub
 */
export const validatePubSubToken = (req, res, next) => {
  const token = req.get('Authorization')?.replace('Bearer ', '');
  const expectedToken = process.env.PUBSUB_VERIFICATION_TOKEN;

  // If no token configured, skip validation (dev mode)
  if (!expectedToken || expectedToken === 'pubsub-verification-token') {
    console.warn('⚠️  PUBSUB_VERIFICATION_TOKEN not configured. Skipping Pub/Sub validation.');
    return next();
  }

  if (!token || token !== expectedToken) {
    console.warn(`🚨 Invalid Pub/Sub token from ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};
