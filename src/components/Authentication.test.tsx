import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { AuthProvider } from './AuthProvider';
import type { AuthUser } from '../services/auth';

const service = vi.hoisted(() => ({
  onUser: (() => {}) as (user: AuthUser | null) => void,
  onError: (() => {}) as (error: Error) => void,
  unsubscribe: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), save: vi.fn(),
}));
vi.mock('../services/auth', () => ({
  subscribeToAuth: (onUser: typeof service.onUser, onError: typeof service.onError) => {
    service.onUser = onUser; service.onError = onError; return service.unsubscribe;
  },
  signInWithGoogle: service.signIn, signOutUser: service.signOut,
  authErrorMessage: () => 'Sign-in was cancelled. You can try again.',
}));
vi.mock('../services/roles', () => ({ subscribeToRole: (_uid: string, onRole: (isAdmin: boolean) => void) => {
  onRole(true); return () => {};
} }));
vi.mock('../services/schedule', () => ({
  saveCourse: service.save,
  subscribeToSchedule: (onData: (data: unknown) => void) => {
    onData({ title: 'Course schedule', courses: { F101: { title: 'AI', term: 'Fall', number: '101', meets: '' } } });
    return () => {};
  },
}));
const student = { uid: 'student', displayName: 'Student', email: null };
const renderApp = (path = '/') => render(<MemoryRouter initialEntries={[path]}><AuthProvider><App /></AuthProvider></MemoryRouter>);
beforeEach(() => { vi.clearAllMocks(); service.signIn.mockReset(); service.signOut.mockReset(); });

describe('Authentication', () => {
  it('hides editing until the session is known and lets guests select courses', () => {
    renderApp();
    expect((screen.getByRole('button', { name: 'Sign in with Google' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('link', { name: /Edit CS/ })).toBeNull();
    act(() => service.onUser(null));
    fireEvent.click(screen.getByRole('button', { name: 'Select CS 101: AI' }));
    expect(screen.getByText('1 selected')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Edit CS/ })).toBeNull();
  });

  it('updates editing permissions on login and logout without clearing the course plan', async () => {
    renderApp(); act(() => service.onUser(null));
    fireEvent.click(screen.getByRole('button', { name: 'Select CS 101: AI' }));
    service.signIn.mockImplementationOnce(async () => { service.onUser(student); });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    await screen.findByRole('button', { name: 'Sign out' });
    expect(screen.getByRole('link', { name: 'Edit CS 101: AI' })).toBeTruthy();
    expect(screen.getByText('Signed in as Student · Administrator')).toBeTruthy();
    service.signOut.mockImplementationOnce(async () => { service.onUser(null); });
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await screen.findByRole('button', { name: 'Sign in with Google' });
    expect(screen.queryByRole('link', { name: /Edit CS/ })).toBeNull();
    expect(screen.getByText('1 selected')).toBeTruthy();
  });

  it('guards direct edit URLs and removes an open form immediately after logout', () => {
    renderApp('/courses/F101/edit');
    expect(screen.queryByRole('form')).toBeNull();
    act(() => service.onUser(null));
    expect(screen.getByRole('heading', { name: 'Sign in to edit courses' })).toBeTruthy();
    act(() => service.onUser(student));
    expect(screen.getByLabelText('Course title')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Course title'), { target: { value: 'Unsaved draft' } });
    act(() => service.onUser(null));
    expect(screen.queryByRole('form')).toBeNull();
    expect(service.save).not.toHaveBeenCalled();
    act(() => service.onUser({ ...student, uid: 'other-student' }));
    expect((screen.getByLabelText('Course title') as HTMLInputElement).value).toBe('AI');
  });

  it('handles a cancelled popup and supports retry without granting edit access', async () => {
    renderApp(); act(() => service.onUser(null));
    service.signIn.mockRejectedValueOnce(new Error('Cancelled')).mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Sign-in was cancelled. You can try again.');
    expect(screen.queryByRole('link', { name: /Edit CS/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    await waitFor(() => expect(service.signIn).toHaveBeenCalledTimes(2));
  });

  it('prevents repeated login requests while a popup is pending', async () => {
    let finish!: () => void;
    service.signIn.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    renderApp(); act(() => service.onUser(null));
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with Google' }));
    const pending = screen.getByRole('button', { name: 'Signing in…' }) as HTMLButtonElement;
    expect(pending.disabled).toBe(true);
    fireEvent.click(pending);
    expect(service.signIn).toHaveBeenCalledTimes(1);
    await act(async () => { finish(); });
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeTruthy();
  });

  it('does not pretend a failed sign-out succeeded', async () => {
    renderApp(); act(() => service.onUser(student));
    service.signOut.mockRejectedValueOnce(new Error('Network failure'));
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Edit CS 101: AI' })).toBeTruthy();
  });

  it('cleans up its observer and ignores events after unmount', () => {
    const view = renderApp();
    view.unmount();
    expect(service.unsubscribe).toHaveBeenCalledTimes(1);
    act(() => service.onUser(student));
  });

  it('fails closed when session restoration fails', () => {
    renderApp('/courses/F101/edit');
    act(() => service.onError(new Error('Session failed')));
    expect(screen.getByRole('alert').textContent).toContain('Unable to check your sign-in status');
    expect(screen.queryByRole('form')).toBeNull();
  });
});
