import express from 'express';
import { saveAutomation, getAutomation, updateStatus } from '../controllers/automationController.js';

const router = express.Router();

router.post('/save', saveAutomation);
router.get('/:userId', getAutomation);
router.patch('/:id/status', updateStatus);

export default router;
