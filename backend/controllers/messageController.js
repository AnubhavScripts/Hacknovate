import { classifyMessage, generateReply } from '../services/aiService.js';
import { sendWhatsApp } from '../services/whatsappService.js';
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
    res.status(500).json({ error: 'AI processing failed. Check your OPENAI_API_KEY.' });
  }
};

/**
 * Handle incoming WhatsApp messages from Twilio webhook
 * Twilio will POST to this endpoint when messages arrive
 */
export const handleIncomingWhatsApp = async (req, res) => {
  try {
    const { From, Body } = req.body;

    if (!From || !Body) {
      console.warn('Incomplete WhatsApp message received:', req.body);
      return res.status(400).send('Missing From or Body');
    }

    console.log(`📱 Incoming WhatsApp from ${From}: ${Body}`);

    // Classify the incoming message
    const classification = await classifyMessage(Body);
    
    // Generate a reply
    const reply = await generateReply(Body, classification.type);

    // Save log
    try {
      await Log.create({
        message: Body,
        sentiment: classification.sentiment,
        priority: classification.priority,
        action: classification.action,
        type: classification.type,
        reply,
        channel: 'whatsapp',
        from: From,
      });
    } catch (dbErr) {
      console.warn('Could not save log:', dbErr.message);
    }

    // Send reply back via WhatsApp
    await sendWhatsApp(From, reply);

    // Twilio expects a 200 response with TwiML (XML format)
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(reply)}</Message>
</Response>`);
  } catch (err) {
    console.error('handleIncomingWhatsApp error:', err);
    res.status(500).send('Error processing message');
  }
};

// Helper function to escape XML special characters
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
