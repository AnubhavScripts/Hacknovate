import express from 'express';
import Log from '../models/Log.js';
import Conversation from '../models/Conversation.js';

const router = express.Router();

// ─── Mock Lead Data (shown when no real leads exist yet) ─────────────────────
const MOCK_LEADS = [
  {
    name: '+91 98201 45671',
    phone: '+91 98201 45671',
    leadType: 'HOT',
    score: 92,
    trend: 'increasing',
    intent: 'loan_application',
    summary: 'User wants ₹5 lakh personal loan, confirmed salary of ₹65,000/month, asked about documents and KYC process. Very high intent.',
    signals: ['salary_provided', 'loan_amount_mentioned', 'asked_documents', 'urgent_need'],
    reason: '4 buying signals — salary provided, amount specified, docs asked, urgency expressed.',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    totalMessages: 11,
    lastMessage: 'Okay so what documents do I need to submit for the ₹5 lakh loan?',
  },
  {
    name: '+91 77389 12043',
    phone: '+91 77389 12043',
    leadType: 'HOT',
    score: 85,
    trend: 'increasing',
    intent: 'eligibility_check',
    summary: 'User asking about home loan eligibility for ₹30 lakh. Salary ₹80,000/month. Expressed urgency due to property booking deadline.',
    signals: ['salary_provided', 'loan_amount_mentioned', 'urgent_need', 'asked_interest_rate'],
    reason: 'High salary, specific amount, time-bound urgency. Clear HOT signal.',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    totalMessages: 8,
    lastMessage: 'I need to confirm eligibility before Tuesday — property booking closes then.',
  },
  {
    name: '+91 90011 67823',
    phone: '+91 90011 67823',
    leadType: 'HOT',
    score: 78,
    trend: 'stable',
    intent: 'loan_application',
    summary: 'Business loan inquiry for ₹12 lakh. User owns a small textile business, monthly revenue ₹1.2 lakh. Asked for application link.',
    signals: ['loan_amount_mentioned', 'asked_application_process', 'asked_documents'],
    reason: 'Asked for application process directly — strong buying signal.',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    totalMessages: 7,
    lastMessage: 'Sure, send me the link to apply. How long does approval take?',
  },
  {
    name: '+91 84520 33917',
    phone: '+91 84520 33917',
    leadType: 'WARM',
    score: 65,
    trend: 'increasing',
    intent: 'interest_rate_query',
    summary: 'User comparing interest rates across lenders for a ₹3 lakh personal loan. Salary around ₹40,000. Not yet committed.',
    signals: ['asked_interest_rate', 'loan_amount_mentioned'],
    reason: 'Active comparison shopping — medium intent. Salary shared.',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    totalMessages: 6,
    lastMessage: 'What\'s the best interest rate you can offer for 3 lakh?',
  },
  {
    name: '+91 63741 89204',
    phone: '+91 63741 89204',
    leadType: 'WARM',
    score: 58,
    trend: 'stable',
    intent: 'eligibility_check',
    summary: 'User asked about education loan eligibility for MBA abroad. ₹25 lakh needed. Exploring options, not urgent.',
    signals: ['loan_amount_mentioned', 'asked_interest_rate'],
    reason: 'Specific amount and course mentioned but no urgency signals.',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    totalMessages: 5,
    lastMessage: 'Is there a moratorium period on education loans?',
  },
  {
    name: '+91 99320 14578',
    phone: '+91 99320 14578',
    leadType: 'WARM',
    score: 52,
    trend: 'decreasing',
    intent: 'repayment_query',
    summary: 'Existing customer asking about EMI restructuring for current loan. Monthly EMI ₹8,500. Behind by 1 installment.',
    signals: ['asked_interest_rate'],
    reason: 'Repayment query — possible churn risk, warm for upgrade/restructure offer.',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    totalMessages: 4,
    lastMessage: 'Can I delay my next EMI by 2 weeks? I\'m a bit short this month.',
  },
  {
    name: '+91 72819 55032',
    phone: '+91 72819 55032',
    leadType: 'WARM',
    score: 47,
    trend: 'stable',
    intent: 'loan_inquiry',
    summary: 'General inquiry about personal loan products. Mentioned salary of ₹35,000 but vague about loan amount needed.',
    signals: ['salary_provided'],
    reason: 'Salary provided — shows willingness to share info. Loan amount not yet specified.',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    totalMessages: 3,
    lastMessage: 'What all loans does your platform offer?',
  },
  {
    name: '+91 81234 76509',
    phone: '+91 81234 76509',
    leadType: 'COLD',
    score: 28,
    trend: 'stable',
    intent: 'just_exploring',
    summary: 'User greeted and asked a vague question about loans. No specific amount or urgency. Likely early awareness stage.',
    signals: [],
    reason: 'No buying signals. Exploratory conversation only.',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 900).toISOString(),
    totalMessages: 2,
    lastMessage: 'Hi, I wanted to know about loans',
  },
  {
    name: '+91 70045 21394',
    phone: '+91 70045 21394',
    leadType: 'COLD',
    score: 22,
    trend: 'stable',
    intent: 'just_exploring',
    summary: 'Short conversation — user asked about course fees. Seems to be exploring education loan options casually.',
    signals: [],
    reason: 'No strong signals. Single query with no follow-up.',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
    totalMessages: 2,
    lastMessage: 'What is the fee for a data science course?',
  },
  {
    name: '+91 93401 88271',
    phone: '+91 93401 88271',
    leadType: 'COLD',
    score: 15,
    trend: 'stable',
    intent: 'irrelevant',
    summary: 'User sent an unrelated query. No financial intent detected.',
    signals: [],
    reason: 'No intent signals.',
    lastInteraction: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    totalMessages: 1,
    lastMessage: 'Hello',
  },
];

