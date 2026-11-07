import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePersonalPlan } from './usePersonalPlan';
import type { PersonalPlan } from '../types/personal-plan';

interface Listener { uid: string; onData: (plan: PersonalPlan) => void; onError: (error: Error) => void; unsubscribe: ReturnType<typeof vi.fn> }
const service = vi.hoisted(() => ({ listeners: [] as Listener[], change: vi.fn() }));
vi.mock('../services/personal-plan', () => ({
  subscribeToPersonalPlan: (uid: string, onData: Listener['onData'], onError: Listener['onError']) => {
    const unsubscribe = vi.fn(); service.listeners.push({ uid, onData, onError, unsubscribe }); return unsubscribe;
  }, changePersonalSelection: service.change,
}));
const courses = {
  F101: { title: 'First', term: 'Fall' as const, number: '101', meets: 'M 9:00-10:00' },
  F102: { title: 'Second', term: 'Fall' as const, number: '102', meets: 'M 11:00-12:00' },
  F103: { title: 'Conflict', term: 'Fall' as const, number: '103', meets: 'M 9:30-10:30' },
};
const Fixture = ({ uid }: { uid: string | null }) => {
  const plan = usePersonalPlan(uid);
  return <div>
    <p>Selected: {plan.selectedCourseIds.join(',')}</p><p>Status: {plan.status}</p>
    {plan.error && <p role="alert">{plan.error}</p>}
    {Object.keys(courses).map((id) => <button key={id} onClick={() => plan.toggleCourse(id, courses)}>{id}</button>)}
    <button onClick={plan.retryLoading}>Retry</button>
  </div>;
};
const receive = (ids: string[], revision = 1, index = 0) => act(() => service.listeners[index].onData({ selectedCourseIds: ids, revision }));
beforeEach(() => { service.listeners.length = 0; service.change.mockReset(); });

describe('personal plan session', () => {
  it('keeps guest choices temporary and restores a signed-in plan without an initial write', () => {
    const view = render(<Fixture key="guest" uid={null} />);
    fireEvent.click(screen.getByText('F101', { exact: true })); expect(screen.getByText('Selected: F101')).toBeTruthy();
    expect(service.change).not.toHaveBeenCalled();
    view.rerender(<Fixture key="member" uid="member" />);
    expect(screen.getByText('Selected:')).toBeTruthy();
    fireEvent.click(screen.getByText('F101', { exact: true })); expect(service.change).not.toHaveBeenCalled();
    receive(['F102']); expect(screen.getByText('Selected: F102')).toBeTruthy();
    expect(service.change).not.toHaveBeenCalled();
  });

  it('updates immediately, serializes fast clicks and preserves the last toggle intent', async () => {
    let finish!: (value: PersonalPlan) => void;
    service.change.mockImplementationOnce(() => new Promise<PersonalPlan>((resolve) => { finish = resolve; }))
      .mockResolvedValueOnce({ selectedCourseIds: ['F101', 'F102'], revision: 2 })
      .mockResolvedValueOnce({ selectedCourseIds: ['F102'], revision: 3 });
    render(<Fixture uid="member" />); receive([], 0);
    fireEvent.click(screen.getByText('F101', { exact: true }));
    fireEvent.click(screen.getByText('F102', { exact: true }));
    fireEvent.click(screen.getByText('F101', { exact: true }));
    expect(screen.getByText('Selected: F102')).toBeTruthy();
    expect(service.change).toHaveBeenCalledTimes(1);
    await act(async () => { finish({ selectedCourseIds: ['F101'], revision: 1 }); });
    await waitFor(() => expect(screen.getByText('Status: saved')).toBeTruthy());
    expect(service.change.mock.calls).toEqual([['member', 'F101', true], ['member', 'F102', true], ['member', 'F101', false]]);
    expect(screen.getByText('Selected: F102')).toBeTruthy();
  });

  it('keeps newer remote changes when an older save response arrives', async () => {
    let finish!: (value: PersonalPlan) => void;
    service.change.mockImplementationOnce(() => new Promise<PersonalPlan>((resolve) => { finish = resolve; }));
    render(<Fixture uid="member" />); receive([], 0);
    fireEvent.click(screen.getByText('F101', { exact: true }));
    receive(['F101', 'F102'], 2);
    await act(async () => { finish({ selectedCourseIds: ['F101'], revision: 1 }); });
    expect(screen.getByText('Selected: F101,F102')).toBeTruthy();
    receive(['F101'], 1); expect(screen.getByText('Selected: F101,F102')).toBeTruthy();
  });

  it('blocks local time conflicts before creating a write', () => {
    render(<Fixture uid="member" />); receive(['F101']);
    fireEvent.click(screen.getByText('F103', { exact: true }));
    expect(service.change).not.toHaveBeenCalled();
    expect(screen.getByText('Selected: F101')).toBeTruthy();
  });

  it('rolls back failed changes, cancels queued writes and allows selecting again', async () => {
    let fail!: (error: Error) => void;
    service.change.mockImplementationOnce(() => new Promise<PersonalPlan>((_resolve, reject) => { fail = reject; }))
      .mockResolvedValueOnce({ selectedCourseIds: ['F102'], revision: 1 });
    render(<Fixture uid="member" />); receive([], 0);
    fireEvent.click(screen.getByText('F101', { exact: true })); fireEvent.click(screen.getByText('F102', { exact: true }));
    await act(async () => { fail(new Error('Offline')); });
    expect(screen.getByRole('alert').textContent).toContain('last saved plan is shown');
    expect(screen.getByText('Selected:')).toBeTruthy(); expect(service.change).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('F102', { exact: true }));
    await waitFor(() => expect(screen.getByText('Status: saved')).toBeTruthy());
    expect(screen.getByText('Selected: F102')).toBeTruthy();
  });

  it('offers a fresh subscription after a load error without writing an empty plan', () => {
    render(<Fixture uid="member" />);
    act(() => service.listeners[0].onError(new Error('Denied')));
    fireEvent.click(screen.getByText('F101', { exact: true })); expect(service.change).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Retry', { exact: true }));
    expect(service.listeners[0].unsubscribe).toHaveBeenCalledTimes(1);
    receive(['F102'], 4, 1); expect(screen.getByText('Selected: F102')).toBeTruthy();
    expect(service.change).not.toHaveBeenCalled();
  });

  it('clears private choices on an account change and ignores old callbacks and pending writes', async () => {
    let finish!: (value: PersonalPlan) => void;
    service.change.mockImplementationOnce(() => new Promise<PersonalPlan>((resolve) => { finish = resolve; }));
    const view = render(<Fixture key="first" uid="first" />); receive(['F101']);
    fireEvent.click(screen.getByText('F102', { exact: true }));
    view.rerender(<Fixture key="second" uid="second" />);
    expect(screen.getByText('Selected:')).toBeTruthy();
    receive(['F101', 'F102'], 3, 0);
    await act(async () => { finish({ selectedCourseIds: ['F101', 'F102'], revision: 2 }); });
    expect(screen.getByText('Selected:')).toBeTruthy();
    receive(['F102'], 5, 1); expect(screen.getByText('Selected: F102')).toBeTruthy();
    expect(service.listeners[0].unsubscribe).toHaveBeenCalledTimes(1);
    view.rerender(<Fixture key="guest" uid={null} />);
    expect(screen.getByText('Selected:')).toBeTruthy();
  });
});
