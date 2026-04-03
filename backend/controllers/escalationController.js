/**
 * Escalation Controller
 * Endpoints for managing escalations and human reviews
 */

import { 
  getPendingEscalations, 
  reviewEscalation, 
  getEscalationMetrics 
} from '../services/escalationService.js';
import Log from '../models/Log.js';
import User from '../models/User.js';

/**
 * GET /escalations/pending - Get pending escalation queue
 */
export const getPending = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pending = await getPendingEscalations(userId);

    res.json({
      total: pending.length,
      escalations: pending.map(log => ({
        id: log._id,
        message: log.message,
        from: log.from,
        type: log.type,
        priority: log.priority,
        sentiment: log.sentiment,
        channel: log.channel,
        escalatedAt: log.escalatedAt,
        escalationReason: log.escalationReason,
      })),
    });
  } catch (err) {
    console.error('getPending error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /escalations/:logId/review - Mark escalation as reviewed
 */
export const submitReview = async (req, res) => {
  try {
    const { logId } = req.params;
    const { feedback, manualReply } = req.body;
    // feedback: 'approved' | 'rejected' | 'needs_edit'

    if (!['approved', 'rejected', 'needs_edit'].includes(feedback)) {
      return res.status(400).json({ error: 'Invalid feedback value' });
    }

    const log = await Log.findById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    if (!log.escalated || !log.requiresHumanReview) {
      return res.status(400).json({ error: 'This log is not escalated' });
    }

    const updated = await reviewEscalation(logId, { feedback, manualReply });

    res.json({
      success: true,
      message: `Escalation marked as ${feedback}`,
      log: updated,
    });
  } catch (err) {
    console.error('submitReview error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /escalations/metrics/:userId - Get escalation metrics
 */
export const getMetrics = async (req, res) => {
  try {
    const { userId } = req.params;

    const metrics = await getEscalationMetrics(userId);

    res.json(metrics);
  } catch (err) {
    console.error('getMetrics error:', err);
    res.status(500).json({ error: err.message });
  }
};
