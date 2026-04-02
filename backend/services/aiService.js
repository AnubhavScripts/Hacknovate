import OpenAI from 'openai';

const hasGroqKey =
  process.env.GROK_API_KEY &&
  process.env.GROK_API_KEY !== 'your_grok_api_key' &&
  process.env.GROK_API_KEY.length > 10;

// Initialize Groq API client (uses OpenAI SDK compatible endpoint)
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
  default: { type: 'query', sentiment: 'neutral', priority: 'medium', action: 'Review and route to appropriate support team' },
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
    // Simulate a short delay for realism
    await new Promise(r => setTimeout(r, 400));
    return getMockClassification(message);
  }

  const systemPrompt = `You are an AI assistant for a merchant automation platform.
Analyse the customer message in the context of ${flowType} and respond ONLY with valid JSON in this exact format:
{
  "type": "complaint" | "query" | "order" | "cancellation",
  "sentiment": "positive" | "neutral" | "negative",
  "priority": "low" | "medium" | "high" | "urgent",
  "action": "<a brief recommended action for the merchant>"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        { role: 'user', content: message },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const raw = response.choices[0].message.content.trim();
    return JSON.parse(raw);
  } catch (err) {
    console.error('❌ Groq API Error:', err.message);
    console.error('Using mock fallback instead...');
    // Fallback to mock if API fails
    return getMockClassification(message);
  }
}

// ─── generateReply ────────────────────────────────────────────────────────────
const MOCK_REPLIES = {
  cancellation: "Thank you for reaching out. We've received your cancellation request and are processing it immediately. You'll receive a confirmation email within the next 15 minutes. We're sorry to see you go and hope to serve you better in the future.",
  complaint: "We sincerely apologise for the inconvenience you've experienced. Your feedback is extremely important to us, and we are taking immediate action to resolve this issue. A member of our team will contact you within 2 hours with a resolution.",
  order: "Thank you for your patience! Your order is currently being processed and is on its way. You can track your shipment in real-time using the tracking link we've sent to your registered email. Expected delivery: 2-3 business days.",
  query: "Thank you for your question! Our team is happy to help. We've reviewed your query and will provide a detailed response within the next hour. In the meantime, you can find quick answers in our Help Centre.",
  unknown: "Thank you for reaching out to us. We've received your message and a member of our support team will get back to you shortly. We appreciate your patience.",
};

export async function generateReply(message, type = 'query', flowType = 'general') {
  if (!openai) {
    await new Promise(r => setTimeout(r, 300));
    return MOCK_REPLIES[type] || MOCK_REPLIES.unknown;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a professional customer support AI for an e-commerce merchant.
Generate a concise, empathetic, and professional reply to the customer message in the context of ${flowType}.
The message has been classified as: ${type}.
Respond in 2-3 sentences. Do NOT include greetings like "Dear Customer" or sign-offs.`,
        },
        { role: 'user', content: message },
      ],
      temperature: 0.6,
      max_tokens: 200,
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('❌ Groq API Error in generateReply:', err.message);
    console.error('Using mock fallback instead...');
    // Fallback to mock if API fails
    return MOCK_REPLIES[type] || MOCK_REPLIES.unknown;
  }
}
