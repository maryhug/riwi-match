'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Role } from '@/lib/types';

interface AuthState {
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    role: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role') as Role | null;
    setState({ token, role, isAuthenticated: !!token, isLoading: false });
  }, []);

  const login = (token: string, role: Role) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_role', role);
    setState({ token, role, isAuthenticated: true, isLoading: false });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    setState({ token: null, role: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
