import { classifyMessage, generateReply } from '../services/aiService.js';
import Log from '../models/Log.js';

// POST /analyze-message
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
    res.status(500).json({ error: 'AI processing failed. Check your OPENAI_API_KEY.' });
  }
};
