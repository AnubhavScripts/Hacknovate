import Automation from '../models/Automation.js';
import { classifyMessage, generateReply } from '../services/aiService.js';
import { 
  processIncomingMessage, 
  validateTwilioRequest, 
  generateTwiMLResponse 
} from '../services/whatsappService.js';
import Log from '../models/Log.js';

// POST /analyze-message
export const analyzeMessage = async (req, res) => {
  const { message, userId } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // 1. Classify + detect sentiment, priority, action
    const classification = await classifyMessage(message);

    // 2. Generate reply
    const reply = await generateReply(message, classification.type);

    const result = {
      type: classification.type,
      sentiment: classification.sentiment,
      priority: classification.priority,
      action: classification.action,
      reply,
    };

    // 3. Save log (best-effort — don't fail if DB is down)
    try {
      await Log.create({
        userId: userId && userId !== 'mock_user_001' ? userId : undefined,
        message,
        ...result,
        channel: 'simulation',
      });
    } catch (dbErr) {
      console.warn('Could not save log:', dbErr.message);
    }

    res.json(result);
  } catch (err) {
    console.error('analyzeMessage error:', err);
    res.status(500).json({ error: 'AI processing failed. Check your GROK_API_KEY.' });
  }
};

/**
 * Handle incoming WhatsApp messages from Twilio webhook
 * Twilio will POST to this endpoint when messages arrive in the sandbox
 * Validates the request, processes the message with AI, and sends an automated reply
 */
export const handleIncomingWhatsApp = async (req, res) => {
  try {
    const { automationId } = req.params;
    const { From, Body } = req.body;

    // ─── Step 1: Validate request ─────────────────────────────────────────────
    if (!From || !Body) {
      console.warn('❌ Incomplete WhatsApp message received:', req.body);
      return res.status(400).send('Missing From or Body');
    }

    // Validate Twilio request signature (optional but recommended for production)
    const twilioSignature = req.headers['x-twilio-signature'] || '';
    // Note: In development/sandbox, signature validation might fail - can be skipped
    // const isValidRequest = validateTwilioRequest(req.originalUrl, req.body, twilioSignature);
    // if (!isValidRequest) {
    //   console.warn('❌ Invalid Twilio request signature');
    //   return res.status(403).send('Invalid signature');
    // }

    // ─── Step 2: Find and validate automation ────────────────────────────────
    const automation = await Automation.findById(automationId);
    if (!automation || automation.status !== 'active') {
      console.warn('⚠️ Automation not found or not active:', automationId);
      // Still return 200 to Twilio to prevent retries
      res.type('text/xml');
      return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for reaching out. This automation is currently unavailable.</Message>
</Response>`);
    }

    const userId = automation.userId;
    const flowType = automation.selectedOptions[0] || 'general';

    console.log(`📱 Incoming WhatsApp from ${From}: "${Body}" for automation ${automationId} (Flow: ${flowType})`);

    // ─── Step 3: Process message with AI ───────────────────────────────────────
    const { classification, reply } = await processIncomingMessage(Body, flowType);

    // ─── Step 4: Save to database for audit trail ─────────────────────────────
    try {
      await Log.create({
        userId,
        message: Body,
        sentiment: classification?.sentiment || 'neutral',
        priority: classification?.priority || 'medium',
        action: classification?.action || 'Message processed',
        type: classification?.type || 'query',
        reply,
        channel: 'whatsapp',
        from: From,
        automationId,
        timestamp: new Date(),
      });
      console.log('✅ Message logged to database');
    } catch (dbErr) {
      console.warn('⚠️ Could not save log to database:', dbErr.message);
      // Don't fail the request if logging fails
    }

    // ─── Step 5: Return TwiML response to Twilio ──────────────────────────────
    // This sends the automated reply back to the customer via WhatsApp
    res.type('text/xml');
    const twiml = generateTwiMLResponse(reply);
    res.send(twiml);
    
    console.log(`✅ Reply sent to ${From}`);
  } catch (err) {
    console.error('❌ handleIncomingWhatsApp error:', err);
    // Return a TwiML response instead of error to prevent Twilio retries
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for your message. Please try again later.</Message>
</Response>`);
  }
};

// Helper function to escape XML special characters (kept for backward compatibility)
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
