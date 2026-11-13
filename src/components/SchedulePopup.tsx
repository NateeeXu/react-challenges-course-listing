import { useEffect, useRef, useState } from 'react';
import type { Course } from './CourseCard';
import { terms, type Term } from './TermSelector';
import { WeeklyTimetable } from './WeeklyTimetable';

interface SchedulePopupProps {
  courses: [string, Course][];
  initialTerm: Term;
  onClose: () => void;
}

export function SchedulePopup({ courses, initialTerm, onClose }: SchedulePopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<'list' | 'week'>('list');
  const [term, setTerm] = useState(initialTerm);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const closePopup = () => {
    // Close while the dialog is still mounted so the browser restores focus.
    dialogRef.current?.close();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="course-plan-title"
      className={`fixed inset-0 m-auto max-h-[85dvh] w-[92vw] overflow-y-auto rounded-xl border border-[var(--line)] bg-[#f4f7f5] p-0 text-[var(--ink)] shadow-xl backdrop:bg-[#172f2a]/50 backdrop:backdrop-blur-sm ${view === 'week' ? 'max-w-5xl' : 'max-w-2xl'}`}
      onCancel={(event) => {
        event.preventDefault();
        closePopup();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closePopup();
      }}
    >
      <div className="p-5 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="course-plan-title" className="m-0 font-serif text-3xl">
              Course plan
            </h2>
            <p className="mt-2 mb-0 text-sm text-[var(--muted)]">
              {courses.length} {courses.length === 1 ? 'course' : 'courses'} selected
            </p>
          </div>
          <button
            type="button"
            onClick={closePopup}
            className="cursor-pointer rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Close
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Course plan view" className="inline-flex rounded-lg border border-[var(--line)] bg-white p-1">
            {(['list', 'week'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-semibold aria-pressed:bg-[var(--ink)] aria-pressed:text-white focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                {option === 'list' ? 'List' : 'Weekly timetable'}
              </button>
            ))}
          </div>
          {view === 'week' && (
            <label className="flex items-center gap-2 text-sm font-semibold">
              Timetable term
              <select
                value={term}
                onChange={(event) => {
                  const nextTerm = terms.find((option) => option === event.target.value);
                  if (nextTerm) setTerm(nextTerm);
                }}
                className="rounded-md border border-[var(--line)] bg-white px-3 py-1.5 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                {terms.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="rounded-md border border-[var(--line)] bg-white p-5">
            <p className="m-0 font-semibold">No courses selected yet.</p>
            <p className="mt-2 mb-0 text-sm leading-relaxed text-[var(--muted)]">
              Close this window and click a course card to add it to your plan.
              Click a selected card again to remove it.
            </p>
          </div>
        ) : view === 'week' ? (
          <WeeklyTimetable courses={courses} term={term} />
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0">
            {courses.map(([id, course]) => (
              <li key={id} className="rounded-md border border-[var(--line)] bg-white p-5">
                <p className="m-0 text-xs font-bold tracking-wider text-[var(--accent)]">
                  {course.term} · CS {course.number}
                </p>
                <h3 className="mt-2 mb-3 font-serif text-xl leading-snug">
                  {course.title}
                </h3>
                <p className="m-0 text-sm text-[var(--muted)]">
                  Meeting time: {course.meets || 'TBA'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  );
}
