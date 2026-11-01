import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authErrorMessage, signInWithGoogle, signOutUser, subscribeToAuth } from './auth';

const sdk = vi.hoisted(() => ({ authentication: {}, onAuthStateChanged: vi.fn(), signInWithPopup: vi.fn(), signOut: vi.fn() }));
vi.mock('./firebase', () => ({ authentication: sdk.authentication }));
vi.mock('firebase/auth', () => ({
  ...sdk, GoogleAuthProvider: class { providerId = 'google.com'; },
}));
beforeEach(() => { vi.clearAllMocks(); });

describe('authentication service', () => {
  it('uses Google popup sign-in and Firebase sign-out for the configured app', async () => {
    await signInWithGoogle();
    expect(sdk.signInWithPopup).toHaveBeenCalledWith(sdk.authentication, expect.objectContaining({ providerId: 'google.com' }));
    await signOutUser();
    expect(sdk.signOut).toHaveBeenCalledWith(sdk.authentication);
  });

  it('subscribes to session changes and returns cleanup without exposing tokens', () => {
    const cleanup = vi.fn();
    sdk.onAuthStateChanged.mockReturnValue(cleanup);
    const onUser = vi.fn(); const onError = vi.fn();
    expect(subscribeToAuth(onUser, onError)).toBe(cleanup);
    const changed = sdk.onAuthStateChanged.mock.calls[0][1];
    changed({ uid: 'student', displayName: 'Student', email: 'student@example.com', accessToken: 'must-not-propagate' });
    expect(onUser).toHaveBeenLastCalledWith({ uid: 'student', displayName: 'Student', email: 'student@example.com' });
    changed(null);
    expect(onUser).toHaveBeenLastCalledWith(null);
    expect(sdk.onAuthStateChanged.mock.calls[0][2]).toBe(onError);
  });

  it.each([
    ['auth/popup-closed-by-user', 'Sign-in was cancelled'],
    ['auth/popup-blocked', 'Allow pop-ups'],
    ['auth/network-request-failed', 'Check your connection'],
    ['auth/unauthorized-domain', 'not enabled for this website'],
    ['auth/operation-not-allowed', 'not been enabled'],
    ['unknown', 'Please try again'],
  ])('provides actionable feedback for %s', (code, message) => {
    expect(authErrorMessage({ code })).toContain(message);
  });
});
