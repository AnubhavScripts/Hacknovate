import express from 'express';
import { saveAutomation, getAutomation, updateStatus, processEmails, deleteAutomation } from '../controllers/automationController.js';

const router = express.Router();

router.post('/save', saveAutomation);
router.get('/:userId', getAutomation);
router.delete('/:userId', deleteAutomation);
router.patch('/:id/status', updateStatus);
router.post('/:automationId/process-emails', processEmails);

export default router;