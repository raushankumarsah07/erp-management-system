import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('erp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('erp_token');
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.data && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('erp_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('[Auth Init Error]', err);
          localStorage.removeItem('erp_token');
          localStorage.removeItem('erp_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.data && res.data.token) {
      localStorage.setItem('erp_token', res.data.token);
      localStorage.setItem('erp_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error('Authentication failed');
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res.data && res.data.token) {
      localStorage.setItem('erp_token', res.data.token);
      localStorage.setItem('erp_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error('Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has universal access
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    hasRole,
    isAdmin: user?.role === 'admin',
    isSales: user?.role === 'sales',
    isPurchase: user?.role === 'purchase',
    isInventory: user?.role === 'inventory',
    isFinance: user?.role === 'finance',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
