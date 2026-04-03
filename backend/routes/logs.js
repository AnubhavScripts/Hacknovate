import express from 'express';
import Log from '../models/Log.js';
import User from '../models/User.js';

const router = express.Router();

// ⚠️  Specific routes MUST come before /:userId to avoid Express swallowing them ─

// GET /logs/leads/:userId — lead-classified logs only (HOT / WARM / COLD)
// Optional query: ?type=HOT|WARM|COLD
router.get('/leads/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    const matchQuery = userId === 'mock_user_001' ? {} : { userId };

    if (type && ['HOT', 'WARM', 'COLD'].includes(type.toUpperCase())) {
      matchQuery['lead.type'] = type.toUpperCase();
    } else {
      matchQuery['lead.type'] = { $in: ['HOT', 'WARM', 'COLD'] };
    }

    const logs = await Log.find(matchQuery)
      .sort({ 'lead.score': -1, timestamp: -1 })
      .limit(50)
      .select('message type sentiment priority from channel timestamp lead reply conversationId conversationSummary');

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /logs/lead-stats/:userId — aggregated HOT / WARM / COLD counts from Log collection
router.get('/lead-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const matchQuery = userId === 'mock_user_001' ? {} : { userId };
    matchQuery['lead.type'] = { $in: ['HOT', 'WARM', 'COLD'] };

    const [logStats, userLead] = await Promise.all([
      Log.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$lead.type', count: { $sum: 1 }, avgScore: { $avg: '$lead.score' } } },
      ]),
      userId !== 'mock_user_001'
        ? User.findById(userId).select('lead name email').lean()
        : Promise.resolve(null),
    ]);

    const stats = { HOT: 0, WARM: 0, COLD: 0, avgScores: {} };
    logStats.forEach(({ _id, count, avgScore }) => {
      if (_id) {
        stats[_id] = count;
        stats.avgScores[_id] = Math.round(avgScore);
      }
    });

    res.json({ stats, currentLead: userLead?.lead ?? null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /logs/ — all logs (admin / demo)
router.get('/', async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /logs/:userId — fetch logs for a user (most recent first)
// ↑ Must be LAST among GET routes — catches everything not matched above
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const query = userId === 'mock_user_001' ? {} : { userId };
    const logs = await Log.find(query).sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
