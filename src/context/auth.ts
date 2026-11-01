import { createContext } from 'react';
import type { AuthUser } from '../services/auth';

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
}

export const AuthContext = createContext<AuthState>({ user: null, isLoading: true, error: null });
