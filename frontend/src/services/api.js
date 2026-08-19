import axios from 'axios';
import { storage } from '../utils/storage';

// ✅ BaseURL without /api/v1 - we'll add it to each call
const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://humanresourcemanagementsystem-production.up.railway.app';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({ baseURL });
let refreshPromise = null;

// List of public endpoints (with /api/v1)
const publicEndpoints = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/register',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
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
  
  forgotPassword: (email) => api.post('/api/v1/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/api/v1/auth/reset-password', data),
  
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
  search: (params) => api.get('/api/v1/employees/search', { params }),
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
  getAll: (params) => api.get('/api/v1/leaves', { params }),
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
  clockIn: () => api.post('/api/v1/attendance/my/check-in'),
  clockOut: () => api.post('/api/v1/attendance/my/check-out'),
  getToday: () => api.get('/api/v1/attendance/my/today'),
  getHistory: (params) => api.get('/api/v1/attendance/my/history', { params }),
  getSummary: (params) => api.get('/api/v1/attendance/my/summary', { params }),
  getAll: (params) => api.get('/api/v1/attendance', { params }),
  getByEmployee: (employeeId, params) => api.get(`/api/v1/attendance/employee/${employeeId}`, { params }),
};

// ========================================
// DASHBOARD API METHODS
// ========================================

export const dashboard = {
  getHR: () => api.get('/api/v1/dashboard/hr'),
  getManager: (managerEmployeeId) => api.get(`/api/v1/dashboard/manager/${managerEmployeeId}`),
  getEmployee: (employeeId) => api.get(`/api/v1/dashboard/employee/${employeeId}`),
};

// ========================================
// PERFORMANCE API METHODS
// ========================================

export const performance = {
  getAll: (params) => api.get('/api/v1/performance', { params }),
  getById: (id) => api.get(`/api/v1/performance/${id}`),
  create: (data) => api.post('/api/v1/performance', data),
  update: (id, data) => api.put(`/api/v1/performance/${id}`, data),
  delete: (id) => api.delete(`/api/v1/performance/${id}`),
  getReviews: (params) => api.get('/api/v1/performance/reviews', { params }),
  getGoals: (params) => api.get('/api/v1/performance/goals', { params }),
};

// ========================================
// PAYROLL API METHODS
// ========================================

export const payroll = {
  getAll: (params) => api.get('/api/v1/payroll', { params }),
  getById: (id) => api.get(`/api/v1/payroll/${id}`),
  create: (data) => api.post('/api/v1/payroll', data),
  update: (id, data) => api.put(`/api/v1/payroll/${id}`, data),
  delete: (id) => api.delete(`/api/v1/payroll/${id}`),
  getEmployeePayroll: (employeeId) => api.get(`/api/v1/payroll/employee/${employeeId}`),
};

// ========================================
// DOCUMENTS API METHODS
// ========================================

export const documents = {
  getAll: (params) => api.get('/api/v1/documents', { params }),
  getById: (id) => api.get(`/api/v1/documents/${id}`),
  upload: (data) => api.post('/api/v1/documents/upload', data),
  delete: (id) => api.delete(`/api/v1/documents/${id}`),
  download: (id) => api.get(`/api/v1/documents/${id}/download`, { responseType: 'blob' }),
};

// ========================================
// NOTIFICATIONS API METHODS
// ========================================

export const notifications = {
  getAll: () => api.get('/api/v1/notifications'),
  getUnread: () => api.get('/api/v1/notifications/unread'),
  markAsRead: (id) => api.put(`/api/v1/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/v1/notifications/read-all'),
  delete: (id) => api.delete(`/api/v1/notifications/${id}`),
};

// ========================================
// PROFILE API METHODS
// ========================================

export const profile = {
  get: () => api.get('/api/v1/profile'),
  update: (data) => api.put('/api/v1/profile', data),
  updateAvatar: (data) => api.post('/api/v1/profile/avatar', data),
  changePassword: (data) => api.post('/api/v1/profile/change-password', data),
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!storage.getAccessToken();
};

// Get current user from storage
export const getCurrentUser = () => {
  return storage.getUser();
};

// Check if user has specific role
export const hasRole = (role) => {
  const user = storage.getUser();
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
};

// Check if user has any of the given roles
export const hasAnyRole = (roles) => {
  const user = storage.getUser();
  if (!user || !user.roles) return false;
  return roles.some(role => user.roles.includes(role));
};

// Check if user has all of the given roles
export const hasAllRoles = (roles) => {
  const user = storage.getUser();
  if (!user || !user.roles) return false;
  return roles.every(role => user.roles.includes(role));
};

// Get user's primary role
export const getPrimaryRole = () => {
  const user = storage.getUser();
  if (!user || !user.roles) return null;
  return user.roles[0] || null;
};

export default api;