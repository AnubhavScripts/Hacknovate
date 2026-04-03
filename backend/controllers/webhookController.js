import { getNewEmails, sendEmail, formatEmailAsHtml } from '../services/gmailService.js';
import { classifyMessage, generateReply } from '../services/aiService.js';
import Automation from '../models/Automation.js';
import Log from '../models/Log.js';
import User from '../models/User.js';

/**
 * Webhook endpoint to receive Gmail notifications from Google Cloud Pub/Sub
 * Triggered automatically when a new email arrives (after gmail.users.watch() is called)
 *
 * Note: We do NOT validate the Pub/Sub OIDC token here because Google signs
 * those with its own service-account certificates, not a shared secret.
 * Security comes from the push URL itself being a secret.
 * Always respond 2xx so Pub/Sub stops retrying.
 */
export const handleGmailWebhook = async (req, res) => {
  try {

    // Pub/Sub sends message in a specific format
    const message = req.body.message;
    if (!message) {
      return res.status(400).json({ error: 'No message in request' });
    }

    // Message data is base64 encoded
    const decodedData = JSON.parse(
      Buffer.from(message.data, 'base64').toString()
    );

    // The message contains the user ID (you passed this when subscribing)
    const { userId, emailAddress } = decodedData || {};
    if (!userId) {
      console.warn('⚠️ No userId in Pub/Sub message');
      return res.json({ success: true }); // Acknowledge to Pub/Sub
    }

    console.log(`📧 Received Gmail notification for user: ${userId}`);

    // Fetch user and automation
    const user = await User.findById(userId);
    if (!user || !user.gmailAccessToken) {
      console.warn(`⚠️ User ${userId} not found or Gmail not connected`);
      return res.json({ success: true });
    }

    const automation = await Automation.findOne({ userId });
    if (!automation || automation.status !== 'active' || !automation.connectedChannels?.gmail) {
      console.warn(`⚠️ Automation not found or inactive for user ${userId}`);
      return res.json({ success: true });
    }

    // Get new emails since last check
    const lastChecked = automation.lastEmailCheck || new Date(Date.now() - 5 * 60000); // Last 5 min
    let newEmails = [];
    
    try {
      newEmails = await getNewEmails(user.gmailAccessToken, lastChecked);
    } catch (gmailErr) {
      console.error('❌ Failed to fetch emails:', gmailErr.message);
      // Return success to Pub/Sub to avoid redelivery, but don't process
      return res.json({ success: true });
    }

    if (newEmails.length === 0) {
      console.log('ℹ️ No new emails to process');
      return res.json({ success: true });
    }

    // Process each email
    const flowType = automation.selectedOptions?.[0] || 'general';
    let processed = 0;

    for (const email of newEmails) {
      try {
        // Skip emails we've already replied to
        if (email.subject.startsWith('Re:')) {
          console.log(`⏭️ Skipping email - already a reply: ${email.subject}`);
          continue;
        }

        console.log(`📨 Processing email from: ${email.from}`);

        // Classify the message
        const classification = await classifyMessage(email.body, flowType);
        console.log(`📊 Classification: ${classification.type} (${classification.sentiment})`);

        // Generate AI reply
        const reply = await generateReply(email.body, classification.type, flowType);
        console.log(`💬 Generated reply length: ${reply.length} chars`);

        // Format as professional HTML
        const htmlEmail = formatEmailAsHtml(reply, user.name || 'Customer Support Team');

        // Send the reply
        await sendEmail(user.gmailAccessToken, email.from, `Re: ${email.subject}`, htmlEmail, true);
        console.log(`✅ Reply sent to ${email.from}`);

        // Log the interaction
        await Log.create({
          userId: user._id,
          automationId: automation._id,
          message: email.body,
          type: classification.type,
          sentiment: classification.sentiment,
          priority: classification.priority,
          action: classification.action,
          reply,
          channel: 'email',
          from: email.from,
          subject: email.subject,
        });

        processed++;
      } catch (emailErr) {
        console.error(`❌ Error processing email from ${email.from}:`, emailErr.message);
        // Continue processing other emails
      }
    }

    // Update last checked time
    automation.lastEmailCheck = new Date();
    await automation.save();

    console.log(`✨ Webhook completed: Processed ${processed} emails`);
    res.json({ success: true, processed });

  } catch (err) {
    console.error('❌ Webhook error:', err.message);
    // Always return 200 to acknowledge the message to Pub/Sub
    // Otherwise it will retry indefinitely
    res.status(200).json({ error: err.message });
  }
};

/**
 * Optional: Health check endpoint for Pub/Sub
 */
export const webhookHealth = (req, res) => {
  res.json({ status: 'ok', service: 'gmail-webhook' });
};
