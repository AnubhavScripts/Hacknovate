import express from 'express';
import Conversation from '../models/Conversation.js';

const router = express.Router();

// ⚠️  IMPORTANT: specific routes MUST come before /:userId  ──────────────────

// GET /conversations/stats/:userId — HOT/WARM/COLD counts + avg scores
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const match = userId === 'mock_user_001' ? {} : { userId };

    const stats = await Conversation.aggregate([
      { $match: match },
      {
        $group: {
          _id:           '$lead.type',
          count:         { $sum: 1 },
          avgScore:      { $avg: '$lead.score' },
          totalMessages: { $sum: '$totalMessages' },
        },
      },
    ]);

    const result = { HOT: 0, WARM: 0, COLD: 0, avgScores: {}, totalMessages: {} };
    stats.forEach(({ _id, count, avgScore, totalMessages }) => {
      if (_id) {
        result[_id]                = count;
        result.avgScores[_id]      = Math.round(avgScore ?? 0);
        result.totalMessages[_id]  = totalMessages;
      }
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /conversations/:userId — all conversations for a merchant (newest first)
// ?leadType=HOT|WARM|COLD  to filter
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { leadType } = req.query;

    const query = userId === 'mock_user_001' ? {} : { userId };
    if (leadType && ['HOT', 'WARM', 'COLD'].includes(leadType.toUpperCase())) {
      query['lead.type'] = leadType.toUpperCase();
    }

    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(50);

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
