import { useState } from 'react';
import { Link, Route, Routes } from 'react-router';
import { CourseEditPage } from './CourseEditPage';
import { CourseCard, type Course } from './CourseCard';
import { TermSelector, type Term } from './TermSelector';
import { SchedulePopup } from './SchedulePopup';
import { coursesConflict } from '../utilities/time-conflicts';
import { useAuth } from '../hooks/useAuth';
import { usePersonalPlan } from '../hooks/usePersonalPlan';

interface TermPageProps {
  courses: Record<string, Course>;
}

export function TermPage({ courses }: TermPageProps) {
  const { user, isLoading } = useAuth();
  const [selectedTerm, setSelectedTerm] = useState<Term>('Fall');
  return <AccountTermPage key={user?.uid ?? 'guest'} courses={courses} uid={user?.uid ?? null}
    authLoading={isLoading} selectedTerm={selectedTerm} onSelectTerm={setSelectedTerm} />;
}

interface AccountTermPageProps extends TermPageProps {
  uid: string | null;
  authLoading: boolean;
  selectedTerm: Term;
  onSelectTerm: (term: Term) => void;
}

function AccountTermPage({ courses, uid, authLoading, selectedTerm, onSelectTerm }: AccountTermPageProps) {
  const { isAdmin, isRoleLoading } = useAuth();
  const plan = usePersonalPlan(uid);
  const selectedCourseIds = plan.selectedCourseIds.filter((id) => Object.hasOwn(courses, id));
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const visibleCourses = Object.entries(courses).filter(
    ([, course]) => course.term === selectedTerm,
  );
  const selectedCourses = Object.entries(courses).filter(
    ([id]) => selectedCourseIds.includes(id),
  );

  // Keep list state above the route switch so Cancel does not clear the plan.
  const courseList = (
    <div className="subject-list">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TermSelector selectedTerm={selectedTerm} onSelect={onSelectTerm} />
        <div className="flex items-center gap-3">
          <p className="m-0 text-sm font-semibold text-[var(--ink)]" aria-live="polite">
            {selectedCourseIds.length} selected
          </p>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setIsPlanOpen(true)}
            className="cursor-pointer rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Course plan
          </button>
        </div>
      </div>
      <div className="-mt-6 flex flex-wrap items-center gap-3">
        <p role={plan.error ? 'alert' : 'status'} className={`m-0 text-xs ${plan.error ? 'text-[#9b3326]' : 'text-[var(--muted)]'}`}>
          {authLoading ? 'Checking sign-in…' : plan.error || (plan.status === 'guest'
            ? 'Temporary plan · sign in to load your saved plan.'
            : plan.status === 'loading' ? 'Loading your saved plan…'
              : plan.status === 'saving' ? 'Saving your plan…' : 'Your plan is saved automatically.')}
        </p>
        {!plan.ready && plan.error && <button type="button" onClick={plan.retryLoading}
          className="cursor-pointer rounded border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--ink)]">Retry</button>}
      </div>
      <section className="subject-section" aria-labelledby="selected-term">
        <div className="subject-heading">
          <h2 id="selected-term">{selectedTerm}</h2>
          <span>{visibleCourses.length}</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] items-stretch gap-3.5">
          {visibleCourses.map(([id, course]) => {
            const selected = selectedCourseIds.includes(id);
            const conflict = !selected && selectedCourses.some(
              ([, selectedCourse]) => coursesConflict(course, selectedCourse),
            );
            return (
              <CourseCard
                key={id}
                courseId={id}
                course={course}
                canEdit={isAdmin && !isRoleLoading}
                selected={selected}
                conflict={conflict}
                selectionDisabled={authLoading || !plan.ready}
                onToggle={() => plan.toggleCourse(id, courses)}
              />
            );
          })}
        </div>
      </section>
      {isPlanOpen && (
        <SchedulePopup courses={selectedCourses} onClose={() => setIsPlanOpen(false)} />
      )}
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={courseList} />
      <Route path="/courses/:courseId/edit" element={<CourseEditPage courses={courses} />} />
      <Route path="*" element={
        <section className="subject-list">
          <h2>Page not found</h2>
          <Link to="/" className="text-[var(--accent)] underline">Return to courses</Link>
        </section>
      } />
    </Routes>
  );
}
