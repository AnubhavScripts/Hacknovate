import twilio from 'twilio';
import { generateTwiMLResponse } from '../services/whatsappService.js';
import { classifyMessage, generateReply, classifyLead, generateConversationSummary, detectFlowType } from '../services/aiService.js';
import { parseReminderFromMessage, scheduleReminder } from '../services/reminderService.js';
import Automation from '../models/Automation.js';
import Log from '../models/Log.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';

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
      From: fromNumber,
      To: toNumber,
      ProfileName: senderName,
    } = req.body;

    if (!incomingBody || !fromNumber) {
      console.warn('⚠️  WhatsApp webhook: missing Body or From field');
      return res.send(generateTwiMLResponse('Sorry, we could not understand your message.'));
    }

    console.log(`📱 [WhatsApp] Message from ${fromNumber} (${senderName || 'unknown'}): "${incomingBody.slice(0, 80)}"`);

    // ── 2a. GREETING SHORT-CIRCUIT ──────────────────────────────────────────────────
    // "hi", "hello", "hey", "hii", "helo", "Hii" etc.
    if (/^\s*(hi+|hello|hey|hola|hii|helo|namaste|howdy)[!\s.]*$/i.test(incomingBody.trim())) {
      console.log('[WhatsApp] Greeting detected — sending welcome message');
      return res.send(generateTwiMLResponse('👋 How may I help you today?\n\nI can assist you with:\n🏦 Loan queries\n🎓 Educational courses\n📦 Orders & support\n⏰ Assignment reminders\n\nJust type your question!'));
    }

    // ── 2b. REMINDER DETECTION SHORT-CIRCUIT ────────────────────────────────────────
    // Detect before any AI processing
    if (/remind\s*me|set\s*(a\s*)?reminder|याद\s*दिला/i.test(incomingBody)) {
      const parsed = parseReminderFromMessage(incomingBody);
      if (parsed) {
        await scheduleReminder(fromNumber, parsed.subject, parsed.remindAtUTC, null);
        const localTime = new Date(parsed.remindAtUTC.getTime() + 5.5 * 60 * 60 * 1000);
        const timeStr = localTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const reply = `✅ Got it! I'll remind you to *${parsed.subject}* at *${timeStr} IST* today.\n\nI'll send you a WhatsApp message when it's time! ⏰`;
        console.log(`⏰ [WhatsApp] Reminder set for ${fromNumber}: "${parsed.subject}" at ${parsed.remindAtUTC.toISOString()}`);
        return res.send(generateTwiMLResponse(reply));
      }
    }

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

    // ── 4. Default flow type (will be overridden after lead classification) ───
    let flowType = 'support';

    let replyText = 'Thank you for reaching out! Our team will get back to you shortly.';
    let classification = null;
    let leadData = null;

    try {
      // ── 5. Build conversation history ───────────────────────────────────────
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

      // ── 6. Build full transcript ────────────────────────────────────────────
      const transcript = conversationHistory
        .map(log => [
          `User: ${log.message}`,
          log.reply ? `Bot: ${log.reply}` : null,
        ].filter(Boolean).join('\n'))
        .join('\n');

      const fullConversation = transcript
        ? `${transcript}\nUser: ${incomingBody}`
        : `User: ${incomingBody}`;

      // ── 7. AI-generated semantic summary ───────────────────────────────────
      const summary = await generateConversationSummary(fullConversation);
      console.log(`📝 [Summary] ${summary}`);

      // ── 8. Classify lead FIRST (determines flow type) ──────────────────────
      leadData = await classifyLead(summary, fullConversation);
      console.log(`🎯 [Lead] ${leadData.lead_type} (score: ${leadData.lead_score}) — intent: ${leadData.intent} | history: ${conversationHistory.length} prior msgs`);

      // ── 9. Decide flow dynamically based on message content + conversation history ─────
      // Use the smart detector: checks both current message AND conversation context
      flowType = detectFlowType(incomingBody, transcript);
      // Only override to 'sales' if the CURRENT message also has a loan keyword.
      // This prevents short replies like "ok", "yes", "haan" from hijacking
      // a non-loan conversation into the sales flow and cutting it off.
      const currentMsgHasLoanKeyword = /\b(loan|borrow|credit|emi|interest rate|salary|apply|application|kyc|aadhaar|pan|lakh|repay|finance|fintech|bank|nbfc|eligible|eligibility|home loan|personal loan|business loan)\b/i.test(incomingBody);
      if (
        flowType !== 'education' &&
        currentMsgHasLoanKeyword &&
        leadData &&
        ['loan_application','eligibility_check','interest_rate_query','document_requirement','repayment_query','loan_inquiry'].includes(leadData.intent)
      ) {
        flowType = 'sales';
      }
      console.log(`🧠 Flow selected: ${flowType} | lead intent: ${leadData?.intent}`);

      // ── 10. Basic message classification (type, sentiment, priority) ──────────
      classification = await classifyMessage(incomingBody, 'general');
      console.log(`📊 [WhatsApp] Classified: ${classification.type} | Priority: ${classification.priority}`);

      // ── 10a. Short-reply override ("yes"/"ok"/"hmm" ≠ invalid) ───────────────
      const SHORT_REPLIES = ['yes', 'ok', 'hmm', 'sure', 'done', 'will do', 'haan',
        'okay', 'got it', 'alright', 'yep', 'nope', 'no', 'maybe', 'fine', 'great'];
      if (SHORT_REPLIES.includes(incomingBody.toLowerCase().trim())) {
        classification.type     = 'conversation';
        classification.priority = 'medium';
        console.log(`💬 [WhatsApp] Short reply → type overridden to 'conversation'`);
      }

      // ── 10b. Remap 'invalid' → 'conversation' when lead context is active ───────
      if (classification.type === 'invalid' && leadData?.intent !== 'irrelevant') {
        classification.type = 'conversation';
        console.log(`💬 [WhatsApp] 'invalid' remapped to 'conversation' (lead context active)`);
      }

      // ── 11. Extract known entities from lead data ───────────────────────────
      const knownSalary     = leadData?.entities?.salary     ?? null;
      const knownLoanAmount = leadData?.entities?.loan_amount ?? null;
      const convoText       = fullConversation.toLowerCase();

      // ── 12. Follow-up engine — guarantee key questions are always asked ──────
      // Only fires in sales mode when AI reply might be too generic.
      // Guard: only engage after at least 1 prior conversation turn so we don't
      // interrupt a fresh greeting with a double-barrelled question.
      let followUpOverride = null;

      if (flowType === 'sales' && conversationHistory.length >= 1) {
        const missing = [];

        // Only flag as missing if NOT already present in conversation text
        const salaryMentioned     = /salary|income|earn|\d+k\b|\d+,000/i.test(convoText);
        const loanAmountMentioned = /\d[\d,]*\s*(lakh|lac|l\b|k\b)|loan amount|how much/i.test(convoText);

        if (!knownSalary && !salaryMentioned)         missing.push('salary');
        if (!knownLoanAmount && !loanAmountMentioned) missing.push('loan_amount');

        // Ask ONE thing at a time — never a double question
        if (missing.includes('loan_amount') && !missing.includes('salary')) {
          // Salary known but loan amount missing — personalize
          const salaryStr = knownSalary
            ? `₹${knownSalary.toLocaleString('en-IN')} salary — ` : '';
          followUpOverride = `${salaryStr ? `Got it — ${salaryStr}h` : 'H'}ow much loan are you looking for?`;
        } else if (missing.includes('salary') && !missing.includes('loan_amount')) {
          // Loan amount known but salary missing — personalize
          const lakhStr = knownLoanAmount
            ? `₹${(knownLoanAmount / 100000).toFixed(1)} lakh — ` : '';
          followUpOverride = `Got it${lakhStr ? ` — ${lakhStr}` : '!'}Could you share your monthly salary?`;
        }
        // If both missing → let AI ask naturally (avoid overwhelming first-time users)
        // If both known   → no override, let AI craft the eligibility/CTA reply
      }

      // ── 13. Generate reply using the correct flow + context ─────────────────
      const aiReply = await generateReply(
        incomingBody,
        classification.type,
        flowType,
        { knownSalary, knownLoanAmount, convoText }
      );

      // Follow-up engine overrides only if AI gave a weak/generic reply
      // (detected by being too short or lacking a question mark in sales mode)
      const aiIsWeak = flowType === 'sales' &&
        (aiReply.length < 30 || (!aiReply.includes('?') && followUpOverride));

      replyText = (followUpOverride && aiIsWeak) ? followUpOverride : aiReply;

      console.log(`💬 [Reply] flow=${flowType} | override=${!!followUpOverride && aiIsWeak} | "${replyText.slice(0, 80)}"`);


      // ── 12. Compute score trend and persist lead state on User ──────────────
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
              summary,                        // ✨ Store AI summary on user
              lastInteraction: new Date(),
            },
          });
        } catch (persistErr) {
          console.warn('⚠️  Lead state persist failed:', persistErr.message);
        }
      }

      // ── 12b. Upsert Conversation doc (one per customer phone) ──────────────
      const conversationId = fromNumber;
      try {
        const prevScore = user?.lead?.score ?? null;
        const curScore  = leadData?.lead_score ?? null;
        const convTrend = (prevScore === null || curScore === null) ? null
          : curScore > prevScore + 5  ? 'increasing'
          : curScore < prevScore - 5  ? 'decreasing'
          :                             'stable';

        await Conversation.findOneAndUpdate(
          { conversationId },
          {
            $set: {
              userId:        user?._id       ?? undefined,
              automationId:  automation?._id ?? undefined,
              summary,
              lead: {
                type:    leadData?.lead_type  ?? null,
                score:   curScore,
                trend:   convTrend,
                intent:  leadData?.intent     ?? null,
                signals: leadData?.signals?.buying_signals ?? [],
                reason:  leadData?.reason     ?? null,
              },
              lastMessage:   incomingBody.slice(0, 200),
              flowType,
              lastMessageAt: new Date(),
            },
            $inc:         { totalMessages: 1 },
            $setOnInsert: { firstMessageAt: new Date() },
          },
          { upsert: true, new: true }
        );
        console.log(`📝 [Conversation] Upserted ${fromNumber} | ${leadData?.lead_type} score=${leadData?.lead_score}`);
      } catch (convErr) {
        console.warn('⚠️  Conversation upsert failed:', convErr.message);
      }

      // ── 13. Log the interaction ─────────────────────────────────────────────
      if (user && automation && classification) {
        try {
          await Log.create({
            userId:        user._id,
            automationId:  automation._id,
            message:       incomingBody,
            type:          classification.type,
            sentiment:     classification.sentiment,
            priority:      classification.priority,
            action:        classification.action,
            reply:         replyText,
            channel:       'whatsapp',
            from:          fromNumber,
            subject:       'WhatsApp Message',
            conversationId,                     // ✨ links all msgs from same phone
            conversationSummary: summary,       // ✨ AI summary snapshot per message
            hasReplied:    true,
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

    // ── 14. Respond with TwiML ────────────────────────────────────────────────
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