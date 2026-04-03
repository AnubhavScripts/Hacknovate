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

  const systemPrompt = `You are an AI classifier for a business messaging platform.

Your job is to determine if the message is a valid business-related message.

Valid message types:
- "complaint": Customer has a problem, bad experience, or wants a refund
- "query": Customer is asking about a product, service, pricing, loans, eligibility, documents, interest rates, or any general business info
- "order": Customer asking about order status, delivery, tracking
- "cancellation": Customer wants to cancel an order or subscription

CRITICAL RULE — SHORT CONVERSATIONAL MESSAGES:
If the message is a short reply that continues an ongoing conversation — such as:
"yes", "ok", "hmm", "sure", "done", "will do", "haan", "okay", "got it", "alright", "yep", "nope", "no", "maybe"
→ DO NOT classify as "invalid"
→ Classify as: type "query", priority "low"
These are conversation continuations, not invalid messages.

IMPORTANT: If the message is related to financial services, loans, credit, EMI, salary, eligibility → always classify as "query", never "invalid".

Only classify as "invalid" if the message is completely off-topic with zero business relevance: unrelated jokes, trivia, pure spam, or total gibberish with no conversational context.

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

/**
 * generateReply
 * @param {string} message        - Current user message
 * @param {string} type           - Classified message type
 * @param {string} flowType       - 'sales' | 'support' | 'general'
 * @param {object} context        - { knownSalary, knownLoanAmount, convoText }
 */
export async function generateReply(message, type = 'query', flowType = 'general', context = {}) {
  const { knownSalary = null, knownLoanAmount = null, convoText = '' } = context;

  // ── If message is invalid/irrelevant in support mode, reject immediately ──
  if (type === 'invalid' && flowType !== 'sales') {
    return MOCK_REPLIES.invalid;
  }

  if (!openai) {
    await new Promise(r => setTimeout(r, 300));

    // Mock sales replies with personalization
    if (flowType === 'sales') {
      const lower = message.toLowerCase();
      if (/\bhi\b|hello|hey/i.test(lower)) return "Hey! Are you looking for a loan or just exploring options?";
      if (/loan|borrow|credit/i.test(lower)) {
        if (knownLoanAmount) return `Got it — ₹${(knownLoanAmount / 100000).toFixed(1)} lakh. What's your monthly salary?`;
        return "Sure — how much loan are you looking for and what's your monthly salary?";
      }
      if (/document|kyc|aadhaar|pan/i.test(lower)) return "You'll need Aadhaar & PAN. Are you planning to apply soon?";
      if (/interest|emi|rate/i.test(lower)) return "Our interest rates start from 10.5% p.a. Want me to check your eligibility?";
      if (/eligible|eligibility/i.test(lower)) return "Eligibility depends on your salary and credit score. What's your monthly income?";
      return "Got it! Could you tell me your loan requirement and monthly salary so I can help better?";
    }

    return MOCK_REPLIES[type] || MOCK_REPLIES.unknown;
  }

  // ── Build system prompt based on flowType ──────────────────────────────────
  let systemPrompt = "";

  // 🟢 SALES MODE (Loans / Fintech)
  if (flowType === "sales") {
    // Build what we already know about this user for personalization
    const knownFacts = [];
    if (knownLoanAmount) knownFacts.push(`loan amount: ₹${(knownLoanAmount / 100000).toFixed(1)} lakh`);
    if (knownSalary)     knownFacts.push(`monthly salary: ₹${knownSalary.toLocaleString('en-IN')}`);
    const knownContext = knownFacts.length > 0
      ? `\nKnown user info: ${knownFacts.join(', ')}. Use this — DO NOT ask for info already provided.`
      : '';

    // Track what has already been asked in this conversation
    const alreadyAskedSalary     = /salary|income|earn/i.test(convoText);
    const alreadyAskedLoanAmount = /how much|loan amount|kितना/i.test(convoText);
    const avoidAsking = [];
    if (alreadyAskedSalary || knownSalary)         avoidAsking.push('salary (already asked or known)');
    if (alreadyAskedLoanAmount || knownLoanAmount)  avoidAsking.push('loan amount (already asked or known)');
    const avoidContext = avoidAsking.length > 0
      ? `\nDO NOT ask again about: ${avoidAsking.join(', ')}.`
      : '';

    systemPrompt = `You are a friendly fintech assistant helping users get loans.

Your goal:
- Understand the user's loan needs
- Ask smart ONE follow-up question at a time
- Guide them toward applying
${knownContext}${avoidContext}

Rules:
- Be conversational and human-like
- Keep replies to 1–2 lines max
- Reference known info naturally (e.g. "Got it — ₹5 lakh...")
- Ask only ONE question per reply, not multiple
- If both salary and loan amount are known → tell them they're likely eligible and ask if they want to proceed

Examples:
User: "I want loan" → "Sure — how much loan are you looking for?"
User: "5 lakh" → "Got it — ₹5 lakh. What's your monthly salary?"
User: "60k" → "Perfect — you're likely eligible! Want me to guide you through the application?"
User: "What documents?" → "You'll need Aadhaar & PAN. Are you planning to apply soon?"
User: "Hi" → "Hey! Are you looking for a loan or just exploring options?"

DO NOT reject any message. DO NOT say "invalid query".`;
  }

  // 🔵 SUPPORT MODE (E-commerce / Customer Support)
  else if (flowType === "support") {
    systemPrompt = `You are a customer support assistant.

Your job:
- Handle orders, complaints, refunds, queries

Rules:
- Be helpful and concise
- Answer the customer's question directly
- Keep replies to 2-3 sentences max
- Sound human, not corporate
- Do NOT start with "Thank you for reaching out"
- Do NOT use "Dear Customer" or "Best regards"

Message type: ${type}`;
  }

  // ⚪ DEFAULT / GENERAL
  else {
    systemPrompt = `You are a helpful assistant.
Reply naturally and concisely in 1-2 sentences.`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 250,
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('❌ Groq Reply Error:', err.message);
    if (flowType === 'sales') {
      return "Got it! Could you tell me your loan requirement and monthly salary so I can help better?";
    }
    return MOCK_REPLIES[type] || MOCK_REPLIES.unknown;
  }
}

