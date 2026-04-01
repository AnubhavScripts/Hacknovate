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

export default api;
