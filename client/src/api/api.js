import axios from 'axios';
import { getApiBase } from '../lib/runtimeConfig';

const API_BASE = getApiBase();

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('medvista_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('medvista_token');
      localStorage.removeItem('medvista_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// ── Doctors ──────────────────────────────────────────────────────
export const doctorAPI = {
  getAll: (category) => api.get('/doctors', { params: category ? { category } : {} }),
  getOne: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  getCategories: () => api.get('/doctors/categories'),
};

// ── Patients ─────────────────────────────────────────────────────
export const patientAPI = {
  getAll: () => api.get('/patients'),
  getOne: (id) => api.get(`/patients/${id}`),
  update: (id, data) => api.put(`/patients/${id}`, data),
};

// ── Appointments ─────────────────────────────────────────────────
export const appointmentAPI = {
  getAll: (status) => api.get('/appointments', { params: status ? { status } : {} }),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  sendConfirmation: (id) => api.post(`/appointments/${id}/send-confirmation`),
  sendConfirmationByPhone: (payload) => api.post('/appointments/send-confirmation-by-phone', payload),
};

// ── Patient Logs ─────────────────────────────────────────────────
export const logAPI = {
  getAll: () => api.get('/patient-logs'),
  create: (data) => api.post('/patient-logs', data),
  getDoctorLogs: () => api.get('/doctor-logs'),
};

// ── Health Slips ─────────────────────────────────────────────────
export const slipAPI = {
  getAll: () => api.get('/health-slips'),
  getOne: (id) => api.get(`/health-slips/${id}`),
  create: (data) => api.post('/health-slips', data),
};

// ── AI Chat ──────────────────────────────────────────────────────
export const chatAPI = {
  send: (message) => api.post('/chat', { message }),
  history: () => api.get('/chat/history'),
  adminMessages: () => api.get('/admin/chat-messages'),
};

// ── Stats ────────────────────────────────────────────────────────
export const statsAPI = {
  get: () => api.get('/stats'),
};

// ── Hospital Map ─────────────────────────────────────────────────
export const mapAPI = {
  get: () => api.get('/hospital/map'),
};

export default api;
