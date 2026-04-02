import express from 'express';
import { handleGmailWebhook, webhookHealth } from '../controllers/webhookController.js';

const router = express.Router();

// Health check
router.get('/gmail/health', webhookHealth);

// Main Gmail webhook - receives Pub/Sub push notifications
router.post('/gmail', handleGmailWebhook);

export default router;
