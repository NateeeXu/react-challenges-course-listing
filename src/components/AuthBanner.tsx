import { useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authErrorMessage, signInWithGoogle, signOutUser } from '../services/auth';

export const AuthBanner = () => {
  const { user, isLoading, error } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [actionError, setActionError] = useState('');
  const pending = useRef(false);
  const handleAuth = async () => {
    if (pending.current) return;
    pending.current = true;
    setIsPending(true);
    setActionError('');
    try {
      if (user) await signOutUser();
      else await signInWithGoogle();
    } catch (error) {
      setActionError(authErrorMessage(error));
    } finally {
      pending.current = false;
      setIsPending(false);
    }
  };

  return (
    <section aria-label="Account" className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-5">
      <p className="m-0 text-sm text-[var(--muted)]" role="status">
        {isLoading ? 'Checking sign-in…' : user ? `Signed in as ${user.displayName || user.email || 'a Google user'}` : 'Browse freely. Sign in to edit courses.'}
      </p>
      <button type="button" onClick={handleAuth} disabled={isLoading || isPending}
        className="cursor-pointer rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
        {isPending ? (user ? 'Signing out…' : 'Signing in…') : user ? 'Sign out' : 'Sign in with Google'}
      </button>
      {(actionError || error) && <p role="alert" className="m-0 w-full text-sm text-[#9b3326]">
        {actionError || 'Unable to check your sign-in status. Reload the page to try again.'}
      </p>}
    </section>
  );
};
