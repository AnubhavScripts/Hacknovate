import Automation from '../models/Automation.js';
import User from '../models/User.js';
import { getDefaultRules } from '../services/ruleEngine.js';

/**
 * Resolve authenticated userId from either:
 *  - req.user._id   (Google OAuth via Passport)
 *  - req.session.mockUser._id  (email/password login)
 *  - req.body.userId (fallback from client, used as last resort)
 */
const resolveUserId = (req) =>
  req.user?._id?.toString() ||
  req.session?.mockUser?._id?.toString() ||
  req.body?.userId?.toString() ||
  null;

/**
 * Helper: find the user doc if userId is a real Mongo ObjectId (not a mock id)
 */
const findUser = async (userId) => {
  if (!userId || userId === 'mock_user_001' || userId.startsWith('user_')) return null;
  try {
    return await User.findById(userId);
  } catch {
    return null; // invalid ObjectId format — likely a mock/demo user
  }
};

// ─── POST /onboarding/automations ────────────────────────────────────────────
export const saveAutomations = async (req, res) => {
  try {
    const { automations } = req.body;
    const userId = resolveUserId(req);

    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    if (!Array.isArray(automations)) return res.status(400).json({ error: 'automations must be an array' });

    // Persist to User doc (real users only)
    const user = await findUser(userId);
    if (user) {
      user.onboarding = user.onboarding || {};
      user.onboarding.selectedAutomations = automations;
      await user.save();
    }

    // Also upsert Automation doc so getAutomation() on the dashboard works
    await Automation.findOneAndUpdate(
      { userId },
      { selectedOptions: automations },
      { upsert: true, new: true }
    );

    console.log('✅ [onboarding/automations] Saved for:', userId, automations);
    return res.json({ success: true, message: 'Automations saved', automations });
  } catch (err) {
    console.error('[onboarding/automations]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ─── POST /onboarding/subcategories ──────────────────────────────────────────
export const saveSubcategories = async (req, res) => {
  try {
    const { subcategories } = req.body;
    const userId = resolveUserId(req);

    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    if (!Array.isArray(subcategories)) return res.status(400).json({ error: 'subcategories must be an array' });

    const user = await findUser(userId);
    if (user) {
      user.onboarding = user.onboarding || {};
      user.onboarding.selectedSubcategories = subcategories;
      await user.save();
    }

    await Automation.findOneAndUpdate(
      { userId },
      { selectedSubcategories: subcategories },
      { upsert: true, new: true }
    );

    console.log('✅ [onboarding/subcategories] Saved for:', userId, subcategories);
    return res.json({ success: true, message: 'Subcategories saved', subcategories });
  } catch (err) {
    console.error('[onboarding/subcategories]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ─── POST /onboarding/channels ────────────────────────────────────────────────
export const saveChannels = async (req, res) => {
  try {
    const { channels } = req.body;
    const userId = resolveUserId(req);

    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    if (typeof channels !== 'object' || Array.isArray(channels)) {
      return res.status(400).json({ error: 'channels must be an object' });
    }

    const user = await findUser(userId);
    if (user) {
      user.onboarding = user.onboarding || {};
      user.onboarding.connectedChannels = channels;
      await user.save();
    }

    await Automation.findOneAndUpdate(
      { userId },
      { connectedChannels: channels },
      { upsert: true, new: true }
    );

    console.log('✅ [onboarding/channels] Saved for:', userId, channels);
    return res.json({ success: true, message: 'Channels saved', channels });
  } catch (err) {
    console.error('[onboarding/channels]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ─── POST /onboarding/deploy ──────────────────────────────────────────────────
// Final step: consolidate everything, mark user as onboarded, upsert Automation.
export const deployOnboarding = async (req, res) => {
  try {
    const { selectedAutomations, selectedSubcategories, connectedChannels } = req.body;
    const userId = resolveUserId(req);

    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    const user = await findUser(userId);

    // Merge incoming payload with whatever was already saved step-by-step
    const saved = user?.onboarding || {};
    const finalAutomations   = selectedAutomations   ?? saved.selectedAutomations   ?? [];
    const finalSubcategories = selectedSubcategories ?? saved.selectedSubcategories ?? [];
    const finalChannels      = connectedChannels      ?? saved.connectedChannels      ?? { gmail: false, whatsapp: false };

    // ── Upsert Automation (never duplicate) ──────────────────────────────────
    const existingAuto = await Automation.findOne({ userId });
    const isNew = !existingAuto;

    const automation = await Automation.findOneAndUpdate(
      { userId },
      {
        name: user ? `${user.email} - AI Assistant` : 'AI Assistant',
        selectedOptions:      finalAutomations,
        selectedSubcategories: finalSubcategories,
        connectedChannels:    finalChannels,
        status:               'active',
        ...(isNew && { rules: getDefaultRules() }),
      },
      { upsert: true, new: true }
    );

    // ── Mark onboarding complete in User doc ─────────────────────────────────
    if (user) {
      user.onboarding = {
        ...(user.onboarding || {}),
        selectedAutomations:   finalAutomations,
        selectedSubcategories: finalSubcategories,
        connectedChannels:     finalChannels,
        completed:    true,
        completedAt:  new Date(),
        automationId: automation._id,
      };
      user.isOnboarded = true;
      await user.save();
    } else if (req.session?.mockUser) {
      // For session-only / mock users, just update the session flag
      req.session.mockUser.isOnboarded = true;
      req.session.save?.();
    }

    console.log(`🚀 [onboarding/deploy] Complete for ${userId} — automation ${automation._id}`);
    return res.json({
      success: true,
      message: 'Onboarding completed',
      automation,
      redirectTo: '/dashboard',
    });
  } catch (err) {
    console.error('[onboarding/deploy]', err);
    return res.status(500).json({ error: err.message });
  }
};

// ─── GET /onboarding/config ───────────────────────────────────────────────────
export const getOnboardingConfig = async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    // Prefer Automation doc (most up-to-date) → fall back to User.onboarding
    const automation = await Automation.findOne({ userId });

    if (automation) {
      return res.json({
        success: true,
        config: {
          selectedAutomations:   automation.selectedOptions   || [],
          selectedSubcategories: automation.selectedSubcategories || [],
          connectedChannels:     automation.connectedChannels || { gmail: false, whatsapp: false },
          status:                automation.status,
          completed:             true,
          automationId:          automation._id,
        },
      });
    }

    // Fallback: User.onboarding subdocument
    const user = await findUser(userId);
    if (user?.onboarding?.completed) {
      return res.json({ success: true, config: user.onboarding });
    }

    return res.json({ success: true, config: null });
  } catch (err) {
    console.error('[onboarding/config]', err);
    return res.status(500).json({ error: err.message });
  }
};
