import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },
  automationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Automation', sparse: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['complaint', 'query', 'order', 'cancellation', 'unknown'],
    default: 'unknown',
  },
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
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Log', logSchema);
