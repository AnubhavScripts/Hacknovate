import twilio from 'twilio';

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
