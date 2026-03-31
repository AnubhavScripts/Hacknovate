import twilio from 'twilio';

const hasTwilioCreds =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_ACCOUNT_SID !== 'your_twilio_account_sid';

const client = hasTwilioCreds
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Send a WhatsApp message via Twilio.
 * Falls back to a mock response if Twilio credentials are not configured.
 * @param {string} to - Recipient WhatsApp number (e.g. whatsapp:+919876543210)
 * @param {string} message - Message body
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
    };
  }

  const result = await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
    body: message,
  });

  return { sid: result.sid, status: result.status };
}
