import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },
  automationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Automation', sparse: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['complaint', 'query', 'order', 'cancellation', 'invalid', 'unknown'],
    default: 'unknown',
  },
  subject: { type: String, default: '' },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  action: { type: String, default: '' },
  reply: { type: String, default: '' },
  channel: { type: String, enum: ['email', 'whatsapp', 'simulation'], default: 'simulation' },
  from: { type: String, sparse: true }, // WhatsApp sender's number or email
  
  // ✨ NEW: Escalation tracking
  escalated: { type: Boolean, default: false },
  escalationReason: { type: String, default: '' },
  escalatedAt: { type: Date, default: null },
  escalatedTo: { type: String, default: '' }, // who it was escalated to
  requiresHumanReview: { type: Boolean, default: false },
  
  // ✨ NEW: Audit & Decision tracking
  ruleApplied: { type: mongoose.Schema.Types.ObjectId, default: null },
  aiConfidence: { type: Number, min: 0, max: 1, default: 0.5 },
  classificationModel: { type: String, default: 'groq/mixtral' },
  
  // ✨ NEW: Human feedback loop
  humanReview: {
    reviewed: { type: Boolean, default: false },
    reviewedAt: { type: Date, default: null },
    feedback: { type: String, enum: ['approved', 'rejected', 'needs_edit'], default: null },
    manualReply: { type: String, default: '' },
  },
  
  // ✨ NEW: Conversation threading
  conversationId: { type: String, default: '' }, // Gmail threadId or WhatsApp chatId
  inReplyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Log', default: null },
  hasReplied: { type: Boolean, default: false },

  // ✨ NEW: Fintech lead intelligence (HOT / WARM / COLD)
  lead: {
    type:    { type: String, enum: ['HOT', 'WARM', 'COLD'], default: null },
    score:   { type: Number, min: 0, max: 100,              default: null },
    intent:  { type: String, default: null },
    signals: [{ type: String }],
    reason:  { type: String, default: null },
  },

  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for efficient querying
logSchema.index({ userId: 1, escalated: 1 });
logSchema.index({ userId: 1, conversationId: 1 });
logSchema.index({ escalated: 1, requiresHumanReview: 1 });

export default mongoose.model('Log', logSchema);