// ─── classifyLead ─────────────────────────────────────────────────────────────
function getMockLeadClassification(summary = '', messages = '') {
  const text = `${summary} ${messages}`.toLowerCase();

  const signals = [];
  let score = 10;

  if (/salary|income|earn/i.test(text))         { signals.push('salary_provided');          score += 20; }
  if (/\d[\d,]+\s*(lakh|k|rs|rupee|loan)/i.test(text)) { signals.push('loan_amount_mentioned'); score += 20; }
  if (/urgent|asap|immediately|today|now/i.test(text))  { signals.push('urgent_need');           score += 20; }
  if (/how to apply|application|apply/i.test(text))     { signals.push('asked_application_process'); score += 15; }
  if (/document|kyc|aadhaar|pan/i.test(text))           { signals.push('asked_documents');       score += 15; }
  if (/interest rate|roi|emi/i.test(text))               { signals.push('asked_interest_rate');   score += 10; }

  score = Math.min(score, 100);

  const lead_type = score >= 70 ? 'HOT' : score >= 40 ? 'WARM' : 'COLD';

  let intent = 'just_exploring';
  if (/apply|application/i.test(text))       intent = 'loan_application';
  else if (/document|kyc/i.test(text))       intent = 'document_requirement';
  else if (/interest|emi|roi/i.test(text))   intent = 'interest_rate_query';
  else if (/eligible|eligibility/i.test(text)) intent = 'eligibility_check';
  else if (/loan|borrow|credit/i.test(text)) intent = 'loan_inquiry';
  else if (/repay|due|emi missed/i.test(text)) intent = 'repayment_query';

  const loanMatch = text.match(/(\d[\d,]+)\s*(lakh|l\b)/i);
  const salaryMatch = text.match(/salary[^\d]*(\d[\d,]+)/i);
  const loan_amount = loanMatch
    ? parseInt(loanMatch[1].replace(/,/g, '')) * (loanMatch[2].toLowerCase().startsWith('l') ? 100000 : 1)
    : null;
  const salary = salaryMatch ? parseInt(salaryMatch[1].replace(/,/g, '')) : null;

  const urgencyLevel = signals.includes('urgent_need') ? 'high'
    : signals.length >= 2 ? 'medium' : 'low';

  return {
    lead_type,
    lead_score: score,
    intent,
    confidence: parseFloat((score / 100).toFixed(2)),
    signals: {
      urgency: urgencyLevel,
      seriousness: signals.length >= 3 ? 'high' : signals.length >= 1 ? 'medium' : 'low',
      buying_signals: signals,
    },
    entities: {
      loan_amount,
      salary,
      timeline: signals.includes('urgent_need') ? 'immediate' : 'unknown',
    },
    reason: `Mock classification: ${signals.length} buying signal(s) detected. Score: ${score}.`,
  };
}

