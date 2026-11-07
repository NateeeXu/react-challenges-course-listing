import { useEffect, useRef, useState } from 'react';
import { changePersonalSelection, subscribeToPersonalPlan } from '../services/personal-plan';
import { emptyPersonalPlan, type PersonalPlan } from '../types/personal-plan';
import type { Course } from '../types/course';
import { coursesConflict } from '../utilities/time-conflicts';

interface SelectionChange { id: string; selected: boolean }
interface PlanView {
  selectedCourseIds: string[];
  status: 'guest' | 'loading' | 'saved' | 'saving' | 'error';
  ready: boolean;
  error: string | null;
}
interface PlanSession {
  active: boolean;
  ready: boolean;
  running: boolean;
  confirmed: PersonalPlan;
  queue: SelectionChange[];
}
const withChanges = (ids: string[], changes: SelectionChange[]) => changes.reduce((current, change) =>
  change.selected ? [...new Set([...current, change.id])] : current.filter((id) => id !== change.id), ids);

// The owning component is keyed by account UID, so account changes get a fresh session.
export const usePersonalPlan = (uid: string | null) => {
  const [view, setView] = useState<PlanView>(() => ({
    selectedCourseIds: [], status: uid ? 'loading' : 'guest', ready: !uid, error: null,
  }));
  const sessionRef = useRef<PlanSession | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const session: PlanSession = {
      active: true, ready: !uid, running: false, confirmed: emptyPersonalPlan(), queue: [],
    };
    sessionRef.current = session;
    const unsubscribe = uid ? subscribeToPersonalPlan(uid, (plan) => {
      if (!session.active || plan.revision < session.confirmed.revision) return;
      session.confirmed = plan;
      session.ready = true;
      setView({ selectedCourseIds: withChanges(plan.selectedCourseIds, session.queue),
        status: session.running ? 'saving' : 'saved', ready: true, error: null });
    }, () => {
      if (!session.active) return;
      session.ready = false;
      session.queue = [];
      setView({ selectedCourseIds: session.confirmed.selectedCourseIds, ready: false,
        status: 'error', error: 'Unable to load your saved plan. Check your connection and retry.' });
    }) : undefined;
    return () => { session.active = false; session.queue = []; unsubscribe?.(); };
  }, [uid, retry]);

  const flush = async (session: PlanSession) => {
    if (!uid || session.running) return;
    session.running = true;
    while (session.active && session.ready && session.queue.length) {
      const change = session.queue[0];
      try {
        const confirmed = await changePersonalSelection(uid, change.id, change.selected);
        if (!session.active || !session.ready) break;
        if (confirmed.revision >= session.confirmed.revision) session.confirmed = confirmed;
        session.queue.shift();
        setView({ selectedCourseIds: withChanges(session.confirmed.selectedCourseIds, session.queue),
          status: session.queue.length ? 'saving' : 'saved', ready: true, error: null });
      } catch (error) {
        if (!session.active || !session.ready) break;
        session.queue = [];
        const detail = error instanceof Error ? error.message : 'Please try selecting again.';
        setView({ selectedCourseIds: session.confirmed.selectedCourseIds, status: 'error', ready: true,
          error: `Could not save changes. Your last saved plan is shown. ${detail}` });
      }
    }
    session.running = false;
  };

  const toggleCourse = (id: string, courses: Record<string, Course>) => {
    const session = sessionRef.current;
    if (!session?.active || !session.ready || !Object.hasOwn(courses, id)) return;
    const ids = withChanges(session.confirmed.selectedCourseIds, session.queue);
    const selected = !ids.includes(id);
    if (selected && ids.some((selectedId) => courses[selectedId] && coursesConflict(courses[id], courses[selectedId]))) return;
    const change = { id, selected };
    if (!uid) {
      session.confirmed = { selectedCourseIds: withChanges(ids, [change]), revision: 0 };
      setView({ selectedCourseIds: session.confirmed.selectedCourseIds, status: 'guest', ready: true, error: null });
      return;
    }
    session.queue.push(change);
    setView({ selectedCourseIds: withChanges(session.confirmed.selectedCourseIds, session.queue),
      status: 'saving', ready: true, error: null });
    void flush(session);
  };

  const retryLoading = () => {
    setView((current) => ({ ...current, selectedCourseIds: [], status: 'loading', ready: false, error: null }));
    setRetry((current) => current + 1);
  };
  return { ...view, toggleCourse, retryLoading };
};
