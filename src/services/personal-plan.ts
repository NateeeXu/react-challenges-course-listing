import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { authentication, database } from './firebase';
import { emptyPersonalPlan, parsePersonalPlan, type PersonalPlan } from '../types/personal-plan';
import { parseSchedule, scheduleDocumentId } from '../types/schedule';
import { coursesConflict } from '../utilities/time-conflicts';

const planReference = (uid: string) => doc(database, 'users', uid, 'plans', scheduleDocumentId);

export const subscribeToPersonalPlan = (
  uid: string,
  onData: (plan: PersonalPlan) => void,
  onError: (error: Error) => void,
) => onSnapshot(planReference(uid), { includeMetadataChanges: true }, (snapshot) => {
  // A missing cached document must never replace an existing cloud plan.
  if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
  let plan: PersonalPlan;
  try {
    plan = snapshot.exists() ? parsePersonalPlan(snapshot.data()) : emptyPersonalPlan();
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unable to load your saved plan.'));
    return;
  }
  onData(plan);
}, onError);

export const changePersonalSelection = async (
  uid: string, courseId: string, selected: boolean,
): Promise<PersonalPlan> => {
  if (authentication.currentUser?.uid !== uid) throw new Error('Sign in again to save your plan.');
  return runTransaction(database, async (transaction) => {
    const reference = planReference(uid);
    const snapshot = await transaction.get(reference);
    const current = snapshot.exists() ? parsePersonalPlan(snapshot.data()) : emptyPersonalPlan();
    const schedule = await transaction.get(doc(database, 'schedules', scheduleDocumentId));
    if (!schedule.exists()) throw new Error('The course schedule is unavailable.');
    const { courses } = parseSchedule(schedule.data());
    if (!Object.hasOwn(courses, courseId)) throw new Error('This course is no longer available.');
    const ids = current.selectedCourseIds.filter((id) => Object.hasOwn(courses, id));
    if (selected && !ids.includes(courseId) && ids.some((id) => coursesConflict(courses[courseId], courses[id]))) {
      throw new Error('This course conflicts with another course in your saved plan.');
    }
    const selectedCourseIds = selected
      ? [...new Set([...ids, courseId])]
      : ids.filter((id) => id !== courseId);
    if (selectedCourseIds.length === current.selectedCourseIds.length &&
      selectedCourseIds.every((id, index) => id === current.selectedCourseIds[index])) return current;
    if (authentication.currentUser?.uid !== uid) throw new Error('Your account changed before the plan was saved.');
    const next = { selectedCourseIds, revision: current.revision + 1 };
    transaction.set(reference, next);
    return next;
  });
};
