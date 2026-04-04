import Automation from '../models/Automation.js';
import User from '../models/User.js';
import { getNewEmails, sendEmail, subscribeToGmailNotifications, unsubscribeFromGmailNotifications, formatEmailAsHtml } from '../services/gmailService.js';
import { classifyMessage, generateReply } from '../services/aiService.js';
import Log from '../models/Log.js';
import { checkEscalation, determineAction, getDefaultRules } from '../services/ruleEngine.js';
import { escalateMessage } from '../services/escalationService.js';

// ─── Save onboarding automation config ───────────────────────────────────────
export const saveAutomation = async (req, res) => {
  try {
    const { userId, selectedOptions, connectedChannels, status } = req.body;

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if automation exists
    let automation = await Automation.findOne({ userId });
    const isNewAutomation = !automation;

    // Upsert — one automation per user
    automation = await Automation.findOneAndUpdate(
      { userId },
      { 
        selectedOptions, 
        connectedChannels, 
        status: status || 'active',
        // ✨ Initialize default rules if new automation
        ...(isNewAutomation && { rules: getDefaultRules() }),
      },
      { upsert: true, new: true }
    );

    console.log(`${isNewAutomation ? '🆕' : '📝'} Automation ${isNewAutomation ? 'created' : 'updated'} for user ${userId}`);

    // Subscribe to Gmail push notifications if Gmail is connected
    if (connectedChannels?.gmail && user.gmailAccessToken && process.env.GMAIL_WEBHOOK_TOPIC) {
      try {
        console.log('📧 Subscribing to Gmail notifications...');
        await subscribeToGmailNotifications(user.gmailAccessToken, process.env.GMAIL_WEBHOOK_TOPIC, userId);
        console.log('✅ Gmail webhook subscription successful');
      } catch (subscribeErr) {
        console.warn('⚠️ Could not subscribe to Gmail webhooks (deployment may not support it):', subscribeErr.message);
        // Don't fail the whole request if webhooks aren't available
      }
    }

    // Mark user as onboarded
    if (userId && userId !== 'mock_user_001') {
      await User.findByIdAndUpdate(userId, { isOnboarded: true });
    }

    res.json({ 
      success: true, 
      automation,
      message: isNewAutomation ? 'Automation created with default rules' : 'Automation updated',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Get automation config for a user ────────────────────────────────────────
export const getAutomation = async (req, res) => {
  try {
    const { userId } = req.params;
    const automation = await Automation.findOne({ userId });
    if (!automation) return res.status(404).json({ error: 'No automation found' });
    res.json(automation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Process emails for an automation ────────────────────────────────────────
export const processEmails = async (req, res) => {
  try {
    const { automationId } = req.params;
    const automation = await Automation.findById(automationId).populate('userId');
    if (!automation || automation.status !== 'active' || !automation.connectedChannels.gmail) {
      return res.status(404).json({ error: 'Automation not found or not active or Gmail not connected' });
    }

    const user = automation.userId;
    if (!user.gmailAccessToken) {
      return res.status(400).json({ error: 'Gmail not connected for user' });
    }

    let newEmails = [];
    try {
      const lastChecked = automation.lastEmailCheck || new Date(0);
      newEmails = await getNewEmails(user.gmailAccessToken, lastChecked);
    } catch (gmailErr) {
      // Handle insufficient permissions or invalid token
      if (gmailErr.status === 403 || gmailErr.code === 403) {
        console.error('❌ Gmail API Permission Error - Token needs re-authorization');
        return res.status(403).json({ 
          error: 'Gmail permission expired. Please re-connect your Gmail account in Settings.',
          details: 'The Gmail token does not have the required scopes. Go to onboarding Step 3 and click "Connect Gmail" again.'
        });
      }
      throw gmailErr;
    }

    const flowType = automation.selectedOptions[0] || 'general';
    let processed = 0;

    for (const email of newEmails) {
      try {
        // ✨ RULE ENGINE: Classify the message
        const classification = await classifyMessage(email.body, flowType);
        console.log(`📧 Email from ${email.from}: type=${classification.type}, priority=${classification.priority}`);

        // ✨ Check escalation rules
        const escalationDecision = checkEscalation(classification, automation);

        // ✨ Create log entry FIRST (audit trail)
        const logEntry = await Log.create({
          userId: user._id,
          automationId,
          message: email.body,
          type: classification.type,
          sentiment: classification.sentiment,
          priority: classification.priority,
          action: classification.action,
          channel: 'email',
          from: email.from,
          conversationId: email.threadId || '',
          escalated: escalationDecision.shouldEscalate,
          escalationReason: escalationDecision.shouldEscalate ? escalationDecision.reason : '',
          ruleApplied: escalationDecision.ruleApplied,
          aiConfidence: 0.87,
        });

        // ✨ If escalation decision: notify and skip auto-reply
        if (escalationDecision.shouldEscalate) {
          console.log(`🚨 ESCALATING: ${email.from} - ${escalationDecision.reason}`);
          await escalateMessage(logEntry, user, escalationDecision.reason);
          processed++;
          continue;
        }

        // ✨ Otherwise: auto-reply
        console.log(`💬 Auto-replying to ${email.from}`);
        
        // Generate reply
        const reply = await generateReply(email.body, classification.type, flowType);

        // Format as professional HTML email
        const htmlEmail = formatEmailAsHtml(reply, user.name || 'Customer Support Team');

        // Send reply email (as HTML)
        await sendEmail(user.gmailAccessToken, email.from, `Re: ${email.subject}`, htmlEmail, true);

        // Update log with reply info
        await Log.findByIdAndUpdate(logEntry._id, {
          reply,
          hasReplied: true,
        });

        console.log(`✅ Reply sent to ${email.from}`);
        processed++;

      } catch (emailErr) {
        console.error(`Error processing email from ${email.from}:`, emailErr.message);
        // Continue processing other emails even if one fails
      }
    }

    // Update last checked
    automation.lastEmailCheck = new Date();
    await automation.save();

    res.json({ processed, total: newEmails.length });
  } catch (err) {
    console.error('processEmails error:', err.message);
    res.status(500).json({ error: `Failed to process emails: ${err.message}` });
  }
};

// ─── Update automation status (pause / resume) ────────────────────────────────
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const automation = await Automation.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ success: true, automation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Delete automation for a user ─────────────────────────────────────────────
export const deleteAutomation = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await Automation.findOneAndDelete({ userId });
    if (!result) return res.status(404).json({ error: 'No automation found for this user' });
    console.log(`🗑️ Automation deleted for user ${userId}`);
    res.json({ success: true, message: 'Automation deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
