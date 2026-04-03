import express from 'express';
import { handleGmailWebhook, webhookHealth } from '../controllers/webhookController.js';
import { handleWhatsAppWebhook, whatsappWebhookHealth } from '../controllers/whatsappWebhookController.js';

const router = express.Router();

// ─── Gmail (Google Cloud Pub/Sub push) ────────────────────────────────────────
router.get('/gmail/health', webhookHealth);
router.post('/gmail', handleGmailWebhook);

// ─── WhatsApp (Twilio) ────────────────────────────────────────────────────────
router.get('/whatsapp/health', whatsappWebhookHealth);
router.post('/whatsapp', handleWhatsAppWebhook);


export default router;
