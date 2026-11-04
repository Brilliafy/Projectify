import { createContext } from 'react';
import type { User, LoginCredentials, RegisterData } from '../types';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
