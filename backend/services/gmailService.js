import { google } from 'googleapis';

/**
 * Send an email via Gmail API using the user's OAuth access token.
 * @param {string} accessToken - Google OAuth access token
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - HTML or plain-text email body
 * @param {boolean} isHtml - Whether message is HTML (default: true)
 */
export async function sendEmail(accessToken, to, subject, message, isHtml = true) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GMAIL_CALLBACK_URL || 'http://localhost:8000/auth/gmail/callback'
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // RFC 2822 email format with HTML support
  const raw = makeRaw(to, subject, message, isHtml);

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  return response.data;
}

/**
 * Get new unread messages from Gmail inbox
 * @param {string} accessToken - Google OAuth access token
 * @param {string} lastChecked - ISO date string of last check
 * @returns {Array} List of new messages
 */
export async function getNewEmails(accessToken, lastChecked) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GMAIL_CALLBACK_URL || 'http://localhost:8000/auth/gmail/callback'
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const after = Math.floor(new Date(lastChecked).getTime() / 1000);

  const response = await gmail.users.messages.list({
    userId: 'me',
    q: `is:unread after:${after}`,
    maxResults: 10,
  });

  const messages = [];
  for (const msg of response.data.messages || []) {
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    });
    const body = getMessageBody(message.data);
    const subject = getMessageHeader(message.data, 'Subject');
    const from = getMessageHeader(message.data, 'From');
    messages.push({
      id: msg.id,
      subject,
      from,
      body,
      timestamp: new Date(parseInt(message.data.internalDate)),
    });
  }

  return messages;
}

function getMessageBody(message) {
  let body = '';
  if (message.payload.body.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString();
  } else if (message.payload.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body.data) {
        body = Buffer.from(part.body.data, 'base64').toString();
        break;
      }
    }
  }
  return body;
}

function getMessageHeader(message, headerName) {
  const headers = message.payload.headers;
  const header = headers.find(h => h.name === headerName);
  return header ? header.value : '';
}

/**
 * Create RFC 2822 formatted email and encode it for Gmail API
 * Supports both HTML and plain text emails
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email body (HTML or plain text)
 * @param {boolean} isHtml - Whether message is HTML
 * @returns {string} Base64 URL-safe encoded email
 */
function makeRaw(to, subject, message, isHtml = true) {
  const contentType = isHtml 
    ? 'text/html; charset="UTF-8"' 
    : 'text/plain; charset="UTF-8"';

  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: ${contentType}`,
    'Content-Transfer-Encoding: base64',
    '',
    message,
  ].join('\r\n');

  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Format a plain text reply into a professional HTML email
 * @param {string} plainTextReply - The AI-generated plain text reply
 * @param {string} senderName - Name of the merchant/sender (optional)
 * @returns {string} HTML formatted email ready to send
 */
export function formatEmailAsHtml(plainTextReply, senderName = 'Customer Support Team') {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 20px;">
    <div style="background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; max-width: 600px; margin: 0 auto;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 600;">Thank You for Contacting Us</h2>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
            <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">Hello,</p>
            
            <div style="background-color: #f5f5f5; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; line-height: 1.8; white-space: pre-wrap; color: #333;">
${plainTextReply}
                </p>
            </div>

            <p style="margin: 30px 0 10px 0; color: #666; font-size: 14px;">Best regards,</p>
            <p style="margin: 0 0 5px 0; font-weight: 600; color: #333; font-size: 15px;">${senderName}</p>
            <p style="margin: 0; color: #999; font-size: 13px;">Automated Response System</p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9f9; border-top: 1px solid #e0e0e0; padding: 20px 30px; text-align: center; font-size: 12px; color: #999;">
            <p style="margin: 0 0 10px 0;">This is an automated response. Please do not reply to this email.</p>
            <p style="margin: 0; color: #bbb;">© ${currentYear} MerchantAI. All rights reserved.</p>
        </div>

    </div>
</body>
</html>
  `.trim();
}

/**
 * Subscribe to Gmail push notifications for real-time email processing
 * Requires Google Cloud Pub/Sub to be set up
 * @param {string} accessToken - Google OAuth access token
 * @param {string} topicName - Google Cloud Pub/Sub topic name (e.g., 'projects/YOUR_PROJECT/topics/gmail-notifications')
 * @param {string} userId - User ID to include in notification payload
 * @returns {Object} Subscription response
 */
export async function subscribeToGmailNotifications(accessToken, topicName, userId) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GMAIL_CALLBACK_URL || 'http://localhost:8000/auth/gmail/callback'
    );

    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Subscribe to Gmail notifications
    // The labelIds ensures we only watch new emails in INBOX
    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName, // Google Cloud Pub/Sub topic
        labelIds: ['INBOX'], // Only watch INBOX label
      },
    });

    console.log(`✅ Gmail notification subscription successful:`, response.data);
    console.log(`   Topic: ${topicName}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Watch expiration: ${new Date(response.data.expiration).toISOString()}`);
    
    return response.data;
  } catch (err) {
    console.error('Failed to subscribe to Gmail notifications:', err.message);
    throw err;
  }
}

/**
 * Unsubscribe from Gmail push notifications
 * @param {string} accessToken - Google OAuth access token
 * @returns {void}
 */
export async function unsubscribeFromGmailNotifications(accessToken) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GMAIL_CALLBACK_URL || 'http://localhost:8000/auth/gmail/callback'
    );

    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Stop watching for notifications
    const response = await gmail.users.stop({
      userId: 'me',
    });

    console.log(`✅ Gmail notification unsubscribed successfully`);
    return response.data;
  } catch (err) {
    console.error('Failed to unsubscribe from Gmail notifications:', err.message);
    throw err;
  }
}
