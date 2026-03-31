import passport from 'passport';
import jwt from 'jsonwebtoken';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const hasGoogleCreds =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id';

// ─── Google OAuth ─────────────────────────────────────────────────────────────
export const googleAuth = (req, res, next) => {
  if (!hasGoogleCreds) {
    return res.status(501).json({ error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env' });
  }
  passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.send'] })(req, res, next);
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

// ─── Get current user ────────────────────────────────────────────────────────
export const getMe = (req, res) => {
  if (req.user) {
    return res.json({ user: req.user });
  }
  if (req.session.mockUser) {
    return res.json({ user: req.session.mockUser });
  }
  return res.status(401).json({ error: 'Not authenticated' });
};

// ─── Logout ──────────────────────────────────────────────────────────────────
export const logout = (req, res) => {
  req.session.destroy(() => {
    req.logout?.(() => {});
    res.json({ success: true });
  });
};
