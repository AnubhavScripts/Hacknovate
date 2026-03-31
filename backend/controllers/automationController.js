import Automation from '../models/Automation.js';
import User from '../models/User.js';

// ─── Save onboarding automation config ───────────────────────────────────────
export const saveAutomation = async (req, res) => {
  try {
    const { userId, selectedOptions, connectedChannels, status } = req.body;

    // Upsert — one automation per user
    const automation = await Automation.findOneAndUpdate(
      { userId },
      { selectedOptions, connectedChannels, status: status || 'active' },
      { upsert: true, new: true }
    );

    // Mark user as onboarded
    if (userId && userId !== 'mock_user_001') {
      await User.findByIdAndUpdate(userId, { isOnboarded: true });
    }

    res.json({ success: true, automation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Get automation config for a user ────────────────────────────────────────
export const getAutomation = async (req, res) => {
  try {
    const { userId } = req.params;
    const automation = await Automation.findOne({ userId });
    if (!automation) return res.status(404).json({ error: 'No automation found' });
    res.json(automation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Update automation status (pause / resume) ────────────────────────────────
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const automation = await Automation.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ success: true, automation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
