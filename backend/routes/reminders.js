import express from 'express';
import Reminder from '../models/Reminder.js';
import { scheduleReminder } from '../services/reminderService.js';

const router = express.Router();

// GET /reminders/:phone — list upcoming (unsent) reminders for a phone number
router.get('/:phone', async (req, res) => {
  try {
    const phone = decodeURIComponent(req.params.phone);
    const reminders = await Reminder.find({ phone, sent: false })
      .sort({ remindAt: 1 })
      .lean();
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reminders — all reminders (dashboard use)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const query = userId ? { userId } : {};
    const reminders = await Reminder.find(query)
      .sort({ remindAt: 1 })
      .limit(100)
      .lean();
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /reminders — create a reminder (from dashboard)
router.post('/', async (req, res) => {
  try {
    const { phone, subject, remindAt, userId } = req.body;
    if (!phone || !subject || !remindAt) {
      return res.status(400).json({ error: 'phone, subject, and remindAt are required' });
    }
    const reminder = await scheduleReminder(phone, subject, new Date(remindAt), userId || null);
    if (!reminder) return res.status(500).json({ error: 'Failed to save reminder' });
    res.json({ success: true, reminder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /reminders/:id — cancel a reminder
router.delete('/:id', async (req, res) => {
  try {
    await Reminder.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
