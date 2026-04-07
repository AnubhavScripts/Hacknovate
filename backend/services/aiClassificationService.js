/**
 * AI Classification Service
 * Classifies incoming messages/queries into "hot" (urgent/immediate) or "cold" (can wait) categories
 * Also can be extended for domain and intent classification
 */

const classifyMessage = (message, context = {}) => {
  const { industry = 'ecommerce', language = 'en' } = context;
  
  const urgencyScore = calculateUrgencyScore(message, industry);
  const sentiment = analyzeSentiment(message);
  const category = categorizeByDomain(message, industry);
  
  return {
    message,
    classification: {
      priority: urgencyScore > 0.7 ? 'hot' : 'cold',
      urgencyScore,
      sentiment,
      category,
      industry,
      suggestedAction: determineSuggestedAction(urgencyScore, sentiment, category),
      confidence: calculateConfidence(urgencyScore),
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Calculate urgency score (0-1)
 * Hot messages: System failures, urgent complaints, policy issues
 * Cold messages: General inquiries, non-urgent questions
 */
const calculateUrgencyScore = (message, industry) => {
  const messageLower = message.toLowerCase();
  
  // Universal urgent keywords
  const urgentKeywords = [
    'urgent', 'emergency', 'critical', 'broken', 'not working', 'error',
    'crashed', 'down', 'lost', 'stolen', 'fraud', 'scam', 'help',
    'immediately', 'asap', 'now', 'urgent!', 'critical!', 'serious'
  ];
  
  // Industry-specific urgent keywords
  const industryUrgentKeywords = {
    finance: ['payment failed', 'unauthorized', 'account locked', 'loan denied', 'claim rejected', 'policy lapsed'],
    education: ['expulsion', 'fail', 'academic probation', 'scholarship cancelled', 'admission appeal'],
    ecommerce: ['item missing', 'wrong item', 'refund pending', 'can\'t login', 'payment issue'],
  };
  
  let score = 0;
  
  // Check universal urgent keywords
  urgentKeywords.forEach(keyword => {
    if (messageLower.includes(keyword)) {
      score += 0.15;
    }
  });
  
  // Check industry-specific keywords
  const specificKeywords = industryUrgentKeywords[industry] || [];
  specificKeywords.forEach(keyword => {
    if (messageLower.includes(keyword)) {
      score += 0.2;
    }
  });
  
  // Check for multiple exclamation marks (emotional indicator)
  const exclamationMarks = (message.match(/!/g) || []).length;
  if (exclamationMarks > 2) {
    score += 0.1;
  }
  
  // Check for all caps (emotional indicator)
  const upperCaseRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  if (upperCaseRatio > 0.3) {
    score += 0.1;
  }
  
  return Math.min(score, 1);
};

/**
 * Simple sentiment analysis (positive/negative/neutral)
 */
const analyzeSentiment = (message) => {
  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'hate', 'angry', 'upset',
    'frustrated', 'wrong', 'issue', 'problem', 'complaint', 'poor',
    'waste', 'disappointed', 'disgusted'
  ];
  
  const positiveWords = [
    'good', 'great', 'excellent', 'love', 'happy', 'appreciate', 'thanks',
    'thank you', 'awesome', 'amazing', 'perfect', 'wonderful', 'fantastic'
  ];
  
  const messageLower = message.toLowerCase();
  
  let negativeCount = 0;
  let positiveCount = 0;
  
  negativeWords.forEach(word => {
    if (messageLower.includes(word)) negativeCount++;
  });
  
  positiveWords.forEach(word => {
    if (messageLower.includes(word)) positiveCount++;
  });
  
  if (negativeCount > positiveCount) return 'negative';
  if (positiveCount > negativeCount) return 'positive';
  return 'neutral';
};

/**
 * Categorize message by domain
 */
const categorizeByDomain = (message, industry) => {
  const messageLower = message.toLowerCase();
  
  const categories = {
    ecommerce: {
      order_tracking: ['where is my', 'order status', 'delivery', 'track', 'when will'],
      complaint: ['damaged', 'broken', 'wrong item', 'not as described', 'defective'],
      refund: ['refund', 'return', 'money back', 'exchange'],
      query: ['how to', 'can i', 'do you', 'what is'],
    },
    education: {
      admission: ['admission', 'apply', 'admission', 'enrollment', 'application'],
      course_info: ['course', 'program', 'curriculum', 'subjects', 'duration'],
      fees: ['fee', 'cost', 'price', 'payment', 'tuition'],
      academic: ['grades', 'transcript', 'gpa', 'credits', 'degree'],
    },
    finance: {
      loan_inquiry: ['loan', 'interest rate', 'emi', 'eligibility'],
      insurance: ['insurance', 'claim', 'policy', 'coverage', 'premium'],
      account: ['account', 'login', 'password', 'balance', 'transaction'],
      policy_question: ['policy', 'terms', 'benefits', 'coverage', 'exclusions'],
    },
  };
  
  const domainCategories = categories[industry] || {};
  
  for (const [category, keywords] of Object.entries(domainCategories)) {
    for (const keyword of keywords) {
      if (messageLower.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'general_inquiry';
};

/**
 * Determine suggested action based on classification
 */
const determineSuggestedAction = (urgencyScore, sentiment, category) => {
  if (urgencyScore > 0.7) {
    if (sentiment === 'negative') {
      return 'escalate_immediately';
    }
    return 'high_priority_response';
  }
  
  if (sentiment === 'negative') {
    return 'schedule_callback';
  }
  
  return 'auto_reply';
};

/**
 * Calculate confidence score for classification
 */
const calculateConfidence = (urgencyScore) => {
  // Confidence is higher when urgency is clearly high or low
  const distance = Math.abs(urgencyScore - 0.5);
  return Math.min(0.5 + distance, 1);
};

/**
 * Batch classify multiple messages
 */
const classifyBatch = (messages, context = {}) => {
  return messages.map(msg => classifyMessage(msg, context));
};

export {
  classifyMessage,
  classifyBatch,
  calculateUrgencyScore,
  analyzeSentiment,
  categorizeByDomain,
  determineSuggestedAction,
  calculateConfidence,
};
