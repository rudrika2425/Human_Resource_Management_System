import axios from 'axios';
import { storage } from '../utils/storage';

// ✅ Add /api/v1 to the baseURL
const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://humanresourcemanagementsystem-production.up.railway.app/api/v1';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({ baseURL });
let refreshPromise = null;

// List of public endpoints that don't need authentication
const publicEndpoints = [
  '/auth/login',
  '/auth/refresh',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// Request interceptor - adds token to requests
api.interceptors.request.use(
  (config) => {
    const token = storage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handles token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const url = originalRequest?.url || '';

    // Check if the endpoint is public
    const isPublicEndpoint = publicEndpoints.some(endpoint => url.includes(endpoint));

    // Don't retry if:
    // - Status is not 401
    // - Already retried
    // - Is a public endpoint
    if (status !== 401 || originalRequest?._retry || isPublicEndpoint) {
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
        refreshPromise = refreshClient.post('/auth/refresh', { refreshToken });
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
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  
  activateUser: (userId) => api.post(`/auth/users/${userId}/activate`),
  deactivateUser: (userId) => api.post(`/auth/users/${userId}/deactivate`),
};

// ========================================
// EMPLOYEE API METHODS
// ========================================

export const employee = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  patch: (id, data) => api.patch(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  activate: (id) => api.post(`/employees/${id}/activate`),
  deactivate: (id) => api.post(`/employees/${id}/deactivate`),
  getManager: (employeeId) => api.get(`/employees/${employeeId}/manager`),
  myTeam: () => api.get('/employees/my-team'),
};

// ========================================
// LEAVE API METHODS
// ========================================

export const leave = {
  apply: (data) => api.post('/leaves', data),
  approve: (id, data) => api.post(`/leaves/${id}/approve`, data),
  reject: (id, data) => api.post(`/leaves/${id}/reject`, data),
  cancel: (id) => api.post(`/leaves/${id}/cancel`),
  history: (employeeId) => api.get(`/leaves/history/${employeeId}`),
  balance: (employeeId, leaveType) => api.get(`/leaves/balance/${employeeId}`, { params: { leaveType } }),
  pending: () => api.get('/leaves/pending'),
  team: (managerId) => api.get('/leaves/team', { params: { managerId } }),
};

// ========================================
// DEPARTMENT API METHODS
// ========================================

export const department = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

// ========================================
// DESIGNATION API METHODS
// ========================================

export const designation = {
  getAll: () => api.get('/designations'),
  getById: (id) => api.get(`/designations/${id}`),
  create: (data) => api.post('/designations', data),
  update: (id, data) => api.put(`/designations/${id}`, data),
  delete: (id) => api.delete(`/designations/${id}`),
};

// ========================================
// ATTENDANCE API METHODS
// ========================================

export const attendance = {
  clockIn: () => api.post('/attendance/clock-in'),
  clockOut: () => api.post('/attendance/clock-out'),
  getToday: () => api.get('/attendance/today'),
  getHistory: (params) => api.get('/attendance/history', { params }),
  getSummary: (params) => api.get('/attendance/summary', { params }),
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