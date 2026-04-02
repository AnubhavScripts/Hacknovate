import express from 'express';
import { saveAutomation, getAutomation, updateStatus, processEmails } from '../controllers/automationController.js';

const router = express.Router();

router.post('/save', saveAutomation);
router.get('/:userId', getAutomation);
router.patch('/:id/status', updateStatus);
router.post('/:automationId/process-emails', processEmails);

export default router;
