import mongoose from 'mongoose';

/**
 * Conversation — one document per unique customer (keyed by fromNumber).
 *
 * Updated (upserted) on EVERY WhatsApp message so the dashboard always has
 * a clean, up-to-date conversation-level view alongside the raw message logs.
 */
const conversationSchema = new mongoose.Schema({
  // Primary key — WhatsApp sender number e.g. "whatsapp:+919XXXXXXXXX"
  conversationId: { type: String, required: true, unique: true },

  // Owning merchant (from the active Automation)
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },
  automationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Automation', sparse: true },

  // Latest AI-generated summary (1–2 lines about intent + key facts)
  summary: { type: String, default: '' },

  // Lead intelligence snapshot (latest classification)
  lead: {
    type:    { type: String, enum: ['HOT', 'WARM', 'COLD', null], default: null },
    score:   { type: Number, min: 0, max: 100, default: null },
    trend:   { type: String, enum: ['increasing', 'decreasing', 'stable', null], default: null },
    intent:  { type: String, default: null },
    signals: [{ type: String }],
    reason:  { type: String, default: null },
  },

  // Conversation stats
  totalMessages: { type: Number, default: 0 },
  lastMessage:   { type: String, default: '' },
  flowType:      { type: String, enum: ['sales', 'support', 'general'], default: 'general' },

  firstMessageAt: { type: Date, default: Date.now },
  lastMessageAt:  { type: Date, default: Date.now },
}, { timestamps: true });

// Fast look-up: all HOT conversations for a merchant
conversationSchema.index({ userId: 1, 'lead.type': 1, 'lead.score': -1 });
conversationSchema.index({ conversationId: 1 }, { unique: true });

export default mongoose.model('Conversation', conversationSchema);
