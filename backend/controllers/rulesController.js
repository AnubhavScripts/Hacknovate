/**
 * Rules Controller
 * Endpoints for managing automation rules (CRUD)
 */

import Automation from '../models/Automation.js';
import User from '../models/User.js';

/**
 * GET /automation/:userId/rules - Get all rules for an automation
 */
export const getRules = async (req, res) => {
  try {
    const { userId } = req.params;

    const automation = await Automation.findOne({ userId });
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    res.json({
      automationId: automation._id,
      rules: automation.rules || [],
    });
  } catch (err) {
    console.error('getRules error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /automation/:userId/rules - Create a new rule
 */
export const createRule = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, conditions, action, priority } = req.body;

    // Validate input
    if (!name || !conditions || !action) {
      return res.status(400).json({ error: 'Missing required fields: name, conditions, action' });
    }

    if (!Array.isArray(conditions) || conditions.length === 0) {
      return res.status(400).json({ error: 'Conditions must be a non-empty array' });
    }

    // Validate action structure
    if (!action.type || !['auto_reply', 'escalate', 'label', 'notify'].includes(action.type)) {
      return res.status(400).json({ error: 'Invalid action type' });
    }

    const automation = await Automation.findOne({ userId });
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    // Add new rule
    const newRule = {
      name,
      enabled: true,
      conditions,
      action,
      priority: priority || 10,
    };

    automation.rules.push(newRule);
    await automation.save();

    res.status(201).json({
      success: true,
      message: 'Rule created',
      rule: automation.rules[automation.rules.length - 1],
    });
  } catch (err) {
    console.error('createRule error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /automation/:userId/rules/:ruleId - Update a rule
 */
export const updateRule = async (req, res) => {
  try {
    const { userId, ruleId } = req.params;
    const { name, conditions, action, enabled, priority } = req.body;

    const automation = await Automation.findOne({ userId });
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    const rule = automation.rules.id(ruleId);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    // Update fields
    if (name !== undefined) rule.name = name;
    if (conditions !== undefined) rule.conditions = conditions;
    if (action !== undefined) rule.action = action;
    if (enabled !== undefined) rule.enabled = enabled;
    if (priority !== undefined) rule.priority = priority;

    await automation.save();

    res.json({
      success: true,
      message: 'Rule updated',
      rule,
    });
  } catch (err) {
    console.error('updateRule error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /automation/:userId/rules/:ruleId - Delete a rule
 */
export const deleteRule = async (req, res) => {
  try {
    const { userId, ruleId } = req.params;

    const automation = await Automation.findOne({ userId });
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    // Remove rule
    automation.rules.id(ruleId).remove();
    await automation.save();

    res.json({
      success: true,
      message: 'Rule deleted',
    });
  } catch (err) {
    console.error('deleteRule error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * PATCH /automation/:userId/rules/:ruleId/toggle - Toggle rule enabled/disabled
 */
export const toggleRule = async (req, res) => {
  try {
    const { userId, ruleId } = req.params;

    const automation = await Automation.findOne({ userId });
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    const rule = automation.rules.id(ruleId);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    rule.enabled = !rule.enabled;
    await automation.save();

    res.json({
      success: true,
      message: `Rule ${rule.enabled ? 'enabled' : 'disabled'}`,
      enabled: rule.enabled,
    });
  } catch (err) {
    console.error('toggleRule error:', err);
    res.status(500).json({ error: err.message });
  }
};
