import axios from 'axios';
import { storage } from '../utils/storage';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({ baseURL });
let refreshPromise = null;

api.interceptors.request.use((config) => {
  const token = storage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const url = originalRequest?.url || '';

    if (status !== 401 || originalRequest?._retry || url.includes('/api/v1/auth/login') || url.includes('/api/v1/auth/refresh') || url.includes('/api/v1/auth/logout')) {
      return Promise.reject(error);
    }

    const refreshToken = storage.getRefreshToken();
    if (!refreshToken) {
      storage.clearAuth();
      window.location.assign('/login');
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient.post('/api/v1/auth/refresh', { refreshToken });
      }
      const response = await refreshPromise;
      refreshPromise = null;
      const { accessToken, refreshToken: nextRefreshToken, user } = response.data.data;
      storage.setAuth({
        accessToken,
        refreshToken: nextRefreshToken,
        user,
      });

      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return api.request(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      storage.clearAuth();
      window.location.assign('/login');
      return Promise.reject(refreshError);
    }
  },
);

// ========================================
// AUTH API METHODS
// ========================================

export const auth = {
  login: (credentials) => api.post('/api/v1/auth/login', credentials),
  register: (userData) => api.post('/api/v1/auth/register', userData),
  logout: (refreshToken) => api.post('/api/v1/auth/logout', { refreshToken }),
  refresh: (refreshToken) => api.post('/api/v1/auth/refresh', { refreshToken }),
  me: () => api.get('/api/v1/auth/me'),
  changePassword: (data) => api.post('/api/v1/auth/change-password', data),
  
  // User management (Admin only)
  activateUser: (userId) => api.post(`/api/v1/auth/users/${userId}/activate`),
  deactivateUser: (userId) => api.post(`/api/v1/auth/users/${userId}/deactivate`),
};

// ========================================
// EMPLOYEE API METHODS
// ========================================

export const employee = {
  getAll: (params) => api.get('/api/v1/employees', { params }),
  getById: (id) => api.get(`/api/v1/employees/${id}`),
  create: (data) => api.post('/api/v1/employees', data),
  update: (id, data) => api.put(`/api/v1/employees/${id}`, data),
  patch: (id, data) => api.patch(`/api/v1/employees/${id}`, data),
  delete: (id) => api.delete(`/api/v1/employees/${id}`),
  activate: (id) => api.post(`/api/v1/employees/${id}/activate`),
  deactivate: (id) => api.post(`/api/v1/employees/${id}/deactivate`),
  getManager: (employeeId) => api.get(`/api/v1/employees/${employeeId}/manager`),
  myTeam: () => api.get('/api/v1/employees/my-team'),
};

// ========================================
// LEAVE API METHODS
// ========================================

export const leave = {
  apply: (data) => api.post('/api/v1/leaves', data),
  approve: (id, data) => api.post(`/api/v1/leaves/${id}/approve`, data),
  reject: (id, data) => api.post(`/api/v1/leaves/${id}/reject`, data),
  cancel: (id) => api.post(`/api/v1/leaves/${id}/cancel`),
  history: (employeeId) => api.get(`/api/v1/leaves/history/${employeeId}`),
  balance: (employeeId, leaveType) => api.get(`/api/v1/leaves/balance/${employeeId}`, { params: { leaveType } }),
  pending: () => api.get('/api/v1/leaves/pending'),
  team: (managerId) => api.get('/api/v1/leaves/team', { params: { managerId } }),
};

// ========================================
// DEPARTMENT API METHODS
// ========================================

export const department = {
  getAll: () => api.get('/api/v1/departments'),
  getById: (id) => api.get(`/api/v1/departments/${id}`),
  create: (data) => api.post('/api/v1/departments', data),
  update: (id, data) => api.put(`/api/v1/departments/${id}`, data),
  delete: (id) => api.delete(`/api/v1/departments/${id}`),
};

// ========================================
// DESIGNATION API METHODS
// ========================================

export const designation = {
  getAll: () => api.get('/api/v1/designations'),
  getById: (id) => api.get(`/api/v1/designations/${id}`),
  create: (data) => api.post('/api/v1/designations', data),
  update: (id, data) => api.put(`/api/v1/designations/${id}`, data),
  delete: (id) => api.delete(`/api/v1/designations/${id}`),
};

// ========================================
// ATTENDANCE API METHODS
// ========================================

export const attendance = {
  clockIn: () => api.post('/api/v1/attendance/clock-in'),
  clockOut: () => api.post('/api/v1/attendance/clock-out'),
  getToday: () => api.get('/api/v1/attendance/today'),
  getHistory: (params) => api.get('/api/v1/attendance/history', { params }),
  getSummary: (params) => api.get('/api/v1/attendance/summary', { params }),
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

export const isAuthenticated = () => {
  return !!storage.getAccessToken();
};

export const getCurrentUser = () => {
  return storage.getUser();
};

export const hasRole = (role) => {
  const user = storage.getUser();
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
};

export const hasAnyRole = (roles) => {
  const user = storage.getUser();
  if (!user || !user.roles) return false;
  return roles.some(role => user.roles.includes(role));
};

export default api;