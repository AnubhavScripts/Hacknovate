import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const hasGoogleCreds =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id';

if (hasGoogleCreds) {

  // ─── Strategy 1: Login (profile + email only) ──────────────────────────────
  passport.use('google', new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          user.accessToken = accessToken;
          if (refreshToken) user.refreshToken = refreshToken;
          await user.save();
        } else {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            picture: profile.photos?.[0]?.value || '',
            accessToken,
            refreshToken: refreshToken || '',
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));

  // ─── Strategy 2: Gmail OAuth (requests Gmail modify scope) ──────────────────
  passport.use('gmail', new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GMAIL_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          // Save Gmail-specific tokens
          user.gmailAccessToken = accessToken;
          user.gmailRefreshToken = refreshToken || user.gmailRefreshToken;
          user.gmailEmail = profile.emails[0].value;
          await user.save();
        } else {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            picture: profile.photos?.[0]?.value || '',
            gmailAccessToken: accessToken,
            gmailRefreshToken: refreshToken || '',
            gmailEmail: profile.emails[0].value,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
}

passport.serializeUser((user, done) => {
  done(null, user._id || user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
