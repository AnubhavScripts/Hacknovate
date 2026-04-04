import express from 'express';
import Log from '../models/Log.js';
import Conversation from '../models/Conversation.js';

const router = express.Router();

// ─── Helper: build lead match query ───────────────────────────────────────────────
function buildLeadQuery(userId) {
  const base = { 'lead.type': { $in: ['HOT', 'WARM', 'COLD'] } };
  if (userId && userId !== 'mock_user_001') {
    // Use $or so we catch conversations saved WITH this userId AND any that
    // were saved without a userId (e.g. when the automation lookup failed)
    base.$or = [
      { userId: userId },
      { userId: { $exists: false } },
      { userId: null },
    ];
  }
  return base;
}

// ─── Format a Conversation doc into a frontend-ready lead object ───────────────
function formatConv(c) {
  return {
    name: c.conversationId?.replace('whatsapp:', '') || 'Unknown',
    phone: c.conversationId?.replace('whatsapp:', '') || '',
    leadType: c.lead?.type || 'COLD',
    score: c.lead?.score || 0,
    trend: c.lead?.trend || 'stable',
    intent: c.lead?.intent || 'unknown',
    summary: c.summary || c.lead?.reason || '',
    signals: c.lead?.signals || [],
    reason: c.lead?.reason || '',
    lastInteraction: c.lastMessageAt || c.updatedAt || null,
    totalMessages: c.totalMessages || 0,
    lastMessage: c.lastMessage || '',
  };
}

// GET /analytics/:userId — full dashboard stats
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

    // ── Lead Intelligence — sourced from Conversation model ────────────────────
    const leadQuery = buildLeadQuery(userId);

    const [leadCounts, topLeadDocs] = await Promise.all([
      Conversation.aggregate([
        { $match: leadQuery },
        { $group: { _id: '$lead.type', count: { $sum: 1 } } },
      ]),
      Conversation.find(leadQuery)
        .sort({ 'lead.score': -1 })
        .limit(10)
        .lean(),
    ]);

    const leadDistribution = { HOT: 0, WARM: 0, COLD: 0 };
    leadCounts.forEach(({ _id, count }) => { if (_id) leadDistribution[_id] = count; });

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
        topLeads: topLeadDocs.map(formatConv),
        total: leadDistribution.HOT + leadDistribution.WARM + leadDistribution.COLD,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /analytics/:userId/leads — real-time lead polling (called every 30s from frontend)
router.get('/:userId/leads', async (req, res) => {
  try {
    const { userId } = req.params;
    const leadQuery = buildLeadQuery(userId);

    let [leadCounts, topLeadDocs] = await Promise.all([
      Conversation.aggregate([
        { $match: leadQuery },
        { $group: { _id: '$lead.type', count: { $sum: 1 } } },
      ]),
      Conversation.find(leadQuery)
        .sort({ 'lead.score': -1, lastMessageAt: -1 })
        .limit(20)
        .lean(),
    ]);

    // ── Fallback: if no leads found with userId filter, return ALL leads ──
    // This handles the case where conversations were stored without a userId
    // (e.g. incoming WhatsApp before automation was fully set up)
    if (leadCounts.length === 0 && userId && userId !== 'mock_user_001') {
      console.log(`⚠️  No leads found for userId ${userId} — falling back to all conversations`);
      const allLeadsQuery = { 'lead.type': { $in: ['HOT', 'WARM', 'COLD'] } };
      [leadCounts, topLeadDocs] = await Promise.all([
        Conversation.aggregate([
          { $match: allLeadsQuery },
          { $group: { _id: '$lead.type', count: { $sum: 1 } } },
        ]),
        Conversation.find(allLeadsQuery)
          .sort({ 'lead.score': -1, lastMessageAt: -1 })
          .limit(20)
          .lean(),
      ]);
    }

    const distribution = { HOT: 0, WARM: 0, COLD: 0 };
    leadCounts.forEach(({ _id, count }) => { if (_id) distribution[_id] = count; });

    res.json({
      distribution,
      topLeads: topLeadDocs.map(formatConv),
      total: distribution.HOT + distribution.WARM + distribution.COLD,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('❌ Leads fetch error:', err.message);
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

    res.json({ metrics: { totalMessages, autoResolved } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
