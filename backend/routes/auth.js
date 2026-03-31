import express from 'express';
import { googleAuth, googleCallback, mockLogin, getMe, logout } from '../controllers/authController.js';

const router = express.Router();

// Real Google OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Mock login for demo (when OAuth is not configured)
router.post('/mock-login', mockLogin);

// Current user
router.get('/me', getMe);

// Logout
router.post('/logout', logout);

export default router;
