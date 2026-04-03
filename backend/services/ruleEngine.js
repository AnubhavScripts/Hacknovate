/**
 * Rule Engine Service
 * Evaluates automation rules against message classification
 * Returns action to take (reply, escalate, label, etc)
 */

/**
 * Evaluate if a single condition matches
 * @param {Object} condition - { field, operator, value }
 * @param {Object} classification - { type, sentiment, priority }
 * @returns {boolean}
 */
function evaluateCondition(condition, classification) {
  const { field, operator, value } = condition;
  const fieldValue = classification[field]?.toString().toLowerCase() || '';
  const compareValue = value.toString().toLowerCase();

  switch (operator) {
    case 'equals':
      return fieldValue === compareValue;
    case 'contains':
      return fieldValue.includes(compareValue);
    case 'gt':
      const priorityMap = { low: 1, medium: 2, high: 3, urgent: 4 };
      return (priorityMap[fieldValue] || 0) > (priorityMap[compareValue] || 0);
    case 'gte':
      return (priorityMap[fieldValue] || 0) >= (priorityMap[compareValue] || 0);
    case 'lt':
      return (priorityMap[fieldValue] || 0) < (priorityMap[compareValue] || 0);
    case 'lte':
      return (priorityMap[fieldValue] || 0) <= (priorityMap[compareValue] || 0);
    default:
      return false;
  }
}

/**
 * Evaluate if all conditions in a rule match (AND logic)
 * @param {Object} rule - The rule to evaluate
 * @param {Object} classification - The AI classification result
 * @returns {boolean}
 */
function evaluateRule(rule, classification) {
  if (!rule.enabled) return false;
  if (!rule.conditions || rule.conditions.length === 0) return false;

  // All conditions must match (AND)
  return rule.conditions.every(condition => 
    evaluateCondition(condition, classification)
  );
}

/**
 * Find the first matching rule for a given classification
 * Rules are sorted by priority (highest first)
 * @param {Array} rules - Automation rules
 * @param {Object} classification - AI classification result
 * @returns {Object|null} - Matching rule or null
 */
export function findMatchingRule(rules, classification) {
  if (!rules || rules.length === 0) return null;

  for (const rule of rules) {
    if (evaluateRule(rule, classification)) {
      return rule;
    }
  }

  return null;
}

/**
 * Determine action based on classification and automation rules
 * Falls back to default actions if no rule matches
 * @param {Object} classification - AI classification result
 * @param {Object} automation - Automation config with rules and defaults
 * @returns {Object} - { action: string, params: Object }
 */
export function determineAction(classification, automation) {
  // Check if any rule matches
  const matchingRule = findMatchingRule(automation.rules || [], classification);
  
  if (matchingRule) {
    return {
      ruleId: matchingRule._id,
      action: matchingRule.action.type,
      params: matchingRule.action.params,
    };
  }

  // Fallback: use default actions based on classification
  const defaults = automation.defaultActions || {};
  
  if (classification.type === 'complaint' && classification.priority === 'urgent') {
    return {
      action: defaults.onUrgentComplaint === 'escalate' ? 'escalate' : 'reply_and_escalate',
      params: { reason: 'Urgent complaint detected' },
    };
  }

  if (classification.type === 'complaint') {
    return {
      action: 'escalate',
      params: { reason: `Complaint: ${classification.sentiment}` },
    };
  }

  if (classification.type === 'query') {
    return {
      action: defaults.onQuery || 'auto_reply',
      params: {},
    };
  }

  if (classification.type === 'order') {
    return {
      action: defaults.onOrder || 'auto_reply',
      params: { type: 'order_tracking' },
    };
  }

  // Default: escalate if high priority, otherwise auto-reply
  if (['high', 'urgent'].includes(classification.priority)) {
    return {
      action: 'escalate',
      params: { reason: `High priority: ${classification.type}` },
    };
  }

  return {
    action: 'auto_reply',
    params: {},
  };
}

/**
 * Check if a message should be escalated
 * @param {Object} classification - AI classification
 * @param {Object} automation - Automation config
 * @returns {Object} - { shouldEscalate: boolean, reason: string }
 */
export function checkEscalation(classification, automation) {
  const action = determineAction(classification, automation);

  const shouldEscalate = [
    'escalate',
    'reply_and_escalate',
    'create_ticket',
  ].includes(action.action);

  return {
    shouldEscalate,
    action: action.action,
    reason: action.params?.reason || `Type: ${classification.type}, Priority: ${classification.priority}`,
    ruleApplied: action.ruleId,
  };
}

/**
 * Create default rules for a user
 * Called when automation is first created
 * @returns {Array} - Default rules
 */
export function getDefaultRules() {
  return [
    {
      name: 'Escalate Urgent Complaints',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'complaint' },
        { field: 'priority', operator: 'gte', value: 'high' },
      ],
      action: {
        type: 'escalate',
        params: { severity: 'high', assignTo: 'support_manager' },
      },
      priority: 20,
    },
    {
      name: 'Auto-reply Negative Sentiment Queries',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'query' },
        { field: 'sentiment', operator: 'equals', value: 'negative' },
      ],
      action: {
        type: 'auto_reply',
        params: { urgency: 'high' },
      },
      priority: 15,
    },
    {
      name: 'Escalate All Refund Requests',
      enabled: true,
      conditions: [
        { field: 'action', operator: 'contains', value: 'refund' },
      ],
      action: {
        type: 'escalate',
        params: { department: 'billing' },
      },
      priority: 18,
    },
    {
      name: 'Auto-reply Order Tracking',
      enabled: true,
      conditions: [
        { field: 'type', operator: 'equals', value: 'order' },
      ],
      action: {
        type: 'auto_reply',
        params: { template: 'order_tracking' },
      },
      priority: 10,
    },
  ];
}

