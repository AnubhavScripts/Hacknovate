# AI-Powered Multi-Domain Automation System - Setup Guide

## Overview

I've restructured your frontend and backend to support:
- **Multiple Industries**: E-Commerce, Education, Finance
- **Domain-Specific Workflows**: Tailored automation options for each industry
- **AI Classification Layer**: Automatically classifies messages as "hot" (urgent/immediate) or "cold" (can wait) based on content, keywords, and sentiment

---

## Architecture Changes

### Frontend Flow

**New Onboarding Steps:**
1. **Industry Selection** (Step 1) - User chooses: E-Commerce, Education, or Finance
2. **Workflow Selection** (Step 2) - Domain-specific automation options appear
3. **Channel Connection** (Step 3) - Connect Gmail/WhatsApp
4. **Deploy** (Step 4) - Final setup and go live

### Files Created/Modified

#### New Components:
- `Step1IndustrySelection.jsx` - Industry selection UI
- `Step2WorkflowSelection.jsx` - Domain-specific workflow selection

#### Updated Components:
- `OnboardingLayout.jsx` - New step flow integration
- `Step3Channels.jsx` - Progress adjusted (now 60% instead of 75%)
- `Step4Deploy.jsx` - Updated to use new store fields

#### Updated Services:
- `onboardingStore.js` - Added industry, workflows, aiClassification fields
- New `aiClassificationService.js` - Frontend API client for classification

---

## Backend Changes

### New Files
- `services/aiClassificationService.js` - Core AI classification engine
- `routes/classification.js` - New API endpoints
- `services/aiClassificationService.js` - Updated with classification logic

### Updated Files
- `server.js` - Added classification route
- `models/Automation.js` - New fields for industry, workflows, AI classification

### API Endpoints

#### Classification Endpoints

**1. Classify Single Message**
```bash
POST /classify/message
Content-Type: application/json

{
  "message": "My order hasn't arrived yet",
  "industry": "ecommerce"
}

Response:
{
  "success": true,
  "data": {
    "message": "My order hasn't arrived yet",
    "classification": {
      "priority": "cold",
      "urgencyScore": 0.35,
      "sentiment": "neutral",
      "category": "order_tracking",
      "industry": "ecommerce",
      "suggestedAction": "auto_reply",
      "confidence": 0.85
    }
  }
}
```

**2. Classify Batch (Multiple Messages)**
```bash
POST /classify/batch
Content-Type: application/json

{
  "messages": [
    "My order is damaged!",
    "When will my order arrive?",
    "Can you tell me about your return policy?"
  ],
  "industry": "ecommerce"
}
```

**3. Health Check**
```bash
GET /classify/health
```

---

## Industry-Specific Configurations

### E-Commerce
**Workflows:**
- Complaint Handling
- Query Answering
- Order Tracking
- Cancellation Requests

**Classification Categories:**
- `order_tracking` - Where is my order? Delivery updates
- `complaint` - Damaged items, wrong products
- `refund` - Returns and exchanges
- `query` - General questions

**Urgent Keywords:**
- Item missing, wrong item, refund pending, can't login, payment issue

### Education
**Workflows:**
- Enrollment Support
- Course Inquiries
- Academic Support
- Admission Queries

**Classification Categories:**
- `admission` - Admission and application questions
- `course_info` - Curriculum and program details
- `fees` - Payment and tuition issues
- `academic` - Grades and transcripts

**Urgent Keywords:**
- Expulsion, fail, academic probation, scholarship cancelled

### Finance
**Workflows:**
- Loan Inquiries
- Insurance Support
- Account Support
- Policy Assistance

**Classification Categories:**
- `loan_inquiry` - Loan products and eligibility
- `insurance` - Claims and policies
- `account` - Login and balance issues
- `policy_question` - Terms and benefits

**Urgent Keywords:**
- Payment failed, unauthorized, account locked, loan denied, claim rejected, policy lapsed

---

## Message Classification System

### How It Works

The AI classification system analyzes messages on three dimensions:

#### 1. **Urgency Score (0-1)**
- **0-0.4**: Cold (can wait)
- **0.4-0.7**: Medium (monitor)
- **0.7-1.0**: Hot (urgent/immediate action needed)

**Factors:**
- Presence of urgent keywords (+0.15 each, +0.2 for industry-specific)
- Multiple exclamation marks (>2)
- All-caps ratio (>30%)

#### 2. **Sentiment Analysis**
- **Positive**: "Love", "Great", "Thank you"
- **Negative**: "Angry", "Frustrated", "Broken"
- **Neutral**: No strong sentiment indicators

#### 3. **Category Classification**
Maps the message to industry-specific categories for routing and automation.

#### 4. **Suggested Action**
- `escalate_immediately` - High urgency + negative sentiment
- `high_priority_response` - High urgency
- `schedule_callback` - Negative sentiment
- `auto_reply` - Low urgency

