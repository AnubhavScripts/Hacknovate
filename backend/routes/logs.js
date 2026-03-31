import express from 'express';
import Log from '../models/Log.js';

const router = express.Router();

// GET /logs/:userId — fetch logs for a user (most recent first)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const query = userId === 'mock_user_001' ? {} : { userId };
    const logs = await Log.find(query).sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /logs/ — all logs (admin / demo)
router.get('/', async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
