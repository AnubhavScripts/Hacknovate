import passport from 'passport';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import { subscribeToGmailNotifications } from '../services/gmailService.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const hasGoogleCreds =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id';

// ─── Google OAuth (Login only — profile + email) ─────────────────────────────
export const googleAuth = (req, res, next) => {
  if (!hasGoogleCreds) {
    return res.status(501).json({ error: 'Google OAuth not configured.' });
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],   // login only — NO gmail permission here
    accessType: 'offline',
    prompt: 'consent',
  })(req, res, next);
};

// ─── Helper: create a Gmail-scoped OAuth2 client ─────────────────────────────
const makeGmailOAuth2Client = () => new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GMAIL_CALLBACK_URL || 'https://hacknovate-production.up.railway.app/auth/gmail/callback'
);

// ─── Gmail Connector OAuth (Step 3 — gmail.modify scope) ─────────────────────
// Requests full Gmail access: read, send, and modify emails
export const gmailConnect = (req, res) => {
  if (!hasGoogleCreds) {
    return res.status(501).json({ error: 'Google OAuth not configured.' });
  }
  const oauth2Client = makeGmailOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.modify',   // Full Gmail access (read, send, modify)
      'https://www.googleapis.com/auth/gmail.readonly',  // Fallback read-only
    ],
  });
  return res.redirect(authUrl);
};

export const gmailCallback = async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    console.error('[gmailCallback] Google returned error:', error);
    const reason = encodeURIComponent(error || 'no_code');
    return res.redirect(`${FRONTEND_URL}/onboarding?gmail=error&reason=${reason}`);
  }

  try {
    const oauth2Client = makeGmailOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    console.log('[gmailCallback] Tokens received:', !!tokens.access_token);

    // Save access token to DB and/or session
    let savedUserId = null;
    try {
      const { default: User } = await import('../models/User.js');
      const userId = req.session?.mockUser?._id || req.user?._id;
      if (userId && userId !== 'mock_user_001') {
        await User.findByIdAndUpdate(userId, {
          gmailAccessToken: tokens.access_token,
          ...(tokens.refresh_token && { gmailRefreshToken: tokens.refresh_token }),
        });
        savedUserId = userId;
        console.log('[gmailCallback] Token saved to DB for user:', userId);
      }
      // Store in session for immediate use regardless of DB
      if (req.session) {
        req.session.gmailToken = tokens.access_token;
        req.session.save();
      }
    } catch (dbErr) {
      console.warn('[gmailCallback] DB save skipped:', dbErr.message);
    }

    // ── Start Gmail push notifications (fire-and-forget) ─────────────────────
    // This calls gmail.users.watch() so Google Pub/Sub pushes new-email events
    // to  POST /webhook/gmail  in real-time.
    const pubSubTopic = process.env.PUBSUB_TOPIC_NAME;
    if (pubSubTopic && savedUserId) {
      subscribeToGmailNotifications(tokens.access_token, pubSubTopic, String(savedUserId))
        .then(() => console.log('[gmailCallback] Gmail push-notifications activated for user:', savedUserId))
        .catch(err => console.warn('[gmailCallback] gmail.watch() failed (non-fatal):', err.message));
    } else if (!pubSubTopic) {
      console.warn('[gmailCallback] PUBSUB_TOPIC_NAME not set — skipping gmail.watch() (polling mode only)');
    }

    return res.redirect(`${FRONTEND_URL}/onboarding?gmail=connected&step=3`);
  } catch (err) {
    console.error('[gmailCallback] Token exchange failed:', err.message);
    const reason = encodeURIComponent(err.message);
    return res.redirect(`${FRONTEND_URL}/onboarding?gmail=error&reason=${reason}`);
  }
};

export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: true }, (err, user) => {
    if (err || !user) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) return res.redirect(`${FRONTEND_URL}/login?error=login_failed`);
      const redirectPath = user.isOnboarded ? '/dashboard' : '/onboarding';
      return res.redirect(`${FRONTEND_URL}${redirectPath}`);
    });
  })(req, res, next);
};

