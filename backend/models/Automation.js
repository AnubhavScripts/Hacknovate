import mongoose from 'mongoose';

const automationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  selectedOptions: {
    type: [String],
    enum: ['complaints', 'queries', 'order_tracking', 'cancellations'],
    default: [],
  },
  connectedChannels: {
    gmail: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'draft'],
    default: 'draft',
  },
}, { timestamps: true });

export default mongoose.model('Automation', automationSchema);
