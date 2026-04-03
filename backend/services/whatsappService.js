import twilio from 'twilio';
import { classifyMessage, generateReply } from './aiService.js';

const hasTwilioCreds =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid';

const client = hasTwilioCreds
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Send a WhatsApp message via Twilio.
 * Falls back to a mock response if Twilio credentials are not configured.
 * @param {string} to - Recipient WhatsApp number (e.g. whatsapp:+919876543210 or +919876543210)
 * @param {string} message - Message body
 * @returns {Promise<Object>} Message response object
 */
export async function sendWhatsApp(to, message) {
  if (!client) {
    // Mock response
    console.log(`[WHATSAPP MOCK] To: ${to} | Message: ${message.slice(0, 60)}...`);
    return {
      mocked: true,
      sid: `MOCK_${Date.now()}`,
      to,
      body: message,
      status: 'queued',
      timestamp: new Date(),
    };
  }

  try {
    // Ensure the number has the whatsapp: prefix
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
      to: formattedTo,
      body: message,
    });

    console.log(`✅ WhatsApp message sent to ${formattedTo} | SID: ${result.sid}`);
    return { 
      sid: result.sid, 
      status: result.status,
      timestamp: new Date(),
    };
  } catch (err) {
    console.error('❌ Failed to send WhatsApp message:', {
      to,
      error: err.message,
      code: err.code,
    });
    throw new Error(`WhatsApp send failed: ${err.message}`);
  }
}

/**
 * Validate Twilio webhook request signature to ensure authenticity
 * @param {string} url - The request URL
 * @param {Object} body - The request body
 * @param {string} signature - The X-Twilio-Signature header value
 * @returns {boolean} True if signature is valid
 */
export function validateTwilioRequest(url, body, signature) {
  if (!hasTwilioCreds) {
    // Skip validation if no credentials configured
    return true;
  }

  try {
    // Create a Twilio request validator
    const validator = twilio.webhook(process.env.TWILIO_AUTH_TOKEN);
    
    // Validate the request - returns true if valid
    return validator.isValidRequest(url, body, signature);
  } catch (err) {
    console.error('❌ Twilio validation error:', err.message);
    return false;
  }
}

/**
 * Process incoming WhatsApp message and generate automated reply
 * Handles message classification and AI-generated responses
 * @param {string} message - The incoming message body
 * @param {string} flowType - The automation flow type (e.g., 'support', 'sales')
 * @returns {Promise<Object>} Classification and reply object
 */
export async function processIncomingMessage(message, flowType = 'general') {
  try {
    console.log(`📱 Processing WhatsApp message: "${message.slice(0, 50)}..."`);
    
    // Step 1: Classify the incoming message
    const classification = await classifyMessage(message, flowType);
    console.log(`✅ Message classified as: ${classification.type} (Priority: ${classification.priority})`);
    
    // Step 2: Generate an appropriate reply
    const reply = await generateReply(message, classification.type, flowType);
    console.log(`✅ Reply generated: "${reply.slice(0, 50)}..."`);
    
    return {
      classification,
      reply,
      success: true,
    };
  } catch (err) {
    console.error('❌ Error processing incoming message:', err.message);
    return {
      success: false,
      error: err.message,
      reply: 'Thank you for reaching out. Our team will get back to you shortly.',
    };
  }
}

/**
 * Format reply for TwiML XML response (escapes special characters)
 * @param {string} message - The message to escape
 * @returns {string} XML-safe message
 */
export function escapeForXml(message) {
  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate TwiML response for Twilio WhatsApp
 * @param {string} replyMessage - The message to send back
 * @returns {string} TwiML XML response
 */
export function generateTwiMLResponse(replyMessage) {
  const safeMessage = escapeForXml(replyMessage);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${safeMessage}</Message>
</Response>`;
}
