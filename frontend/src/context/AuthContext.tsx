import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'TEACHER'
  | 'FORM_TEACHER'
  | 'BURSAR'
  | 'STUDENT'
  | 'PARENT'
  | 'LIBRARIAN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  studentId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  switchRole: (role: Role) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sms_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('sms_user', JSON.stringify(res.data.user));
        } catch {
          logout();
        }
      } else {
        // Auto-login as Super Admin for demonstration if not logged in
        try {
          const res = await api.post('/auth/switch-role', { role: 'SUPER_ADMIN' });
          setToken(res.data.token);
          setUser(res.data.user);
          localStorage.setItem('sms_token', res.data.token);
          localStorage.setItem('sms_user', JSON.stringify(res.data.user));
        } catch (e) {
          console.error('Auto login fallback:', e);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('sms_token', res.data.token);
    localStorage.setItem('sms_user', JSON.stringify(res.data.user));
  };

  const switchRole = async (role: Role) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/switch-role', { role });
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('sms_token', res.data.token);
      localStorage.setItem('sms_user', JSON.stringify(res.data.user));
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
