import express from 'express';
import {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
} from '../controllers/rulesController.js';
import { verifyApiKey } from '../middleware/auth.js';

const router = express.Router();

// Get all rules for automation
router.get(
  '/:userId/rules',
  verifyApiKey,
  getRules
);

// Create new rule
router.post(
  '/:userId/rules',
  verifyApiKey,
  createRule
);

// Update a rule
router.patch(
  '/:userId/rules/:ruleId',
  verifyApiKey,
  updateRule
);

// Delete a rule
router.delete(
  '/:userId/rules/:ruleId',
  verifyApiKey,
  deleteRule
);

// Toggle rule enabled/disabled
router.patch(
  '/:userId/rules/:ruleId/toggle',
  verifyApiKey,
  toggleRule
);

export default router;
