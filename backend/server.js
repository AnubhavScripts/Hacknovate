import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Route imports
import authRoutes from './routes/auth.js';
import automationRoutes from './routes/automation.js';
import messageRoutes from './routes/message.js';
import logRoutes from './routes/logs.js';
import webhookRoutes from './routes/webhook.js';
import escalationRoutes from './routes/escalations.js';
import rulesRoutes from './routes/rules.js';
import conversationRoutes from './routes/conversations.js';
import analyticsRoutes from './routes/analytics.js';
import reminderRoutes from './routes/reminders.js';
import onboardingRoutes from './routes/onboarding.js';

// Middleware imports
import { verifyApiKey } from './middleware/auth.js';

// Reminder poller (fires every 60 seconds)
import { startReminderPoller } from './services/reminderService.js';

// Passport config
import './config/passport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Trust Railway's reverse proxy ────────────────────────────────────────────
// Railway terminates HTTPS at the load balancer, then forwards requests to the
// app over HTTP. Without this, Express thinks the connection is insecure and
// refuses to set Secure cookies → session cookie is never sent → 401 on /auth/me
app.set('trust proxy', 1);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use MongoDB-backed sessions so sessions survive Railway restarts/restarts.
// Falls back to in-memory (MemoryStore) if MONGODB_URI is not set.
const MONGODB_URI = process.env.MONGODB_URI;

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  store: MONGODB_URI
    ? MongoStore.create({
        mongoUrl: MONGODB_URI,
        ttl: 24 * 60 * 60, // 24 hours in seconds
        touchAfter: 24 * 3600, // lazy session update
      })
    : undefined, // falls back to MemoryStore in dev
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in ms
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/automation', automationRoutes);
app.use('/message', messageRoutes);
app.use('/logs', logRoutes);
app.use('/webhook', webhookRoutes);
app.use('/escalations', escalationRoutes);
app.use('/rules', rulesRoutes);
app.use('/conversations', conversationRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/reminders', reminderRoutes);
app.use('/onboarding', onboardingRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start server immediately (DB connects async so it never blocks) ──────────
app.listen(PORT, () => {
  console.log(`🚀 MerchantAI backend running on http://localhost:${PORT}`);

  // Connect to MongoDB after server is listening (non-blocking)
  if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
      .then(() => {
        console.log('✅ MongoDB connected');
        startReminderPoller(); // Start reminder scheduler after DB is ready
      })
      .catch(err => console.warn('⚠️  MongoDB connection failed:', err.message));
  } else {
    console.warn('⚠️  MONGODB_URI not set — running in DB-less demo mode');
  }
});

export default app;
