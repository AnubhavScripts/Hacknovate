import mongoose from 'mongoose';

// Rule schema for conditional automation
const ruleSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Escalate Urgent Complaints"
  enabled: { type: Boolean, default: true },
  conditions: [{
    field: { 
      type: String, 
      enum: ['type', 'sentiment', 'priority', 'contains'],
      required: true 
    }, // What field to check
    operator: { 
      type: String, 
      enum: ['equals', 'contains', 'gt', 'gte', 'lt', 'lte'],
      default: 'equals'
    }, // How to compare
    value: { type: String, required: true }, // What value to check against
  }],
  action: {
    type: { 
      type: String, 
      enum: ['auto_reply', 'escalate', 'label', 'notify'],
      required: true 
    }, // What action to take
    params: mongoose.Schema.Types.Mixed, // Action-specific params
  },
  priority: { type: Number, default: 10 }, // Higher = execute first
}, { _id: true });

const automationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: 'Default Automation' },
  
  // NEW: Industry & Workflows instead of selectedOptions
  industry: {
    type: String,
    enum: ['ecommerce', 'education', 'finance'],
    default: 'ecommerce',
  },
  workflows: {
    type: [String],
    default: [],
  },
  
  // Legacy support (kept for backwards compatibility)
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
  
  // NEW: AI Classification settings
  aiClassification: {
    enabled: { type: Boolean, default: true },
    classifyAs: {
      type: [String],
      enum: ['hot', 'cold'],
      default: ['hot', 'cold'],
    },
  },
  
  // ✨ Rule-based automation
  rules: [ruleSchema],
  
  // Default rule configurations (fallback)
  defaultActions: {
    onEscalation: { type: String, enum: ['pause', 'notify', 'create_ticket'], default: 'notify' },
    onUrgentComplaint: { type: String, enum: ['escalate', 'reply_and_escalate'], default: 'escalate' },
    onQuery: { type: String, enum: ['auto_reply', 'escalate'], default: 'auto_reply' },
    onOrder: { type: String, enum: ['auto_reply', 'escalate'], default: 'auto_reply' },
  },
  
  lastEmailCheck: { type: Date, default: Date.now },
}, { timestamps: true });

// Ensure rules are sorted by priority (high first)
automationSchema.pre('save', function(next) {
  if (this.rules && this.rules.length > 0) {
    this.rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  next();
});

export default mongoose.model('Automation', automationSchema);
