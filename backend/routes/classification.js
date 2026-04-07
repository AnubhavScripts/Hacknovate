import express from 'express';
import { classifyMessage, classifyBatch } from '../services/aiClassificationService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/classify/message
 * Classify a single message
 */
router.post('/message', authenticate, async (req, res) => {
  try {
    const { message, industry = 'ecommerce' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const classification = classifyMessage(message, { industry });
    
    return res.status(200).json({
      success: true,
      data: classification,
    });
  } catch (error) {
    console.error('Classification error:', error);
    return res.status(500).json({ error: 'Classification failed' });
  }
});

/**
 * POST /api/classify/batch
 * Classify multiple messages
 */
router.post('/batch', authenticate, async (req, res) => {
  try {
    const { messages, industry = 'ecommerce' } = req.body;
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    const classifications = classifyBatch(messages, { industry });
    
    return res.status(200).json({
      success: true,
      count: classifications.length,
      data: classifications,
    });
  } catch (error) {
    console.error('Batch classification error:', error);
    return res.status(500).json({ error: 'Batch classification failed' });
  }
});

/**
 * GET /api/classify/health
 * Check service health
 */
router.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    service: 'aiClassification',
    status: 'healthy',
    version: '1.0.0',
  });
});

export default router;
