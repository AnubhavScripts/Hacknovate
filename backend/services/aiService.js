import OpenAI from 'openai';

const hasGroqKey =
  process.env.GROK_API_KEY &&
  process.env.GROK_API_KEY !== 'your_grok_api_key' &&
  process.env.GROK_API_KEY.length > 10;

console.log('🤖 Groq status:', hasGroqKey ? '✅ Connected' : '❌ Missing key - mock mode');

const openai = hasGroqKey ? new OpenAI({ 
  apiKey: process.env.GROK_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
}) : null;

// ─── Mock fallback ────────────────────────────────────────────────────────────
const MOCK_CLASSIFICATIONS = {
  cancel: { type: 'cancellation', sentiment: 'negative', priority: 'high', action: 'Process cancellation request and send confirmation email' },
  refund: { type: 'complaint', sentiment: 'negative', priority: 'high', action: 'Escalate to billing team and issue refund within 3-5 business days' },
  where: { type: 'order', sentiment: 'neutral', priority: 'medium', action: 'Query order tracking system and send real-time status update' },
  broken: { type: 'complaint', sentiment: 'negative', priority: 'urgent', action: 'Escalate to quality team and arrange replacement or refund' },
  how: { type: 'query', sentiment: 'neutral', priority: 'low', action: 'Send relevant product documentation and FAQ link' },
  help: { type: 'query', sentiment: 'neutral', priority: 'medium', action: 'Route to customer support team for personalised assistance' },
  default: { type: 'invalid', sentiment: 'neutral', priority: 'low', action: 'Message is not a valid customer support query' },
};

function getMockClassification(message) {
  const lower = message.toLowerCase();
  for (const [keyword, result] of Object.entries(MOCK_CLASSIFICATIONS)) {
    if (keyword !== 'default' && lower.includes(keyword)) return result;
  }
  return MOCK_CLASSIFICATIONS.default;
}

// ─── classifyMessage ──────────────────────────────────────────────────────────
export async function classifyMessage(message, flowType = 'general') {
  if (!openai) {
    await new Promise(r => setTimeout(r, 400));
    return getMockClassification(message);
  }

  const systemPrompt = `You are an AI classifier for a merchant customer support platform.

Your job is to determine if the message is a valid customer support message.

Valid message types:
- "complaint": Customer has a problem, bad experience, or wants a refund
- "query": Customer is asking about a product, service, pricing, or general info related to the business
- "order": Customer asking about order status, delivery, tracking
- "cancellation": Customer wants to cancel an order or subscription

If the message is NOT related to customer support (e.g. random questions, jokes, general knowledge, greetings only, spam, gibberish), classify it as:
- type: "invalid"

Respond ONLY with valid JSON in this exact format:
{
  "type": "complaint" | "query" | "order" | "cancellation" | "invalid",
  "sentiment": "positive" | "neutral" | "negative",
  "priority": "low" | "medium" | "high" | "urgent",
  "action": "<brief recommended action>"
}

Context: This is a ${flowType} business.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.2,
      max_tokens: 200,
    });

    const raw = response.choices[0].message.content.trim();
    // Safe JSON parse — handle cases where model adds extra text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : getMockClassification(message);
  } catch (err) {
    console.error('❌ Groq Classification Error:', err.message);
    return getMockClassification(message);
  }
}

// ─── generateReply ────────────────────────────────────────────────────────────
const MOCK_REPLIES = {
  cancellation: "We've received your cancellation request and are processing it immediately. You'll get a confirmation within 15 minutes.",
  complaint: "We're sorry for the inconvenience. Our team is looking into this and will get back to you within 2 hours with a resolution.",
  order: "Your order is on its way! You can track it using the link sent to your registered email. Expected delivery: 2-3 business days.",
  query: "Happy to help! Could you share a bit more detail so we can give you the most accurate answer?",
  invalid: "Please send a valid customer support message related to your orders, complaints, or queries about our products/services.",
  unknown: "Please send a valid customer support message related to your orders, complaints, or queries about our products/services.",
};

export async function generateReply(message, type = 'query', flowType = 'general') {
  // ── If message is invalid/irrelevant, reject immediately without AI call ──
  if (type === 'invalid') {
    return MOCK_REPLIES.invalid;
  }

  if (!openai) {
    await new Promise(r => setTimeout(r, 300));
    return MOCK_REPLIES[type] || MOCK_REPLIES.unknown;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a customer support assistant for a ${flowType} business.

Rules:
- ONLY respond to messages related to: orders, complaints, refunds, cancellations, product/service queries
- If the message is irrelevant, off-topic, or not a customer support question, reply ONLY with: "Please send a valid customer support message related to your orders, complaints, or queries about our products/services."
- READ the customer message carefully and answer their specific question directly
- Keep replies SHORT (2-3 sentences max)
- Sound human and conversational, NOT corporate
- Do NOT start with "Thank you for reaching out"
- Do NOT use "Dear Customer" or "Best regards"

Message type classified as: ${type}`,
        },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 250,
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('❌ Groq Reply Error:', err.message);
    return MOCK_REPLIES[type] || MOCK_REPLIES.unknown;
  }
}