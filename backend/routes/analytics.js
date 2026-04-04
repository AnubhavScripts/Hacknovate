import express from 'express';
import Log from '../models/Log.js';
import User from '../models/User.js';

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

    // ── Lead Intelligence from User profiles ──────────────────────────────────
    // Aggregate lead counts from WhatsApp users stored in User model
    const [leadCounts, topLeads] = await Promise.all([
      User.aggregate([
        { $match: { 'lead.type': { $in: ['HOT', 'WARM', 'COLD'] } } },
        { $group: { _id: '$lead.type', count: { $sum: 1 } } },
      ]),
      User.find({ 'lead.type': { $in: ['HOT', 'WARM', 'COLD'] } })
        .sort({ 'lead.score': -1 })
        .limit(10)
        .select('name email lead')
        .lean(),
    ]);

    const leadDistribution = { HOT: 0, WARM: 0, COLD: 0 };
    leadCounts.forEach(({ _id, count }) => { if (_id) leadDistribution[_id] = count; });

    const leadsFormatted = topLeads.map(u => ({
      name: u.name || u.email || 'Unknown',
      phone: u.email || '',
      leadType: u.lead?.type || 'COLD',
      score: u.lead?.score || 0,
      trend: u.lead?.trend || 'stable',
      intent: u.lead?.intent || 'unknown',
      summary: u.lead?.summary || '',
      reason: u.lead?.reason || '',
      lastInteraction: u.lead?.lastInteraction || null,
    }));

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
      leads: {
        distribution: leadDistribution,
        topLeads: leadsFormatted,
        total: leadDistribution.HOT + leadDistribution.WARM + leadDistribution.COLD,
      },
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
