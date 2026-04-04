import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  phone:     { type: String, required: true },          // WhatsApp number e.g. whatsapp:+919876543210
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  subject:   { type: String, required: true },          // "submit Data Science assignment"
  remindAt:  { type: Date, required: true },            // exact UTC datetime to fire
  sent:      { type: Boolean, default: false },
  sentAt:    { type: Date, default: null },
}, { timestamps: true });

// Index for quick polling of pending reminders
reminderSchema.index({ sent: 1, remindAt: 1 });

export default mongoose.model('Reminder', reminderSchema);