### Confidence Score
- Higher when urgency is clearly high or low
- Lower for borderline cases (near 0.5)

---

## Database Schema Updates

### Automation Model

```javascript
{
  userId: ObjectId,
  name: String,
  
  // New fields
  industry: "ecommerce" | "education" | "finance",
  workflows: [String],
  
  // Legacy (backward compatible)
  selectedOptions: [String],
  
  // AI Classification
  aiClassification: {
    enabled: Boolean,
    classifyAs: ["hot", "cold"]
  },
  
  connectedChannels: {
    gmail: Boolean,
    whatsapp: Boolean
  },
  
  status: "active" | "paused" | "draft",
  rules: [RuleSchema],
  timestamps
}
```

---

## Frontend Store Updates

### useOnboardingStore Fields

```javascript
{
  // New fields
  selectedIndustry: "ecommerce" | "education" | "finance" | null,
  selectedWorkflows: [String],
  
  // New AI settings
  aiClassification: {
    enabled: true,
    categories: ["hot", "cold"]
  },
  
  // Existing fields (maintained)
  currentStep: Number,
  selectedAutomations: [String],
  connectedChannels: Object,
  userInfo: Object,
  ...
}
```

### New Store Actions

```javascript
setSelectedIndustry(industry) // Set selected industry
toggleWorkflow(workflow)      // Toggle workflow selection
```

---

## Using the Classification Service

### Frontend Example

```javascript
import { classifyMessage, classifyBatch } from '@/services/aiClassificationService';

// Classify single message
const result = await classifyMessage(
  "My order hasn't arrived yet",
  "ecommerce"
);

console.log(result.classification.priority); // "cold" or "hot"
console.log(result.classification.category); // "order_tracking"
console.log(result.classification.suggestedAction); // "auto_reply"

// Classify batch
const results = await classifyBatch(
  [
    "Payment failed!",
    "When will my order arrive?",
    "Can I return my item?"
  ],
  "ecommerce"
);
```

### Dashboard Integration (Next Steps)

In your Dashboard component, you can now:
1. Show industry badge
2. Display workflow tags
3. Color-code messages by priority (hot/cold)
4. Auto-route based on classification

---

## Testing the New System

### Test Classification

```bash
# From backend directory, test an endpoint:
curl -X POST http://localhost:8000/classify/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My loan application was rejected!",
    "industry": "finance"
  }'

# Expected response:
{
  "priority": "hot",
  "urgencyScore": 0.85,
  "sentiment": "negative",
  "category": "loan_inquiry",
  "suggestedAction": "escalate_immediately"
}
```

### Test Different Industries

**E-Commerce:**
```json
{
  "message": "Item arrived damaged",
  "industry": "ecommerce"
}
```
Expected priority: **hot**, category: **complaint**

**Education:**
```json
{
  "message": "How much does the computer science degree cost?",
  "industry": "education"
}
```
Expected priority: **cold**, category: **fees**

**Finance:**
```json
{
  "message": "My insurance policy was cancelled without notice!",
  "industry": "finance"
}
```
Expected priority: **hot**, category: **insurance**

---

## Next Integration Steps

1. **Dashboard Updates**
   - Accept industry from user context
   - Show industry-specific dashboard
   - Display hot/cold message queues

2. **Enhanced Rules Engine**
   - Use classification to auto-route to rules
   - Create hot/cold task queues
   - Escalate based on priority

3. **Analytics**
   - Track classification accuracy
   - Monitor response times by priority
   - Generate industry-specific reports

4. **AI Improvement**
   - Log actual user categorizations
   - Retrain classification on real data
   - Improve keyword sets

---

## Files Modified Summary

### Frontend
- `onboardingStore.js` ✅
- `OnboardingLayout.jsx` ✅
- `Step1IndustrySelection.jsx` ✨ NEW
- `Step2WorkflowSelection.jsx` ✨ NEW
- `Step3Channels.jsx` ✅
- `Step4Deploy.jsx` ✅
- `aiClassificationService.js` ✨ NEW

### Backend
- `server.js` ✅
- `models/Automation.js` ✅
- `services/aiClassificationService.js` ✨ NEW
- `routes/classification.js` ✨ NEW

---

## Troubleshooting

### Classification Service Not Found
- Make sure backend server is running: `npm run dev` in `/backend`
- Verify route is registered in `server.js`
- Check that imports are correct

### Store Not Updating
- Clear browser cache/localStorage
- Check React DevTools -> Zustand extension
- Verify actions are being called

### Wrong Classification
- Check keyword lists in `aiClassificationService.js`
- Verify industry parameter is correct
- Review urgencyScore calculation

---

## Questions?

This system is ready to integrate with your existing rules engine, escalation system, and message handlers. The classification data flows seamlessly into your existing automation workflow!
