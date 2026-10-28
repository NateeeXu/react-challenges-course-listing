import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSchedule } from './useSchedule';
import type { Schedule } from '../types/schedule';

const service = vi.hoisted(() => ({
  unsubscribe: vi.fn(),
  subscribe: vi.fn<(onData: (schedule: Schedule) => void, onError: (error: Error) => void) => () => void>(),
}));
vi.mock('../services/schedule', () => ({ subscribeToSchedule: service.subscribe }));

const schedule: Schedule = { title: 'Sample', courses: {} };

beforeEach(() => {
  vi.clearAllMocks();
  service.subscribe.mockReturnValue(service.unsubscribe);
});

describe('useSchedule', () => {
  it('starts loading and then delivers database data and later updates', () => {
    const { result } = renderHook(() => useSchedule());
    expect(result.current).toEqual({ schedule: undefined, isLoading: true, error: null });
    const [onData] = service.subscribe.mock.calls[0];
    act(() => onData(schedule));
    expect(result.current).toEqual({ schedule, isLoading: false, error: null });
    act(() => onData({ ...schedule, title: 'Updated' }));
    expect(result.current.schedule?.title).toBe('Updated');
  });

  it('surfaces database failures and can recover after a valid snapshot', () => {
    const { result } = renderHook(() => useSchedule());
    const [onData, onError] = service.subscribe.mock.calls[0];
    const error = new Error('Permission denied');
    act(() => onError(error));
    expect(result.current).toEqual({ schedule: undefined, isLoading: false, error });
    act(() => onData(schedule));
    expect(result.current).toEqual({ schedule, isLoading: false, error: null });
  });

  it('unsubscribes on unmount and ignores late callbacks', () => {
    const { result, unmount } = renderHook(() => useSchedule());
    const [onData, onError] = service.subscribe.mock.calls[0];
    const previous = result.current;
    unmount();
    expect(service.unsubscribe).toHaveBeenCalledTimes(1);
    act(() => {
      onData(schedule);
      onError(new Error('Late callback'));
    });
    expect(result.current).toBe(previous);
  });
});
