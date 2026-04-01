# Twilio WhatsApp Sandbox Setup Guide

## ✅ What's Configured

Your backend is now set up to:

1. **Send** WhatsApp messages via Twilio
2. **Receive** WhatsApp messages via webhook
3. **Automatically classify** incoming messages using AI
4. **Generate intelligent replies** and send them back

## 🔧 Configuration

Your `.env` file already contains:

- `TWILIO_ACCOUNT_SID` - Your Twilio account ID
- `TWILIO_AUTH_TOKEN` - Your Twilio auth token
- `TWILIO_WHATSAPP_NUMBER` - The sandbox number (whatsapp:+14155238886)

## 📱 Setting Up the Webhook in Twilio

To receive incoming messages, you need to configure the webhook URL in Twilio Console:

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Messaging > WhatsApp > Learn**
3. In the **Sandbox** section, find the **When a message comes in** field
4. Set the webhook URL to: `https://your-domain.com/analyze-message/whatsapp-webhook`
   - Replace `your-domain.com` with your actual domain
   - For local testing, use ngrok: `ngrok http 8000` then use `https://your-ngrok-url.ngrok.io/analyze-message/whatsapp-webhook`

5. Select **HTTP POST** as the method
6. Click **Save**

## 🧪 Testing Locally with ngrok

1. Install ngrok: `brew install ngrok` (on macOS)
2. Start ngrok: `ngrok http 8000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Set the webhook in Twilio to: `https://abc123.ngrok.io/analyze-message/whatsapp-webhook`

## 📨 API Endpoints

### Send a Message

```bash
curl -X POST http://localhost:8000/analyze-message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "userId": "user123"}'
```

### Webhook (Twilio sends here)

- **URL**: `POST /analyze-message/whatsapp-webhook`
- **Method**: Twilio will POST incoming messages here automatically

## 🔄 Message Flow

1. User sends WhatsApp message to sandbox number
2. Twilio sends message to your webhook
3. Backend classifies the message (complaint, query, order, etc.)
4. AI generates an intelligent reply
5. Reply is sent back to user
6. Message log is saved to database

## 📊 Message Structure in Database

Incoming WhatsApp messages are logged with:

- `message` - The user's message
- `type` - Classification (complaint, query, order, cancellation, unknown)
- `sentiment` - Positive, neutral, or negative
- `priority` - Low, medium, high, or urgent
- `reply` - The AI-generated reply
- `channel` - Set to "whatsapp"
- `from` - The sender's WhatsApp number
- `timestamp` - When the message was received

## ⚡ Enable Sandbox

To test, join the sandbox:

1. Go to [Twilio WhatsApp Sandbox](https://console.twilio.com/us/account/messaging/whatsapp)
2. Send: `join <random-word>` to the sandbox number
3. You'll receive a confirmation message

Then all your messages will be processed by the AI backend!

## 🐛 Troubleshooting

- **Messages not received**: Check that your webhook URL is correctly set in Twilio Console
- **Webhook not responding**: Make sure your server is running on the correct port
- **ngrok connection lost**: Restart ngrok and update the URL in Twilio
- **Database not saving**: Ensure MongoDB URI is correct in `.env`
