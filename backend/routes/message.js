import express from 'express';
import { analyzeMessage, handleIncomingWhatsApp } from '../controllers/messageController.js';

const router = express.Router();

// POST /analyze-message - for analyzing messages via API
router.post('/', analyzeMessage);

// POST /whatsapp-webhook - for receiving incoming WhatsApp messages from Twilio
router.post('/whatsapp-webhook', handleIncomingWhatsApp);

export default router;
