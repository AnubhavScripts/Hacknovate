import express from 'express';
import {
  saveAutomations,
  saveSubcategories,
  saveChannels,
  deployOnboarding,
  getOnboardingConfig,
} from '../controllers/onboardingController.js';

const router = express.Router();

router.post('/automations',   saveAutomations);
router.post('/subcategories', saveSubcategories);
router.post('/channels',      saveChannels);
router.post('/deploy',        deployOnboarding);
router.get('/config',         getOnboardingConfig);

export default router;
