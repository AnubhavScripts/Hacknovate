import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
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

// Middleware imports
import { verifyApiKey } from './middleware/auth.js';

// Passport config
import './config/passport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/automation', automationRoutes);
app.use('/analyze-message', messageRoutes);
app.use('/logs', logRoutes);
app.use('/webhook', webhookRoutes);
app.use('/escalations', escalationRoutes);
app.use('/rules', rulesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Start server immediately (DB connects async so it never blocks) ──────────
app.listen(PORT, () => {
  console.log(`🚀 MerchantAI backend running on http://localhost:${PORT}`);

  // Connect to MongoDB after server is listening (non-blocking)
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/merchantai', {
    serverSelectionTimeoutMS: 5000,
  })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.warn('⚠️  MongoDB not available — running in DB-less demo mode:', err.message));
});

export default app;
