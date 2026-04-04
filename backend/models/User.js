import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  picture: { type: String, default: '' },
  gmailAccessToken: { type: String, default: '' },
  gmailRefreshToken: { type: String, default: '' },
  gmailEmail: { type: String, default: '' },
  isOnboarded: { type: Boolean, default: false },

  // ── Onboarding State ───────────────────────────────────────────────────────
  onboarding: {
    selectedAutomations:   { type: [String], default: [] },
    selectedSubcategories: { type: [String], default: [] },
    connectedChannels: {
      gmail:    { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false },
    },
    completed:    { type: Boolean, default: false },
    completedAt:  { type: Date,    default: null },
    automationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Automation', default: null },
  },

  // ── Persistent Lead Intelligence ───────────────────────────────────────────
  lead: {
    type:          { type: String, enum: ['HOT', 'WARM', 'COLD', null], default: null },
    score:         { type: Number, min: 0, max: 100, default: null },
    previousScore: { type: Number, min: 0, max: 100, default: null },
    trend:         { type: String, enum: ['increasing', 'decreasing', 'stable', null], default: null },
    intent:        { type: String, default: null },
    signals:       [{ type: String }],
    reason:        { type: String, default: null },
    summary:       { type: String, default: null },
    lastInteraction: { type: Date, default: null },
  },
}, { timestamps: true });

// Fast dashboard queries: find all HOT leads, sort by score desc
userSchema.index({ 'lead.type': 1, 'lead.score': -1 });

export default mongoose.model('User', userSchema);

