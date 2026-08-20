import axios from 'axios';
import { storage } from '../utils/storage';

const baseURL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Separate client so refresh does NOT go through the interceptor
const refreshClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

/**
 * Attach access token to every normal API request.
 */
api.interceptors.request.use(
  (config) => {
    const token = storage.getAccessToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Handle expired access tokens.
 */
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    // Only handle 401
    if (status !== 401) {
      return Promise.reject(error);
    }

    // Never retry the same request twice
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';

    // Never refresh for authentication endpoints
    const isAuthRequest =
      requestUrl.includes('/api/v1/auth/login') ||
      requestUrl.includes('/api/v1/auth/refresh') ||
      requestUrl.includes('/api/v1/auth/logout')||
  requestUrl.includes('/auth/forgot-password') ||
  requestUrl.includes('/auth/reset-password') ||
  requestUrl.includes('/auth/register');

    if (isAuthRequest) {
      return Promise.reject(error);
    }

    const refreshToken = storage.getRefreshToken();

    if (!refreshToken) {
      storage.clearAuth();
      window.dispatchEvent(new Event('hrms:logout'));

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // If another request is already refreshing, wait for it.
      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post('/api/v1/auth/refresh', {
            refreshToken,
          })
          .then((response) => {
            const data = response.data.data;

            storage.setAuth({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              user: data.user,
            });

            return data;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const data = await refreshPromise;

      const newAccessToken = data.accessToken;

      // Update axios defaults
      api.defaults.headers.common.Authorization =
        `Bearer ${newAccessToken}`;

      // Update this request
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      // Retry original request
      return api(originalRequest);
    } catch (refreshError) {
      storage.clearAuth();
      delete api.defaults.headers.common.Authorization;

      window.dispatchEvent(new Event('hrms:logout'));

      return Promise.reject(refreshError);
    }
  }
);
export default api;