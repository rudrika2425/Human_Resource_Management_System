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
