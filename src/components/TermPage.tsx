import { useRef, useState } from 'react';
import { Link, Route, Routes } from 'react-router';
import { CourseEditPage } from './CourseEditPage';
import { CourseNotePage } from './CourseNotePage';
import { CourseCard, type Course } from './CourseCard';
import { TermSelector, type Term } from './TermSelector';
import { SchedulePopup } from './SchedulePopup';
import { coursesConflict, meetingDays, parseMeeting } from '../utilities/time-conflicts';
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
  const [meetingDay, setMeetingDay] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const keywords = query.toLowerCase().trim().replace(/\bcs(?=\d)/g, 'cs ').split(/\s+/).filter(Boolean);
  const isFiltered = keywords.length > 0 || meetingDay !== '';
  const termCourses = Object.entries(courses).filter(([, course]) => course.term === selectedTerm);
  const visibleCourses = termCourses.filter(([, course]) => {
    const searchableText = `cs ${course.number} ${course.title.toLowerCase()}`;
    return keywords.every((keyword) => searchableText.includes(keyword)) &&
      (!meetingDay || parseMeeting(course.meets)?.days.includes(meetingDay));
  });
  const selectedCourses = Object.entries(courses).filter(
    ([id]) => selectedCourseIds.includes(id),
  );

  // Keep list state above the route switch so Cancel does not clear the plan.
  const courseList = (
    <div className="arcade-board">
      <div className="arcade-controlboard">
        <div className="arcade-controls">
          <TermSelector selectedTerm={selectedTerm} onSelect={onSelectTerm} />
          <div className="arcade-search">
            <label htmlFor="course-search">Search {selectedTerm} courses</label>
            <div className="arcade-search-field">
              <span className="arcade-search-icon" aria-hidden="true" />
              <input
                ref={searchRef}
                id="course-search"
                type="search"
                placeholder="Course number or title"
                value={query}
                onChange={(event) => onSearch(event.target.value)}
              />
              {query && (
                <button type="button" aria-label="Clear search" onClick={() => {
                  searchRef.current?.focus();
                  onSearch('');
                }}>
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </div>
          </div>
          <label className="arcade-day">
            <span>Meets on</span>
            <select value={meetingDay} onChange={(event) => setMeetingDay(event.target.value)}>
              <option value="">Any day</option>
              {Object.entries(meetingDays).map(([day, name]) => <option key={day} value={day}>{name}</option>)}
            </select>
          </label>
          <button type="button" aria-haspopup="dialog" onClick={() => setIsPlanOpen(true)} className="arcade-plan-button">
            Course plan <span aria-hidden="true">↗</span>
          </button>
        </div>
        <div className="arcade-plan-status">
          <p aria-live="polite" className="arcade-selected"><span aria-hidden="true" />{selectedCourseIds.length} selected</p>
          <p role={plan.error ? 'alert' : 'status'} className={plan.error ? 'arcade-error' : undefined}>
            {authLoading ? 'Checking sign-in…' : plan.error || (plan.status === 'guest'
              ? 'Guest selections are temporary.'
              : plan.status === 'loading' ? 'Loading your saved plan…'
                : plan.status === 'saving' ? 'Saving your plan…' : 'Your plan is saved automatically.')}
          </p>
          {!plan.ready && plan.error && <button type="button" onClick={plan.retryLoading}>Retry</button>}
        </div>
      </div>
      <section className="arcade-courses" aria-labelledby="selected-term">
        <div className="subject-heading">
          <h2 id="selected-term">{selectedTerm}</h2>
          <span role="status">
            {isFiltered
              ? `${visibleCourses.length} of ${termCourses.length} courses`
              : `${termCourses.length} ${termCourses.length === 1 ? 'course' : 'courses'}`}
          </span>
        </div>
        {visibleCourses.length === 0 && (
          <p className="arcade-empty">
            {isFiltered ? 'No matching courses. Try a different search or meeting day.' : 'No courses are available for this term.'}
          </p>
        )}
        <div className="arcade-keys">
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
                canTakeNotes={uid !== null && !authLoading}
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
      <Route path="/courses/:courseId/note" element={<CourseNotePage courses={courses} uid={uid} authLoading={authLoading} />} />
      <Route path="*" element={
        <section className="subject-list">
          <h2>Page not found</h2>
          <Link to="/" className="text-[var(--accent)] underline">Return to courses</Link>
        </section>
      } />
    </Routes>
  );
}
