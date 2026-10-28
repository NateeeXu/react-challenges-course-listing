import { useEffect, useState } from 'react';
import { subscribeToSchedule } from '../services/schedule';
import type { Schedule } from '../types/schedule';

interface ScheduleState {
  schedule: Schedule | undefined;
  isLoading: boolean;
  error: Error | null;
}

export const useSchedule = (): ScheduleState => {
  const [state, setState] = useState<ScheduleState>({
    schedule: undefined,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeToSchedule(
      (schedule) => {
        if (active) setState({ schedule, isLoading: false, error: null });
      },
      (error) => {
        if (active) setState({ schedule: undefined, isLoading: false, error });
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return state;
};
