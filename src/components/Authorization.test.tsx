import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { AuthProvider } from './AuthProvider';
import type { AuthUser } from '../services/auth';

interface RoleListener {
  uid: string;
  onRole: (admin: boolean) => void;
  onError: (error: Error) => void;
  unsubscribe: ReturnType<typeof vi.fn>;
}
const service = vi.hoisted(() => ({
  onUser: (() => {}) as (user: AuthUser | null) => void,
  onError: (() => {}) as (error: Error) => void,
  roles: [] as RoleListener[], unsubscribe: vi.fn(), save: vi.fn(),
}));
vi.mock('../services/auth', () => ({
  subscribeToAuth: (onUser: typeof service.onUser, onError: typeof service.onError) => {
    service.onUser = onUser; service.onError = onError; return service.unsubscribe;
  }, signInWithGoogle: vi.fn(), signOutUser: vi.fn(), authErrorMessage: () => 'Authentication failed.',
}));
vi.mock('../services/roles', () => ({
  subscribeToRole: (uid: string, onRole: RoleListener['onRole'], onError: RoleListener['onError']) => {
    const unsubscribe = vi.fn(); service.roles.push({ uid, onRole, onError, unsubscribe }); return unsubscribe;
  },
}));
vi.mock('../services/schedule', () => ({
  saveCourse: service.save,
  subscribeToSchedule: (onData: (data: unknown) => void) => {
    onData({ title: 'Courses', courses: { F101: { title: 'AI', term: 'Fall', number: '101', meets: '' } } });
    return () => {};
  },
}));
const member = { uid: 'member', displayName: 'Student', email: null };
const renderApp = (path = '/') => render(<MemoryRouter initialEntries={[path]}><AuthProvider><App /></AuthProvider></MemoryRouter>);
beforeEach(() => { vi.clearAllMocks(); service.roles.length = 0; });

describe('role-based editing', () => {
  it('keeps a signed-in member read only but permits course selection', () => {
    renderApp(); act(() => service.onUser(member));
    expect(screen.queryByRole('link', { name: /Edit CS/ })).toBeNull();
    expect(screen.getByText(/Checking permissions/)).toBeTruthy();
    act(() => service.roles[0].onRole(false));
    expect(screen.getByText('Signed in as Student · Read only')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Select CS 101: AI' }));
    expect(screen.getByText('1 selected')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Edit CS/ })).toBeNull();
  });

  it('blocks direct URLs while the role loads and for non-admin users', () => {
    renderApp('/courses/F101/edit'); act(() => service.onUser(member));
    expect(screen.getByText('Checking editing permissions…')).toBeTruthy();
    expect(screen.queryByRole('form')).toBeNull();
    act(() => service.roles[0].onRole(false));
    expect(screen.getByRole('heading', { name: 'Administrator access required' })).toBeTruthy();
    expect(screen.queryByRole('form')).toBeNull();
    expect(service.save).not.toHaveBeenCalled();
  });

  it('reacts to grants and revocations without clearing the course plan', () => {
    renderApp(); act(() => service.onUser(member));
    fireEvent.click(screen.getByRole('button', { name: 'Select CS 101: AI' }));
    act(() => service.roles[0].onRole(true));
    fireEvent.click(screen.getByRole('link', { name: 'Edit CS 101: AI' }));
    fireEvent.change(screen.getByLabelText('Course title'), { target: { value: 'Unsaved draft' } });
    act(() => service.roles[0].onRole(false));
    expect(screen.queryByRole('form')).toBeNull();
    expect(service.save).not.toHaveBeenCalled();
    act(() => service.roles[0].onRole(true));
    expect((screen.getByLabelText('Course title') as HTMLInputElement).value).toBe('AI');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('1 selected')).toBeTruthy();
  });

  it('never reuses a previous account role and ignores late callbacks', () => {
    renderApp(); act(() => service.onUser(member));
    const previous = service.roles[0]; act(() => previous.onRole(true));
    act(() => service.onUser({ ...member, uid: 'other-user' }));
    expect(previous.unsubscribe).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('link', { name: /Edit CS/ })).toBeNull();
    act(() => previous.onRole(true));
    expect(screen.queryByRole('link', { name: /Edit CS/ })).toBeNull();
    act(() => service.roles[1].onRole(false));
    expect(screen.queryByRole('link', { name: /Edit CS/ })).toBeNull();
    act(() => service.onUser(null));
    act(() => service.onUser(member));
    expect(screen.queryByRole('link', { name: /Edit CS/ })).toBeNull();
    expect(service.roles[2].uid).toBe('member');
  });

  it('revokes editing if the role listener fails and cleans up listeners', () => {
    const view = renderApp('/courses/F101/edit'); act(() => service.onUser(member));
    act(() => service.roles[0].onRole(true));
    act(() => service.roles[0].onError(new Error('Permission denied')));
    expect(screen.queryByRole('form')).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('Unable to check editing permissions');
    view.unmount();
    expect(service.roles[0].unsubscribe).toHaveBeenCalledTimes(1);
    act(() => service.roles[0].onRole(true));
    expect(service.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
