import express from 'express';
import { analyzeMessage, handleIncomingWhatsApp } from '../controllers/messageController.js';
import { verifyApiKey } from '../middleware/auth.js';
import { analyzeMessageLimiter, webhookLimiter, validateMessage, validateAutomationId } from '../middleware/validation.js';

const router = express.Router();

// POST /analyze-message - for analyzing messages via API (protected)
router.post(
  '/',
  verifyApiKey,
  analyzeMessageLimiter,
  validateMessage,
  analyzeMessage
);

// POST /whatsapp-webhook/:automationId - for receiving incoming WhatsApp messages from Twilio
router.post(
  '/whatsapp-webhook/:automationId',
  webhookLimiter,
  validateAutomationId,
  handleIncomingWhatsApp
);

export default router;
