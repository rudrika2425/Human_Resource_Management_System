import { api } from './api';

export const authService = {
  login(payload) {
    return api
      .post('/api/v1/auth/login', payload)
      .then((response) => response.data.data);
  },

  register(payload) {
    return api
      .post('/api/v1/auth/register', payload)
      .then((response) => response.data.data);
  },

  me() {
    return api
      .get('/api/v1/auth/me')
      .then((response) => response.data.data);
  },

  changePassword(payload) {
    return api
      .post('/api/v1/auth/change-password', payload)
      .then((response) => response.data.data);
  },

  logout(refreshToken) {
    return api
      .post('/api/v1/auth/logout', { refreshToken })
      .then((response) => response.data.data);
  },
};