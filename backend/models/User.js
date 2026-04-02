import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  picture: { type: String, default: '' },
  gmailAccessToken: { type: String, default: '' },
  gmailRefreshToken: { type: String, default: '' },
  gmailEmail: { type: String, default: '' }, // User's Gmail account email
  isOnboarded: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
