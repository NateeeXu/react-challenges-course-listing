import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { courseResolver, courseTerms, type Course, type CourseDraft } from '../types/course';

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
  const [draft, setDraft] = useState<CourseDraft>(course);
  const [touched, setTouched] = useState<Partial<Record<keyof Course, boolean>>>({});
  const { errors } = courseResolver(draft);
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const touch = (field: keyof Course) => setTouched((current) => ({ ...current, [field]: true }));
  const update = (field: keyof Course, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    touch(field);
  };
  const errorFor = (field: keyof Course) => touched[field] ? errors[field]?.message : undefined;

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
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setTouched({ title: true, term: true, number: true, meets: true });
          }}
          className="grid gap-6 px-6 py-7 sm:px-9"
        >
          <CourseTextField field="title" label="Course title" value={draft.title}
            error={errorFor('title')} onChange={update} onBlur={touch} />
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid content-start gap-2">
              <label htmlFor="course-term" className="text-sm font-semibold text-[var(--ink)]">Term</label>
              <select id="course-term" name="term" value={draft.term}
                onChange={(event) => update('term', event.target.value)} onBlur={() => touch('term')}
                aria-invalid={Boolean(errorFor('term'))}
                aria-describedby={errorFor('term') ? 'course-term-error' : undefined}
                className={fieldClassName(Boolean(errorFor('term')))}>
                <option value="">Choose a term</option>
                {courseTerms.map((term) => <option key={term} value={term}>{term}</option>)}
              </select>
              {errorFor('term') && <p id="course-term-error" role="status" className="m-0 text-sm text-[#9b3326]">{errorFor('term')}</p>}
            </div>
            <CourseTextField field="number" label="Course number" value={draft.number}
              error={errorFor('number')} help="For example: 213 or 213-2."
              onChange={update} onBlur={touch} />
          </div>
          <CourseTextField field="meets" label="Meeting times" value={draft.meets}
            error={errorFor('meets')} help="For example: MWF 9:00-9:50 or TuTh 14:00-15:20. Leave blank for TBA."
            onChange={update} onBlur={touch} />
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

const fieldClassName = (invalid: boolean) =>
  `w-full min-w-0 rounded-md border bg-[#fafbf9] px-3 py-3 text-base font-normal text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${
    invalid ? 'border-[#9b3326]' : 'border-[var(--line)]'
  }`;

interface CourseTextFieldProps {
  field: 'title' | 'number' | 'meets';
  label: string;
  value: string;
  error?: string;
  help?: string;
  onChange: (field: keyof Course, value: string) => void;
  onBlur: (field: keyof Course) => void;
}

const CourseTextField = ({ field, label, value, error, help, onChange, onBlur }: CourseTextFieldProps) => {
  const id = `course-${field}`;
  const description = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="grid content-start gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--ink)]">{label}</label>
      <input id={id} name={field} type="text" value={value}
        onChange={(event) => onChange(field, event.target.value)} onBlur={() => onBlur(field)}
        aria-invalid={Boolean(error)} aria-describedby={description}
        className={fieldClassName(Boolean(error))} />
      {help && <p id={`${id}-help`} className="m-0 text-xs leading-5 text-[var(--muted)]">{help}</p>}
      {error && <p id={`${id}-error`} role="status" className="m-0 text-sm text-[#9b3326]">{error}</p>}
    </div>
  );
};
