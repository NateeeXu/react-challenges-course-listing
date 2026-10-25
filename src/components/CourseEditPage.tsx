import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { Course } from './CourseCard';

interface CourseEditPageProps {
  courses: Record<string, Course>;
}

export function CourseEditPage({ courses }: CourseEditPageProps) {
  const { courseId } = useParams();
  const course = courseId && Object.hasOwn(courses, courseId) ? courses[courseId] : undefined;

  if (!course) {
    return (
      <section className="subject-list">
        <h2>Course not found</h2>
        <p className="m-0 text-[var(--muted)]">This course is not in the current schedule.</p>
        <Link to="/" className="text-[var(--accent)] underline">Return to courses</Link>
      </section>
    );
  }

  // A different course gets a fresh draft, even when navigating between edit URLs.
  return <CourseForm key={courseId} course={course} />;
}

function CourseForm({ course }: { course: Course }) {
  const [title, setTitle] = useState(course.title);
  const [meets, setMeets] = useState(course.meets);
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="pt-9" aria-labelledby="edit-course-heading">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-[var(--line)] bg-white">
        <div className="border-b border-[var(--line)] px-6 py-6 sm:px-9">
          <p className="mb-2 text-xs font-bold tracking-wider text-[var(--accent)] uppercase">
            {course.term} · CS {course.number}
          </p>
          <h2 id="edit-course-heading" ref={headingRef} tabIndex={-1}
            className="m-0 font-serif text-4xl font-medium text-[var(--ink)] focus:outline-none">
            Edit course
          </h2>
          <p id="edit-course-note" className="mt-3 mb-0 text-sm leading-6 text-[var(--muted)]">
            Try editing the details below. Changes are not saved yet.
          </p>
        </div>
        <form
          aria-labelledby="edit-course-heading"
          aria-describedby="edit-course-note"
          onSubmit={(event) => event.preventDefault()}
          className="grid gap-6 px-6 py-7 sm:px-9"
        >
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]" htmlFor="course-title">
            Course title
            <input id="course-title" name="title" type="text" value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full min-w-0 rounded-md border border-[var(--line)] bg-[#fafbf9] px-3 py-3 text-base font-normal focus-visible:outline-2 focus-visible:outline-[var(--accent)]" />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[var(--ink)]" htmlFor="course-meets">
            Meeting times
            <input id="course-meets" name="meets" type="text" value={meets}
              aria-describedby="meeting-times-help"
              onChange={(event) => setMeets(event.target.value)}
              className="w-full min-w-0 rounded-md border border-[var(--line)] bg-[#fafbf9] px-3 py-3 text-base font-normal focus-visible:outline-2 focus-visible:outline-[var(--accent)]" />
          </label>
          <p id="meeting-times-help" className="-mt-4 mb-0 text-xs leading-5 text-[var(--muted)]">
            Use the schedule format, for example: MWF 9:00-9:50. Leave blank for TBA.
          </p>
          <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-5">
            <p className="m-0 text-xs text-[var(--muted)]">Cancel discards your edits.</p>
            <button type="button" onClick={() => navigate('/')}
              className="cursor-pointer rounded-full bg-[var(--ink)] px-6 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
