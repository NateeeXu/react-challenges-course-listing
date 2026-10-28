import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { Schedule } from './types/schedule';

const service = vi.hoisted(() => ({
  unsubscribe: vi.fn(),
  subscribe: vi.fn<(onData: (schedule: Schedule) => void, onError: (error: Error) => void) => () => void>(),
}));
vi.mock('./services/schedule', () => ({ subscribeToSchedule: service.subscribe }));

const schedule: Schedule = {
  title: 'CS Courses for 2018-2019',
  courses: {
    F101: { term: 'Fall', number: '101', title: 'AI', meets: 'MWF 9:00-10:00' },
    W110: { term: 'Winter', number: '110', title: 'Programming', meets: '' },
  },
};
const renderApp = () => render(<MemoryRouter><App /></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  service.subscribe.mockReturnValue(service.unsubscribe);
});

describe('App database integration', () => {
  it('keeps the existing course UI after receiving database data', () => {
    renderApp();
    expect(screen.getByText('Loading courses…')).toBeTruthy();
    act(() => service.subscribe.mock.calls[0][0](schedule));
    expect(screen.getByRole('heading', { name: schedule.title })).toBeTruthy();
    expect(screen.getByText('total courses').textContent).toBe('2 total courses');
    expect(screen.getByRole('link', { name: 'Edit CS 101: AI' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Programming' })).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Winter' }));
    expect(screen.getByRole('heading', { name: 'Programming' })).toBeTruthy();
  });

  it('shows read errors rather than falling back to sample JSON', () => {
    renderApp();
    act(() => service.subscribe.mock.calls[0][1](new Error('Permission denied')));
    expect(screen.getByText('Error loading courses: Permission denied')).toBeTruthy();
    expect(screen.queryByText('Loading courses…')).toBeNull();
    expect(screen.queryByRole('link', { name: /Edit CS/ })).toBeNull();
  });

  it('handles an empty schedule without crashing', () => {
    renderApp();
    act(() => service.subscribe.mock.calls[0][0]({ title: 'Empty schedule', courses: {} }));
    expect(screen.getByText('total courses').textContent).toBe('0 total courses');
    expect(screen.queryByRole('link', { name: /Edit CS/ })).toBeNull();
  });

  it('keeps selections while the same schedule receives a live update', () => {
    renderApp();
    const onData = service.subscribe.mock.calls[0][0];
    act(() => onData(schedule));
    fireEvent.click(screen.getByRole('button', { name: 'Select CS 101: AI' }));
    act(() => onData({ ...schedule, title: 'Updated schedule' }));
    expect(screen.getByText('1 selected')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Select CS 101: AI' }).getAttribute('aria-pressed')).toBe('true');
  });
});
