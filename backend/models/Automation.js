import mongoose from 'mongoose';

const automationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  selectedOptions: {
    type: [String],
    enum: ['complaint_handling', 'query_answering', 'order_tracking', 'cancellation_requests'],
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
  lastEmailCheck: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Automation', automationSchema);