// ─── Signup (email + password) ────────────────────────────────────────────────
export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });

  try {
    // Import User lazily to avoid circular deps
    const { default: User } = await import('../models/User.js');

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered. Please log in.' });

    const user = await User.create({ name, email, googleId: undefined });

    console.log('🆕 User created:', { _id: user._id, name: user.name, email: user.email });

    // Store in session with MongoDB _id (toString() ensures it's serialisable)
    const sessionUser = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      isOnboarded: false,
    };
    req.session.mockUser = sessionUser;

    return res.json({ success: true, user: sessionUser, redirectTo: '/onboarding' });
  } catch (err) {
    console.error('❌ Signup error:', err.message);
    // DB not available — fall back to a timestamped mock id
    const mockUser = { _id: `user_${Date.now()}`, name, email, isOnboarded: false };
    req.session.mockUser = mockUser;
    return res.json({ success: true, user: mockUser, redirectTo: '/onboarding' });
  }
};

// ─── Email + Password Login ───────────────────────────────────────────────────
export const emailLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const { default: User } = await import('../models/User.js');
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No account found with this email. Please sign up.' });

    console.log('✅ User found:', { _id: user._id, name: user.name, email: user.email, isOnboarded: user.isOnboarded });

    // For MVP: no password hashing — just match email (add bcrypt in production)
    const sessionUser = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      isOnboarded: user.isOnboarded,
    };
    req.session.mockUser = sessionUser;

    return res.json({
      success: true,
      user: sessionUser,
      redirectTo: user.isOnboarded ? '/dashboard' : '/onboarding',
    });
  } catch (err) {
    console.error('❌ Email login error:', err.message);
    // DB not available — create a demo session
    const mockUser = { _id: 'mock_user_001', name: 'Demo Merchant', email, isOnboarded: false };
    req.session.mockUser = mockUser;
    return res.json({ success: true, user: mockUser, redirectTo: '/onboarding' });
  }
};

// ─── Mock login (for demo when OAuth not configured) ─────────────────────────
export const mockLogin = (req, res) => {
  const mockUser = {
    _id: 'mock_user_001',
    name: req.body.name || 'Demo Merchant',
    email: req.body.email || 'demo@merchantai.app',
    picture: '',
    isOnboarded: false,
  };
  req.session.mockUser = mockUser;
  res.json({ success: true, user: mockUser, redirectTo: '/onboarding' });
};

// ─── Get current user ─────────────────────────────────────────────────────────
// Tries DB first (so lead/HOT/WARM/COLD and full profile are included),
// falls back to session snapshot so the endpoint never 401s due to a DB hiccup.
export const getMe = async (req, res) => {
  // ── Passport Google session ───────────────────────────────────────────────
  if (req.user) {
    console.log('✅ getMe: Found req.user:', req.user._id);
    try {
      const { default: User } = await import('../models/User.js');
      const fullUser = await User.findById(req.user._id)
        .select('-gmailAccessToken -gmailRefreshToken')
        .lean();
      return res.json({ user: fullUser || req.user });
    } catch {
      return res.json({ user: req.user });
    }
  }

  // ── Email / mock session ──────────────────────────────────────────────────
  if (req.session?.mockUser) {
    const sessionUser = req.session.mockUser;
    console.log('✅ getMe: Found session user:', sessionUser._id);

    // Skip DB lookup for pure demo/mock ids — they don't exist in the DB
    if (String(sessionUser._id) === 'mock_user_001' || String(sessionUser._id).startsWith('user_')) {
      return res.json({ user: sessionUser });
    }

    try {
      const { default: User } = await import('../models/User.js');
      const fullUser = await User.findById(sessionUser._id)
        .select('-gmailAccessToken -gmailRefreshToken')
        .lean();
      return res.json({ user: fullUser || sessionUser });
    } catch {
      // DB unreachable — return session snapshot so UI doesn't break
      return res.json({ user: sessionUser });
    }
  }

  console.warn('⚠️ getMe: No authenticated user found');
  return res.status(401).json({ error: 'Not authenticated' });
};

// ─── Logout ──────────────────────────────────────────────────────────────────
export const logout = (req, res) => {
  req.session.destroy(() => {
    req.logout?.(() => {});
    res.json({ success: true });
  });
};