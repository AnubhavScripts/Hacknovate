/**
 * Analytics Controller
 * Provides dashboard metrics and statistics
 */

import mongoose from 'mongoose';
import Log from '../models/Log.js';
import User from '../models/User.js';
import Automation from '../models/Automation.js';

// ─── Get Analytics Summary ────────────────────────────────────────────────────
export const getAnalytics = async (req, res) => {
  try {
    let { userId } = req.params;

    console.log('📊 getAnalytics request for userId:', userId);

    // Convert userId to ObjectId if needed
    if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
      userId = new mongoose.Types.ObjectId(userId);
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all logs for this user
    const logs = await Log.find({ userId }).sort({ timestamp: -1 });
    
    console.log(`📊 Found ${logs.length} logs for user`);

    // Calculate metrics
    const totalMessages = logs.length;
    const autoResolved = logs.filter(log => !log.escalated).length;
    const escalated = logs.filter(log => log.escalated).length;

    // Calculate average response time (in mock data, we'll use message timestamps)
    let avgResponseTime = 0;
    if (logs.length > 0) {
      const responseTimes = logs
        .filter(log => log.timestamp)
        .map(log => new Date(log.timestamp).getTime());
      
      if (responseTimes.length > 1) {
        let totalTime = 0;
        for (let i = 1; i < responseTimes.length; i++) {
          totalTime += responseTimes[i - 1] - responseTimes[i];
        }
        avgResponseTime = Math.round(totalTime / (responseTimes.length - 1) / 1000); // in seconds
      }
    }

    // Get channel breakdown
    const channelBreakdown = {};
    logs.forEach(log => {
      const channel = log.channel || 'unknown';
      channelBreakdown[channel] = (channelBreakdown[channel] || 0) + 1;
    });

    // Get sentiment breakdown
    const sentimentBreakdown = {};
    logs.forEach(log => {
      const sentiment = log.sentiment || 'unknown';
      sentimentBreakdown[sentiment] = (sentimentBreakdown[sentiment] || 0) + 1;
    });

    // Get priority breakdown
    const priorityBreakdown = {};
    logs.forEach(log => {
      const priority = log.priority || 'unknown';
      priorityBreakdown[priority] = (priorityBreakdown[priority] || 0) + 1;
    });

    const analytics = {
      summary: {
        totalMessages,
        autoResolved,
        escalated,
        avgResponseTime: avgResponseTime + 's',
        resolutionRate: totalMessages > 0 ? Math.round((autoResolved / totalMessages) * 100) : 0,
      },
      channels: channelBreakdown,
      sentiment: sentimentBreakdown,
      priority: priorityBreakdown,
      logs: logs.slice(0, 10), // Return last 10 logs
    };

    console.log('✅ Analytics calculated:', analytics.summary);

    res.json(analytics);
  } catch (err) {
    console.error('❌ getAnalytics error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Get Channel-specific data ────────────────────────────────────────────────
export const getChannelData = async (req, res) => {
  try {
    let { userId } = req.params;
    const { channel } = req.query; // gmail, whatsapp, etc.

    console.log(`📊 getChannelData request for userId: ${userId}, channel: ${channel}`);

    // Convert userId to ObjectId if needed
    if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
      userId = new mongoose.Types.ObjectId(userId);
    }

    // Get automation to check connected channels
    const automation = await Automation.findOne({ userId });
    
    if (!automation) {
      return res.status(404).json({ error: 'No automation found' });
    }

    // Get logs for this channel
    let query = { userId };
    if (channel) {
      query.channel = channel;
    }

    const logs = await Log.find(query).sort({ timestamp: -1 });

    // Calculate channel-specific metrics
    const metrics = {
      channel: channel || 'all',
      totalMessages: logs.length,
      autoResolved: logs.filter(log => !log.escalated).length,
      escalated: logs.filter(log => log.escalated).length,
      lastMessage: logs.length > 0 ? logs[0].timestamp : null,
      avgSentiment: calculateAverageSentiment(logs),
    };

    // Get connected status
    const connectedChannels = {
      gmail: automation.connectedChannels?.gmail || false,
      whatsapp: automation.connectedChannels?.whatsapp || false,
    };

    console.log(`✅ Channel data retrieved:`, metrics);

    res.json({
      metrics,
      connectedChannels,
      automation: {
        status: automation.status,
        selectedOptions: automation.selectedOptions,
      },
    });
  } catch (err) {
    console.error('❌ getChannelData error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Helper function to calculate average sentiment
function calculateAverageSentiment(logs) {
  if (logs.length === 0) return 'neutral';
  
  const sentimentMap = { positive: 1, neutral: 0, negative: -1 };
  const avg = logs.reduce((sum, log) => sum + (sentimentMap[log.sentiment] || 0), 0) / logs.length;
  
  if (avg > 0.3) return 'positive';
  if (avg < -0.3) return 'negative';
  return 'neutral';
}

export default { getAnalytics, getChannelData };