import { useEffect, useState, type PropsWithChildren } from 'react';
import { AuthContext, type AuthState } from '../context/auth';
import { subscribeToAuth } from '../services/auth';

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true, error: null });

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToAuth(
      (user) => { if (active) setState({ user, isLoading: false, error: null }); },
      (error) => { if (active) setState({ user: null, isLoading: false, error }); },
    );
    return () => { active = false; unsubscribe(); };
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
};
