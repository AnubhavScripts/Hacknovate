import express from 'express';
import { googleAuth, googleCallback, gmailConnect, gmailCallback, signup, emailLogin, mockLogin, getMe, logout } from '../controllers/authController.js';

const router = express.Router();

// Google Login (profile + email ONLY — no Gmail permission)
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Gmail Connector (step 3 — gmail.send permission ONLY)
// User clicks "Connect Gmail" → this fires a separate consent screen
router.get('/gmail/connect', gmailConnect);
router.get('/gmail/callback', gmailCallback);

// Email + password (used by Login.jsx and SignUp.jsx)
router.post('/signup', signup);
router.post('/login', emailLogin);

// Mock login for demo
router.post('/mock-login', mockLogin);

// Current user
router.get('/me', getMe);

// Logout
router.post('/logout', logout);

export default router;
