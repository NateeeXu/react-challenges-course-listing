import { doc, onSnapshot } from 'firebase/firestore';
import { database } from './firebase';
import { parseSchedule, scheduleDocumentId, type Schedule } from '../types/schedule';

export const subscribeToSchedule = (
  onData: (schedule: Schedule) => void,
  onError: (error: Error) => void,
) => onSnapshot(
  doc(database, 'schedules', scheduleDocumentId),
  (snapshot) => {
    if (!snapshot.exists()) {
      onError(new Error('The course schedule has not been imported into Firestore yet.'));
      return;
    }

    let schedule: Schedule;
    try {
      schedule = parseSchedule(snapshot.data());
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unable to read the course schedule.'));
      return;
    }
    onData(schedule);
  },
  onError,
);
