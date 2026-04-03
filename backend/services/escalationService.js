import { sendEmail } from './gmailService.js';
import Log from '../models/Log.js';
import User from '../models/User.js';

/**
 * Escalation Service
 * Handles escalation workflow: detect → notify → track → await human decision
 */

/**
 * Escalate a message to human review
 * Sends notification email to the merchant
 * @param {Object} log - The log entry to escalate
 * @param {Object} user - The merchant user
 * @param {string} reason - Why it was escalated
 * @returns {Object} - Escalation result
 */
export async function escalateMessage(log, user, reason) {
  if (!user || !user.email) {
    console.warn('⚠️  Cannot escalate: no user email');
    return { success: false, error: 'User email not found' };
  }

  try {
    // Update log with escalation info
    const escalationTime = new Date();
    await Log.findByIdAndUpdate(log._id, {
      escalated: true,
      escalationReason: reason,
      escalatedAt: escalationTime,
      escalatedTo: 'human_review',
      requiresHumanReview: true,
    });

    // Build escalation email
    const subject = `🚨 [${log.priority.toUpperCase()}] Escalated: Customer ${log.type}`;
    const emailBody = buildEscalationEmail(log, reason);

    // Send notification to merchant
    if (user.gmailAccessToken) {
      try {
        await sendEmail(
          user.gmailAccessToken,
          user.email,
          subject,
          emailBody,
          true
        );
        console.log(`📧 Escalation notification sent to ${user.email}`);
      } catch (emailErr) {
        console.warn('⚠️  Could not send escalation email:', emailErr.message);
        // Don't fail escalation if email fails
      }
    }

    console.log(`🚨 Escalated message: ${log._id} - ${reason}`);

    return {
      success: true,
      escalatedLogId: log._id,
      escalatedAt: escalationTime,
      notificationSent: !!user.gmailAccessToken,
    };

  } catch (err) {
    console.error('Escalation error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Build HTML email for escalated message
 * @param {Object} log - The escalated log entry
 * @param {string} reason - Escalation reason
 * @returns {string} - HTML email body
 */
function buildEscalationEmail(log, reason) {
  const priorityColor = {
    urgent: '#dc2626',
    high: '#f97316',
    medium: '#3b82f6',
    low: '#6b7280',
  }[log.priority] || '#3b82f6';

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        
        <!-- Header with priority badge -->
        <div style="background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            
            <div style="background-color: ${priorityColor}; color: white; padding: 20px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 10px;">🚨</div>
                <h1 style="margin: 0; font-size: 20px;">Message Escalated for Review</h1>
                <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Priority: <strong>${log.priority.toUpperCase()}</strong></p>
            </div>

            <!-- Content -->
            <div style="padding: 30px;">
                
                <!-- Reason -->
                <div style="margin-bottom: 25px;">
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Reason for Escalation</p>
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                        <p style="margin: 0; color: #92400e; font-weight: 500;">${reason}</p>
                    </div>
                </div>

                <!-- Message Details -->
                <div style="margin-bottom: 25px;">
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Customer Message</p>
                    <div style="background-color: #f3f4f6; border-radius: 6px; padding: 15px;">
                        <p style="margin: 0; white-space: pre-wrap; color: #1f2937;">${log.message}</p>
                    </div>
                </div>

                <!-- Classification Details -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                    <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px;">
                        <p style="margin: 0 0 5px 0; font-size: 11px; color: #6b7280; font-weight: 600;">Type</p>
                        <p style="margin: 0; font-weight: 600; color: #1f2937;">${log.type}</p>
                    </div>
                    <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px;">
                        <p style="margin: 0 0 5px 0; font-size: 11px; color: #6b7280; font-weight: 600;">Sentiment</p>
                        <p style="margin: 0; font-weight: 600; color: #1f2937;">${log.sentiment}</p>
                    </div>
                    <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px;">
                        <p style="margin: 0 0 5px 0; font-size: 11px; color: #6b7280; font-weight: 600;">From</p>
                        <p style="margin: 0; font-weight: 600; color: #1f2937;">${log.from || 'Customer'}</p>
                    </div>
                    <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px;">
                        <p style="margin: 0 0 5px 0; font-size: 11px; color: #6b7280; font-weight: 600;">Channel</p>
                        <p style="margin: 0; font-weight: 600; color: #1f2937;">${log.channel}</p>
                    </div>
                </div>

                <!-- AI Generated Action -->
                ${log.action ? `
                <div style="margin-bottom: 25px;">
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Recommended Action</p>
                    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; border-radius: 4px;">
                        <p style="margin: 0; color: #15803d;">${log.action}</p>
                    </div>
                </div>
                ` : ''}

                <!-- CTA -->
                <div style="margin-bottom: 20px;">
                    <a href="http://localhost:5173/dashboard" style="display: inline-block; background-color: ${priorityColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                        Review in Dashboard
                    </a>
                </div>

            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
                <p style="margin: 0;">This is an automated escalation notification from your MerchantAI automation system.</p>
                <p style="margin: 5px 0 0 0;">Timestamp: ${new Date().toLocaleString()}</p>
            </div>

        </div>

    </div>
</body>
</html>
  `.trim();
}

/**
 * Get pending escalations for a user
 * @param {string} userId - User ID
 * @returns {Array} - List of escalated logs awaiting review
 */
export async function getPendingEscalations(userId) {
  try {
    const pending = await Log.find({
      userId,
      escalated: true,
      requiresHumanReview: true,
      'humanReview.reviewed': false,
    })
      .sort({ escalatedAt: -1 })
      .limit(50);

    return pending;
  } catch (err) {
    console.error('Error fetching escalations:', err.message);
    return [];
  }
}

/**
 * Mark escalated message as reviewed by human
 * @param {string} logId - Log entry ID
 * @param {Object} review - { feedback, manualReply }
 * @returns {Object} - Updated log
 */
export async function reviewEscalation(logId, review) {
  try {
    const updated = await Log.findByIdAndUpdate(
      logId,
      {
        'humanReview.reviewed': true,
        'humanReview.reviewedAt': new Date(),
        'humanReview.feedback': review.feedback, // 'approved' | 'rejected' | 'needs_edit'
        'humanReview.manualReply': review.manualReply || '',
        requiresHumanReview: false,
      },
      { new: true }
    );

    console.log(`✅ Escalation reviewed: ${logId} - ${review.feedback}`);
    return updated;
  } catch (err) {
    console.error('Error reviewing escalation:', err.message);
    throw err;
  }
}

/**
 * Get escalation metrics for dashboard
 * @param {string} userId - User ID
 * @returns {Object} - Escalation stats
 */
export async function getEscalationMetrics(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, pending, reviewed, approved] = await Promise.all([
      Log.countDocuments({
        userId,
        escalated: true,
        escalatedAt: { $gte: today },
      }),
      Log.countDocuments({
        userId,
        escalated: true,
        requiresHumanReview: true,
        'humanReview.reviewed': false,
      }),
      Log.countDocuments({
        userId,
        escalated: true,
        'humanReview.reviewed': true,
        escalatedAt: { $gte: today },
      }),
      Log.countDocuments({
        userId,
        escalated: true,
        'humanReview.reviewed': true,
        'humanReview.feedback': 'approved',
        escalatedAt: { $gte: today },
      }),
    ]);

    return {
      totalToday: total,
      pending,
      reviewed,
      approvalRate: reviewed > 0 ? ((approved / reviewed) * 100).toFixed(1) + '%' : '0%',
    };
  } catch (err) {
    console.error('Error fetching escalation metrics:', err.message);
    return { totalToday: 0, pending: 0, reviewed: 0, approvalRate: '0%' };
  }
}
