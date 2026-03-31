import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
});

// Auth
export const getMe = () => api.get('/auth/me');
export const mockLogin = (name, email) => api.post('/auth/mock-login', { name, email });
export const logout = () => api.post('/auth/logout');

// Automation
export const saveAutomation = (data) => api.post('/automation/save', data);
export const getAutomation = (userId) => api.get(`/automation/${userId}`);
export const updateStatus = (id, status) => api.patch(`/automation/${id}/status`, { status });

// AI message analysis
export const analyzeMessage = (message, userId) =>
  api.post('/analyze-message', { message, userId });

// Logs
export const getLogs = (userId) => api.get(`/logs/${userId}`);

export default api;
