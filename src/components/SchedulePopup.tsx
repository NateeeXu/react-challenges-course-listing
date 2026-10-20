import { useEffect, useRef } from 'react';
import type { Course } from './CourseCard';

interface SchedulePopupProps {
  courses: [string, Course][];
  onClose: () => void;
}

export function SchedulePopup({ courses, onClose }: SchedulePopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="course-plan-title"
      className="fixed inset-0 m-auto max-h-[85dvh] w-[92vw] max-w-2xl overflow-y-auto rounded-xl border border-[var(--line)] bg-[#f4f7f5] p-0 text-[var(--ink)] shadow-xl backdrop:bg-[#172f2a]/50 backdrop:backdrop-blur-sm"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
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
            onClick={onClose}
            className="cursor-pointer rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Close
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-md border border-[var(--line)] bg-white p-5">
            <p className="m-0 font-semibold">No courses selected yet.</p>
            <p className="mt-2 mb-0 text-sm leading-relaxed text-[var(--muted)]">
              Close this window and click a course card to add it to your plan.
              Click a selected card again to remove it.
            </p>
          </div>
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
