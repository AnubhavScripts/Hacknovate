import twilio from 'twilio';
import Reminder from '../models/Reminder.js';

// ─── IST offset helper ────────────────────────────────────────────────────────
// Railway runs UTC; all time parsing from user text assumes IST (+5:30)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function nowIST() {
  return new Date(Date.now() + IST_OFFSET_MS);
}

function istToUtc(date) {
  return new Date(date.getTime() - IST_OFFSET_MS);
}

// ─── Time parser ──────────────────────────────────────────────────────────────
/**
 * parseReminderFromMessage(text)
 * Extracts { subject, remindAtUTC } from a natural language string.
 *
 * Supported patterns:
 *   "remind me at 5pm to submit Data Science assignment"
 *   "remind me at 17:30 to do homework"
 *   "set a reminder for 9am for Chemistry quiz"
 *   "याद दिला दो 6 baje ko assignment submit karna hai"
 *
 * Returns null if no time is found.
 */
export function parseReminderFromMessage(text) {
  // ── 1. Extract time ──────────────────────────────────────────────────────────
  // Match: "5pm", "5:30pm", "17:30", "5 pm", "5 baje", "5 am"
  const timeRegex =
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje)?\b/i;
  const match = text.match(timeRegex);
  if (!match) return null;

  let hours    = parseInt(match[1], 10);
  const mins   = parseInt(match[2] || '0', 10);
  const period = (match[3] || '').toLowerCase();

  // Adjust for am/pm
  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;
  // "baje" without am/pm — treat >=1 and <8 as probable PM in educational context
  if (period === 'baje' && hours >= 1 && hours <= 6) hours += 12;

  // Build reminder datetime in IST
  const nowIST_ = nowIST();
  const reminderIST = new Date(nowIST_);
  reminderIST.setHours(hours, mins, 0, 0);

  // If the time has already passed today → schedule for tomorrow
  if (reminderIST <= nowIST_) {
    reminderIST.setDate(reminderIST.getDate() + 1);
  }

  const remindAtUTC = istToUtc(reminderIST);

  // ── 2. Extract subject ───────────────────────────────────────────────────────
  // Strip the reminder trigger words and the time to get the actual task
  let subject = text
    .replace(/remind\s+me|set\s+(a\s+)?reminder|yaad\s+dila(do|na)?|याद\s+दिला/gi, '')
    .replace(timeRegex, '')
    .replace(/\b(at|for|to|karo|ko|karna\s+hai|hai)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!subject || subject.length < 2) {
    subject = 'your task';
  }

  return { subject, remindAtUTC };
}

// ─── Schedule a reminder ──────────────────────────────────────────────────────
export async function scheduleReminder(phone, subject, remindAtUTC, userId = null) {
  try {
    const reminder = await Reminder.create({ phone, subject, remindAt: remindAtUTC, userId });
    console.log(`⏰ [Reminder] Saved: "${subject}" at ${remindAtUTC.toISOString()} for ${phone}`);
    return reminder;
  } catch (err) {
    console.error('[Reminder] Failed to save:', err.message);
    return null;
  }
}

// ─── Send pending reminders (called on a 60-second interval) ─────────────────
export async function sendPendingReminders() {
  let client;
  try {
    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from  = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!sid || !token || !from) {
      console.warn('[Reminder] Twilio creds not configured — reminder polling skipped.');
      return;
    }
    client = twilio(sid, token);
  } catch (err) {
    console.error('[Reminder] Twilio init failed:', err.message);
    return;
  }

  try {
    const due = await Reminder.find({
      sent: false,
      remindAt: { $lte: new Date() },
    });

    if (due.length === 0) return;
    console.log(`⏰ [Reminder] ${due.length} reminder(s) due — sending now...`);

    for (const reminder of due) {
      try {
        const body = `⏰ *Reminder!*\n\nHey! Just a heads-up — it's time to: *${reminder.subject}*\n\nGood luck! 💪`;
        await client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to:   reminder.phone,
          body,
        });

        reminder.sent   = true;
        reminder.sentAt = new Date();
        await reminder.save();
        console.log(`✅ [Reminder] Sent to ${reminder.phone}: "${reminder.subject}"`);
      } catch (sendErr) {
        console.error(`❌ [Reminder] Failed for ${reminder.phone}:`, sendErr.message);
      }
    }
  } catch (err) {
    console.error('[Reminder] Poll error:', err.message);
  }
}

// ─── Start polling loop ───────────────────────────────────────────────────────
export function startReminderPoller() {
  console.log('⏰ [Reminder] Poller started — checking every 60s');
  // Run once at startup, then every minute
  sendPendingReminders();
  setInterval(sendPendingReminders, 60_000);
}
