import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('campusequip_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('campusequip_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!localStorage.getItem('campusequip_token')) return;
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.data);
        setUnreadNotifCount(res.unreadCount);
      }
    } catch {
      // ignore in background
    }
  }, []);

  const refreshMe = useCallback(async () => {
    if (!localStorage.getItem('campusequip_token')) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
        localStorage.setItem('campusequip_user', JSON.stringify(res.user));
        await fetchNotifications();
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [fetchNotifications]);

  useEffect(() => {
    refreshMe();

    const handleExpired = () => {
      logout();
    };
    window.addEventListener('auth-expired', handleExpired);
    return () => window.removeEventListener('auth-expired', handleExpired);
  }, [refreshMe]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success) {
      localStorage.setItem('campusequip_token', res.token);
      localStorage.setItem('campusequip_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      fetchNotifications();
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success) {
      localStorage.setItem('campusequip_token', res.token);
      localStorage.setItem('campusequip_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      fetchNotifications();
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('campusequip_token');
    localStorage.removeItem('campusequip_user');
    setToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadNotifCount(0);
  };

  const markAllNotificationsRead = async () => {
    try {
      await api.markNotificationRead('all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadNotifCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshMe,
        setUser,
        notifications,
        unreadNotifCount,
        fetchNotifications,
        markAllNotificationsRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