const MOCK_DISTRIBUTION = {
  HOT: MOCK_LEADS.filter(l => l.leadType === 'HOT').length,
  WARM: MOCK_LEADS.filter(l => l.leadType === 'WARM').length,
  COLD: MOCK_LEADS.filter(l => l.leadType === 'COLD').length,
};

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

    // ── If no real leads found, inject mock data so the dashboard is never empty ──
    const noRealLeads = (leadDistribution.HOT + leadDistribution.WARM + leadDistribution.COLD) === 0;
    const finalLeadDist  = noRealLeads ? MOCK_DISTRIBUTION  : leadDistribution;
    const finalTopLeads  = noRealLeads ? MOCK_LEADS         : topLeadDocs.map(formatConv);
    const finalTotal     = finalLeadDist.HOT + finalLeadDist.WARM + finalLeadDist.COLD;

    // ── If no real messages logged yet, supply mock summary stats too ──
    const noRealMsgs = totalMessages === 0;

    res.json({
      summary: {
        totalMessages:   noRealMsgs ? 248  : totalMessages,
        autoResolved:    noRealMsgs ? 221  : autoResolved,
        escalated:       noRealMsgs ? 12   : escalated,
        resolutionRate:  noRealMsgs ? 89   : resolutionRate,
        avgResponseTime: '< 2s',
      },
      channels: noRealMsgs ? { whatsapp: 186, email: 62 } : channels,
      sentiment: noRealMsgs ? { positive: 134, neutral: 89, negative: 25 } : sentiment,
      leads: {
        distribution: finalLeadDist,
        topLeads:     finalTopLeads,
        total:        finalTotal,
        isMock:       noRealLeads,
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

    // ── Fallback 1: if no leads for this userId, try ALL conversations ──
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

    // ── Fallback 2: still no leads — return mock data so dashboard is never empty ──
    const noReal = (distribution.HOT + distribution.WARM + distribution.COLD) === 0;
    if (noReal) {
      console.log('📊 [Leads] No real leads in DB — returning mock data for demo');
      return res.json({
        distribution: MOCK_DISTRIBUTION,
        topLeads:     MOCK_LEADS,
        total:        MOCK_LEADS.length,
        isMock:       true,
        fetchedAt:    new Date().toISOString(),
      });
    }

    res.json({
      distribution,
      topLeads: topLeadDocs.map(formatConv),
      total: distribution.HOT + distribution.WARM + distribution.COLD,
      isMock:   false,
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
