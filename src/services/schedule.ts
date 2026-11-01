import { doc, FieldPath, onSnapshot, runTransaction } from 'firebase/firestore';
import { authentication, database } from './firebase';
import { parseSchedule, scheduleDocumentId, type Schedule } from '../types/schedule';
import { courseSchema, coursesEqual, type Course } from '../types/course';

export const saveCourse = async (courseId: string, original: Course, draft: Course): Promise<void> => {
  if (!authentication.currentUser) throw new Error('Sign in to edit courses.');
  const values = courseSchema.parse(draft);
  if (coursesEqual(original, values)) return;

  const reference = doc(database, 'schedules', scheduleDocumentId);
  await runTransaction(database, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error('This schedule no longer exists. Reload the page.');
    const { courses } = parseSchedule(snapshot.data());
    if (!Object.hasOwn(courses, courseId)) throw new Error('This course no longer exists. Return to the course list.');
    if (!coursesEqual(courses[courseId], original)) {
      throw new Error('This course changed while you were editing. Reload the page to review the latest version.');
    }
    // FieldPath keeps the course ID literal and preserves every other course.
    transaction.update(reference, new FieldPath('courses', courseId), values, 'lastEditedCourseId', courseId);
  });
};

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
