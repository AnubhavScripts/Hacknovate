import axios from 'axios';

const api = axios.create({
  baseURL: 'https://hacknovate-production.up.railway.app',
  withCredentials: true,
});

// Auth
export const signupApi  = (data) => api.post('/auth/signup', data);
export const loginApi   = (data) => api.post('/auth/login', data);
export const getMeApi   = ()     => api.get('/auth/me');
export const logoutApi  = ()     => api.post('/auth/logout');
export const googleAuthApi = () => api.get('/auth/google');
export const gmailConnectApi = () => api.get('/auth/gmail/connect');

// Automation
export const saveAutomationApi = (data)              => api.post('/automation/save', data);
export const getAutomationApi  = (userId)            => api.get(`/automation/${userId}`);
export const deleteAutomationApi = (userId)          => api.delete(`/automation/${userId}`);
export const updateStatusApi   = (id, status)        => api.patch(`/automation/${id}/status`, { status });
export const processEmailsApi  = (automationId)      => api.post(`/automation/${automationId}/process-emails`);

// Messages
export const analyzeMessageApi = (data) =>
  api.post('/message', data);

// Logs
export const getLogsApi = (userId) => api.get(`/logs/${userId}`);
export const getAllLogsApi = () => api.get('/logs');

// Escalations
export const getPendingEscalationsApi = (userId)     => api.get(`/escalations/pending/${userId}`);
export const submitEscalationReviewApi = (logId, feedback, manualReply) =>
  api.post(`/escalations/${logId}/review`, { feedback, manualReply });
export const getEscalationMetricsApi = (userId)      => api.get(`/escalations/metrics/${userId}`);

// Rules
export const getRulesApi = (userId)                                    => api.get(`/rules/${userId}/rules`);
export const createRuleApi = (userId, rule)                            => api.post(`/rules/${userId}/rules`, rule);
export const updateRuleApi = (userId, ruleId, updates)                 => api.patch(`/rules/${userId}/rules/${ruleId}`, updates);
export const deleteRuleApi = (userId, ruleId)                          => api.delete(`/rules/${userId}/rules/${ruleId}`);
export const toggleRuleApi = (userId, ruleId)                          => api.patch(`/rules/${userId}/rules/${ruleId}/toggle`);

// Analytics
export const getAnalyticsApi = (userId)              => api.get(`/analytics/${userId}`);
export const getChannelDataApi = (userId, channel)   => api.get(`/analytics/${userId}/channels`, { params: { channel } });

export default api;
