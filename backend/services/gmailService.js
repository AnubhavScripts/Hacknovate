import { google } from 'googleapis';

/**
 * Send an email via Gmail API using the user's OAuth access token.
 * @param {string} accessToken - Google OAuth access token
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Plain-text email body
 */
export async function sendEmail(accessToken, to, subject, message) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GMAIL_CALLBACK_URL || 'http://localhost:8000/auth/gmail/callback'
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // RFC 2822 email format
  const raw = makeRaw(to, subject, message);

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  return response.data;
}

function makeRaw(to, subject, body) {
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    body,
  ];
  const message = messageParts.join('\n');
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
