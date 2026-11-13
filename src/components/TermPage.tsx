import { useRef, useState } from 'react';
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
  const [query, setQuery] = useState('');
  return <AccountTermPage key={user?.uid ?? 'guest'} courses={courses} uid={user?.uid ?? null}
    authLoading={isLoading} selectedTerm={selectedTerm} onSelectTerm={setSelectedTerm}
    query={query} onSearch={setQuery} />;
}

interface AccountTermPageProps extends TermPageProps {
  uid: string | null;
  authLoading: boolean;
  selectedTerm: Term;
  onSelectTerm: (term: Term) => void;
  query: string;
  onSearch: (query: string) => void;
}

function AccountTermPage({ courses, uid, authLoading, selectedTerm, onSelectTerm, query, onSearch }: AccountTermPageProps) {
  const { isAdmin, isRoleLoading } = useAuth();
  const plan = usePersonalPlan(uid);
  const selectedCourseIds = plan.selectedCourseIds.filter((id) => Object.hasOwn(courses, id));
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const keywords = query.toLowerCase().trim().replace(/\bcs(?=\d)/g, 'cs ').split(/\s+/).filter(Boolean);
  const termCourses = Object.entries(courses).filter(([, course]) => course.term === selectedTerm);
  const visibleCourses = termCourses.filter(([, course]) => {
    const searchableText = `cs ${course.number} ${course.title.toLowerCase()}`;
    return keywords.every((keyword) => searchableText.includes(keyword));
  });
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
        <div className="mb-6">
          <label htmlFor="course-search" className="mb-2 block text-sm font-semibold text-[var(--ink)]">
            Search {selectedTerm} courses
          </label>
          <div className="flex max-w-lg gap-2">
            <input
              ref={searchRef}
              id="course-search"
              type="search"
              placeholder="Course number or title"
              value={query}
              onChange={(event) => onSearch(event.target.value)}
              className="min-w-0 flex-1 rounded-md border border-[var(--line)] bg-white px-4 py-2.5 text-sm placeholder:text-[var(--muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  searchRef.current?.focus();
                  onSearch('');
                }}
                className="cursor-pointer rounded-md border border-[var(--line)] bg-white px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
        <div className="subject-heading">
          <h2 id="selected-term">{selectedTerm}</h2>
          <span role="status">
            {keywords.length > 0
              ? `${visibleCourses.length} of ${termCourses.length} courses`
              : `${termCourses.length} ${termCourses.length === 1 ? 'course' : 'courses'}`}
          </span>
        </div>
        {visibleCourses.length === 0 && (
          <p className="m-0 rounded-md border border-[var(--line)] bg-white p-5 text-sm text-[var(--muted)]">
            {keywords.length ? 'No matching courses. Try a different course number or title.' : 'No courses are available for this term.'}
          </p>
        )}
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
        <SchedulePopup courses={selectedCourses} initialTerm={selectedTerm} onClose={() => setIsPlanOpen(false)} />
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
