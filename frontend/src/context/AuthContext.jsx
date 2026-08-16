import React, {
  createContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { authService } from '../services/authService';
import { api } from '../services/api';
import { storage } from '../utils/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storage.getUser());
  const [loading, setLoading] = useState(
    Boolean(storage.getAccessToken())
  );

  useEffect(() => {
    const handleLogout = () => {
      storage.clearAuth();
      setUser(null);
      delete api.defaults.headers.common.Authorization;
    };

    window.addEventListener('hrms:logout', handleLogout);

    return () => {
      window.removeEventListener('hrms:logout', handleLogout);
    };
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const token = storage.getAccessToken();

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common.Authorization =
          `Bearer ${token}`;

        const currentUser = await authService.me();

        setUser(currentUser);
      } catch {
        storage.clearAuth();
        setUser(null);
        delete api.defaults.headers.common.Authorization;
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);

    storage.setAuth(data);

    api.defaults.headers.common.Authorization =
      `Bearer ${data.accessToken}`;

    setUser(data.user);

    return data.user;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);

    return data;
  };

  const logout = async () => {
    const refreshToken = storage.getRefreshToken();

    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Ignore logout failures
    } finally {
      storage.clearAuth();
      setUser(null);
      delete api.defaults.headers.common.Authorization;

      window.dispatchEvent(new Event('hrms:logout'));
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}