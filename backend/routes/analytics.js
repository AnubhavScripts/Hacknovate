import express from 'express';
import Log from '../models/Log.js';

const router = express.Router();

// GET /analytics/:userId — summary stats for the dashboard
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const matchQuery = userId === 'mock_user_001' ? {} : { userId };

    const [totalMessages, autoResolved, escalated, byChannel, bySentiment] = await Promise.all([
      Log.countDocuments(matchQuery),
      Log.countDocuments({ ...matchQuery, hasReplied: true }),
      Log.countDocuments({ ...matchQuery, escalated: true }),
      Log.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$channel', count: { $sum: 1 } } },
      ]),
      Log.aggregate([
        { $match: matchQuery },
        { $group: { _id: '$sentiment', count: { $sum: 1 } } },
      ]),
    ]);

    const channels = {};
    byChannel.forEach(({ _id, count }) => { if (_id) channels[_id] = count; });

    const sentiment = {};
    bySentiment.forEach(({ _id, count }) => { if (_id) sentiment[_id] = count; });

    const resolutionRate = totalMessages > 0
      ? Math.round((autoResolved / totalMessages) * 100)
      : 0;

    res.json({
      summary: {
        totalMessages,
        autoResolved,
        escalated,
        resolutionRate,
        avgResponseTime: '< 2s',
      },
      channels,
      sentiment,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /analytics/:userId/channels — per-channel metrics
router.get('/:userId/channels', async (req, res) => {
  try {
    const { userId } = req.params;
    const { channel } = req.query;
    const matchQuery = userId === 'mock_user_001' ? {} : { userId };
    if (channel) matchQuery.channel = channel;

    const [totalMessages, autoResolved] = await Promise.all([
      Log.countDocuments(matchQuery),
      Log.countDocuments({ ...matchQuery, hasReplied: true }),
    ]);

    res.json({
      metrics: {
        totalMessages,
        autoResolved,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
