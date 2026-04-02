import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
});

// Auth
export const signupApi  = (data) => api.post('/auth/signup', data);
export const loginApi   = (data) => api.post('/auth/login', data);
export const getMeApi   = ()     => api.get('/auth/me');
export const logoutApi  = ()     => api.post('/auth/logout');

// Automation
export const saveAutomationApi = (data)       => api.post('/automation/save', data);
export const getAutomationApi  = (userId)     => api.get(`/automation/${userId}`);
export const updateStatusApi   = (id, status) => api.patch(`/automation/${id}/status`, { status });

// AI
export const analyzeMessageApi = (message, userId) =>
  api.post('/analyze-message', { message, userId });

// Logs
export const getLogsApi = (userId) => api.get(`/logs/${userId}`);

// Escalations
export const getEscalationsApi = (userId) => api.get(`/escalations/pending/${userId}`);
export const reviewEscalationApi = (escalationId, feedback, manualReply) =>
  api.post(`/escalations/${escalationId}/review`, { feedback, manualReply });
export const getEscalationMetricsApi = (userId) => api.get(`/escalations/metrics/${userId}`);

// Rules
export const getRulesApi = (userId) => api.get(`/rules/${userId}/rules`);
export const createRuleApi = (userId, rule) => api.post(`/rules/${userId}/rules`, rule);
export const updateRuleApi = (userId, ruleId, updates) =>
  api.patch(`/rules/${userId}/rules/${ruleId}`, updates);
export const deleteRuleApi = (userId, ruleId) => api.delete(`/rules/${userId}/rules/${ruleId}`);
export const toggleRuleApi = (userId, ruleId) =>
  api.patch(`/rules/${userId}/rules/${ruleId}/toggle`);

export default api;
