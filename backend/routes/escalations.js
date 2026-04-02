import express from 'express';
import {
  getPending,
  submitReview,
  getMetrics,
} from '../controllers/escalationController.js';
import { verifyApiKey } from '../middleware/auth.js';

const router = express.Router();

// Get pending escalations for a user
router.get(
  '/pending/:userId',
  verifyApiKey,
  getPending
);

// Submit human review of an escalation
router.post(
  '/:logId/review',
  verifyApiKey,
  submitReview
);

// Get escalation metrics
router.get(
  '/metrics/:userId',
  verifyApiKey,
  getMetrics
);

export default router;
