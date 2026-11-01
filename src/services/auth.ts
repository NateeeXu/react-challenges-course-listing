import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { authentication } from './firebase';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
}

export const subscribeToAuth = (onUser: (user: AuthUser | null) => void, onError: (error: Error) => void) =>
  onAuthStateChanged(authentication, (user) => onUser(user ? {
    uid: user.uid, displayName: user.displayName, email: user.email,
  } : null), onError);

export const signInWithGoogle = () => signInWithPopup(authentication, new GoogleAuthProvider());
export const signOutUser = () => signOut(authentication);

export const authErrorMessage = (error: unknown): string => {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : '';
  switch (code) {
    case 'auth/popup-closed-by-user': return 'Sign-in was cancelled. You can try again.';
    case 'auth/popup-blocked': return 'Allow pop-ups for this website, then try signing in again.';
    case 'auth/network-request-failed': return 'Check your connection and try again.';
    case 'auth/unauthorized-domain': return 'Sign-in is not enabled for this website address.';
    case 'auth/operation-not-allowed': return 'Google sign-in has not been enabled for this app.';
    default: return 'Unable to complete sign-in or sign-out. Please try again.';
  }
};
