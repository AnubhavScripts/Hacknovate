import express from 'express';
import { analyzeMessage } from '../controllers/messageController.js';

const router = express.Router();

// POST /analyze-message
router.post('/', analyzeMessage);

export default router;
