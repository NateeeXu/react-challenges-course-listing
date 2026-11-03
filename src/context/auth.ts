import { createContext } from 'react';
import type { AuthUser } from '../services/auth';

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  isRoleLoading: boolean;
  roleError: Error | null;
}

export const initialAuthState: AuthState = {
  user: null, isLoading: true, error: null, isAdmin: false, isRoleLoading: false, roleError: null,
};

export const AuthContext = createContext<AuthState>(initialAuthState);
