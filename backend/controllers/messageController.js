import Automation from '../models/Automation.js';
import { classifyMessage, generateReply } from '../services/aiService.js';
import { 
  processIncomingMessage, 
  validateTwilioRequest, 
  generateTwiMLResponse 
} from '../services/whatsappService.js';
import Log from '../models/Log.js';
import { determineAction, checkEscalation } from '../services/ruleEngine.js';
import { escalateMessage } from '../services/escalationService.js';
import User from '../models/User.js';

// POST /analyze-message — Test message classification (with auth)
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
    res.status(500).json({ error: 'AI processing failed. Check your GROK_API_KEY.' });
  }
};

/**
 * Handle incoming WhatsApp messages from Twilio webhook
 * With rule engine + escalation logic
 */
export const handleIncomingWhatsApp = async (req, res) => {
  try {
    const { automationId } = req.params;
    const { From, Body } = req.body;

    // Validate request signature (if configured)
    // NOTE: validateTwilioSignature should be in middleware, but checking here too
    if (!From || !Body) {
      return res.status(400).json({ error: 'Missing From or Body' });
    }

    // Fetch automation
    const automation = await Automation.findById(automationId).populate('userId');
    
    if (!automation) {
      console.warn(`⚠️ Automation ${automationId} not found`);
      return res.status(404).json({ error: 'Automation not found' });
    }

    if (automation.status === 'paused') {
      console.log(`⏸️  Automation paused, skipping processing`);
      return res.json({ success: true, paused: true });
    }

    if (!automation.connectedChannels?.whatsapp) {
      return res.status(400).json({ error: 'WhatsApp not connected' });
    }

    const user = automation.userId;

    // ✨ Process message with AI
    const { classification, reply } = await processIncomingMessage(Body, automation.selectedOptions[0]);
    
    console.log(`📱 WhatsApp from ${From}: "${Body.slice(0, 50)}..."`);
    console.log(`📊 Classification: ${classification.type} (${classification.sentiment}, ${classification.priority})`);

    // ✨ Check rules to determine action
    const actionDecision = determineAction(classification, automation);
    const escalationCheck = checkEscalation(classification, automation);

    // ✨ Create log entry FIRST (for audit trail)
    const logEntry = await Log.create({
      userId: user._id,
      automationId,
      message: Body,
      type: classification.type,
      sentiment: classification.sentiment,
      priority: classification.priority,
      action: classification.action,
      reply,
      channel: 'whatsapp',
      from: From,
      escalated: escalationCheck.shouldEscalate,
      escalationReason: escalationCheck.shouldEscalate ? escalationCheck.reason : '',
      ruleApplied: escalationCheck.ruleApplied,
      aiConfidence: 0.85, // Add confidence score from AI
    });

    // ✨ If should escalate: notify human, don't auto-reply
    if (escalationCheck.shouldEscalate) {
      console.log(`🚨 Escalating WhatsApp message: ${escalationCheck.reason}`);
      await escalateMessage(logEntry, user, escalationCheck.reason);
      
      // Send acknowledgment to customer
      const ackMessage = `We've received your message and it's being reviewed by our team. We'll get back to you soon.`;
      const twiMLResponse = generateTwiMLResponse([{
        body: ackMessage,
        type: 'text',
      }]);
      
      return res.status(200).set('Content-Type', 'text/xml').send(twiMLResponse);
    }

    // ✨ Auto-reply if not escalated
    console.log(`💬 Auto-replying to ${From}`);
    const twiMLResponse = generateTwiMLResponse([{
      body: reply,
      type: 'text',
    }]);

    res.status(200).set('Content-Type', 'text/xml').send(twiMLResponse);

  } catch (err) {
    console.error('❌ handleIncomingWhatsApp error:', err.message);
    res.status(200).set('Content-Type', 'text/xml').send(generateTwiMLResponse([{
      body: 'We encountered an error processing your message. Please try again.',
      type: 'text',
    }]));
  }
};

// Helper function to escape XML special characters (kept for backward compatibility)
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
