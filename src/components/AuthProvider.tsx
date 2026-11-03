import { useEffect, useState, type PropsWithChildren } from 'react';
import { AuthContext, initialAuthState, type AuthState } from '../context/auth';
import { subscribeToAuth } from '../services/auth';
import { subscribeToRole } from '../services/roles';

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<AuthState>(initialAuthState);

  useEffect(() => {
    let active = true;
    let generation = 0;
    let unsubscribeRole: (() => void) | undefined;
    const unsubscribe = subscribeToAuth(
      (user) => {
        if (!active) return;
        unsubscribeRole?.();
        unsubscribeRole = undefined;
        const currentGeneration = ++generation;
        setState({ ...initialAuthState, user, isLoading: false, isRoleLoading: Boolean(user) });
        if (!user) return;
        unsubscribeRole = subscribeToRole(user.uid, (isAdmin) => {
          if (active && currentGeneration === generation) {
            setState((current) => ({ ...current, isAdmin, isRoleLoading: false, roleError: null }));
          }
        }, (roleError) => {
          if (active && currentGeneration === generation) {
            setState((current) => ({ ...current, isAdmin: false, isRoleLoading: false, roleError }));
          }
        });
      },
      (error) => {
        if (!active) return;
        ++generation;
        unsubscribeRole?.();
        unsubscribeRole = undefined;
        setState({ ...initialAuthState, isLoading: false, error });
      },
    );
    return () => { active = false; ++generation; unsubscribe(); unsubscribeRole?.(); };
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
};
