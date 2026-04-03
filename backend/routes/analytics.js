import express from 'express';
import { getAnalytics, getChannelData } from '../controllers/analyticsController.js';
import { verifyApiKey } from '../middleware/auth.js';

const router = express.Router();

// Get analytics summary for a user
router.get('/:userId', getAnalytics);

// Get channel-specific data
router.get('/:userId/channels', getChannelData);

export default router;