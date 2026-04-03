import twilio from 'twilio';
import { processIncomingMessage, generateTwiMLResponse } from '../services/whatsappService.js';
import { classifyLead, generateConversationSummary } from '../services/aiService.js';
import Automation from '../models/Automation.js';
import Log from '../models/Log.js';
import User from '../models/User.js';

/**
 * Validate that the request actually came from Twilio.
 * Returns true (allow) if Twilio creds are not configured (dev mode).
 */
function isTwilioRequestValid(req) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken || authToken === 'your_twilio_auth_token') {
    console.warn('⚠️  TWILIO_AUTH_TOKEN not set — skipping signature validation (dev mode)');
    return true;
  }

  const signature = req.headers['x-twilio-signature'] || '';
  // Build the full URL Railway exposes
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const url = `${protocol}://${host}${req.originalUrl}`;

  try {
    return twilio.validateRequest(authToken, signature, url, req.body);
  } catch (err) {
    console.error('❌ Twilio signature validation error:', err.message);
    return false;
  }
}

/**
 * POST /webhook/whatsapp
 * Receives incoming WhatsApp messages from Twilio and replies via TwiML.
 */
export const handleWhatsAppWebhook = async (req, res) => {
  // Always respond with XML content-type (Twilio expects TwiML)
  res.set('Content-Type', 'text/xml');

  try {
    // ── 1. Validate Twilio signature ──────────────────────────────────────────
    if (!isTwilioRequestValid(req)) {
      console.warn('⚠️  Invalid Twilio signature — rejecting request');
      return res.status(403).send(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`);
    }

    // ── 2. Extract message fields sent by Twilio ──────────────────────────────
    const {
      Body: incomingBody,
      From: fromNumber,    // e.g. whatsapp:+919876543210
      To: toNumber,        // e.g. whatsapp:+14155238886 (your sandbox number)
      ProfileName: senderName,
    } = req.body;

    if (!incomingBody || !fromNumber) {
      console.warn('⚠️  WhatsApp webhook: missing Body or From field');
      return res.send(generateTwiMLResponse('Sorry, we could not understand your message.'));
    }

    console.log(`📱 [WhatsApp] Message from ${fromNumber} (${senderName || 'unknown'}): "${incomingBody.slice(0, 80)}"`);

    // ── 3. Find active automation with WhatsApp enabled ───────────────────────
    let automation = null;
    let user = null;

    try {
      automation = await Automation.findOne({
        status: 'active',
        'connectedChannels.whatsapp': true,
      });

      if (automation) {
        user = await User.findById(automation.userId);
      }
    } catch (dbErr) {
      console.warn('⚠️  DB lookup failed (running in DB-less mode):', dbErr.message);
    }

    // ── 4. Determine flow type ────────────────────────────────────────────────
    const flowType = automation?.selectedOptions?.[0] || 'general';

    // ── 5. Classify the message and generate an AI reply ──────────────────────
    let replyText = 'Thank you for reaching out! Our team will get back to you shortly.';

    try {
      const { classification, reply } = await processIncomingMessage(incomingBody, flowType);
      replyText = reply;

      console.log(`📊 [WhatsApp] Classified: ${classification.type} | Priority: ${classification.priority}`);

      // ── 6. Lead scoring with full conversation history + AI summary ─────────
      let leadData = null;
      try {
        // a) Fetch last 10 messages from this sender, oldest first
        //    .slice(-10) is a safety net in case the query returns more
        let conversationHistory = [];
        try {
          const pastLogs = await Log.find({ from: fromNumber, channel: 'whatsapp' })
            .sort({ timestamp: -1 })
            .limit(10)
            .select('message reply timestamp')
            .lean();
          conversationHistory = pastLogs.reverse().slice(-10); // oldest → newest, max 10
        } catch (histErr) {
          console.warn('⚠️  Could not fetch conversation history:', histErr.message);
        }

        // b) Build a User↔Bot transcript (roles matter for AI understanding)
        const transcript = conversationHistory
          .map(log => [
            `User: ${log.message}`,
            log.reply ? `Bot: ${log.reply}` : null,
          ].filter(Boolean).join('\n'))
          .join('\n');

        // Append the current message at the bottom
        const fullConversation = transcript
          ? `${transcript}\nUser: ${incomingBody}`
          : `User: ${incomingBody}`;

        // c) AI-generated semantic summary (not just metadata)
        //    e.g. "User wants a ₹5L loan urgently; shared 60k salary; asked about docs"
        const summary = await generateConversationSummary(fullConversation);
        console.log(`📝 [Summary] ${summary}`);

        // d) Classify the lead with full context
        leadData = await classifyLead(summary, fullConversation);
        console.log(`🎯 [Lead] ${leadData.lead_type} (score: ${leadData.lead_score}) — intent: ${leadData.intent} | history: ${conversationHistory.length} prior msgs`);

        // e) Compute score trend: compare against last persisted score on User
        if (user && leadData) {
          const prevScore = user.lead?.score ?? null;
          const newScore  = leadData.lead_score;
          const trend = prevScore === null    ? null
            : newScore > prevScore + 5        ? 'increasing'
            : newScore < prevScore - 5        ? 'decreasing'
            :                                   'stable';

          if (trend) {
            console.log(`📈 [Lead Trend] ${prevScore} → ${newScore} (${trend})`);
          }

          // f) Persist lead state on User for instant dashboard reads
          try {
            await User.findByIdAndUpdate(user._id, {
              lead: {
                type:          leadData.lead_type,
                score:         newScore,
                previousScore: prevScore,
                trend,
                intent:        leadData.intent,
                signals:       leadData.signals?.buying_signals ?? [],
                reason:        leadData.reason,
                lastInteraction: new Date(),
              },
            });
          } catch (persistErr) {
            console.warn('⚠️  Lead state persist failed:', persistErr.message);
          }
        }
      } catch (leadErr) {
        console.warn('⚠️  Lead classification failed:', leadErr.message);
      }

      // ── 7. Log the interaction ────────────────────────────────────────────
      if (user && automation) {
        try {
          await Log.create({
            userId: user._id,
            automationId: automation._id,
            message: incomingBody,
            type: classification.type,
            sentiment: classification.sentiment,
            priority: classification.priority,
            action: classification.action,
            reply,
            channel: 'whatsapp',
            from: fromNumber,
            subject: 'WhatsApp Message',
            // Lead intelligence (scored against full conversation + AI summary)
            lead: leadData ? {
              type:    leadData.lead_type,
              score:   leadData.lead_score,
              intent:  leadData.intent,
              signals: leadData.signals?.buying_signals ?? [],
              reason:  leadData.reason,
            } : undefined,
          });
        } catch (logErr) {
          console.warn('⚠️  Log save failed:', logErr.message);
        }
      }
    } catch (aiErr) {
      console.error('❌ [WhatsApp] AI processing failed:', aiErr.message);
    }

    // ── 7. Respond with TwiML ─────────────────────────────────────────────────
    console.log(`✅ [WhatsApp] Replying to ${fromNumber}: "${replyText.slice(0, 80)}"`);
    return res.send(generateTwiMLResponse(replyText));

  } catch (err) {
    console.error('❌ [WhatsApp] Webhook handler crashed:', err.message);
    return res.send(generateTwiMLResponse('An error occurred. Please try again later.'));
  }
};

/**
 * GET /webhook/whatsapp/health
 */
export const whatsappWebhookHealth = (req, res) => {
  res.json({ status: 'ok', service: 'whatsapp-webhook', timestamp: new Date().toISOString() });
};