const LEAD_SYSTEM_PROMPT = `You are an AI system for a fintech platform that analyzes WhatsApp conversations to classify users into lead categories.

Classify the user as: HOT lead (high probability of conversion), WARM lead (moderate interest), or COLD lead (low intent).

Classify based on: intent, urgency, seriousness, and buying signals. Use full conversation context, not just the last message.

### INTENTS (STRICT — use exactly one):
loan_inquiry | loan_application | eligibility_check | interest_rate_query | document_requirement | repayment_query | just_exploring | irrelevant

### CLASSIFICATION LOGIC:
🔥 HOT: Clear intent to apply OR mentions salary/loan amount AND shows urgency OR asks process/docs
🙂 WARM: Interested but not committed — asking about eligibility, interest, options
❄️ COLD: Vague / exploratory / low intent / short or irrelevant messages

### EDGE CASES:
- Short confirmations ("ok", "haan", "hmm") → use previous context, do NOT blindly classify as cold
- "What documents are required?" → HOT (strong buying signal)
- Casual tone but real intent ("loan mil jayega 😂") → ignore tone, focus on intent
- Mixed signals ("just exploring" + "need urgently") → prioritize stronger signal (urgency → HOT)
- Earlier weak + latest strong intent → classify based on latest + overall trend
- Missing data → use null, do NOT hallucinate

### SCORING:
70–100 → HOT | 40–69 → WARM | 0–39 → COLD

### BUYING SIGNALS (use only these):
salary_provided | loan_amount_mentioned | urgent_need | asked_application_process | asked_documents | asked_interest_rate | repeated_followups

### OUTPUT — STRICT JSON ONLY, no extra text:
{
  "lead_type": "HOT | WARM | COLD",
  "lead_score": 0-100,
  "intent": "one_of_defined_intents",
  "confidence": 0.0-1.0,
  "signals": {
    "urgency": "low | medium | high",
    "seriousness": "low | medium | high",
    "buying_signals": ["list"]
  },
  "entities": {
    "loan_amount": number_or_null,
    "salary": number_or_null,
    "timeline": "immediate | soon | later | unknown"
  },
  "reason": "short explanation (1-2 lines)"
}`;

export async function classifyLead(summary = '', messages = '') {
  if (!openai) {
    await new Promise(r => setTimeout(r, 400));
    return getMockLeadClassification(summary, messages);
  }

  const userContent = [
    summary ? `Conversation Summary:\n${summary}` : '',
    messages ? `Recent Messages:\n${messages}` : '',
  ].filter(Boolean).join('\n\n');

  try {
    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: LEAD_SYSTEM_PROMPT },
        { role: 'user',   content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 400,
    });

    const raw = response.choices[0].message.content.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON block found in Groq response');

    const result = JSON.parse(jsonMatch[0]);
    console.log(`🎯 [Lead] ${result.lead_type} (score: ${result.lead_score}) — ${result.intent}`);
    return result;
  } catch (err) {
    console.error('❌ Groq Lead Classification Error:', err.message);
    return getMockLeadClassification(summary, messages);
  }
}

// ─── generateConversationSummary ──────────────────────────────────────────────
export async function generateConversationSummary(transcript) {
  if (!transcript || transcript.trim().length < 20) {
    return 'Single short message. No strong context yet.';
  }

  if (!openai) {
    const t = transcript.toLowerCase();
    const parts = [];
    if (/salary|income|earn/i.test(t))           parts.push('user mentioned income/salary');
    if (/\d[\d,]+\s*(lakh|k|rs|loan)/i.test(t)) parts.push('loan amount discussed');
    if (/urgent|asap|today|immediately/i.test(t)) parts.push('high urgency expressed');
    if (/apply|application/i.test(t))            parts.push('expressed intent to apply');
    if (/document|kyc|aadhaar|pan/i.test(t))     parts.push('asked about documents');
    if (/interest|emi|roi/i.test(t))             parts.push('queried interest/EMI');
    if (/eligible|eligibility/i.test(t))         parts.push('asked about eligibility');
    return parts.length > 0
      ? `User has ${parts.join(', ')}.`
      : 'Exploratory conversation with no strong financial intent signals yet.';
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a fintech lead analyst. Summarize the following WhatsApp conversation in 1-2 lines only.
Focus strictly on:
- User intent (what they want)
- Seriousness (how committed they seem)
- Key financial details (salary, loan amount, urgency, timeline)
Be concise and factual. Do NOT add greetings or headings.`,
        },
        { role: 'user', content: transcript },
      ],
      temperature: 0.3,
      max_tokens: 80,
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.warn('⚠️  Summary generation failed, using fallback:', err.message);
    return `Conversation with ${transcript.split('\n').filter(l => l.startsWith('User:')).length} user message(s). Context available but summary unavailable.`;
  }
}