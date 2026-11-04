import { useState, type ReactNode } from 'react';
import { userApi } from '../api/axios';
import type { User, LoginCredentials, RegisterData } from '../types';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (creds: LoginCredentials) => {
    const res = await userApi.post('/login', creds);
    const { token, user } = res.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const register = async (data: RegisterData) => {
    await userApi.post('/register', data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
