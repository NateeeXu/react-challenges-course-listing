// In-memory boundary fixture for existing UI tests; persistence has dedicated tests.
import type { PersonalPlan } from '../types/personal-plan';

interface RecordState { plan: PersonalPlan; listeners: Set<(plan: PersonalPlan) => void> }
const records = new Map<string, RecordState>();

export const subscribeToPersonalPlan = (uid: string, onData: (plan: PersonalPlan) => void) => {
  let record = records.get(uid);
  if (!record) {
    record = { plan: { selectedCourseIds: [], revision: 0 }, listeners: new Set() };
    records.set(uid, record);
  }
  record.listeners.add(onData);
  onData(record.plan);
  return () => {
    record.listeners.delete(onData);
    if (!record.listeners.size) records.delete(uid);
  };
};

export const changePersonalSelection = async (uid: string, id: string, selected: boolean) => {
  const record = records.get(uid);
  if (!record) throw new Error('No test plan subscription.');
  record.plan = { revision: record.plan.revision + 1, selectedCourseIds: selected
    ? [...new Set([...record.plan.selectedCourseIds, id])]
    : record.plan.selectedCourseIds.filter((current) => current !== id) };
  for (const listener of record.listeners) listener(record.plan);
  return record.plan;
};
